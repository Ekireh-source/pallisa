import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { termApi, parseApiError } from '@/lib/api';
import type { TermState, Term } from '@/types';

// Initial state
const initialState: TermState = {
  terms: [],
  loading: false,
  error: null,
  fieldErrors: {},
};

// Async thunks
export const fetchTerms = createAsyncThunk(
  'terms/fetchTerms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await termApi.getAll();
      return response;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchTermById = createAsyncThunk(
  'terms/fetchTermById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await termApi.getById(id);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const createTerm = createAsyncThunk(
  'terms/createTerm',
  async (data: Omit<Term, 'id' | 'created_at' | 'updated_at' | 'expense_count' | 'duration_days'>, { rejectWithValue }) => {
    try {
      return await termApi.create(data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const updateTerm = createAsyncThunk(
  'terms/updateTerm',
  async ({ id, data }: { id: number; data: Partial<Omit<Term, 'id' | 'created_at' | 'updated_at' | 'expense_count' | 'duration_days'>> }, { rejectWithValue }) => {
    try {
      return await termApi.update(id, data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const deleteTerm = createAsyncThunk(
  'terms/deleteTerm',
  async (id: number, { rejectWithValue }) => {
    try {
      await termApi.delete(id);
      return id;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

// Slice
const termSlice = createSlice({
  name: 'terms',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch terms
    builder
      .addCase(fetchTerms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTerms.fulfilled, (state, action) => {
        state.loading = false;
        state.terms = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchTerms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create term
    builder
      .addCase(createTerm.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createTerm.fulfilled, (state, action) => {
        state.loading = false;
        state.terms.unshift(action.payload);
      })
      .addCase(createTerm.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors;
      });

    // Update term
    builder
      .addCase(updateTerm.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateTerm.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.terms.findIndex(term => term.id === action.payload.id);
        if (index !== -1) {
          state.terms[index] = action.payload;
        }
      })
      .addCase(updateTerm.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors;
      });

    // Delete term
    builder
      .addCase(deleteTerm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTerm.fulfilled, (state, action) => {
        state.loading = false;
        state.terms = state.terms.filter(term => term.id !== action.payload);
      })
      .addCase(deleteTerm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = termSlice.actions;
export default termSlice.reducer; 