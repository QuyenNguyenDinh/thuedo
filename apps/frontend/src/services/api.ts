import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// In-memory access token storage (Security best practice: never in localStorage)
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

const apiBase =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL
    ? `${(import.meta as any).env.VITE_API_BASE_URL}/api/v1`
    : '/api/v1';

const api = axios.create({
  baseURL: apiBase,
  withCredentials: true, // Necessary for sending/receiving HttpOnly refresh token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (inMemoryAccessToken && config.headers) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }
  return config;
});

// Response Interceptor: Silent Token Refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Unpack NestJS transform response { statusCode, data }
    if (response.data && 'data' in response.data && 'statusCode' in response.data) {
      return response.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    // ValidationPipe trả về message dạng mảng: gộp thành một chuỗi để các trang hiển thị gọn
    const errData = error.response?.data as { message?: unknown } | undefined;
    if (errData && Array.isArray(errData.message)) {
      errData.message = errData.message.join(' ');
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 Unauthorized and not already refreshing and not auth endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(
          `${apiBase}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newAccessToken =
          refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;

        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

