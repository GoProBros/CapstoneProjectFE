/**
 * Symbol Service - API calls for symbol search
 */

import { 
  SymbolSearchParams, 
  PaginatedSymbolSearchResponse,
  SymbolQueryParams,
  SymbolData,
  PaginatedSymbolData,
  ExchangeCode
} from '@/types/symbol';
import { get } from './api';
import { API_ENDPOINTS } from '@/constants';

/**
 * Search symbols with pagination support
 */
export async function searchSymbols(params: SymbolSearchParams): Promise<PaginatedSymbolSearchResponse> {
  const { query, isTickerOnly, pageIndex, pageSize } = params;
  
  // Build query string
  const queryParams = new URLSearchParams({
    Query: query,
    IsTickerOnly: String(isTickerOnly),
    PageIndex: String(pageIndex),
    PageSize: String(pageSize),
  });
  
  const endpoint = `${API_ENDPOINTS.SYMBOL.SEARCH}?${queryParams}`;
  
  try {
    const result = await get<PaginatedSymbolSearchResponse>(endpoint);
    
    // Handle ApiResponse wrapper
    if (result.isSuccess && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Search failed');
    }
  } catch (error) {
    console.error('[SymbolService] Search error:', error);
    throw error;
  }
}

/**
 * Get all stock tickers
 */
export async function getAllTickers(): Promise<string[]> {
  try {
    const result = await get<string[]>('/api/v1/symbol/tickers');
    
    // Handle ApiResponse wrapper
    if (result.isSuccess && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Get tickers failed');
    }
  } catch (error) {
    console.error('[SymbolService] Get tickers error:', error);
    throw error;
  }
}

/**
 * Fetch symbols by exchange
 */
export async function fetchSymbolsByExchange(exchange: ExchangeCode): Promise<string[]> {
  const endpoint = `${API_ENDPOINTS.SYMBOL.LIST}?Exchange=${exchange}&PageSize=5000&PageIndex=1`;
  
  try {
    const result = await get<PaginatedSymbolData>(endpoint);
    
    // Handle ApiResponse wrapper
    if (result.isSuccess && result.data && result.data.items) {
      return result.data.items.map(symbol => symbol.ticker);
    } else {
      throw new Error(result.message || 'Fetch symbols by exchange failed');
    }
  } catch (error) {
    console.error('[SymbolService] Fetch symbols by exchange error:', error);
    throw error;
  }
}

/**
 * Fetch symbols with filters
 */
export async function fetchSymbols(params: SymbolQueryParams): Promise<SymbolData[]> {
  const queryParams = new URLSearchParams();
  
  if (params.Type !== undefined) queryParams.append('Type', String(params.Type));
  if (params.Exchange) queryParams.append('Exchange', params.Exchange);
  if (params.Sector) queryParams.append('Sector', params.Sector);
  if (params.PageIndex !== undefined) queryParams.append('PageIndex', String(params.PageIndex));
  if (params.PageSize !== undefined) queryParams.append('PageSize', String(params.PageSize));
  
  const endpoint = `${API_ENDPOINTS.SYMBOL.LIST}?${queryParams}`;
  
  console.log('[SymbolService] Fetching symbols from:', endpoint);
  
  try {
    const result = await get<PaginatedSymbolData>(endpoint);
    
    console.log('[SymbolService] API response:', result);
    
    // Handle ApiResponse wrapper
    if (result.isSuccess && result.data && result.data.items) {
      console.log('[SymbolService] Fetched', result.data.items.length, 'symbols');
      return result.data.items;
    } else {
      throw new Error(result.message || 'Fetch symbols failed');
    }
  } catch (error) {
    console.error('[SymbolService] Fetch symbols error:', error);
    throw error;
  }
}
