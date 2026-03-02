/**
 * OHLCV Service
 * Handles API calls for fetching OHLCV (Open, High, Low, Close, Volume) historical data
 */

import { get } from './api';

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

  const url = `/api/Ohlcv/${ticker}?${queryParams.toString()}`;

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
  
  // Set date range based on timeframe
  if (timeframe === 'D1' || timeframe === 'W1' || timeframe === 'MN1') {
    fromDate.setFullYear(fromDate.getFullYear() - 5); // 5 years for daily
  } else if (timeframe === 'M1') {
    fromDate.setMonth(fromDate.getMonth() - 6); // 6 months for M1
  } else if (timeframe === 'M5') {
    fromDate.setMonth(fromDate.getMonth() - 3); // 3 months for M5
  } else if (timeframe === 'M15') {
    fromDate.setMonth(fromDate.getMonth() - 2); // 2 months for M15
  } else if (timeframe === 'M30') {
    fromDate.setMonth(fromDate.getMonth() - 1); // 1 month for M30
  } else if (timeframe === 'H1') {
    fromDate.setDate(fromDate.getDate() - 30); // 30 days for H1
  } else if (timeframe === 'H4') {
    fromDate.setDate(fromDate.getDate() - 60); // 60 days for H4
  } else {
    fromDate.setMonth(fromDate.getMonth() - 6); // Default 6 months
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
