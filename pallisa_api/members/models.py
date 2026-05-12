from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from accounts.models import CustomUser, UserProfile, Role
from schools.models import School, Campus
from expenses.models import AcademicYear, Term
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
    campus = models.ForeignKey(Campus, on_delete=models.CASCADE, related_name='classes')
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


def generate_student_id(school):
    """Generate a unique student ID based on school and year"""
    if not school:
        return None
        
    year = timezone.now().year
    school_code = school.name[:3].upper()
    
    # Get the highest existing student_id for this school and year
    # We use Student.objects here which is fine as it's defined in this file
    existing_students = Student.objects.filter(
        student_id__startswith=f"{school_code}{year}"
    ).exclude(student_id='')
    
    max_number = 0
    if existing_students.exists():
        for student in existing_students:
            try:
                # Extract the numeric part (last 4 digits)
                student_id = student.student_id
                if len(student_id) >= 4:
                    number_part = student_id[-4:]
                    number = int(number_part)
                    max_number = max(max_number, number)
            except (ValueError, IndexError):
                continue
        
        new_number = max_number + 1
    else:
        new_number = 1
    
    # Generate the new student_id with zero-padding
    student_id = f"{school_code}{year}{new_number:04d}"
    
    # Check for uniqueness and increment if needed
    while Student.objects.filter(student_id=student_id).exists():
        new_number += 1
        student_id = f"{school_code}{year}{new_number:04d}"
        if new_number > 9999:
            raise ValidationError("Unable to generate unique student ID - too many students for this year")
            
    return student_id


class Student(models.Model):
    """Model to represent student-specific information"""
    user_profile = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=20, unique=True, db_index=True, null=True, blank=True)
    campus = models.ForeignKey(Campus, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
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
                if not school and self.campus:
                    school = self.campus.school
                
                if school:
                    self.student_id = generate_student_id(school)
        
        # Auto-generate admission_number if not provided
        if not self.admission_number:
            try:
                # Get current academic year and term
                current_academic_year = AcademicYear.objects.filter(is_current=True).first()
                current_term = Term.objects.filter(is_current=True).first()
                
                if current_academic_year:
                    # Extract year from academic year (e.g., "2024/2025" -> "2024")
                    year = current_academic_year.name.split('/')[0]
                    term_code = ""
                    
                    if current_term:
                        # Extract term number (e.g., "Term 1" -> "1")
                        term_name = current_term.name.lower()
                        if 'term' in term_name:
                            term_code = term_name.replace('term', '').strip()
                        elif 'semester' in term_name:
                            term_code = term_name.replace('semester', '').strip()
                        else:
                            term_code = "1"  # Default to 1 if can't parse
                    else:
                        term_code = "1"  # Default to 1 if no current term
                    
                    # Get current time components
                    now = timezone.now()
                    month = f"{now.month:02d}"
                    day = f"{now.day:02d}"
                    hour = f"{now.hour:02d}"
                    minute = f"{now.minute:02d}"
                    
                    # Generate admission number: YYYY-T-MMDD-HHMM-XXXX
                    # Where XXXX is a sequential number for that day
                    base_admission = f"{year}-{term_code}-{month}{day}-{hour}{minute}"
                    
                    # Find the next sequential number for this base
                    existing_admissions = Student.objects.filter(
                        admission_number__startswith=base_admission
                    ).order_by('-admission_number')
                    
                    if existing_admissions.exists():
                        # Extract the sequential number from the last admission
                        last_admission = existing_admissions.first().admission_number
                        try:
                            # Extract the last 4 digits
                            last_seq = int(last_admission[-4:])
                            new_seq = last_seq + 1
                        except (ValueError, IndexError):
                            new_seq = 1
                    else:
                        new_seq = 1
                    
                    # Generate the admission number
                    self.admission_number = f"{base_admission}-{new_seq:04d}"
                    
                    # Check for uniqueness and increment if needed
                    while Student.objects.filter(admission_number=self.admission_number).exists():
                        new_seq += 1
                        self.admission_number = f"{base_admission}-{new_seq:04d}"
                        if new_seq > 9999:  # Prevent infinite loop
                            raise ValidationError("Unable to generate unique admission number - too many students for this time period")
            except Exception as e:
                # If there's any error in generation, create a simple fallback
                now = timezone.now()
                timestamp = now.strftime("%Y%m%d%H%M%S")
                self.admission_number = f"ADM{timestamp}"
        
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
    salary = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        help_text="Salary amount in Ugandan Shillings (UGX)"
    )
    
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
            # Try to get school from user profile's role
            school = None
            if self.user_profile and self.user_profile.role:
                school = self.user_profile.role.school
            
            # If no school from role, try to get from any available school
            if not school:
                from accounts.models import School
                school = School.objects.first()
            
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
            else:
                # Fallback: use timestamp-based ID if no school is available
                timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
                self.employee_id = f"T{timestamp}"
                
                # Ensure uniqueness
                while Teacher.objects.filter(employee_id=self.employee_id).exists():
                    timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
                    self.employee_id = f"T{timestamp}"
        
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


class NonStaffMember(models.Model):
    """Model to represent non-staff members with salary information"""
    user_profile = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name='non_staff_profile')
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
            ('temporary', 'Temporary'),
            ('volunteer', 'Volunteer'),
        ],
        default='full_time'
    )
    
    # Salary information - simple amount field
    salary = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        help_text="Salary amount in Ugandan Shillings (UGX)"
    )
    
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
        verbose_name_plural = "Non-Staff Members"

    def __str__(self):
        return f"{self.employee_id} - {self.user_profile.get_full_name()}"

    def _generate_employee_id(self):
        # Try to get school from user profile's role
        school = None
        if self.user_profile and self.user_profile.role:
            school = self.user_profile.role.school
        
        # If no school from role, try to get from any available school
        if not school:
            from accounts.models import School
            school = School.objects.first()
       
        if school:
            year = timezone.now().year
            timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
            return f"NS{school.name[:3].upper()}{year}{timestamp}"
        else:
            # Fallback: use timestamp-based ID if no school is available
            timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
            return f"NS{timestamp}"
        

    def save(self, *args, **kwargs):
        # Auto-generate employee_id if not provided
        if not self.employee_id:
            self.employee_id = self._generate_employee_id()
            
            # Ensure uniqueness
            while NonStaffMember.objects.filter(employee_id=self.employee_id).exists():
                # Add a small delay to ensure different timestamp
                import time
                time.sleep(0.001)
            self.employee_id = self._generate_employee_id()

        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return self.user_profile.get_full_name()


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


# ==================== SALARY MANAGEMENT MODELS ====================

class SalaryPeriod(models.Model):
    """Model to define salary periods"""
    
    name = models.CharField(max_length=100)  # e.g., "January 2024", "Term 1 2024"
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='salary_periods')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='salary_periods', null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    is_closed = models.BooleanField(default=False, help_text="Closed periods cannot be modified")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['name', 'academic_year']
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['academic_year', 'term']),
            models.Index(fields=['start_date', 'end_date']),
        ]

    def __str__(self):
        return f"{self.name} ({self.academic_year.name})"

    @property
    def duration_days(self):
        """Calculate the duration of the period in days"""
        return (self.end_date - self.start_date).days + 1

    def can_be_modified(self):
        """Check if the period can be modified"""
        return not self.is_closed

    def clean(self):
        """Validate that only one period can be active at a time"""
        if self.is_active:
            # Check if there are other active periods (excluding this one if it's being updated)
            other_active_periods = SalaryPeriod.objects.filter(is_active=True)
            if self.pk:  # If this is an update, exclude this instance
                other_active_periods = other_active_periods.exclude(pk=self.pk)
            
            if other_active_periods.exists():
                raise ValidationError("Only one salary period can be active at a time. Please deactivate other active periods first.")

    def save(self, *args, **kwargs):
        """Override save to handle active period logic"""
        self.clean()
        
        # If this period is being set as active, deactivate all other periods
        if self.is_active:
            SalaryPeriod.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        
        super().save(*args, **kwargs)

    @classmethod
    def activate_period(cls, period_id):
        """Activate a specific period and deactivate all others"""
        try:
            period = cls.objects.get(pk=period_id)
            # Deactivate all periods first
            cls.objects.all().update(is_active=False)
            # Activate the specified period
            period.is_active = True
            period.save()
            return period
        except cls.DoesNotExist:
            raise ValidationError(f"Salary period with ID {period_id} does not exist.")


class SalaryAllowance(models.Model):
    """Model to define different types of salary allowances"""
    ALLOWANCE_TYPE_CHOICES = [
        ('housing', 'Housing Allowance'),
        ('transport', 'Transport Allowance'),
        ('medical', 'Medical Allowance'),
        ('responsibility', 'Responsibility Allowance'),
        ('overtime', 'Overtime Allowance'),
        ('bonus', 'Bonus'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=100)
    allowance_type = models.CharField(max_length=20, choices=ALLOWANCE_TYPE_CHOICES)
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_percentage = models.BooleanField(default=False, help_text="If True, amount is percentage of base salary")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['allowance_type', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_allowance_type_display()})"


class SalaryDeduction(models.Model):
    """Model to define different types of salary deductions"""
    DEDUCTION_TYPE_CHOICES = [
        ('tax', 'Income Tax'),
        ('nssf', 'NSSF'),
        ('nhif', 'NHIF'),
        ('loan', 'Loan Repayment'),
        ('advance', 'Salary Advance'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=100)
    deduction_type = models.CharField(max_length=20, choices=DEDUCTION_TYPE_CHOICES)
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_percentage = models.BooleanField(default=False, help_text="If True, amount is percentage of base salary")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['deduction_type', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_deduction_type_display()})"


class SalaryPayment(models.Model):
    """Model to track individual salary payments"""
    PAYMENT_METHOD_CHOICES = [
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('cheque', 'Cheque'),
        ('mobile_money', 'Mobile Money'),
        ('other', 'Other'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Staff member (can be either teacher or non-staff)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='salary_payments', null=True, blank=True)
    non_staff_member = models.ForeignKey(NonStaffMember, on_delete=models.CASCADE, related_name='salary_payments', null=True, blank=True)
    
    # Period and amounts
    salary_period = models.ForeignKey(SalaryPeriod, on_delete=models.CASCADE, related_name='payments')
    base_salary = models.DecimalField(max_digits=10, decimal_places=2)
    allowances = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment details
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='bank_transfer')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    transaction_reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    receipt_image = models.ImageField(upload_to='salary_receipts/', blank=True, null=True)
    
    # Processing information
    processed_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, related_name='processed_salary_payments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [
            ('teacher', 'salary_period'),
            ('non_staff_member', 'salary_period')
        ]
        ordering = ['-payment_date', '-created_at']
        indexes = [
            models.Index(fields=['payment_status']),
            models.Index(fields=['payment_date']),
            models.Index(fields=['teacher', 'salary_period']),
            models.Index(fields=['non_staff_member', 'salary_period']),
        ]

    def __str__(self):
        staff_name = self.get_staff_name()
        return f"{staff_name} - {self.salary_period.name} - {self.net_salary}"

    def clean(self):
        """Validate that either teacher or non_staff_member is set, but not both"""
        if not self.teacher and not self.non_staff_member:
            raise ValidationError("Either teacher or non-staff member must be specified")
        if self.teacher and self.non_staff_member:
            raise ValidationError("Cannot specify both teacher and non-staff member")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def get_staff_name(self):
        """Get the name of the staff member"""
        if self.teacher:
            return self.teacher.full_name
        elif self.non_staff_member:
            return self.non_staff_member.full_name
        return "Unknown"

    def get_staff_type(self):
        """Get the type of staff member"""
        if self.teacher:
            return "teacher"
        elif self.non_staff_member:
            return "non_staff"
        return None

    def calculate_net_salary(self):
        """Calculate net salary from base salary, allowances, and deductions"""
        total_allowances = self.allowances or 0
        total_deductions = self.deductions or 0
        self.net_salary = self.base_salary + total_allowances - total_deductions
        return self.net_salary


class SalaryPaymentDetail(models.Model):
    """Model to track individual allowances and deductions for each salary payment"""
    salary_payment = models.ForeignKey(SalaryPayment, on_delete=models.CASCADE, related_name='details')
    allowance = models.ForeignKey(SalaryAllowance, on_delete=models.CASCADE, related_name='payment_details', null=True, blank=True)
    deduction = models.ForeignKey(SalaryDeduction, on_delete=models.CASCADE, related_name='payment_details', null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['salary_payment']),
        ]

    def __str__(self):
        if self.allowance:
            return f"{self.salary_payment.get_staff_name()} - {self.allowance.name} - {self.amount}"
        elif self.deduction:
            return f"{self.salary_payment.get_staff_name()} - {self.deduction.name} - {self.amount}"
        return f"{self.salary_payment.get_staff_name()} - Detail - {self.amount}"

    def clean(self):
        """Validate that either allowance or deduction is set, but not both"""
        if not self.allowance and not self.deduction:
            raise ValidationError("Either allowance or deduction must be specified")
        if self.allowance and self.deduction:
            raise ValidationError("Cannot specify both allowance and deduction")


class SalarySummary(models.Model):
    """Model to track salary summaries for reporting and fee collection integration"""
    salary_period = models.OneToOneField(SalaryPeriod, on_delete=models.CASCADE, related_name='summary')
    
    # Totals
    total_base_salary = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_allowances = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_net_salary = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Staff counts
    total_staff = models.PositiveIntegerField(default=0)
    paid_staff = models.PositiveIntegerField(default=0)
    pending_staff = models.PositiveIntegerField(default=0)
    
    # Statistics
    average_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Integration with fee collection
    total_fee_collection = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    net_income = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    last_calculated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['salary_period']
        ordering = ['-salary_period__start_date']
        indexes = [
            models.Index(fields=['total_net_salary']),
            models.Index(fields=['payment_completion_rate']),
        ]

    def __str__(self):
        return f"Salary Summary - {self.salary_period.name}"

    def calculate_summary(self):
        """Calculate and update the salary summary"""
        from django.db.models import Sum, Count, Avg
        
        # Get all payments for this period
        payments = SalaryPayment.objects.filter(salary_period=self.salary_period)
        
        # Calculate totals
        totals = payments.aggregate(
            total_base=Sum('base_salary'),
            total_allowances=Sum('allowances'),
            total_deductions=Sum('deductions'),
            total_net=Sum('net_salary'),
            total_staff=Count('id'),
            paid_staff=Count('id', filter=models.Q(payment_status='completed')),
            avg_salary=Avg('net_salary')
        )
        
        # Update fields
        self.total_base_salary = totals['total_base'] or 0
        self.total_allowances = totals['total_allowances'] or 0
        self.total_deductions = totals['total_deductions'] or 0
        self.total_net_salary = totals['total_net'] or 0
        self.total_staff = totals['total_staff'] or 0
        self.paid_staff = totals['paid_staff'] or 0
        self.pending_staff = self.total_staff - self.paid_staff
        self.average_salary = totals['avg_salary'] or 0
        
        # Calculate completion rate
        if self.total_staff > 0:
            self.payment_completion_rate = (self.paid_staff / self.total_staff) * 100
        else:
            self.payment_completion_rate = 0
        
        # Calculate fee collection and net income
        self.calculate_fee_integration()
        
        self.save()

    def calculate_fee_integration(self):
        """Calculate fee collection and net income for this period"""
        from fees.models import TermFeeCollectionSummary
        
        # Get fee collection for this period
        if self.salary_period.term:
            # For termly periods, get term fee collection
            try:
                fee_summary = TermFeeCollectionSummary.objects.get(
                    academic_year=self.salary_period.academic_year,
                    term=self.salary_period.term
                )
                self.total_fee_collection = fee_summary.total_collected
            except TermFeeCollectionSummary.DoesNotExist:
                self.total_fee_collection = 0
        else:
            # For monthly periods, calculate from fee payments within the period
            from fees.models import FeePayment
            from django.db.models import Sum
            
            fee_payments = FeePayment.objects.filter(
                academic_year=self.salary_period.academic_year,
                payment_date__gte=self.salary_period.start_date,
                payment_date__lte=self.salary_period.end_date,
                payment_status='completed'
            )
            
            self.total_fee_collection = fee_payments.aggregate(
                total=Sum('amount_paid')
            )['total'] or 0
        
        # Calculate net income
        self.net_income = self.total_fee_collection - self.total_net_salary
