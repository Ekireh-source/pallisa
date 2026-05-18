import { z } from "zod";

/**
 * Login Schema
 * Derived from LoginSerializer
 */
export const LoginSchema = z.object({
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  student_id: z.string().min(1, "Student ID is required").optional().or(z.literal("")),
  password: z.string().min(1, "Password is required"),
}).refine((data) => data.email || data.student_id, {
  message: "Either email or student_id must be provided",
  path: ["email"],
});

/**
 * School and Campus Data Schema
 * Derived from SchoolCampusCreationSerializer
 */
export const SchoolCampusSchema = z.object({
  school_name: z.string().min(1, "School name is required"),
  school_address: z.string().optional(),
  school_phone: z.string().optional(),
  school_email: z.string().email("Invalid school email").optional().or(z.literal("")),
  school_website: z.string().url("Invalid school website URL").optional().or(z.literal("")),
  campus_name: z.string().min(1, "Campus name is required"),
  campus_address: z.string().optional(),
  campus_phone: z.string().optional(),
});

/**
 * User Registration Schema
 * Derived from UserRegistrationSerializer
 */
export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Please confirm your password"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  other_name: z.string().optional(),
  gender: z.enum(["M", "F", "O"]).optional(),
  dob: z.string().optional(), // Date string
  phone: z.string().min(1, "Phone number is required"),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  emergency_contact_address: z.string().optional(),
  emergency_contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

/**
 * OTP Verification Schema
 * Derived from OTPVerificationSerializer
 */
export const OTPVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only digits"),
});

/**
 * Forgot Password Schema
 */
export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * Password Reset Schema
 * Derived from ResetPasswordSerializer
 */
export const PasswordResetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

/**
 * Permission Schema
 */
export const PermissionSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
});

/**
 * Role Schema
 */
export const RoleSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional().nullable(),
  permissions: z.array(z.union([z.number(), PermissionSchema])).optional(),
});

export type ILoginInput = z.infer<typeof LoginSchema>;
export type ICreateUserInput = z.infer<typeof CreateUserSchema>;
export type ISchoolCampusInput = z.infer<typeof SchoolCampusSchema>;
export type IOTPVerificationInput = z.infer<typeof OTPVerificationSchema>;
export type IForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type IPasswordReset = z.infer<typeof PasswordResetSchema>;
export type IPermission = z.infer<typeof PermissionSchema>;
export type IRole = z.infer<typeof RoleSchema>;
