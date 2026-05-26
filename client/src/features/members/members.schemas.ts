import { z } from 'zod';

export const ClassSchema = z.object({
  name: z.string().min(1, "Name is required"),
  campus: z.number().min(1, "Campus is required"),
  level: z.string().optional().nullable(),
  description: z.string().optional(),
  is_active: z.boolean(),
});


export const ClassListSchema = z.object({
  id: z.number(),
  name: z.string(),
  campus: z.number(),
  campus_name: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  is_active: z.boolean(),
  stream_count: z.number().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
});

export const SubjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  school: z.number().optional().nullable(),
  is_active: z.boolean(),
});

export const AcademicYearSchema = z.object({
  school: z.number().min(1, "School is required"),
  name: z.string().min(1, "Name is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  is_current: z.boolean(),
  is_active: z.boolean(),
});

export const TermSchema = z.object({
  name: z.string().min(1, "Name is required"),
  academic_year: z.number(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  is_current: z.boolean(),
  is_active: z.boolean(),
});

export const StreamSchema = z.object({
  class_obj: z.number().min(1, "Class is required"),
  name: z.string().min(1, "Name is required"),
  class_teacher: z.number().optional().nullable(),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  is_active: z.boolean(),
});

export const StudentSchema = z.object({
  user_email: z.string().email("Invalid email").optional().nullable().or(z.literal(""))
    .transform(val => val === "" ? null : val),
  student_id: z.string().optional().nullable().or(z.literal(""))
    .transform(val => val === "" ? null : val),
  lin: z.string().optional().nullable().or(z.literal("")),
  campus: z.coerce.number().min(1, "Campus is required"),
  user_first_name: z.string().min(1, "First name is required"),
  user_last_name: z.string().min(1, "Last name is required"),
  user_gender: z.enum(['M', 'F', 'O']),
  current_stream: z.union([z.coerce.number(), z.string(), z.null(), z.undefined()])
    .transform(val => (val === "" || val === "NaN" || val === null || isNaN(Number(val))) ? null : Number(val))
    .optional(),
  enrollment_status: z.enum(['enrolled', 'transferred', 'graduated', 'suspended', 'withdrawn']),
  admission_date: z.string().optional().nullable().or(z.literal(""))
    .transform(val => val === "" || val === null ? undefined : val),
  user_profile_picture: z.any().optional(),
  is_active: z.boolean(),
});

export const TeacherSchema = z.object({
  user_email: z.union([
    z.string().email("Invalid email"),
    z.literal(""),
    z.null(),
    z.undefined()
  ]).transform(val => val === "" ? undefined : val).optional(),
  user_first_name: z.string().min(1, "First name is required"),
  user_last_name: z.string().min(1, "Last name is required"),
  user_gender: z.enum(['M', 'F', 'O']),
  employee_id: z.string().nullable().or(z.literal(""))
    .transform(val => val === "" ? undefined : val).optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'substitute', 'volunteer']),
  specialization: z.string().nullable().or(z.literal(""))
    .transform(val => val === "" ? undefined : val).optional(),
  qualification: z.string().nullable().or(z.literal(""))
    .transform(val => val === "" ? undefined : val).optional(),
  hire_date: z.string().nullable().or(z.literal(""))
    .transform(val => val === "" ? undefined : val).optional(),
  user_profile_picture: z.any().optional(),
  user_role_id: z.number().optional().nullable(),
  campus: z.number().min(1, "Campus is required"),
  is_active: z.boolean(),
});

export const TeacherListSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  employee_id: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  specialization: z.string().optional().nullable(),
  qualification: z.string().optional().nullable(),
  employment_type: z.string().optional().nullable(),
  user_profile_data: z.object({
    profile_picture: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
  }).optional().nullable(),
});

export const StudentListSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  student_id: z.string().optional().nullable(),
  lin: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  current_class_name: z.string().optional().nullable(),
  current_stream_name: z.string().optional().nullable(),
  admission_number: z.string().optional().nullable(),
  enrollment_status: z.string().optional().nullable(),
  user_profile_data: z.object({
    profile_picture: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
  }).optional().nullable(),
});

export const SubjectListSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  description: z.string().optional().nullable(),
  school: z.number().optional().nullable(),
  is_active: z.boolean(),
  category: z.string().optional().nullable(),
});

export const StreamListSchema = z.object({
  id: z.number(),
  name: z.string(),
  class_obj: z.number(),
  class_obj_name: z.string().optional().nullable(),
  capacity: z.number(),
  current_enrollment: z.number().optional().nullable(),
  class_teacher: z.number().optional().nullable(),
  class_teacher_name: z.string().optional().nullable(),
  is_active: z.boolean(),
});

export const AcademicYearListSchema = z.object({
  id: z.number(),
  school: z.number(),
  name: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  is_current: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
});

export const TermListSchema = z.object({
  id: z.number(),
  name: z.string(),
  academic_year: z.number(),
  academic_year_name: z.string().optional().nullable(),
  start_date: z.string(),
  end_date: z.string(),
  is_current: z.boolean(),
  is_active: z.boolean(),
});

export type IClassInput = z.infer<typeof ClassSchema>;
export type ISubjectInput = z.infer<typeof SubjectSchema>;
export type IAcademicYearInput = z.infer<typeof AcademicYearSchema>;
export type ITermInput = z.infer<typeof TermSchema>;
export type IStreamInput = z.infer<typeof StreamSchema>;
export type IStudentInput = z.input<typeof StudentSchema>;
export type ITeacherInput = z.input<typeof TeacherSchema>;
export type ITeacher = z.infer<typeof TeacherListSchema>;
export type IStudent = z.infer<typeof StudentListSchema>;
export type IClassListResponse = z.infer<typeof ClassListSchema>;
export type ISubjectListResponse = z.infer<typeof SubjectListSchema>;
export type IStreamListResponse = z.infer<typeof StreamListSchema>;
export type IAcademicYearListResponse = z.infer<typeof AcademicYearListSchema>;
export type ITermListResponse = z.infer<typeof TermListSchema>;


export const SubjectPaperSchema = z.object({
  subject: z.number().min(1, "Subject is required"),
  name: z.string().min(1, "Name is required"),
  code: z.string().optional().nullable().or(z.literal("")),
  max_score: z.number().min(1, "Max score must be at least 1"),
  is_active: z.boolean(),
});

export const SubjectPaperListSchema = z.object({
  id: z.number(),
  subject: z.number(),
  subject_name: z.string().optional().nullable(),
  subject_code: z.string().optional().nullable(),
  name: z.string(),
  code: z.string().optional().nullable(),
  max_score: z.number(),
  is_active: z.boolean(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
});

export type ISubjectPaperInput = z.infer<typeof SubjectPaperSchema>;
export type ISubjectPaperListResponse = z.infer<typeof SubjectPaperListSchema>;

