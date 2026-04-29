'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStoredUser, getStoredAccessToken, storeAuthSession, clearAuthSession, AuthSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  updateUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = getStoredAccessToken();

    if (storedUser && storedToken) {
      setUser(storedUser);
      setAccessToken(storedToken);
      // Sync cookie so middleware can read it if they were logged in before this change
      document.cookie = `accessToken=${storedToken}; path=/; max-age=604800; SameSite=Lax`;
    }
    setIsLoading(false);
  }, []);

  const login = (session: AuthSession) => {
    setUser(session.user);
    setAccessToken(session.accessToken);
    storeAuthSession(session);
    router.push('/');
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    clearAuthSession();
    router.push('/login');
  };

  const updateUser = (updatedUser: any) => {
    setUser(updatedUser);
    const refreshToken = localStorage.getItem('refreshToken') || '';
    storeAuthSession({ 
      user: updatedUser, 
      accessToken: accessToken || '', 
      refreshToken 
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      accessToken, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
