// Common TypeScript types and interfaces

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  validationErrors?: Record<string, string[]>;
  responseTime: string;
  data: T;
}

// Re-export all types
export * from './market';
export * from './symbol';
export * from './columnLayout';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
