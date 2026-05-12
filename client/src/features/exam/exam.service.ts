import { z } from "zod";
import { 
  ITopicInput, TopicSchema,
  IActivityInput, ActivitySchema,
  IIntegrationScoreInput, IntegrationScoreSchema,
  IExamInput, ExamSchema,
  IExamScoreInput, ExamScoreSchema
} from "./exam.schemas";
import api from "@/lib/api";

/**
 * Helper to handle Zod validation errors
 */
const handleValidationError = (error: z.ZodError) => {
  const errors = (z as any).treeifyError ? (z as any).treeifyError(error) : error.flatten();
  return { success: false, error: errors.properties || errors.fieldErrors };
};

// --- Competency Areas ---

export const FetchCompetencyAreas = async (params?: any) => {
  try {
    const res = await api.get(`/exams/competency-areas/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchCompetencyAreaById = async (id: number | string) => {
  try {
    const res = await api.get(`/exams/competency-areas/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateCompetencyArea = async ({ data }: { data: any }) => {
  try {
    const res = await api.post(`/exams/competency-areas/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateCompetencyArea = async ({ id, data }: { id: number; data: any }) => {
  try {
    const res = await api.patch(`/exams/competency-areas/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteCompetencyArea = async (id: number) => {
  try {
    const res = await api.delete(`/exams/competency-areas/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

// --- Topics ---

export const FetchTopics = async (params?: any) => {
  try {
    const res = await api.get(`/exams/topics/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchTopicById = async (id: number | string) => {
  try {
    const res = await api.get(`/exams/topics/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateTopic = async ({ data }: { data: ITopicInput }) => {
  const validatedData = TopicSchema.safeParse(data);
  if (!validatedData.success) {
    return handleValidationError(validatedData.error);
  }
  try {
    const res = await api.post(`/exams/topics/`, validatedData.data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateTopic = async ({ id, data }: { id: number; data: Partial<ITopicInput> }) => {
  try {
    const res = await api.patch(`/exams/topics/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteTopic = async (id: number) => {
  try {
    const res = await api.delete(`/exams/topics/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

// --- Activities of Integration ---

export const FetchActivities = async (params?: any) => {
  try {
    const res = await api.get(`/exams/activities/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchActivityById = async (id: string) => {
  try {
    const res = await api.get(`/exams/activities/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateActivity = async ({ data }: { data: IActivityInput }) => {
  const validatedData = ActivitySchema.safeParse(data);
  if (!validatedData.success) {
    return handleValidationError(validatedData.error);
  }
  try {
    const res = await api.post(`/exams/activities/`, validatedData.data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateActivity = async ({ id, data }: { id: string; data: Partial<IActivityInput> }) => {
  try {
    const res = await api.patch(`/exams/activities/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteActivity = async (id: string) => {
  try {
    const res = await api.delete(`/exams/activities/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

// --- Integration Scores ---

export const FetchIntegrationScores = async (params?: any) => {
  try {
    const res = await api.get(`/exams/integration-scores/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateIntegrationScore = async ({ data }: { data: IIntegrationScoreInput }) => {
  const validatedData = IntegrationScoreSchema.safeParse(data);
  if (!validatedData.success) {
    return handleValidationError(validatedData.error);
  }
  try {
    const res = await api.post(`/exams/integration-scores/`, validatedData.data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateIntegrationScore = async ({ id, data }: { id: number; data: Partial<IIntegrationScoreInput> }) => {
  try {
    const res = await api.patch(`/exams/integration-scores/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteIntegrationScore = async (id: number) => {
  try {
    const res = await api.delete(`/exams/integration-scores/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

// --- Exams ---

export const FetchExams = async (params?: any) => {
  try {
    const res = await api.get(`/exams/exams/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchExamById = async (id: string) => {
  try {
    const res = await api.get(`/exams/exams/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateExam = async ({ data }: { data: IExamInput }) => {
  const validatedData = ExamSchema.safeParse(data);
  if (!validatedData.success) {
    return handleValidationError(validatedData.error);
  }
  try {
    const res = await api.post(`/exams/exams/`, validatedData.data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateExam = async ({ id, data }: { id: string; data: Partial<IExamInput> }) => {
  try {
    const res = await api.patch(`/exams/exams/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchExamStudentScores = async (id: string, subjectId: number) => {
  try {
    const res = await api.get(`/exams/exams/${id}/student-scores/?subject_id=${subjectId}`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const SaveBulkExamScores = async (id: string, payload: { subject_id: number; scores: any[] }) => {
  try {
    const res = await api.post(`/exams/exams/${id}/bulk-scores/`, payload);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchActivityStudentScores = async (id: string) => {
  try {
    const res = await api.get(`/exams/activities/${id}/student-scores/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const SaveBulkActivityScores = async (id: string, payload: { scores: any[] }) => {
  try {
    const res = await api.post(`/exams/activities/${id}/bulk-scores/`, payload);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteExam = async (id: string) => {
  try {
    const res = await api.delete(`/exams/exams/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

// --- Exam Scores ---

export const FetchExamScores = async (params?: any) => {
  try {
    const res = await api.get(`/exams/exam-scores/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateExamScore = async ({ data }: { data: IExamScoreInput }) => {
  const validatedData = ExamScoreSchema.safeParse(data);
  if (!validatedData.success) {
    return handleValidationError(validatedData.error);
  }
  try {
    const res = await api.post(`/exams/exam-scores/`, validatedData.data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateExamScore = async ({ id, data }: { id: number; data: Partial<IExamScoreInput> }) => {
  try {
    const res = await api.patch(`/exams/exam-scores/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteExamScore = async (id: number) => {
  try {
    const res = await api.delete(`/exams/exam-scores/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};
