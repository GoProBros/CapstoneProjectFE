/**
 * Authentication Service - API calls for authentication
 */

import { post } from '@/services/api';
import type { ApiResponse } from '@/types';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  LogoutRequest,
} from '@/types/auth';

/**
 * Register new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  try {
    const result = await post<AuthResponse>('/api/v1/auth/register', data);
    
    if (result.isSuccess && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Registration failed');
    }
  } catch (error) {
    console.error('[AuthService] Register error:', error);
    throw error;
  }
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  try {
    const result = await post<AuthResponse>('/api/v1/auth/login', data);
    
    if (result.isSuccess && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Login failed');
    }
  } catch (error) {
    console.error('[AuthService] Login error:', error);
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
  try {
    const result = await post<AuthResponse>('/api/v1/auth/refresh-token', data);
    
    if (result.isSuccess && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Refresh token failed');
    }
  } catch (error) {
    console.error('[AuthService] Refresh token error:', error);
    throw error;
  }
}

/**
 * Logout user
 */
export async function logout(data: LogoutRequest): Promise<void> {
  try {
    await post<void>('/api/v1/auth/logout', {
      refreshToken: data.refreshToken,
      accessToken: data.accessToken
    });
    
    // Clear all user-related data from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAt');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('[AuthService] Logout error:', error);
    // Even if API call fails, clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAt');
    localStorage.removeItem('user');
    throw error;
  }
}
