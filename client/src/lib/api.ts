import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

// Base API URL - can be configured via environment variable
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Store reference to logout function - will be set by AuthProvider
let logoutHandler: (() => void) | null = null;

export const setLogoutHandler = (handler: () => void) => {
  logoutHandler = handler;
};

// Response interceptor to handle token refresh and errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we have a refresh token, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          Cookies.set('access_token', access, { expires: 1 }); // 1 day
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return axiosInstance(originalRequest);
        } catch {
          // Refresh failed, clear tokens and trigger logout
          clearAuthTokens();
          if (logoutHandler) {
            logoutHandler();
          } else if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      } else {
        // No refresh token, trigger logout
        clearAuthTokens();
        if (logoutHandler) {
          logoutHandler();
        } else if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: '/accounts/register/',
  LOGIN: '/accounts/login/',
  LOGOUT: '/accounts/logout/',
  VERIFY_EMAIL: '/accounts/verify-email/',
  RESEND_VERIFICATION: '/accounts/resend-verification/',
  REFRESH_TOKEN: '/auth/token/refresh/',
  
  // User endpoints
  PROFILE: '/accounts/profile/',
  UPDATE_PROFILE: '/accounts/profile/update/',
  
  // Students endpoints
  STUDENTS: '/students/',
  
  // Fees endpoints
  FEES: '/fees/',
  FEE_DETAIL: (id: number) => `/fees/${id}/`,
  FEE_SUMMARY: '/fees/summary/',
  STUDENT_FEES: (studentId: number) => `/students/${studentId}/fees/`,
  
  // Expense Management endpoints
  EXPENSES: '/expenses/',
  EXPENSE_CREATE: '/expenses/create/',
  EXPENSE_DETAIL: (id: number) => `/expenses/${id}/`,
  EXPENSE_APPROVE: (id: number) => `/expenses/${id}/approve/`,
  EXPENSE_SUMMARY: '/expenses/summary/',
  
  // Expense Categories endpoints
  EXPENSE_CATEGORIES: '/expenses/categories/',
  EXPENSE_CATEGORY_DETAIL: (id: number) => `/expenses/categories/${id}/`,
  
  // Terms endpoints
  TERMS: '/expenses/terms/',
  TERM_DETAIL: (id: number) => `/expenses/terms/${id}/`,
  
  // Departments endpoints
  DEPARTMENTS: '/expenses/departments/',
  DEPARTMENT_DETAIL: (id: number) => `/expenses/departments/${id}/`,
  
  // Vendors endpoints
  VENDORS: '/expenses/vendors/',
  VENDOR_DETAIL: (id: number) => `/expenses/vendors/${id}/`,
  
  // Academic Years endpoints
  ACADEMIC_YEARS: '/expenses/academic-years/',
  ACADEMIC_YEAR_DETAIL: (id: number) => `/expenses/academic-years/${id}/`,
  
  // Reports endpoints
  REPORTS: '/reports/',
  INCOME_SUMMARY: '/reports/income/',
  EXPENSE_REPORTS: '/reports/expenses/',
  
  // Members endpoints
  MEMBERS_STUDENTS: '/members/students/',
  MEMBERS_TEACHERS: '/members/teachers/', 
  MEMBERS_PARENTS: '/members/parents/',
  MEMBERS_NON_STAFF: '/members/non-staff-members/',
  MEMBERS_CLASSES: '/members/classes/',
  MEMBERS_STREAMS: '/members/streams/',
  MEMBERS_SUBJECTS: '/members/subjects/',
  
  // Members detail endpoints
  STUDENT_DETAIL: (id: number) => `/members/students/${id}/`,
  TEACHER_DETAIL: (id: number) => `/members/teachers/${id}/`,
  PARENT_DETAIL: (id: number) => `/members/parents/${id}/`,
  NON_STAFF_DETAIL: (id: number) => `/members/non-staff-members/${id}/`,
  CLASS_DETAIL: (id: number) => `/members/classes/${id}/`,
  STREAM_DETAIL: (id: number) => `/members/streams/${id}/`,
  SUBJECT_DETAIL: (id: number) => `/members/subjects/${id}/`,
  
  // Members statistics and actions
  STUDENT_STATISTICS: '/members/student-statistics/',
  BULK_ASSIGN_TEACHERS: '/members/bulk-assign-teacher-subjects/',
  STUDENT_ASSIGN_STREAM: (id: number) => `/members/students/${id}/assign-stream/`,
  TEACHER_ASSIGNMENTS: (id: number) => `/members/teachers/${id}/assignments/`,
  PARENT_CHILDREN: (id: number) => `/members/parents/${id}/children/`,
  
  // Role and Permission Management endpoints
  ROLES: '/accounts/roles/',
  ROLE_DETAIL: (id: number) => `/accounts/roles/${id}/`,
  PERMISSIONS: '/accounts/permissions/',
  USER_PERMISSIONS: '/accounts/user-permissions/',
  ASSIGN_USER_PERMISSION: '/accounts/user-permissions/assign/',
  REMOVE_USER_PERMISSION: '/accounts/user-permissions/remove/',
} as const;

// Generic API functions
export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosInstance.get<T>(url, config);
  return response.data;
};

export const apiPost = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosInstance.post<T>(url, data, config);
  return response.data;
};

export const apiPut = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosInstance.put<T>(url, data, config);
  return response.data;
};

export const apiPatch = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosInstance.patch<T>(url, data, config);
  return response.data;
};

export const apiDelete = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosInstance.delete<T>(url, config);
  return response.data;
};

// Token management utilities
export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set('access_token', accessToken, { expires: 1, secure: true, sameSite: 'strict' });
  Cookies.set('refresh_token', refreshToken, { expires: 7, secure: true, sameSite: 'strict' });
};

export const getAuthTokens = () => {
  return {
    accessToken: Cookies.get('access_token'),
    refreshToken: Cookies.get('refresh_token'),
  };
};

export const clearAuthTokens = () => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
};

export const isAuthenticated = (): boolean => {
  const { accessToken } = getAuthTokens();
  return !!accessToken;
};

// Error parsing utility
export const parseApiError = (error: unknown): { message: string; fieldErrors: Record<string, string> } => {
  const fieldErrors: Record<string, string> = {};
  let message = 'An error occurred';

  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: unknown } };
    const data = axiosError.response?.data;

    if (data && typeof data === 'object') {
      // Handle field-specific errors (DRF format)
      if (!('error' in data) && !('message' in data)) {
        // This is likely a field errors object like { email: ["A user with this email already exists."] }
        Object.keys(data).forEach(field => {
          const fieldError = (data as Record<string, unknown>)[field];
          if (Array.isArray(fieldError)) {
            fieldErrors[field] = fieldError[0] as string; // Take the first error for each field
          } else if (typeof fieldError === 'string') {
            fieldErrors[field] = fieldError;
          }
        });
        
        // If we have field errors, create a general message
        if (Object.keys(fieldErrors).length > 0) {
          message = 'Please fix the errors below';
        }
      }
      
      // Handle general error messages
      if ('error' in data && typeof data.error === 'string') {
        message = data.error;
      } else if ('message' in data && typeof data.message === 'string') {
        message = data.message;
      } else if ('detail' in data && typeof data.detail === 'string') {
        message = data.detail;
      }
      
      // Handle non_field_errors
      if ('non_field_errors' in data && Array.isArray(data.non_field_errors)) {
        message = data.non_field_errors[0] as string;
      }
    }
  }

  return { message, fieldErrors };
};

// ==================== EXPENSE MANAGEMENT API FUNCTIONS ====================

import type {
  Expense,
  ExpenseDetail,
  ExpenseCreateUpdate,
  ExpenseCategory,
  Department,
  Vendor,
  Term,
  AcademicYear,
  ExpenseSummary,
  ExpenseFilters,
  MemberStudent,
  MemberTeacher,
  MemberParent,
  MemberClass,
  MemberStream,
  MemberSubject,
  StudentDetail,
  TeacherDetail,
  ParentDetail,
  ClassDetail,
  StreamDetail,
  SubjectDetail,
  StudentCreateUpdate,
  TeacherCreateUpdate,
  ParentCreateUpdate,
  ClassCreateUpdate,
  StreamCreateUpdate,
  SubjectCreateUpdate,
  StudentStatistics,
  TeacherAssignment,
  BulkTeacherAssignment,
  MemberFilters,
  NonStaffMember,
  NonStaffMemberCreateUpdate,
  Role,
  RoleCreateUpdate,
  Permission,
  PermissionCategory,
  UserPermission,
  RoleFilters,
} from '@/types';

// Expense Category API Functions
export const expenseCategoryApi = {
  getAll: async () => {
    const response = await apiGet<ExpenseCategory[]>(API_ENDPOINTS.EXPENSE_CATEGORIES);
    // Handle paginated response structure
    if (response && typeof response === 'object' && 'results' in response) {
      return (response as any).results || [];
    }
    // Fallback for direct array response
    return Array.isArray(response) ? response : [];
  },
  getById: (id: number) => apiGet<ExpenseCategory>(API_ENDPOINTS.EXPENSE_CATEGORY_DETAIL(id)),
  create: (data: Omit<ExpenseCategory, 'id' | 'created_at' | 'updated_at' | 'expense_count'>) => 
    apiPost<ExpenseCategory>(API_ENDPOINTS.EXPENSE_CATEGORIES, data),
  update: (id: number, data: Partial<Omit<ExpenseCategory, 'id' | 'created_at' | 'updated_at' | 'expense_count'>>) =>
    apiPut<ExpenseCategory>(API_ENDPOINTS.EXPENSE_CATEGORY_DETAIL(id), data),
  delete: (id: number) => apiDelete(API_ENDPOINTS.EXPENSE_CATEGORY_DETAIL(id)),
};

// Department API Functions
export const departmentApi = {
  getAll: async () => {
    const response = await apiGet<Department[]>(API_ENDPOINTS.DEPARTMENTS);
    // Handle paginated response structure
    if (response && typeof response === 'object' && 'results' in response) {
      return (response as any).results || [];
    }
    // Fallback for direct array response
    return Array.isArray(response) ? response : [];
  },
  getById: (id: number) => apiGet<Department>(API_ENDPOINTS.DEPARTMENT_DETAIL(id)),
  create: (data: Omit<Department, 'id' | 'created_at' | 'updated_at' | 'expense_count' | 'total_expenses'>) =>
    apiPost<Department>(API_ENDPOINTS.DEPARTMENTS, data),
  update: (id: number, data: Partial<Omit<Department, 'id' | 'created_at' | 'updated_at' | 'expense_count' | 'total_expenses'>>) =>
    apiPut<Department>(API_ENDPOINTS.DEPARTMENT_DETAIL(id), data),
  delete: (id: number) => apiDelete(API_ENDPOINTS.DEPARTMENT_DETAIL(id)),
};

// Vendor API Functions
export const vendorApi = {
  getAll: async () => {
    const response = await apiGet<Vendor[]>(API_ENDPOINTS.VENDORS);
    // Handle paginated response structure
    if (response && typeof response === 'object' && 'results' in response) {
      return (response as any).results || [];
    }
    // Fallback for direct array response
    return Array.isArray(response) ? response : [];
  },
  getById: (id: number) => apiGet<Vendor>(API_ENDPOINTS.VENDOR_DETAIL(id)),
  create: (data: Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'expense_count' | 'total_expenses'>) =>
    apiPost<Vendor>(API_ENDPOINTS.VENDORS, data),
  update: (id: number, data: Partial<Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'expense_count' | 'total_expenses'>>) =>
    apiPut<Vendor>(API_ENDPOINTS.VENDOR_DETAIL(id), data),
  delete: (id: number) => apiDelete(API_ENDPOINTS.VENDOR_DETAIL(id)),
};

// Academic Year API Functions
export const academicYearApi = {
  getAll: async () => {
    const response = await apiGet<AcademicYear[]>(API_ENDPOINTS.ACADEMIC_YEARS);
    // Handle paginated response structure
    if (response && typeof response === 'object' && 'results' in response) {
      return (response as any).results || [];
    }
    // Fallback for direct array response
    return Array.isArray(response) ? response : [];
  },
  getById: (id: number) => apiGet<AcademicYear>(API_ENDPOINTS.ACADEMIC_YEAR_DETAIL(id)),
  create: (data: Omit<AcademicYear, 'id' | 'created_at' | 'updated_at' | 'term_count' | 'duration_days'>) =>
    apiPost<AcademicYear>(API_ENDPOINTS.ACADEMIC_YEARS, data),
  update: (id: number, data: Partial<Omit<AcademicYear, 'id' | 'created_at' | 'updated_at' | 'term_count' | 'duration_days'>>) =>
    apiPut<AcademicYear>(API_ENDPOINTS.ACADEMIC_YEAR_DETAIL(id), data),
  delete: (id: number) => apiDelete(API_ENDPOINTS.ACADEMIC_YEAR_DETAIL(id)),
};

// Term API Functions
export const termApi = {
  getAll: async () => {
    const response = await apiGet<Term[]>(API_ENDPOINTS.TERMS);
    // Handle paginated response structure
    if (response && typeof response === 'object' && 'results' in response) {
      return (response as any).results || [];
    }
    // Fallback for direct array response
    return Array.isArray(response) ? response : [];
  },
  getById: (id: number) => apiGet<Term>(API_ENDPOINTS.TERM_DETAIL(id)),
  create: (data: Omit<Term, 'id' | 'created_at' | 'updated_at' | 'expense_count' | 'duration_days'>) =>
    apiPost<Term>(API_ENDPOINTS.TERMS, data),
  update: (id: number, data: Partial<Omit<Term, 'id' | 'created_at' | 'updated_at' | 'expense_count' | 'duration_days'>>) =>
    apiPut<Term>(API_ENDPOINTS.TERM_DETAIL(id), data),
  delete: (id: number) => apiDelete(API_ENDPOINTS.TERM_DETAIL(id)),
};

// Expense API Functions
export const expenseApi = {
  getAll: (filters?: ExpenseFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const url = params.toString() ? `${API_ENDPOINTS.EXPENSES}?${params.toString()}` : API_ENDPOINTS.EXPENSES;
    return apiGet<Expense[]>(url);
  },
  
  getById: (id: number) => apiGet<ExpenseDetail>(API_ENDPOINTS.EXPENSE_DETAIL(id)),
  
  create: (data: ExpenseCreateUpdate) => {
    const formData = new FormData();
    
    // Add all fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'receipt_image' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    return apiPost<ExpenseDetail>(API_ENDPOINTS.EXPENSE_CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  update: (id: number, data: Partial<ExpenseCreateUpdate>) => {
    const formData = new FormData();
    
    // Add all fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'receipt_image' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    return apiPut<ExpenseDetail>(API_ENDPOINTS.EXPENSE_DETAIL(id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  delete: (id: number) => apiDelete(API_ENDPOINTS.EXPENSE_DETAIL(id)),
  
  approve: (id: number, approved: boolean) =>
    apiPatch<ExpenseDetail>(API_ENDPOINTS.EXPENSE_APPROVE(id), { approved }),
  
  getSummary: (filters?: { year?: number; month?: number; term?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const url = params.toString() ? `${API_ENDPOINTS.EXPENSE_SUMMARY}?${params.toString()}` : API_ENDPOINTS.EXPENSE_SUMMARY;
    return apiGet<ExpenseSummary>(url);
  },
};

// ==================== MEMBERS MANAGEMENT API FUNCTIONS ====================

// Student API Functions
export const studentApi = {
  getAll: (filters?: MemberFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const url = params.toString() ? `${API_ENDPOINTS.MEMBERS_STUDENTS}?${params.toString()}` : API_ENDPOINTS.MEMBERS_STUDENTS;
    return apiGet<MemberStudent[]>(url);
  },
  
  getById: (id: number) => apiGet<StudentDetail>(API_ENDPOINTS.STUDENT_DETAIL(id)),
  
  create: (data: StudentCreateUpdate) => 
    apiPost<StudentDetail>(API_ENDPOINTS.MEMBERS_STUDENTS, data),
  
  update: (id: number, data: Partial<StudentCreateUpdate>) =>
    apiPut<StudentDetail>(API_ENDPOINTS.STUDENT_DETAIL(id), data),
  
  delete: (id: number) => apiDelete(API_ENDPOINTS.STUDENT_DETAIL(id)),
  
  restore: (id: number) => apiPatch<StudentDetail>(API_ENDPOINTS.STUDENT_DETAIL(id), {}),
  
  assignStream: (id: number, streamId: number) =>
    apiPost(API_ENDPOINTS.STUDENT_ASSIGN_STREAM(id), { stream_id: streamId }),
  
  getStatistics: () => apiGet<StudentStatistics>(API_ENDPOINTS.STUDENT_STATISTICS),
};

// Teacher API Functions
export const teacherApi = {
  getAll: (filters?: MemberFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const url = params.toString() ? `${API_ENDPOINTS.MEMBERS_TEACHERS}?${params.toString()}` : API_ENDPOINTS.MEMBERS_TEACHERS;
    return apiGet<MemberTeacher[]>(url);
  },
  
  getById: (id: number) => apiGet<TeacherDetail>(API_ENDPOINTS.TEACHER_DETAIL(id)),
  
  create: (data: TeacherCreateUpdate) => 
    apiPost<TeacherDetail>(API_ENDPOINTS.MEMBERS_TEACHERS, data),
  
  update: (id: number, data: Partial<TeacherCreateUpdate>) =>
    apiPut<TeacherDetail>(API_ENDPOINTS.TEACHER_DETAIL(id), data),
  
  delete: (id: number) => apiDelete(API_ENDPOINTS.TEACHER_DETAIL(id)),
  
  getAssignments: (id: number) => 
    apiGet<TeacherAssignment[]>(API_ENDPOINTS.TEACHER_ASSIGNMENTS(id)),
  
  bulkAssignSubjects: (assignments: BulkTeacherAssignment[]) =>
    apiPost<TeacherAssignment[]>(API_ENDPOINTS.BULK_ASSIGN_TEACHERS, { assignments }),
};

// Parent API Functions
export const parentApi = {
  getAll: async (filters?: MemberFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const url = params.toString() ? `${API_ENDPOINTS.MEMBERS_PARENTS}?${params.toString()}` : API_ENDPOINTS.MEMBERS_PARENTS;
    const response = await apiGet<MemberParent[]>(url);
    // Handle paginated response structure
    if (response && typeof response === 'object' && 'results' in response) {
      return (response as any).results || [];
    }
    // Fallback for direct array response
    return Array.isArray(response) ? response : [];
  },
  
  getById: (id: number) => apiGet<ParentDetail>(API_ENDPOINTS.PARENT_DETAIL(id)),
  
  create: (data: ParentCreateUpdate) => 
    apiPost<ParentDetail>(API_ENDPOINTS.MEMBERS_PARENTS, data),
  
  update: (id: number, data: Partial<ParentCreateUpdate>) =>
    apiPut<ParentDetail>(API_ENDPOINTS.PARENT_DETAIL(id), data),
  
  delete: (id: number) => apiDelete(API_ENDPOINTS.PARENT_DETAIL(id)),
  
  getChildren: (id: number) => 
    apiGet<MemberStudent[]>(API_ENDPOINTS.PARENT_CHILDREN(id)),
};

// Non-Staff Member API Functions
export const nonStaffMemberApi = {
  getAll: (filters?: MemberFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const url = params.toString() ? `${API_ENDPOINTS.MEMBERS_NON_STAFF}?${params.toString()}` : API_ENDPOINTS.MEMBERS_NON_STAFF;
    return apiGet<NonStaffMember[]>(url);
  },
  
  getById: (id: number) => apiGet<NonStaffMember>(API_ENDPOINTS.NON_STAFF_DETAIL(id)),
  
  create: (data: NonStaffMemberCreateUpdate) => 
    apiPost<NonStaffMember>(API_ENDPOINTS.MEMBERS_NON_STAFF, data),
  
  update: (id: number, data: Partial<NonStaffMemberCreateUpdate>) =>
    apiPut<NonStaffMember>(API_ENDPOINTS.NON_STAFF_DETAIL(id), data),
  
  delete: (id: number) => apiDelete(API_ENDPOINTS.NON_STAFF_DETAIL(id)),
};

// Class API Functions
export const classApi = {
  getAll: (filters?: MemberFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const url = params.toString() ? `${API_ENDPOINTS.MEMBERS_CLASSES}?${params.toString()}` : API_ENDPOINTS.MEMBERS_CLASSES;
    return apiGet<MemberClass[]>(url);
  },
  getById: (id: number) => apiGet<ClassDetail>(API_ENDPOINTS.CLASS_DETAIL(id)),
  create: (data: ClassCreateUpdate) => 
    apiPost<ClassDetail>(API_ENDPOINTS.MEMBERS_CLASSES, data),
  update: (id: number, data: Partial<ClassCreateUpdate>) =>
    apiPut<ClassDetail>(API_ENDPOINTS.CLASS_DETAIL(id), data),
  delete: (id: number) => apiDelete(API_ENDPOINTS.CLASS_DETAIL(id)),
};

// Stream API Functions
export const streamApi = {
  getAll: (filters?: MemberFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const url = params.toString() ? `${API_ENDPOINTS.MEMBERS_STREAMS}?${params.toString()}` : API_ENDPOINTS.MEMBERS_STREAMS;
    return apiGet<MemberStream[]>(url);
  },
  getById: (id: number) => apiGet<StreamDetail>(API_ENDPOINTS.STREAM_DETAIL(id)),
  create: (data: StreamCreateUpdate) => 
    apiPost<StreamDetail>(API_ENDPOINTS.MEMBERS_STREAMS, data),
  update: (id: number, data: Partial<StreamCreateUpdate>) =>
    apiPut<StreamDetail>(API_ENDPOINTS.STREAM_DETAIL(id), data),
  delete: (id: number) => apiDelete(API_ENDPOINTS.STREAM_DETAIL(id)),
};

// Subject API Functions
export const subjectApi = {
  getAll: () => apiGet<MemberSubject[]>(API_ENDPOINTS.MEMBERS_SUBJECTS),
  getById: (id: number) => apiGet<SubjectDetail>(API_ENDPOINTS.SUBJECT_DETAIL(id)),
  create: (data: SubjectCreateUpdate) => 
    apiPost<SubjectDetail>(API_ENDPOINTS.MEMBERS_SUBJECTS, data),
  update: (id: number, data: Partial<SubjectCreateUpdate>) =>
    apiPut<SubjectDetail>(API_ENDPOINTS.SUBJECT_DETAIL(id), data),
  delete: (id: number) => apiDelete(API_ENDPOINTS.SUBJECT_DETAIL(id)),
}; 

// Role and Permission Management API Functions
export const roleApi = {
  getAll: async (filters?: RoleFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      const url = params.toString() ? `${API_ENDPOINTS.ROLES}?${params.toString()}` : API_ENDPOINTS.ROLES;
      console.log('Fetching roles from:', url);
      const response = await apiGet<Role[]>(url);
      console.log('Roles API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },
  getById: (id: number) => apiGet<Role>(API_ENDPOINTS.ROLE_DETAIL(id)),
  create: (data: RoleCreateUpdate) => apiPost<Role>(API_ENDPOINTS.ROLES, data),
  update: (id: number, data: Partial<RoleCreateUpdate>) => apiPatch<Role>(API_ENDPOINTS.ROLE_DETAIL(id), data),
  delete: (id: number) => apiDelete(API_ENDPOINTS.ROLE_DETAIL(id)),
};

export const permissionApi = {
  getAll: () => apiGet<Permission[]>(API_ENDPOINTS.PERMISSIONS),
  getById: (id: number) => apiGet<Permission>(API_ENDPOINTS.PERMISSIONS), // Assuming permission detail endpoint is the same as list
  create: (data: Permission) => apiPost<Permission>(API_ENDPOINTS.PERMISSIONS, data),
  update: (id: number, data: Partial<Permission>) => apiPut<Permission>(API_ENDPOINTS.PERMISSIONS, data), // Assuming permission detail endpoint is the same as list
  delete: (id: number) => apiDelete(API_ENDPOINTS.PERMISSIONS), // Assuming permission detail endpoint is the same as list
};

export const userPermissionApi = {
  getAll: () => apiGet<UserPermission[]>(API_ENDPOINTS.USER_PERMISSIONS),
  assign: (userId: number, permissionId: number) => apiPost(API_ENDPOINTS.ASSIGN_USER_PERMISSION, { user: userId, permission: permissionId }),
  remove: (userId: number, permissionId: number) => apiPost(API_ENDPOINTS.REMOVE_USER_PERMISSION, { user: userId, permission: permissionId }),
}; 

// ==================== SALARY MANAGEMENT API ====================

import type {
  SalaryPeriod,
  SalaryPeriodCreateUpdate,
  SalaryAllowance,
  SalaryAllowanceCreateUpdate,
  SalaryDeduction,
  SalaryDeductionCreateUpdate,
  SalaryPayment,
  SalaryPaymentCreateUpdate,
  SalarySummary,
  StaffSalaryList,
} from '@/types';

// Salary Periods
export const getSalaryPeriods = async (params?: any): Promise<SalaryPeriod[]> => {
  const response = await axiosInstance.get('/members/salary-periods/', { params });
  return response.data;
};

export const createSalaryPeriod = async (data: SalaryPeriodCreateUpdate): Promise<SalaryPeriod> => {
  const response = await axiosInstance.post('/members/salary-periods/', data);
  return response.data;
};

export const updateSalaryPeriod = async (id: number, data: Partial<SalaryPeriodCreateUpdate>): Promise<SalaryPeriod> => {
  const response = await axiosInstance.patch(`/members/salary-periods/${id}/`, data);
  return response.data;
};

export const deleteSalaryPeriod = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/members/salary-periods/${id}/`);
};

export const getSalaryPeriod = async (id: number): Promise<SalaryPeriod> => {
  const response = await axiosInstance.get(`/members/salary-periods/${id}/`);
  return response.data;
};

// Salary Allowances
export const getSalaryAllowances = async (params?: any): Promise<SalaryAllowance[]> => {
  const response = await axiosInstance.get('/members/salary-allowances/', { params });
  return response.data;
};

export const getSalaryAllowance = async (id: number): Promise<SalaryAllowance> => {
  const response = await axiosInstance.get(`/members/salary-allowances/${id}/`);
  return response.data;
};

export const createSalaryAllowance = async (data: SalaryAllowanceCreateUpdate): Promise<SalaryAllowance> => {
  const response = await axiosInstance.post('/members/salary-allowances/', data);
  return response.data;
};

export const updateSalaryAllowance = async (id: number, data: Partial<SalaryAllowanceCreateUpdate>): Promise<SalaryAllowance> => {
  const response = await axiosInstance.patch(`/members/salary-allowances/${id}/`, data);
  return response.data;
};

export const deleteSalaryAllowance = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/members/salary-allowances/${id}/`);
};

// Salary Deductions
export const getSalaryDeductions = async (params?: any): Promise<SalaryDeduction[]> => {
  const response = await axiosInstance.get('/members/salary-deductions/', { params });
  return response.data;
};

export const getSalaryDeduction = async (id: number): Promise<SalaryDeduction> => {
  const response = await axiosInstance.get(`/members/salary-deductions/${id}/`);
  return response.data;
};

export const createSalaryDeduction = async (data: SalaryDeductionCreateUpdate): Promise<SalaryDeduction> => {
  const response = await axiosInstance.post('/members/salary-deductions/', data);
  return response.data;
};

export const updateSalaryDeduction = async (id: number, data: Partial<SalaryDeductionCreateUpdate>): Promise<SalaryDeduction> => {
  const response = await axiosInstance.patch(`/members/salary-deductions/${id}/`, data);
  return response.data;
};

export const deleteSalaryDeduction = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/members/salary-deductions/${id}/`);
};

// Salary Payments
export const getSalaryPayments = async (params?: any): Promise<SalaryPayment[]> => {
  const response = await axiosInstance.get('/members/salary-payments/', { params });
  return response.data;
};

export const createSalaryPayment = async (data: SalaryPaymentCreateUpdate): Promise<SalaryPayment> => {
  // Prepare the data, excluding undefined values for teacher and non_staff_member
  const requestData: any = {
    salary_period: data.salary_period,
    base_salary: data.base_salary,
    payment_date: data.payment_date,
    payment_method: data.payment_method,
    payment_status: data.payment_status,
    allowance_details: data.allowance_details || [],
    deduction_details: data.deduction_details || []
  };
  
  // Only include teacher or non_staff_member if they have values
  if (data.teacher) {
    requestData.teacher = data.teacher;
  }
  if (data.non_staff_member) {
    requestData.non_staff_member = data.non_staff_member;
  }
  
  // Add optional fields
  if (data.transaction_reference) {
    requestData.transaction_reference = data.transaction_reference;
  }
  if (data.notes) {
    requestData.notes = data.notes;
  }
  
  console.log('Creating salary payment with data:', requestData);
  
  try {
    const response = await axiosInstance.post('/members/salary-payments/', requestData);
  return response.data;
  } catch (error: any) {
    console.error('Error creating salary payment:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    throw error;
  }
};

export const updateSalaryPayment = async (id: number, data: Partial<SalaryPaymentCreateUpdate>): Promise<SalaryPayment> => {
  // Prepare the data, excluding undefined values for teacher and non_staff_member
  const requestData: any = {};
  
  // Add fields that are provided
  if (data.salary_period !== undefined) requestData.salary_period = data.salary_period;
  if (data.base_salary !== undefined) requestData.base_salary = data.base_salary;
  if (data.payment_date !== undefined) requestData.payment_date = data.payment_date;
  if (data.payment_method !== undefined) requestData.payment_method = data.payment_method;
  if (data.payment_status !== undefined) requestData.payment_status = data.payment_status;
  if (data.transaction_reference !== undefined) requestData.transaction_reference = data.transaction_reference;
  if (data.notes !== undefined) requestData.notes = data.notes;
  if (data.allowance_details !== undefined) requestData.allowance_details = data.allowance_details;
  if (data.deduction_details !== undefined) requestData.deduction_details = data.deduction_details;
  
  // Handle teacher and non_staff_member fields
  if (data.teacher !== undefined) {
    requestData.teacher = data.teacher;
  }
  if (data.non_staff_member !== undefined) {
    requestData.non_staff_member = data.non_staff_member;
  }
  
  const response = await axiosInstance.patch(`/members/salary-payments/${id}/`, requestData);
  return response.data;
};

export const deleteSalaryPayment = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/members/salary-payments/${id}/`);
};

export const getSalaryPayment = async (id: number): Promise<SalaryPayment> => {
  const response = await axiosInstance.get(`/members/salary-payments/${id}/`);
  return response.data;
};

// Salary Summaries
export const getSalarySummaries = async (params?: any): Promise<SalarySummary[]> => {
  const response = await axiosInstance.get('/members/salary-summaries/', { params });
  return response.data;
};

export const getSalarySummary = async (salaryPeriodId: number): Promise<SalarySummary> => {
  const response = await axiosInstance.get('/members/salary-summary/', { 
    params: { salary_period: salaryPeriodId } 
  });
  return response.data;
};

// Dashboard Summary Data
export const getSalaryDashboardSummary = async (): Promise<any> => {
  try {
    // Get all staff (teachers and non-staff members)
    const [teachers, nonStaffMembers] = await Promise.all([
      getTeachers(),
      getNonStaffMembers()
    ]);

    // Calculate total budget from all staff salaries
    const totalBudget = [...teachers, ...nonStaffMembers].reduce((total, staff) => {
      const salary = staff.salary ? parseFloat(staff.salary.replace(/[^\d.]/g, '')) : 0;
      return total + salary;
    }, 0);

    // Get active salary period
    const salaryPeriods = await getSalaryPeriods();
    const activePeriod = salaryPeriods.find((period: any) => period.is_active);

    // Get all payments and filter by active period
    let totalPaidThisMonth = 0;
    if (activePeriod) {
      const allPayments = await getSalaryPayments();
      const activePeriodPayments = allPayments.filter((payment: any) => 
        payment.salary_period === activePeriod.id && payment.payment_status === 'completed'
      );
      totalPaidThisMonth = activePeriodPayments.reduce((total: number, payment: any) => total + payment.net_salary, 0);
    }

    // Calculate completion rate
    const completionRate = totalBudget > 0 ? Math.round((totalPaidThisMonth / totalBudget) * 100) : 0;

    // Get pending payments for active period
    let totalPendingPayments = 0;
    if (activePeriod) {
      const allPayments = await getSalaryPayments();
      const pendingPayments = allPayments.filter((payment: any) => 
        payment.salary_period === activePeriod.id && payment.payment_status === 'pending'
      );
      totalPendingPayments = pendingPayments.reduce((total: number, payment: any) => total + payment.net_salary, 0);
    }

    return {
      total_staff: teachers.length + nonStaffMembers.length,
      total_salary_budget: totalBudget,
      total_paid_this_month: totalPaidThisMonth,
      total_pending_payments: totalPendingPayments,
      average_salary: totalBudget > 0 ? Math.round(totalBudget / (teachers.length + nonStaffMembers.length)) : 0,
      payment_completion_rate: completionRate
    };
  } catch (error) {
    console.error('Error fetching salary dashboard summary:', error);
    // Return fallback data if API is not available
    return {
      total_staff: 0,
      total_salary_budget: 0,
      total_paid_this_month: 0,
      total_pending_payments: 0,
      average_salary: 0,
      payment_completion_rate: 0
    };
  }
};

// Recent Salary Payments
export const getRecentSalaryPayments = async (limit: number = 5): Promise<SalaryPayment[]> => {
  try {
    const response = await axiosInstance.get('/members/salary-payments/', { 
      params: { 
        limit,
        ordering: '-payment_date',
        payment_status: 'paid'
      } 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent salary payments:', error);
    return [];
  }
};

// Staff Salary List
export const getStaffSalaryList = async (params?: any): Promise<StaffSalaryList> => {
  const response = await axiosInstance.get('/members/staff-salaries/', { params });
  return response.data;
};

// Teachers
export const getTeachers = async (params?: any): Promise<any[]> => {
  try {
    const response = await axiosInstance.get('/members/teachers/', { params });
    const data = response.data;
    console.log('Teachers API response:', data);
    // Handle paginated response structure
    if (data && typeof data === 'object' && 'results' in data) {
      return data.results || [];
    }
    // Fallback for direct array response
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
};

// Non-Staff Members
export const getNonStaffMembers = async (params?: any): Promise<any[]> => {
  try {
    const response = await axiosInstance.get('/members/non-staff-members/', { params });
    const data = response.data;
    console.log('Non-staff members API response:', data);
    // Handle paginated response structure
    if (data && typeof data === 'object' && 'results' in data) {
      return data.results || [];
    }
    // Fallback for direct array response
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching non-staff members:', error);
    return [];
  }
}; 