import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { departmentApi, parseApiError } from '@/lib/api';
import type { DepartmentState, Department } from '@/types';

// Initial state
const initialState: DepartmentState = {
  departments: [],
  loading: false,
  error: null,
  fieldErrors: {},
};

// Async thunks
export const fetchDepartments = createAsyncThunk(
  'departments/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await departmentApi.getAll();
      return response;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchDepartmentById = createAsyncThunk(
  'departments/fetchDepartmentById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await departmentApi.getById(id);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const createDepartment = createAsyncThunk(
  'departments/createDepartment',
  async (data: Omit<Department, 'id' | 'created_at' | 'updated_at' | 'expense_count' | 'total_expenses'>, { rejectWithValue }) => {
    try {
      return await departmentApi.create(data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/updateDepartment',
  async ({ id, data }: { id: number; data: Partial<Omit<Department, 'id' | 'created_at' | 'updated_at' | 'expense_count' | 'total_expenses'>> }, { rejectWithValue }) => {
    try {
      return await departmentApi.update(id, data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  'departments/deleteDepartment',
  async (id: number, { rejectWithValue }) => {
    try {
      await departmentApi.delete(id);
      return id;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

// Slice
const departmentSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch departments
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create department
    builder
      .addCase(createDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.departments.unshift(action.payload);
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors;
      });

    // Update department
    builder
      .addCase(updateDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.departments.findIndex(dept => dept.id === action.payload.id);
        if (index !== -1) {
          state.departments[index] = action.payload;
        }
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors;
      });

    // Delete department
    builder
      .addCase(deleteDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = state.departments.filter(dept => dept.id !== action.payload);
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = departmentSlice.actions;
export default departmentSlice.reducer; 