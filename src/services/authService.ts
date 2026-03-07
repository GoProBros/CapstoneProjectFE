/**
 * Authentication Service - API calls for authentication
 */

import { post, get } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
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
    const result = await post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
    
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
    const result = await post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
    
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
    const result = await post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH_TOKEN, data);
    
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
    await post<void>(API_ENDPOINTS.AUTH.LOGOUT, {
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

/**
 * Get current authenticated user info
 */
export async function getMe(): Promise<import('@/types/auth').User> {
  try {
    const result = await get<import('@/types/auth').User>(API_ENDPOINTS.AUTH.ME);
    if (result.isSuccess && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to get user info');
    }
  } catch (error) {
    console.error('[AuthService] GetMe error:', error);
    throw error;
  }
}

/**
 * Send a password reset OTP email
 */
export async function forgotPassword(email: string): Promise<void> {
  try {
    const result = await post<null>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    if (!result.isSuccess) {
      throw new Error(result.message || 'Gửi email thất bại');
    }
  } catch (error) {
    console.error('[AuthService] ForgotPassword error:', error);
    throw error;
  }
}

/**
 * Reset password using OTP sent by forgotPassword
 */
export async function resetPassword(email: string, resetToken: string, newPassword: string): Promise<void> {
  try {
    const result = await post<null>(API_ENDPOINTS.AUTH.RESET_PASSWORD, { email, resetToken, newPassword });
    if (!result.isSuccess) {
      throw new Error(result.message || 'Đặt lại mật khẩu thất bại');
    }
  } catch (error) {
    console.error('[AuthService] ResetPassword error:', error);
    throw error;
  }
}
