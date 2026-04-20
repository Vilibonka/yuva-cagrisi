import axios from 'axios';
import { getStoredAccessToken, getStoredRefreshToken, getStoredUser, storeAuthSession, clearAuthSession } from '@/lib/auth';

const api = axios.create({
  baseURL: 'http://localhost:3001',
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
          const { data } = await axios.post('http://localhost:3001/auth/refresh', {
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
