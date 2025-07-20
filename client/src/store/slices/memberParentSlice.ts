import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { parentApi } from '@/lib/api';
import type { MemberParentState, MemberParent, ParentDetail, ParentCreateUpdate, MemberStudent, MemberFilters } from '@/types';
import { parseApiError } from '@/lib/api';

// Initial state
const initialState: MemberParentState = {
  parents: [],
  currentParent: null,
  loading: false,
  error: null,
  fieldErrors: {},
};

// Async thunks
export const fetchParents = createAsyncThunk(
  'memberParent/fetchParents',
  async (filters: MemberFilters = {}, { rejectWithValue }) => {
    try {
      const response = await parentApi.getAll(filters);
      return response;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchParentById = createAsyncThunk(
  'memberParent/fetchParentById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await parentApi.getById(id);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const createParent = createAsyncThunk(
  'memberParent/createParent',
  async (data: ParentCreateUpdate, { rejectWithValue }) => {
    try {
      return await parentApi.create(data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const updateParent = createAsyncThunk(
  'memberParent/updateParent',
  async ({ id, data }: { id: number; data: Partial<ParentCreateUpdate> }, { rejectWithValue }) => {
    try {
      return await parentApi.update(id, data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const deleteParent = createAsyncThunk(
  'memberParent/deleteParent',
  async (id: number, { rejectWithValue }) => {
    try {
      await parentApi.delete(id);
      return id;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchParentChildren = createAsyncThunk(
  'memberParent/fetchParentChildren',
  async (parentId: number, { rejectWithValue }) => {
    try {
      return await parentApi.getChildren(parentId);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

// Slice
const memberParentSlice = createSlice({
  name: 'memberParent',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
    clearCurrentParent: (state) => {
      state.currentParent = null;
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
      // Fetch parents
      .addCase(fetchParents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParents.fulfilled, (state, action) => {
        state.loading = false;
        state.parents = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchParents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch parent by ID
      .addCase(fetchParentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentParent = action.payload;
        state.error = null;
      })
      .addCase(fetchParentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create parent
      .addCase(createParent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createParent.fulfilled, (state, action) => {
        state.loading = false;
        state.parents.push({
          id: action.payload.id,
          user_profile: action.payload.user_profile?.id || 0,
          relationship_type: action.payload.relationship_type,
          occupation: action.payload.occupation,
          workplace: action.payload.workplace,
          emergency_contact: action.payload.emergency_contact,
          created_at: action.payload.created_at,
          updated_at: action.payload.updated_at,
          parent_name: action.payload.user_profile ? `${action.payload.user_profile.first_name} ${action.payload.user_profile.last_name}` : 'Unknown',
          children_count: action.payload.children.length,
        });
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createParent.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Update parent
      .addCase(updateParent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateParent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.parents.findIndex(parent => parent.id === action.payload.id);
        if (index !== -1) {
          state.parents[index] = {
            id: action.payload.id,
            user_profile: action.payload.user_profile?.id || 0,
            relationship_type: action.payload.relationship_type,
            occupation: action.payload.occupation,
            workplace: action.payload.workplace,
            emergency_contact: action.payload.emergency_contact,
            created_at: action.payload.created_at,
            updated_at: action.payload.updated_at,
            parent_name: action.payload.user_profile ? `${action.payload.user_profile.first_name} ${action.payload.user_profile.last_name}` : 'Unknown',
            children_count: action.payload.children.length,
          };
        }
        state.currentParent = action.payload;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateParent.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Delete parent
      .addCase(deleteParent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteParent.fulfilled, (state, action) => {
        state.loading = false;
        state.parents = state.parents.filter(parent => parent.id !== action.payload);
        if (state.currentParent?.id === action.payload) {
          state.currentParent = null;
        }
        state.error = null;
      })
      .addCase(deleteParent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch parent children
      .addCase(fetchParentChildren.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParentChildren.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchParentChildren.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentParent, setFieldErrors, clearFieldErrors } = memberParentSlice.actions;
export default memberParentSlice.reducer; 