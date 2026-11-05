import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';
import {
  changePassword as changePasswordApi,
  clearAuthStorage,
  getMe,
  hasToken,
  loginApi,
  registerApi,
  updateProfile as updateProfileApi,
} from '@/api/auth';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  saveProfile: (input: { name?: string; currency?: string }) => Promise<User>;
  changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Restore session on first load.
  useEffect(() => {
    if (!hasToken()) {
      setInitializing(false);
      return;
    }
    getMe()
      .then((res) => setUser(res.data))
      .catch(() => clearAuthStorage())
      .finally(() => setInitializing(false));
  }, []);

  // Any 401 outside the auth screens ends the session (see api/client.ts).
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginApi(email, password);
    setUser(res.data);
  }, []);

  const register = useCallback(async (input: { name: string; email: string; password: string }) => {
    const res = await registerApi(input);
    setUser(res.data);
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: User) => setUser(updated), []);

  const saveProfile = useCallback(async (input: { name?: string; currency?: string }) => {
    const res = await updateProfileApi(input);
    setUser(res.data);
    return res.data;
  }, []);

  const changePassword = useCallback(async (input: { currentPassword: string; newPassword: string }) => {
    await changePasswordApi(input);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, register, logout, updateUser, saveProfile, changePassword }),
    [user, initializing, login, register, logout, updateUser, saveProfile, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
