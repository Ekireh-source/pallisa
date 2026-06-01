import axios, { InternalAxiosRequestConfig } from "axios";

// import { CustomApiRequestError } from "@/constants";
import { store } from "@/store";
import { logoutStart } from "@/store/auth/actions";

// import { LoginResponse } from "@/utils/auth-utils";
const removeTrailingSlash = (url: string): string => {
  if (!url) return "";
  return url.replace(/\/+$/, "");
};


const axiosJsonInstance = axios.create({
  baseURL: removeTrailingSlash(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"),
  timeout: 40000,
  withCredentials: true,
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
  const schoolId = (store.getState() as any).auth?.school?.id;
  if (schoolId) {
    if (!config.params) {
      config.params = {};
    }
    if (config.params.school_id === undefined && config.params.school === undefined) {
      config.params.school_id = schoolId;
      config.params.school = schoolId;
    }
  }

  return config;
});

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
      try {
        await axios.post(
          `${removeTrailingSlash(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api")}/accounts/auth/token/refresh/`,
          {},
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        return axiosJsonInstance(originalRequest);
      } catch (err) {
        store.dispatch(logoutStart());
        return Promise.reject("Your session has expired. Please log in again.");
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
      if (isAuthEndpoint && error.response?.data) {
        return Promise.reject(error.response.data);
      }
      
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
    const err: any = {
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
