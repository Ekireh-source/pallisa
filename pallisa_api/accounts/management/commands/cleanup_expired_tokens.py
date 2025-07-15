from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import PasswordResetToken, EmailVerificationToken

class Command(BaseCommand):
    help = 'Clean up expired password reset and email verification tokens'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Delete tokens older than this many days (default: 7)',
        )

    def handle(self, *args, **options):
        days = options['days']
        cutoff_time = timezone.now() - timezone.timedelta(days=days)
        
        # Clean up expired password reset tokens
        expired_password_tokens = PasswordResetToken.objects.filter(
            expires_at__lt=timezone.now()
        )
        password_count = expired_password_tokens.count()
        expired_password_tokens.delete()
        
        # Clean up old password reset tokens (used or not)
        old_password_tokens = PasswordResetToken.objects.filter(
            created_at__lt=cutoff_time
        )
        old_password_count = old_password_tokens.count()
        old_password_tokens.delete()
        
        # Clean up old email verification tokens
        old_email_tokens = EmailVerificationToken.objects.filter(
            created_at__lt=cutoff_time
        )
        email_count = old_email_tokens.count()
        old_email_tokens.delete()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully cleaned up:\n'
                f'- {password_count} expired password reset tokens\n'
                f'- {old_password_count} old password reset tokens\n'
                f'- {email_count} old email verification tokens'
            )
        )