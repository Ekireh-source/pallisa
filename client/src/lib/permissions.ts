import React from 'react';
import { useAppSelector } from '@/store';
import { User, Permission, UserPermission } from '@/types';

export interface UserPermissions {
  has_permissions: boolean;
  permissions: Permission[];
  role: {
    id: number;
    name: string;
    is_superadmin: boolean;
  } | null;
  is_superadmin: boolean;
}

/**
 * Hook to get user permissions from Redux store
 */
export const useUserPermissions = (): UserPermissions => {
  const { user } = useAppSelector((state) => state.auth);
  
  if (!user) {
    return {
      has_permissions: false,
      permissions: [],
      role: null,
      is_superadmin: false
    };
  }

  // If user has a superadmin role, they have all permissions
  if (user.role?.is_superadmin) {
    return {
      has_permissions: true,
      permissions: [], // SuperAdmin has all permissions implicitly
      role: {
        id: user.role.id,
        name: user.role.name,
        is_superadmin: true
      },
      is_superadmin: true
    };
  }

  // Get user's direct permissions
  const permissions: Permission[] = user.user_permissions?.map(up => ({
    id: 0, // We don't have the permission ID in UserPermission
    code: up.code,
    name: up.name,
    description: '',
    category: {
      id: 0,
      code: '',
      name: '',
      description: '',
      is_admin: false
    }
  })) || [];

  console.log("permissions", permissions);
  
  return {
    has_permissions: true,
    permissions,
    role: user.role ? {
      id: user.role.id,
      name: user.role.name,
      is_superadmin: user.role.is_superadmin
    } : null,
    is_superadmin: user.role?.is_superadmin || false
  };
};

/**
 * Hook to check if user has a specific permission
 */
export const useHasPermission = (permissionCode: string): boolean => {
  const userPermissions = useUserPermissions();
  
  // SuperAdmin has all permissions
  if (userPermissions.is_superadmin) {
    return true;
  }
  
  // Check if user has the specific permission
  return userPermissions.permissions.some(perm => perm.code === permissionCode);
};

/**
 * Hook to check if user has any of the specified permissions
 */
export const useHasAnyPermission = (permissionCodes: string[]): boolean => {
  const userPermissions = useUserPermissions();
  
  // SuperAdmin has all permissions
  if (userPermissions.is_superadmin) {
    return true;
  }
  
  // Check if user has any of the specified permissions
  return permissionCodes.some(code => 
    userPermissions.permissions.some(perm => perm.code === code)
  );
};

/**
 * Hook to check if user has all of the specified permissions
 */
export const useHasAllPermissions = (permissionCodes: string[]): boolean => {
  const userPermissions = useUserPermissions();
  
  // SuperAdmin has all permissions
  if (userPermissions.is_superadmin) {
    return true;
  }
  
  // Check if user has all of the specified permissions
  return permissionCodes.every(code => 
    userPermissions.permissions.some(perm => perm.code === code)
  );
};

/**
 * Component wrapper that only renders children if user has the required permission
 */
export const RequirePermission: React.FC<{
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, children, fallback = null }) => {
  const hasPermission = useHasPermission(permission);
  
  if (!hasPermission) {
    return React.createElement(React.Fragment, null, fallback);
  }
  
  return React.createElement(React.Fragment, null, children);
};

/**
 * Component wrapper that only renders children if user has any of the required permissions
 */
export const RequireAnyPermission: React.FC<{
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permissions, children, fallback = null }) => {
  const hasAnyPermission = useHasAnyPermission(permissions);
  
  if (!hasAnyPermission) {
    return React.createElement(React.Fragment, null, fallback);
  }
  
  return React.createElement(React.Fragment, null, children);
};

/**
 * Component wrapper that only renders children if user has all of the required permissions
 */
export const RequireAllPermissions: React.FC<{
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permissions, children, fallback = null }) => {
  const hasAllPermissions = useHasAllPermissions(permissions);
  
  if (!hasAllPermissions) {
    return React.createElement(React.Fragment, null, fallback);
  }
  
  return React.createElement(React.Fragment, null, children);
};

/**
 * Utility function to check permissions outside of React components
 */
export const checkPermission = (user: User | null, permissionCode: string): boolean => {
  if (!user) return false;
  
  // SuperAdmin has all permissions
  if (user.role?.is_superadmin) {
    return true;
  }
  
  // Check if user has the specific permission
  return user.user_permissions?.some((up: UserPermission) => up.code === permissionCode) || false;
};

/**
 * Utility function to check if user has any of the specified permissions
 */
export const checkAnyPermission = (user: User | null, permissionCodes: string[]): boolean => {
  if (!user) return false;
  
  // SuperAdmin has all permissions
  if (user.role?.is_superadmin) {
    return true;
  }
  
  // Check if user has any of the specified permissions
  return permissionCodes.some(code => 
    user.user_permissions?.some((up: UserPermission) => up.code === code)
  ) || false;
};

/**
 * Utility function to check if user has all of the specified permissions
 */
export const checkAllPermissions = (user: User | null, permissionCodes: string[]): boolean => {
  if (!user) return false;
  
  // SuperAdmin has all permissions
  if (user.role?.is_superadmin) {
    return true;
  }
  
  // Check if user has all of the specified permissions
  return permissionCodes.every(code => 
    user.user_permissions?.some((up: UserPermission) => up.code === code)
  ) || false;
};

/**
 * Permission constants for easy reference
 */
export const PERMISSIONS = {
  // Admin permissions
  ADMIN: {
    MANAGE_ROLES: 'admin.manage_roles',
    MANAGE_PERMISSIONS: 'admin.manage_permissions',
    MANAGE_USERS: 'admin.manage_users',
    MANAGE_SALARIES: 'admin.manage_salaries',
    VIEW_USERS: 'admin.view_users',
    EDIT_USERS: 'admin.edit_users',
    DELETE_USERS: 'admin.delete_users',
    VIEW_DOCUMENTS: 'admin.view_documents',
    CREATE_DOCUMENTS: 'admin.create_documents',
    EDIT_DOCUMENTS: 'admin.edit_documents',
    DELETE_DOCUMENTS: 'admin.delete_documents',
    VIEW_REPORTS: 'admin.view_reports',
  },
  
  // Student permissions
  STUDENTS: {
    VIEW_STUDENTS: 'students.view_students',
    CREATE_STUDENT: 'students.create_student',
    EDIT_STUDENT: 'students.edit_student',
    DELETE_STUDENT: 'students.delete_student',
  },
  
  // Teacher permissions
  TEACHERS: {
    VIEW_TEACHERS: 'teachers.view_teachers',
    CREATE_TEACHER: 'teachers.create_teacher',
    EDIT_TEACHER: 'teachers.edit_teacher',
    DELETE_TEACHER: 'teachers.delete_teacher',
  },
  
  // Expense permissions
  EXPENSES: {
    VIEW_EXPENSES: 'expenses.view_expenses',
    CREATE_EXPENSE: 'expenses.create_expense',
    EDIT_EXPENSE: 'expenses.edit_expense',
    DELETE_EXPENSE: 'expenses.delete_expense',
    APPROVE_EXPENSE: 'expenses.approve_expense',
  },
  
  // Fee permissions
  FEES: {
    VIEW_FEES: 'fees.view_fees',
    CREATE_FEE: 'fees.create_fee',
    EDIT_FEE: 'fees.edit_fee',
    DELETE_FEE: 'fees.delete_fee',
  },
  
  // Salary permissions
  SALARY: {
    VIEW_SALARY_PERIODS: 'salary.view_salary_periods',
    MANAGE_SALARY_PERIODS: 'salary.manage_salary_periods',
    VIEW_ALLOWANCES: 'salary.view_allowances',
    MANAGE_ALLOWANCES: 'salary.manage_allowances',
    VIEW_DEDUCTIONS: 'salary.view_deductions',
    MANAGE_DEDUCTIONS: 'salary.manage_deductions',
    VIEW_PAYMENTS: 'salary.view_payments',
    MANAGE_PAYMENTS: 'salary.manage_payments',
    VIEW_SUMMARIES: 'salary.view_summaries',
    VIEW_STAFF_SALARIES: 'salary.view_staff_salaries',
    PROCESS_PAYMENTS: 'salary.process_payments',
  },
  
  // Report permissions
  REPORTS: {
    VIEW_REPORTS: 'reports.view_reports',
    EXPORT_REPORTS: 'reports.export_reports',
  },
} as const;

/**
 * Permission groups for common operations
 */
export const PERMISSION_GROUPS = {
  // Full admin access
  FULL_ADMIN: [
    PERMISSIONS.ADMIN.MANAGE_ROLES,
    PERMISSIONS.ADMIN.MANAGE_PERMISSIONS,
    PERMISSIONS.ADMIN.MANAGE_USERS,
    PERMISSIONS.ADMIN.VIEW_DOCUMENTS,
    PERMISSIONS.ADMIN.VIEW_REPORTS,
  ],
  
  // Student management
  STUDENT_MANAGEMENT: [
    PERMISSIONS.STUDENTS.VIEW_STUDENTS,
    PERMISSIONS.STUDENTS.CREATE_STUDENT,
    PERMISSIONS.STUDENTS.EDIT_STUDENT,
    PERMISSIONS.STUDENTS.DELETE_STUDENT,
  ],
  
  // Teacher management
  TEACHER_MANAGEMENT: [
    PERMISSIONS.TEACHERS.VIEW_TEACHERS,
    PERMISSIONS.TEACHERS.CREATE_TEACHER,
    PERMISSIONS.TEACHERS.EDIT_TEACHER,
    PERMISSIONS.TEACHERS.DELETE_TEACHER,
  ],
  
  // Expense management
  EXPENSE_MANAGEMENT: [
    PERMISSIONS.EXPENSES.VIEW_EXPENSES,
    PERMISSIONS.EXPENSES.CREATE_EXPENSE,
    PERMISSIONS.EXPENSES.EDIT_EXPENSE,
    PERMISSIONS.EXPENSES.DELETE_EXPENSE,
    PERMISSIONS.EXPENSES.APPROVE_EXPENSE,
  ],
  
  // Fee management
  FEE_MANAGEMENT: [
    PERMISSIONS.FEES.VIEW_FEES,
    PERMISSIONS.FEES.CREATE_FEE,
    PERMISSIONS.FEES.EDIT_FEE,
    PERMISSIONS.FEES.DELETE_FEE,
  ],
  
  // Salary management
  SALARY_MANAGEMENT: [
    PERMISSIONS.SALARY.VIEW_SALARY_PERIODS,
    PERMISSIONS.SALARY.MANAGE_SALARY_PERIODS,
    PERMISSIONS.SALARY.VIEW_ALLOWANCES,
    PERMISSIONS.SALARY.MANAGE_ALLOWANCES,
    PERMISSIONS.SALARY.VIEW_DEDUCTIONS,
    PERMISSIONS.SALARY.MANAGE_DEDUCTIONS,
    PERMISSIONS.SALARY.VIEW_PAYMENTS,
    PERMISSIONS.SALARY.MANAGE_PAYMENTS,
    PERMISSIONS.SALARY.VIEW_SUMMARIES,
    PERMISSIONS.SALARY.VIEW_STAFF_SALARIES,
    PERMISSIONS.SALARY.PROCESS_PAYMENTS,
  ],
  
  // Report access
  REPORT_ACCESS: [
    PERMISSIONS.REPORTS.VIEW_REPORTS,
    PERMISSIONS.REPORTS.EXPORT_REPORTS,
  ],
} as const; 