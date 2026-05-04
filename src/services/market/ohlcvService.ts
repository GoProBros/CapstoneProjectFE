/**
 * OHLCV Service
 * Handles API calls for fetching OHLCV (Open, High, Low, Close, Volume) historical data
 */

import { get } from '@/services/api';

export interface OhlcvDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OhlcvResponse {
  ticker: string;
  timeframe: string;
  data: OhlcvDataPoint[];
  fromDate: string;
  toDate: string;
  totalCount: number;
}

export interface FetchOhlcvParams {
  ticker: string;
  timeframe: string;
  fromDate: string;
  toDate: string;
  useCache?: boolean;
}

/**
 * Fetch OHLCV historical data for a symbol
 * @param params - Query parameters for OHLCV data
 * @returns Promise with OHLCV data
 */
export async function fetchOhlcvData(params: FetchOhlcvParams): Promise<OhlcvResponse> {
  const { ticker, timeframe, fromDate, toDate, useCache = true } = params;
  
  const queryParams = new URLSearchParams({
    timeframe,
    fromDate,
    toDate,
    useCache: useCache.toString(),
  });

  const url = `/api/v1/ohlcv/${ticker}?${queryParams.toString()}`;

  try {
    const response = await get<OhlcvResponse>(url);
    
    if (!response.isSuccess || !response.data) {
      throw new Error(response.message || 'Failed to fetch OHLCV data');
    }
    
    return response.data;
  } catch (error) {
    console.error('[OhlcvService] Error fetching OHLCV data:', error);
    throw error;
  }
}

/**
 * Calculate date range based on timeframe
 * @param timeframe - Timeframe string (D1, M1, H1, etc.)
 * @returns Object with fromDate and toDate as ISO strings
 */
export function calculateDateRange(timeframe: string): { fromDate: string; toDate: string } {
  const today = new Date();
  
  // toDate: tomorrow @ 00:00 to include all candles today
  const toDate = new Date(today);
  toDate.setDate(toDate.getDate() + 1); // Add 1 day to include all of today's data
  
  let fromDate = new Date(today);
  
  // Set date range to fetch ALL available data from the beginning
  if (timeframe === 'MN1') {
    fromDate.setFullYear(fromDate.getFullYear() - 20);
  } else if (timeframe === 'W1') {
    fromDate.setFullYear(fromDate.getFullYear() - 15);
  } else if (timeframe === 'D1') {
    fromDate.setFullYear(fromDate.getFullYear() - 10);
  } else if (timeframe === 'H4') {
    fromDate.setFullYear(fromDate.getFullYear() - 5);
  } else if (timeframe === 'H1') {
    fromDate.setFullYear(fromDate.getFullYear() - 3);
  } else if (timeframe === 'M30') {
    fromDate.setFullYear(fromDate.getFullYear() - 2);
  } else if (timeframe === 'M15') {
    fromDate.setFullYear(fromDate.getFullYear() - 2);
  } else if (timeframe === 'M5') {
    fromDate.setFullYear(fromDate.getFullYear() - 1);
  } else if (timeframe === 'M1') {
    fromDate.setMonth(fromDate.getMonth() - 3);
  } else {
    fromDate.setFullYear(fromDate.getFullYear() - 5);
  }
  
  return {
    fromDate: fromDate.toISOString().split('T')[0],
    toDate: toDate.toISOString().split('T')[0],
  };
}

const ohlcvService = {
  fetchOhlcvData,
  calculateDateRange,
};

export default ohlcvService;
