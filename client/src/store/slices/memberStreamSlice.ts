import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { streamApi } from '@/lib/api';
import type { MemberStreamState, MemberStream, StreamDetail, StreamCreateUpdate, MemberFilters } from '@/types';
import { parseApiError } from '@/lib/api';

// Initial state
const initialState: MemberStreamState = {
  streams: [],
  currentStream: null,
  loading: false,
  error: null,
  fieldErrors: {},
};

// Async thunks
export const fetchStreams = createAsyncThunk(
  'memberStream/fetchStreams',
  async (filters: MemberFilters = {}, { rejectWithValue }) => {
    try {
      return await streamApi.getAll(filters);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchStreamById = createAsyncThunk(
  'memberStream/fetchStreamById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await streamApi.getById(id);
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

export const createStream = createAsyncThunk(
  'memberStream/createStream',
  async (data: StreamCreateUpdate, { rejectWithValue }) => {
    try {
      return await streamApi.create(data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const updateStream = createAsyncThunk(
  'memberStream/updateStream',
  async ({ id, data }: { id: number; data: Partial<StreamCreateUpdate> }, { rejectWithValue }) => {
    try {
      return await streamApi.update(id, data);
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const deleteStream = createAsyncThunk(
  'memberStream/deleteStream',
  async (id: number, { rejectWithValue }) => {
    try {
      await streamApi.delete(id);
      return id;
    } catch (error) {
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

// Slice
const memberStreamSlice = createSlice({
  name: 'memberStream',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
    clearCurrentStream: (state) => {
      state.currentStream = null;
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
      // Fetch streams
      .addCase(fetchStreams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStreams.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && typeof action.payload === 'object' && 'results' in action.payload) {
          // Paginated response
          const paginatedData = action.payload as unknown as { results: MemberStream[]; count: number };
          state.streams = paginatedData.results;
        } else {
          // Direct array response
          state.streams = action.payload as MemberStream[];
        }
        state.error = null;
      })
      .addCase(fetchStreams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch stream by ID
      .addCase(fetchStreamById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStreamById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentStream = action.payload;
        state.error = null;
      })
      .addCase(fetchStreamById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create stream
      .addCase(createStream.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createStream.fulfilled, (state, action) => {
        state.loading = false;
        // Convert StreamDetail to MemberStream for the array
        const streamForArray: MemberStream = {
          id: action.payload.id,
          class_obj: action.payload.class_obj.id,
          name: action.payload.name,
          class_teacher: action.payload.class_teacher?.id,
          capacity: action.payload.capacity,
          is_active: action.payload.is_active,
          created_at: action.payload.created_at,
          updated_at: action.payload.updated_at,
          current_enrollment: action.payload.current_enrollment,
          available_spots: action.payload.available_spots,
          class_obj_name: action.payload.class_obj.name,
          class_teacher_name: action.payload.class_teacher?.teacher_name,
        };
        state.streams.push(streamForArray);
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createStream.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Update stream
      .addCase(updateStream.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateStream.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.streams.findIndex(stream => stream.id === action.payload.id);
        if (index !== -1) {
          const updatedStream: MemberStream = {
            id: action.payload.id,
            class_obj: action.payload.class_obj.id,
            name: action.payload.name,
            class_teacher: action.payload.class_teacher?.id,
            capacity: action.payload.capacity,
            is_active: action.payload.is_active,
            created_at: action.payload.created_at,
            updated_at: action.payload.updated_at,
            current_enrollment: action.payload.current_enrollment,
            available_spots: action.payload.available_spots,
            class_obj_name: action.payload.class_obj.name,
            class_teacher_name: action.payload.class_teacher?.teacher_name,
          };
          state.streams[index] = updatedStream;
        }
        state.currentStream = action.payload;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(updateStream.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: Record<string, string> };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      })

      // Delete stream
      .addCase(deleteStream.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStream.fulfilled, (state, action) => {
        state.loading = false;
        state.streams = state.streams.filter(stream => stream.id !== action.payload);
        if (state.currentStream?.id === action.payload) {
          state.currentStream = null;
        }
        state.error = null;
      })
      .addCase(deleteStream.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentStream,
  setFieldErrors,
  clearFieldErrors,
} = memberStreamSlice.actions;

export default memberStreamSlice.reducer; 