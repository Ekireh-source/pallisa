import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { teacherApi } from '@/lib/api';
import type { MemberTeacherState, MemberTeacher, TeacherDetail, TeacherCreateUpdate, TeacherAssignment, BulkTeacherAssignment, MemberFilters } from '@/types';
import { parseApiError } from '@/lib/api';

// Initial state
const initialState: MemberTeacherState = {
  teachers: [],
  currentTeacher: null,
  loading: false,
  error: null,
  fieldErrors: {},
  totalCount: 0,
};

// Async thunks
export const fetchTeachers = createAsyncThunk(
  'memberTeacher/fetchTeachers',
  async (filters: MemberFilters = {}, { rejectWithValue }) => {
    try {
      return await teacherApi.getAll(filters);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchTeacherById = createAsyncThunk(
  'memberTeacher/fetchTeacherById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await teacherApi.getById(id);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const createTeacher = createAsyncThunk(
  'memberTeacher/createTeacher',
  async (data: TeacherCreateUpdate, { rejectWithValue }) => {
    try {
      return await teacherApi.create(data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const updateTeacher = createAsyncThunk(
  'memberTeacher/updateTeacher',
  async ({ id, data }: { id: number; data: Partial<TeacherCreateUpdate> }, { rejectWithValue }) => {
    try {
      return await teacherApi.update(id, data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const deleteTeacher = createAsyncThunk(
  'memberTeacher/deleteTeacher',
  async (id: number, { rejectWithValue }) => {
    try {
      await teacherApi.delete(id);
      return id;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchTeacherAssignments = createAsyncThunk(
  'memberTeacher/fetchTeacherAssignments',
  async (teacherId: number, { rejectWithValue }) => {
    try {
      return await teacherApi.getAssignments(teacherId);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const bulkAssignTeacherSubjects = createAsyncThunk(
  'memberTeacher/bulkAssignTeacherSubjects',
  async (assignments: BulkTeacherAssignment[], { rejectWithValue }) => {
    try {
      return await teacherApi.bulkAssignSubjects(assignments);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

// Slice
const memberTeacherSlice = createSlice({
  name: 'memberTeacher',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
    clearCurrentTeacher: (state) => {
      state.currentTeacher = null;
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
      // Fetch teachers
      .addCase(fetchTeachers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.loading = false;
        // Handle paginated response structure
        if (action.payload && typeof action.payload === 'object' && 'results' in action.payload) {
          const paginatedResponse = action.payload as any;
          state.teachers = paginatedResponse.results || [];
          state.totalCount = paginatedResponse.count || 0;
        } else {
          // Fallback for direct array response
          const teacherArray = Array.isArray(action.payload) ? action.payload as MemberTeacher[] : [];
          state.teachers = teacherArray;
          state.totalCount = teacherArray.length;
        }
        state.error = null;
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch teacher by ID
      .addCase(fetchTeacherById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTeacher = action.payload;
        state.error = null;
      })
      .addCase(fetchTeacherById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create teacher
      .addCase(createTeacher.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createTeacher.fulfilled, (state, action) => {
        state.loading = false;
        state.teachers.push({
          id: action.payload.id,
          user_profile: action.payload.user_profile?.id || 0,
          employee_id: action.payload.employee_id,
          employment_type: action.payload.employment_type,
          specialization: action.payload.specialization,
          qualification: action.payload.qualification,
          hire_date: action.payload.hire_date,
          created_at: action.payload.created_at,
          updated_at: action.payload.updated_at,
          teacher_name: action.payload.full_name || 'Unknown Teacher',
          user_email: action.payload.email || '',
          subject_count: action.payload.subject_assignments?.length || 0,
          stream_count: action.payload.primary_streams?.length || 0,
        });
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createTeacher.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Update teacher
      .addCase(updateTeacher.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateTeacher.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.teachers.findIndex(teacher => teacher.id === action.payload.id);
        if (index !== -1) {
          state.teachers[index] = {
            id: action.payload.id,
            user_profile: action.payload.user_profile?.id || 0,
            employee_id: action.payload.employee_id,
            employment_type: action.payload.employment_type,
            specialization: action.payload.specialization,
            qualification: action.payload.qualification,
            hire_date: action.payload.hire_date,
            created_at: action.payload.created_at,
            updated_at: action.payload.updated_at,
            teacher_name: action.payload.full_name || 'Unknown Teacher',
            user_email: action.payload.email || '',
            subject_count: action.payload.subject_assignments?.length || 0,
            stream_count: action.payload.primary_streams?.length || 0,
          };
        }
        state.currentTeacher = action.payload;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateTeacher.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Delete teacher
      .addCase(deleteTeacher.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTeacher.fulfilled, (state, action) => {
        state.loading = false;
        state.teachers = state.teachers.filter(teacher => teacher.id !== action.payload);
        if (state.currentTeacher?.id === action.payload) {
          state.currentTeacher = null;
        }
        state.error = null;
      })
      .addCase(deleteTeacher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch teacher assignments
      .addCase(fetchTeacherAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchTeacherAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Bulk assign teacher subjects
      .addCase(bulkAssignTeacherSubjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkAssignTeacherSubjects.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(bulkAssignTeacherSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentTeacher, setFieldErrors, clearFieldErrors } = memberTeacherSlice.actions;
export default memberTeacherSlice.reducer; 