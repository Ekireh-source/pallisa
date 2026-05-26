import { store } from '@/store';
import { User, Permission } from '@/types';
import { PERMISSION_CODES } from '@/codes';

/**
 * Check if user has a specific permission
 */
export function hasPermission(permissionCode: PERMISSION_CODES | PERMISSION_CODES[]): boolean {
	try {
		const state = store.getState();
		const userData = state.auth?.user.value;
		const temporaryPermissions = state.auth?.temporaryPermissions || [];

		if (!userData) return false;

		// 1. Superuser Check - Automatic full access
		if (userData.role?.name === "SuperAdmin" || userData.role?.is_superadmin) {
			return true;
		}

		// 2. Check Temporary Permissions
		const tempPermissionCodes = temporaryPermissions.map((p) => p.code);
		const hasTemporaryPermission = Array.isArray(permissionCode)
			? permissionCode.every((code) => tempPermissionCodes.includes(code))
			: tempPermissionCodes.includes(permissionCode);

		if (hasTemporaryPermission) {
			return true;
		}

		// 3. Check User regular permissions
		const userPermissions = userData.user_permissions ?? [];
		const userPermissionCodes = userPermissions.map((p) => p.code);

		const hasPermissions = Array.isArray(permissionCode)
			? permissionCode.every((p) => userPermissionCodes.includes(p)) // ALL must match
			: userPermissionCodes.includes(permissionCode);

		return hasPermissions;
	} catch (error) {
		console.warn("Error checking permission:", error);
		return false;
	}
}

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (permissionCodes: readonly PERMISSION_CODES[]): boolean => {
  return permissionCodes.some(code => hasPermission(code));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (permissionCodes: readonly PERMISSION_CODES[]): boolean => {
  return permissionCodes.every(code => hasPermission(code));
};

/**
 * Permission codes for different sections
 */


/**
 * Permission groups for sidebar sections
 */
export const PERMISSION_GROUPS = {
  // Expense Management
  EXPENSE_MANAGEMENT: [
    PERMISSION_CODES.VIEW_EXPENSES,
    PERMISSION_CODES.VIEW_CATEGORIES,
    PERMISSION_CODES.VIEW_DEPARTMENTS,
    PERMISSION_CODES.VIEW_VENDORS,
    PERMISSION_CODES.VIEW_TERMS,
    PERMISSION_CODES.VIEW_ACADEMIC_YEARS,
  ],
  
  // Fees Management
  FEES_MANAGEMENT: [
    PERMISSION_CODES.VIEW_FEES,
    PERMISSION_CODES.VIEW_FEE_CATEGORIES,
    PERMISSION_CODES.VIEW_FEE_STRUCTURES,
    PERMISSION_CODES.VIEW_FEE_PAYMENTS,
    PERMISSION_CODES.VIEW_FEE_BALANCES,
    PERMISSION_CODES.VIEW_FEE_SUMMARIES,
    PERMISSION_CODES.VIEW_SCHOLARSHIPS,
  ],
  
  // Members Management
  MEMBERS_MANAGEMENT: [
    PERMISSION_CODES.VIEW_STUDENTS,
    PERMISSION_CODES.VIEW_TEACHERS,
    PERMISSION_CODES.VIEW_NON_STAFF,
    PERMISSION_CODES.VIEW_PARENTS,
    PERMISSION_CODES.VIEW_CLASSES,
    PERMISSION_CODES.VIEW_STREAMS,
    PERMISSION_CODES.VIEW_SUBJECTS,
  ],
  
  // Salary Management
  SALARY_MANAGEMENT: [
    PERMISSION_CODES.VIEW_SALARIES,
    PERMISSION_CODES.VIEW_SALARY_PERIODS,
    PERMISSION_CODES.VIEW_SALARY_ALLOWANCES,
    PERMISSION_CODES.VIEW_SALARY_DEDUCTIONS,
    PERMISSION_CODES.VIEW_SALARY_PAYMENTS,
    PERMISSION_CODES.VIEW_SALARY_REPORTS,
    PERMISSION_CODES.VIEW_SALARY_SETTINGS,
  ],
  
  // System Administration
  SYSTEM_ADMIN: [
    PERMISSION_CODES.MANAGE_ROLES,
    PERMISSION_CODES.VIEW_PERMISSIONS,
  ],
  
  // Reports
  REPORTS: [
    PERMISSION_CODES.VIEW_REPORTS,
    PERMISSION_CODES.EXPORT_REPORTS,
  ],
  
  // Grading
  GRADING: [
    PERMISSION_CODES.VIEW_GRADING,
    PERMISSION_CODES.MANAGE_GRADING,
  ],
} as const;

/**
 * Check if user can access a specific section
 */
export const canAccessSection = (section: keyof typeof PERMISSION_GROUPS): boolean => {
  const permissions = PERMISSION_GROUPS[section];
  return hasAnyPermission(permissions);
};

/**
 * Check if user can access a specific item within a section
 */
export const canAccessItem = (permissionCode: PERMISSION_CODES): boolean => {
  return hasPermission(permissionCode);
}; 