import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { expenseCategoryApi, parseApiError } from '@/lib/api';
import type { ExpenseCategoryState, ExpenseCategory } from '@/types';

// Initial state
const initialState: ExpenseCategoryState = {
  categories: [],
  loading: false,
  error: null,
  fieldErrors: {},
};

// Async thunks
export const fetchExpenseCategories = createAsyncThunk(
  'expenseCategories/fetchExpenseCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await expenseCategoryApi.getAll();
      return response;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchExpenseCategoryById = createAsyncThunk(
  'expenseCategories/fetchExpenseCategoryById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await expenseCategoryApi.getById(id);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const createExpenseCategory = createAsyncThunk(
  'expenseCategories/createExpenseCategory',
  async (data: Omit<ExpenseCategory, 'id' | 'created_at' | 'updated_at' | 'expense_count'>, { rejectWithValue }) => {
    try {
      return await expenseCategoryApi.create(data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const updateExpenseCategory = createAsyncThunk(
  'expenseCategories/updateExpenseCategory',
  async ({ id, data }: { id: number; data: Partial<Omit<ExpenseCategory, 'id' | 'created_at' | 'updated_at' | 'expense_count'>> }, { rejectWithValue }) => {
    try {
      return await expenseCategoryApi.update(id, data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const deleteExpenseCategory = createAsyncThunk(
  'expenseCategories/deleteExpenseCategory',
  async (id: number, { rejectWithValue }) => {
    try {
      await expenseCategoryApi.delete(id);
      return id;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

// Slice
const expenseCategorySlice = createSlice({
  name: 'expenseCategories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch categories
    builder
      .addCase(fetchExpenseCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchExpenseCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create category
    builder
      .addCase(createExpenseCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createExpenseCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.unshift(action.payload);
      })
      .addCase(createExpenseCategory.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors;
      });

    // Update category
    builder
      .addCase(updateExpenseCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateExpenseCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categories.findIndex(cat => cat.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(updateExpenseCategory.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors;
      });

    // Delete category
    builder
      .addCase(deleteExpenseCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExpenseCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter(cat => cat.id !== action.payload);
      })
      .addCase(deleteExpenseCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = expenseCategorySlice.actions;
export default expenseCategorySlice.reducer; 