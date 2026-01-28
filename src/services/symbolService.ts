/**
 * Symbol Service - API calls for symbol search
 */

import { 
  SymbolSearchParams, 
  PaginatedSymbolSearchResponse,
  ApiResponse,
  SymbolQueryParams,
  SymbolData,
  PaginatedSymbolData,
  ExchangeCode
} from '@/types/symbol';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5146';

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
  
  const url = `${API_BASE_URL}/api/v1/symbol/search?${queryParams}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }
    
    const result: ApiResponse<PaginatedSymbolSearchResponse> = await response.json();
    
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
  const url = `http://localhost:5146/api/v1/symbol/tickers`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Get tickers failed: ${response.status} ${response.statusText}`);
    }
    
    const result: ApiResponse<string[]> = await response.json();
    
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
  const url = `${API_BASE_URL}/api/v1/symbol?Exchange=${exchange}&PageSize=5000&PageIndex=1`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Fetch symbols by exchange failed: ${response.status} ${response.statusText}`);
    }
    
    const result: ApiResponse<PaginatedSymbolData> = await response.json();
    
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
  
  const url = `${API_BASE_URL}/api/v1/symbol?${queryParams}`;
  
  console.log('[SymbolService] Fetching symbols from:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Fetch symbols failed: ${response.status} ${response.statusText}`);
    }
    
    const result: ApiResponse<PaginatedSymbolData> = await response.json();
    
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
