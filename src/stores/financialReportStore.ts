/**
 * Financial Report Zustand Store
 * Global state management for Financial Report module
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FinancialReportFilters, FinancialPeriodType } from '@/types/financialReport';

interface FinancialReportState {
  // State
  periodType: FinancialPeriodType;
  searchTicker: string;
  selectedIndustry: string;
  expandedGroups: Set<string>;
  lockState: boolean;
  filters: FinancialReportFilters;
  
  // Actions
  setPeriodType: (type: FinancialPeriodType) => void;
  setSearchTicker: (ticker: string) => void;
  setSelectedIndustry: (industry: string) => void;
  toggleExpanded: (ticker: string) => void;
  toggleLock: () => void;
  setFilters: (filters: Partial<FinancialReportFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: FinancialReportFilters = {
  period: 1, // Default to Yearly
  pageIndex: 1,
  pageSize: 50,
};

export const useFinancialReportStore = create<FinancialReportState>()(  persist(
    (set, get) => ({
      // Initial state
      periodType: 1, // Yearly
      searchTicker: '',
      selectedIndustry: '',
      expandedGroups: new Set<string>(),
      lockState: false,
      filters: defaultFilters,

      // Actions
      setPeriodType: (type) => {
        set({ periodType: type });
        set((state) => ({
          filters: { ...state.filters, period: type },
        }));
      },

      setSearchTicker: (ticker) => {
        set({ searchTicker: ticker });
        set((state) => ({
          filters: { ...state.filters, ticker: ticker || undefined },
        }));
      },

      setSelectedIndustry: (industry) => {
        set({ selectedIndustry: industry });
        set((state) => ({
          filters: { ...state.filters, selectedIndustry: industry || undefined },
        }));
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
          periodType: 1,
          searchTicker: '',
          selectedIndustry: '',
          filters: defaultFilters,
        });
      },
    }),
    {
      name: 'financial-report-storage',
      partialize: (state) => ({
        periodType: state.periodType,
        lockState: state.lockState,
        filters: state.filters,
      }),
    }
  )
);
