from functools import wraps
from django.http import HttpResponseForbidden
from django.shortcuts import redirect
from django.urls import reverse
from django.conf import settings
from rest_framework.permissions import BasePermission
from rest_framework import permissions

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
        return user_profile.has_permission(permission_required)