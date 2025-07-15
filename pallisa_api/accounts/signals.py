from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .models import Role

@receiver(post_migrate)
def create_superadmin_role_handler(sender, **kwargs):
    """
    Create superadmin role after migrations are complete.
    This ensures that the superadmin role is automatically created with all permissions.
    """
    # Only run this when the containing app is migrated
    if sender.name == 'accounts':  
        Role.create_superadmin_role()