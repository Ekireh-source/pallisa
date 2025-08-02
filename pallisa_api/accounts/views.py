from django.utils import timezone
import traceback
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample, OpenApiParameter
from django.db.models import Q
from django.core.paginator import Paginator

from .models import Campus, School, SetupSteps, Document, PasswordResetToken, Permission, Role, UserPermission, UserProfile, CustomUser, EmailVerificationToken
from .serializers import (
    DocumentSerializer,
    ForgotPasswordSerializer,
    LoginResponseSerializer,
    PermissionSerializer,
    ResetPasswordSerializer,
    RoleSerializer,
    UserPermissionSerializer,
    UserProfileSerializer, 
    CustomUserSerializer,
    UserRegistrationSerializer,
    LoginSerializer,
    OTPVerificationSerializer,
    ResendOTPSerializer,
    LogoutSerializer,
)
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.db import transaction
from .utils import send_verification_email
import string
import secrets
from django.core.mail import send_mail
from django.conf import settings
from django.http import FileResponse
from rest_framework.permissions import IsAuthenticated
from .permission import HasPermission, HasAnyPermission, require_permission


class UserRegistrationView(APIView):
    """
    Register a new user with profile in a single request
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Register a new user with profile",
        request=UserRegistrationSerializer,
        responses={201: UserProfileSerializer},
    )
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            profile = serializer.save()
            return Response(
                {
                    "message": "Registration successful. Please check your email and phone_number for verification code.",
                    "user": UserProfileSerializer(profile).data
                }, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class LoginView(APIView):
    """
    Authenticate a user and return JWT tokens
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Login and get JWT tokens",
        request=LoginSerializer,
        responses={
            200: LoginResponseSerializer,
            401: {"description": "Invalid credentials or email not verified"},
            400: {"description": "Invalid request"}
        },
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data.get('email')
            student_id = serializer.validated_data.get('student_id')
            password = serializer.validated_data['password']

            print(request.data)
            
            # Determine username for authentication
            username = email if email else student_id
            
            # Authenticate user
            user = authenticate(request, username=username, password=password)
            
            if user:
                # Check if email is verified
                if not user.email_verified:
                    return Response(
                        {
                            "error": "Please verify your email before logging in.",
                            "email_verification_required": True,
                            "email": user.email
                        },
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                
                # Get user profile data
                try:
                    profile = user.profile
                    user_type = profile.user_type
                    name = f"{profile.first_name} {profile.last_name}"
                except:
                    user_type = None
                    name = None
                
                serializer = UserProfileSerializer(user.profile, context={'request': request})
                
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user_profile': serializer.data,
                })
            else:
                return Response(
                    {"error": "Invalid credentials"}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    Blacklist the refresh token to logout
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as e:
            # Token is already blacklisted or invalid
            return Response({"warning": "Token was already invalid or blacklisted."}, status=status.HTTP_205_RESET_CONTENT)

        return Response(status=status.HTTP_205_RESET_CONTENT)


class VerifyEmailView(APIView):
    """
    Verify a user's email address using an OTP code
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Verify user email with OTP",
        request=OTPVerificationSerializer,
        responses={
            200: {"description": "Email verified successfully"},
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
            # Find and verify the token
            verification_token = EmailVerificationToken.verify_otp(email, otp)
            
            # Mark user as verified
            with transaction.atomic():
                user = verification_token.user
                user.email_verified = True
                user.save()
                
                # Delete the token as it's been used
                verification_token.delete()
                
            
            # Generate auth tokens for automatic login after verification
            refresh = RefreshToken.for_user(user)
            
            try:
                profile = user.profile
                user_type = profile.user_type
                name = f"{profile.first_name} {profile.last_name}"
            except:
                user_type = None
                name = None
            serializer = UserProfileSerializer(user.profile)
            return Response({
                "message": "Email verified successfully. You can now log in.",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user_profile": serializer.data,
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except EmailVerificationToken.DoesNotExist:
            return Response(
                {"error": "Invalid OTP code or email address."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": "An error occurred during verification."},
                status=status.HTTP_400_BAD_REQUEST
            )


class ResendVerificationEmailView(APIView):
    """
    Resend verification OTP to the user
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Resend verification OTP",
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
            user = CustomUser.objects.get(email=email)
            
            # Check if user is already verified
            if user.email_verified:
                return Response(
                    {"error": "Email is already verified."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create new token with OTP
            token_obj, otp = EmailVerificationToken.create_for_user(user)
            
            # Send verification email with OTP
            send_verification_email(user, otp)
            
            return Response(
                {"message": "Verification code sent to your email."},
                status=status.HTTP_200_OK
            )
            
        except CustomUser.DoesNotExist:
            # For security reasons, don't reveal whether the email exists
            return Response(
                {"message": "If this email exists in our system, a verification code has been sent."},
                status=status.HTTP_200_OK
            )


class UserProfileListView(APIView):
    """
    List all user profiles
    """
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required = 'admin.manage_users'
    
    @extend_schema(
        summary="List all user profiles",
        parameters=[
            OpenApiParameter(name='user_type', type=str, description='Filter by user type'),
            OpenApiParameter(name='search', type=str, description='Search in first_name, last_name, and other_name'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses=UserProfileSerializer(many=True),
    )
    def get(self, request):
        """Get list of user profiles with filtering and pagination"""
        # Get query parameters
        user_type = request.query_params.get('user_type')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset with optimizations
        queryset = UserProfile.objects.select_related('user', 'role').order_by('last_name', 'first_name')
        
        # Apply filters
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search) | 
                Q(other_name__icontains=search)
            )

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = UserProfileSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })


class UserProfileDetailView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a user profile
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'admin.view_users',
        'PUT': 'admin.edit_users',
        'PATCH': 'admin.edit_users',
        'DELETE': 'admin.delete_users',
    }
    
    def get_permissions(self):
        """
        - GET: Allow access to profile owner or admin
        - PUT/PATCH/DELETE: Admin only
        """
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        # Regular users can only see their own profile
        if self.request.user.is_staff:
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=self.request.user)
    

class DocumentListCreateAPIView(APIView):
    """
    API view to list and create documents.
    """
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'admin.view_documents',
        'POST': 'admin.create_documents',
    }
    parser_classes = [MultiPartParser, FormParser]
    
    @extend_schema(
        summary="List all documents",
        description="Returns a list of all documents belonging to the authenticated user",
        parameters=[
            OpenApiParameter(name='search', type=str, description='Search in document name'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: DocumentSerializer(many=True)}
    )
    def get(self, request):
        """List all documents for the authenticated user with filtering and pagination."""
        # Get query parameters
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset
        queryset = Document.objects.filter(profile=request.user.profile).order_by('-created_at')
        
        # Apply search filter
        if search:
            queryset = queryset.filter(name__icontains=search)

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = DocumentSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })
    
    @extend_schema(
        summary="Create a new document",
        description="Upload a new document file with associated metadata",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'name': {'type': 'string'},
                    'doc': {'type': 'string', 'format': 'binary'}
                },
                'required': ['name', 'doc']
            }
        },
        responses={
            201: DocumentSerializer,
            400: OpenApiResponse(description="Bad request, invalid data")
        },
        examples=[
            OpenApiExample(
                name="Valid Document Upload",
                value={
                    "name": "My Important Document",
                    "doc": "file_content"
                },
                request_only=True
            )
        ]
    )
    def post(self, request):
        """Create a new document for the authenticated user."""
        serializer = DocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DocumentDetailAPIView(APIView):
    """
    API view for retrieving, updating and deleting individual documents.
    """
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'admin.view_documents',
        'PATCH': 'admin.edit_documents',
        'DELETE': 'admin.delete_documents',
    }
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self, pk, user):
        """Helper method to get document object with permission checking."""
        return get_object_or_404(Document, pk=pk, profile=user.profile)
    
    @extend_schema(
        summary="Retrieve a document",
        description="Get details of a specific document by ID",
    )
    def get(self, request, pk):
        """Retrieve a specific document."""
        document = self.get_object(pk, request.user)
        serializer = DocumentSerializer(document)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Update a document",
        description="Update an existing document's metadata and optionally the file",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'name': {'type': 'string'},
                    'doc': {'type': 'string', 'format': 'binary'}
                }
            }
        }
    )
    def patch(self, request, pk):
        """Update a specific document."""
        document = self.get_object(pk, request.user)
        serializer = DocumentSerializer(document, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Delete a document",
        description="Delete a specific document by ID",
    )
    def delete(self, request, pk):
        """Delete a specific document."""
        document = self.get_object(pk, request.user)
        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentDownloadAPIView(APIView):
    """
    API view for downloading document files.
    """
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required = 'admin.view_documents'
    
    @extend_schema(
        summary="Download a document",
        description="Download the file for a specific document",
        parameters=[
            OpenApiParameter(name="pk", location=OpenApiParameter.PATH, required=True, type=int, description="Document ID")
        ],
        responses={
            200: OpenApiResponse(description="Document file returned as a downloadable response"),
            404: OpenApiResponse(description="Document not found")
        }
    )
    def get(self, request, pk):
        """Download a document file."""
        document = get_object_or_404(Document, pk=pk, profile=request.user.profile)
        return FileResponse(document.doc.open(), as_attachment=True, filename=document.doc.name.split('/')[-1])

class ProfileDocumentListAPIView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required = 'admin.view_documents'
    
    @extend_schema(
        summary="List documents for a specific profile",
        description="Returns a list of all documents associated with a specific profile",
        parameters=[
            OpenApiParameter(name="profile_id", location=OpenApiParameter.QUERY, required=True, type=int, description="The ID of the profile to retrieve documents for"),
            OpenApiParameter(name='search', type=str, description='Search in document name'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: DocumentSerializer(many=True)},
    )
    def get(self, request):
        """List documents for a specific profile with filtering and pagination."""
        # Fetch profile_id from query params
        profile_id = request.query_params.get('profile_id')
        if not profile_id:
            return Response({"detail": "Profile ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Get additional query parameters
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Try to get the profile
        try:
            profile = UserProfile.objects.get(id=profile_id)
        except UserProfile.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        # Build queryset
        queryset = Document.objects.filter(profile=profile).order_by('-created_at')
        
        # Apply search filter
        if search:
            queryset = queryset.filter(name__icontains=search)

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = DocumentSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })


class RoleListCreateView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'admin.manage_roles',
        'POST': 'admin.manage_roles',
    }
    
    @extend_schema(
        tags=["Roles"],
        summary="List all roles",
        parameters=[
            OpenApiParameter(name='search', type=str, description='Search in role name and description'),
            OpenApiParameter(name='is_superadmin', type=bool, description='Filter by super admin status'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: RoleSerializer(many=True)}
    )
    def get(self, request):
        user_profile = request.user.profile
        
        # Start with all roles
        roles = Role.objects.all()
        
        # Apply search filter
        search = request.query_params.get('search')
        if search:
            roles = roles.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        # Apply super admin filter
        is_superadmin = request.query_params.get('is_superadmin')
        if is_superadmin is not None:
            is_superadmin_bool = is_superadmin.lower() == 'true'
            roles = roles.filter(is_superadmin=is_superadmin_bool)
        
        # If user is a school owner, filter by their schools
        if user_profile.user_type == 'school_owner':
            owned_schools = School.objects.filter(owner=user_profile)
            if owned_schools.exists():
                # Include roles that belong to owned schools OR have no school assigned (system roles)
                roles = roles.filter(
                    Q(school__in=owned_schools) | Q(school__isnull=True)
                )
            else:
                # If no owned schools, only show system roles (no school assigned)
                roles = roles.filter(school__isnull=True)
        elif user_profile.user_type == 'admin':
            # Admins can see all roles
            pass
        else:
            # Other user types can only see roles from their school
            if hasattr(user_profile, 'school') and user_profile.school:
                roles = roles.filter(
                    Q(school=user_profile.school) | Q(school__isnull=True)
                )
            else:
                # If no school assigned, only show system roles
                roles = roles.filter(school__isnull=True)
            
        # Apply pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        paginator = Paginator(roles, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = RoleSerializer(page_obj.object_list, many=True)
        
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': serializer.data
        })


    @extend_schema(
        tags=["Roles"],
        summary="Create a new role",
        request=RoleSerializer,
        responses={201: RoleSerializer}
    )
    def post(self, request):
        serializer = RoleSerializer(data=request.data)
        if serializer.is_valid():
            role = serializer.save()
            school = role.school
            
            if school:
                setup_steps,_= SetupSteps.objects.get_or_create(school=school)
                setup_steps.create_roles_and_permissions = True
                setup_steps.save()
            return Response(RoleSerializer(role).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoleDetailView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'admin.manage_roles',
        'PATCH': 'admin.manage_roles',
        'DELETE': 'admin.manage_roles',
    }
    
    @extend_schema(tags=["Roles"], summary="Retrieve a role by ID")
    def get(self, request, pk):
        try:
            role = Role.objects.get(pk=pk)
        except Role.DoesNotExist:
            return Response({'error': 'Role not found'}, status=404)
        serializer = RoleSerializer(role)
        return Response(serializer.data)

    @extend_schema(tags=["Roles"], summary="Update a role by ID", request=RoleSerializer)
    def patch(self, request, pk):
        try:
            role = Role.objects.get(pk=pk)
        except Role.DoesNotExist:
            return Response({'error': 'Role not found'}, status=404)
        serializer = RoleSerializer(role, data=request.data)
        if serializer.is_valid():
            role = serializer.save()
            return Response(RoleSerializer(role).data)
        return Response(serializer.errors, status=400)

    @extend_schema(tags=["Roles"], summary="Delete a role by ID")
    def delete(self, request, pk):
        try:
            role = Role.objects.get(pk=pk)
        except Role.DoesNotExist:
            return Response({'error': 'Role not found'}, status=404)
        role.delete()
        return Response(status=204)
    
@extend_schema(
    summary="List all permissions",
    tags=["Permissions"],
    responses={200: PermissionSerializer(many=True)}
)
class PermissionListView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required = 'admin.manage_permissions'
    
    def get(self, request):
        permissions = Permission.objects.select_related('category').all()
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK) 
    
@extend_schema(
    tags=["User Permissions"],
    summary="List all permissions assigned to a user",
    parameters=[
        OpenApiParameter(
            name="user_id",
            description="ID of the user to retrieve permissions for",
            required=True,
            type=int,
            location=OpenApiParameter.QUERY
        )
    ],
    responses={200: UserPermissionSerializer(many=True)}
)
class UserPermissionListAPIView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required = 'admin.manage_permissions'
    
    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response(
                {"detail": "user_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        permissions = UserPermission.objects.filter(user_id=user_id)
        serializer = UserPermissionSerializer(permissions, many=True)
        return Response(serializer.data)       
    
@extend_schema(tags=["User Permissions"])
class AssignUserPermissionAPIView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required = 'admin.manage_permissions'
    
    @extend_schema(
        summary="Assign a direct permission to a user",
        request={
            "type": "object",
            "properties": {
                "user_id": {"type": "integer"},
                "permission_id": {"type": "integer"}
            },
            "required": ["user_id", "permission_id"]
        }
    )
    def post(self, request):
        user_id = request.data.get("user_id")
        permission_id = request.data.get("permission_id")

        if not user_id or not permission_id:
            return Response({"detail": "User ID and Permission ID are required"}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(UserProfile, id=user_id)
        permission = get_object_or_404(Permission, id=permission_id)

        current_user = request.user.profile
        # if not has_permission(current_user, 'manage_permissions'):
        #     return Response({"detail": "You don't have permission to manage permissions"}, status=status.HTTP_403_FORBIDDEN)

        user_permission, created = UserPermission.objects.get_or_create(
            user=user,
            permission=permission,
            defaults={
                'is_role_based': False,
                'assigned_by': current_user
            }
        )

        if not created and user_permission.is_role_based:
            user_permission.is_role_based = False
            user_permission.assigned_by = current_user
            user_permission.save()

        return Response({"detail": "Permission assigned successfully", "created": created})   
    
@extend_schema(tags=["User Permissions"])
class RemoveDirectUserPermissionAPIView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required = 'admin.manage_permissions'
    
    @extend_schema(
        summary="Remove a direct permission from a user",
        request={
            "type": "object",
            "properties": {
                "user_id": {"type": "integer"},
                "permission_id": {"type": "integer"}
            },
            "required": ["user_id", "permission_id"]
        }
    )
    def post(self, request):
        user_id = request.data.get("user_id")
        permission_id = request.data.get("permission_id")

        if not user_id or not permission_id:
            return Response({"detail": "User ID and Permission ID are required"}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(UserProfile, id=user_id)
        permission = get_object_or_404(Permission, id=permission_id)

        current_user = request.user.profile
        # if not has_permission(current_user, 'manage_permissions'):
        #     return Response({"detail": "You don't have permission to manage permissions"}, status=status.HTTP_403_FORBIDDEN)

        deleted, _ = UserPermission.objects.filter(
            user=user,
            permission=permission,
            is_role_based=False
        ).delete()

        return Response({"detail": "Permission removed successfully" if deleted else "No direct permission found to remove"})


class ForgotPasswordView(APIView):
    """
    Send password reset link to user's email
    """
    permission_classes = [permissions.AllowAny]
    
    def send_password_reset_email(self, user, reset_token):
        """Send password reset email with secure link"""

        
        # You can customize this URL based on your frontend routing
        reset_url = f"{settings.FRONTEND_URL}/auth/forgot-password?token={reset_token.token}"
        
        subject = f"Password Reset Request - {getattr(settings, 'SITE_NAME', 'Your App')}"
        
        # Template context
        context = {
            'user': user,
            'reset_url': reset_url,
            'site_name': getattr(settings, 'SITE_NAME', 'Your App'),
            'reset_token': reset_token,
        }
        
        try:
            from django.core.mail import EmailMultiAlternatives
            from django.template.loader import render_to_string
            
            # Render templates
            html_message = render_to_string('email/password_reset_email.html', context)
            plain_message = render_to_string('email/password_reset_email.txt', context)
            
            msg = EmailMultiAlternatives(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email]
            )
            msg.attach_alternative(html_message, "text/html")
            msg.send()
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    @extend_schema(
        summary="Request password reset",
        description="Send password reset link to user's email",
        request=ForgotPasswordSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {"type": "string"}
                }
            },
            400: {
                "type": "object", 
                "properties": {
                    "error": {"type": "string"}
                }
            }
        }
    )
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']

        try:
            user = CustomUser.objects.get(email=email)

            try:
                reset_token = PasswordResetToken.create_for_user(user)
            except Exception as e:
                print("Error creating reset token:", str(e))
                traceback.print_exc()
                return Response({
                    "error": "Failed to generate password reset token"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            email_sent = self.send_password_reset_email(user, reset_token)

            if email_sent:
                return Response({
                    "message": "Password reset link has been sent to your email."
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "error": "Failed to send reset email. Please try again later."
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except CustomUser.DoesNotExist:
            return Response({
                "message": "If an account with this email exists, a password reset link has been sent."
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print("Unhandled exception in ForgotPasswordView:")
            print(traceback.format_exc())
            return Response({
                "error": "An error occurred. Please try again later."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResetPasswordView(APIView):
    """
    Reset password using the token from email
    """
    permission_classes = [permissions.AllowAny]
    
    def send_password_reset_success_email(self, user):
        """Send confirmation email after successful password reset"""
        subject = f"Password Reset Successful - {getattr(settings, 'SITE_NAME', 'Your App')}"
        
        context = {
            'user': user,
            'site_name': getattr(settings, 'SITE_NAME', 'Your App'),
            'support_email': getattr(settings, 'SUPPORT_EMAIL', settings.DEFAULT_FROM_EMAIL),
            'reset_time': timezone.now(),
        }
        
        try:
            from django.core.mail import EmailMultiAlternatives
            from django.template.loader import render_to_string
            
            # Render templates
            html_message = render_to_string('email/password_reset_success.html', context)
            plain_message = render_to_string('email/password_reset_success.txt', context)
            
            msg = EmailMultiAlternatives(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email]
            )
            msg.attach_alternative(html_message, "text/html")
            msg.send()
            return True
        except Exception as e:
            print(f"Failed to send confirmation email: {e}")
            return False
    
    @extend_schema(
        summary="Reset password with token",
        description="Reset user password using the token received via email",
        request=ResetPasswordSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {"type": "string"}
                }
            },
            400: {
                "type": "object",
                "properties": {
                    "error": {"type": "string"}
                }
            }
        }
    )
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            # Verify the token
            reset_token = PasswordResetToken.verify_token(token)
            
            # Update user password
            with transaction.atomic():
                user = reset_token.user
                user.set_password(new_password)
                user.save()
                
                # Mark token as used
                reset_token.mark_as_used()
            
            # Send confirmation email (optional - don't fail if email fails)
            self.send_password_reset_success_email(user)
            
            return Response({
                "message": "Password has been reset successfully. You can now log in with your new password."
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("Exception during password reset:", traceback.format_exc())
            return Response({
                "error": f"An error occurred while resetting password: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ValidateResetTokenView(APIView):
    """
    Validate if a reset token is still valid (useful for frontend validation)
    """
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        summary="Validate reset token",
        description="Check if a password reset token is valid and not expired",
        parameters=[
            OpenApiParameter(
                name="token",
                description="Reset token to validate",
                required=True,
                type=str,
                location=OpenApiParameter.QUERY
            )
        ],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "valid": {"type": "boolean"},
                    "message": {"type": "string"}
                }
            }
        }
    )
    def get(self, request):
        token = request.query_params.get('token')
        
        if not token:
            return Response({
                "valid": False,
                "message": "Token is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            PasswordResetToken.verify_token(token)
            return Response({
                "valid": True,
                "message": "Token is valid"
            }, status=status.HTTP_200_OK)
        except ValueError:
            return Response({
                "valid": False,
                "message": "Invalid or expired token"
            }, status=status.HTTP_200_OK)

class PasswordResetRequestView(APIView):
    """
    View for initiating a password reset for staff members
    """
    def generate_password(self, length=10):
        """Generate a secure random password"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*()_+"
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        
        # Ensure password has at least one uppercase, one lowercase, one digit and one special character
        if (not any(c.isupper() for c in password) or
            not any(c.islower() for c in password) or
            not any(c.isdigit() for c in password) or
            not any(c in "!@#$%^&*()_+" for c in password)):
            return self.generate_password(length)  # Regenerate if criteria not met
            
        return password
    
    def send_password_reset_email(self, email, password):
        """Send password reset email with new credentials"""
        subject = "Password Reset - Your New Login Details"
        
        message = f"""
        Dear User,
        
        Your password has been reset per your request.
        
        Here are your new login details:
        - Email: {email}
        - Password: {password}
        
        Please log in using these credentials and change your password immediately.
        
        If you did not request this password reset, please contact support immediately.
        
        Best regards,
        The Support Team
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            return False

    @extend_schema(
        summary="Request password reset",
        description="Resets user password and sends new password via email",
        request={
            "type": "object",
            "properties": {
                "email": {"type": "string", "format": "email"}
            },
            "required": ["email"]
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "success": {"type": "boolean"}
                }
            },
            404: {
                "type": "object",
                "properties": {
                    "error": {"type": "string"}
                }
            }
        }
    )
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = CustomUser.objects.get(email=email)
            
            # Generate new password
            new_password = self.generate_password()
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            # Send password reset email
            email_sent = self.send_password_reset_email(email, new_password)
            
            response_data = {
                "message": "Password reset successful",
                "success": True
            }
            
            # Only include password in response if email failed
            if not email_sent:
                response_data["password"] = new_password
                response_data["warning"] = "Email failed to send. Please securely share this password with the user."
                
            return Response(response_data)
            
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User with this email does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            ) 

class CurrentUserProfileView(APIView):
    """
    Get the current authenticated user's profile
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="Get current user profile",
        description="Returns the profile of the currently authenticated user",
        responses={
            200: {
                "type": "object",
                "properties": {
                    "user_profile": UserProfileSerializer()
                }
            },
            404: {"description": "User profile not found"}
        }
    )
    def get(self, request):
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(user_profile, context={'request': request})
            return Response({"user_profile": serializer.data})
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "User profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            ) 
                 