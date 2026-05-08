import axios from 'axios';
import { getStoredAccessToken, getStoredRefreshToken, getStoredUser, storeAuthSession, clearAuthSession } from '@/lib/auth';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function buildMediaUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path}`;
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getStoredRefreshToken();
      const user = getStoredUser();

      if (refreshToken && user) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            userId: user.id,
            refreshToken,
          });

          storeAuthSession({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user,
          });

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          clearAuthSession();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
