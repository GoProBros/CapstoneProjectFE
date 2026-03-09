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
export * from './layout';
export * from './watchList';
export * from './workspace';
export * from './sector';
export * from './file';
export * from './analysisReport';
export * from './marketIndex';

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated data structure from backend
 */
export interface PaginatedData<T> {
  items: T[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * API Response with paginated data
 */
export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;
