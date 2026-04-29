/**
 * Custom hook for Financial Report data fetching
 * Fetches data for each ticker separately and manages cache
 */

import { useQueries } from '@tanstack/react-query';
import { useFinancialReportStore } from '@/stores/financialReportStore';
import { fetchFinancialReportsByTicker } from '@/services/financial/financialReportService';
import type { FinancialReportTableRow } from '@/types/financialReport';
import { useMemo, useEffect, useCallback } from 'react';

/**
 * Hook for fetching financial report data for multiple tickers
 * Each ticker is fetched separately and cached independently
 */
export function useFinancialReportQuery() {
  const tickerList = useFinancialReportStore((state) => state.tickerList);
  const tickerDataCache = useFinancialReportStore((state) => state.tickerDataCache);
  const tickerPageCache = useFinancialReportStore((state) => state.tickerPageCache);
  const tickerHasMore = useFinancialReportStore((state) => state.tickerHasMore);
  const setTickerData = useFinancialReportStore((state) => state.setTickerData);
  const appendTickerData = useFinancialReportStore((state) => state.appendTickerData);

  // Create separate query for each ticker
  const queries = useQueries({
    queries: tickerList.map((ticker) => ({
      queryKey: ['financial-report', ticker, 1],
      queryFn: () => fetchFinancialReportsByTicker(ticker, 1),
      staleTime: 60 * 60 * 1000, // 60 minutes
      gcTime: 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: !(ticker in tickerDataCache), // Skip if key already cached (including empty array)
    })),
  });

  // Update cache when queries complete
  useEffect(() => {
    queries.forEach((query, index) => {
      if (query.isSuccess && query.data) {
        const ticker = tickerList[index];
        if (!(ticker in tickerDataCache)) {
          setTickerData(ticker, query.data.items, query.data.hasMore);
        }
      }
    });
  }, [queries, tickerList, tickerDataCache, setTickerData]);

  const loadMore = useCallback(async (ticker: string) => {
    const pageToFetch = tickerPageCache[ticker] ?? 2;
    try {
      const next = await fetchFinancialReportsByTicker(ticker, pageToFetch);
      appendTickerData(ticker, next.items, next.hasMore, pageToFetch + 1);
    } catch (loadMoreError) {
      console.error(`[FinancialReport] Load more failed for ${ticker}:`, loadMoreError);
    }
  }, [appendTickerData, tickerPageCache]);

  const canShowLoadMore = tickerList.length === 1;

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

  // Only block table with loading overlay when there is no data at all.
  const isLoading = allData.length === 0 && queries.some((q) => q.isLoading);
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
    tickerHasMore,
    canShowLoadMore,
    loadMore,
  };
}
