// User and Auth Types
export interface User {
  id: number;
  email?: string;
  email_verified?: boolean;
  first_name: string;
  last_name: string;
  user_type: 'admin' | 'school_owner' | 'staff' | 'student' | 'parent';
  phone?: string;
  profile_id: number;
  school?: School;
  campuses?: Campus[];
  // Role and permissions from UserProfile
  role?: Role;
  user_permissions?: UserPermission[];
  // Nested user field from UserProfileSerializer
  user?: {
    id: number;
    email: string;
    email_verified: boolean;
    is_active: boolean;
    date_joined: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
}

export interface LoginCredentials {
  email?: string;
  student_id?: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type?: 'school_owner' | 'staff' | 'student' | 'parent';
  phone?: string;
  school_data?: SchoolRegistrationData;
}

export interface SchoolRegistrationData {
  school_name: string;
  school_address?: string;
  school_phone?: string;
  school_email?: string;
  school_website?: string;
  campus_name: string;
  campus_address?: string;
  campus_phone?: string;
}

// API Response Types for Authentication
export interface LoginResponse {
  access: string;
  refresh: string;
  user_profile: User;
  school?: School;
  message?: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  school?: School;
  campus?: Campus;
  requires_verification: boolean;
}

export interface EmailVerificationResponse {
  access: string;
  refresh: string;
  user_profile: User;
  school?: School;
  message: string;
}


export interface ResendVerificationResponse {
  message: string;
}

// School and Campus Types
export interface School {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  owner?: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  campus?: number;
}

export interface Campus {
  id: number;
  name: string;
  school: number;
  address?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Student Types
export interface Student {
  id: number;
  user: User;
  student_id: string;
  class_name?: string;
  section?: string;
  enrollment_date: string;
  fees_status: 'paid' | 'unpaid' | 'partial';
  total_fees: number;
  paid_fees: number;
  pending_fees: number;
}

export interface StudentState {
  students: Student[];
  loading: boolean;
  error: string | null;
}

// Fee Types
export interface Fee {
  id: number;
  student: number;
  amount: number;
  description: string;
  due_date: string;
  paid_date?: string;
  status: 'paid' | 'unpaid' | 'partial';
  created_at: string;
}

export interface FeeState {
  fees: Fee[];
  summary: {
    total_expected: number;
    total_collected: number;
    total_pending: number;
  };
  loading: boolean;
  error: string | null;
}

// Expense Management Types
export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expense_count: number;
}

export interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  term_count: number;
  duration_days: number | null;
}

export interface Term {
  id: number;
  name: string;
  academic_year: number;
  academic_year_name?: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expense_count: number;
  duration_days: number | null;
}

export interface TermDetail {
  id: number;
  name: string;
  academic_year: AcademicYear;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expense_count: number;
  duration_days: number | null;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expense_count: number;
  total_expenses: number;
}

export interface Vendor {
  id: number;
  name: string;
  contact?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  tax_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expense_count: number;
  total_expenses: number;
}

export interface UserBasic {
  id: number;
  email: string;
  full_name: string;
}

export interface Expense {
  id: number;
  title: string;
  description?: string;
  amount: number;
  category: number;
  department?: number;
  vendor?: number;
  term?: number;
  incurred_on: string;
  recorded_by: number;
  approved: boolean;
  approved_by?: number;
  approved_at?: string;
  receipt_image?: string;
  receipt_url?: string;
  invoice_number?: string;
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'mobile_money' | 'credit_card' | 'other';
  created_at: string;
  updated_at: string;
  // Computed fields
  category_name?: string;
  department_name?: string;
  vendor_name?: string;
  term_name?: string;
  recorded_by_name?: string;
  approved_by_name?: string;
  status: 'Approved' | 'Pending Approval';
}

export interface ExpenseDetail {
  id: number;
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategory;
  department?: Department;
  vendor?: Vendor;
  term?: Term;
  incurred_on: string;
  recorded_by: UserBasic;
  approved: boolean;
  approved_by?: UserBasic;
  approved_at?: string;
  receipt_image?: string;
  receipt_url?: string;
  invoice_number?: string;
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'mobile_money' | 'credit_card' | 'other';
  created_at: string;
  updated_at: string;
  status: 'Approved' | 'Pending Approval';
}

export interface ExpenseCreateUpdate {
  title: string;
  description?: string;
  amount: number;
  category: number;
  department?: number;
  vendor?: number;
  term?: number;
  incurred_on: string;
  receipt_image?: File;
  invoice_number?: string;
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'mobile_money' | 'credit_card' | 'other';
}

export interface ExpenseSummary {
  total_expenses: number;
  approved_expenses: number;
  pending_expenses: number;
  expense_count: number;
  approved_count: number;
  pending_count: number;
  categories_breakdown: Record<string, { total: number; count: number }>;
  monthly_breakdown: Record<string, { total: number; count: number }>;
}

export interface ExpenseFilters {
  category?: number;
  department?: number;
  vendor?: number;
  term?: number;
  approved?: boolean;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

// Redux State Types for Expense Management
export interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
  currentExpense: ExpenseDetail | null;
  summary: ExpenseSummary | null;
  filters: ExpenseFilters;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export interface ExpenseCategoryState {
  categories: ExpenseCategory[];
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
}

export interface DepartmentState {
  departments: Department[];
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
}

export interface VendorState {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
}

export interface TermState {
  terms: Term[];
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
}

export interface AcademicYearState {
  academic_years: AcademicYear[];
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface GradeBoundary {
  id: number;
  grading_system: number;
  grade: string;
  min_score: number;
  max_score: number;
  remarks?: string;
  points?: number;
}

export interface GradingSystem {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  boundaries: GradeBoundary[];
  created_at: string;
  updated_at: string;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface FormErrors {
  [key: string]: string;
}

export interface ApiError {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  field_errors?: Record<string, string>;
  non_field_errors?: string[];
  detail?: string;
}

// ==================== MEMBERS MANAGEMENT TYPES ====================

// User Profile & Role Types
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
  school: number | undefined;
  is_superadmin: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  user: number | {
    id: number;
    email: string;
    email_verified: boolean;
    is_active: boolean;
    date_joined: string;
  };
  user_type: 'admin' | 'school_owner' | 'staff' | 'student' | 'parent';
  gender?: 'M' | 'F' | 'O';
  first_name: string;
  last_name: string;
  other_name?: string;
  dob?: string;
  phone?: string;
  profile_picture?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  emergency_contact_address?: string;
  emergency_contact_email?: string;
  role?: Role;
}

// Member Types - Classes & Subjects
export interface MemberClass {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stream_count: number;
}

export interface ClassDetail {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stream_count: number;
  streams: MemberStream[];
}

export interface SubjectReport {
  id: number;
  subject: number;
  subject_name: string;
  subject_code: string;
  teacher: number;
  teacher_name: string;
  aoi_raw_score: number; // Raw sum
  aoi_score: number; // 20% contribution
  exam_raw_score: number; // Raw out of 100
  exam_score: number; // 80% contribution
  total_score: number; // 100% total
  grade?: string;
  remarks?: string;
  competency_scores: SubjectCompetencyScore[];
}

export interface MemberSubject {
  id: number;
  school: number;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
  teacher_count: number;
}

export interface SubjectDetail {
  id: number;
  school: School;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
  teacher_count: number;
  teachers: MemberTeacher[];
}

export interface MemberStream {
  id: number;
  class_obj: number;
  name: string;
  class_teacher?: number;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  current_enrollment: number;
  available_spots: number;
  class_obj_name?: string;
  class_teacher_name?: string;
}

export interface StreamDetail {
  id: number;
  class_obj: MemberClass;
  name: string;
  class_teacher?: MemberTeacher;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  current_enrollment: number;
  available_spots: number;
  students: MemberStudent[];
  subject_assignments: TeacherAssignment[];
}

// Member Types - People
export interface MemberStudent {
  id: number;
  user_profile: number;
  student_id: string;
  current_stream?: number;
  enrollment_status: 'enrolled' | 'transferred' | 'graduated' | 'suspended' | 'withdrawn';
  admission_number?: string;
  admission_date?: string;
  graduation_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields from backend serializer
  student_name?: string;
  user_email?: string;
  current_stream_name?: string;
  class_name?: string;
  // Additional fields from StudentSerializer
  full_name?: string;
  email?: string;
  age?: number;
  previous_school?: string;
  special_needs?: string;
  medical_conditions?: string;
  allergies?: string;
  user_profile_data?: UserProfile;
}

export interface StudentDetail {
  id: number;
  user_profile: UserProfile;
  user_profile_data: UserProfile;
  student_id: string;
  current_stream?: StreamDetail;
  enrollment_status: 'enrolled' | 'transferred' | 'graduated' | 'suspended' | 'withdrawn';
  admission_number?: string;
  admission_date?: string;
  graduation_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parents: ParentStudentRelationship[];
  stream_history: StudentStreamHistory[];
}

export interface MemberTeacher {
  id: number;
  user_profile: number;
  employee_id: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'substitute' | 'volunteer';
  specialization?: string;
  qualification?: string;
  hire_date?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  teacher_name?: string;
  user_email?: string;
  subject_count?: number;
  stream_count?: number;
}

export interface TeacherDetail {
  id: number;
  user_profile: UserProfile;
  user_profile_data: UserProfile;
  employee_id: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'substitute' | 'volunteer';
  specialization?: string;
  qualification?: string;
  hire_date?: string;
  salary?: string;
  years_of_experience?: number;
  previous_experience?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subject_assignments: TeacherAssignment[];
  primary_streams: MemberStream[];
  // Additional fields from TeacherSerializer
  full_name?: string;
  email?: string;
  school_name?: string;
}

export interface MemberParent {
  id: number;
  user_profile: number;
  relationship_type: 'father' | 'mother' | 'guardian' | 'other';
  occupation?: string;
  workplace?: string;
  emergency_contact: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields
  parent_name?: string;
  user_email?: string;
  children_count?: number;
}

export interface ParentDetail {
  id: number;
  user_profile: UserProfile;
  relationship_type: 'father' | 'mother' | 'guardian' | 'other';
  occupation?: string;
  workplace?: string;
  emergency_contact: boolean;
  created_at: string;
  updated_at: string;
  children: ParentStudentRelationship[];
}

// Relationship Types
export interface ParentStudentRelationship {
  id: number;
  parent: number;
  student: number;
  relationship_type: 'father' | 'mother' | 'guardian' | 'other';
  is_primary: boolean;
  created_at: string;
  // Computed fields
  parent_name?: string;
  student_name?: string;
}

export interface StudentStreamHistory {
  id: number;
  student: number;
  stream: number;
  academic_year: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  // Computed fields
  stream_name?: string;
  academic_year_name?: string;
}

export interface TeacherAssignment {
  id: number;
  teacher: number;
  subject: number;
  stream: number;
  academic_year: number;
  created_at: string;
  // Computed fields
  teacher_name?: string;
  subject_name?: string;
  stream_name?: string;
  academic_year_name?: string;
}

// Create/Update Types
export interface StudentCreateUpdate {
  user_profile?: number;
  // User creation fields
  user_email?: string;
  user_student_id?: string;
  student_id?: string;
  // UserProfile creation fields
  user_first_name?: string;
  user_last_name?: string;
  user_other_name?: string;
  user_gender?: 'M' | 'F' | 'O';
  user_dob?: string;
  user_phone?: string;
  user_emergency_contact?: string;
  user_emergency_phone?: string;
  user_emergency_contact_address?: string;
  user_emergency_contact_email?: string;
  user_role_id?: number;
  // Student specific fields
  current_stream?: number;
  enrollment_status: 'enrolled' | 'transferred' | 'graduated' | 'suspended' | 'withdrawn';
  admission_date?: string;
  graduation_date?: string;
  previous_school?: string;
  special_needs?: string;
  medical_conditions?: string;
  allergies?: string;
}

export interface TeacherCreateUpdate {
  user_profile?: number;
  // User creation fields
  user_email?: string;
  // UserProfile creation fields
  user_first_name?: string;
  user_last_name?: string;
  user_other_name?: string;
  user_gender?: 'M' | 'F' | 'O';
  user_dob?: string;
  user_phone?: string;
  user_emergency_contact?: string;
  user_emergency_phone?: string;
  user_emergency_contact_address?: string;
  user_emergency_contact_email?: string;
  user_role?: string;
  user_role_id?: number;
  // Teacher specific fields
  employment_type: 'full_time' | 'part_time' | 'contract' | 'substitute' | 'volunteer';
  specialization?: string;
  qualification?: string;
  hire_date?: string;
  years_of_experience?: number;
  previous_experience?: string;
  salary?: string;
}

export interface ParentCreateUpdate {
  user_profile?: number;
  // User creation fields
  user_email?: string;
  // UserProfile creation fields
  user_first_name?: string;
  user_last_name?: string;
  user_other_name?: string;
  user_gender?: 'M' | 'F' | 'O';
  user_dob?: string;
  user_phone?: string;
  user_emergency_contact?: string;
  user_emergency_phone?: string;
  user_emergency_contact_address?: string;
  user_emergency_contact_email?: string;
  user_role_id?: number;
  // Parent specific fields
  relationship_type: 'father' | 'mother' | 'guardian' | 'other';
  occupation?: string;
  workplace?: string;
  work_phone?: string;
  home_address?: string;
  is_primary_contact?: boolean;
  is_emergency_contact?: boolean;
  is_authorized_pickup?: boolean;
}

export interface ClassCreateUpdate {
  name: string;
  description?: string;
}

export interface StreamCreateUpdate {
  class_obj: number | undefined;
  name: string;
  class_teacher?: number;
  capacity?: number;
}

export interface SubjectCreateUpdate {
  school: number;
  name: string;
  code: string;
  description?: string;
}

// Statistics & Bulk Operations
export interface StudentStatistics {
  total_students: number;
  enrolled: number;
  transferred: number;
  graduated: number;
  suspended: number;
  withdrawn: number;
  by_class: Record<string, number>;
  by_stream: Record<string, number>;
  enrollment_trend: Record<string, number>;
}

export interface BulkTeacherAssignment {
  teacher: number;
  subject: number;
  stream: number;
  academic_year: number;
}

// Filter Types
export interface MemberFilters {
  search?: string;
  enrollment_status?: string;
  employment_type?: string;
  relationship_type?: string;
  class_level?: number;
  stream?: number;
  academic_year?: number;
  school?: number;
  include_inactive?: boolean;
  page?: number;
  page_size?: number;
}

// State Management Types
export interface MemberStudentState {
  students: MemberStudent[];
  currentStudent: StudentDetail | null;
  statistics: StudentStatistics | null;
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
  totalCount: number;
}

export interface MemberTeacherState {
  teachers: MemberTeacher[];
  currentTeacher: TeacherDetail | null;
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
  totalCount: number;
}

export interface MemberParentState {
  parents: MemberParent[];
  currentParent: ParentDetail | null;
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
}

export interface MemberClassState {
  classes: MemberClass[];
  currentClass: ClassDetail | null;
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
  totalCount: number;
}

export interface MemberStreamState {
  streams: MemberStream[];
  currentStream: StreamDetail | null;
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
}

export interface MemberSubjectState {
  subjects: MemberSubject[];
  currentSubject: SubjectDetail | null;
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
}

export interface NonStaffMember {
  id: number;
  user_profile: number;
  employee_id: string;
  hire_date: string;
  qualification?: string;
  specialization?: string;
  years_of_experience?: number;
  previous_experience?: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'volunteer';
  salary?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  full_name?: string;
}

export interface NonStaffMemberCreateUpdate {
  // Non-staff member specific fields (required first)
  employment_type: 'full_time' | 'part_time' | 'contract' | 'substitute' | 'volunteer';
  // Optional fields
  user_profile?: number;
  // User creation fields
  user_email?: string;
  // UserProfile creation fields
  user_first_name?: string;
  user_last_name?: string;
  user_other_name?: string;
  user_gender?: 'M' | 'F' | 'O';
  user_dob?: string;
  user_phone?: string;
  user_emergency_contact?: string;
  user_emergency_phone?: string;
  user_emergency_contact_address?: string;
  user_emergency_contact_email?: string;
  user_role_id?: number;
  // Non-staff member specific fields
  hire_date?: string;
  qualification?: string;
  specialization?: string;
  years_of_experience?: number;
  previous_experience?: string;
  salary?: string;
}

export interface NonStaffMemberState {
  nonStaffMembers: NonStaffMember[];
  currentNonStaffMember: NonStaffMember | null;
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
  totalCount: number;
}

// ==================== ROLE & PERMISSION MANAGEMENT TYPES ====================

export interface PermissionCategory {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_admin: boolean;
}

export interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: PermissionCategory;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
  school: number | undefined;
  is_superadmin: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleCreateUpdate {
  name: string;
  description?: string;
  permissions: number[];
  school?: number;
}

export interface UserPermission {
  code: string;
  name: string;
  is_role_based: boolean;
  assigned_by?: number;
  created_at: string;
}

export interface RoleState {
  roles: Role[];
  currentRole: Role | null;
  permissions: Permission[];
  permissionCategories: PermissionCategory[];
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
  totalCount: number;
}

export interface RoleFilters {
  search?: string;
  school?: number;
  is_superadmin?: boolean;
  page?: number;
  page_size?: number;
}

// ==================== SALARY MANAGEMENT TYPES ====================

export interface SalaryPeriod {
  id: number;
  name: string;
  academic_year: number;
  academic_year_name?: string;
  term?: number;
  term_name?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_closed: boolean;
  duration_days: number;
  can_be_modified: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalaryAllowance {
  id: number;
  name: string;
  allowance_type: 'housing' | 'transport' | 'medical' | 'responsibility' | 'overtime' | 'bonus' | 'other';
  description?: string;
  amount: number;
  is_percentage: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalaryDeduction {
  id: number;
  name: string;
  deduction_type: 'tax' | 'nssf' | 'nhif' | 'loan' | 'advance' | 'other';
  description?: string;
  amount: number;
  is_percentage: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalaryPaymentDetail {
  id: number;
  salary_payment: number;
  allowance?: number;
  allowance_name?: string;
  deduction?: number;
  deduction_name?: string;
  amount: number;
  notes?: string;
  created_at: string;
}

export interface SalaryPayment {
  id: number;
  teacher?: number;
  non_staff_member?: number;
  staff_name: string;
  staff_type: 'teacher' | 'non_staff';
  salary_period: number;
  salary_period_name: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_date: string;
  payment_method: 'bank_transfer' | 'cash' | 'cheque' | 'mobile_money' | 'other';
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transaction_reference?: string;
  notes?: string;
  receipt_image?: string;
  processed_by?: number;
  processed_by_name?: string;
  details: SalaryPaymentDetail[];
  created_at: string;
  updated_at: string;
}

export interface SalarySummary {
  id: number;
  salary_period: number;
  salary_period_name: string;
  total_base_salary: number;
  total_allowances: number;
  total_deductions: number;
  total_net_salary: number;
  total_staff: number;
  paid_staff: number;
  pending_staff: number;
  average_salary: number;
  payment_completion_rate: number;
  total_fee_collection: number;
  net_income: number;
  last_calculated: string;
  created_at: string;
  updated_at: string;
}

export interface StaffSalaryInfo {
  id: number;
  employee_id: string;
  name: string;
  email?: string;
  employment_type: string;
  base_salary?: number;
  is_active: boolean;
  hire_date: string;
}

export interface StaffSalaryList {
  teachers: StaffSalaryInfo[];
  non_staff: StaffSalaryInfo[];
  total_staff: number;
  total_salary_budget: number;
}

// Create/Update Types
export interface SalaryPeriodCreateUpdate {
  name: string;
  academic_year: number;
  term: number;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export interface SalaryAllowanceCreateUpdate {
  name: string;
  allowance_type: 'housing' | 'transport' | 'medical' | 'responsibility' | 'overtime' | 'bonus' | 'other';
  description?: string;
  amount: number;
  is_percentage?: boolean;
  is_active?: boolean;
}

export interface SalaryDeductionCreateUpdate {
  name: string;
  deduction_type: 'tax' | 'nssf' | 'nhif' | 'loan' | 'advance' | 'other';
  description?: string;
  amount: number;
  is_percentage?: boolean;
  is_active?: boolean;
}

export interface SalaryPaymentCreateUpdate {
  teacher?: number;
  non_staff_member?: number;
  salary_period: number;
  base_salary: number;
  payment_date: string;
  payment_method: 'bank_transfer' | 'cash' | 'cheque' | 'mobile_money' | 'other';
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transaction_reference?: string;
  notes?: string;
  receipt_image?: File;
  allowance_details?: Array<{
    allowance_id: number;
    amount: number;
    notes?: string;
  }>;
  deduction_details?: Array<{
    deduction_id: number;
    amount: number;
    notes?: string;
  }>;
}

// Filter Types
export interface SalaryFilters {
  academic_year?: number;
  is_active?: boolean;
  payment_status?: string;
  staff_type?: string;
  payment_date_from?: string;
  payment_date_to?: string;
  salary_period?: number;
  page?: number;
  page_size?: number;
}

// State Management Types
export interface SalaryPeriodState {
  salary_periods: SalaryPeriod[];
  currentPeriod: SalaryPeriod | null;
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
}

export interface SalaryAllowanceState {
  allowances: SalaryAllowance[];
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
}

export interface SalaryDeductionState {
  deductions: SalaryDeduction[];
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
}

export interface SalaryPaymentState {
  payments: SalaryPayment[];
  currentPayment: SalaryPayment | null;
  loading: boolean;
  error: string | null;
  fieldErrors: FormErrors;
  totalCount: number;
}

export interface SalarySummaryState {
  summaries: SalarySummary[];
  currentSummary: SalarySummary | null;
  loading: boolean;
  error: string | null;
}

export interface StaffSalaryState {
  staffList: StaffSalaryList | null;
  loading: boolean;
  error: string | null;
} 

// ==================== REPORT CARD TYPES ====================

export interface SubjectCompetencyScore {
  id: number;
  assessment_type: 'aoi' | 'exam';
  competency_name: string;
  score: number;
  max_score: number;
}

export interface SubjectReport {
  id: number;
  subject: number;
  subject_name: string;
  subject_code: string;
  teacher: number;
  teacher_name: string;
  aoi_raw_score: number;   // Sum of raw AOI scores
  aoi_score: number;       // 20% contribution (out of 20)
  exam_raw_score: number;  // Raw exam score (out of 100)
  exam_score: number;      // 80% contribution (out of 80)
  total_score: number;     // Final total (out of 100)
  grade?: string;
  remarks?: string;
  competency_scores: SubjectCompetencyScore[];
}

export interface ReportCard {
  id: number;
  public_id: string;
  student: number;
  student_name: string;
  student_id_code: string;
  academic_year: number;
  academic_year_name: string;
  term: number;
  term_name: string;
  class_obj: number;
  class_name: string;
  stream: number;
  stream_name: string;
  total_score: number;
  average_score: number;
  overall_grade?: string;
  position?: number;
  out_of?: number;
  class_teacher?: number;
  class_teacher_name?: string;
  class_teacher_remarks?: string;
  head_teacher_remarks?: string;
  attendance_days_present: number;
  attendance_total_days: number;
  is_published: boolean;
  subject_reports: SubjectReport[];
  created_at: string;
  updated_at: string;
}

export interface GenerateReportData {
  academic_year: number;
  term: number;
  class_obj?: number;
  stream?: number;
  student?: number;
  school?: number;
}