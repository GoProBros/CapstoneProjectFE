/**
 * Symbol Service - API calls for symbol search
 */

import { get } from './api';
import { API_ENDPOINTS } from '@/constants';
import { 
  SymbolSearchParams, 
  PaginatedSymbolSearchResponse,
  ApiResponse,
  PaginatedSymbolData,
  SymbolQueryParams,
  SymbolData,
  ExchangeCode
} from '@/types/symbol';

/**
 * Search symbols with pagination support
 */
/**
 * Get all symbols with optional filters
 */
export async function getAllSymbols(type?: number, exchange?: string, sector?: string): Promise<PaginatedSymbolSearchResponse> {
  const queryParams = new URLSearchParams({
    PageIndex: '1',
    PageSize: '1000',
  });
  
  if (type) queryParams.append('Type', String(type));
  if (exchange) queryParams.append('Exchange', exchange);
  if (sector) queryParams.append('Sector', sector);
  
  const url = `${API_BASE_URL}/api/v1/symbol?${queryParams}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch symbols: ${response.status} ${response.statusText}`);
    }
    
    const result: ApiResponse<PaginatedSymbolSearchResponse> = await response.json();
    
    if (result.isSuccess && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch symbols');
    }
  } catch (error) {
    console.error('[SymbolService] Get all symbols error:', error);
    throw error;
  }
}

export async function searchSymbols(params: SymbolSearchParams): Promise<PaginatedSymbolSearchResponse> {
  const { query, isTickerOnly, pageIndex, pageSize } = params;
  
  // Build query string
  const queryParams = new URLSearchParams({
    Query: query,
    IsTickerOnly: String(isTickerOnly),
    PageIndex: String(pageIndex),
    PageSize: String(pageSize),
  });
  
  try {
    const result = await get<PaginatedSymbolSearchResponse>(
      `${API_ENDPOINTS.SYMBOL.SEARCH}?${queryParams}`
    );
    
    console.log('[SymbolService] Search API Response:', {
      isSuccess: result.isSuccess,
      hasData: !!result.data,
      itemsCount: result.data?.items?.length || 0
    });
    
    // Handle ApiResponse wrapper - get() returns ApiResponse<T>
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
 * Fetch symbols từ API với filters
 */
export async function fetchSymbols(params: SymbolQueryParams): Promise<SymbolData[]> {
  const queryParams = new URLSearchParams();
  
  if (params.Type !== undefined) queryParams.append('Type', params.Type.toString());
  if (params.Exchange) queryParams.append('Exchange', params.Exchange);
  if (params.Sector) queryParams.append('Sector', params.Sector);
  if (params.PageIndex !== undefined) queryParams.append('PageIndex', params.PageIndex.toString());
  if (params.PageSize !== undefined) queryParams.append('PageSize', params.PageSize.toString());
  
  try {
    const result = await get<PaginatedSymbolData>(
      `${API_ENDPOINTS.SYMBOL.LIST}?${queryParams.toString()}`
    );
    
    console.log('[SymbolService] API Response:', {
      isSuccess: result.isSuccess,
      hasData: !!result.data,
      itemsCount: result.data?.items?.length || 0
    });
    
    // result is ApiResponse<PaginatedSymbolData>
    // result.data is PaginatedSymbolData
    // result.data.items is SymbolData[]
    if (result.isSuccess && result.data?.items) {
      return result.data.items;
    }
    
    return [];
  } catch (error) {
    console.error('[SymbolService] Fetch symbols error:', error);
    throw error;
  }
}

/**
 * Fetch symbols by exchange với default pageSize = 5000
 */
export async function fetchSymbolsByExchange(exchange: ExchangeCode): Promise<string[]> {
  try {
    console.log(`[SymbolService] 🔍 Fetching symbols: Exchange=${exchange}, Type=1`);
    const symbols = await fetchSymbols({
      Exchange: exchange,
      PageSize: 5000,
      PageIndex: 1,
    });
    
    console.log(`[SymbolService] 📊 API returned ${symbols.length} symbols`);
    
    // Backend có thể không filter đúng
    const stockSymbols = symbols.filter(s => s.exchangeCode === exchange);
    console.log(`[SymbolService] ✅ Filtered to ${stockSymbols.length} stocks on ${exchange}`);
    
    // Extract tickers
    return stockSymbols.map(symbol => symbol.ticker);
  } catch (error) {
    console.error(`[SymbolService] Error fetching ${exchange} symbols:`, error);
    throw error;
  }
}
