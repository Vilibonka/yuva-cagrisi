import * as SecureStore from 'expo-secure-store';
import { AuthSession, User } from '@/types';

const ACCESS_TOKEN_KEY = 'yuva.accessToken';
const REFRESH_TOKEN_KEY = 'yuva.refreshToken';
const USER_KEY = 'yuva.user';

export async function getStoredAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getStoredRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function getStoredUser() {
  const rawUser = await SecureStore.getItemAsync(USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    await SecureStore.deleteItemAsync(USER_KEY);
    return null;
  }
}

export async function getStoredSession() {
  const [accessToken, refreshToken, user] = await Promise.all([
    getStoredAccessToken(),
    getStoredRefreshToken(),
    getStoredUser(),
  ]);

  if (!accessToken || !refreshToken || !user) return null;
  return { accessToken, refreshToken, user } satisfies AuthSession;
}

export async function storeAuthSession(session: AuthSession) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user)),
  ]);
}

export async function clearAuthSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}
