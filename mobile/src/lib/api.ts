import { default as axiosClient } from 'axios';
import { API_BASE_URL } from '@/lib/config';
import {
  clearAuthSession,
  getStoredRefreshToken,
  getStoredUser,
  storeAuthSession,
  getStoredAccessToken,
} from '@/lib/auth-storage';

const api = axiosClient.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const [refreshToken, user] = await Promise.all([getStoredRefreshToken(), getStoredUser()]);

    if (!refreshToken || !user) {
      await clearAuthSession();
      return Promise.reject(error);
    }

    try {
      const { data } = await axiosClient.post(`${API_BASE_URL}/auth/refresh`, {
        userId: user.id,
        refreshToken,
      });

      await storeAuthSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user,
      });

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      await clearAuthSession();
      return Promise.reject(refreshError);
    }
  },
);

export default api;
