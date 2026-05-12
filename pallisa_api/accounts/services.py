from django.contrib.auth import authenticate
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import serializers
from typing import Tuple, Optional, Dict, Any

from .models import CustomUser, UserProfile, EmailVerificationToken, PasswordResetToken
from schools.models import School, Campus, SetupSteps
from .utils import send_verification_email


class AuthenticationService:
    """Service class for handling authentication operations"""
    
    @staticmethod
    def register_user(email: str, password: str, profile_data: Dict[str, Any]) -> Tuple[UserProfile, str]:
        """
        Register a new user with profile data and optionally create school and campus
        
        Args:
            email: User's email address
            password: User's password
            profile_data: Additional profile information
            school_data: Optional school and campus creation data
            
        Returns:
            Tuple of (UserProfile instance, OTP code)
            
        Raises:
            serializers.ValidationError: If email already exists or other validation errors
        """
        # Check if email already exists
        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})
        
        with transaction.atomic():
            # Create user
            user = CustomUser.objects.create_user(
                email=email,
                password=password,
                email_verified=False,
                is_active=True
            )
            
            # Create profile
            profile_data['user_type'] = 'school_owner'  # Hard-code user_type
            profile = UserProfile.objects.create(user=user, **profile_data)
            
            # Generate OTP verification token
            token_obj, otp = EmailVerificationToken.create_for_user(user)
            
            # Send verification email
            try:
                send_verification_email(user, otp)
            except Exception as e:
                # Log the error but don't fail the registration
                print(f"Failed to send verification email: {str(e)}")
            
            return profile, otp
    
    @staticmethod
    def _create_school_and_campus(owner_profile: UserProfile, school_data: Dict[str, Any]) -> Tuple[School, Campus]:
        """
        Create school and campus for a user profile
        
        Args:
            owner_profile: UserProfile instance that will own the school
            school_data: Dictionary containing school and campus data
            
        Returns:
            Tuple of (School instance, Campus instance)
        """
        # Create school
        school = School.objects.create(
            name=school_data['school_name'],
            address=school_data.get('school_address', ''),
            phone=school_data.get('school_phone', ''),
            email=school_data.get('school_email', ''),
            website=school_data.get('school_website', ''),
            owner=owner_profile
        )
        
        # Create campus
        campus = Campus.objects.create(
            name=school_data['campus_name'],
            school=school,
            address=school_data.get('campus_address', ''),
            phone=school_data.get('campus_phone', '')
        )
        
        # Create setup steps tracker
        SetupSteps.objects.create(
            school=school,
            basic_info_completed=True  # Basic info is completed during registration
        )
        
        return school, campus
    
    @staticmethod
    def authenticate_user(email: str = None, student_id: str = None, password: str = None) -> Optional[CustomUser]:
        """
        Authenticate user with email/student_id and password
        
        Args:
            email: User's email address
            student_id: User's student ID
            password: User's password
            
        Returns:
            CustomUser instance if authentication successful, None otherwise
        """
        username = email if email else student_id
        return authenticate(username=username, password=password)
    
    @staticmethod
    def generate_tokens(user: CustomUser) -> Dict[str, str]:
        """
        Generate JWT tokens for authenticated user
        
        Args:
            user: CustomUser instance
            
        Returns:
            Dictionary containing access and refresh tokens
        """
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    
    @staticmethod
    def verify_email_otp(email: str, otp: str) -> CustomUser:
        """
        Verify email OTP and mark user as verified
        
        Args:
            email: User's email address
            otp: OTP code to verify
            
        Returns:
            CustomUser instance
            
        Raises:
            EmailVerificationToken.DoesNotExist: If token not found
            ValueError: If OTP expired
        """
        with transaction.atomic():
            # Verify the OTP
            verification_token = EmailVerificationToken.verify_otp(email, otp)
            
            # Mark user as verified
            user = verification_token.user
            user.email_verified = True
            user.save(update_fields=['email_verified'])
            
            # Delete the used token
            verification_token.delete()
            
            return user
    
    @staticmethod
    def resend_verification_otp(email: str) -> str:
        """
        Resend verification OTP to user
        
        Args:
            email: User's email address
            
        Returns:
            New OTP code
            
        Raises:
            CustomUser.DoesNotExist: If user not found
            ValueError: If user already verified
        """
        try:
            user = CustomUser.objects.select_related('profile').get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"email": "User with this email does not exist."})
        
        if user.email_verified:
            raise serializers.ValidationError({"email": "Account is already verified."})
        
        # Generate new OTP
        token_obj, otp = EmailVerificationToken.create_for_user(user)
        
        # Send verification email
        try:
            send_verification_email(user, otp)
        except Exception as e:
            print(f"Failed to send verification email: {str(e)}")
            raise serializers.ValidationError({"email": "Failed to send verification email."})
        
        return otp
    
    @staticmethod
    def get_user_profile_data(user: CustomUser) -> Dict[str, Any]:
        """
        Get user profile data for response including school information
        
        Args:
            user: CustomUser instance
            
        Returns:
            Dictionary containing user profile information
        """
        try:
            profile = user.profile
            data = {
                'user_type': profile.user_type,
                'name': f"{profile.first_name} {profile.last_name}",
                'first_name': profile.first_name,
                'last_name': profile.last_name,
                'phone': profile.phone,
                'profile_id': profile.id,
            }
            
            # Add school information if user is school owner
            if profile.user_type == 'school_owner':
                owned_schools = School.objects.filter(owner=user, active=True)
                if owned_schools.exists():
                    school = owned_schools.first()
                    data['school'] = {
                        'id': school.id,
                        'name': school.name,
                        'address': school.address,
                        'phone': school.phone_number, # Corrected from phone to phone_number
                        'email': school.email,
                    }
                    
                    # Add campus information
                    campuses = school.campuses.filter(active=True) # Corrected from is_active to active
                    data['campuses'] = [
                        {
                            'id': campus.id,
                            'name': campus.name,
                            'address': campus.address,
                            'phone': campus.phone_number, # Corrected from phone to phone_number
                        }
                        for campus in campuses
                    ]
            
            return data
        except AttributeError:
            return {
                'user_type': None,
                'name': None,
                'first_name': None,
                'last_name': None,
                'phone': None,
                'profile_id': None,
            }


class UserService:
    """Service class for user management operations"""
    
    @staticmethod
    def get_user_profiles_optimized(user=None):
        """
        Get user profiles with optimized queries
        
        Args:
            user: Current user (for permission filtering)
            
        Returns:
            QuerySet of UserProfile instances
        """
        queryset = UserProfile.objects.select_related(
            'user', 'role'
        ).prefetch_related(
            'role__permissions',
            'user_permissions__permission'
        )
            
        return queryset.order_by('-user__date_joined')
    
    @staticmethod
    def get_user_profile_by_id(profile_id: int, user=None) -> UserProfile:
        """
        Get user profile by ID with optimized query
        
        Args:
            profile_id: Profile ID
            user: Current user (for permission checking)
            
        Returns:
            UserProfile instance
        """
        queryset = UserProfile.objects.select_related(
            'user', 'role'
        ).prefetch_related(
            'role__permissions',
            'user_permissions__permission'
        )
        
        return queryset.get(id=profile_id)


class PasswordResetService:
    """Service class for password reset operations"""
    
    @staticmethod
    def initiate_password_reset(email: str) -> str:
        """
        Initiate password reset process
        
        Args:
            email: User's email address
            
        Returns:
            Reset token
            
        Raises:
            CustomUser.DoesNotExist: If user not found
        """
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"email": "User with this email does not exist."})
        
        # Create reset token
        reset_token = PasswordResetToken.create_for_user(user)
        
        return reset_token.token
    
    @staticmethod
    def reset_password(token: str, new_password: str) -> CustomUser:
        """
        Reset user password using token
        
        Args:
            token: Reset token
            new_password: New password
            
        Returns:
            CustomUser instance
            
        Raises:
            PasswordResetToken.DoesNotExist: If token not found or expired
        """
        with transaction.atomic():
            reset_token = PasswordResetToken.verify_token(token)
            
            user = reset_token.user
            user.set_password(new_password)
            user.save(update_fields=['password'])
            
            # Mark token as used
            reset_token.mark_as_used()
            
            return user 


class SchoolService:
    """Service class for school management operations"""
    
    @staticmethod
    def get_schools_for_owner(user: CustomUser):
        """
        Get all schools owned by a user
        
        Args:
            user: CustomUser instance
            
        Returns:
            QuerySet of School instances
        """
        return School.objects.filter(owner=user, active=True).select_related('owner')
    
    @staticmethod
    def get_school_with_campuses(school_id: int, owner_profile: UserProfile) -> Optional[School]:
        """
        Get a school with its campuses, ensuring the user owns it
        
        Args:
            school_id: ID of the school
            owner_profile: UserProfile instance that should own the school
            
        Returns:
            School instance with prefetched campuses or None
        """
        try:
            return School.objects.prefetch_related('campuses').get(
                id=school_id,
                owner=owner_profile,
                is_active=True
            )
        except School.DoesNotExist:
            return None
    
    @staticmethod
    def update_school_setup_step(school: School, step_name: str, completed: bool = True):
        """
        Update a specific setup step for a school
        
        Args:
            school: School instance
            step_name: Name of the setup step (e.g., 'campus_setup_completed')
            completed: Whether the step is completed
        """
        setup_steps, created = SetupSteps.objects.get_or_create(school=school)
        
        if hasattr(setup_steps, step_name):
            setattr(setup_steps, step_name, completed)
            setup_steps.save(update_fields=[step_name, 'updated_at'])
    
    @staticmethod
    def get_setup_progress(school: School) -> Dict[str, Any]:
        """
        Get the setup progress for a school
        
        Args:
            school: School instance
            
        Returns:
            Dictionary containing setup progress information
        """
        try:
            # Refresh the school from database to avoid relationship caching issues
            school.refresh_from_db()
            setup_steps = school.setup_steps
            return {
                'basic_info_completed': setup_steps.basic_info_completed,
                'campus_setup_completed': setup_steps.campus_setup_completed,
                'staff_setup_completed': setup_steps.staff_setup_completed,
                'student_setup_completed': setup_steps.student_setup_completed,
                'permissions_setup_completed': setup_steps.permissions_setup_completed,
                'completion_percentage': setup_steps.completion_percentage,
            }
        except SetupSteps.DoesNotExist:
            return {
                'basic_info_completed': False,
                'campus_setup_completed': False,
                'staff_setup_completed': False,
                'student_setup_completed': False,
                'permissions_setup_completed': False,
                'completion_percentage': 0,
            } 