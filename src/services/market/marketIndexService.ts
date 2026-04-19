/**
 * Market Index Service
 * Handles API calls for market indices and their constituent symbols
 */

import { get } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type { ApiResponse, PaginatedData } from '@/types';
import type { MarketIndex, MarketIndexSymbol } from '@/types/marketIndex';

export interface GetMarketIndicesParams {
  exchangeCode?: string;
  isBenchmark?: boolean;
  status?: number;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface GetIndexConstituentsParams {
  isActive?: boolean;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}

/**
 * Fetch a paginated list of market indices
 */
export const getMarketIndices = async (
  params?: GetMarketIndicesParams
): Promise<ApiResponse<PaginatedData<MarketIndex>>> => {
  const queryParams = new URLSearchParams();
  if (params?.exchangeCode) queryParams.append('exchangeCode', params.exchangeCode);
  if (params?.isBenchmark !== undefined) queryParams.append('isBenchmark', String(params.isBenchmark));
  if (params?.status !== undefined) queryParams.append('status', String(params.status));
  if (params?.search) queryParams.append('search', params.search);
  if (params?.pageIndex !== undefined) queryParams.append('pageIndex', String(params.pageIndex));
  if (params?.pageSize !== undefined) queryParams.append('pageSize', String(params.pageSize));

  const url = `${API_ENDPOINTS.MARKET_INDICES.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return await get<PaginatedData<MarketIndex>>(url);
};

/**
 * Fetch the constituent symbols for a given market index
 */
export const getIndexConstituents = async (
  code: string,
  params?: GetIndexConstituentsParams
): Promise<ApiResponse<PaginatedData<MarketIndexSymbol>>> => {
  const queryParams = new URLSearchParams();
  if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
  if (params?.search) queryParams.append('search', params.search);
  if (params?.pageIndex !== undefined) queryParams.append('pageIndex', String(params.pageIndex));
  if (params?.pageSize !== undefined) queryParams.append('pageSize', String(params.pageSize));

  const url = `${API_ENDPOINTS.MARKET_INDICES.CONSTITUENTS(code)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return await get<PaginatedData<MarketIndexSymbol>>(url);
};
