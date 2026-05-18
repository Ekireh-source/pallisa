import api from "@/lib/api";
import { GenerateReportData, IPaginatedResponse } from "@/types";
import { IGradingSystemListResponse } from "./reports.schemas";

export const FetchReportCards = async (params?: any) => {
  try {
    const res = await api.get(`/reports/report-cards/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchReportCardById = async (id: number | string) => {
  try {
    const res = await api.get(`/reports/report-cards/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const GenerateReportCards = async (data: GenerateReportData) => {
  try {
    const res = await api.post(`/reports/report-cards/generate/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateReportCard = async (id: number | string, data: any) => {
  try {
    const res = await api.patch(`/reports/report-cards/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteReportCard = async (id: number | string) => {
  try {
    const res = await api.delete(`/reports/report-cards/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchGradingSystems = async (params?: any) => {
  try {
    const res = await api.get(`/reports/grading-systems/`, params);
    return res.data as IPaginatedResponse<IGradingSystemListResponse>
  } catch (error) {
    return { error };
  }
};

export const FetchGradingSystemById = async (id: number | string) => {
  try {
    const res = await api.get(`/reports/grading-systems/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateGradingSystem = async (data: any) => {
  try {
    const res = await api.post(`/reports/grading-systems/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateGradingSystem = async (id: number | string, data: any) => {
  try {
    const res = await api.patch(`/reports/grading-systems/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteGradingSystem = async (id: number | string) => {
  try {
    const res = await api.delete(`/reports/grading-systems/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateGradeBoundary = async (data: any) => {
  try {
    const res = await api.post(`/reports/grade-boundaries/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateGradeBoundary = async (id: number | string, data: any) => {
  try {
    const res = await api.patch(`/reports/grade-boundaries/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteGradeBoundary = async (id: number | string) => {
  try {
    const res = await api.delete(`/reports/grade-boundaries/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

// ── Report Card Settings ────────────────────────────────────────────────────

export const FetchReportCardSettings = async () => {
  try {
    const res = await api.get(`/reports/report-settings/`);
    // The list endpoint returns an array or object; normalise to object
    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateReportCardSettings = async (id: number, data: Partial<Record<string, unknown>>) => {
  try {
    const res = await api.patch(`/reports/report-settings/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateOrEnsureReportCardSettings = async () => {
  try {
    const res = await api.post(`/reports/report-settings/`, {});
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};
