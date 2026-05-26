from celery import shared_task
from members.serializers import StudentSerializer
from members.models import Student
from accounts.models import School, Role
from django.utils import timezone

@shared_task
def process_bulk_student_upload(students_data, school_id=None):
    created_students = []
    errors = []
    
    school = None
    if school_id:
        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            pass
            
    if not school:
        school = School.objects.first()
        
    if school:
        year = timezone.now().year
        school_code = school.name[:3].upper()
        
        # Get highest existing
        existing_students = Student.objects.filter(
            student_id__startswith=f"{school_code}{year}"
        ).exclude(student_id='')
        
        max_number = 0
        if existing_students.exists():
            for student in existing_students:
                try:
                    student_id = student.student_id
                    if len(student_id) >= 4:
                        number_part = student_id[-4:]
                        number = int(number_part)
                        max_number = max(max_number, number)
                except (ValueError, IndexError):
                    continue
        
        for student_data in students_data:
            if not student_data.get('student_id'):
                max_number += 1
                student_data['student_id'] = f"{school_code}{year}{max_number:04d}"
                
    for i, student_data in enumerate(students_data):
        serializer = StudentSerializer(data=student_data)
        if serializer.is_valid():
            try:
                student = serializer.save()
                created_students.append(student.id)
            except Exception as e:
                errors.append({f'student_{i}': f'Creation failed: {str(e)}'})
        else:
            errors.append({f'student_{i}': serializer.errors})
            
    return {
        'created_count': len(created_students),
        'failed_count': len(errors),
        'errors': errors
    }
