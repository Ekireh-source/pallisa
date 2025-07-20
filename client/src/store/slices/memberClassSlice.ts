import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { classApi } from '@/lib/api';
import type { MemberClassState, MemberClass, ClassDetail, ClassCreateUpdate, MemberFilters } from '@/types';
import { parseApiError } from '@/lib/api';

// Initial state
const initialState: MemberClassState = {
  classes: [],
  currentClass: null,
  loading: false,
  error: null,
  fieldErrors: {},
  totalCount: 0,
};

// Async thunks
export const fetchClasses = createAsyncThunk(
  'memberClass/fetchClasses',
  async (filters: MemberFilters = {}, { rejectWithValue }) => {
    try {
      return await classApi.getAll(filters);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchClassById = createAsyncThunk(
  'memberClass/fetchClassById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await classApi.getById(id);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const createClass = createAsyncThunk(
  'memberClass/createClass',
  async (data: ClassCreateUpdate, { rejectWithValue }) => {
    try {
      return await classApi.create(data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const updateClass = createAsyncThunk(
  'memberClass/updateClass',
  async ({ id, data }: { id: number; data: Partial<ClassCreateUpdate> }, { rejectWithValue }) => {
    try {
      return await classApi.update(id, data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const deleteClass = createAsyncThunk(
  'memberClass/deleteClass',
  async (id: number, { rejectWithValue }) => {
    try {
      await classApi.delete(id);
      return id;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

// Slice
const memberClassSlice = createSlice({
  name: 'memberClass',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
    clearCurrentClass: (state) => {
      state.currentClass = null;
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
      // Fetch classes
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && typeof action.payload === 'object' && 'results' in action.payload) {
          // Paginated response
          const paginatedData = action.payload as unknown as { results: MemberClass[]; count: number };
          state.classes = paginatedData.results;
          state.totalCount = paginatedData.count;
        } else {
          // Direct array response
          state.classes = action.payload as MemberClass[];
          state.totalCount = (action.payload as MemberClass[]).length;
        }
        state.error = null;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch class by ID
      .addCase(fetchClassById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClassById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentClass = action.payload;
        state.error = null;
      })
      .addCase(fetchClassById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create class
      .addCase(createClass.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createClass.fulfilled, (state, action) => {
        state.loading = false;
        // Convert ClassDetail to MemberClass for the array
        const classForArray: MemberClass = {
          id: action.payload.id,
          name: action.payload.name,
          description: action.payload.description,
          is_active: action.payload.is_active,
          created_at: action.payload.created_at,
          updated_at: action.payload.updated_at,
          stream_count: action.payload.stream_count || 0,
        };
        state.classes.push(classForArray);
        state.totalCount += 1;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createClass.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Update class
      .addCase(updateClass.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateClass.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.classes.findIndex(cls => cls.id === action.payload.id);
        if (index !== -1) {
          const updatedClass: MemberClass = {
            id: action.payload.id,
            name: action.payload.name,
            description: action.payload.description,
            is_active: action.payload.is_active,
            created_at: action.payload.created_at,
            updated_at: action.payload.updated_at,
            stream_count: action.payload.stream_count || 0,
          };
          state.classes[index] = updatedClass;
        }
        state.currentClass = action.payload;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateClass.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Delete class
      .addCase(deleteClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteClass.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = state.classes.filter(cls => cls.id !== action.payload);
        state.totalCount -= 1;
        if (state.currentClass?.id === action.payload) {
          state.currentClass = null;
        }
        state.error = null;
      })
      .addCase(deleteClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentClass,
  setFieldErrors,
  clearFieldErrors,
} = memberClassSlice.actions;

export default memberClassSlice.reducer; 