import { User, Permission } from '@/types';

/**
 * Check if user has a specific permission
 */
export const hasPermission = (user: User | null, permissionCode: string): boolean => {
  if (!user) return false;
  
  // Super admin has all permissions
  if (user.role?.is_superadmin) return true;
  
  // Check role-based permissions
  if (user.role?.permissions) {
    const hasRolePermission = user.role.permissions.some(
      (permission: Permission) => permission.code === permissionCode
    );
    if (hasRolePermission) return true;
  }
  
  // Check user-specific permissions
  if (user.user_permissions) {
    const hasUserPermission = user.user_permissions.some(
      (userPermission) => userPermission.code === permissionCode
    );
    if (hasUserPermission) return true;
  }
  
  return false;
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (user: User | null, permissionCodes: readonly string[]): boolean => {
  return permissionCodes.some(code => hasPermission(user, code));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (user: User | null, permissionCodes: readonly string[]): boolean => {
  return permissionCodes.every(code => hasPermission(user, code));
};

/**
 * Permission codes for different sections
 */
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'admin.access_dashboard',
  
  // Expense Management
  VIEW_EXPENSES: 'expenses.view_expenses',
  CREATE_EXPENSES: 'expenses.manage_expenses',
  EDIT_EXPENSES: 'expenses.manage_expenses',
  DELETE_EXPENSES: 'expenses.manage_expenses',
  APPROVE_EXPENSES: 'expenses.approve_expenses',
  
  VIEW_CATEGORIES: 'expenses.view_categories',
  MANAGE_CATEGORIES: 'expenses.manage_categories',
  
  VIEW_DEPARTMENTS: 'expenses.view_departments',
  MANAGE_DEPARTMENTS: 'expenses.manage_departments',
  
  VIEW_VENDORS: 'expenses.view_vendors',
  MANAGE_VENDORS: 'expenses.manage_vendors',
  
  VIEW_TERMS: 'expenses.view_terms',
  MANAGE_TERMS: 'expenses.manage_terms',
  
  VIEW_ACADEMIC_YEARS: 'expenses.view_academic_years',
  MANAGE_ACADEMIC_YEARS: 'expenses.manage_academic_years',
  
  // Fees Management
  VIEW_FEES: 'fees.view_fee_categories',
  MANAGE_FEES: 'fees.manage_fee_categories',
  VIEW_FEE_CATEGORIES: 'fees.view_fee_categories',
  MANAGE_FEE_CATEGORIES: 'fees.manage_fee_categories',
  VIEW_FEE_STRUCTURES: 'fees.view_fee_structures',
  MANAGE_FEE_STRUCTURES: 'fees.manage_fee_structures',
  VIEW_FEE_PAYMENTS: 'fees.view_payments',
  MANAGE_FEE_PAYMENTS: 'fees.manage_payments',
  VIEW_FEE_BALANCES: 'fees.view_fee_balances',
  VIEW_FEE_SUMMARIES: 'fees.view_collection_summaries',
  VIEW_SCHOLARSHIPS: 'fees.view_scholarships',
  MANAGE_SCHOLARSHIPS: 'fees.manage_scholarships',
  
  // Members Management
  VIEW_STUDENTS: 'members.view_students',
  MANAGE_STUDENTS: 'members.manage_students',
  BULK_UPLOAD_STUDENTS: 'members.bulk_upload_students',
  
  VIEW_TEACHERS: 'members.view_teachers',
  MANAGE_TEACHERS: 'members.manage_teachers',
  BULK_UPLOAD_TEACHERS: 'members.bulk_upload_teachers',
  
  VIEW_NON_STAFF: 'members.view_non_staff',
  MANAGE_NON_STAFF: 'members.manage_non_staff',
  BULK_UPLOAD_NON_STAFF: 'members.bulk_upload_non_staff',
  
  VIEW_PARENTS: 'members.view_parents',
  MANAGE_PARENTS: 'members.manage_parents',
  
  VIEW_CLASSES: 'members.view_classes',
  MANAGE_CLASSES: 'members.manage_classes',
  
  VIEW_STREAMS: 'members.view_streams',
  MANAGE_STREAMS: 'members.manage_streams',
  
  VIEW_SUBJECTS: 'members.view_subjects',
  MANAGE_SUBJECTS: 'members.manage_subjects',
  
  // Salary Management
  VIEW_SALARIES: 'salary.view_salary_periods',
  MANAGE_SALARIES: 'admin.manage_salaries',
  VIEW_SALARY_PERIODS: 'salary.view_salary_periods',
  MANAGE_SALARY_PERIODS: 'salary.manage_salary_periods',
  VIEW_SALARY_ALLOWANCES: 'salary.view_allowances',
  MANAGE_SALARY_ALLOWANCES: 'salary.manage_allowances',
  VIEW_SALARY_DEDUCTIONS: 'salary.view_deductions',
  MANAGE_SALARY_DEDUCTIONS: 'salary.manage_deductions',
  VIEW_SALARY_PAYMENTS: 'salary.view_payments',
  MANAGE_SALARY_PAYMENTS: 'salary.manage_payments',
  VIEW_SALARY_REPORTS: 'salary.view_summaries',
  VIEW_SALARY_SETTINGS: 'salary.view_staff_salaries',
  
  // System Administration
  VIEW_ROLES: 'admin.view_roles',
  MANAGE_ROLES: 'admin.manage_roles',
  VIEW_PERMISSIONS: 'admin.view_permissions',
  MANAGE_PERMISSIONS: 'admin.manage_permissions',
} as const;

/**
 * Permission groups for sidebar sections
 */
export const PERMISSION_GROUPS = {
  // Expense Management
  EXPENSE_MANAGEMENT: [
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.VIEW_CATEGORIES,
    PERMISSIONS.VIEW_DEPARTMENTS,
    PERMISSIONS.VIEW_VENDORS,
    PERMISSIONS.VIEW_TERMS,
    PERMISSIONS.VIEW_ACADEMIC_YEARS,
  ],
  
  // Fees Management
  FEES_MANAGEMENT: [
    PERMISSIONS.VIEW_FEES,
    PERMISSIONS.VIEW_FEE_CATEGORIES,
    PERMISSIONS.VIEW_FEE_STRUCTURES,
    PERMISSIONS.VIEW_FEE_PAYMENTS,
    PERMISSIONS.VIEW_FEE_BALANCES,
    PERMISSIONS.VIEW_FEE_SUMMARIES,
    PERMISSIONS.VIEW_SCHOLARSHIPS,
  ],
  
  // Members Management
  MEMBERS_MANAGEMENT: [
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.VIEW_TEACHERS,
    PERMISSIONS.VIEW_NON_STAFF,
    PERMISSIONS.VIEW_PARENTS,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.VIEW_STREAMS,
    PERMISSIONS.VIEW_SUBJECTS,
  ],
  
  // Salary Management
  SALARY_MANAGEMENT: [
    PERMISSIONS.VIEW_SALARIES,
    PERMISSIONS.VIEW_SALARY_PERIODS,
    PERMISSIONS.VIEW_SALARY_ALLOWANCES,
    PERMISSIONS.VIEW_SALARY_DEDUCTIONS,
    PERMISSIONS.VIEW_SALARY_PAYMENTS,
    PERMISSIONS.VIEW_SALARY_REPORTS,
    PERMISSIONS.VIEW_SALARY_SETTINGS,
  ],
  
  // System Administration
  SYSTEM_ADMIN: [
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_PERMISSIONS,
  ],
} as const;

/**
 * Check if user can access a specific section
 */
export const canAccessSection = (user: User | null, section: keyof typeof PERMISSION_GROUPS): boolean => {
  const permissions = PERMISSION_GROUPS[section];
  return hasAnyPermission(user, permissions);
};

/**
 * Check if user can access a specific item within a section
 */
export const canAccessItem = (user: User | null, permissionCode: string): boolean => {
  return hasPermission(user, permissionCode);
}; 