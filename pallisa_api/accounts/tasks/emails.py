from celery import shared_task
from django.core.mail import EmailMessage, send_mail
from django.template.loader import render_to_string
from django.conf import settings

@shared_task
def send_html_email_task(subject, template_name, context, recipient_list):
    """
    Celery task to send HTML emails asynchronously
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

@shared_task
def send_plain_email_task(subject, message, from_email, recipient_list, **kwargs):
    """
    Celery task to send plain text emails asynchronously
    """
    try:
        send_mail(
            subject,
            message,
            from_email,
            recipient_list,
            **kwargs
        )
        return True
    except Exception as e:
        print(f"Error sending email '{subject}' to {recipient_list}: {str(e)}")
        return False
