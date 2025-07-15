from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from accounts.models import CustomUser

def send_verification_email(user: CustomUser, otp):
    """
    Send verification email with OTP to user
    
    Args:
        user: CustomUser instance
        otp: One-time password to send
    """
    subject = 'Verify Your Email - OTP Code'
    
    try:
        # Get first name from profile if it exists, otherwise use default
        first_name = None
        try:
            if hasattr(user, 'profile') and user.profile:
                first_name = user.profile.first_name
        except Exception:
            # Profile doesn't exist or is not accessible
            pass
        
        # Render the HTML template
        html_message = render_to_string('emails/otp_verification.html', {
            'first_name': first_name,
            'otp': otp,
        })
        
        # Create HTML email message
        email_message = EmailMessage(
            subject=subject,
            body=html_message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com'),
            to=[user.email]
        )
        
        # Set content type to HTML
        email_message.content_subtype = 'html'
        
        # Send the email
        email_message.send(fail_silently=False)
        
        print(f"OTP verification email sent successfully to {user.email}")
        
    except Exception as e:
        print(f"Error sending OTP email to {user.email}: {str(e)}")
        raise