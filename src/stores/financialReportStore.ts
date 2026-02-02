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
  selectedSectorId: string;
  expandedGroups: Set<string>;
  lockState: boolean;
  filters: FinancialReportFilters;
  
  // Actions
  setTickerList: (tickers: string[]) => void;
  setTickerData: (ticker: string, data: FinancialReportTableRow[]) => void;
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
  pageSize: 100,
};

export const useFinancialReportStore = create<FinancialReportState>()(  persist(
    (set, get) => ({
      // Initial state
      tickerList: [],
      tickerDataCache: {},
      selectedSectorId: '',
      expandedGroups: new Set<string>(),
      lockState: false,
      filters: defaultFilters,

      // Actions
      setTickerList: (tickers) => {
        const currentList = get().tickerList;
        const newList = tickers;
        
        // Find tickers that are in current list but not in new list
        const removedTickers = currentList.filter(t => !newList.includes(t));
        
        // Clear data for removed tickers
        set((state) => {
          const newCache = { ...state.tickerDataCache };
          removedTickers.forEach(ticker => {
            delete newCache[ticker];
          });
          return { tickerList: newList, tickerDataCache: newCache };
        });
      },

      setTickerData: (ticker, data) => {
        set((state) => ({
          tickerDataCache: {
            ...state.tickerDataCache,
            [ticker]: data,
          },
        }));
      },

      clearTickerData: (ticker) => {
        set((state) => {
          const newCache = { ...state.tickerDataCache };
          delete newCache[ticker];
          return { tickerDataCache: newCache };
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
