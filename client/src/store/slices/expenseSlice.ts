import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { expenseApi } from '@/lib/api';
import { parseApiError } from '@/lib/api';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ExpenseState, Expense, ExpenseDetail, ExpenseCreateUpdate, ExpenseFilters, ExpenseSummary } from '@/types';

// Initial state
const initialState: ExpenseState = {
  expenses: [],
  loading: false,
  error: null,
  fieldErrors: {},
  currentExpense: null,
  summary: null,
  filters: {},
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
};

// Async thunks
export const fetchExpenses = createAsyncThunk(
  'expense/fetchExpenses',
  async (filters: ExpenseFilters = {}, { rejectWithValue }) => {
    try {
      return await expenseApi.getAll(filters);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchExpenseById = createAsyncThunk(
  'expenses/fetchExpenseById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await expenseApi.getById(id);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const createExpense = createAsyncThunk(
  'expenses/createExpense',
  async (data: ExpenseCreateUpdate, { rejectWithValue }) => {
    try {
      return await expenseApi.create(data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/updateExpense',
  async ({ id, data }: { id: number; data: Partial<ExpenseCreateUpdate> }, { rejectWithValue }) => {
    try {
      return await expenseApi.update(id, data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async (id: number, { rejectWithValue }) => {
    try {
      await expenseApi.delete(id);
      return id;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const approveExpense = createAsyncThunk(
  'expenses/approveExpense',
  async ({ id, approved }: { id: number; approved: boolean }, { rejectWithValue }) => {
    try {
      return await expenseApi.approve(id, approved);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchExpenseSummary = createAsyncThunk(
  'expense/fetchExpenseSummary',
  async (filters: { year?: number; month?: number; term?: number } = {}, { rejectWithValue }) => {
    try {
      return await expenseApi.getSummary(filters);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

// Slice
const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
    setFilters: (state, action: PayloadAction<ExpenseFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearCurrentExpense: (state) => {
      state.currentExpense = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch expenses
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        // Handle paginated response structure
        if (action.payload && typeof action.payload === 'object' && 'results' in action.payload) {
          const paginatedResponse = action.payload as any;
          state.expenses = paginatedResponse.results || [];
          state.totalCount = paginatedResponse.count || 0;
          state.currentPage = paginatedResponse.current_page || 1;
        } else {
          // Fallback for direct array response
          const expenseArray = Array.isArray(action.payload) ? action.payload as Expense[] : [];
          state.expenses = expenseArray;
          state.totalCount = expenseArray.length;
          state.currentPage = 1;
        }
        state.error = null;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch expense by ID
    builder
      .addCase(fetchExpenseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExpense = action.payload;
      })
      .addCase(fetchExpenseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create expense
    builder
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.loading = false;
        // Convert ExpenseDetail to Expense for the list
        const expense: Expense = {
          ...action.payload,
          category: typeof action.payload.category === 'object' ? action.payload.category.id : action.payload.category,
          department: action.payload.department ? (typeof action.payload.department === 'object' ? action.payload.department.id : action.payload.department) : undefined,
          vendor: action.payload.vendor ? (typeof action.payload.vendor === 'object' ? action.payload.vendor.id : action.payload.vendor) : undefined,
          term: action.payload.term ? (typeof action.payload.term === 'object' ? action.payload.term.id : action.payload.term) : undefined,
          recorded_by: typeof action.payload.recorded_by === 'object' ? action.payload.recorded_by.id : action.payload.recorded_by,
          approved_by: action.payload.approved_by && typeof action.payload.approved_by === 'object' ? action.payload.approved_by.id : action.payload.approved_by || undefined,
          category_name: typeof action.payload.category === 'object' ? action.payload.category.name : undefined,
          department_name: action.payload.department && typeof action.payload.department === 'object' ? action.payload.department.name : undefined,
          vendor_name: action.payload.vendor && typeof action.payload.vendor === 'object' ? action.payload.vendor.name : undefined,
          term_name: action.payload.term && typeof action.payload.term === 'object' ? action.payload.term.name : undefined,
          recorded_by_name: typeof action.payload.recorded_by === 'object' ? action.payload.recorded_by.full_name : undefined,
          approved_by_name: action.payload.approved_by && typeof action.payload.approved_by === 'object' ? action.payload.approved_by.full_name : undefined,
        };
        state.expenses.unshift(expense);
        // Clear summary to force refresh on next fetch
        state.summary = null;
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors;
      });

    // Update expense
    builder
      .addCase(updateExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExpense = action.payload;
        // Update in the list as well
        const index = state.expenses.findIndex(exp => exp.id === action.payload.id);
        if (index !== -1) {
          const expense: Expense = {
            ...action.payload,
            category: typeof action.payload.category === 'object' ? action.payload.category.id : action.payload.category,
            department: action.payload.department ? (typeof action.payload.department === 'object' ? action.payload.department.id : action.payload.department) : undefined,
            vendor: action.payload.vendor ? (typeof action.payload.vendor === 'object' ? action.payload.vendor.id : action.payload.vendor) : undefined,
            term: action.payload.term ? (typeof action.payload.term === 'object' ? action.payload.term.id : action.payload.term) : undefined,
            recorded_by: typeof action.payload.recorded_by === 'object' ? action.payload.recorded_by.id : action.payload.recorded_by,
            approved_by: action.payload.approved_by && typeof action.payload.approved_by === 'object' ? action.payload.approved_by.id : action.payload.approved_by || undefined,
            category_name: typeof action.payload.category === 'object' ? action.payload.category.name : undefined,
            department_name: action.payload.department && typeof action.payload.department === 'object' ? action.payload.department.name : undefined,
            vendor_name: action.payload.vendor && typeof action.payload.vendor === 'object' ? action.payload.vendor.name : undefined,
            term_name: action.payload.term && typeof action.payload.term === 'object' ? action.payload.term.name : undefined,
            recorded_by_name: typeof action.payload.recorded_by === 'object' ? action.payload.recorded_by.full_name : undefined,
            approved_by_name: action.payload.approved_by && typeof action.payload.approved_by === 'object' ? action.payload.approved_by.full_name : undefined,
          };
          state.expenses[index] = expense;
        }
        // Clear summary to force refresh on next fetch
        state.summary = null;
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors;
      });

    // Delete expense
    builder
      .addCase(deleteExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = state.expenses.filter(exp => exp.id !== action.payload);
        if (state.currentExpense?.id === action.payload) {
          state.currentExpense = null;
        }
        // Clear summary to force refresh on next fetch
        state.summary = null;
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Approve expense
    builder
      .addCase(approveExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExpense = action.payload;
        // Update in the list as well
        const index = state.expenses.findIndex(exp => exp.id === action.payload.id);
        if (index !== -1) {
          const expense: Expense = {
            ...action.payload,
            category: typeof action.payload.category === 'object' ? action.payload.category.id : action.payload.category,
            department: action.payload.department ? (typeof action.payload.department === 'object' ? action.payload.department.id : action.payload.department) : undefined,
            vendor: action.payload.vendor ? (typeof action.payload.vendor === 'object' ? action.payload.vendor.id : action.payload.vendor) : undefined,
            term: action.payload.term ? (typeof action.payload.term === 'object' ? action.payload.term.id : action.payload.term) : undefined,
            recorded_by: typeof action.payload.recorded_by === 'object' ? action.payload.recorded_by.id : action.payload.recorded_by,
            approved_by: action.payload.approved_by && typeof action.payload.approved_by === 'object' ? action.payload.approved_by.id : action.payload.approved_by || undefined,
            category_name: typeof action.payload.category === 'object' ? action.payload.category.name : undefined,
            department_name: action.payload.department && typeof action.payload.department === 'object' ? action.payload.department.name : undefined,
            vendor_name: action.payload.vendor && typeof action.payload.vendor === 'object' ? action.payload.vendor.name : undefined,
            term_name: action.payload.term && typeof action.payload.term === 'object' ? action.payload.term.name : undefined,
            recorded_by_name: typeof action.payload.recorded_by === 'object' ? action.payload.recorded_by.full_name : undefined,
            approved_by_name: action.payload.approved_by && typeof action.payload.approved_by === 'object' ? action.payload.approved_by.full_name : undefined,
          };
          state.expenses[index] = expense;
        }
        // Clear summary to force refresh on next fetch
        state.summary = null;
      })
      .addCase(approveExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch expense summary
    builder
      .addCase(fetchExpenseSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchExpenseSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setFilters, clearFilters, clearCurrentExpense } = expenseSlice.actions;
export default expenseSlice.reducer; 