from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import PermissionCategory, UserProfile, EmailVerificationToken, CustomUser, Document, Role, Permission, UserPermission
from schools.models import School, Campus
from schools.serializers import SchoolSerializer, CampusSerializer
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
        queryset=Permission.objects.all(), many=True, required=False, default=[]
    )

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'is_superadmin', 'school']
        read_only_fields = ['is_superadmin']

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
    user_permissions = serializers.SerializerMethodField()
    

    class Meta:
        model = UserProfile
        fields = (
            'id', 'user', 'user_type', 'gender', 'first_name', 'last_name', 
            'other_name', 'dob', 'phone', 'profile_picture', 'profile_picture_url', 'role',
            'emergency_contact', 'emergency_phone', 'emergency_contact_address', 'emergency_contact_email',
            'user_permissions'
        )
        
    def get_profile_picture_url(self, obj):
        """Return the URL of the profile picture if it exists."""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    def get_user_permissions(self, obj):
        """Get user's permissions from both role and direct assignments"""
        permissions = []
        
        # Get permissions from role
        if obj.role:
            role_permissions = obj.role.permissions.all()
            for perm in role_permissions:
                permissions.append({
                    'code': perm.code,
                    'name': perm.name,
                    'is_role_based': True,
                    'assigned_by': None,
                    'created_at': obj.role.created_at.isoformat()
                })
        
        # Get direct user permissions
        user_permissions = UserPermission.objects.filter(user=obj)
        for up in user_permissions:
            permissions.append({
                'code': up.permission.code,
                'name': up.permission.name,
                'is_role_based': False,
                'assigned_by': up.assigned_by.id if up.assigned_by else None,
                'created_at': up.created_at.isoformat()
            })
        
        return permissions

    def to_representation(self, instance):
        """Customize the output representation"""
        representation = super().to_representation(instance)
        
        # Show role details instead of just ID in responses
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
    # Removed as per requirement
    
    def validate_email(self, value):
        """Check that the email is not already in use"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate(self, data):
        """Custom validation for registration data"""
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        # Extract user fields and profile fields
        user_data = {
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'email_verified': False,
            'is_active': True,
        }
        
        # Create user
        user = User.objects.create_user(**user_data)
        
        # Create profile linked to the user with hard-coded user_type as 'school_owner'
        profile_data = validated_data.copy()
        profile_data['user_type'] = 'school_owner'  # Hard-code user_type
        profile = UserProfile.objects.create(user=user, **profile_data)
        
        # Generate OTP verification token
        token_obj, otp = EmailVerificationToken.create_for_user(user)
        
        # Send verification email with OTP
        send_verification_email(user, otp)
        
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