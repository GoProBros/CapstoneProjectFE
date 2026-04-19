/**
 * OHLCV SignalR Service - Quản lý real-time OHLCV candle updates
 * 
 * Service này kết nối tới MarketDataHub để nhận:
 * - Real-time candle updates (in-progress và completed)
 * - Current candles cho tất cả timeframes
 * 
 * Backend Hub: MarketDataHub.cs
 * Endpoint: /hubs/marketdata
 * 
 * SignalR Groups:
 * - OHLCV:{Ticker}:{Timeframe} - nhận updates cho specific ticker+timeframe
 * 
 * Server Methods:
 * - SubscribeToOhlcv(string ticker, string timeframe)
 * - UnsubscribeFromOhlcv(string ticker, string timeframe)
 * - GetAllCurrentCandles(string ticker)
 */

import * as signalR from '@microsoft/signalr';

/**
 * OHLCV Candle Data Structure
 */
export interface OhlcvCandle {
  ticker: string;
  timeframe: string;
  startTime: string; // ISO 8601 datetime
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  totalValue: number;
  lastUpdateTime: string; // ISO 8601 datetime
  isComplete: boolean; // true = candle closed, false = in-progress
}

/**
 * Callback cho OHLCV updates
 */
export type OhlcvUpdateCallback = (candle: OhlcvCandle) => void;

/**
 * Callback cho connection state changes
 */
export type OhlcvConnectionStateCallback = (state: signalR.HubConnectionState) => void;

/**
 * Subscription key format: "TICKER:TIMEFRAME"
 */
type SubscriptionKey = string;

/**
 * OHLCV SignalR Service - Singleton class
 */
class OhlcvSignalRService {
  private static instance: OhlcvSignalRService;
  
  private connection: signalR.HubConnection | null = null;
  private connectionState: signalR.HubConnectionState = signalR.HubConnectionState.Disconnected;
  
  /** Callbacks theo subscription key */
  private subscriptionCallbacks: Map<SubscriptionKey, Set<OhlcvUpdateCallback>> = new Map();
  
  /** Connection state callbacks */
  private connectionStateCallbacks: Set<OhlcvConnectionStateCallback> = new Set();
  
  /** Active subscriptions */
  private activeSubscriptions: Set<SubscriptionKey> = new Set();
  
  /** Base URL */
  private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5146';
  
  private constructor() {}
  
  public static getInstance(): OhlcvSignalRService {
    if (!OhlcvSignalRService.instance) {
      OhlcvSignalRService.instance = new OhlcvSignalRService();
    }
    return OhlcvSignalRService.instance;
  }
  
  /**
   * Initialize và connect to hub
   */
  public async initialize(baseUrl?: string): Promise<void> {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
    
    // Build connection
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/marketdata`, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();
    
    this.setupEventHandlers();
    
    await this.connect();
  }
  
  private setupEventHandlers(): void {
    if (!this.connection) return;
    
    // Handler: Nhận OHLCV update từ server
    // Server calls: await Clients.Group($"OHLCV:{Ticker}:{Timeframe}").SendAsync("ReceiveOhlcvUpdate", candleDto)
    this.connection.on('ReceiveOhlcvUpdate', (rawData: any) => {
      try {
        const candle = this.parseOhlcvData(rawData);
        const key = this.getSubscriptionKey(candle.ticker, candle.timeframe);
        
        console.log(`[OhlcvSignalR] ✅ Received ${candle.isComplete ? 'COMPLETED' : 'in-progress'} candle:`, 
          `${candle.ticker} ${candle.timeframe}`, 
          `OHLC: ${candle.open}/${candle.high}/${candle.low}/${candle.close}`,
          `Vol: ${candle.volume}`
        );
        
        // Notify subscribers
        const callbacks = this.subscriptionCallbacks.get(key);
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback(candle);
            } catch (error) {
              console.error('[OhlcvSignalR] Error in callback:', error);
            }
          });
        }
      } catch (error) {
        console.error('[OhlcvSignalR] Error parsing OHLCV data:', error, rawData);
      }
    });
    
    // Handler: Nhận single current candle từ SubscribeToOhlcv response
    this.connection.on('ReceiveCurrentCandle', (rawData: any) => {
      try {
        console.log('[OhlcvSignalR] Received current candle:', rawData);
        // This is just confirmation, actual updates come via ReceiveOhlcvUpdate
      } catch (error) {
        console.error('[OhlcvSignalR] Error handling current candle:', error);
      }
    });
    
    // Handler: Nhận all current candles từ GetAllCurrentCandles response
    this.connection.on('ReceiveAllCurrentCandles', (rawData: any) => {
      try {
        console.log('[OhlcvSignalR] Received all current candles:', rawData);
        // This is just initial data, actual updates come via ReceiveOhlcvUpdate
      } catch (error) {
        console.error('[OhlcvSignalR] Error handling all current candles:', error);
      }
    });
    
    // Connection lifecycle events
    this.connection.onclose((error) => {
      if (error) {
        console.error('[OhlcvSignalR] Connection closed with error:', error);
      } else {
        console.log('[OhlcvSignalR] Connection closed');
      }
      this.updateConnectionState(signalR.HubConnectionState.Disconnected);
    });
    
    this.connection.onreconnecting((error) => {
      console.warn('[OhlcvSignalR] Reconnecting...', error);
      this.updateConnectionState(signalR.HubConnectionState.Reconnecting);
    });
    
    this.connection.onreconnected(async (connectionId) => {
      console.log('[OhlcvSignalR] Reconnected successfully:', connectionId);
      this.updateConnectionState(signalR.HubConnectionState.Connected);
      
      // Re-subscribe to all active subscriptions
      if (this.activeSubscriptions.size > 0) {
        console.log('[OhlcvSignalR] Re-subscribing to', this.activeSubscriptions.size, 'subscriptions');
        for (const key of this.activeSubscriptions) {
          const [ticker, timeframe] = key.split(':');
          try {
            await this.connection!.invoke('SubscribeToOhlcv', ticker, timeframe);
          } catch (error) {
            console.error(`[OhlcvSignalR] Failed to re-subscribe to ${key}:`, error);
          }
        }
      }
    });
  }
  
  private async connect(): Promise<void> {
    if (!this.connection) {
      throw new Error('[OhlcvSignalR] Connection not initialized');
    }
    
    if (this.connectionState === signalR.HubConnectionState.Connected) {
      console.log('[OhlcvSignalR] Already connected');
      return;
    }
    
    try {
      this.updateConnectionState(signalR.HubConnectionState.Connecting);
      console.log('[OhlcvSignalR] Connecting to hub...', `${this.baseUrl}/hubs/marketdata`);
      
      await this.connection.start();
      
      this.updateConnectionState(signalR.HubConnectionState.Connected);
      console.log('[OhlcvSignalR] Connected successfully:', this.connection.connectionId);
    } catch (error) {
      console.error('[OhlcvSignalR] Connection failed:', error);
      this.updateConnectionState(signalR.HubConnectionState.Disconnected);
      throw error;
    }
  }
  
  /**
   * Subscribe to OHLCV updates for specific ticker and timeframe
   * 
   * @param ticker - Stock ticker (e.g., "FPT", "VNM")
   * @param timeframe - Timeframe (M1, M5, M15, H1, H4, D1)
   * @param callback - Callback function to receive updates
   * @returns Unsubscribe function
   */
  public async subscribeToOhlcv(
    ticker: string,
    timeframe: string,
    callback: OhlcvUpdateCallback
  ): Promise<() => void> {
    if (!this.connection || this.connectionState !== signalR.HubConnectionState.Connected) {
      throw new Error('[OhlcvSignalR] Not connected. Call initialize() first.');
    }
    
    const normalizedTicker = ticker.toUpperCase();
    const normalizedTimeframe = timeframe.toUpperCase();
    const key = this.getSubscriptionKey(normalizedTicker, normalizedTimeframe);
    
    // Add callback
    if (!this.subscriptionCallbacks.has(key)) {
      this.subscriptionCallbacks.set(key, new Set());
    }
    this.subscriptionCallbacks.get(key)!.add(callback);
    
    // Subscribe to hub if first subscriber for this key
    if (this.subscriptionCallbacks.get(key)!.size === 1) {
      try {
        console.log(`[OhlcvSignalR] Subscribing to ${normalizedTicker} ${normalizedTimeframe}`);
        await this.connection.invoke('SubscribeToOhlcv', normalizedTicker, normalizedTimeframe);
        this.activeSubscriptions.add(key);
        console.log(`[OhlcvSignalR] ✅ Subscribed to ${normalizedTicker} ${normalizedTimeframe}`);
      } catch (error) {
        console.error(`[OhlcvSignalR] Failed to subscribe to ${key}:`, error);
        this.subscriptionCallbacks.get(key)!.delete(callback);
        throw error;
      }
    }
    
    // Return unsubscribe function
    return async () => {
      await this.unsubscribe(normalizedTicker, normalizedTimeframe, callback);
    };
  }
  
  /**
   * Unsubscribe from OHLCV updates
   */
  private async unsubscribe(ticker: string, timeframe: string, callback: OhlcvUpdateCallback): Promise<void> {
    const key = this.getSubscriptionKey(ticker, timeframe);
    const callbacks = this.subscriptionCallbacks.get(key);
    
    if (!callbacks) return;
    
    callbacks.delete(callback);
    
    // If no more callbacks, unsubscribe from hub
    if (callbacks.size === 0) {
      this.subscriptionCallbacks.delete(key);
      this.activeSubscriptions.delete(key);
      
      if (this.connection && this.connectionState === signalR.HubConnectionState.Connected) {
        try {
          console.log(`[OhlcvSignalR] Unsubscribing from ${ticker} ${timeframe}`);
          await this.connection.invoke('UnsubscribeFromOhlcv', ticker, timeframe);
          console.log(`[OhlcvSignalR] ✅ Unsubscribed from ${ticker} ${timeframe}`);
        } catch (error) {
          console.error(`[OhlcvSignalR] Failed to unsubscribe from ${key}:`, error);
        }
      }
    }
  }
  
  /**
   * Get all current candles for a ticker (all timeframes)
   * 
   * @param ticker - Stock ticker
   * @returns Array of current candles for all timeframes
   */
  public async getAllCurrentCandles(ticker: string): Promise<OhlcvCandle[]> {
    if (!this.connection || this.connectionState !== signalR.HubConnectionState.Connected) {
      throw new Error('[OhlcvSignalR] Not connected');
    }
    
    try {
      const normalizedTicker = ticker.toUpperCase();
      console.log(`[OhlcvSignalR] Fetching all current candles for ${normalizedTicker}`);
      
      const rawData = await this.connection.invoke('GetAllCurrentCandles', normalizedTicker);
      
      if (!rawData || typeof rawData !== 'object') {
        console.warn(`[OhlcvSignalR] No data returned for ${normalizedTicker}`);
        return [];
      }
      
      // Backend returns: { Ticker: string, Candles: Dictionary<string, CurrentCandleDto> }
      const candlesDict = (rawData as any).Candles || rawData;
      
      // Convert to array of candles
      const candles: OhlcvCandle[] = [];
      for (const [timeframe, candleData] of Object.entries(candlesDict)) {
        try {
          const candle = this.parseOhlcvData(candleData);
          candles.push(candle);
        } catch (error) {
          console.error(`[OhlcvSignalR] Failed to parse candle for ${timeframe}:`, error);
        }
      }
      
      console.log(`[OhlcvSignalR] ✅ Fetched ${candles.length} current candles for ${normalizedTicker}`);
      return candles;
    } catch (error) {
      console.error(`[OhlcvSignalR] Failed to get current candles for ${ticker}:`, error);
      throw error;
    }
  }
  
  /**
   * Parse raw data from backend (PascalCase) to camelCase
   */
  private parseOhlcvData(rawData: any): OhlcvCandle {
    const toCamelCase = (str: string): string => {
      return str.charAt(0).toLowerCase() + str.slice(1);
    };
    
    const parsed: any = {};
    
    if (typeof rawData === 'object' && rawData !== null) {
      Object.keys(rawData).forEach((key: string) => {
        const camelKey = toCamelCase(key);
        parsed[camelKey] = rawData[key];
      });
    }
    
    return {
      ticker: parsed.ticker || '',
      timeframe: parsed.timeframe || '',
      startTime: parsed.startTime || '',
      open: parseFloat(parsed.open) || 0,
      high: parseFloat(parsed.high) || 0,
      low: parseFloat(parsed.low) || 0,
      close: parseFloat(parsed.close) || 0,
      volume: parseFloat(parsed.volume) || 0,
      totalValue: parseFloat(parsed.totalValue) || 0,
      lastUpdateTime: parsed.lastUpdateTime || '',
      isComplete: parsed.isComplete === true,
    };
  }
  
  private getSubscriptionKey(ticker: string, timeframe: string): SubscriptionKey {
    return `${ticker.toUpperCase()}:${timeframe.toUpperCase()}`;
  }
  
  private updateConnectionState(state: signalR.HubConnectionState): void {
    if (this.connectionState !== state) {
      console.log(`[OhlcvSignalR] State: ${this.connectionState} -> ${state}`);
      this.connectionState = state;
      
      this.connectionStateCallbacks.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('[OhlcvSignalR] Error in state callback:', error);
        }
      });
    }
  }
  
  /**
   * Register callback for connection state changes
   */
  public onConnectionStateChanged(callback: OhlcvConnectionStateCallback): () => void {
    this.connectionStateCallbacks.add(callback);
    callback(this.connectionState);
    
    return () => {
      this.connectionStateCallbacks.delete(callback);
    };
  }
  
  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionState === signalR.HubConnectionState.Connected;
  }
  
  /**
   * Get current connection state
   */
  public getConnectionState(): signalR.HubConnectionState {
    return this.connectionState;
  }
  
  /**
   * Disconnect from hub
   */
  public async disconnect(): Promise<void> {
    if (!this.connection) return;
    
    try {
      // Unsubscribe all
      for (const key of this.activeSubscriptions) {
        const [ticker, timeframe] = key.split(':');
        try {
          await this.connection.invoke('UnsubscribeFromOhlcv', ticker, timeframe);
        } catch (error) {
          console.error(`[OhlcvSignalR] Failed to unsubscribe from ${key}:`, error);
        }
      }
      
      await this.connection.stop();
      this.activeSubscriptions.clear();
      this.subscriptionCallbacks.clear();
      
      console.log('[OhlcvSignalR] Disconnected');
    } catch (error) {
      console.error('[OhlcvSignalR] Error during disconnect:', error);
    }
  }
}

export default OhlcvSignalRService;
