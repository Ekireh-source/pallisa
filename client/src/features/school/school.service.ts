import { z } from "zod";
import { 
  ICampusInput, 
  CampusSchema, 
  ISchoolInput, 
  SchoolSchema 
} from "./school.schemas";
import api from "@/lib/api";

/**
 * Helper to handle Zod validation errors
 */
const handleValidationError = (error: z.ZodError) => {
  const errors = (z as any).treeifyError ? (z as any).treeifyError(error) : error.flatten();
  return { success: false, error: errors.properties || errors.fieldErrors };
};

// --- Schools ---

export const FetchSchools = async (params?: any) => {
  try {
    const res = await api.get(`/schools/schools/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchSchoolById = async (id: number | string) => {
  try {
    const res = await api.get(`/schools/schools/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateSchool = async ({ data }: { data: ISchoolInput }) => {
  const validatedData = SchoolSchema.safeParse(data);
  if (!validatedData.success) {
    return handleValidationError(validatedData.error);
  }
  try {
    const res = await api.post(`/schools/schools/`, validatedData.data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateSchool = async ({ id, data }: { id: string; data: Partial<ISchoolInput> }) => {
  try {
    const res = await api.patch(`/schools/schools/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteSchool = async (id: string) => {
  try {
    const res = await api.delete(`/schools/schools/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

// --- Campuses ---

export const FetchCampuses = async (params?: any) => {
  try {
    const res = await api.get(`/schools/campuses/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateCampus = async ({ data }: { data: ICampusInput }) => {
  const validatedData = CampusSchema.safeParse(data);
  if (!validatedData.success) {
    return handleValidationError(validatedData.error);
  }
  try {
    const res = await api.post(`/schools/campuses/`, validatedData.data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateCampus = async ({ id, data }: { id: string; data: Partial<ICampusInput> }) => {
  try {
    const res = await api.patch(`/schools/campuses/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteCampus = async (id: string) => {
  try {
    const res = await api.delete(`/schools/campuses/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

// --- Analytics ---

export const FetchDashboardAnalytics = async (params?: { school_id?: string | number }) => {
  try {
    const res = await api.get(`/schools/analytics/dashboard/?${params?.school_id}`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};
