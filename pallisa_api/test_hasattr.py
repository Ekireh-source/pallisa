import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pallisa_api.settings")
django.setup()

from accounts.models import UserProfile
profile = UserProfile.objects.filter(user_type='staff').first()
# Assume this profile has NO teacher_profile
from members.models import Teacher
Teacher.objects.filter(user_profile=profile).delete()

try:
    has_teacher = hasattr(profile, 'teacher_profile')
    print(f"hasattr worked: {has_teacher}")
except Exception as e:
    print(f"hasattr crashed: {type(e)} - {e}")
