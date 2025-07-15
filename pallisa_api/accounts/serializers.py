from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import PermissionCategory, UserProfile, EmailVerificationToken, CustomUser, Document, Role, Permission, UserPermission, School, Campus
from .utils import send_verification_email



User = get_user_model()

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'email_verified', 'is_active', 'date_joined')
        read_only_fields = ('email_verified', 'is_active', 'date_joined')
        extra_kwargs = {'password': {'write_only': True}}
        
 
class PermissionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PermissionCategory
        fields = ['id', 'code', 'name', 'description', 'is_admin']

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'code', 'name', 'description', 'category']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['category'] = PermissionCategorySerializer(instance.category).data
        return rep 
        
class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(), many=True
    )

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions']

    def to_representation(self, instance):
        rep = super().to_representation(instance)

        # Include full permissions details
        rep['permissions'] = [
            {
                'id': perm.id,
                'code': perm.code,
                'name': perm.name,
                'description': perm.description
            }
            for perm in instance.permissions.all()
        ]

        return rep        


class UserProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer()
    profile_picture_url = serializers.SerializerMethodField()
    role = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        required=False,
        allow_null=True
    )
    

    class Meta:
        model = UserProfile
        fields = (
            'id', 'user', 'user_type', 'gender', 'first_name', 'last_name', 
            'other_name', 'dob', 'phone', 'profile_picture', 'profile_picture_url', 'role',
            'emergency_contact', 'emergency_phone', 'emergency_contact_address', 'emergency_contact_email'
        )
        
    def get_profile_picture_url(self, obj):
        """Return the URL of the profile picture if it exists."""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    def to_representation(self, instance):
        """Customize the output representation"""
        representation = super().to_representation(instance)
        
        # Show role name instead of ID in responses
        if instance.role:
            representation["role"] = RoleSerializer(instance.role).data
            
        return representation

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        
        # Create the CustomUser first
        user_serializer = CustomUserSerializer(data=user_data)
        if user_serializer.is_valid():
            user = user_serializer.save()
        else:
            raise serializers.ValidationError(user_serializer.errors)
        
        # Create UserProfile with the user and role
        user_profile = UserProfile.objects.create(user=user, **validated_data)
        
        return user_profile

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        
        # Update user data if provided
        if user_data:
            user_serializer = CustomUserSerializer(instance.user, data=user_data, partial=True)
            if user_serializer.is_valid():
                user_serializer.save()
            else:
                raise serializers.ValidationError(user_serializer.errors)
        
        # Update UserProfile
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance
    
    


class SchoolSerializer(serializers.ModelSerializer):
    """Serializer for School creation and management"""
    
    class Meta:
        model = School
        fields = ['id', 'name', 'address', 'phone', 'email', 'website', 'owner', 'created_at', 'is_active']
        read_only_fields = ['id', 'owner', 'created_at']


class CampusSerializer(serializers.ModelSerializer):
    """Serializer for Campus creation and management"""
    
    class Meta:
        model = Campus
        fields = ['id', 'name', 'school', 'address', 'phone', 'created_at', 'is_active']
        read_only_fields = ['id', 'school', 'created_at']


class SchoolCampusCreationSerializer(serializers.Serializer):
    """Serializer for creating school and campus during registration"""
    
    # School fields
    school_name = serializers.CharField(max_length=200)
    school_address = serializers.CharField(required=False, allow_blank=True)
    school_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    school_email = serializers.EmailField(required=False, allow_blank=True)
    school_website = serializers.URLField(required=False, allow_blank=True)
    
    # Campus fields
    campus_name = serializers.CharField(max_length=200)
    campus_address = serializers.CharField(required=False, allow_blank=True)
    campus_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_school_name(self, value):
        """Ensure school name is not empty"""
        if not value.strip():
            raise serializers.ValidationError("School name cannot be empty.")
        return value.strip()

    def validate_campus_name(self, value):
        """Ensure campus name is not empty"""
        if not value.strip():
            raise serializers.ValidationError("Campus name cannot be empty.")
        return value.strip()


class UserRegistrationSerializer(serializers.Serializer):
    # User fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    # Profile fields
    gender = serializers.ChoiceField(choices=UserProfile.GENDER_CHOICES, required=False, allow_null=True)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    other_name = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    dob = serializers.DateField(required=False, allow_null=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    emergency_contact = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    emergency_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    emergency_contact_address = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    emergency_contact_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    
    # School and Campus data
    school_data = SchoolCampusCreationSerializer(required=False)
    
    def validate_email(self, value):
        """Check that the email is not already in use"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate(self, data):
        """Custom validation for registration data"""
        # School data is required since only school owners can register
        if not data.get('school_data'):
            raise serializers.ValidationError({
                'school_data': 'School information is required for registration.'
            })
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        # Extract user fields and profile fields
        user_data = {
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'email_verified': False,  # User needs to verify email
            'is_active': True,  # User can log in but with limited access
        }
        
        # Extract school data if provided
        school_data = validated_data.pop('school_data', None)
        
        # Create user
        user = User.objects.create_user(**user_data)
        
        # Create profile linked to the user with hard-coded user_type as 'school_owner'
        profile_data = validated_data.copy()
        profile_data['user_type'] = 'school_owner'  # Hard-code user_type
        profile = UserProfile.objects.create(user=user, **profile_data)
        
        # Create school and campus if school_data is provided
        school = None
        campus = None
        if school_data:
            # Create school with the user as owner
            school = School.objects.create(
                name=school_data['school_name'],
                address=school_data.get('school_address', ''),
                phone=school_data.get('school_phone', ''),
                email=school_data.get('school_email', ''),
                website=school_data.get('school_website', ''),
                owner=profile
            )
            
            # Create campus for the school
            campus = Campus.objects.create(
                name=school_data['campus_name'],
                school=school,
                address=school_data.get('campus_address', ''),
                phone=school_data.get('campus_phone', '')
            )
            
            # Create setup steps tracker for the school
            from .models import SetupSteps
            SetupSteps.objects.create(
                school=school,
                basic_info_completed=True  # Since we just created basic info
            )
        
        # Generate OTP verification token
        token_obj, otp = EmailVerificationToken.create_for_user(user)
        
        # Send verification email with OTP
        send_verification_email(user, otp)
        
        # Store school and campus info on profile for easy access
        profile._created_school = school
        profile._created_campus = campus
        
        return profile


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    student_id = serializers.CharField(required=False)
    password = serializers.CharField(style={'input_type': 'password'})

    def validate(self, data):
        """
        Check that either email or student_id is provided
        """
        if not data.get('email') and not data.get('student_id'):
            raise serializers.ValidationError("Either email or student_id must be provided")
        return data


class LoginResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    User_profile = UserProfileSerializer()


class OTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)
    
    def validate_otp(self, value):
        """Check that OTP is numeric"""
        if not value.isdigit():
            raise serializers.ValidationError("OTP must contain only digits.")
        return value
    
    def validate(self, data):
        """Validate the OTP for the given email"""
        email = data.get('email')
        otp = data.get('otp')
        
        # Let the view handle the actual verification logic
        # This is just basic validation
        
        return data


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField() 
    
class DocumentSerializer(serializers.ModelSerializer):
    doc_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = ('id', 'profile', 'name', 'doc', 'doc_url', 'uploaded_at')
        
    def get_doc_url(self, obj):
        """Return the URL of the document if it exists."""
        if obj.doc:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.doc.url)
            return obj.doc.url
        return None  
    


class UserPermissionSerializer(serializers.ModelSerializer):
    code = serializers.CharField(source='permission.code')
    name = serializers.CharField(source='permission.name')
    
    class Meta: 
        model = UserPermission
        fields = ['code', 'name']

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=100)
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data     