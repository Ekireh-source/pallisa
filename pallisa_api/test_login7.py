import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pallisa_api.settings")
django.setup()

from accounts.models import Role, School as AccountSchool, UserProfile, CustomUser

# Create an account school if it doesn't exist
owner = CustomUser.objects.filter(is_superuser=True).first()
if owner and owner.profile:
    acc_school, created = AccountSchool.objects.get_or_create(name="Test School", owner=owner.profile)
    
    role = Role.objects.filter(name='teacher').first()
    if role:
        role.school = acc_school
        role.save()
        
    teacher_profile = UserProfile.objects.filter(user_type='staff').first()
    if teacher_profile:
        teacher_profile.role = role
        teacher_profile.save()
        
        try:
            print(f"Teacher Profile School: {teacher_profile.school}")
        except Exception as e:
            print(f"Error: {e}")
