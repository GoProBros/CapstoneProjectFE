/**
 * Custom hook for Financial Report data fetching
 * Fetches data for each ticker separately and manages cache
 */

import { useQueries } from '@tanstack/react-query';
import { useFinancialReportStore } from '@/stores/financialReportStore';
import { fetchFinancialReportsByTicker } from '@/services/financialReportService';
import type { FinancialReportTableRow } from '@/types/financialReport';
import { useMemo, useEffect } from 'react';

/**
 * Hook for fetching financial report data for multiple tickers
 * Each ticker is fetched separately and cached independently
 */
export function useFinancialReportQuery() {
  const tickerList = useFinancialReportStore((state) => state.tickerList);
  const tickerDataCache = useFinancialReportStore((state) => state.tickerDataCache);
  const setTickerData = useFinancialReportStore((state) => state.setTickerData);

  // Create separate query for each ticker
  const queries = useQueries({
    queries: tickerList.map((ticker) => ({
      queryKey: ['financial-report', ticker],
      queryFn: () => fetchFinancialReportsByTicker(ticker),
      staleTime: 60 * 60 * 1000, // 60 minutes
      gcTime: 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: !tickerDataCache[ticker], // Skip if already in cache
    })),
  });

  // Update cache when queries complete
  useEffect(() => {
    queries.forEach((query, index) => {
      if (query.isSuccess && query.data) {
        const ticker = tickerList[index];
        if (!tickerDataCache[ticker]) {
          setTickerData(ticker, query.data.items);
        }
      }
    });
  }, [queries, tickerList, tickerDataCache, setTickerData]);

  // Aggregate all data from cache
  const allData = useMemo(() => {
    const items: FinancialReportTableRow[] = [];
    tickerList.forEach((ticker) => {
      if (tickerDataCache[ticker]) {
        items.push(...tickerDataCache[ticker]);
      }
    });
    return items;
  }, [tickerList, tickerDataCache]);

  // Check if any query is loading
  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const error = queries.find((q) => q.error)?.error;

  return {
    data: {
      items: allData,
      totalCount: allData.length,
    },
    isLoading,
    isError,
    error,
  };
}
