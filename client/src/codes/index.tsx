export enum PERMISSION_CODES {
  // Dashboard
  VIEW_DASHBOARD = 'admin.access_dashboard',
  
  // Expense Management
  VIEW_EXPENSES = 'expenses.view_expenses',
  CREATE_EXPENSES = 'expenses.manage_expenses',
  EDIT_EXPENSES = 'expenses.manage_expenses',
  DELETE_EXPENSES = 'expenses.manage_expenses',
  APPROVE_EXPENSES = 'expenses.approve_expenses',
  
  VIEW_CATEGORIES = 'expenses.view_categories',
  MANAGE_CATEGORIES = 'expenses.manage_categories',
  
  VIEW_DEPARTMENTS = 'expenses.view_departments',
  MANAGE_DEPARTMENTS = 'expenses.manage_departments',
  
  VIEW_VENDORS = 'expenses.view_vendors',
  MANAGE_VENDORS = 'expenses.manage_vendors',
  
  VIEW_TERMS = 'expenses.view_terms',
  MANAGE_TERMS = 'expenses.manage_terms',
  
  VIEW_ACADEMIC_YEARS = 'expenses.view_academic_years',
  MANAGE_ACADEMIC_YEARS = 'expenses.manage_academic_years',
  
  // Fees Management
  VIEW_FEES = 'fees.view_fee_categories',
  MANAGE_FEES = 'fees.manage_fee_categories',
  VIEW_FEE_CATEGORIES = 'fees.view_fee_categories',
  MANAGE_FEE_CATEGORIES = 'fees.manage_fee_categories',
  VIEW_FEE_STRUCTURES = 'fees.view_fee_structures',
  MANAGE_FEE_STRUCTURES = 'fees.manage_fee_structures',
  VIEW_FEE_PAYMENTS = 'fees.view_payments',
  MANAGE_FEE_PAYMENTS = 'fees.manage_payments',
  VIEW_FEE_BALANCES = 'fees.view_fee_balances',
  VIEW_FEE_SUMMARIES = 'fees.view_collection_summaries',
  VIEW_SCHOLARSHIPS = 'fees.view_scholarships',
  MANAGE_SCHOLARSHIPS = 'fees.manage_scholarships',
  
  // Members Management
  VIEW_STUDENTS = 'members.view_students',
  MANAGE_STUDENTS = 'members.manage_students',
  BULK_UPLOAD_STUDENTS = 'members.bulk_upload_students',
  
  VIEW_TEACHERS = 'members.view_teachers',
  MANAGE_TEACHERS = 'members.manage_teachers',
  BULK_UPLOAD_TEACHERS = 'members.bulk_upload_teachers',
  
  VIEW_NON_STAFF = 'members.view_non_staff',
  MANAGE_NON_STAFF = 'members.manage_non_staff',
  BULK_UPLOAD_NON_STAFF = 'members.bulk_upload_non_staff',
  
  VIEW_PARENTS = 'members.view_parents',
  MANAGE_PARENTS = 'members.manage_parents',
  
  VIEW_CLASSES = 'members.view_classes',
  MANAGE_CLASSES = 'members.manage_classes',
  
  VIEW_STREAMS = 'members.view_streams',
  MANAGE_STREAMS = 'members.manage_streams',
  
  VIEW_SUBJECTS = 'members.view_subjects',
  MANAGE_SUBJECTS = 'members.manage_subjects',
  
  // Salary Management
  VIEW_SALARIES = 'salary.view_salary_periods',
  MANAGE_SALARIES = 'admin.manage_salaries',
  VIEW_SALARY_PERIODS = 'salary.view_salary_periods',
  MANAGE_SALARY_PERIODS = 'salary.manage_salary_periods',
  VIEW_SALARY_ALLOWANCES = 'salary.view_allowances',
  MANAGE_SALARY_ALLOWANCES = 'salary.manage_allowances',
  VIEW_SALARY_DEDUCTIONS = 'salary.view_deductions',
  MANAGE_SALARY_DEDUCTIONS = 'salary.manage_deductions',
  VIEW_SALARY_PAYMENTS = 'salary.view_payments',
  MANAGE_SALARY_PAYMENTS = 'salary.manage_payments',
  VIEW_SALARY_REPORTS = 'salary.view_summaries',
  VIEW_SALARY_SETTINGS = 'salary.view_staff_salaries',
  
  // System Administration
  VIEW_ROLES = 'admin.view_roles',
  MANAGE_ROLES = 'admin.manage_roles',
  VIEW_PERMISSIONS = 'admin.view_permissions',
  MANAGE_PERMISSIONS = 'admin.manage_permissions',
  
  // Reports
  VIEW_REPORTS = 'reports.view_reports',
  EXPORT_REPORTS = 'reports.export_reports',
  
  // Grading / Exams
  VIEW_GRADING = 'exams.view_exams',
  MANAGE_GRADING = 'exams.manage_exams',

  // Campuses
  VIEW_CAMPUSES = 'admin.view_campuses',
  MANAGE_CAMPUSES = 'admin.manage_campuses',

  // Competences
  VIEW_COMPETENCES = 'admin.view_competences',
  MANAGE_COMPETENCES = 'admin.manage_competences',
}
