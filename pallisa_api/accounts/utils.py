from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.crypto import get_random_string
from accounts.models import CustomUser
from accounts.tasks.emails import send_html_email_task

def generate_password(length=8):
    """
    Generate a random alphanumeric password
    """
    return get_random_string(length, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')

def send_html_email(subject, template_name, context, recipient_list):
    """
    Generic function to send HTML emails (Synchronous fallback)
    """
    try:
        html_message = render_to_string(template_name, context)
        email_message = EmailMessage(
            subject=subject,
            body=html_message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com'),
            to=recipient_list
        )
        email_message.content_subtype = 'html'
        email_message.send(fail_silently=False)
        return True
    except Exception as e:
        print(f"Error sending email '{subject}' to {recipient_list}: {str(e)}")
        return False

def send_verification_email(user: CustomUser, otp):
    """
    Send verification email with OTP to user
    """
    subject = 'Verify Your Email - OTP Code'
    
    first_name = None
    try:
        if hasattr(user, 'profile') and user.profile:
            first_name = user.profile.first_name
    except Exception:
        pass
        
    context = {
        'first_name': first_name,
        'otp': otp,
    }
    
    send_html_email_task.delay(subject, 'emails/otp_verification.html', context, [user.email])
    return True

def send_login_credentials(user, password, role_name=None):
    """
    Send login credentials to a newly created student or teacher
    """
    subject = 'Welcome to Our Platform - Your Login Credentials'
    
    # Determine username to display (email, employee_id, or student_id)
    username = user.email or getattr(user, 'employee_id', None) or getattr(user, 'student_id', None)
    
    # Get name from profile
    full_name = "User"
    try:
        profile = getattr(user, 'profile', None)
        if profile:
            full_name = f"{profile.first_name} {profile.last_name}"
    except Exception:
        pass
        
    context = {
        'full_name': full_name,
        'username': username,
        'password': password,
        'role_name': role_name or 'User',
        'login_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000') + '/login'
    }
    
    send_html_email_task.delay(subject, 'emails/login_credentials.html', context, [user.email])
    return True