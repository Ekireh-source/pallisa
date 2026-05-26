import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pallisa_api.settings")
django.setup()

from accounts.models import School as AccountSchool, Role, UserProfile
from schools.models import School as SchoolsSchool

print(f"Account Schools: {AccountSchool.objects.count()}")
print(f"Schools Schools: {SchoolsSchool.objects.count()}")

role = Role.objects.filter(name__icontains='teacher').first()
print(f"Teacher Role: {role}")
if role:
    print(f"Role School: {role.school}")

teacher_profiles = UserProfile.objects.filter(user_type='staff')
for p in teacher_profiles:
    print(f"Teacher: {p}, Role: {p.role}, Role School: {p.role.school if p.role else None}")

