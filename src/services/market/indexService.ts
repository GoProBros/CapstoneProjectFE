/**
 * Index Service - Market Index Data
 * Provides REST access to live index snapshots and intraday history.
 */

import { get } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type { LiveIndexData, IndexHistoryPoint } from '@/types/marketIndex';

/** Default codes shown in the Index Module (order matters for display). */
export const DEFAULT_INDEX_CODES = ['VNINDEX', 'VN30', 'HNX30', 'HNXINDEX', 'HNXUPCOMINDEX', 'VNALL'] as const;

/**
 * Fetch live snapshots for the given index codes from Redis.
 * Endpoint: GET /api/v1/market-indices/live?codes=VNINDEX&codes=VN30&...
 */
export async function fetchLiveIndices(codes: string[] = [...DEFAULT_INDEX_CODES]): Promise<LiveIndexData[]> {
  const params = new URLSearchParams();
  codes.forEach(c => params.append('codes', c));
  const response = await get<LiveIndexData[]>(`${API_ENDPOINTS.MARKET_INDICES.LIVE}?${params.toString()}`);
  if (response.isSuccess && response.data) return response.data;
  throw new Error(response.message || 'Không thể tải dữ liệu chỉ số');
}

/**
 * Fetch today's intraday history for a single index code from Redis.
 * Endpoint: GET /api/v1/market-indices/{code}/intraday
 * Returns points in chronological order (oldest first).
 */
export async function fetchIndexIntraday(code: string): Promise<IndexHistoryPoint[]> {
  // Request 4000 points — covers full trading day (9:00-11:30 + 13:00-15:00) at 5s intervals ≈ 3,240 pts
  const response = await get<IndexHistoryPoint[]>(`${API_ENDPOINTS.MARKET_INDICES.INTRADAY(code)}?maxPoints=4000`);
  if (response.isSuccess && response.data) return response.data;
  throw new Error(response.message || `Không thể tải lịch sử ${code}`);
}


/**
 * Index types supported by the system
 */
export type IndexType = 'VN30' | 'VN50' | 'VN100' | 'VNMID' | 'VNSML' | 'VNALL' | 'VN30F1M' | 'VN30F2M';

/**
 * Index information
 */
export interface IndexInfo {
  code: IndexType;
  name: string;
  description: string;
  symbolCount: number;
  lastUpdated: string;
}

/**
 * Fetch list of all available indices
 * 
 * TODO: Implement when endpoint is ready
 * Expected endpoint: GET /api/v1/indices
 * 
 * @returns Promise<IndexInfo[]> List of available indices
 */
export async function fetchIndices(): Promise<IndexInfo[]> {
  // TODO: Replace with actual API call
  throw new Error('API not implemented yet. Expected endpoint: GET /api/v1/indices');
  
  /* Example implementation when API is ready:
  try {
    const response = await get<IndexInfo[]>(API_ENDPOINTS.INDICES.LIST);
    
    if (response.isSuccess && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Không thể tải danh sách chỉ số');
  } catch (error) {
    console.error('[IndexService] Error fetching indices:', error);
    throw error;
  }
  */
}

/**
 * Fetch symbols belonging to a specific index
 * 
 * TODO: Implement when endpoint is ready
 * Expected endpoint: GET /api/v1/indices/{indexType}/symbols
 * 
 * @param indexType - Type of index (VN30, VN50, etc.)
 * @returns Promise<string[]> Array of ticker symbols
 */
export async function fetchSymbolsByIndex(indexType: IndexType): Promise<string[]> {
  // TODO: Replace with actual API call
  throw new Error(`API not implemented yet. Expected endpoint: GET /api/v1/indices/${indexType}/symbols`);
  
  /* Example implementation when API is ready:
  try {
    const response = await get<string[]>(API_ENDPOINTS.INDICES.BY_TYPE(indexType));
    
    if (response.isSuccess && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || `Không thể tải danh sách mã thuộc ${indexType}`);
  } catch (error) {
    console.error(`[IndexService] Error fetching symbols for ${indexType}:`, error);
    throw error;
  }
  */
}

/**
 * Fetch detailed information about a specific index
 * 
 * TODO: Implement when endpoint is ready
 * Expected endpoint: GET /api/v1/indices/{indexType}
 * 
 * @param indexType - Type of index
 * @returns Promise<IndexInfo> Detailed index information
 */
export async function fetchIndexInfo(indexType: IndexType): Promise<IndexInfo> {
  // TODO: Replace with actual API call
  throw new Error(`API not implemented yet. Expected endpoint: GET /api/v1/indices/${indexType}`);
  
  /* Example implementation when API is ready:
  try {
    const response = await get<IndexInfo>(API_ENDPOINTS.INDICES.DETAIL(indexType));
    
    if (response.isSuccess && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || `Không thể tải thông tin chỉ số ${indexType}`);
  } catch (error) {
    console.error(`[IndexService] Error fetching info for ${indexType}:`, error);
    throw error;
  }
  */
}

/**
 * Mock data for development/testing
 * Remove this when API is implemented
 */
export const MOCK_INDEX_DATA: Record<IndexType, string[]> = {
  VN30: [
    'VNM', 'VCB', 'HPG', 'VHM', 'VIC', 'MSN', 'GAS', 'TCB', 'BID', 'CTG',
    'VPB', 'MBB', 'PLX', 'VRE', 'SAB', 'FPT', 'POW', 'ACB', 'GVR', 'MWG',
    'SSI', 'HDB', 'TPB', 'VJC', 'NVL', 'PDR', 'STB', 'VNM', 'KDH', 'BCM'
  ],
  VN50: [
    'VNM', 'VCB', 'HPG', 'VHM', 'VIC', 'MSN', 'GAS', 'TCB', 'BID', 'CTG',
    'VPB', 'MBB', 'PLX', 'VRE', 'SAB', 'FPT', 'POW', 'ACB', 'GVR', 'MWG',
    'SSI', 'HDB', 'TPB', 'VJC', 'NVL', 'PDR', 'STB', 'VNM', 'KDH', 'BCM',
    'HNG', 'DGC', 'DXG', 'PNJ', 'SBT', 'VCI', 'DPM', 'REE', 'HAG', 'GMD',
    'PVD', 'DCM', 'SCS', 'VHC', 'KBC', 'PC1', 'BWE', 'HCM', 'NT2', 'DHC'
  ],
  VN100: [], // TODO: Add actual symbols
  VNMID: [], // TODO: Add actual symbols
  VNSML: [], // TODO: Add actual symbols
  VNALL: [], // TODO: Add actual symbols
  VN30F1M: [], // TODO: Add actual symbols
  VN30F2M: [], // TODO: Add actual symbols
};

/**
 * Development helper: Get mock symbols for an index
 * Remove this when API is implemented
 */
export function getMockSymbolsByIndex(indexType: IndexType): string[] {
  return MOCK_INDEX_DATA[indexType] || [];
}

// TODO: Add these endpoints to constants/endpoints.ts when API is ready
/*
export const INDEX_ENDPOINTS = {
  LIST: '/api/v1/indices',
  BY_TYPE: (indexType: string) => `/api/v1/indices/${indexType}/symbols`,
  DETAIL: (indexType: string) => `/api/v1/indices/${indexType}`,
};
*/
