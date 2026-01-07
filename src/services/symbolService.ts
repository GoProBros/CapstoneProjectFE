/**
 * Symbol Service - API calls for symbol search
 */

import { 
  SymbolSearchParams, 
  PaginatedSymbolSearchResponse,
  ApiResponse,
  SymbolApiResponse,
  SymbolQueryParams,
  SymbolData,
  ExchangeCode
} from '@/types/symbol';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7148';

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
 * Fetch symbols từ API với filters
 */
export async function fetchSymbols(params: SymbolQueryParams): Promise<SymbolData[]> {
  const queryParams = new URLSearchParams();
  
  if (params.Type !== undefined) queryParams.append('Type', params.Type.toString());
  if (params.Exchange) queryParams.append('Exchange', params.Exchange);
  if (params.Sector) queryParams.append('Sector', params.Sector);
  if (params.PageIndex !== undefined) queryParams.append('PageIndex', params.PageIndex.toString());
  if (params.PageSize !== undefined) queryParams.append('PageSize', params.PageSize.toString());
  
  const url = `${API_BASE_URL}/api/v1/symbol?${queryParams.toString()}`;
  
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
    
    const result: SymbolApiResponse = await response.json();
    
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
 * CHỈ LẤY STOCKS (Type = 1)
 */
export async function fetchSymbolsByExchange(exchange: ExchangeCode): Promise<string[]> {
  try {
    console.log(`[SymbolService] 🔍 Fetching symbols: Exchange=${exchange}, Type=1`);
    const symbols = await fetchSymbols({
      Exchange: exchange,
      Type: 1, // Stock only
      PageSize: 5000,
      PageIndex: 1,
    });
    
    console.log(`[SymbolService] 📊 API returned ${symbols.length} symbols`);
    
    // CRITICAL: FILTER client-side để đảm bảo chỉ lấy Type=1 (Stock)
    // Backend có thể không filter đúng
    const stockSymbols = symbols.filter(s => s.type === 1 && s.exchangeCode === exchange);
    console.log(`[SymbolService] ✅ Filtered to ${stockSymbols.length} stocks on ${exchange}`);
    
    // Extract tickers
    return stockSymbols.map(symbol => symbol.ticker);
  } catch (error) {
    console.error(`[SymbolService] Error fetching ${exchange} symbols:`, error);
    throw error;
  }
}
