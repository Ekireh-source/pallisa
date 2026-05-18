import api from '@/lib/api';
import { IPaginatedResponse } from '@/types';
import { IRole, IPermission } from './roles.schemas';

// ── Roles ──────────────────────────────────────────────────────────────────────

export const FetchRoles = async (params?: any) => {
  try {
    const res = await api.get('/accounts/roles/', params);
    return res.data as IPaginatedResponse<IRole>;
  } catch (error) {
    return { error };
  }
};

export const FetchRoleById = async (id: number | string) => {
  try {
    const res = await api.get(`/accounts/roles/${id}/`);
    return { success: true, data: res.data as IRole };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateRole = async (data: { name: string; description?: string }) => {
  try {
    const res = await api.post('/accounts/roles/', data);
    return { success: true, data: res.data as IRole };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateRole = async (id: number | string, data: { name?: string; description?: string }) => {
  try {
    const res = await api.patch(`/accounts/roles/${id}/`, data);
    return { success: true, data: res.data as IRole };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteRole = async (id: number | string) => {
  try {
    await api.delete(`/accounts/roles/${id}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const AssignRolePermissions = async (roleId: number | string, permissionIds: number[]) => {
  try {
    const res = await api.post(`/accounts/roles/${roleId}/assign-permissions/`, {
      permission_ids: permissionIds,
    });
    return { success: true, data: res.data as IRole };
  } catch (error) {
    return { success: false, error };
  }
};

// ── Permissions ────────────────────────────────────────────────────────────────

export const FetchPermissions = async (params?: any) => {
  try {
    const res = await api.get('/accounts/permissions/', params);
    return res.data as IPaginatedResponse<IPermission>;
  } catch (error) {
    return { error };
  }
};
