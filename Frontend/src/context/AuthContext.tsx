import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types/auth';
import { storage } from '../utils/storage';
import { authService } from '../services/authService';
import { profileService } from '../services/Profileservice';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(storage.getUser());
  const [isLoading, setIsLoading] = useState(!!storage.getAccessToken());

  const refreshUser = useCallback(async () => {
    try {
      const profile = await profileService.getProfile();
      setUser(profile);
      storage.setUser(profile);
    } catch {
      setUser(null);
      storage.clear();
    }
  }, []);

  useEffect(() => {
    if (storage.getAccessToken()) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    storage.setAccessToken(result.accessToken);
    storage.setRefreshToken(result.refreshToken);
    storage.setUser(result.user);
    setUser(result.user);
  };

  const logout = () => {
    storage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};