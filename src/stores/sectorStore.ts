/**
 * Sector Zustand Store
 * Global state management for sectors and stock tickers by industry
 * 
 * Performance Optimization Strategy:
 * - Uses Zustand for lightweight state management (smaller bundle than Redux)
 * - Implements selective persistence with localStorage
 * - Caches sector data to minimize API calls
 * - Provides fine-grained selectors to prevent unnecessary re-renders
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Sector, GetSectorsParams, SectorsPaginatedData } from '@/types';

interface SectorState {
  // State
  sectors: Sector[];
  selectedSector: Sector | null;
  isLoading: boolean;
  error: string | null;
  paginationInfo: {
    pageIndex: number;
    totalPages: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  } | null;
  filters: GetSectorsParams;
  
  // Cache for sector details (keyed by sector ID)
  sectorCache: Record<string, Sector>;
  
  // Actions
  setSectors: (data: SectorsPaginatedData) => void;
  setSelectedSector: (sector: Sector | null) => void;
  addToCache: (sectorId: string, sector: Sector) => void;
  getSectorFromCache: (sectorId: string) => Sector | undefined;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<GetSectorsParams>) => void;
  resetFilters: () => void;
  clearSectors: () => void;
}

const defaultFilters: GetSectorsParams = {
  level: undefined,
  status: 1, // Active sectors by default
  pageIndex: 1,
  pageSize: 100,
};

export const useSectorStore = create<SectorState>()(
  persist(
    (set, get) => ({
      // Initial state
      sectors: [],
      selectedSector: null,
      isLoading: false,
      error: null,
      paginationInfo: null,
      filters: defaultFilters,
      sectorCache: {},

      // Actions
      setSectors: (data) => {
        set({
          sectors: data.items,
          paginationInfo: {
            pageIndex: data.pageIndex,
            totalPages: data.totalPages,
            totalCount: data.totalCount,
            hasPreviousPage: data.hasPreviousPage,
            hasNextPage: data.hasNextPage,
          },
          error: null,
        });
        
        // Update cache with new sectors
        const newCache = { ...get().sectorCache };
        data.items.forEach((sector) => {
          newCache[sector.id] = sector;
        });
        set({ sectorCache: newCache });
      },

      setSelectedSector: (sector) => {
        set({ selectedSector: sector });
        
        // Add to cache if not already present
        if (sector && !get().sectorCache[sector.id]) {
          set({
            sectorCache: {
              ...get().sectorCache,
              [sector.id]: sector,
            },
          });
        }
      },

      addToCache: (sectorId, sector) => {
        set({
          sectorCache: {
            ...get().sectorCache,
            [sectorId]: sector,
          },
        });
      },

      getSectorFromCache: (sectorId) => {
        return get().sectorCache[sectorId];
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error, isLoading: false }),

      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      resetFilters: () => set({ filters: defaultFilters }),

      clearSectors: () => {
        set({
          sectors: [],
          selectedSector: null,
          paginationInfo: null,
          error: null,
        });
      },
    }),
    {
      name: 'sector-storage',
      // Only persist filters and cache, not loading states
      partialize: (state) => ({
        filters: state.filters,
        sectorCache: state.sectorCache,
      }),
    }
  )
);

// Selectors for optimized component subscriptions
export const useSectorSelectors = () => ({
  sectors: useSectorStore((state) => state.sectors),
  isLoading: useSectorStore((state) => state.isLoading),
  error: useSectorStore((state) => state.error),
  paginationInfo: useSectorStore((state) => state.paginationInfo),
  filters: useSectorStore((state) => state.filters),
});
