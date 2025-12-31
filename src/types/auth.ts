/**
 * Authentication Types
 */

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  isEmailVerified: boolean;
  subscriptionLevel: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO 8601 date string
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  userId: string;
}

export interface LogoutRequest {
  refreshToken: string;
  accessToken: string;
}
