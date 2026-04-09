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

/**
 * Symbol List API Types (for Exchange filter)
 */

/**
 * Symbol type enum
 */
export enum SymbolType {
  Stock = 1,
  ETF = 4,
  Bond = 3,
  Futures = 2,
}

/**
 * Symbol status enum
 */
export enum SymbolStatus {
  Active = 1,
  Inactive = 0,
}

/**
 * Exchange codes
 */
export type ExchangeCode = 'HSX' | 'HNX' | 'UPCOM';

/**
 * Symbol data từ API
 */
export interface SymbolData {
  isin: string | null;
  exchangeCode: ExchangeCode;
  sectorId: string | null;
  type: SymbolType;
  status: SymbolStatus;
  ticker: string;
  viCompanyName: string;
  enCompanyName: string;
}

/**
 * Paginated response data cho Symbol list
 */
export interface PaginatedSymbolData {
  items: SymbolData[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  Items?: SymbolData[];
  PageIndex?: number;
  TotalPages?: number;
  TotalCount?: number;
  HasPreviousPage?: boolean;
  HasNextPage?: boolean;
}

/**
 * Symbol query params
 */
export interface SymbolQueryParams {
  Type?: SymbolType;
  Exchange?: ExchangeCode;
  Sector?: string;
  PageIndex?: number;
  PageSize?: 10 | 20 | 30 | 50 | 100 | 1000 | 5000;
}
