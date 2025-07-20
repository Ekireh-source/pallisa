import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { academicYearApi, parseApiError } from '@/lib/api';
import type { AcademicYear, AcademicYearState } from '@/types';

// Initial state
const initialState: AcademicYearState = {
  academic_years: [],
  loading: false,
  error: null,
  fieldErrors: {},
};

// Async thunks
export const fetchAcademicYears = createAsyncThunk(
  'academicYears/fetchAcademicYears',
  async (_, { rejectWithValue }) => {
    try {
      const response = await academicYearApi.getAll();
      return response;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchAcademicYearById = createAsyncThunk(
  'academicYears/fetchAcademicYearById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await academicYearApi.getById(id);
      return response;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const createAcademicYear = createAsyncThunk(
  'academicYears/createAcademicYear',
  async (
    data: Omit<AcademicYear, 'id' | 'created_at' | 'updated_at' | 'term_count' | 'duration_days'>,
    { rejectWithValue }
  ) => {
    try {
      const response = await academicYearApi.create(data);
      return response;
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const updateAcademicYear = createAsyncThunk(
  'academicYears/updateAcademicYear',
  async (
    { id, data }: {
      id: number;
      data: Partial<Omit<AcademicYear, 'id' | 'created_at' | 'updated_at' | 'term_count' | 'duration_days'>>;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await academicYearApi.update(id, data);
      return response;
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const deleteAcademicYear = createAsyncThunk(
  'academicYears/deleteAcademicYear',
  async (id: number, { rejectWithValue }) => {
    try {
      await academicYearApi.delete(id);
      return id;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

// Slice
const academicYearSlice = createSlice({
  name: 'academicYears',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
    clearFieldErrors: (state) => {
      state.fieldErrors = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch academic years
      .addCase(fetchAcademicYears.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAcademicYears.fulfilled, (state, action) => {
        state.loading = false;
        state.academic_years = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchAcademicYears.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch academic year by ID
      .addCase(fetchAcademicYearById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAcademicYearById.fulfilled, (state, action) => {
        state.loading = false;
        // Update the academic year in the list if it exists
        const index = state.academic_years.findIndex(year => year.id === action.payload.id);
        if (index !== -1) {
          state.academic_years[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(fetchAcademicYearById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create academic year
      .addCase(createAcademicYear.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.academic_years.unshift(action.payload);
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createAcademicYear.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })
      
      // Update academic year
      .addCase(updateAcademicYear.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.academic_years.findIndex(year => year.id === action.payload.id);
        if (index !== -1) {
          state.academic_years[index] = action.payload;
        }
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateAcademicYear.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })
      
      // Delete academic year
      .addCase(deleteAcademicYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.academic_years = state.academic_years.filter(year => year.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteAcademicYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearFieldErrors } = academicYearSlice.actions;
export default academicYearSlice.reducer; 