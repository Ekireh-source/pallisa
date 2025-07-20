import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { studentApi } from '@/lib/api';
import type { MemberStudentState, MemberStudent, StudentDetail, StudentCreateUpdate, StudentStatistics, MemberFilters } from '@/types';
import { parseApiError } from '@/lib/api';

// Initial state
const initialState: MemberStudentState = {
  students: [],
  currentStudent: null,
  statistics: null,
  loading: false,
  error: null,
  fieldErrors: {},
  totalCount: 0,
};

// Async thunks
export const fetchStudents = createAsyncThunk(
  'memberStudent/fetchStudents',
  async (filters: MemberFilters | undefined, { rejectWithValue }) => {
    try {
      return await studentApi.getAll(filters);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchStudentById = createAsyncThunk(
  'memberStudent/fetchStudentById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await studentApi.getById(id);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const createStudent = createAsyncThunk(
  'memberStudent/createStudent',
  async (data: StudentCreateUpdate, { rejectWithValue }) => {
    try {
      return await studentApi.create(data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const updateStudent = createAsyncThunk(
  'memberStudent/updateStudent',
  async ({ id, data }: { id: number; data: Partial<StudentCreateUpdate> }, { rejectWithValue }) => {
    try {
      return await studentApi.update(id, data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const deleteStudent = createAsyncThunk(
  'memberStudent/deleteStudent',
  async (id: number, { rejectWithValue }) => {
    try {
      await studentApi.delete(id);
      return id;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const restoreStudent = createAsyncThunk(
  'memberStudent/restoreStudent',
  async (id: number, { rejectWithValue }) => {
    try {
      const result = await studentApi.restore(id);
      return result;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchStudentStatistics = createAsyncThunk(
  'memberStudent/fetchStudentStatistics',
  async (_, { rejectWithValue }) => {
    try {
      return await studentApi.getStatistics();
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

// Slice
const memberStudentSlice = createSlice({
  name: 'memberStudent',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
    clearCurrentStudent: (state) => {
      state.currentStudent = null;
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
      // Fetch students
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && typeof action.payload === 'object' && 'results' in action.payload) {
          // Paginated response
          const paginatedData = action.payload as unknown as { results: MemberStudent[]; count: number };
          state.students = paginatedData.results || [];
          state.totalCount = paginatedData.count || 0;
        } else {
          // Direct array response
          state.students = (action.payload as MemberStudent[]) || [];
          state.totalCount = ((action.payload as MemberStudent[]) || []).length;
        }
        state.error = null;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.students = []; // Ensure students is always an array
      })

      // Fetch student by ID
      .addCase(fetchStudentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentStudent = action.payload;
        state.error = null;
      })
      .addCase(fetchStudentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create student
      .addCase(createStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.loading = false;
        // Convert StudentDetail to MemberStudent for the array
        const studentForArray: MemberStudent = {
          id: action.payload.id,
          user_profile: action.payload.user_profile?.id || 0,
          student_id: action.payload.student_id,
          current_stream: action.payload.current_stream?.id,
          enrollment_status: action.payload.enrollment_status,
          admission_number: action.payload.admission_number,
          admission_date: action.payload.admission_date,
          graduation_date: action.payload.graduation_date,
          is_active: action.payload.is_active || true,
          created_at: action.payload.created_at,
          updated_at: action.payload.updated_at,
          student_name: action.payload.user_profile ? `${action.payload.user_profile.first_name} ${action.payload.user_profile.last_name}` : 'Unknown',
          user_email: '', // Email will be populated by the API response
          current_stream_name: action.payload.current_stream?.name,
        };
        state.students.push(studentForArray);
        state.totalCount += 1;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Update student
      .addCase(updateStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.students.findIndex(student => student.id === action.payload.id);
        if (index !== -1) {
          const updatedStudent: MemberStudent = {
            id: action.payload.id,
            user_profile: action.payload.user_profile?.id || 0,
            student_id: action.payload.student_id,
            current_stream: action.payload.current_stream?.id,
            enrollment_status: action.payload.enrollment_status,
            admission_number: action.payload.admission_number,
            admission_date: action.payload.admission_date,
            graduation_date: action.payload.graduation_date,
            is_active: action.payload.is_active || true,
            created_at: action.payload.created_at,
            updated_at: action.payload.updated_at,
            student_name: action.payload.user_profile ? `${action.payload.user_profile.first_name} ${action.payload.user_profile.last_name}` : 'Unknown',
            user_email: '', // Email will be populated by the API response
            current_stream_name: action.payload.current_stream?.name,
          };
          state.students[index] = updatedStudent;
        }
        state.currentStudent = action.payload;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateStudent.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Delete student
      .addCase(deleteStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.students = state.students.filter(student => student.id !== action.payload);
        state.totalCount -= 1;
        if (state.currentStudent?.id === action.payload) {
          state.currentStudent = null;
        }
        state.error = null;
      })
      .addCase(deleteStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Restore student
      .addCase(restoreStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreStudent.fulfilled, (state, action) => {
        state.loading = false;
        // Update the current student if it's the one being restored
        if (state.currentStudent?.id === action.payload.id) {
          state.currentStudent = action.payload;
        }
        // Add the student back to the list if not already there
        const existingIndex = state.students.findIndex(student => student.id === action.payload.id);
        if (existingIndex === -1) {
          const restoredStudent: MemberStudent = {
            id: action.payload.id,
            user_profile: action.payload.user_profile?.id || 0,
            student_id: action.payload.student_id,
            current_stream: action.payload.current_stream?.id,
            enrollment_status: action.payload.enrollment_status,
            admission_number: action.payload.admission_number,
            admission_date: action.payload.admission_date,
            graduation_date: action.payload.graduation_date,
            is_active: action.payload.is_active || true,
            created_at: action.payload.created_at,
            updated_at: action.payload.updated_at,
            student_name: action.payload.user_profile ? `${action.payload.user_profile.first_name} ${action.payload.user_profile.last_name}` : 'Unknown',
            user_email: '', // Email will be populated by the API response
            current_stream_name: action.payload.current_stream?.name,
          };
          state.students.push(restoredStudent);
          state.totalCount += 1;
        }
        state.error = null;
      })
      .addCase(restoreStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch student statistics
      .addCase(fetchStudentStatistics.pending, (state) => {
        // Don't set loading for statistics to avoid interfering with main loading
      })
      .addCase(fetchStudentStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      })
      .addCase(fetchStudentStatistics.rejected, (state, action) => {
        // Don't set error for statistics to avoid interfering with main error
      });
  },
});

export const {
  clearError,
  clearCurrentStudent,
  setFieldErrors,
  clearFieldErrors,
} = memberStudentSlice.actions;

export default memberStudentSlice.reducer; 