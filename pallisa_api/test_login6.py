import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pallisa_api.settings")
django.setup()

from accounts.models import Role

for r in Role.objects.all():
    print(r.id, r.name, r.school_id)

