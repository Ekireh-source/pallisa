from django.core.management.base import BaseCommand
from accounts.models import Permission


class Command(BaseCommand):
    help = 'Clean up duplicate permissions'

    def handle(self, *args, **options):
        self.stdout.write('Cleaning up duplicate permissions...')
        
        # Get all permissions
        all_permissions = Permission.objects.all()
        
        # Find duplicates by name
        seen_names = set()
        duplicates = []
        
        for permission in all_permissions:
            if permission.name in seen_names:
                duplicates.append(permission)
            else:
                seen_names.add(permission.name)
        
        # Delete duplicates
        if duplicates:
            self.stdout.write(f'Found {len(duplicates)} duplicate permissions:')
            for dup in duplicates:
                self.stdout.write(f'  - {dup.name} ({dup.code})')
                dup.delete()
            self.stdout.write('Deleted duplicate permissions')
        else:
            self.stdout.write('No duplicate permissions found')
        
        # Also check for duplicates by code
        seen_codes = set()
        code_duplicates = []
        
        for permission in Permission.objects.all():
            if permission.code in seen_codes:
                code_duplicates.append(permission)
            else:
                seen_codes.add(permission.code)
        
        # Delete code duplicates
        if code_duplicates:
            self.stdout.write(f'Found {len(code_duplicates)} permissions with duplicate codes:')
            for dup in code_duplicates:
                self.stdout.write(f'  - {dup.name} ({dup.code})')
                dup.delete()
            self.stdout.write('Deleted permissions with duplicate codes')
        else:
            self.stdout.write('No permissions with duplicate codes found')
        
        self.stdout.write(
            self.style.SUCCESS('Successfully cleaned up permissions')
        ) 