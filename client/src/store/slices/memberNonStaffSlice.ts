import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { nonStaffMemberApi } from '@/lib/api';
import type { NonStaffMemberState, NonStaffMember, NonStaffMemberCreateUpdate, MemberFilters } from '@/types';
import { parseApiError } from '@/lib/api';

// Initial state
const initialState: NonStaffMemberState = {
  nonStaffMembers: [],
  currentNonStaffMember: null,
  loading: false,
  error: null,
  fieldErrors: {},
  totalCount: 0,
};

// Async thunks
export const fetchNonStaffMembers = createAsyncThunk(
  'memberNonStaff/fetchNonStaffMembers',
  async (filters: MemberFilters = {}, { rejectWithValue }) => {
    try {
      return await nonStaffMemberApi.getAll(filters);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchNonStaffMemberById = createAsyncThunk(
  'memberNonStaff/fetchNonStaffMemberById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await nonStaffMemberApi.getById(id);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const createNonStaffMember = createAsyncThunk(
  'memberNonStaff/createNonStaffMember',
  async (data: NonStaffMemberCreateUpdate, { rejectWithValue }) => {
    try {
      return await nonStaffMemberApi.create(data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const updateNonStaffMember = createAsyncThunk(
  'memberNonStaff/updateNonStaffMember',
  async ({ id, data }: { id: number; data: Partial<NonStaffMemberCreateUpdate> }, { rejectWithValue }) => {
    try {
      return await nonStaffMemberApi.update(id, data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const deleteNonStaffMember = createAsyncThunk(
  'memberNonStaff/deleteNonStaffMember',
  async (id: number, { rejectWithValue }) => {
    try {
      await nonStaffMemberApi.delete(id);
      return id;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

// Slice
const memberNonStaffSlice = createSlice({
  name: 'memberNonStaff',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
    clearCurrentNonStaffMember: (state) => {
      state.currentNonStaffMember = null;
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
      // Fetch non-staff members
      .addCase(fetchNonStaffMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNonStaffMembers.fulfilled, (state, action) => {
        state.loading = false;
        // Handle paginated response structure
        if (action.payload && typeof action.payload === 'object' && 'results' in action.payload) {
          const paginatedResponse = action.payload as unknown as { results: NonStaffMember[]; count: number };
          state.nonStaffMembers = paginatedResponse.results || [];
          state.totalCount = paginatedResponse.count || 0;
        } else {
          // Fallback for direct array response
          const memberArray = Array.isArray(action.payload) ? action.payload as NonStaffMember[] : [];
          state.nonStaffMembers = memberArray;
          state.totalCount = memberArray.length;
        }
        state.error = null;
      })
      .addCase(fetchNonStaffMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch non-staff member by ID
      .addCase(fetchNonStaffMemberById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNonStaffMemberById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentNonStaffMember = action.payload;
        state.error = null;
      })
      .addCase(fetchNonStaffMemberById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create non-staff member
      .addCase(createNonStaffMember.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createNonStaffMember.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as NonStaffMember;
        state.nonStaffMembers.push({
          id: payload.id,
          user_profile: payload.user_profile,
          employee_id: payload.employee_id,
          hire_date: payload.hire_date,
          qualification: payload.qualification,
          specialization: payload.specialization,
          years_of_experience: payload.years_of_experience,
          previous_experience: payload.previous_experience,
          employment_type: payload.employment_type,
          salary: payload.salary,
          is_active: payload.is_active,
          created_at: payload.created_at,
          updated_at: payload.updated_at,
          full_name: payload.full_name || 'Unknown Member',
        });
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createNonStaffMember.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Update non-staff member
      .addCase(updateNonStaffMember.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateNonStaffMember.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as NonStaffMember;
        const index = state.nonStaffMembers.findIndex(m => m.id === payload.id);
        if (index !== -1) {
          state.nonStaffMembers[index] = {
            id: payload.id,
            user_profile: payload.user_profile,
            employee_id: payload.employee_id,
            hire_date: payload.hire_date,
            qualification: payload.qualification,
            specialization: payload.specialization,
            years_of_experience: payload.years_of_experience,
            previous_experience: payload.previous_experience,
            employment_type: payload.employment_type,
            salary: payload.salary,
            is_active: payload.is_active,
            created_at: payload.created_at,
            updated_at: payload.updated_at,
            full_name: payload.full_name || 'Unknown Member',
          };
        }
        state.currentNonStaffMember = payload;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateNonStaffMember.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Delete non-staff member
      .addCase(deleteNonStaffMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNonStaffMember.fulfilled, (state, action) => {
        state.loading = false;
        state.nonStaffMembers = state.nonStaffMembers.filter(member => member.id !== action.payload);
        if (state.currentNonStaffMember?.id === action.payload) {
          state.currentNonStaffMember = null;
        }
        state.error = null;
      })
      .addCase(deleteNonStaffMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentNonStaffMember, setFieldErrors, clearFieldErrors } = memberNonStaffSlice.actions;
export default memberNonStaffSlice.reducer; 