const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const AUTH_USER_KEY = 'authUser';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStoredAccessToken() {
  if (!canUseStorage()) return null;
  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token && typeof document !== 'undefined') {
    document.cookie = `accessToken=${token}; path=/; max-age=604800; SameSite=Lax`;
  }
  return token;
}

export function getStoredRefreshToken() {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser() {
  if (!canUseStorage()) return null;
  const rawUser = window.localStorage.getItem(AUTH_USER_KEY);
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser);
  } catch {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: any;
}

export function storeAuthSession({ accessToken, refreshToken, user }: AuthSession) {
  if (!canUseStorage()) return;

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    document.cookie = `accessToken=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
  }
  if (refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
  if (typeof document !== 'undefined') {
    document.cookie = `accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}
