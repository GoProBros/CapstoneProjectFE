/**
 * Authentication Service - API calls for authentication
 */

import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  LogoutRequest,
  ApiResponse,
} from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7148';

/**
 * Register new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/api/v1/auth/register`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Registration failed: ${response.status} ${response.statusText}`);
    }
    
    const result: ApiResponse<AuthResponse> = await response.json();
    
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
  const url = `${API_BASE_URL}/api/v1/auth/login`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Login failed: ${response.status} ${response.statusText}`);
    }
    
    const result: ApiResponse<AuthResponse> = await response.json();
    
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
  const url = `${API_BASE_URL}/api/v1/auth/refresh-token`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Refresh token failed: ${response.status} ${response.statusText}`);
    }
    
    const result: ApiResponse<AuthResponse> = await response.json();
    
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
  const url = `${API_BASE_URL}/api/v1/auth/logout`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Logout failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('[AuthService] Logout error:', error);
    throw error;
  }
}
