/**
 * Symbol Search Types
 */

export interface SymbolSearchResultDto {
  ticker: string;
  viCompanyName: string;
  enCompanyName: string;
}

export interface PaginatedSymbolSearchResponse {
  items: SymbolSearchResultDto[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface SymbolSearchParams {
  query: string;
  isTickerOnly: boolean;
  pageIndex: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
  errors?: string[];
  responseTime?: string;
}
