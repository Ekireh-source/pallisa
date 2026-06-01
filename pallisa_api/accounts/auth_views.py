from accounts.models import Role
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenRefreshView as JWTTokenRefreshView
from drf_spectacular.utils import extend_schema
from django.utils.decorators import method_decorator
from django.views.decorators.vary import vary_on_headers
from django.conf import settings
from datetime import datetime, timezone
import logging

from .models import CustomUser, UserProfile, EmailVerificationToken
from schools.models import School
from .serializers import (
    UserRegistrationSerializer,
    LoginSerializer,
    LoginResponseSerializer,
    OTPVerificationSerializer,
    ResendOTPSerializer,
    LogoutSerializer,
    UserProfileSerializer,
    SchoolSerializer,
    CampusSerializer,
)
from .services import AuthenticationService, SchoolService

logger = logging.getLogger(__name__)


def set_auth_cookies(response, access_token, refresh_token):
    access_expiry = datetime.now(timezone.utc) + settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
    refresh_expiry = datetime.now(timezone.utc) + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
    
    # Set Access Token Cookie
    response.set_cookie(
        key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
        value=access_token,
        expires=access_expiry,
        secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
        httponly=settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
        path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
        samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
    )
    
    # Set Refresh Token Cookie
    response.set_cookie(
        key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
        value=refresh_token,
        expires=refresh_expiry,
        secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
        httponly=settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
        path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
        samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
    )


class UserRegistrationView(APIView):
    """
    Register a new user with profile and optionally create school and campus
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Register a new user with profile and school",
        description="Register a new user account with profile information. If user_type is 'school_owner', school and campus information is required. An OTP will be sent to the provided email for verification.",
        request=UserRegistrationSerializer,
        responses={
            201: {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "user": UserProfileSerializer,
                    "requires_verification": {"type": "boolean"}
                }
            },
            400: {"description": "Invalid request data"}
        },
    )
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Extract user and profile data
            email = serializer.validated_data.pop('email')
            password = serializer.validated_data.pop('password')
            profile_data = serializer.validated_data
            
            # Register user through service
            profile, otp = AuthenticationService.register_user(
                email, password, profile_data
            )
            
            logger.info(f"User registered successfully: {email}")
            
            # Prepare response
            response_data = {
                "message": "Registration successful. Please check your email for verification code.",
                "user": UserProfileSerializer(profile, context={'request': request}).data,
                "requires_verification": True
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Registration failed for {email}: {str(e)}")
            return Response(
                {"error": "Registration failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    """
    Authenticate a user and return JWT tokens
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Login and get JWT tokens",
        description="Authenticate user with email/student_id and password. Returns JWT tokens on success.",
        request=LoginSerializer,
        responses={
            200: LoginResponseSerializer,
            401: {"description": "Invalid credentials or email not verified"},
            429: {"description": "Too many login attempts"},
            400: {"description": "Invalid request"}
        },
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data.get('email')
        student_id = serializer.validated_data.get('student_id')
        password = serializer.validated_data['password']
        
        identifier = email or student_id
        
        try:
            # Authenticate user through service
            user = AuthenticationService.authenticate_user(email=email, student_id=student_id, password=password)
            
            if not user:
                logger.warning(f"Failed login attempt for: {identifier}")
                return Response(
                    {"error": "Invalid credentials"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if email is verified
            if not user.email_verified:
                logger.info(f"Login attempt with unverified email: {user.email}")
                return Response({
                    "error": "Please verify your email before logging in.",
                    "email_verification_required": True,
                    "email": user.email
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Generate tokens
            tokens = AuthenticationService.generate_tokens(user)
            
            # Get user profile data
            profile_data = AuthenticationService.get_user_profile_data(user)
            
            logger.info(f"Successful login for: {user.email}")


            profile = UserProfileSerializer(user.profile, context={'request': request}).data
            school = None
            if profile.get('role') and profile['role'].get('id'):
                role_id = profile['role']['id']
                role_data = Role.objects.filter(id=role_id).values().first()
                if role_data and role_data.get('school_id'):
                    school = School.objects.filter(id=role_data['school_id']).first()

            # If not found from role, check profile_data
            if not school:
                school = profile_data.get('school')
            
            # If still not found, check if the user is the owner
            if not school:
                school = School.objects.filter(owner=user).first()
            
            school_data = SchoolSerializer(school, context={'request': request}).data if school else None
            
            response = Response({
                'user_profile': profile,
                'user_info': profile_data,
                'school': school_data
            }, status=status.HTTP_200_OK)
            set_auth_cookies(response, tokens['access'], tokens['refresh'])
            return response
            
        except Exception as e:
            logger.error(f"Login error for {identifier}: {str(e)}")
            return Response(
                {"error": "Login failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    """
    Blacklist the refresh token to logout
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Logout user",
        description="Blacklist the refresh token to logout the user.",
        request=LogoutSerializer,
        responses={
            205: {"description": "Successfully logged out"},
            400: {"description": "Invalid or missing refresh token"}
        }
    )
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'))
        if not refresh_token:
            refresh_token = request.data.get("refresh")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
                logger.info(f"User logged out and token blacklisted: {request.user.email}")
            except Exception:
                pass

        response = Response(
            {"message": "Successfully logged out."}, 
            status=status.HTTP_200_OK
        )
        response.delete_cookie(settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'))
        response.delete_cookie(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'))
        return response


class VerifyEmailView(APIView):
    """
    Verify a user's email address using an OTP code
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Verify user email with OTP",
        description="Verify user's email address using the OTP code sent via email.",
        request=OTPVerificationSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "access": {"type": "string"},
                    "refresh": {"type": "string"},
                    "user_profile": UserProfileSerializer
                }
            },
            400: {"description": "Invalid OTP or OTP expired"},
            404: {"description": "OTP not found"}
        },
    )
    def post(self, request):
        serializer = OTPVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        
        try:
            # Verify OTP through service
            user = AuthenticationService.verify_email_otp(email, otp)
            
            # Generate tokens for automatic login
            tokens = AuthenticationService.generate_tokens(user)
            
            logger.info(f"Email verified successfully for: {email}")
            
            response = Response({
                "message": "Email verified successfully. You are now logged in.",
                "user_profile": UserProfileSerializer(user.profile, context={'request': request}).data
            }, status=status.HTTP_200_OK)
            set_auth_cookies(response, tokens['access'], tokens['refresh'])
            return response
            
        except EmailVerificationToken.DoesNotExist:
            logger.warning(f"Invalid OTP attempt for: {email}")
            return Response(
                {"error": "Invalid OTP code."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except ValueError as e:
            logger.warning(f"Expired OTP attempt for: {email}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Email verification error for {email}: {str(e)}")
            return Response(
                {"error": "Verification failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResendVerificationEmailView(APIView):
    """
    Resend verification OTP to the user
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Resend verification OTP",
        description="Resend verification OTP to user's email address.",
        request=ResendOTPSerializer,
        responses={
            200: {"description": "Verification OTP sent"},
            400: {"description": "Invalid email or account already verified"},
            404: {"description": "User not found"}
        },
    )
    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        
        try:
            # Resend OTP through service
            otp = AuthenticationService.resend_verification_otp(email)
            
            logger.info(f"Verification OTP resent to: {email}")
            
            return Response(
                {"message": "Verification OTP has been sent to your email."}, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Resend OTP error for {email}: {str(e)}")
            if hasattr(e, 'detail'):
                return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
            return Response(
                {"error": "Failed to resend OTP. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 


class TokenRefreshView(JWTTokenRefreshView):
    """
    Refresh JWT access token using refresh token
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Refresh JWT access token",
        description="Refresh the JWT access token using a valid refresh token.",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "refresh": {"type": "string", "description": "The refresh token"}
                },
                "required": ["refresh"]
            }
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "access": {"type": "string", "description": "New access token"}
                }
            },
            401: {"description": "Invalid or expired refresh token"},
            400: {"description": "Invalid request data"}
        },
    )
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'))
        if not refresh_token:
            refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refresh = RefreshToken(refresh_token)
            data = {"access": str(refresh.access_token)}

            if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS', False):
                if settings.SIMPLE_JWT.get('BLACKLIST_AFTER_ROTATION', False):
                    try:
                        refresh.blacklist()
                    except AttributeError:
                        pass
                new_refresh = refresh.copy()
                data['refresh'] = str(new_refresh)

            response = Response({"success": True}, status=status.HTTP_200_OK)
            set_auth_cookies(
                response, 
                data['access'], 
                data.get('refresh', refresh_token)
            )
            return response
        except TokenError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            ) 