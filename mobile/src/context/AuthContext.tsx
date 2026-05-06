import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { clearAuthSession, getStoredSession, storeAuthSession } from '@/lib/auth-storage';
import { AuthSession, User } from '@/types';

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  contactPhone?: string;
  city?: string;
  district?: string;
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
  updateUser: (nextUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStoredSession()
      .then((session) => {
        if (session) {
          setUser(session.user);
          setAccessToken(session.accessToken);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setSession = useCallback(async (session: AuthSession) => {
    await storeAuthSession(session);
    setUser(session.user);
    setAccessToken(session.accessToken);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await setSession({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  }, [setSession]);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const { data } = await api.post('/auth/register', payload);
    await setSession({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  }, [setSession]);

  const logout = useCallback(async () => {
    await clearAuthSession();
    setUser(null);
    setAccessToken(null);
  }, []);

  const updateUser = useCallback(async (nextUser: User) => {
    setUser(nextUser);
    const session = await getStoredSession();
    if (session) {
      await storeAuthSession({ ...session, user: nextUser });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      logout,
      setSession,
      updateUser,
    }),
    [accessToken, isLoading, logout, setSession, signIn, signUp, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
