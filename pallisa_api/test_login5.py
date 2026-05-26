import os
import django
from django.test import Client

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pallisa_api.settings")
django.setup()

from accounts.models import CustomUser
CustomUser.objects.all().update(email_verified=True)

c = Client()
teacher = CustomUser.objects.filter(is_superuser=False, profile__user_type='staff').first()
print(f"Teacher: {teacher.email}")

response = c.post('/api/accounts/login/', {'email': teacher.email, 'password': 'password123'})
print(response.status_code)
print(response.content)

