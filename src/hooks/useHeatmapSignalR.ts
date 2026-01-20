/**
 * useHeatmapSignalR Hook
 * React hook for managing heatmap real-time updates via SignalR
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { HeatmapData, HeatmapFilters } from '@/types/heatmap';
import { getHeatmapSignalRService } from '@/services/heatmapSignalRService';
import { heatmapService } from '@/services/heatmapService';

interface UseHeatmapSignalROptions {
  filters?: HeatmapFilters;
  autoConnect?: boolean;
  useRest?: boolean; // Fallback to REST if SignalR fails
}

interface UseHeatmapSignalRReturn {
  data: HeatmapData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Hook for managing heatmap data with real-time updates
 * @param options - Hook options (filters, autoConnect, useRest)
 * @returns Hook state and methods
 */
export function useHeatmapSignalR(
  options: UseHeatmapSignalROptions = {}
): UseHeatmapSignalRReturn {
  const { 
    filters = null, 
    autoConnect = true,
    useRest = false 
  } = options;

  const [data, setData] = useState<HeatmapData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const subscriptionIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle heatmap data update
   */
  const handleDataUpdate = useCallback((newData: HeatmapData) => {
    if (isMountedRef.current) {
      setData(newData);
      setIsLoading(false);
      setError(null);
    }
  }, []);

  /**
   * Connect to SignalR and subscribe
   */
  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const service = getHeatmapSignalRService();

      // Start SignalR connection
      await service.start();

      // Subscribe to heatmap updates
      const subId = await service.subscribeToHeatmap(
        filters || null,
        handleDataUpdate
      );

      subscriptionIdRef.current = subId;

      // Get initial snapshot
      const initialData = await service.getCurrentHeatmap(filters || null);
      if (isMountedRef.current) {
        setData(initialData);
        setIsConnected(true);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to connect to SignalR:', err);
      const errorObj = err instanceof Error ? err : new Error('Failed to connect');
      
      if (isMountedRef.current) {
        setError(errorObj);
        setIsConnected(false);
        setIsLoading(false);
      }

      // Fallback to REST if enabled
      if (useRest) {
        console.log('Falling back to REST API...');
        await fallbackToRest();
      }
    }
  }, [filters, handleDataUpdate, useRest]);

  /**
   * Disconnect from SignalR
   */
  const disconnect = useCallback(async () => {
    try {
      if (subscriptionIdRef.current) {
        const service = getHeatmapSignalRService();
        await service.unsubscribeFromHeatmap(
          subscriptionIdRef.current,
          filters || null
        );
        subscriptionIdRef.current = null;
      }

      setIsConnected(false);

      // Clear REST interval if any
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  }, [filters]);

  /**
   * Fallback to REST API polling
   */
  const fallbackToRest = useCallback(async () => {
    try {
      const fetchData = async () => {
        try {
          const restData = await heatmapService.getHeatmapData(filters || undefined);
          if (isMountedRef.current) {
            setData(restData);
            setError(null);
          }
        } catch (err) {
          console.error('REST fetch error:', err);
        }
      };

      // Initial fetch
      await fetchData();

      // Poll every 5 minutes to avoid server overload
      // Only used as fallback when SignalR is not available
      restIntervalRef.current = setInterval(fetchData, 300000); // 5 minutes = 300,000ms
      
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to fetch data');
      if (isMountedRef.current) {
        setError(errorObj);
        setIsLoading(false);
      }
    }
  }, [filters]);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    const service = getHeatmapSignalRService();
    if (isConnected && service.isConnected()) {
      try {
        const freshData = await service.getCurrentHeatmap(filters || null);
        if (isMountedRef.current) {
          setData(freshData);
        }
      } catch (err) {
        console.error('Error refreshing heatmap:', err);
      }
    } else if (useRest) {
      try {
        const restData = await heatmapService.getHeatmapData(filters || undefined);
        if (isMountedRef.current) {
          setData(restData);
        }
      } catch (err) {
        console.error('Error refreshing heatmap via REST:', err);
      }
    }
  }, [isConnected, filters, useRest]);

  /**
   * Effect: Auto-connect on mount
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (autoConnect) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  /**
   * Effect: Reconnect when filters change
   */
  useEffect(() => {
    if (isConnected) {
      console.log('[useHeatmapSignalR] Filters changed, reconnecting...');
      disconnect().then(() => {
        // Wait a bit to ensure disconnection is complete
        setTimeout(() => {
          connect();
        }, 100);
      }).catch(err => {
        console.error('[useHeatmapSignalR] Error during reconnect:', err);
        // Try to connect anyway
        setTimeout(() => {
          connect();
        }, 100);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.exchange, filters?.sector]);

  return {
    data,
    isConnected,
    isLoading,
    error,
    refresh,
    connect,
    disconnect,
  };
}
