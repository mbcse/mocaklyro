import { env } from "@/config/env";
import axios, { AxiosInstance, CreateAxiosDefaults } from "axios";

interface CustomAxiosConfig extends CreateAxiosDefaults {
  manualCookie?: string;
}

export const createApiClient = (config?: CustomAxiosConfig): AxiosInstance => {
  const defaultConfig: CreateAxiosDefaults = {
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  };

  // If manual cookie is provided, add it to headers and disable withCredentials
  if (config?.manualCookie) {
    defaultConfig.withCredentials = false;
    defaultConfig.headers = {
      ...defaultConfig.headers,
      Cookie: config.manualCookie,
    };
  }

  // Merge default config with provided config
  const finalConfig = {
    ...defaultConfig,
    ...config,
  };

  return axios.create(finalConfig);
};

const api = createApiClient({
  baseURL: env.API_URL,
  withCredentials: true,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    if (typeof window !== 'undefined') {
      const partnerData = localStorage.getItem('partner');
      if (partnerData) {
        try {
          const parsed = JSON.parse(partnerData);
          if (parsed.token) {
            config.headers.Authorization = `Bearer ${parsed.token}`;
          }
        } catch (error) {
          console.error('Error parsing partner data:', error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('partner');
        window.location.href = '/partner-login';
      }
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;