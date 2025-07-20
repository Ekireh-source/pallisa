from django.core.management.base import BaseCommand
from accounts.models import UserProfile


class Command(BaseCommand):
    help = 'List all users with their roles'

    def handle(self, *args, **options):
        self.stdout.write('Listing all users:')
        self.stdout.write('=' * 50)
        
        profiles = UserProfile.objects.all()
        
        if not profiles:
            self.stdout.write('No users found.')
            return
        
        for profile in profiles:
            role_name = profile.role.name if profile.role else 'No role'
            self.stdout.write(f'Email: {profile.user.email}')
            self.stdout.write(f'Name: {profile.first_name} {profile.last_name}')
            self.stdout.write(f'User Type: {profile.user_type}')
            self.stdout.write(f'Role: {role_name}')
            self.stdout.write(f'Is SuperAdmin: {profile.role.is_superadmin if profile.role else False}')
            self.stdout.write('-' * 30) 