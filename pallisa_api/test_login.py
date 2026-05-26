import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pallisa_api.settings")
django.setup()

from accounts.models import CustomUser
from accounts.serializers import LoginSerializer
from rest_framework.test import APIRequestFactory
from accounts.auth_views import LoginView

factory = APIRequestFactory()

user = CustomUser.objects.filter(is_superuser=False).last()
if user:
    print(f"Testing with user: {user.email}")
    # We can't really log in without password, but let's just test `user.profile.school`
    print(f"Profile: {user.profile}")
    if user.profile:
        try:
            school = user.profile.school
            print(f"School: {school}")
        except Exception as e:
            print(f"Error getting school: {e}")
else:
    print("No users found")

