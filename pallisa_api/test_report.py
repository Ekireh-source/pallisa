import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pallisa_api.settings')
django.setup()
from reports.views import ReportCardViewSet
from members.models import Student
from reports.models import ReportCard
student = Student.objects.get(id=6)
class_obj = student.current_stream.class_obj
report_card = ReportCard.objects.filter(student=student).first()
view = ReportCardViewSet()
res = view._compute_alevel_report(student, 1, 2, class_obj, student.current_stream, report_card)
import json
print(json.dumps(res, indent=2))
