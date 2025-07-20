import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, LoginCredentials, RegisterData, LoginResponse, RegisterResponse, EmailVerificationResponse, ResendVerificationResponse, FormErrors } from '@/types';
import { apiPost, apiGet, API_ENDPOINTS, setAuthTokens, clearAuthTokens, parseApiError, getAuthTokens } from '@/lib/api';

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  fieldErrors: {},
};

// Async thunks for auth actions
export const registerUser = createAsyncThunk<RegisterResponse, RegisterData>(
  'auth/registerUser',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await apiPost<RegisterResponse>(API_ENDPOINTS.REGISTER, userData);
      return response;
    } catch (error: unknown) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const loginUser = createAsyncThunk<LoginResponse, LoginCredentials>(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await apiPost<LoginResponse>(API_ENDPOINTS.LOGIN, credentials);
      
      // Store tokens in cookies
      if (response.access && response.refresh) {
        setAuthTokens(response.access, response.refresh);
      }
      
      return response;
    } catch (error: unknown) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    try {
      // Get refresh token from cookies
      const refreshToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('refresh_token='))
        ?.split('=')[1];

      if (refreshToken) {
        await apiPost(API_ENDPOINTS.LOGOUT, { refresh: refreshToken });
      }
      
      // Clear tokens regardless of API call success
      clearAuthTokens();
      
      return true;
    } catch {
      // Even if logout API fails, clear local tokens
      clearAuthTokens();
      return true;
    }
  }
);

export const verifyEmail = createAsyncThunk<EmailVerificationResponse, { email: string; otp: string }>(
  'auth/verifyEmail',
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await apiPost<EmailVerificationResponse>(API_ENDPOINTS.VERIFY_EMAIL, { email, otp });
      
      // Store tokens after email verification
      if (response.access && response.refresh) {
        setAuthTokens(response.access, response.refresh);
      }
      
      return response;
    } catch (error: unknown) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

export const resendVerification = createAsyncThunk<ResendVerificationResponse, string>(
  'auth/resendVerification',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await apiPost<ResendVerificationResponse>(API_ENDPOINTS.RESEND_VERIFICATION, { email });
      return response;
    } catch (error: unknown) {
      const { message, fieldErrors } = parseApiError(error);
      return rejectWithValue({ message, fieldErrors });
    }
  }
);

// Auth restoration thunk
export const restoreAuthFromTokens = createAsyncThunk(
  'auth/restoreAuthFromTokens',
  async (_, { rejectWithValue }) => {
    try {
      const { accessToken } = getAuthTokens();
      
      if (!accessToken) {
        return rejectWithValue('No access token found');
      }

      // Validate token by fetching current user profile
      const response = await apiGet<{ user_profile: User }>(API_ENDPOINTS.PROFILE);
      
      return {
        user: response.user_profile,
        token: accessToken,
      };
    } catch (error: unknown) {
      // Token is invalid, clear it
      clearAuthTokens();
      const { message } = parseApiError(error);
      return rejectWithValue(message);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.fieldErrors = {};
    },
    clearFieldError: (state, action: PayloadAction<string>) => {
      delete state.fieldErrors[action.payload];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.fieldErrors = {};
      clearAuthTokens();
    },
    restoreAuth: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // Register user
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        state.fieldErrors = {};
        // Registration successful - may need email verification
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: FormErrors };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      });

    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.fieldErrors = {};
        state.user = action.payload.user_profile;
        state.token = action.payload.access;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        const payload = action.payload as { message: string; fieldErrors: FormErrors };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      });

    // Logout user
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.fieldErrors = {};
      });

    // Verify email
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.fieldErrors = {};
        state.user = action.payload.user_profile;
        state.token = action.payload.access;
        state.isAuthenticated = true;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: FormErrors };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      });

    // Resend verification
    builder
      .addCase(resendVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendVerification.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        // Successful resend - maybe show a success message
      })
      .addCase(resendVerification.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message: string; fieldErrors: FormErrors };
        state.error = payload.message;
        state.fieldErrors = payload.fieldErrors || {};
      });

    // Restore authentication from tokens
    builder
      .addCase(restoreAuthFromTokens.pending, (state) => {
        state.loading = true;
      })
      .addCase(restoreAuthFromTokens.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(restoreAuthFromTokens.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        // Don't set error for failed restoration - this is expected when no valid tokens exist
      });
  },
});

export const { clearError, clearFieldError, setLoading, setUser, clearAuth, restoreAuth } = authSlice.actions;
export default authSlice.reducer; 