const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const AUTH_USER_KEY = 'authUser';
const AUTH_USER_COOKIE_KEY = 'authUserPresent';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStoredAccessToken() {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
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
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  contactPhone?: string | null;
  city?: string | null;
  district?: string | null;
  biography?: string | null;
  role?: string;
  profileImageUrl?: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export function storeAuthSession({ accessToken, refreshToken, user }: AuthSession) {
  if (!canUseStorage()) return;

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
  }
  if (refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    document.cookie = `${AUTH_USER_COOKIE_KEY}=1; path=/; max-age=604800; SameSite=Lax`;
  }
}

export function clearAuthSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${AUTH_USER_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
