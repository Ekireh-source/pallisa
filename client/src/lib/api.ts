import axios, { InternalAxiosRequestConfig } from "axios";

// import { CustomApiRequestError } from "@/constants";
import { store } from "@/store";
import { setAccessToken, setRefreshToken, logoutStart } from "@/store/auth/actions";

// import { LoginResponse } from "@/utils/auth-utils";
const removeTrailingSlash = (url: string): string => {
  if (!url) return "";
  return url.replace(/\/+$/, "");
};


const axiosJsonInstance = axios.create({
  baseURL: removeTrailingSlash(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"),
  timeout: 40000,
  validateStatus: (status) => status !== 401 && status !== 403,
});

const normalizePathname = (url?: string) => {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      return removeTrailingSlash(new URL(url).pathname.replace(/^\/+/, ""));
    } catch { }
  }

  return removeTrailingSlash(url.split("?")[0].replace(/^\/+/, ""));
};

axiosJsonInstance.interceptors.request.use((config) => {
  const pathname = normalizePathname(config.url);
  const isLoginRequest = pathname === "user/login";
  const isResetPasswordRequest = pathname === "user/reset-password";

  // (config.headers as any).AgentType = "web";

  // Forcibly remove Authorization header for login and reset-password endpoints
  if (isLoginRequest || isResetPasswordRequest) {
    if (config.headers) {
      delete config.headers.Authorization;
      if (config.headers.common) {
        delete (config.headers.common as any).Authorization;
      }
    }
    return config;
  }
  const token = (store.getState() as any).auth?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

type Subscriber = (token: string) => void;
let subscribers: Subscriber[] = [];

function onRefreshed(token: string) {
  subscribers.forEach((callback) => callback(token));
  subscribers = [];
}

function addSubscriber(callback: Subscriber) {
  subscribers.push(callback);
}

axiosJsonInstance.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthEndpoint = originalRequest.url?.includes("/login/") ||
      originalRequest.url?.includes("/register/") ||
      originalRequest.url?.includes("/verify-email/") ||
      originalRequest.url?.includes("/resend-verification/");

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      // const refreshToken = store.getState().auth?.refreshToken;
      // if (error.response?.data.code === "invalid_session") {
      //   store.dispatch(
      //     logoutFailure(
      //       error.response?.data?.error ||
      //       "Your session has been revoked due to a login from another device. If you did not log in from another device, please reset your password."
      //     )
      //   );
      //   store.dispatch(logoutStart());
      //   return Promise.reject(
      //     "Your session has been revoked due to a login from another device"
      //   );
      // }

      // if (!refreshToken || originalRequest.url?.endsWith("/auth/refresh/")) {
      //   if (typeof window !== "undefined") {
      //     if (originalRequest.url?.endsWith("/auth/refresh/")) {
      //       store.dispatch(
      //         logoutFailure(
      //           error.response?.data?.error ||
      //           "Your session has expired. Please log in again."
      //         )
      //       );
      //       store.dispatch(logoutStart());
      //       return Promise.reject("Your session has expired. Please log in again.");
      //     }
      //     store.dispatch(logoutStart());
      //   }

      //   return Promise.reject(error);
      // }

      if (isRefreshing) {
        return new Promise((resolve) => {
          addSubscriber((token: string) => {
            if (!originalRequest.headers) {
              originalRequest.headers = new axios.AxiosHeaders();
            }
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosJsonInstance(originalRequest));
          });
        });
      }
      isRefreshing = true;
      try {
        const response = await axios.post(
          `${removeTrailingSlash(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api")}/accounts/auth/token/refresh/`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );


        const access = response.data?.access;
        const refresh = response.data?.refresh;




        if (access) store.dispatch(setAccessToken(access));
        if (refresh) store.dispatch(setRefreshToken(refresh));

        if (access) {
          axiosJsonInstance.defaults.headers.common["Authorization"] = `Bearer ${access}`;
          if (originalRequest.headers) {
            originalRequest.headers["Authorization"] = `Bearer ${access}`;
          }
          onRefreshed(access);
        }

        return axiosJsonInstance(originalRequest);
      } catch (err) {
        store.dispatch(logoutStart());
        return Promise.reject("Your session has expired. Please log in again.");
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      return Promise.reject(
        new Error(
          error.response?.data?.detail ||
          error.response?.data?.error ||
          "You do not have permission to perform this action"
        )
      );
    } else {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.response ||
        "An unknown error occurred, please make sure you are connected to a network";

      return Promise.reject(new Error(errorMessage));
    }
  },
);

/**
 * @param {string} endpoint - API endpoint path (without base URL)
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {Object} [data=null] - Request payload for POST/PUT requests
 * @param {Object} [customHeaders={}] - Additional headers to include
 * @returns {Promise<any>} Response data
 */
export const apiRequest = async (
  endpoint: string,
  method: string,
  data = null,
  customHeaders: object = {},
  config: object = {}, // Add config parameter to pass additional Axios options
): Promise<any> => {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const response = await axiosJsonInstance({
    url: normalizedEndpoint,
    method: method.toUpperCase(),
    headers: customHeaders,
    data: ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) ? data : undefined,
    params: method.toUpperCase() === "GET" && data ? data : undefined,
    ...config, // Spread additional config (e.g., responseType)
  });

  if (response.status >= 200 && response.status <= 300) {

    return response;
  } else {
    let err: any = {
      message: Array.isArray(response?.data?.error)
        ? response.data.error[0]?.message
        : typeof response?.data?.error === "string"
          ? response.data.error
          : typeof response?.data?.error === "object"
            ? response.data.error?.message
            : response.data?.detail || null,
      status: response.status,
      custom_code: response.data?.custom_code || null,
    };


    throw err;
  }
};

export const apiGet = (endpoint: string, params = null, customHeaders = {}, config = {}) =>
  apiRequest(endpoint, "GET", params, customHeaders, config);

export const apiPost = (endpoint: string, data: any, customHeaders = {}) =>
  apiRequest(endpoint, "POST", data, customHeaders);

export const apiPut = (endpoint: string, data: any, customHeaders = {}) =>
  apiRequest(endpoint, "PUT", data, customHeaders);

export const apiPatch = (endpoint: string, data: any, customHeaders = {}) =>
  apiRequest(endpoint, "PATCH", data, customHeaders);

export const apiDelete = (endpoint: string, customHeaders = {}) =>
  apiRequest(endpoint, "DELETE", null, customHeaders);

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
};
