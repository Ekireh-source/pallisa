# accounts/management/commands/import_permissions.py

import json
from django.core.management.base import BaseCommand
from accounts.models import PermissionCategory, Permission, Role  # <-- Import Role
from django.db import transaction
import os


class Command(BaseCommand):
    help = 'Import permissions and categories from accounts/resources/permissions.json'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        file_path = os.path.join('accounts', 'resources', 'permissions.json')

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"File not found: {file_path}"))
            return
        except json.JSONDecodeError as e:
            self.stderr.write(self.style.ERROR(f"JSON decode error: {e}"))
            return

        categories = data.get("permission_categories", [])

        for cat in categories:
            category_obj, created = PermissionCategory.objects.update_or_create(
                code=cat['code'],
                defaults={
                    'name': cat['name'],
                    'description': cat.get('description', ''),
                    'is_admin': cat.get('is_admin', False),
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created category: {category_obj.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Updated category: {category_obj.name}"))

            for perm in cat.get('permissions', []):
                perm_obj, perm_created = Permission.objects.update_or_create(
                    code=perm['code'],
                    defaults={
                        'name': perm['name'],
                        'description': perm.get('description', ''),
                        'category': category_obj,
                    }
                )
                if perm_created:
                    self.stdout.write(self.style.SUCCESS(f"  Added permission: {perm_obj.name}"))
                else:
                    self.stdout.write(self.style.WARNING(f"  Updated permission: {perm_obj.name}"))

        # 🔁 Sync SuperAdmin role with all permissions
        Role.create_superadmin_role()
        self.stdout.write(self.style.SUCCESS("Permissions import completed."))
        self.stdout.write(self.style.SUCCESS("SuperAdmin role updated with all permissions."))
        
        superadmin_role = Role.create_superadmin_role()
        superadmin_role.sync_users_permissions()
        self.stdout.write(self.style.SUCCESS("Synced SuperAdmin role permissions to users"))