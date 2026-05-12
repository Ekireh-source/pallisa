import { z } from 'zod';

export const ClassSchema = z.object({
  name: z.string().min(1, "Name is required"),
  campus: z.number().min(1, "Campus is required"),
  description: z.string().optional(),
  is_active: z.boolean(),
});

export const SubjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  school: z.number().optional().nullable(),
  is_active: z.boolean(),
});

export const AcademicYearSchema = z.object({
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
  is_active: z.boolean(),
});

export const TeacherSchema = z.object({
  user_email: z.string().email("Invalid email").min(1, "Email is required"),
  user_first_name: z.string().min(1, "First name is required"),
  user_last_name: z.string().min(1, "Last name is required"),
  user_gender: z.enum(['M', 'F', 'O']),
  employee_id: z.string().min(1, "Employee ID is required"),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'substitute', 'volunteer']),
  specialization: z.string().optional().nullable().or(z.literal(""))
    .transform(val => val === "" ? null : val),
  qualification: z.string().optional().nullable().or(z.literal(""))
    .transform(val => val === "" ? null : val),
  hire_date: z.string().optional().nullable().or(z.literal(""))
    .transform(val => val === "" || val === null ? undefined : val),
  is_active: z.boolean(),
});

export const TeacherListSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  employee_id: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

export const StudentListSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  student_id: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  current_class_name: z.string().optional().nullable(),
  current_stream_name: z.string().optional().nullable(),
  admission_number: z.string().optional().nullable(),
});

export type IClassInput = z.infer<typeof ClassSchema>;
export type ISubjectInput = z.infer<typeof SubjectSchema>;
export type IAcademicYearInput = z.infer<typeof AcademicYearSchema>;
export type ITermInput = z.infer<typeof TermSchema>;
export type IStreamInput = z.infer<typeof StreamSchema>;
export type IStudentInput = z.infer<typeof StudentSchema>;
export type ITeacherInput = z.infer<typeof TeacherSchema>;
export type ITeacher = z.infer<typeof TeacherListSchema>;
export type IStudent = z.infer<typeof StudentListSchema>;
