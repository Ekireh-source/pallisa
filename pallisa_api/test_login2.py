import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pallisa_api.settings")
django.setup()

from accounts.models import CustomUser

user = CustomUser.objects.get(email='akoloscarbenjamin@gmail.com')
profile = user.profile
print(f"Profile User Type: {profile.user_type}")
print(f"Profile Role: {profile.role}")
if profile.role:
    print(f"Role School: {profile.role.school}")
    if profile.role.school:
        print(f"Role School Owner: {profile.role.school.owner}")
        if profile.role.school.owner:
            print(f"Role School Owner User: {profile.role.school.owner.user}")

