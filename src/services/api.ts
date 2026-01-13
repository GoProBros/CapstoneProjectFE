// API service configuration and helper functions
import { ApiResponse } from '@/types';
import { API_ENDPOINTS } from '@/constants';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7148';

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const EXPIRES_AT_KEY = 'expiresAt';
const USER_KEY = 'user';

/**
 * Get access token from localStorage
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Check if token is expired (with 30 second buffer)
 * Handles UTC timezone from backend
 */
function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;
  
  const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
  if (!expiresAt) return true;
  
  // Parse the expiration time - backend sends UTC time
  // new Date() automatically converts UTC string to local time
  const expirationTime = new Date(expiresAt).getTime();
  const currentTime = Date.now();
  
  // Add 30 second buffer to prevent edge cases
  return currentTime >= (expirationTime - 30 * 1000);
}

/**
 * Attempt to refresh the access token
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    
    if (!refreshToken || !userStr) {
      console.warn('[API] No refresh token or user data for token refresh');
      return null;
    }
    
    const userData = JSON.parse(userStr);
    
    // Call refresh token endpoint WITHOUT using apiRequest to avoid infinite loop
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
        userId: userData.id,
      }),
    });
    
    if (!response.ok) {
      console.error('[API] Token refresh failed:', response.statusText);
      clearAuthData();
      return null;
    }
    
    const result = await response.json();
    
    if (result.isSuccess && result.data) {
      // Save new tokens
      localStorage.setItem(TOKEN_KEY, result.data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken);
      localStorage.setItem(EXPIRES_AT_KEY, result.data.expiresAt);
      localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
      
      console.log('[API] Token refreshed successfully');
      return result.data.accessToken;
    }
    
    console.error('[API] Token refresh response invalid');
    clearAuthData();
    return null;
  } catch (error) {
    console.error('[API] Token refresh error:', error);
    clearAuthData();
    return null;
  }
}

/**
 * Clear auth data (without redirect)
 */
function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Check if endpoint requires authentication
 */
function requiresAuth(endpoint: string): boolean {
  // Public endpoints that don't require auth
  const publicEndpoints = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh-token',
    '/api/v1/auth/forgot-password',
  ];
  
  return !publicEndpoints.some(pub => endpoint.startsWith(pub));
}

/**
 * Generic API fetch wrapper with Bearer token and auto-refresh
 * Auth is optional - endpoints can work without authentication
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    let accessToken = getAccessToken();
    
    // Check if endpoint requires auth and if token needs refresh
    if (requiresAuth(endpoint) && accessToken) {
      if (isTokenExpired()) {
        console.log('[API] Token expired, attempting refresh...');
        accessToken = await refreshAccessToken();
        // If refresh fails, continue without auth (let backend handle)
      }
    }
    
    // Build headers with Bearer token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };
    
    // Add Authorization header if token exists (optional)
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - try to refresh token once
    if (response.status === 401 && accessToken) {
      console.log('[API] Received 401, attempting token refresh...');
      accessToken = await refreshAccessToken();
      
      if (accessToken) {
        // Retry the request with new token
        headers['Authorization'] = `Bearer ${accessToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => null);
          throw new Error(errorData?.message || `API Error: ${retryResponse.statusText}`);
        }
        
        const retryData = await retryResponse.json();
        
        // Check if backend returned error with isSuccess: false
        if (retryData && typeof retryData.isSuccess === 'boolean' && !retryData.isSuccess) {
          throw new Error(retryData.message || 'API request failed');
        }
        
        return retryData;
      } else {
        // Clear auth data but don't redirect - let component handle
        clearAuthData();
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Authentication required');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if backend returned error with isSuccess: false
    if (data && typeof data.isSuccess === 'boolean' && !data.isSuccess) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

/**
 * GET request
 */
export async function get<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function post<T>(
  endpoint: string,
  body: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request
 */
export async function put<T>(
  endpoint: string,
  body: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}
