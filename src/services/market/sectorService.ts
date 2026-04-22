/**
 * Sector Service
 * Handles API calls for sector and stock ticker operations
 * 
 * Note: These GET endpoints do not require authentication/authorization.
 * They are automatically called once when entering the system and won't auto-refresh,
 * except when manually called (for admin/staff roles in the future).
 */

import { get } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type { ApiResponse, GetSectorsParams, SectorsPaginatedData, Sector } from '@/types';

/**
 * Fetch sectors with optional filters and pagination
 * No authentication required - public endpoint
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated list of sectors with their stock tickers
 */
export const getSectors = async (
  params?: GetSectorsParams
): Promise<ApiResponse<SectorsPaginatedData>> => {
  const queryParams = new URLSearchParams();
  
  if (params?.level !== undefined) {
    queryParams.append('level', params.level.toString());
  }
  if (params?.status !== undefined) {
    queryParams.append('status', params.status.toString());
  }
  if (params?.pageIndex !== undefined) {
    queryParams.append('pageIndex', params.pageIndex.toString());
  }
  if (params?.pageSize !== undefined) {
    queryParams.append('pageSize', params.pageSize.toString());
  }

  const url = `${API_ENDPOINTS.SECTORS.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return await get<SectorsPaginatedData>(url);
};

/**
 * Fetch a single sector by ID
 * No authentication required - public endpoint
 * @param sectorId - The sector ID to retrieve
 * @returns Single sector with its stock tickers
 */
export const getSectorById = async (
  sectorId: string
): Promise<ApiResponse<Sector>> => {
  return await get<Sector>(API_ENDPOINTS.SECTORS.BY_ID(sectorId));
};

const sectorService = {
  getSectors,
  getSectorById,
};

export default sectorService;
