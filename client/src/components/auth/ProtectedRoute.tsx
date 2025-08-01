import React from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useHasPermission, useHasAnyPermission, useHasAllPermissions } from '@/hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: readonly string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * ProtectedRoute component that checks authentication and permissions
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  redirectTo = '/login',
}) => {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  
  // Always call hooks to avoid conditional hook calls
  const hasPermission = useHasPermission(permission || '');
  const hasAnyPermission = useHasAnyPermission(permissions || []);
  const hasAllPermissions = useHasAllPermissions(permissions || []);
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    return <>{fallback}</>;
  }

  // Check specific permission
  if (permission && !hasPermission) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    let hasRequiredPermissions = false;
    
    if (requireAll) {
      hasRequiredPermissions = hasAllPermissions;
    } else {
      hasRequiredPermissions = hasAnyPermission;
    }
    
    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

/**
 * Component that only renders children if user has the required permission
 */
export const RequirePermission: React.FC<{
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, children, fallback = null }) => {
  const hasPermission = useHasPermission(permission);
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

/**
 * Component that only renders children if user has any of the required permissions
 */
export const RequireAnyPermission: React.FC<{
  permissions: readonly string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permissions, children, fallback = null }) => {
  const hasAnyPermission = useHasAnyPermission(permissions);
  
  if (!hasAnyPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

/**
 * Component that only renders children if user has all of the required permissions
 */
export const RequireAllPermissions: React.FC<{
  permissions: readonly string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permissions, children, fallback = null }) => {
  const hasAllPermissions = useHasAllPermissions(permissions);
  
  if (!hasAllPermissions) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}; 