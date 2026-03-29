import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.ts';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  }, []);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await authApi.me(token);
        setUser(userData);
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    verifyToken();
  }, [token, logout]);

  const login = async (email: string, password: string) => {
    const { token: newToken, user: userData } = await authApi.login(email, password);
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated: !!user && !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
