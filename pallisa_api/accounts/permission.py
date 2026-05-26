from functools import wraps
from django.http import HttpResponseForbidden, JsonResponse
from django.shortcuts import redirect
from django.urls import reverse
from django.conf import settings
from rest_framework.permissions import BasePermission
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def require_permission(permission_code):
    """
    Decorator for function-based views to require a specific permission.
    
    Usage:
        @require_permission('view_students')
        def student_list(request):
            # View logic here
            pass
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Check if user is authenticated
            if not request.user.is_authenticated:
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({'error': 'Authentication required'}, status=401)
                return redirect('login')
            
            # Check if user has a profile
            if not hasattr(request.user, 'profile'):
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({'error': 'User profile not found'}, status=403)
                return HttpResponseForbidden('User profile not found')
            
            user_profile = request.user.profile
            
            # SuperAdmin has all permissions
            if user_profile.role and user_profile.role.is_superadmin:
                return view_func(request, *args, **kwargs)
            
            # Check if user has the required permission
            if not user_profile.has_permission(permission_code):
                logger.warning(f"User {user_profile} attempted to access {view_func.__name__} without permission {permission_code}")
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({
                        'error': 'Permission denied',
                        'required_permission': permission_code
                    }, status=403)
                return HttpResponseForbidden('Permission denied')
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

def require_permissions(permission_codes):
    """
    Decorator for function-based views to require multiple permissions (OR logic).
    
    Usage:
        @require_permissions(['view_students', 'view_reports'])
        def student_report(request):
            # View logic here
            pass
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Check if user is authenticated
            if not request.user.is_authenticated:
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({'error': 'Authentication required'}, status=401)
                return redirect('login')
            
            # Check if user has a profile
            if not hasattr(request.user, 'profile'):
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({'error': 'User profile not found'}, status=403)
                return HttpResponseForbidden('User profile not found')
            
            user_profile = request.user.profile
            
            # SuperAdmin has all permissions
            if user_profile.role and user_profile.role.is_superadmin:
                return view_func(request, *args, **kwargs)
            
            # Check if user has any of the required permissions
            has_any_permission = any(user_profile.has_permission(code) for code in permission_codes)
            if not has_any_permission:
                logger.warning(f"User {user_profile} attempted to access {view_func.__name__} without any of the required permissions {permission_codes}")
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({
                        'error': 'Permission denied',
                        'required_permissions': permission_codes
                    }, status=403)
                return HttpResponseForbidden('Permission denied')
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

class HasPermission(permissions.BasePermission):
    """
    Custom permission class for DRF that checks if the user has a specific permission.
    
    Usage:
        class StudentViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, HasPermission]
            permission_required = 'view_students'  # For GET
            permission_required_map = {
                'GET': 'view_students',
                'POST': 'create_student',
                'PUT': 'edit_student',
                'PATCH': 'edit_student',
                'DELETE': 'delete_student',
            }
    """
    
    def has_permission(self, request, view):
        # If user is not authenticated, deny access
        if not request.user.is_authenticated:
            return False
            
        # Check if user has a profile
        if not hasattr(request.user, 'profile'):
            return False
            
        # Get the user profile
        user_profile = request.user.profile
        
        # If user has a SuperAdmin role, grant all permissions
        if user_profile.role and user_profile.role.is_superadmin:
            return True
            
        # Get the required permission from the view
        permission_required = None
        
        # Check if view has a permission_required_map for different HTTP methods
        if hasattr(view, 'permission_required_map'):
            permission_required = view.permission_required_map.get(request.method)
        
        # Fall back to the general permission_required attribute
        if not permission_required and hasattr(view, 'permission_required'):
            permission_required = view.permission_required
            
        # If no permission is required, allow access
        if not permission_required:
            return True
            
        # Check if user has the required permission
        has_perm = user_profile.has_permission(permission_required)
        
        if not has_perm:
            logger.warning(f"User {user_profile} attempted to access {view.__class__.__name__} without permission {permission_required}")
            
        return has_perm

class HasAnyPermission(permissions.BasePermission):
    """
    Custom permission class for DRF that checks if the user has any of the specified permissions.
    
    Usage:
        class StudentViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, HasAnyPermission]
            permissions_required = ['view_students', 'view_reports']
            permissions_required_map = {
                'GET': ['view_students', 'view_reports'],
                'POST': ['create_student'],
                'PUT': ['edit_student'],
                'PATCH': ['edit_student'],
                'DELETE': ['delete_student'],
            }
    """
    
    def has_permission(self, request, view):
        # If user is not authenticated, deny access
        if not request.user.is_authenticated:
            return False
            
        # Check if user has a profile
        if not hasattr(request.user, 'profile'):
            return False
            
        # Get the user profile
        user_profile = request.user.profile
        
        # If user has a SuperAdmin role, grant all permissions
        if user_profile.role and user_profile.role.is_superadmin:
            return True
            
        # Get the required permissions from the view
        permissions_required = None
        
        # Check if view has a permissions_required_map for different HTTP methods
        if hasattr(view, 'permissions_required_map'):
            permissions_required = view.permissions_required_map.get(request.method)
        
        # Fall back to the general permissions_required attribute
        if not permissions_required and hasattr(view, 'permissions_required'):
            permissions_required = view.permissions_required
            
        # If no permissions are required, allow access
        if not permissions_required:
            return True
            
        # Convert single permission to list
        if isinstance(permissions_required, str):
            permissions_required = [permissions_required]
            
        # Check if user has any of the required permissions
        has_any_perm = any(user_profile.has_permission(perm) for perm in permissions_required)
        
        if not has_any_perm:
            logger.warning(f"User {user_profile} attempted to access {view.__class__.__name__} without any of the required permissions {permissions_required}")
            
        return has_any_perm

def check_user_permissions(user_profile, required_permissions):
    """
    Utility function to check if a user has the required permissions.
    
    Args:
        user_profile: UserProfile instance
        required_permissions: String or list of permission codes
        
    Returns:
        tuple: (has_permission, missing_permissions)
    """
    if not user_profile:
        return False, required_permissions if isinstance(required_permissions, list) else [required_permissions]
    
    # SuperAdmin has all permissions
    if user_profile.role and user_profile.role.is_superadmin:
        return True, []
    
    # Convert single permission to list
    if isinstance(required_permissions, str):
        required_permissions = [required_permissions]
    
    # Check each permission
    missing_permissions = []
    for permission in required_permissions:
        if not user_profile.has_permission(permission):
            missing_permissions.append(permission)
    
    has_all_permissions = len(missing_permissions) == 0
    return has_all_permissions, missing_permissions

def get_user_permissions(user_profile):
    """
    Utility function to get all permissions for a user.
    
    Args:
        user_profile: UserProfile instance
        
    Returns:
        list: List of permission codes the user has
    """
    if not user_profile:
        return []
    
    # SuperAdmin has all permissions
    if user_profile.role and user_profile.role.is_superadmin:
        from .models import Permission
        return list(Permission.objects.values_list('code', flat=True))
    
    # Get user's direct permissions
    return list(user_profile.user_permissions.values_list('permission__code', flat=True))

def get_user_permission_details(user_profile):
    """
    Utility function to get detailed permission information for a user.
    
    Args:
        user_profile: UserProfile instance
        
    Returns:
        dict: Detailed permission information
    """
    if not user_profile:
        return {
            'has_permissions': False,
            'permissions': [],
            'role': None,
            'is_superadmin': False
        }
    
    permissions = []
    if user_profile.user_permissions.exists():
        permissions = list(user_profile.user_permissions.select_related('permission').values(
            'permission__code',
            'permission__name',
            'permission__description',
            'is_role_based'
        ))
    
    return {
        'has_permissions': True,
        'permissions': permissions,
        'role': {
            'id': user_profile.role.id,
            'name': user_profile.role.name,
            'is_superadmin': user_profile.role.is_superadmin
        } if user_profile.role else None,
        'is_superadmin': user_profile.role.is_superadmin if user_profile.role else False
    }


def get_user_school(request):
    """
    Obtains the logged-in user's school from their profile.
    Returns schools.models.School instance or None.
    """
    if not request or not request.user or not request.user.is_authenticated:
        return None
    
    # 1. Try resolving via request.user.profile.school property
    try:
        profile = getattr(request.user, 'profile', None)
        if profile:
            school = getattr(profile, 'school', None)
            if school:
                return school
    except Exception:
        pass
            
    # 2. Fallback: Try looking up School owned by request.user
    try:
        from schools.models import School
        return School.objects.filter(owner=request.user).first()
    except Exception:
        pass
        
    return None


def filter_by_school(queryset, request, school_field_path='school'):
    """
    Filters a queryset by the school of the logged-in user.
    
    Args:
        queryset: Django QuerySet
        request: HTTP Request object
        school_field_path: The lookup path to the school field or school relation in the model.
                           e.g., 'school', 'campus__school', 'class_obj__campus__school'.
                           If the model is School itself, set to 'self' or None.
    """
    school = get_user_school(request)
    if not school:
        return queryset
        
    if school_field_path == 'self' or school_field_path is None:
        return queryset.filter(id=school.id)
        
    return queryset.filter(**{school_field_path: school})


from rest_framework.filters import BaseFilterBackend

class SchoolFilterBackend(BaseFilterBackend):
    """
    A filter backend that automatically filters querysets to only return items 
    associated with the logged-in user's school.
    """
    def filter_queryset(self, request, queryset, view):
        # Allow specifying a custom school field path in the view, e.g., school_field_path = 'campus__school'
        school_field_path = getattr(view, 'school_field_path', 'school')
        return filter_by_school(queryset, request, school_field_path=school_field_path)