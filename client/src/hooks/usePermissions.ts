import { useAppSelector } from '@/store';
import { hasPermission, hasAnyPermission, hasAllPermissions, canAccessSection, canAccessItem } from '@/lib/permissions';

/**
 * Hook to check if user has a specific permission
 */
export const useHasPermission = (permissionCode: string): boolean => {
  const { user } = useAppSelector((state) => state.auth);
  return hasPermission(user, permissionCode);
};

/**
 * Hook to check if user has any of the specified permissions
 */
export const useHasAnyPermission = (permissionCodes: readonly string[]): boolean => {
  const { user } = useAppSelector((state) => state.auth);
  return hasAnyPermission(user, permissionCodes);
};

/**
 * Hook to check if user has all of the specified permissions
 */
export const useHasAllPermissions = (permissionCodes: readonly string[]): boolean => {
  const { user } = useAppSelector((state) => state.auth);
  return hasAllPermissions(user, permissionCodes);
};

/**
 * Hook to check if user can access a specific section
 */
export const useCanAccessSection = (section: keyof typeof import('@/lib/permissions').PERMISSION_GROUPS): boolean => {
  const { user } = useAppSelector((state) => state.auth);
  return canAccessSection(user, section);
};

/**
 * Hook to check if user can access a specific item
 */
export const useCanAccessItem = (permissionCode: string): boolean => {
  const { user } = useAppSelector((state) => state.auth);
  return canAccessItem(user, permissionCode);
};

/**
 * Hook to get current user
 */
export const useCurrentUser = () => {
  const { user } = useAppSelector((state) => state.auth);
  return user;
};

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated;
};

/**
 * Hook to check if user is super admin
 */
export const useIsSuperAdmin = (): boolean => {
  const { user } = useAppSelector((state) => state.auth);
  return user?.role?.is_superadmin || false;
}; 