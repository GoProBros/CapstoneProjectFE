/**
 * Symbol Service - API calls for symbol search
 */

import { 
  SymbolSearchParams, 
  PaginatedSymbolSearchResponse,
  ApiResponse 
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
