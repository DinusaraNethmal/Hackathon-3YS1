import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, loginApi, registerApi, getMeApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('routelk_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on initial load
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('routelk_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getMeApi(savedToken);
        if (response.success && response.user) {
          setUser(response.user);
          setToken(savedToken);
        } else {
          localStorage.removeItem('routelk_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Session restore failed:', err);
        localStorage.removeItem('routelk_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await loginApi(email, password);
      if (res.token && res.user) {
        localStorage.setItem('routelk_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return res.user;
      }
      throw new Error('Invalid response from server');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await registerApi(name, email, password, phone);
      if (res.token && res.user) {
        localStorage.setItem('routelk_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return res.user;
      }
      throw new Error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('routelk_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
