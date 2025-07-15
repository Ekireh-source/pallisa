from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from accounts.utils import send_verification_email
from accounts.models import CustomUser
import os


class Command(BaseCommand):
    help = 'Test email sending functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--to',
            type=str,
            help='Email address to send test email to',
            required=True
        )
        parser.add_argument(
            '--type',
            type=str,
            choices=['simple', 'otp', 'both'],
            default='both',
            help='Type of email test to run'
        )

    def handle(self, *args, **options):
        recipient_email = options['to']
        test_type = options['type']
        
        self.stdout.write(f"Testing email sending to: {recipient_email}")
        self.stdout.write(f"Email backend: {settings.EMAIL_BACKEND}")
        
        if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
            self.stdout.write(
                self.style.WARNING(
                    "Using console backend - emails will be printed to console"
                )
            )
        else:
            self.stdout.write(f"SMTP Host: {settings.EMAIL_HOST}")
            self.stdout.write(f"SMTP Port: {settings.EMAIL_PORT}")
            self.stdout.write(f"From Email: {settings.DEFAULT_FROM_EMAIL}")
        
        success_count = 0
        total_tests = 0
        
        # Test 1: Simple email
        if test_type in ['simple', 'both']:
            total_tests += 1
            self.stdout.write("\n" + "="*50)
            self.stdout.write("Testing simple email sending...")
            
            try:
                send_mail(
                    subject='Test Email from Pallisa API',
                    message='This is a test email to verify email configuration is working correctly.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient_email],
                    fail_silently=False,
                )
                self.stdout.write(
                    self.style.SUCCESS("✅ Simple email sent successfully!")
                )
                success_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"❌ Failed to send simple email: {str(e)}")
                )
        
        # Test 2: OTP verification email
        if test_type in ['otp', 'both']:
            total_tests += 1
            self.stdout.write("\n" + "="*50)
            self.stdout.write("Testing OTP verification email...")
            
            try:
                # Create a temporary user for testing
                test_user, created = CustomUser.objects.get_or_create(
                    email=recipient_email,
                    defaults={'email_verified': False}
                )
                
                # Create profile if user was created
                if created:
                    from accounts.models import UserProfile
                    UserProfile.objects.create(
                        user=test_user,
                        first_name='Test',
                        last_name='User',
                        user_type='student'
                    )
                
                # Test OTP email
                test_otp = '123456'
                send_verification_email(test_user, test_otp)
                
                self.stdout.write(
                    self.style.SUCCESS("✅ OTP verification email sent successfully!")
                )
                success_count += 1
                
                # Clean up test user if we created it
                if created:
                    test_user.delete()
                    self.stdout.write("Test user cleaned up")
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"❌ Failed to send OTP email: {str(e)}")
                )
        
        # Summary
        self.stdout.write("\n" + "="*50)
        self.stdout.write("EMAIL TEST SUMMARY")
        self.stdout.write("="*50)
        self.stdout.write(f"Total tests: {total_tests}")
        self.stdout.write(f"Successful: {success_count}")
        self.stdout.write(f"Failed: {total_tests - success_count}")
        
        if success_count == total_tests:
            self.stdout.write(
                self.style.SUCCESS("🎉 All email tests passed!")
            )
        else:
            self.stdout.write(
                self.style.ERROR("❌ Some email tests failed!")
            )
            
        # Configuration tips
        self.stdout.write("\n" + "="*50)
        self.stdout.write("CONFIGURATION TIPS")
        self.stdout.write("="*50)
        
        if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
            self.stdout.write(
                "📋 To use SMTP email sending:\n"
                "1. Update EMAIL_BACKEND in .env to: django.core.mail.backends.smtp.EmailBackend\n"
                "2. Set your EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env\n"
                "3. For Gmail, use an App Password (not your regular password)\n"
                "4. For other providers, check their SMTP settings"
            )
        else:
            if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
                self.stdout.write(
                    self.style.WARNING(
                        "⚠️  EMAIL_HOST_USER or EMAIL_HOST_PASSWORD not set in .env file"
                    )
                )
            
            self.stdout.write(
                "📧 Current SMTP Configuration:\n"
                f"   Host: {settings.EMAIL_HOST}\n"
                f"   Port: {settings.EMAIL_PORT}\n"
                f"   TLS: {settings.EMAIL_USE_TLS}\n"
                f"   User: {settings.EMAIL_HOST_USER or 'NOT SET'}\n"
                f"   Password: {'SET' if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}"
            ) 