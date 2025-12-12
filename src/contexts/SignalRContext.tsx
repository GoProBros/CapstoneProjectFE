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

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import SignalRService from '@/services/signalRService';
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
  
  /**
   * Initialize SignalR service khi component mount
   */
  useEffect(() => {
    const service = SignalRService.getInstance();
    
    // Lấy API URL từ props hoặc environment variable
    const baseUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7148';
    
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
    
    // Subscribe to market data updates
    const unsubscribeData = service.onMarketDataReceived((data) => {
      // Update market data trong state
      setMarketData(prev => {
        const newMap = new Map(prev);
        
        // ✅ FIX: MERGE partial data vào existing object thay vì ghi đè
        // Backend chỉ gửi fields thay đổi, không phải full object
        const existingData = newMap.get(data.ticker);
        
        if (existingData) {
          // Merge: giữ nguyên fields cũ, chỉ update fields mới
          const mergedData = { ...existingData, ...data };
          newMap.set(data.ticker, mergedData);
        } else {
          // Symbol mới, chưa có data → set trực tiếp
          newMap.set(data.ticker, data);
        }
        
        return newMap;
      });
    });
    
    // Auto connect nếu được bật
    if (autoConnect) {
      service.connect().catch(() => {});
    }
    
    // Cleanup khi unmount
    return () => {
      unsubscribeState();
      unsubscribeData();
      
      // Disconnect khi component unmount
      service.disconnect().catch(() => {});
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
      await SignalRService.getInstance().unsubscribeFromSymbols(symbols);
      
      // Update subscribed symbols list
      setSubscribedSymbols(prev => {
        const symbolsToRemove = new Set(symbols.map(s => s.toUpperCase()));
        return prev.filter(s => !symbolsToRemove.has(s));
      });
      
      // Xóa market data của các symbols đã unsubscribe
      setMarketData(prev => {
        const newMap = new Map(prev);
        symbols.forEach(symbol => newMap.delete(symbol.toUpperCase()));
        return newMap;
      });
    } catch (error) {
      throw error;
    }
  }, []);
  
  /**
   * Get data của 1 symbol cụ thể
   */
  const getSymbolData = useCallback((ticker: string): MarketSymbolDto | undefined => {
    return marketData.get(ticker.toUpperCase());
  }, [marketData]);
  
  // Context value
  const value: SignalRContextValue = {
    connectionState,
    isConnected: connectionState === ConnectionState.Connected,
    marketData,
    subscribedSymbols,
    connect,
    disconnect,
    subscribeToSymbols,
    unsubscribeFromSymbols,
    getSymbolData,
  };
  
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
  
  useEffect(() => {
    // Chỉ subscribe khi enabled và đã connected
    if (!enabled || !isConnected || symbols.length === 0) {
      return;
    }
    
    // Subscribe to symbols
    subscribeToSymbols(symbols).catch(() => {});
    
    // Cleanup: Unsubscribe khi component unmount hoặc symbols thay đổi
    return () => {
      unsubscribeFromSymbols(symbols).catch(() => {});
    };
  }, [symbols.join(','), enabled, isConnected, subscribeToSymbols, unsubscribeFromSymbols]);
  
  return context;
}
