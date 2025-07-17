import logging
from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import reverse
from django.conf import settings
from .permission import check_user_permissions

logger = logging.getLogger(__name__)

class PermissionMiddleware:
    """
    Middleware to check permissions for all requests.
    This middleware can be used to enforce permissions at the middleware level.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Define permission requirements for different URL patterns
        self.permission_map = {
            # Admin routes
            '/api/accounts/roles/': 'admin.manage_roles',
            '/api/accounts/permissions/': 'admin.manage_permissions',
            '/api/accounts/user-permissions/': 'admin.manage_permissions',
            
            # User management routes
            '/api/accounts/profiles/': 'admin.manage_users',
            
            # Document routes
            '/api/accounts/documents/': 'admin.view_documents',
            
            # Student routes
            '/api/members/students/': 'students.view_students',
            
            # Teacher routes
            '/api/members/teachers/': 'teachers.view_teachers',
            
            # Expense routes
            '/api/expenses/': 'expenses.view_expenses',
            
            # Fee routes
            '/api/fees/': 'fees.view_fees',
            
            # Report routes
            '/api/reports/': 'reports.view_reports',
        }
        
        # Define public routes that don't require authentication
        self.public_routes = [
            '/api/accounts/login/',
            '/api/accounts/register/',
            '/api/accounts/verify-email/',
            '/api/accounts/resend-verification/',
            '/api/accounts/forgot-password/',
            '/api/accounts/reset-password/',
            '/api/accounts/validate-reset-token/',
            '/api/auth/token/refresh/',
        ]
    
    def __call__(self, request):
        # Check if this is a public route
        if any(request.path.startswith(route) for route in self.public_routes):
            return self.get_response(request)
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            if request.path.startswith('/api/'):
                return JsonResponse({
                    'error': 'Authentication required',
                    'code': 'AUTHENTICATION_REQUIRED'
                }, status=401)
            else:
                return redirect('login')
        
        # Check if user has a profile
        if not hasattr(request.user, 'profile'):
            if request.path.startswith('/api/'):
                return JsonResponse({
                    'error': 'User profile not found',
                    'code': 'PROFILE_NOT_FOUND'
                }, status=403)
            else:
                return JsonResponse({
                    'error': 'User profile not found'
                }, status=403)
        
        # Get user profile
        user_profile = request.user.profile
        
        # SuperAdmin has all permissions
        if user_profile.role and user_profile.role.is_superadmin:
            return self.get_response(request)
        
        # Check permissions for the current path
        required_permission = self.get_required_permission(request.path, request.method)
        
        if required_permission:
            has_permission, missing_permissions = check_user_permissions(user_profile, required_permission)
            
            if not has_permission:
                logger.warning(
                    f"User {user_profile} attempted to access {request.path} "
                    f"without permission {required_permission}"
                )
                
                if request.path.startswith('/api/'):
                    return JsonResponse({
                        'error': 'Permission denied',
                        'required_permission': required_permission,
                        'code': 'PERMISSION_DENIED'
                    }, status=403)
                else:
                    return JsonResponse({
                        'error': 'Permission denied'
                    }, status=403)
        
        return self.get_response(request)
    
    def get_required_permission(self, path, method):
        """
        Get the required permission for a given path and HTTP method.
        """
        # Check exact path match first
        if path in self.permission_map:
            return self.permission_map[path]
        
        # Check prefix matches
        for route, permission in self.permission_map.items():
            if path.startswith(route):
                return permission
        
        # No permission required for this path
        return None

class APIPermissionMiddleware:
    """
    Simplified middleware for API-only permission checking.
    This middleware only affects API routes and is less intrusive.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Define API routes that require specific permissions
        self.api_permission_map = {
            # Admin routes
            '/api/accounts/roles/': 'admin.manage_roles',
            '/api/accounts/permissions/': 'admin.manage_permissions',
            '/api/accounts/user-permissions/': 'admin.manage_permissions',
            
            # User management routes
            '/api/accounts/profiles/': 'admin.manage_users',
            
            # Document routes
            '/api/accounts/documents/': 'admin.view_documents',
            
            # Student routes
            '/api/members/students/': 'students.view_students',
            
            # Teacher routes
            '/api/members/teachers/': 'teachers.view_teachers',
            
            # Expense routes
            '/api/expenses/': 'expenses.view_expenses',
            
            # Fee routes
            '/api/fees/': 'fees.view_fees',
            
            # Report routes
            '/api/reports/': 'reports.view_reports',
        }
        
        # Define public API routes
        self.public_api_routes = [
            '/api/accounts/login/',
            '/api/accounts/register/',
            '/api/accounts/verify-email/',
            '/api/accounts/resend-verification/',
            '/api/accounts/forgot-password/',
            '/api/accounts/reset-password/',
            '/api/accounts/validate-reset-token/',
            '/api/auth/token/refresh/',
        ]
    
    def __call__(self, request):
        # Only process API routes
        if not request.path.startswith('/api/'):
            return self.get_response(request)
        
        # Check if this is a public API route
        if any(request.path.startswith(route) for route in self.public_api_routes):
            return self.get_response(request)
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return JsonResponse({
                'error': 'Authentication required',
                'code': 'AUTHENTICATION_REQUIRED'
            }, status=401)
        
        # Check if user has a profile
        if not hasattr(request.user, 'profile'):
            return JsonResponse({
                'error': 'User profile not found',
                'code': 'PROFILE_NOT_FOUND'
            }, status=403)
        
        # Get user profile
        user_profile = request.user.profile
        
        # SuperAdmin has all permissions
        if user_profile.role and user_profile.role.is_superadmin:
            return self.get_response(request)
        
        # Check permissions for the current path
        required_permission = self.get_required_permission(request.path)
        
        if required_permission:
            has_permission, missing_permissions = check_user_permissions(user_profile, required_permission)
            
            if not has_permission:
                logger.warning(
                    f"User {user_profile} attempted to access {request.path} "
                    f"without permission {required_permission}"
                )
                
                return JsonResponse({
                    'error': 'Permission denied',
                    'required_permission': required_permission,
                    'code': 'PERMISSION_DENIED'
                }, status=403)
        
        return self.get_response(request)
    
    def get_required_permission(self, path):
        """
        Get the required permission for a given API path.
        """
        # Check exact path match first
        if path in self.api_permission_map:
            return self.api_permission_map[path]
        
        # Check prefix matches
        for route, permission in self.api_permission_map.items():
            if path.startswith(route):
                return permission
        
        # No permission required for this path
        return None 