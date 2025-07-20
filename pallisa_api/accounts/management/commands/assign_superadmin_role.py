from django.core.management.base import BaseCommand
from accounts.models import UserProfile, Role


class Command(BaseCommand):
    help = 'Assign SuperAdmin role to school owner'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the school owner')

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            # Find the user profile by email
            user_profile = UserProfile.objects.get(user__email=email)
            
            # Find the SuperAdmin role
            superadmin_role = Role.objects.get(name='SuperAdmin')
            
            # Assign the role
            user_profile.role = superadmin_role
            user_profile.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully assigned SuperAdmin role to {email}')
            )
            
        except UserProfile.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User with email {email} not found')
            )
        except Role.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('SuperAdmin role not found. Please run create_default_roles first.')
            ) 