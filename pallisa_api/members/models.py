from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from accounts.models import CustomUser, UserProfile, School, Campus, Role
from expenses.models import AcademicYear
from django.core.exceptions import ValidationError


User = get_user_model()


def get_current_date():
    """Helper function to get current date for DateField defaults"""
    return timezone.now().date()


def generate_password(length=8):
    """Generate a random password"""
    return get_random_string(length, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')


def send_login_credentials(user, password, role_type):
    """Send login credentials to user via email"""
    try:
        # Get the full name from UserProfile, not User
        full_name = 'User'
        if hasattr(user, 'profile') and user.profile:
            full_name = user.profile.get_full_name()
        elif hasattr(user, 'first_name') and hasattr(user, 'last_name'):
            full_name = f"{user.first_name} {user.last_name}".strip() or 'User'
            
        subject = f'Your {role_type.title()} Account Credentials'
        message = f"""
Dear {full_name},

Your {role_type} account has been created successfully.

Login Details:
Email: {user.email}
Password: {password}

Please login and change your password immediately.

Best regards,
School Administration
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=True,
        )
    except Exception as e:
        # Log the error but don't fail the user creation
        print(f"Failed to send email to {user.email}: {str(e)}")


class Class(models.Model):
    """Model to represent class levels (formerly Grade)"""
    name = models.CharField(max_length=50)  # e.g., "Grade 1", "Primary 1", "S1"
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['is_active']),
        ]
        verbose_name_plural = "Classes"

    def __str__(self):
        return self.name


class Stream(models.Model):
    """Model to represent streams within a class (formerly Class)"""
    name = models.CharField(max_length=100)  # e.g., "Grade 1A", "P1 Red"
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='streams')
    class_teacher = models.ForeignKey('Teacher', on_delete=models.SET_NULL, null=True, blank=True, related_name='primary_streams')
    capacity = models.PositiveIntegerField(default=30)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['name', 'class_obj']
        verbose_name_plural = "Streams"
        indexes = [
            models.Index(fields=['class_obj', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} - {self.class_obj.name}"

    @property
    def current_enrollment(self):
        return self.students.filter(is_active=True).count()

    @property
    def available_spots(self):
        return max(0, self.capacity - self.current_enrollment)


class Student(models.Model):
    """Model to represent student-specific information"""
    user_profile = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=20, unique=True, db_index=True)
    admission_number = models.CharField(max_length=50, blank=True, null=True)
    admission_date = models.DateField(default=get_current_date)
    current_stream = models.ForeignKey(Stream, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    
    # Academic information
    previous_school = models.CharField(max_length=200, blank=True, null=True)
    special_needs = models.TextField(blank=True, null=True)
    medical_conditions = models.TextField(blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    
    # Status
    enrollment_status = models.CharField(
        max_length=20,
        choices=[
            ('enrolled', 'Enrolled'),
            ('transferred', 'Transferred'),
            ('graduated', 'Graduated'),
            ('dropped', 'Dropped Out'),
            ('suspended', 'Suspended'),
        ],
        default='enrolled'
    )
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['student_id']),
            models.Index(fields=['current_stream', 'is_active']),
            models.Index(fields=['enrollment_status']),
            models.Index(fields=['admission_date']),
        ]

    def __str__(self):
        return f"{self.student_id} - {self.user_profile.get_full_name()}"

    def save(self, *args, **kwargs):
        # Auto-generate student_id if not provided
        if not self.student_id:
            # Check if the user already has a student_id set
            if self.user_profile and self.user_profile.user and self.user_profile.user.student_id:
                # Use the user's student_id
                self.student_id = self.user_profile.user.student_id
            else:
                # Auto-generate student_id
                school = self.user_profile.role.school if self.user_profile and self.user_profile.role else None
                if school:
                    year = timezone.now().year
                    school_code = school.name[:3].upper()
                    
                    # Use transaction-safe ID generation with row-level locking
                    with transaction.atomic():
                        # Lock the existing students to prevent race conditions
                        existing_students = Student.objects.select_for_update().filter(
                            student_id__startswith=f"{school_code}{year}"
                        ).order_by('-student_id')
                        
                        if existing_students.exists():
                            # Extract the number from the last student_id and increment
                            last_student_id = existing_students.first().student_id
                            try:
                                # Extract the numeric part (last 4 digits)
                                last_number = int(last_student_id[-4:])
                                new_number = last_number + 1
                            except (ValueError, IndexError):
                                # If we can't parse the number, start from 1
                                new_number = 1
                        else:
                            # First student for this school and year
                            new_number = 1
                        
                        # Generate the new student_id with zero-padding
                        self.student_id = f"{school_code}{year}{new_number:04d}"
                        
                        # Final check for uniqueness within the same transaction
                        while Student.objects.filter(student_id=self.student_id).exists():
                            new_number += 1
                            self.student_id = f"{school_code}{year}{new_number:04d}"
                            if new_number > 9999:  # Prevent infinite loop
                                raise ValidationError("Unable to generate unique student ID - too many students for this year")
        
        # Ensure user_profile has student user_type
        if self.user_profile and self.user_profile.user_type != 'student':
            self.user_profile.user_type = 'student'
            self.user_profile.save()
        
        super().save(*args, **kwargs)

    @property
    def age(self):
        if self.user_profile.dob:
            today = timezone.now().date()
            return today.year - self.user_profile.dob.year - ((today.month, today.day) < (self.user_profile.dob.month, self.user_profile.dob.day))
        return None

    @property
    def full_name(self):
        return self.user_profile.get_full_name()


class Teacher(models.Model):
    """Model to represent teacher-specific information"""
    user_profile = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name='teacher_profile')
    employee_id = models.CharField(max_length=20, unique=True, db_index=True)
    hire_date = models.DateField(default=get_current_date)
    
    # Professional information
    qualification = models.CharField(max_length=200, blank=True, null=True)
    specialization = models.CharField(max_length=200, blank=True, null=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    previous_experience = models.TextField(blank=True, null=True)
    
    # Employment details
    employment_type = models.CharField(
        max_length=20,
        choices=[
            ('full_time', 'Full Time'),
            ('part_time', 'Part Time'),
            ('contract', 'Contract'),
            ('substitute', 'Substitute'),
            ('volunteer', 'Volunteer'),
        ],
        default='full_time'
    )
    salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['employee_id']),
            models.Index(fields=['employment_type', 'is_active']),
            models.Index(fields=['hire_date']),
        ]

    def __str__(self):
        return f"{self.employee_id} - {self.user_profile.get_full_name()}"

    def save(self, *args, **kwargs):
        # Auto-generate employee_id if not provided
        if not self.employee_id:
            school = self.user_profile.role.school if self.user_profile and self.user_profile.role else None
            if school:
                year = timezone.now().year
                school_code = school.name[:3].upper()
                
                # Use transaction-safe ID generation with row-level locking
                with transaction.atomic():
                    # Lock the existing teachers to prevent race conditions
                    existing_teachers = Teacher.objects.select_for_update().filter(
                        employee_id__startswith=f"T{school_code}{year}"
                    ).order_by('-employee_id')
                    
                    if existing_teachers.exists():
                        # Extract the number from the last employee_id and increment
                        last_employee_id = existing_teachers.first().employee_id
                        try:
                            # Extract the numeric part (last 3 digits)
                            last_number = int(last_employee_id[-3:])
                            new_number = last_number + 1
                        except (ValueError, IndexError):
                            # If we can't parse the number, start from 1
                            new_number = 1
                    else:
                        # First teacher for this school and year
                        new_number = 1
                    
                    # Generate the new employee_id with zero-padding
                    self.employee_id = f"T{school_code}{year}{new_number:03d}"
                    
                    # Final check for uniqueness within the same transaction
                    while Teacher.objects.filter(employee_id=self.employee_id).exists():
                        new_number += 1
                        self.employee_id = f"T{school_code}{year}{new_number:03d}"
                        if new_number > 999:  # Prevent infinite loop
                            raise ValidationError("Unable to generate unique employee ID - too many teachers for this year")
        
        # Ensure user_profile has staff user_type
        if self.user_profile and self.user_profile.user_type not in ['staff', 'admin']:
            self.user_profile.user_type = 'staff'
            self.user_profile.save()
        
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return self.user_profile.get_full_name()

    @property
    def streams_taught(self):
        return Stream.objects.filter(class_teacher=self, is_active=True)


class Parent(models.Model):
    """Model to represent parent/guardian information"""
    user_profile = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name='parent_profile')
    parent_id = models.CharField(max_length=20, unique=True, db_index=True, null=True, blank=True)
    
    # Relationship information
    relationship_type = models.CharField(
        max_length=20,
        choices=[
            ('father', 'Father'),
            ('mother', 'Mother'),
            ('guardian', 'Guardian'),
            ('grandparent', 'Grandparent'),
            ('uncle', 'Uncle'),
            ('aunt', 'Aunt'),
            ('sibling', 'Sibling'),
            ('other', 'Other'),
        ],
        default='father'
    )
    
    # Contact and professional information
    occupation = models.CharField(max_length=200, blank=True, null=True)
    workplace = models.CharField(max_length=200, blank=True, null=True)
    work_phone = models.CharField(max_length=20, blank=True, null=True)
    home_address = models.TextField(blank=True, null=True)
    
    # Status
    is_primary_contact = models.BooleanField(default=True)
    is_emergency_contact = models.BooleanField(default=True)
    is_authorized_pickup = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['parent_id']),
            models.Index(fields=['relationship_type']),
            models.Index(fields=['is_primary_contact', 'is_active']),
        ]

    def __str__(self):
        return f"{self.parent_id} - {self.user_profile.get_full_name()} ({self.relationship_type})"

    def save(self, *args, **kwargs):
        # Auto-generate parent_id if not provided
        if not self.parent_id:
            school = self.user_profile.role.school if self.user_profile and self.user_profile.role else None
            if school:
                year = timezone.now().year
                school_code = school.name[:3].upper()
                
                # Use transaction-safe ID generation with row-level locking
                with transaction.atomic():
                    # Lock the existing parents to prevent race conditions
                    existing_parents = Parent.objects.select_for_update().filter(
                        parent_id__startswith=f"P{school_code}{year}"
                    ).order_by('-parent_id')
                    
                    if existing_parents.exists():
                        # Extract the number from the last parent_id and increment
                        last_parent_id = existing_parents.first().parent_id
                        try:
                            # Extract the numeric part (last 3 digits)
                            last_number = int(last_parent_id[-3:])
                            new_number = last_number + 1
                        except (ValueError, IndexError):
                            # If we can't parse the number, start from 1
                            new_number = 1
                    else:
                        # First parent for this school and year
                        new_number = 1
                    
                    # Generate the new parent_id with zero-padding
                    self.parent_id = f"P{school_code}{year}{new_number:03d}"
                    
                    # Final check for uniqueness within the same transaction
                    while Parent.objects.filter(parent_id=self.parent_id).exists():
                        new_number += 1
                        self.parent_id = f"P{school_code}{year}{new_number:03d}"
                        if new_number > 999:  # Prevent infinite loop
                            raise ValidationError("Unable to generate unique parent ID - too many parents for this year")
        
        # Ensure user_profile has parent user_type
        if self.user_profile and self.user_profile.user_type != 'parent':
            self.user_profile.user_type = 'parent'
            self.user_profile.save()
        
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return self.user_profile.get_full_name()

    @property
    def children(self):
        return Student.objects.filter(
            id__in=self.parent_student_relationships.values_list('student_id', flat=True),
            is_active=True
        )


class ParentStudentRelationship(models.Model):
    """Model to link parents with their children (students)"""
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='parent_student_relationships')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='parent_student_relationships')
    relationship_type = models.CharField(
        max_length=20,
        choices=[
            ('father', 'Father'),
            ('mother', 'Mother'),
            ('guardian', 'Guardian'),
            ('grandparent', 'Grandparent'),
            ('uncle', 'Uncle'),
            ('aunt', 'Aunt'),
            ('sibling', 'Sibling'),
            ('other', 'Other'),
        ]
    )
    is_primary = models.BooleanField(default=False)
    is_emergency_contact = models.BooleanField(default=True)
    is_authorized_pickup = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['parent', 'student']
        indexes = [
            models.Index(fields=['student', 'is_primary']),
            models.Index(fields=['parent']),
        ]

    def __str__(self):
        return f"{self.parent.user_profile.get_full_name()} -> {self.student.user_profile.get_full_name()} ({self.relationship_type})"


class StudentStreamHistory(models.Model):
    """Model to track student's stream history across academic years"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='stream_history')
    stream = models.ForeignKey(Stream, on_delete=models.CASCADE, related_name='student_history')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='student_enrollments')
    enrollment_date = models.DateField(default=get_current_date)
    graduation_date = models.DateField(blank=True, null=True)
    final_grade = models.CharField(max_length=10, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'academic_year']
        indexes = [
            models.Index(fields=['student', 'academic_year']),
            models.Index(fields=['stream', 'academic_year']),
            models.Index(fields=['is_active']),
        ]
        verbose_name_plural = "Student Stream Histories"

    def __str__(self):
        return f"{self.student.user_profile.get_full_name()} - {self.stream.name} ({self.academic_year.name})"


class Subject(models.Model):
    """Model to represent subjects taught in school"""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True, null=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='subjects')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['code', 'school']
        indexes = [
            models.Index(fields=['school', 'is_active']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class TeacherSubjectAssignment(models.Model):
    """Model to assign teachers to subjects and streams"""
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='subject_assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='teacher_assignments')
    stream = models.ForeignKey(Stream, on_delete=models.CASCADE, related_name='subject_assignments')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='teacher_assignments')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['teacher', 'subject', 'stream', 'academic_year']
        indexes = [
            models.Index(fields=['teacher', 'academic_year']),
            models.Index(fields=['stream', 'academic_year']),
            models.Index(fields=['subject', 'is_active']),
        ]

    def __str__(self):
        return f"{self.teacher.user_profile.get_full_name()} - {self.subject.name} - {self.stream.name}"
