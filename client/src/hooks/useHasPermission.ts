import { useAppSelector } from '@/store';

export const useHasPermission = (permissionCode: string): boolean => {
  const { user } = useAppSelector((state) => state.auth);
  
  // If no user, no permissions
  if (!user) {
    return false;
  }
  
  // Super admin role has all permissions
  if (user.role?.is_superadmin) {
    return true;
  }
  
  // Check if user has the specific permission
  // This would need to be implemented based on your permission checking logic
  // For now, we'll check user type for basic access control
  if (permissionCode.startsWith('admin.')) {
    return user.user_type === 'admin' || user.user_type === 'school_owner';
  }
  
  // Add more specific permission checks as needed
  return false;
}; 