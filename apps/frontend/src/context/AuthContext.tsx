import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../services/api';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    address?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { fullName: string; phone: string; address?: string }) => Promise<void>;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Silent session restore on app mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res: any = await api.post('/auth/refresh');
        const token = res.data?.accessToken || res.accessToken;
        const userData = res.data?.user || res.user;
        if (token && userData) {
          setAccessToken(token);
          setUser(userData);
        }
      } catch (err) {
        // Not logged in or expired cookie
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res: any = await api.post('/auth/login', { email, password });
    const token = res.data?.accessToken || res.accessToken;
    const userData = res.data?.user || res.user;
    setAccessToken(token);
    setUser(userData);
  };

  const register = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    address?: string;
  }) => {
    await api.post('/auth/register', data);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (data: { fullName: string; phone: string; address?: string }) => {
    const res: any = await api.put('/users/me', data);
    const updatedUser = res.data || res;
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
  };

  const refreshUser = async () => {
    try {
      const res: any = await api.get('/users/me');
      const updatedUser = res.data || res;
      setUser(updatedUser);
    } catch (err) {
      // Ignore
    }
  };

  const isAdmin = user?.role === Role.ADMIN;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAdmin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};

