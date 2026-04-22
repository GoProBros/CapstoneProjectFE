/**
 * Core API response types shared across the entire application.
 * All services should import ApiResponse, PaginatedData, PaginatedResponse from here.
 */

export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
  validationErrors?: Record<string, string[]>;
  responseTime?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated data structure returned by the backend.
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
 * Convenience alias: API response wrapping paginated data.
 */
export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;
