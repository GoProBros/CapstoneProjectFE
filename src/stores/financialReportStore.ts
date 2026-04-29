/**
 * Financial Report Zustand Store
 * Global state management for Financial Report module
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FinancialReportFilters, FinancialReportTableRow } from '@/types/financialReport';

interface FinancialReportState {
  // State
  tickerList: string[]; // List of tickers to fetch
  tickerDataCache: Record<string, FinancialReportTableRow[]>; // Cache data per ticker
  tickerPageCache: Record<string, number>; // Next page index to fetch per ticker
  tickerHasMore: Record<string, boolean>;
  selectedSectorId: string;
  expandedGroups: Set<string>;
  lockState: boolean;
  filters: FinancialReportFilters;
  
  // Actions
  setTickerList: (tickers: string[]) => void;
  setTickerData: (ticker: string, data: FinancialReportTableRow[], hasMore?: boolean) => void;
  appendTickerData: (ticker: string, data: FinancialReportTableRow[], hasMore: boolean, nextPageToFetch: number) => void;
  clearTickerData: (ticker: string) => void;
  setSelectedSectorId: (sectorId: string) => void;
  toggleExpanded: (ticker: string) => void;
  toggleLock: () => void;
  setFilters: (filters: Partial<FinancialReportFilters>) => void;
  resetFilters: () => void;
  clearAllData: () => void;
}

const defaultFilters: FinancialReportFilters = {
  pageIndex: 1,
  pageSize: 10,
};

export const useFinancialReportStore = create<FinancialReportState>()(  persist(
    (set, get) => ({
      // Initial state
      tickerList: [],
      tickerDataCache: {},
      tickerPageCache: {},
      tickerHasMore: {},
      selectedSectorId: '',
      expandedGroups: new Set<string>(),
      lockState: false,
      filters: defaultFilters,

      // Actions
      setTickerList: (tickers) => {
        const currentList = get().tickerList;
        const newList = Array.from(
          new Set(
            tickers
              .map((t) => t.trim().toUpperCase())
              .filter((t) => t.length > 0)
          )
        );
        
        // Find tickers that are in current list but not in new list
        const removedTickers = currentList.filter(t => !newList.includes(t));
        
        // Clear data for removed tickers
        set((state) => {
          const newCache = { ...state.tickerDataCache };
          const newPageCache = { ...state.tickerPageCache };
          const newHasMoreCache = { ...state.tickerHasMore };
          removedTickers.forEach(ticker => {
            delete newCache[ticker];
            delete newPageCache[ticker];
            delete newHasMoreCache[ticker];
          });
          return {
            tickerList: newList,
            tickerDataCache: newCache,
            tickerPageCache: newPageCache,
            tickerHasMore: newHasMoreCache,
          };
        });
      },

      setTickerData: (ticker, data, hasMore = false) => {
        set((state) => ({
          tickerDataCache: {
            ...state.tickerDataCache,
            [ticker]: data,
          },
          tickerPageCache: {
            ...state.tickerPageCache,
            [ticker]: 2,
          },
          tickerHasMore: {
            ...state.tickerHasMore,
            [ticker]: hasMore,
          },
        }));
      },

      appendTickerData: (ticker, data, hasMore, nextPageToFetch) => {
        set((state) => ({
          tickerDataCache: {
            ...state.tickerDataCache,
            [ticker]: [...(state.tickerDataCache[ticker] ?? []), ...data],
          },
          tickerPageCache: {
            ...state.tickerPageCache,
            [ticker]: nextPageToFetch,
          },
          tickerHasMore: {
            ...state.tickerHasMore,
            [ticker]: hasMore,
          },
        }));
      },

      clearTickerData: (ticker) => {
        set((state) => {
          const newCache = { ...state.tickerDataCache };
          delete newCache[ticker];
          const newPageCache = { ...state.tickerPageCache };
          delete newPageCache[ticker];
          const newHasMoreCache = { ...state.tickerHasMore };
          delete newHasMoreCache[ticker];
          return {
            tickerDataCache: newCache,
            tickerPageCache: newPageCache,
            tickerHasMore: newHasMoreCache,
          };
        });
      },

      setSelectedSectorId: (sectorId) => {
        set({ selectedSectorId: sectorId });
      },

      toggleExpanded: (ticker) => {
        set((state) => {
          const newExpanded = new Set(state.expandedGroups);
          if (newExpanded.has(ticker)) {
            newExpanded.delete(ticker);
          } else {
            newExpanded.add(ticker);
          }
          return { expandedGroups: newExpanded };
        });
      },

      toggleLock: () => {
        set((state) => ({ lockState: !state.lockState }));
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      resetFilters: () => {
        set({
          tickerList: [],
          selectedSectorId: '',
          filters: defaultFilters,
        });
      },

      clearAllData: () => {
        set({
          tickerList: [],
          tickerDataCache: {},
          tickerPageCache: {},
          tickerHasMore: {},
          selectedSectorId: '',
          expandedGroups: new Set<string>(),
        });
      },
    }),
    {
      name: 'financial-report-storage',
      partialize: (state) => ({
        lockState: state.lockState,
        filters: state.filters,
      }),
    }
  )
);
