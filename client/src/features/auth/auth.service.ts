
import { z } from "zod";
import { 
  ILoginInput, 
  LoginSchema, 
  ICreateUserInput, 
  CreateUserSchema, 
  IPasswordReset, 
  PasswordResetSchema,
  IOTPVerificationInput,
  OTPVerificationSchema,
  IForgotPasswordInput,
  ForgotPasswordSchema
} from "./auth.schemas";
import api, { apiRequest } from "@/lib/api";

/**
 * Helper to handle Zod validation errors
 */
const handleValidationError = (error: z.ZodError) => {
  // This assumes a custom treeifyError helper exists on z, 
  // if not, we can implement a simple version or use standard zod error formatting.
  const errors = (z as any).treeifyError ? (z as any).treeifyError(error) : error.flatten();
  return { success: false, error: errors.properties || errors.fieldErrors };
};

export const UserSignup = async ({ data }: { data: ICreateUserInput }): Promise<{ success: true; data: any } | { success: false; error: any }> => {
  const validatedData = CreateUserSchema.safeParse(data);
  // if (!validatedData.success) {
  //   return handleValidationError(validatedData.error);
  // }
  try {
    const res = await api.post(`/accounts/register/`, validatedData.data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UserLogin = async ({ data }: { data: ILoginInput }) => {
  const validatedData = LoginSchema.safeParse(data);
  if (!validatedData.success) {
    return handleValidationError(validatedData.error);
  }
  try {
    const res = await api.post(`/accounts/login/`, validatedData.data);
    const responseData = res.data;
    return { success: true, data: responseData };
  } catch (error) {
    return { success: false, error };
  }
};

export const UserLogout = async (refresh: string) => {
  try {
    const res = await api.post(`/accounts/logout/`, { refresh });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const VerifyEmail = async ({ data }: { data: IOTPVerificationInput }) => {
  const validatedData = OTPVerificationSchema.safeParse(data);
  if (!validatedData.success) {
    return handleValidationError(validatedData.error);
  }
  try {
    const res = await api.post(`/accounts/verify-email/`, validatedData.data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const ResendOTP = async (email: string) => {
  try {
    const res = await api.post(`/accounts/resend-verification/`, { email });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const RefreshAccessToken = async ({ refresh }: { refresh: string }) => {
  try {
    const res = await api.post(`/accounts/token/refresh/`, { refresh });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UserProfile = async () => {
  try {
    const res = await api.get(`/accounts/profile/`); // Assuming profile exists
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const RequestPasswordReset = async ({ data }: { data: IForgotPasswordInput }) => {
  const validatedData = ForgotPasswordSchema.safeParse(data);
  if (!validatedData.success) {
    return handleValidationError(validatedData.error);
  }
  try {
    // Backend endpoint for forgot password might be different, adjusting to standard pattern
    const res = await api.post(`/accounts/password-reset/`, validatedData.data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const PasswordReset = async ({ data }: { data: IPasswordReset }) => {
  const validatedData = PasswordResetSchema.safeParse(data);
  if (!validatedData.success) {
    return handleValidationError(validatedData.error);
  }
  try {
    // The backend expects token, new_password, and confirm_password
    const payload = {
      token: validatedData.data.token,
      new_password: validatedData.data.new_password,
      confirm_password: validatedData.data.confirm_password,
    };
    const res = await api.post(`/accounts/password-reset-confirm/`, payload);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error };
  }
};
