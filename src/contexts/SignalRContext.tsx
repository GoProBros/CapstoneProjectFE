/**
 * SignalR Context - React Context để quản lý SignalR connection trong toàn bộ app
 * 
 * Context này cung cấp:
 * - Connection state (Connected, Disconnecting, etc.)
 * - Methods để subscribe/unsubscribe symbols
 * - Real-time market data stream
 * - Automatic connection management
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo, useRef } from 'react';
import SignalRService from '@/services/market/signalRService';
import { MarketSymbolDto, ConnectionState } from '@/types/market';

/**
 * Interface cho SignalR Context value
 */
interface SignalRContextValue {
  /** Trạng thái kết nối hiện tại */
  connectionState: ConnectionState;
  
  /** Có đang connected không */
  isConnected: boolean;
  
  /** Dữ liệu market real-time (key = ticker, value = data) */
  marketData: Map<string, MarketSymbolDto>;
  
  /** Danh sách symbols đang subscribe */
  subscribedSymbols: string[];
  
  /** Kết nối tới SignalR Hub */
  connect: () => Promise<void>;
  
  /** Ngắt kết nối khỏi SignalR Hub */
  disconnect: () => Promise<void>;
  
  /** Subscribe nhận data cho các symbols */
  subscribeToSymbols: (symbols: string[]) => Promise<void>;
  
  /** Unsubscribe khỏi các symbols */
  unsubscribeFromSymbols: (symbols: string[]) => Promise<void>;
  
  /** Lấy data của 1 symbol cụ thể */
  getSymbolData: (ticker: string) => MarketSymbolDto | undefined;
}

/**
 * Context cho SignalR
 */
const SignalRContext = createContext<SignalRContextValue | undefined>(undefined);

/**
 * Props cho SignalRProvider
 */
interface SignalRProviderProps {
  children: ReactNode;
  
  /** URL của backend API (optional, mặc định từ env hoặc localhost:5000) */
  apiUrl?: string;
  
  /** Tự động connect khi component mount (mặc định: true) */
  autoConnect?: boolean;
  
  /** Tự động reconnect khi mất kết nối (mặc định: true) */
  autoReconnect?: boolean;
}

/**
 * SignalRProvider - Component cung cấp SignalR connection cho toàn bộ app
 * 
 * Sử dụng:
 * ```tsx
 * // Wrap ở root level (layout.tsx hoặc _app.tsx)
 * <SignalRProvider apiUrl="http://localhost:5000">
 *   <YourApp />
 * </SignalRProvider>
 * 
 * // Trong component con:
 * const { isConnected, subscribeToSymbols, marketData } = useSignalR();
 * ```
 */
export function SignalRProvider({ 
  children, 
  apiUrl,
  autoConnect = true,
  autoReconnect = true,
}: SignalRProviderProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [marketData, setMarketData] = useState<Map<string, MarketSymbolDto>>(new Map());
  const [subscribedSymbols, setSubscribedSymbols] = useState<string[]>([]);

  // Mutable ref that always holds the latest map — used for reads without triggering renders
  const marketDataRef = useRef<Map<string, MarketSymbolDto>>(new Map());

  // Pending batch: accumulate incoming messages between RAF ticks
  const pendingUpdatesRef = useRef<Map<string, MarketSymbolDto>>(new Map());
  const rafIdRef = useRef<number | null>(null);

  /**
   * Initialize SignalR service khi component mount
   */
  useEffect(() => {
    const service = SignalRService.getInstance();
    
    // Lấy API URL từ props hoặc environment variable
    const baseUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL;
    
    // Initialize service
    service.initialize({
      baseUrl,
      automaticReconnect: autoReconnect,
      reconnectDelays: [0, 2000, 5000, 10000, 30000],
    });
    
    // Subscribe to connection state changes
    const unsubscribeState = service.onConnectionStateChanged((state) => {
      setConnectionState(state);
    });
    
    // Subscribe to market data updates — batch via RAF to avoid update-depth overflow
    const unsubscribeData = service.onMarketDataReceived((data) => {
      // Merge into pending batch (overwrites with latest value for same ticker)
      // CRITICAL: Check pendingUpdatesRef FIRST — marketDataRef may not yet contain updates
      // that arrived in the same animation frame (before the RAF flush ran).
      // Without this, a second rapid update for the same ticker would NOT merge with the
      // first (still-pending) update, causing fields from the first update to be lost → zeros.
      const existing = pendingUpdatesRef.current.get(data.ticker) ?? marketDataRef.current.get(data.ticker);
      pendingUpdatesRef.current.set(data.ticker, existing ? { ...existing, ...data } : data);

      // Schedule a single flush for this animation frame
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          if (pendingUpdatesRef.current.size === 0) return;

          // Apply all pending updates at once — one React state update
          const updates = pendingUpdatesRef.current;
          pendingUpdatesRef.current = new Map();

          const newMap = new Map(marketDataRef.current);
          updates.forEach((value, key) => newMap.set(key, value));
          marketDataRef.current = newMap;
          setMarketData(newMap);
        });
      }
    });
    
    // Auto connect nếu được bật
    if (autoConnect) {
      service.connect().catch((error) => {
        console.error('[SignalRContext] Auto connect failed:', error);
      });
    }
    
    // Cleanup khi unmount
    return () => {
      unsubscribeState();
      unsubscribeData();

      // Cancel any pending RAF flush
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      pendingUpdatesRef.current = new Map();
      
      // Không chủ động disconnect ở cleanup để tránh self-disconnect ngay sau connect
      // khi React remount provider (dev/Strict Mode hoặc layout remount). Kết nối
      // singleton sẽ được đóng khi browser unload hoặc khi gọi disconnect thủ công.
    };
  }, [apiUrl, autoConnect, autoReconnect]);
  
  /**
   * Connect to SignalR Hub
   */
  const connect = useCallback(async () => {
    try {
      await SignalRService.getInstance().connect();
    } catch (error) {
      throw error;
    }
  }, []);
  
  /**
   * Disconnect from SignalR Hub
   */
  const disconnect = useCallback(async () => {
    try {
      console.debug('[SignalR] disconnect() called');
      await SignalRService.getInstance().disconnect();
      
      // Clear market data và subscribed symbols
      setMarketData(new Map());
      setSubscribedSymbols([]);
    } catch (error) {
      throw error;
    }
  }, []);
  
  /**
   * Subscribe to symbols
   */
  const subscribeToSymbols = useCallback(async (symbols: string[]) => {
    try {
      console.debug('[SignalR] subscribeToSymbols()', symbols);
      await SignalRService.getInstance().subscribeToSymbols(symbols);
      
      // Update subscribed symbols list
      setSubscribedSymbols(prev => {
        const newSet = new Set([...prev, ...symbols.map(s => s.toUpperCase())]);
        return Array.from(newSet);
      });
    } catch (error) {
      throw error;
    }
  }, []);
  
  /**
   * Unsubscribe from symbols
   */
  const unsubscribeFromSymbols = useCallback(async (symbols: string[]) => {
    try {
      console.debug('[SignalR] unsubscribeFromSymbols()', symbols);
      await SignalRService.getInstance().unsubscribeFromSymbols(symbols);

      const symbolsToRemoveSet = new Set(symbols.map(s => s.toUpperCase()));

      // CRITICAL: Update marketDataRef immediately so the RAF handler cannot
      // resurrect removed symbols when the next real-time batch arrives.
      const newRefMap = new Map(marketDataRef.current);
      symbolsToRemoveSet.forEach(s => newRefMap.delete(s));
      marketDataRef.current = newRefMap;

      // Also purge any pending batched updates for these symbols so they don't
      // get flushed in the next animation frame after the ref is already clean.
      symbolsToRemoveSet.forEach(s => pendingUpdatesRef.current.delete(s));

      // Update subscribed symbols list
      setSubscribedSymbols(prev => prev.filter(s => !symbolsToRemoveSet.has(s)));

      // Update React state with the same cleaned-up map (avoid creating a second copy)
      setMarketData(newRefMap);
    } catch (error) {
      throw error;
    }
  }, []);
  
  /**
   * Get data của 1 symbol cụ thể
   * Reads from ref so this callback never changes reference.
   */
  const getSymbolData = useCallback((ticker: string): MarketSymbolDto | undefined => {
    return marketDataRef.current.get(ticker.toUpperCase());
  }, []); // stable — no deps needed, reads from ref
  
  // Memoize context value để tránh re-render không cần thiết
  const value: SignalRContextValue = useMemo(() => ({
    connectionState,
    isConnected: connectionState === ConnectionState.Connected,
    marketData,
    subscribedSymbols,
    connect,
    disconnect,
    subscribeToSymbols,
    unsubscribeFromSymbols,
    getSymbolData,
  }), [
    connectionState,
    marketData,
    subscribedSymbols,
    connect,
    disconnect,
    subscribeToSymbols,
    unsubscribeFromSymbols,
    getSymbolData,
  ]);
  
  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
}

/**
 * Hook để sử dụng SignalR context
 * 
 * @throws Error nếu được gọi bên ngoài SignalRProvider
 * 
 * @example
 * ```tsx
 * function StockComponent() {
 *   const { isConnected, subscribeToSymbols, marketData } = useSignalR();
 *   
 *   useEffect(() => {
 *     if (isConnected) {
 *       subscribeToSymbols(['VNM', 'HPG', 'VCB']);
 *     }
 *   }, [isConnected]);
 *   
 *   return (
 *     <div>
 *       {Array.from(marketData.values()).map(data => (
 *         <div key={data.ticker}>
 *           {data.ticker}: {data.lastPrice}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSignalR(): SignalRContextValue {
  const context = useContext(SignalRContext);
  
  if (context === undefined) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  
  return context;
}

/**
 * Hook để subscribe/unsubscribe symbols tự động
 * Component sẽ tự động subscribe khi mount và unsubscribe khi unmount
 * 
 * @param symbols - Danh sách symbols cần subscribe
 * @param enabled - Bật/tắt auto subscribe (mặc định: true)
 * 
 * @example
 * ```tsx
 * function StockList() {
 *   const symbols = ['VNM', 'HPG', 'VCB'];
 *   const { marketData } = useSignalRSubscription(symbols);
 *   
 *   return (
 *     <div>
 *       {symbols.map(symbol => {
 *         const data = marketData.get(symbol);
 *         return <div key={symbol}>{symbol}: {data?.lastPrice}</div>
 *       })}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSignalRSubscription(
  symbols: string[],
  enabled: boolean = true
): SignalRContextValue {
  const context = useSignalR();
  const { subscribeToSymbols, unsubscribeFromSymbols, isConnected } = context;
  
  // Sử dụng ref để track symbols hiện tại và tránh re-subscribe không cần thiết
  const prevSymbolsRef = useRef<string>('');
  const symbolsKey = symbols.join(',');
  
  useEffect(() => {
    // Chỉ subscribe khi enabled và đã connected
    if (!enabled || !isConnected || symbols.length === 0) {
      return;
    }
    
    // Kiểm tra nếu symbols không thay đổi thì không subscribe lại
    if (prevSymbolsRef.current === symbolsKey) {
      return;
    }
    
    prevSymbolsRef.current = symbolsKey;
    
    // Subscribe to symbols
    subscribeToSymbols(symbols).catch(() => {});
    
    // Cleanup: Unsubscribe khi component unmount hoặc symbols thay đổi
    return () => {
      unsubscribeFromSymbols(symbols).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey, enabled, isConnected]);
  
  return context;
}
