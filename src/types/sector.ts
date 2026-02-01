/**
 * Sector-related TypeScript types and interfaces
 */

/**
 * Sector status enum
 */
export enum SectorStatus {
  Inactive = 0,
  Active = 1,
}

/**
 * Sector interface representing a market sector/industry
 */
export interface Sector {
  id: string;
  enName: string;
  viName: string;
  level: number;
  status: SectorStatus;
  symbols: string[];
}

/**
 * Query parameters for fetching sectors
 */
export interface GetSectorsParams {
  level?: number;
  status?: SectorStatus;
  pageIndex?: number;
  pageSize?: number;
}

/**
 * Paginated sectors response data structure
 */
export interface SectorsPaginatedData {
  items: Sector[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
