/**
 * React Hook for OHLCV Real-time Updates
 * 
 * Usage:
 * ```tsx
 * const { candle, isConnected, subscribe, unsubscribe } = useOhlcvSignalR('FPT', 'M1');
 * 
 * // candle auto-updates when new data arrives
 * console.log('Current candle:', candle);
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import OhlcvSignalRService, { OhlcvCandle } from '@/services/ohlcvSignalRService';
import * as signalR from '@microsoft/signalr';

interface UseOhlcvSignalROptions {
  /** Auto-subscribe on mount (default: true) */
  autoSubscribe?: boolean;
  
  /** Callback when candle updates */
  onCandleUpdate?: (candle: OhlcvCandle) => void;
}

interface UseOhlcvSignalRReturn {
  /** Current candle data (null if no data yet) */
  candle: OhlcvCandle | null;
  
  /** Connection state */
  connectionState: signalR.HubConnectionState;
  
  /** Is connected to hub */
  isConnected: boolean;
  
  /** Is currently subscribed */
  isSubscribed: boolean;
  
  /** Manually subscribe (if autoSubscribe=false) */
  subscribe: () => Promise<void>;
  
  /** Manually unsubscribe */
  unsubscribe: () => Promise<void>;
  
  /** Error if any */
  error: Error | null;
}

/**
 * Hook to subscribe to real-time OHLCV updates for a specific ticker and timeframe
 */
export function useOhlcvSignalR(
  ticker: string | null,
  timeframe: string,
  options: UseOhlcvSignalROptions = {}
): UseOhlcvSignalRReturn {
  const { autoSubscribe = true, onCandleUpdate } = options;
  
  const [candle, setCandle] = useState<OhlcvCandle | null>(null);
  const [connectionState, setConnectionState] = useState<signalR.HubConnectionState>(
    signalR.HubConnectionState.Disconnected
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const serviceRef = useRef(OhlcvSignalRService.getInstance());
  
  // Initialize service on mount
  useEffect(() => {
    const service = serviceRef.current;
    
    console.log('[useOhlcvSignalR] Initializing service, current state:', service.isConnected() ? 'Connected' : 'Not connected');
    
    // Initialize if not connected
    if (!service.isConnected()) {
      console.log('[useOhlcvSignalR] Service not connected, initializing...');
      service.initialize().catch((err) => {
        console.error('[useOhlcvSignalR] Failed to initialize:', err);
        setError(err);
      });
    }
    
    // Subscribe to connection state changes
    const unsubscribeState = service.onConnectionStateChanged((state) => {
      console.log('[useOhlcvSignalR] Connection state changed:', signalR.HubConnectionState[state]);
      setConnectionState(state);
    });
    
    return () => {
      unsubscribeState();
    };
  }, []);
  
  // Subscribe to OHLCV updates
  const subscribe = useCallback(async () => {
    if (!ticker) {
      setError(new Error('Ticker is required'));
      return;
    }
    
    // Skip if already subscribed to prevent double subscription
    if (unsubscribeRef.current) {
      console.log(`[useOhlcvSignalR] Already have active subscription to ${ticker} ${timeframe}, skipping`);
      return;
    }
    
    try {
      setError(null);
      const service = serviceRef.current;
      
      // Wait for connection if connecting
      if (connectionState === signalR.HubConnectionState.Connecting) {
        console.log('[useOhlcvSignalR] Waiting for connection...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      
      if (!service.isConnected()) {
        throw new Error('SignalR not connected');
      }
      
      console.log(`[useOhlcvSignalR] Subscribing to ${ticker} ${timeframe}`);
      
      const unsubscribe = await service.subscribeToOhlcv(
        ticker,
        timeframe,
        (updatedCandle) => {
          console.log(`[useOhlcvSignalR] Candle updated:`, updatedCandle);
          setCandle(updatedCandle);
          onCandleUpdate?.(updatedCandle);
        }
      );
      
      unsubscribeRef.current = unsubscribe;
      setIsSubscribed(true);
      
      // Fetch initial current candle
      try {
        const allCandles = await service.getAllCurrentCandles(ticker);
        const currentCandle = allCandles.find(c => c.timeframe.toUpperCase() === timeframe.toUpperCase());
        if (currentCandle) {
          setCandle(currentCandle);
        }
      } catch (err) {
        console.warn('[useOhlcvSignalR] Failed to fetch initial candle:', err);
      }
      
    } catch (err: any) {
      console.error('[useOhlcvSignalR] Subscribe failed:', err);
      setError(err);
      setIsSubscribed(false);
    }
  }, [ticker, timeframe, connectionState, onCandleUpdate]);
  
  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    if (unsubscribeRef.current) {
      console.log(`[useOhlcvSignalR] Unsubscribing from ${ticker} ${timeframe}`);
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setIsSubscribed(false);
      setCandle(null);
    }
  }, [ticker, timeframe]);
  
  // Auto-subscribe on mount and handle ticker/timeframe changes
  useEffect(() => {
    console.log('[useOhlcvSignalR] Auto-subscribe effect triggered:', {
      autoSubscribe,
      ticker,
      timeframe,
      connectionState: signalR.HubConnectionState[connectionState],
      isSubscribed,
    });
    
    // Unsubscribe from previous ticker/timeframe first
    if (unsubscribeRef.current) {
      console.log(`[useOhlcvSignalR] 🔄 Ticker/timeframe changed, cleaning up old subscription`);
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setIsSubscribed(false);
      setCandle(null);
    }
    
    // Subscribe to new ticker/timeframe
    if (autoSubscribe && ticker && connectionState === signalR.HubConnectionState.Connected) {
      console.log(`[useOhlcvSignalR] 🚀 Subscribing to ${ticker} ${timeframe}`);
      subscribe();
    }
    
    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log(`[useOhlcvSignalR] 🧹 Component unmounting, cleaning up subscription`);
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [autoSubscribe, ticker, timeframe, connectionState]);
  
  return {
    candle,
    connectionState,
    isConnected: connectionState === signalR.HubConnectionState.Connected,
    isSubscribed,
    subscribe,
    unsubscribe,
    error,
  };
}

/**
 * Hook to subscribe to multiple timeframes for a ticker
 */
export function useOhlcvMultiTimeframes(
  ticker: string | null,
  timeframes: string[] = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1']
): {
  candles: Record<string, OhlcvCandle | null>;
  isConnected: boolean;
} {
  const [candles, setCandles] = useState<Record<string, OhlcvCandle | null>>({});
  const [isConnected, setIsConnected] = useState(false);
  
  const serviceRef = useRef(OhlcvSignalRService.getInstance());
  const unsubscribesRef = useRef<Map<string, () => void>>(new Map());
  
  useEffect(() => {
    const service = serviceRef.current;
    
    // Initialize
    if (!service.isConnected()) {
      service.initialize().catch(console.error);
    }
    
    // Monitor connection
    const unsubscribeState = service.onConnectionStateChanged((state) => {
      setIsConnected(state === signalR.HubConnectionState.Connected);
    });
    
    return () => {
      unsubscribeState();
    };
  }, []);
  
  useEffect(() => {
    if (!ticker || !isConnected) return;
    
    const service = serviceRef.current;
    
    // Subscribe to all timeframes
    const subscribeAll = async () => {
      for (const timeframe of timeframes) {
        try {
          const unsubscribe = await service.subscribeToOhlcv(
            ticker,
            timeframe,
            (candle) => {
              setCandles((prev) => ({
                ...prev,
                [timeframe]: candle,
              }));
            }
          );
          
          unsubscribesRef.current.set(timeframe, unsubscribe);
        } catch (error) {
          console.error(`[useOhlcvMultiTimeframes] Failed to subscribe to ${ticker} ${timeframe}:`, error);
        }
      }
      
      // Fetch initial candles
      try {
        const allCandles = await service.getAllCurrentCandles(ticker);
        const candlesMap: Record<string, OhlcvCandle | null> = {};
        allCandles.forEach((candle) => {
          candlesMap[candle.timeframe] = candle;
        });
        setCandles(candlesMap);
      } catch (error) {
        console.warn('[useOhlcvMultiTimeframes] Failed to fetch initial candles:', error);
      }
    };
    
    subscribeAll();
    
    // Cleanup
    return () => {
      unsubscribesRef.current.forEach((unsubscribe) => {
        unsubscribe();
      });
      unsubscribesRef.current.clear();
    };
  }, [ticker, timeframes, isConnected]);
  
  return {
    candles,
    isConnected,
  };
}

export default useOhlcvSignalR;
