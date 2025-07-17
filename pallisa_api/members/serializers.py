from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from accounts.models import UserProfile, School, Campus, Role
from expenses.models import AcademicYear
from .models import (
    Class, Stream, Student, Teacher, Parent, ParentStudentRelationship,
    StudentStreamHistory, Subject, TeacherSubjectAssignment,
    generate_password, send_login_credentials, NonStaffMember
)

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile with basic info"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    user = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'first_name', 'last_name', 'other_name', 'full_name',
            'gender', 'dob', 'phone', 'profile_picture', 'user_type', 'user',
            'emergency_contact', 'emergency_phone', 'emergency_contact_address', 'emergency_contact_email'
        ]
        read_only_fields = ['id', 'full_name', 'user_type']
    
    def get_user(self, obj):
        """Return user object with email if user exists"""
        if obj.user:
            return {
                'id': obj.user.id,
                'email': obj.user.email,
                'email_verified': obj.user.email_verified,
                'is_active': obj.user.is_active,
                'date_joined': obj.user.date_joined.isoformat() if obj.user.date_joined else None,
            }
        return None


class SchoolSerializer(serializers.ModelSerializer):
    """Basic school serializer"""
    class Meta:
        model = School
        fields = ['id', 'name', 'address', 'phone', 'email']


class CampusSerializer(serializers.ModelSerializer):
    """Basic campus serializer"""
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        model = Campus
        fields = ['id', 'name', 'school', 'school_name', 'address', 'phone']


class AcademicYearSerializer(serializers.ModelSerializer):
    """Basic academic year serializer"""
    class Meta:
        model = AcademicYear
        fields = ['id', 'name', 'start_date', 'end_date', 'is_current', 'is_active']


class ClassSerializer(serializers.ModelSerializer):
    """Serializer for Class (grade levels)"""
    stream_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Class
        fields = [
            'id', 'name', 'description',
            'is_active', 'stream_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'stream_count']
    
    def get_stream_count(self, obj):
        return obj.streams.filter(is_active=True).count()


class SubjectSerializer(serializers.ModelSerializer):
    """Serializer for Subject"""
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        model = Subject
        fields = [
            'id', 'name', 'code', 'description', 'school', 'school_name',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student with complete user creation flow"""
    user_profile_data = UserProfileSerializer(source='user_profile', read_only=True)
    full_name = serializers.CharField(source='user_profile.get_full_name', read_only=True)
    email = serializers.CharField(source='user_profile.user.email', read_only=True)
    current_stream_name = serializers.CharField(source='current_stream.name', read_only=True)
    current_class_name = serializers.CharField(source='current_stream.class_obj.name', read_only=True)
    age = serializers.SerializerMethodField()
    
    # User creation fields (required when user_profile not provided)
    user_email = serializers.EmailField(write_only=True, required=False)
    user_student_id = serializers.CharField(max_length=100, write_only=True, required=False)
    
    # UserProfile creation fields
    user_first_name = serializers.CharField(max_length=100, write_only=True, required=False)
    user_last_name = serializers.CharField(max_length=100, write_only=True, required=False)
    user_other_name = serializers.CharField(max_length=100, write_only=True, required=False)
    user_gender = serializers.ChoiceField(
        choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], 
        write_only=True, required=False
    )
    user_dob = serializers.DateField(write_only=True, required=False)
    user_phone = serializers.CharField(max_length=20, write_only=True, required=False)
    user_emergency_contact = serializers.CharField(max_length=100, write_only=True, required=False)
    user_emergency_phone = serializers.CharField(max_length=20, write_only=True, required=False)
    user_emergency_contact_address = serializers.CharField(max_length=255, write_only=True, required=False)
    user_emergency_contact_email = serializers.EmailField(write_only=True, required=False)
    user_role_id = serializers.IntegerField(write_only=True, required=False)
    
    # Student specific fields
    previous_school = serializers.CharField(max_length=200, required=False, allow_blank=True)
    special_needs = serializers.CharField(required=False, allow_blank=True)
    medical_conditions = serializers.CharField(required=False, allow_blank=True)
    allergies = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'user_profile', 'user_profile_data', 'student_id', 'admission_number', 'admission_date',
            'current_stream', 'current_stream_name', 'current_class_name', 'previous_school',
            'special_needs', 'medical_conditions', 'allergies', 'enrollment_status',
            'is_active', 'full_name', 'email', 'age', 'created_at', 'updated_at',
            # User creation fields
            'user_email', 'user_student_id',
            # UserProfile creation fields
            'user_first_name', 'user_last_name', 'user_other_name', 'user_gender', 'user_dob',
            'user_phone', 'user_emergency_contact', 'user_emergency_phone', 
            'user_emergency_contact_address', 'user_emergency_contact_email', 'user_role_id'
        ]
        read_only_fields = ['id', 'student_id', 'created_at', 'updated_at', 'full_name', 'email', 'age']
        extra_kwargs = {
            'user_profile': {'required': False, 'allow_null': True}
        }
    
    def get_age(self, obj):
        return obj.age if hasattr(obj, 'age') else None
    
    def validate(self, data):
        """Validate that either user_profile is provided or user creation fields are provided"""
        if not data.get('user_profile'):
            if not data.get('user_email'):
                raise serializers.ValidationError({
                    'user_email': 'Email is required when creating a new user account.'
                })
            if not data.get('user_first_name'):
                raise serializers.ValidationError({
                    'user_first_name': 'First name is required when creating a new user account.'
                })
            if not data.get('user_last_name'):
                raise serializers.ValidationError({
                    'user_last_name': 'Last name is required when creating a new user account.'
                })
            
            # Check for student_id conflicts
            user_student_id = data.get('user_student_id')
            if user_student_id:
                # Check if this student_id already exists in User model
                if User.objects.filter(student_id=user_student_id).exists():
                    raise serializers.ValidationError({
                        'user_student_id': f'Student ID "{user_student_id}" is already in use by another user.'
                    })
                
                # Check if this student_id already exists in Student model
                from members.models import Student
                if Student.objects.filter(student_id=user_student_id).exists():
                    raise serializers.ValidationError({
                        'user_student_id': f'Student ID "{user_student_id}" is already in use by another student.'
                    })
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Create User → UserProfile → Student in proper hierarchy with atomicity"""
        # Extract all user and profile creation fields
        user_fields = {
            'user_email': validated_data.pop('user_email', None),
            'user_student_id': validated_data.pop('user_student_id', None),
        }
        
        profile_fields = {
            'user_first_name': validated_data.pop('user_first_name', None),
            'user_last_name': validated_data.pop('user_last_name', None),
            'user_other_name': validated_data.pop('user_other_name', None),
            'user_gender': validated_data.pop('user_gender', None),
            'user_dob': validated_data.pop('user_dob', None),
            'user_phone': validated_data.pop('user_phone', None),
            'user_emergency_contact': validated_data.pop('user_emergency_contact', None),
            'user_emergency_phone': validated_data.pop('user_emergency_phone', None),
            'user_emergency_contact_address': validated_data.pop('user_emergency_contact_address', None),
            'user_emergency_contact_email': validated_data.pop('user_emergency_contact_email', None),
            'user_role_id': validated_data.pop('user_role_id', None),
        }
        
        # If user_profile is not provided, create the entire hierarchy atomically
        if not validated_data.get('user_profile') and user_fields['user_email']:
            # Step 1: Create User
            generated_password = generate_password()
            user_data = {
                'email': user_fields['user_email'],
                'password': generated_password,
            }
            if user_fields['user_student_id']:
                user_data['student_id'] = user_fields['user_student_id']
            
            # Create user
            user = User.objects.create_user(**user_data)
            print(f"✓ Created User: {user.email} (ID: {user.id})")
            
            # Step 2: Create UserProfile
            # Get or create role
            role = None
            if profile_fields['user_role_id']:
                try:
                    role = Role.objects.get(id=profile_fields['user_role_id'])
                except Role.DoesNotExist:
                    pass
            
            if not role:
                role = Role.objects.filter(name__icontains='student').first()
            
            # Prepare profile data
            profile_data = {
                'user': user,
                'user_type': 'student',
                'first_name': profile_fields['user_first_name'] or '',
                'last_name': profile_fields['user_last_name'] or '',
                'role': role,
            }
            
            # Add optional profile fields
            optional_field_mappings = {
                'user_other_name': 'other_name',
                'user_gender': 'gender',
                'user_dob': 'dob',
                'user_phone': 'phone',
                'user_emergency_contact': 'emergency_contact',
                'user_emergency_phone': 'emergency_phone',
                'user_emergency_contact_address': 'emergency_contact_address',
                'user_emergency_contact_email': 'emergency_contact_email'
            }
            
            for field_key, model_field in optional_field_mappings.items():
                value = profile_fields.get(field_key)
                if value:
                    profile_data[model_field] = value
            
            # Create user profile
            user_profile = UserProfile.objects.create(**profile_data)
            print(f"✓ Created UserProfile: {user_profile.get_full_name()} (ID: {user_profile.id})")
            
            # Set the user_profile for student creation
            validated_data['user_profile'] = user_profile
            
            # Step 3: Create Student
            student = super().create(validated_data)
            print(f"✓ Created Student: {student.student_id} (ID: {student.id})")
            
            # Step 4: Send login credentials (outside the critical transaction path)
            try:
                send_login_credentials(user, generated_password, 'student')
                print(f"✓ Sent login credentials to {user.email}")
            except Exception as e:
                # Log error but don't fail the creation
                print(f"⚠ Failed to send email to {user.email}: {str(e)}")
            
            return student
        
        # If user_profile is provided, create student directly
        return super().create(validated_data)


class TeacherSerializer(serializers.ModelSerializer):
    """Serializer for Teacher with complete user creation flow"""
    user_profile_data = UserProfileSerializer(source='user_profile', read_only=True)
    full_name = serializers.CharField(source='user_profile.get_full_name', read_only=True)
    email = serializers.CharField(source='user_profile.user.email', read_only=True)
    school_name = serializers.CharField(source='user_profile.role.school.name', read_only=True)
    
    # User creation fields (required when user_profile not provided)
    user_email = serializers.EmailField(write_only=True, required=False)
    
    # UserProfile creation fields
    user_first_name = serializers.CharField(max_length=100, write_only=True, required=False)
    user_last_name = serializers.CharField(max_length=100, write_only=True, required=False)
    user_other_name = serializers.CharField(max_length=100, write_only=True, required=False)
    user_gender = serializers.ChoiceField(
        choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], 
        write_only=True, required=False
    )
    user_dob = serializers.DateField(write_only=True, required=False)
    user_phone = serializers.CharField(max_length=20, write_only=True, required=False)
    user_emergency_contact = serializers.CharField(max_length=100, write_only=True, required=False)
    user_emergency_phone = serializers.CharField(max_length=20, write_only=True, required=False)
    user_emergency_contact_address = serializers.CharField(max_length=255, write_only=True, required=False)
    user_emergency_contact_email = serializers.EmailField(write_only=True, required=False)
    user_role_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Teacher
        fields = [
            'id', 'user_profile', 'user_profile_data', 'employee_id', 'hire_date', 'qualification',
            'specialization', 'years_of_experience', 'previous_experience',
            'employment_type', 'salary', 'is_active', 'full_name', 'email',
            'school_name', 'created_at', 'updated_at',
            # User creation fields
            'user_email',
            # UserProfile creation fields
            'user_first_name', 'user_last_name', 'user_other_name', 'user_gender', 'user_dob',
            'user_phone', 'user_emergency_contact', 'user_emergency_phone', 
            'user_emergency_contact_address', 'user_emergency_contact_email', 'user_role_id'
        ]
        read_only_fields = ['id', 'employee_id', 'created_at', 'updated_at', 'full_name', 'email']
        extra_kwargs = {
            'user_profile': {'required': False, 'allow_null': True}
        }
    
    def validate(self, data):
        """Validate that either user_profile is provided or user creation fields are provided"""
        if not data.get('user_profile'):
            if not data.get('user_email'):
                raise serializers.ValidationError({
                    'user_email': 'Email is required when creating a new user account.'
                })
            if not data.get('user_first_name'):
                raise serializers.ValidationError({
                    'user_first_name': 'First name is required when creating a new user account.'
                })
            if not data.get('user_last_name'):
                raise serializers.ValidationError({
                    'user_last_name': 'Last name is required when creating a new user account.'
                })
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Create User → UserProfile → Teacher in proper hierarchy with atomicity"""
        # Extract all user and profile creation fields
        user_fields = {
            'user_email': validated_data.pop('user_email', None),
        }
        
        profile_fields = {
            'user_first_name': validated_data.pop('user_first_name', None),
            'user_last_name': validated_data.pop('user_last_name', None),
            'user_other_name': validated_data.pop('user_other_name', None),
            'user_gender': validated_data.pop('user_gender', None),
            'user_dob': validated_data.pop('user_dob', None),
            'user_phone': validated_data.pop('user_phone', None),
            'user_emergency_contact': validated_data.pop('user_emergency_contact', None),
            'user_emergency_phone': validated_data.pop('user_emergency_phone', None),
            'user_emergency_contact_address': validated_data.pop('user_emergency_contact_address', None),
            'user_emergency_contact_email': validated_data.pop('user_emergency_contact_email', None),
            'user_role_id': validated_data.pop('user_role_id', None),
        }
        
        # If user_profile is not provided, create the entire hierarchy atomically
        if not validated_data.get('user_profile') and user_fields['user_email']:
            # Step 1: Create User
            generated_password = generate_password()
            user = User.objects.create_user(
                email=user_fields['user_email'],
                password=generated_password
            )
            print(f"✓ Created User: {user.email} (ID: {user.id})")
            
            # Step 2: Create UserProfile
            # Get or create role
            role = None
            if profile_fields['user_role_id']:
                try:
                    role = Role.objects.get(id=profile_fields['user_role_id'])
                except Role.DoesNotExist:
                    pass
            
            if not role:
                role = Role.objects.filter(name__icontains='teacher').first()
            
            # Prepare profile data
            profile_data = {
                'user': user,
                'user_type': 'staff',
                'first_name': profile_fields['user_first_name'] or '',
                'last_name': profile_fields['user_last_name'] or '',
                'role': role,
            }
            
            # Add optional profile fields
            optional_field_mappings = {
                'user_other_name': 'other_name',
                'user_gender': 'gender',
                'user_dob': 'dob',
                'user_phone': 'phone',
                'user_emergency_contact': 'emergency_contact',
                'user_emergency_phone': 'emergency_phone',
                'user_emergency_contact_address': 'emergency_contact_address',
                'user_emergency_contact_email': 'emergency_contact_email'
            }
            
            for field_key, model_field in optional_field_mappings.items():
                value = profile_fields.get(field_key)
                if value:
                    profile_data[model_field] = value
            
            # Create user profile
            user_profile = UserProfile.objects.create(**profile_data)
            print(f"✓ Created UserProfile: {user_profile.get_full_name()} (ID: {user_profile.id})")
            
            # Set the user_profile for teacher creation
            validated_data['user_profile'] = user_profile
            
            # Step 3: Create Teacher
            teacher = super().create(validated_data)
            print(f"✓ Created Teacher: {teacher.employee_id} (ID: {teacher.id})")
            
            # Step 4: Send login credentials (outside the critical transaction path)
            try:
                send_login_credentials(user, generated_password, 'teacher')
                print(f"✓ Sent login credentials to {user.email}")
            except Exception as e:
                print(f"⚠ Failed to send email to {user.email}: {str(e)}")
            
            return teacher
        
        # If user_profile is provided, create teacher directly
        return super().create(validated_data)


class ParentSerializer(serializers.ModelSerializer):
    """Serializer for Parent with complete user creation flow"""
    user_profile_data = UserProfileSerializer(source='user_profile', read_only=True)
    full_name = serializers.CharField(source='user_profile.get_full_name', read_only=True)
    email = serializers.CharField(source='user_profile.user.email', read_only=True)
    children_count = serializers.SerializerMethodField()
    
    # User creation fields (required when user_profile not provided)
    user_email = serializers.EmailField(write_only=True, required=False)
    
    # UserProfile creation fields
    user_first_name = serializers.CharField(max_length=100, write_only=True, required=False)
    user_last_name = serializers.CharField(max_length=100, write_only=True, required=False)
    user_other_name = serializers.CharField(max_length=100, write_only=True, required=False)
    user_gender = serializers.ChoiceField(
        choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], 
        write_only=True, required=False
    )
    user_dob = serializers.DateField(write_only=True, required=False)
    user_phone = serializers.CharField(max_length=20, write_only=True, required=False)
    user_emergency_contact = serializers.CharField(max_length=100, write_only=True, required=False)
    user_emergency_phone = serializers.CharField(max_length=20, write_only=True, required=False)
    user_emergency_contact_address = serializers.CharField(max_length=255, write_only=True, required=False)
    user_emergency_contact_email = serializers.EmailField(write_only=True, required=False)
    user_role_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Parent
        fields = [
            'id', 'user_profile', 'user_profile_data', 'parent_id', 'relationship_type', 'occupation', 'workplace',
            'work_phone', 'home_address', 'is_primary_contact', 'is_emergency_contact',
            'is_authorized_pickup', 'is_active', 'full_name', 'email', 'children_count',
            'created_at', 'updated_at',
            # User creation fields
            'user_email',
            # UserProfile creation fields
            'user_first_name', 'user_last_name', 'user_other_name', 'user_gender', 'user_dob',
            'user_phone', 'user_emergency_contact', 'user_emergency_phone', 
            'user_emergency_contact_address', 'user_emergency_contact_email', 'user_role_id'
        ]
        read_only_fields = ['id', 'parent_id', 'created_at', 'updated_at', 'full_name', 'email', 'children_count']
        extra_kwargs = {
            'user_profile': {'required': False, 'allow_null': True}
        }
    
    def get_children_count(self, obj):
        return obj.parent_student_relationships.count()
    
    def validate(self, data):
        """Validate that either user_profile is provided or user creation fields are provided"""
        if not data.get('user_profile'):
            if not data.get('user_email'):
                raise serializers.ValidationError({
                    'user_email': 'Email is required when creating a new user account.'
                })
            if not data.get('user_first_name'):
                raise serializers.ValidationError({
                    'user_first_name': 'First name is required when creating a new user account.'
                })
            if not data.get('user_last_name'):
                raise serializers.ValidationError({
                    'user_last_name': 'Last name is required when creating a new user account.'
                })
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Create User → UserProfile → Parent in proper hierarchy with atomicity"""
        # Extract all user and profile creation fields
        user_fields = {
            'user_email': validated_data.pop('user_email', None),
        }
        
        profile_fields = {
            'user_first_name': validated_data.pop('user_first_name', None),
            'user_last_name': validated_data.pop('user_last_name', None),
            'user_other_name': validated_data.pop('user_other_name', None),
            'user_gender': validated_data.pop('user_gender', None),
            'user_dob': validated_data.pop('user_dob', None),
            'user_phone': validated_data.pop('user_phone', None),
            'user_emergency_contact': validated_data.pop('user_emergency_contact', None),
            'user_emergency_phone': validated_data.pop('user_emergency_phone', None),
            'user_emergency_contact_address': validated_data.pop('user_emergency_contact_address', None),
            'user_emergency_contact_email': validated_data.pop('user_emergency_contact_email', None),
            'user_role_id': validated_data.pop('user_role_id', None),
        }
        
        # If user_profile is not provided, create the entire hierarchy atomically
        if not validated_data.get('user_profile') and user_fields['user_email']:
            # Step 1: Create User
            generated_password = generate_password()
            user = User.objects.create_user(
                email=user_fields['user_email'],
                password=generated_password
            )
            print(f"✓ Created User: {user.email} (ID: {user.id})")
            
            # Step 2: Create UserProfile
            # Get or create role
            role = None
            if profile_fields['user_role_id']:
                try:
                    role = Role.objects.get(id=profile_fields['user_role_id'])
                except Role.DoesNotExist:
                    pass
            
            if not role:
                role = Role.objects.filter(name__icontains='parent').first()
            
            # Prepare profile data
            profile_data = {
                'user': user,
                'user_type': 'parent',
                'first_name': profile_fields['user_first_name'] or '',
                'last_name': profile_fields['user_last_name'] or '',
                'role': role,
            }
            
            # Add optional profile fields
            optional_field_mappings = {
                'user_other_name': 'other_name',
                'user_gender': 'gender',
                'user_dob': 'dob',
                'user_phone': 'phone',
                'user_emergency_contact': 'emergency_contact',
                'user_emergency_phone': 'emergency_phone',
                'user_emergency_contact_address': 'emergency_contact_address',
                'user_emergency_contact_email': 'emergency_contact_email'
            }
            
            for field_key, model_field in optional_field_mappings.items():
                value = profile_fields.get(field_key)
                if value:
                    profile_data[model_field] = value
            
            # Create user profile
            user_profile = UserProfile.objects.create(**profile_data)
            print(f"✓ Created UserProfile: {user_profile.get_full_name()} (ID: {user_profile.id})")
            
            # Set the user_profile for parent creation
            validated_data['user_profile'] = user_profile
            
            # Step 3: Create Parent
            parent = super().create(validated_data)
            print(f"✓ Created Parent: {parent.user_profile.get_full_name()} (ID: {parent.id})")
            
            # Step 4: Send login credentials (outside the critical transaction path)
            try:
                send_login_credentials(user, generated_password, 'parent')
                print(f"✓ Sent login credentials to {user.email}")
            except Exception as e:
                print(f"⚠ Failed to send email to {user.email}: {str(e)}")
            
            return parent
        
        # If user_profile is provided, create parent directly
        return super().create(validated_data)


class StreamSerializer(serializers.ModelSerializer):
    """Serializer for Stream"""
    class_obj_name = serializers.CharField(source='class_obj.name', read_only=True)
    class_teacher_name = serializers.CharField(source='class_teacher.user_profile.get_full_name', read_only=True)
    current_enrollment = serializers.SerializerMethodField()
    available_spots = serializers.SerializerMethodField()
    
    class Meta:
        model = Stream
        fields = [
            'id', 'name', 'class_obj', 'class_obj_name',
            'class_teacher', 'class_teacher_name',
            'capacity', 'current_enrollment', 'available_spots', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'current_enrollment', 'available_spots']
    
    def get_current_enrollment(self, obj):
        return obj.current_enrollment
    
    def get_available_spots(self, obj):
        return obj.available_spots


class ParentStudentRelationshipSerializer(serializers.ModelSerializer):
    """Serializer for Parent-Student Relationship"""
    parent_name = serializers.CharField(source='parent.user_profile.get_full_name', read_only=True)
    student_name = serializers.CharField(source='student.user_profile.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    
    class Meta:
        model = ParentStudentRelationship
        fields = [
            'id', 'parent', 'student', 'parent_name', 'student_name', 'student_id',
            'relationship_type', 'is_primary', 'is_emergency_contact',
            'is_authorized_pickup', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentStreamHistorySerializer(serializers.ModelSerializer):
    """Serializer for Student Stream History"""
    student_name = serializers.CharField(source='student.user_profile.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = StudentStreamHistory
        fields = [
            'id', 'student', 'student_name', 'student_id', 'stream', 'stream_name',
            'academic_year', 'academic_year_name', 'enrollment_date', 'graduation_date',
            'final_grade', 'remarks', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TeacherSubjectAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for Teacher Subject Assignment"""
    teacher_name = serializers.CharField(source='teacher.user_profile.get_full_name', read_only=True)
    teacher_employee_id = serializers.CharField(source='teacher.employee_id', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = TeacherSubjectAssignment
        fields = [
            'id', 'teacher', 'teacher_name', 'teacher_employee_id', 'subject',
            'subject_name', 'subject_code', 'stream', 'stream_name',
            'academic_year', 'academic_year_name', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NonStaffMemberSerializer(serializers.ModelSerializer):
    """Serializer for NonStaffMember with complete user creation flow"""
    user_profile_data = UserProfileSerializer(source='user_profile', read_only=True)
    full_name = serializers.CharField(source='user_profile.get_full_name', read_only=True)
    email = serializers.CharField(source='user_profile.user.email', read_only=True)
    school_name = serializers.CharField(source='user_profile.role.school.name', read_only=True)
    
    # User creation fields (required when user_profile not provided)
    user_email = serializers.EmailField(write_only=True, required=False)
    
    # UserProfile creation fields
    user_first_name = serializers.CharField(max_length=100, write_only=True, required=False)
    user_last_name = serializers.CharField(max_length=100, write_only=True, required=False)
    user_other_name = serializers.CharField(max_length=100, write_only=True, required=False)
    user_gender = serializers.ChoiceField(
        choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], 
        write_only=True, required=False
    )
    user_dob = serializers.DateField(write_only=True, required=False)
    user_phone = serializers.CharField(max_length=20, write_only=True, required=False)
    user_emergency_contact = serializers.CharField(max_length=100, write_only=True, required=False)
    user_emergency_phone = serializers.CharField(max_length=20, write_only=True, required=False)
    user_emergency_contact_address = serializers.CharField(max_length=255, write_only=True, required=False)
    user_emergency_contact_email = serializers.EmailField(write_only=True, required=False)
    user_role_id = serializers.IntegerField(write_only=True, required=False)
    salary = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True, label="Salary (UGX)"
    )

    class Meta:
        model = NonStaffMember
        fields = [
            'id', 'user_profile', 'user_profile_data', 'employee_id', 'hire_date', 'qualification',
            'specialization', 'years_of_experience', 'previous_experience',
            'employment_type', 'salary', 'is_active', 'full_name', 'email',
            'school_name', 'created_at', 'updated_at',
            # User creation fields
            'user_email',
            # UserProfile creation fields
            'user_first_name', 'user_last_name', 'user_other_name', 'user_gender', 'user_dob',
            'user_phone', 'user_emergency_contact', 'user_emergency_phone', 
            'user_emergency_contact_address', 'user_emergency_contact_email', 'user_role_id'
        ]
        read_only_fields = ['id', 'employee_id', 'created_at', 'updated_at', 'full_name', 'email']
        extra_kwargs = {
            'user_profile': {'required': False, 'allow_null': True}
        }

    def validate(self, data):
        """Validate that either user_profile is provided or user creation fields are provided"""
        # Only validate user creation fields if this is a new record (no instance)
        if not self.instance and not data.get('user_profile'):
            if not data.get('user_email'):
                raise serializers.ValidationError({
                    'user_email': 'Email is required when creating a new user account.'
                })
            if not data.get('user_first_name'):
                raise serializers.ValidationError({
                    'user_first_name': 'First name is required when creating a new user account.'
                })
            if not data.get('user_last_name'):
                raise serializers.ValidationError({
                    'user_last_name': 'Last name is required when creating a new user account.'
                })
        return data

    @transaction.atomic
    def create(self, validated_data):
        """Create User → UserProfile → NonStaffMember in proper hierarchy with atomicity"""
        # Extract all user and profile creation fields
        user_fields = {
            'user_email': validated_data.pop('user_email', None),
        }
        
        profile_fields = {
            'user_first_name': validated_data.pop('user_first_name', None),
            'user_last_name': validated_data.pop('user_last_name', None),
            'user_other_name': validated_data.pop('user_other_name', None),
            'user_gender': validated_data.pop('user_gender', None),
            'user_dob': validated_data.pop('user_dob', None),
            'user_phone': validated_data.pop('user_phone', None),
            'user_emergency_contact': validated_data.pop('user_emergency_contact', None),
            'user_emergency_phone': validated_data.pop('user_emergency_phone', None),
            'user_emergency_contact_address': validated_data.pop('user_emergency_contact_address', None),
            'user_emergency_contact_email': validated_data.pop('user_emergency_contact_email', None),
            'user_role_id': validated_data.pop('user_role_id', None),
        }
        
        # If user_profile is not provided, create the entire hierarchy atomically
        if not validated_data.get('user_profile') and user_fields['user_email']:
            # Step 1: Create User
            generated_password = generate_password()
            user = User.objects.create_user(
                email=user_fields['user_email'],
                password=generated_password
            )
            print(f"✓ Created User: {user.email} (ID: {user.id})")
            
            # Step 2: Create UserProfile
            # Get or create role
            role = None
            if profile_fields['user_role_id']:
                try:
                    role = Role.objects.get(id=profile_fields['user_role_id'])
                except Role.DoesNotExist:
                    pass
            
            if not role:
                role = Role.objects.filter(name__icontains='non-staff').first() or Role.objects.filter(name__icontains='staff').first()
            
            # Prepare profile data
            profile_data = {
                'user': user,
                'user_type': 'staff',
                'first_name': profile_fields['user_first_name'] or '',
                'last_name': profile_fields['user_last_name'] or '',
                'role': role,
            }
            
            # Add optional profile fields
            optional_field_mappings = {
                'user_other_name': 'other_name',
                'user_gender': 'gender',
                'user_dob': 'dob',
                'user_phone': 'phone',
                'user_emergency_contact': 'emergency_contact',
                'user_emergency_phone': 'emergency_phone',
                'user_emergency_contact_address': 'emergency_contact_address',
                'user_emergency_contact_email': 'emergency_contact_email'
            }
            
            for field_key, model_field in optional_field_mappings.items():
                value = profile_fields.get(field_key)
                if value:
                    profile_data[model_field] = value
            
            # Create user profile
            user_profile = UserProfile.objects.create(**profile_data)
            print(f"✓ Created UserProfile: {user_profile.get_full_name()} (ID: {user_profile.id})")
            
            # Set the user_profile for non-staff member creation
            validated_data['user_profile'] = user_profile
            
            # Step 3: Create NonStaffMember
            non_staff_member = super().create(validated_data)
            print(f"✓ Created NonStaffMember: {non_staff_member.employee_id} (ID: {non_staff_member.id})")
            
            # Step 4: Send login credentials (outside the critical transaction path)
            try:
                send_login_credentials(user, generated_password, 'non-staff')
                print(f"✓ Sent login credentials to {user.email}")
            except Exception as e:
                print(f"⚠ Failed to send email to {user.email}: {str(e)}")
            
            return non_staff_member
        
        # If user_profile is provided, create non-staff member directly
        return super().create(validated_data)


# Detailed serializers with nested relationships
class StudentDetailSerializer(StudentSerializer):
    """Detailed student serializer with parent relationships"""
    parents = serializers.SerializerMethodField()
    stream_history = StudentStreamHistorySerializer(many=True, read_only=True)
    
    class Meta(StudentSerializer.Meta):
        fields = StudentSerializer.Meta.fields + ['parents', 'stream_history']
    
    def get_parents(self, obj):
        relationships = obj.parent_student_relationships.select_related('parent__user_profile')
        return [{
            'parent_id': rel.parent.id,
            'parent_name': rel.parent.user_profile.get_full_name(),
            'relationship_type': rel.relationship_type,
            'is_primary': rel.is_primary,
            'is_emergency_contact': rel.is_emergency_contact,
        } for rel in relationships]


class TeacherDetailSerializer(TeacherSerializer):
    """Detailed teacher serializer with assignments"""
    subject_assignments = TeacherSubjectAssignmentSerializer(many=True, read_only=True)
    primary_streams = StreamSerializer(many=True, read_only=True)
    
    class Meta(TeacherSerializer.Meta):
        fields = TeacherSerializer.Meta.fields + ['subject_assignments', 'primary_streams']


class ParentDetailSerializer(ParentSerializer):
    """Detailed parent serializer with children"""
    children = serializers.SerializerMethodField()
    
    class Meta(ParentSerializer.Meta):
        fields = ParentSerializer.Meta.fields + ['children']
    
    def get_children(self, obj):
        relationships = obj.parent_student_relationships.select_related('student__user_profile')
        return [{
            'student_id': rel.student.id,
            'student_name': rel.student.user_profile.get_full_name(),
            'student_school_id': rel.student.student_id,
            'relationship_type': rel.relationship_type,
            'is_primary': rel.is_primary,
            'current_stream': rel.student.current_stream.name if rel.student.current_stream else None,
        } for rel in relationships]


class NonStaffMemberDetailSerializer(NonStaffMemberSerializer):
    """Detailed non-staff member serializer with additional context"""
    
    class Meta(NonStaffMemberSerializer.Meta):
        fields = NonStaffMemberSerializer.Meta.fields


class StreamDetailSerializer(StreamSerializer):
    """Detailed stream serializer with students and assignments"""
    students = StudentSerializer(many=True, read_only=True)
    subject_assignments = TeacherSubjectAssignmentSerializer(many=True, read_only=True)
    
    class Meta(StreamSerializer.Meta):
        fields = StreamSerializer.Meta.fields + ['students', 'subject_assignments'] 