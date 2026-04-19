/**
 * useSectors Hook
 * Custom hook for fetching and managing sector data with stock tickers
 * Integrates API service with Zustand store for state management
 */

import { useCallback } from 'react';
import { useSectorStore } from '@/stores/sectorStore';
import sectorService from '@/services/market/sectorService';
import type { GetSectorsParams } from '@/types';

export const useSectors = () => {
  const {
    sectors,
    selectedSector,
    isLoading,
    error,
    paginationInfo,
    filters,
    sectorCache,
    setSectors,
    setSelectedSector,
    addToCache,
    getSectorFromCache,
    setLoading,
    setError,
    setFilters,
    resetFilters,
    clearSectors,
  } = useSectorStore();

  /**
   * Fetch sectors with optional filters
   */
  const fetchSectors = useCallback(
    async (params?: GetSectorsParams) => {
      try {
        setLoading(true);
        setError(null);
        
        const queryParams = params || filters;
        const response = await sectorService.getSectors(queryParams);
        
        if (response.isSuccess && response.data) {
          setSectors(response.data);
        } else {
          setError(response.message || 'Failed to fetch sectors');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching sectors';
        setError(errorMessage);
        console.error('Error fetching sectors:', err);
      } finally {
        setLoading(false);
      }
    },
    [filters, setSectors, setLoading, setError]
  );

  /**
   * Fetch a single sector by ID
   * Checks cache first to avoid unnecessary API calls
   */
  const fetchSectorById = useCallback(
    async (sectorId: string, forceRefresh = false) => {
      try {
        // Check cache first unless force refresh is requested
        if (!forceRefresh) {
          const cachedSector = getSectorFromCache(sectorId);
          if (cachedSector) {
            setSelectedSector(cachedSector);
            return cachedSector;
          }
        }

        setLoading(true);
        setError(null);
        
        const response = await sectorService.getSectorById(sectorId);
        
        if (response.isSuccess && response.data) {
          setSelectedSector(response.data);
          addToCache(sectorId, response.data);
          return response.data;
        } else {
          setError(response.message || 'Failed to fetch sector');
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching sector';
        setError(errorMessage);
        console.error('Error fetching sector by ID:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getSectorFromCache, setSelectedSector, addToCache, setLoading, setError]
  );

  /**
   * Update filters and optionally refetch data
   */
  const updateFilters = useCallback(
    async (newFilters: Partial<GetSectorsParams>, autoFetch = true) => {
      setFilters(newFilters);
      if (autoFetch) {
        await fetchSectors({ ...filters, ...newFilters });
      }
    },
    [filters, setFilters, fetchSectors]
  );

  /**
   * Get stock tickers for a specific sector from cache or state
   */
  const getTickersBySectorId = useCallback(
    (sectorId: string): string[] => {
      // Check selected sector first
      if (selectedSector?.id === sectorId) {
        return selectedSector.symbols;
      }
      
      // Check cache
      const cachedSector = getSectorFromCache(sectorId);
      if (cachedSector) {
        return cachedSector.symbols;
      }
      
      // Check current sectors list
      const sector = sectors.find((s) => s.id === sectorId);
      return sector?.symbols || [];
    },
    [selectedSector, sectors, getSectorFromCache]
  );

  return {
    // State
    sectors,
    selectedSector,
    isLoading,
    error,
    paginationInfo,
    filters,
    sectorCache,
    
    // Actions
    fetchSectors,
    fetchSectorById,
    updateFilters,
    setSelectedSector,
    resetFilters,
    clearSectors,
    getTickersBySectorId,
    getSectorFromCache, // Export cache getter
  };
};
