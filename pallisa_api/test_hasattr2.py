import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pallisa_api.settings")
django.setup()

from accounts.models import CustomUser
user = CustomUser.objects.filter(is_superuser=True).first()
# Assume superuser has NO profile
from accounts.models import UserProfile
UserProfile.objects.filter(user=user).delete()

try:
    has_profile = hasattr(user, 'profile')
    print(f"hasattr profile worked: {has_profile}")
except Exception as e:
    print(f"hasattr profile crashed: {type(e)} - {e}")
