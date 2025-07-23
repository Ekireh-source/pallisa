import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { roleApi, permissionApi } from '@/lib/api';
import type { RoleState, Role, RoleCreateUpdate, Permission, RoleFilters } from '@/types';
import { parseApiError } from '@/lib/api';

// Initial state
const initialState: RoleState = {
  roles: [],
  currentRole: null,
  permissions: [],
  permissionCategories: [],
  loading: false,
  error: null,
  fieldErrors: {},
  totalCount: 0,
};

// Async thunks
export const fetchRoles = createAsyncThunk(
  'role/fetchRoles',
  async (filters: RoleFilters = {}, { rejectWithValue }) => {
    try {
      console.log('fetchRoles called with filters:', filters);
      const response = await roleApi.getAll(filters);
      console.log('fetchRoles response:', response);
      return response;
    } catch (error) {
      console.error('fetchRoles error:', error);
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchRoleById = createAsyncThunk(
  'role/fetchRoleById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await roleApi.getById(id);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const createRole = createAsyncThunk(
  'role/createRole',
  async (data: RoleCreateUpdate, { rejectWithValue }) => {
    try {
      return await roleApi.create(data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const updateRole = createAsyncThunk(
  'role/updateRole',
  async ({ id, data }: { id: number; data: Partial<RoleCreateUpdate> }, { rejectWithValue }) => {
    try {
      return await roleApi.update(id, data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const deleteRole = createAsyncThunk(
  'role/deleteRole',
  async (id: number, { rejectWithValue }) => {
    try {
      await roleApi.delete(id);
      return id;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchPermissions = createAsyncThunk(
  'role/fetchPermissions',
  async (_, { rejectWithValue }) => {
    try {
      return await permissionApi.getAll();
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

// Slice
const roleSlice = createSlice({
  name: 'role',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
    clearCurrentRole: (state) => {
      state.currentRole = null;
    },
    setFieldErrors: (state, action: PayloadAction<Record<string, string>>) => {
      state.fieldErrors = action.payload;
    },
    clearFieldErrors: (state) => {
      state.fieldErrors = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        // Handle paginated response structure
        if (action.payload && typeof action.payload === 'object' && 'results' in action.payload) {
          const paginatedResponse = action.payload as unknown as { results: Role[]; count: number };
          state.roles = paginatedResponse.results || [];
          state.totalCount = paginatedResponse.count || 0;
        } else {
          // Fallback for direct array response
          const roleArray = Array.isArray(action.payload) ? action.payload as Role[] : [];
          state.roles = roleArray;
          state.totalCount = roleArray.length;
        }
        state.error = null;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch role by ID
      .addCase(fetchRoleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoleById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRole = action.payload;
        state.error = null;
      })
      .addCase(fetchRoleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create role
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles.push(action.payload);
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Update role
      .addCase(updateRole.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.roles.findIndex(role => role.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
        state.currentRole = action.payload;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Delete role
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = state.roles.filter(role => role.id !== action.payload);
        if (state.currentRole?.id === action.payload) {
          state.currentRole = null;
        }
        state.error = null;
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch permissions
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload;
        // Extract unique categories
        const categories = new Map();
        action.payload.forEach((permission: Permission) => {
          if (permission.category && !categories.has(permission.category.id)) {
            categories.set(permission.category.id, permission.category);
          }
        });
        state.permissionCategories = Array.from(categories.values());
        state.error = null;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentRole, setFieldErrors, clearFieldErrors } = roleSlice.actions;
export default roleSlice.reducer; 