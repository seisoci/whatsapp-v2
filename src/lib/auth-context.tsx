'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, setTokens, clearTokens, getUser, setUser as saveUser, getAccessToken } from './api-client';
import { routes } from '@/config/routes';

interface User {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
  emailVerified: boolean;
  role?: {
    id: string;
    name: string;
    slug: string;
    permissions: any[];
    menus: any[];
  };
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string | string[]) => boolean;
  isSuperAdmin: () => boolean;
  getPermissionSlugs: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Try to get user from localStorage first
      const cachedUser = getUser();
      if (cachedUser) {
        setUser(cachedUser);
      }

      // Fetch fresh user data from API
      const response = await authApi.me();
      if (response.success && response.data) {
        const userData = response.data;
        setUser(userData);
        saveUser(userData);
      } else {
        clearTokens();
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });

      // Response already contains { success, message, data }
      if (response.success && response.data) {
        const { user: userData, tokens } = response.data;

        // Save tokens
        setTokens(tokens.accessToken, tokens.refreshToken);

        // Save user data
        setUser(userData);
        saveUser(userData);

        // Force page reload to home after login
        window.location.href = '/';
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setUser(null);
      router.push(routes.signIn);
    }
  };

  const refetchUser = async () => {
    try {
      const response = await authApi.me();
      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        setUser(userData);
        saveUser(userData);
      }
    } catch (error) {
      console.error('Refetch user error:', error);
      clearTokens();
      setUser(null);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.role) return false;
    // Super admin has all permissions
    if (user.role.slug === 'super-admin') return true;
    return user.role.permissions?.some((p: any) => p.slug === permission) || false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user || !user.role) return false;
    // Super admin has all permissions
    if (user.role.slug === 'super-admin') return true;
    return permissions.some((permission) =>
      user.role?.permissions?.some((p: any) => p.slug === permission)
    );
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user || !user.role) return false;
    // Super admin has all permissions
    if (user.role.slug === 'super-admin') return true;
    return permissions.every((permission) =>
      user.role?.permissions?.some((p: any) => p.slug === permission)
    );
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user || !user.role) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role.slug);
  };

  const isSuperAdmin = (): boolean => {
    if (!user || !user.role) return false;
    return user.role.slug === 'super-admin';
  };

  const getPermissionSlugs = (): string[] => {
    if (!user || !user.role || !user.role.permissions) return [];
    return user.role.permissions.map((p: any) => p.slug);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refetchUser,
        isAuthenticated: !!user,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        isSuperAdmin,
        getPermissionSlugs,
      }}
    >
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
