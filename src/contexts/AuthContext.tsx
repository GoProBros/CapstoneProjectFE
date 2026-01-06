"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth';
import * as authService from '@/services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const EXPIRES_AT_KEY = 'expiresAt';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Save auth data to localStorage
   */
  const saveAuthData = useCallback((authData: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, authData.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);
    localStorage.setItem(EXPIRES_AT_KEY, authData.expiresAt);
    localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    setUser(authData.user);
  }, []);

  /**
   * Clear auth data from localStorage
   */
  const clearAuthData = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    
    // Clear refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  /**
   * Refresh access token
   */
  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      
      if (!refreshToken || !userStr) {
        throw new Error('No refresh token or user data found');
      }
      
      const userData: User = JSON.parse(userStr);
      
      const authData = await authService.refreshToken({
        refreshToken,
        userId: userData.id,
      });
      
      saveAuthData(authData);
      console.log('[Auth] Token refreshed successfully');
    } catch (error) {
      console.error('[Auth] Failed to refresh token:', error);
      clearAuthData();
      router.push('/login');
    }
  }, [saveAuthData, clearAuthData, router]);

  /**
   * Schedule token refresh before expiration
   * Note: expiresAt from backend is in UTC (GMT+0), new Date() automatically
   * converts UTC string to local time for comparison
   */
  const scheduleTokenRefresh = useCallback((expiresAt: string) => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    
    // Parse expiration time - Date automatically handles UTC to local conversion
    const expirationTime = new Date(expiresAt).getTime();
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    // Log for debugging timezone issues
    console.log(`[Auth] Token expires at: ${expiresAt} (UTC)`);
    console.log(`[Auth] Local expiration: ${new Date(expirationTime).toLocaleString()}`);
    console.log(`[Auth] Current local time: ${new Date(currentTime).toLocaleString()}`);
    console.log(`[Auth] Time until expiry: ${Math.round(timeUntilExpiry / 1000)} seconds`);
    
    // Refresh 5 minutes before expiration (or immediately if already expired)
    const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);
    
    console.log(`[Auth] Scheduling token refresh in ${Math.round(refreshTime / 1000)} seconds`);
    
    refreshTimerRef.current = setTimeout(() => {
      console.log('[Auth] Token refresh timer triggered');
      refreshAccessToken();
    }, refreshTime);
  }, [refreshAccessToken]);

  /**
   * Login
   */
  const login = useCallback(async (data: LoginRequest) => {
    try {
      const authData = await authService.login(data);
      saveAuthData(authData);
      scheduleTokenRefresh(authData.expiresAt);
      router.push('/dashboard');
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      throw error;
    }
  }, [saveAuthData, scheduleTokenRefresh, router]);

  /**
   * Register
   */
  const register = useCallback(async (data: RegisterRequest) => {
    try {
      const authData = await authService.register(data);
      saveAuthData(authData);
      scheduleTokenRefresh(authData.expiresAt);
      router.push('/dashboard');
    } catch (error) {
      console.error('[Auth] Registration failed:', error);
      throw error;
    }
  }, [saveAuthData, scheduleTokenRefresh, router]);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const accessToken = localStorage.getItem(TOKEN_KEY);
      
      if (refreshToken && accessToken) {
        await authService.logout({
          refreshToken,
          accessToken,
        });
      }
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      clearAuthData();
      router.push('/login');
    }
  }, [clearAuthData, router]);

  /**
   * Initialize auth state from localStorage
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        const userStr = localStorage.getItem(USER_KEY);
        const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
        
        if (token && userStr && expiresAt) {
          const userData: User = JSON.parse(userStr);
          const expirationTime = new Date(expiresAt).getTime();
          const currentTime = Date.now();
          
          // Check if token is expired or will expire soon (within 5 minutes)
          const fiveMinutes = 5 * 60 * 1000;
          if (expirationTime - currentTime < fiveMinutes) {
            console.log('[Auth] Token expired or expiring soon, refreshing on startup...');
            // Token expired or expiring soon, refresh immediately
            if (refreshToken) {
              await refreshAccessToken();
            } else {
              clearAuthData();
            }
          } else {
            // Token still valid
            setUser(userData);
            scheduleTokenRefresh(expiresAt);
          }
        }
      } catch (error) {
        console.error('[Auth] Failed to initialize auth:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, [scheduleTokenRefresh, refreshAccessToken, clearAuthData]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
