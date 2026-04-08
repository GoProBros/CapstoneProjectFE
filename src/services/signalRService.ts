/**
 * SignalR Service - Quản lý kết nối real-time với backend
 * 
 * Service này sử dụng Singleton pattern để đảm bảo chỉ có 1 connection duy nhất
 * tới SignalR Hub trong toàn bộ ứng dụng.
 * 
 * Backend Hub: MarketDataHub.cs
 * Endpoint: /hubs/marketdata
 * Data Source: Redis (key format: "market:symbol:{TICKER}")
 */

import * as signalR from '@microsoft/signalr';
import { MarketSymbolDto, ConnectionState } from '@/types/market';
import type { LiveIndexData } from '@/types/marketIndex';
import signalRDebugLogService from '@/services/signalRDebugLogService';

/**
 * Callback type cho việc nhận dữ liệu market real-time
 */
export type MarketDataCallback = (data: MarketSymbolDto) => void;

/**
 * Callback type cho việc nhận từng lệnh khớp real-time
 */
export interface RecentTradeDto {
  ticker: string;
  price: number;
  volume: number;
  side: string;
  time: string;
}
export type TradeDataCallback = (trade: RecentTradeDto) => void;
export type RecentTradesCallback = (trades: RecentTradeDto[]) => void;

/**
 * Price depth snapshot for the "3 Bước Giá" module.
 * Received from SignalR group DEPTH:{ticker} via ReceivePriceDepth event.
 */
export interface PriceDepthDto {
  ticker: string;
  askPrice1: number; askVol1: number;
  askPrice2: number; askVol2: number;
  askPrice3: number; askVol3: number;
  bidPrice1: number; bidVol1: number;
  bidPrice2: number; bidVol2: number;
  bidPrice3: number; bidVol3: number;
  referencePrice: number;
  ceilingPrice: number;
  floorPrice: number;
  change: number;
  ratioChange: number;
  totalVol: number;
  askChange1: number; askChangePct1: number;
  askChange2: number; askChangePct2: number;
  askChange3: number; askChangePct3: number;
  bidChange1: number; bidChangePct1: number;
  bidChange2: number; bidChangePct2: number;
  bidChange3: number; bidChangePct3: number;
  fBuyVol: number;
  fSellVol: number;
  fBuyVal: number;
  fSellVal: number;
  // Pre-computed server-side derived values
  bullPct: number;
  bearPct: number;
  fBuyPct: number;
  fSellPct: number;
  maxDepthVol: number;
  side: string;
  tradingSession?: string;
}
export type PriceDepthCallback = (depth: PriceDepthDto) => void;

/** Callback type for receiving real-time index snapshots. */
export type IndexDataCallback = (data: LiveIndexData) => void;

/**
 * Callback type cho việc thay đổi trạng thái connection
 */
export type ConnectionStateCallback = (state: ConnectionState) => void;

/**
 * Configuration cho SignalR connection
 */
interface SignalRConfig {
  /** URL của backend API (mặc định: http://localhost:5000) */
  baseUrl: string;
  
  /** Tự động reconnect khi mất kết nối */
  automaticReconnect?: boolean;
  
  /** Thời gian retry khi reconnect (milliseconds) */
  reconnectDelays?: number[];
}

/**
 * SignalRService - Singleton class quản lý kết nối SignalR
 * 
 * Cách sử dụng:
 * 1. Initialize: SignalRService.getInstance().initialize(config)
 * 2. Connect: await SignalRService.getInstance().connect()
 * 3. Subscribe: await SignalRService.getInstance().subscribeToSymbols(['VNM', 'HPG'])
 * 4. Listen: SignalRService.getInstance().onMarketDataReceived(callback)
 * 5. Unsubscribe: await SignalRService.getInstance().unsubscribeFromSymbols(['VNM'])
 * 6. Disconnect: await SignalRService.getInstance().disconnect()
 */
class SignalRService {
  private static instance: SignalRService;
  
  /** HubConnection instance từ SignalR client */
  private connection: signalR.HubConnection | null = null;

  /** In-flight connect promise để tránh gọi start() trùng */
  private connectPromise: Promise<void> | null = null;
  
  /** Trạng thái kết nối hiện tại */
  private connectionState: ConnectionState = ConnectionState.Disconnected;
  
  /** Danh sách callbacks nhận dữ liệu market */
  private marketDataCallbacks: Set<MarketDataCallback> = new Set();
  
  /** Danh sách callbacks nhận lệnh khớp real-time */
  private tradeDataCallbacks: Set<TradeDataCallback> = new Set();

  /** Danh sách callbacks nhận lịch sử lệnh khớp (initial load) */
  private recentTradesCallbacks: Set<RecentTradesCallback> = new Set();

  /** Danh sách callbacks nhận price depth (3 bước giá) */
  private priceDepthCallbacks: Set<PriceDepthCallback> = new Set();

  /** Callbacks for live index data (ReceiveIndexData). */
  private indexDataCallbacks: Set<IndexDataCallback> = new Set();
  
  /** Danh sách callbacks theo dõi trạng thái connection */
  private connectionStateCallbacks: Set<ConnectionStateCallback> = new Set();
  
  /** Danh sách symbols đang subscribe */
  private subscribedSymbols: Set<string> = new Set();

  /** Index codes currently subscribed via SignalR. */
  private subscribedIndices: Set<string> = new Set();
  
  /** Configuration */
  private config: SignalRConfig = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7148',  // Default backend port (HTTPS, update via initialize() if different)
    automaticReconnect: true,
    reconnectDelays: [0, 2000, 5000, 10000, 30000], // 0s, 2s, 5s, 10s, 30s
  };

  /** Counters for sampled debug logging. */
  private marketDataDebugCount = 0;
  private batchMarketDataDebugCount = 0;

  /** Runtime switch for temporary StockScreener realtime debugging. */
  private isStockScreenerDebugEnabled(): boolean {
    if (process.env.NEXT_PUBLIC_STOCK_SCREENER_DEBUG === '1') {
      return true;
    }
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      return window.localStorage.getItem('debug:stockscreener') === '1';
    } catch {
      return false;
    }
  }

  /** Keep logs readable by sampling high-frequency realtime events. */
  private shouldLogSample(counter: number): boolean {
    return counter <= 20 || counter % 100 === 0;
  }

  private debugLog(message: string, payload?: unknown): void {
    if (!this.isStockScreenerDebugEnabled()) return;
    if (payload === undefined) {
      console.log(`[SignalR][StockScreenerDebug] ${message}`);
      return;
    }
    console.log(`[SignalR][StockScreenerDebug] ${message}`, payload);
  }

  /** Convert a field key to camelCase (first letter lowercase). */
  private toCamelCase(key: string): string {
    if (!key) return key;
    return key.charAt(0).toLowerCase() + key.slice(1);
  }

  /** Convert numeric-like values to number while preserving non-numeric values. */
  private normalizeValue(value: unknown): unknown {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return value;
      const parsed = Number(trimmed);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return value;
  }

  /** Normalize object keys to camelCase and values to number when possible. */
  private normalizeObjectPayload(rawData: Record<string, unknown>): Record<string, unknown> {
    const parsedData: Record<string, unknown> = {};
    Object.keys(rawData).forEach((key) => {
      const camelKey = this.toCamelCase(key);
      parsedData[camelKey] = this.normalizeValue(rawData[key]);
    });
    return parsedData;
  }

  /**
   * Normalize market payload from SignalR.
   * Supports:
   * - plain object payloads (MarketSymbolDto / dictionary)
   * - array payloads in [{ field, value }] shape
   */
  private normalizeMarketData(rawData: unknown): MarketSymbolDto | null {
    if (!rawData) return null;

    let parsedData: Record<string, unknown> = {};

    if (Array.isArray(rawData)) {
      // Shape: [{ field: "LastPrice", value: 86500 }, ...]
      rawData.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const obj = item as Record<string, unknown>;
        const field = typeof obj.field === 'string' ? obj.field : null;
        if (!field || obj.value === undefined) return;
        parsedData[this.toCamelCase(field)] = this.normalizeValue(obj.value);
      });
    } else if (typeof rawData === 'object') {
      parsedData = this.normalizeObjectPayload(rawData as Record<string, unknown>);
    } else {
      return null;
    }

    // Some backends may send `symbol` instead of `ticker`.
    const tickerCandidate = parsedData.ticker ?? parsedData.symbol;
    if (typeof tickerCandidate === 'string' && tickerCandidate.trim().length > 0) {
      parsedData.ticker = tickerCandidate.toUpperCase();
    }

    if (typeof parsedData.ticker !== 'string' || parsedData.ticker.length === 0) {
      return null;
    }

    return parsedData as unknown as MarketSymbolDto;
  }

  /** Emit a normalized market snapshot to all registered callbacks. */
  private emitMarketData(data: MarketSymbolDto): void {
    this.marketDataCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[SignalR] Error in market data callback:', error);
      }
    });
  }
  
  /**
   * Private constructor để enforce Singleton pattern
   */
  private constructor() {}
  
  /**
   * Lấy instance duy nhất của SignalRService (Singleton)
   */
  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }
  
  /**
   * Khởi tạo service với configuration
   * Phải gọi trước khi connect
   */
  public initialize(config: Partial<SignalRConfig>): void {
    const previousConfig = this.config;

    // Do not let an undefined/empty baseUrl override a working previous config.
    const sanitizedConfig: Partial<SignalRConfig> = { ...config };
    if (!sanitizedConfig.baseUrl || sanitizedConfig.baseUrl.trim().length === 0) {
      delete sanitizedConfig.baseUrl;
    }

    const nextConfig = { ...this.config, ...sanitizedConfig };
    if (nextConfig.baseUrl) {
      nextConfig.baseUrl = nextConfig.baseUrl.replace(/\/+$/, '');
    }

    const isSameBaseUrl = previousConfig.baseUrl === nextConfig.baseUrl;
    const isSameAutoReconnect = previousConfig.automaticReconnect === nextConfig.automaticReconnect;
    const isSameReconnectDelays =
      (previousConfig.reconnectDelays ?? []).join(',') === (nextConfig.reconnectDelays ?? []).join(',');

    // Idempotent initialize: tránh tạo lại connection không cần thiết
    if (this.connection && isSameBaseUrl && isSameAutoReconnect && isSameReconnectDelays) {
      this.config = nextConfig;
      return;
    }

    this.config = nextConfig;
    signalRDebugLogService.logState('INITIALIZE', {
      baseUrl: nextConfig.baseUrl,
      automaticReconnect: nextConfig.automaticReconnect,
      reconnectDelays: nextConfig.reconnectDelays,
    });

    // Nếu config đổi, dừng connection cũ trước khi build connection mới
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      this.connection.stop().catch((error) => {
        console.error('[SignalR] Failed to stop previous connection during re-initialize:', error);
      });
    }

    this.connection = null;
    this.connectPromise = null;
    this.subscribedSymbols.clear();
    this.subscribedIndices.clear();
    this.updateConnectionState(ConnectionState.Disconnected);
    
    // Build SignalR connection
    const connectionBuilder = new signalR.HubConnectionBuilder()
      .withUrl(`${this.config.baseUrl}/hubs/marketdata`, {
        // Có thể thêm headers, auth token ở đây
        // headers: { 'Authorization': `Bearer ${token}` }
        skipNegotiation: false,  // Ensure negotiation happens
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
      })
      .configureLogging(signalR.LogLevel.Information); // Enable detailed logging for debugging
    
    // Cấu hình auto reconnect nếu được bật
    if (this.config.automaticReconnect && this.config.reconnectDelays) {
      connectionBuilder.withAutomaticReconnect(this.config.reconnectDelays);
    }
    
    // Build connection
    this.connection = connectionBuilder.build();
    
    // Setup event handlers
    this.setupEventHandlers();
  }
  
  /**
   * Setup các event handlers cho connection
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Handler: Nhận dữ liệu market từ server (Channel X Snapshot)
    // Server gọi: await Clients.Group(ticker).SendAsync("ReceiveMarketData", data)
    this.connection.on('ReceiveMarketData', (rawData: unknown) => {
      const currentCount = ++this.marketDataDebugCount;
      signalRDebugLogService.logReceived('ReceiveMarketData', rawData, {
        sequence: currentCount,
      });
      const data = this.normalizeMarketData(rawData);
      if (!data) {
        if (this.shouldLogSample(currentCount)) {
          this.debugLog(`ReceiveMarketData invalid payload #${currentCount}`, rawData);
        }
        return;
      }

      if (this.shouldLogSample(currentCount)) {
        this.debugLog(`ReceiveMarketData #${currentCount}`, {
          ticker: data.ticker,
          lastPrice: data.lastPrice,
          lastVol: data.lastVol,
          totalVol: data.totalVol,
          keys: Object.keys(data),
        });
      }

      this.emitMarketData(data);
    });

    // Optional batch event compatibility:
    // some backend versions may push multiple snapshots in one event.
    this.connection.on('ReceiveBatchMarketData', (rawData: unknown) => {
      const batchCount = ++this.batchMarketDataDebugCount;
      signalRDebugLogService.logReceived('ReceiveBatchMarketData', rawData, {
        sequence: batchCount,
      });
      if (Array.isArray(rawData)) {
        if (this.shouldLogSample(batchCount)) {
          this.debugLog(`ReceiveBatchMarketData(array) #${batchCount}`, {
            count: rawData.length,
          });
        }
        rawData.forEach((item) => {
          const data = this.normalizeMarketData(item);
          if (data) this.emitMarketData(data);
        });
        return;
      }

      // Accept wrapper shape: { items: [...] }
      if (rawData && typeof rawData === 'object') {
        const wrapper = rawData as Record<string, unknown>;
        const items = wrapper.items;
        if (Array.isArray(items)) {
          if (this.shouldLogSample(batchCount)) {
            this.debugLog(`ReceiveBatchMarketData(wrapper.items) #${batchCount}`, {
              count: items.length,
            });
          }
          items.forEach((item) => {
            const data = this.normalizeMarketData(item);
            if (data) this.emitMarketData(data);
          });
          return;
        }

        // Fallback: payload is actually a single object
        const single = this.normalizeMarketData(rawData);
        if (single) {
          if (this.shouldLogSample(batchCount)) {
            this.debugLog(`ReceiveBatchMarketData(single) #${batchCount}`, {
              ticker: single.ticker,
              lastPrice: single.lastPrice,
            });
          }
          this.emitMarketData(single);
        }
      }
    });

    // Handler: single matched order from X-TRADE channel
    // Server gọi: await Clients.Group("TRADE:{ticker}").SendAsync("ReceiveTradeData", trade)
    this.connection.on('ReceiveTradeData', (rawData: any) => {
      signalRDebugLogService.logReceived('ReceiveTradeData', rawData);
      const toCamelCase = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);
      const trade: RecentTradeDto = {} as any;
      if (rawData && typeof rawData === 'object') {
        Object.keys(rawData).forEach(k => { (trade as any)[toCamelCase(k)] = (rawData as any)[k]; });
      }
      this.tradeDataCallbacks.forEach(cb => { try { cb(trade); } catch {} });
    });

    // Handler: initial batch of recent trades (sent right after SubscribeToTradeUpdates)
    this.connection.on('ReceiveRecentTrades', (rawData: any[]) => {
      signalRDebugLogService.logReceived('ReceiveRecentTrades', rawData, {
        count: Array.isArray(rawData) ? rawData.length : 0,
      });
      if (!Array.isArray(rawData)) return;
      const toCamelCase = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);
      const trades: RecentTradeDto[] = rawData.map(item => {
        const t: any = {};
        Object.keys(item).forEach(k => { t[toCamelCase(k)] = item[k]; });
        return t as RecentTradeDto;
      });
      this.recentTradesCallbacks.forEach(cb => { try { cb(trades); } catch {} });
    });

    // Handler: live index snapshot from INDEX:{code} group
    // Server sends: await Clients.Group("INDEX:{code}").SendAsync("ReceiveIndexData", dto)
    this.connection.on('ReceiveIndexData', (rawData: any) => {
      signalRDebugLogService.logReceived('ReceiveIndexData', rawData);
      if (!rawData || typeof rawData !== 'object') return;
      const toCamelCase = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);
      const data: any = {};
      Object.keys(rawData).forEach(k => { data[toCamelCase(k)] = (rawData as any)[k]; });
      this.indexDataCallbacks.forEach(cb => { try { cb(data as LiveIndexData); } catch {} });
    });

    // Handler: price depth snapshot from DEPTH:{ticker} group
    // Server gọi: await Clients.Group("DEPTH:{ticker}").SendAsync("ReceivePriceDepth", depth)
    this.connection.on('ReceivePriceDepth', (rawData: any) => {
      signalRDebugLogService.logReceived('ReceivePriceDepth', rawData);
      const toCamelCase = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);
      const depth: PriceDepthDto = {} as any;
      if (rawData && typeof rawData === 'object') {
        Object.keys(rawData).forEach(k => { (depth as any)[toCamelCase(k)] = (rawData as any)[k]; });
      }
      this.priceDepthCallbacks.forEach(cb => { try { cb(depth); } catch {} });
    });
    
    // Event: Kết nối đã được thiết lập
    this.connection.onclose((error) => {
      signalRDebugLogService.logState('CONNECTION_CLOSED', {
        hasError: Boolean(error),
      }, {
        errorMessage: error?.message,
      });
      if (error) {
        console.error('[SignalR] Connection closed with error:', error);
        this.updateConnectionState(ConnectionState.Error);
      } else {
        this.updateConnectionState(ConnectionState.Disconnected);
      }
    });
    
    // Event: Đang reconnecting
    this.connection.onreconnecting((error) => {
      signalRDebugLogService.logState('CONNECTION_RECONNECTING', {
        errorMessage: error?.message,
      });
      console.warn('[SignalR] Connection lost. Reconnecting...', error);
      this.updateConnectionState(ConnectionState.Reconnecting);
    });
    
    // Event: Reconnect thành công
    this.connection.onreconnected(async (connectionId) => {
      signalRDebugLogService.ensureSession({
        reason: 'reconnected',
        connectionId,
      });
      signalRDebugLogService.logState('CONNECTION_RECONNECTED', {
        connectionId,
      });
      this.updateConnectionState(ConnectionState.Connected);
      
      // Tự động subscribe lại các symbols đã subscribe trước đó
      if (this.subscribedSymbols.size > 0) {
        await this.subscribeToSymbols(Array.from(this.subscribedSymbols));
      }
      // Re-subscribe to index groups
      if (this.subscribedIndices.size > 0) {
        await this.subscribeToIndices(Array.from(this.subscribedIndices));
      }
    });
  }
  
  /**
   * Kết nối tới SignalR Hub
   * @returns Promise resolve khi connect thành công
   */
  public async connect(): Promise<void> {
    if (!this.connection) {
      throw new Error('[SignalR] Service not initialized. Call initialize() first.');
    }

    if (this.connection.state === signalR.HubConnectionState.Connected) {
      signalRDebugLogService.ensureSession({
        reason: 'connect-called-when-already-connected',
        connectionId: this.connection.connectionId,
      });
      signalRDebugLogService.logState('CONNECT_SKIPPED_ALREADY_CONNECTED');
      this.updateConnectionState(ConnectionState.Connected);
      return;
    }

    // Nếu đang có connect in-flight thì chỉ await
    if (this.connectPromise) {
      signalRDebugLogService.logState('CONNECT_WAITING_FOR_IN_FLIGHT_PROMISE');
      await this.connectPromise;
      return;
    }

    // Nếu SignalR đang transition state thì không gọi start() lần nữa
    if (
      this.connection.state === signalR.HubConnectionState.Connecting ||
      this.connection.state === signalR.HubConnectionState.Reconnecting
    ) {
      signalRDebugLogService.logState('CONNECT_SKIPPED_TRANSITION_STATE', {
        hubState: this.connection.state,
      });
      this.updateConnectionState(ConnectionState.Connecting);
      return;
    }

    // Nếu đang Disconnecting, đợi về Disconnected rồi mới start lại.
    if (this.connection.state === signalR.HubConnectionState.Disconnecting) {
      await this.waitForDisconnected(5000);
      const stateAfterWait = this.connection.state as signalR.HubConnectionState;
      if (stateAfterWait !== signalR.HubConnectionState.Disconnected) {
        this.updateConnectionState(ConnectionState.Connecting);
        return;
      }
    }
    
    try {
      this.updateConnectionState(ConnectionState.Connecting);
      signalRDebugLogService.logState('CONNECT_STARTING', {
        baseUrl: this.config.baseUrl,
      });

      this.connectPromise = this.connection.start()
        .then(() => {
          signalRDebugLogService.startSession({
            baseUrl: this.config.baseUrl,
            connectionId: this.connection?.connectionId,
          });
          signalRDebugLogService.logState('CONNECT_SUCCESS', {
            connectionId: this.connection?.connectionId,
          });
          this.updateConnectionState(ConnectionState.Connected);
        })
        .finally(() => {
          this.connectPromise = null;
        });

      await this.connectPromise;
    } catch (error: any) {
      signalRDebugLogService.logError('CONNECT_FAILED', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      });
      // Race benign: connection đã không còn ở Disconnected do luồng khác xử lý
      if (
        typeof error?.message === 'string' &&
        error.message.includes("not in the 'Disconnected' state") &&
        this.connection.state !== signalR.HubConnectionState.Disconnected
      ) {
        const hubState = this.connection.state as signalR.HubConnectionState;
        if (hubState === signalR.HubConnectionState.Connected) {
          this.updateConnectionState(ConnectionState.Connected);
        } else {
          this.updateConnectionState(ConnectionState.Connecting);
        }
        return;
      }

      console.error('[SignalR] Connection failed:', error);
      console.error('[SignalR] Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      });
      
      // Provide helpful error messages
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Failed to complete negotiation')) {
        console.error('[SignalR] ❌ Cannot connect to backend server. Please check:');
        console.error('[SignalR]    1. Backend server is running');
        console.error('[SignalR]    2. Backend URL is correct:', this.config.baseUrl);
        console.error('[SignalR]    3. CORS is configured on backend');
        console.error('[SignalR]    4. Network/firewall is not blocking the connection');
      }
      
      this.updateConnectionState(ConnectionState.Error);
      throw error;
    }
  }

  /**
   * Wait until HubConnection reaches Disconnected state (bounded by timeout).
   */
  private async waitForDisconnected(timeoutMs: number): Promise<void> {
    if (!this.connection) return;

    const startedAt = Date.now();
    while (
      this.connection &&
      this.connection.state !== signalR.HubConnectionState.Disconnected &&
      Date.now() - startedAt < timeoutMs
    ) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  
  /**
   * Ngắt kết nối khỏi SignalR Hub
   */
  public async disconnect(): Promise<void> {
    if (!this.connection) return;

    // Nếu connect đang pending thì đợi settle trước khi stop
    if (this.connectPromise) {
      try {
        await this.connectPromise;
      } catch {
        // ignore: connect đã fail thì cứ tiếp tục cleanup
      }
    }

    if (this.connection.state === signalR.HubConnectionState.Disconnected) {
      signalRDebugLogService.logState('DISCONNECT_SKIPPED_ALREADY_DISCONNECTED');
      return;
    }
    
    try {
      // Unsubscribe tất cả symbols trước khi disconnect
      if (this.subscribedSymbols.size > 0 && this.connection.state === signalR.HubConnectionState.Connected) {
        await this.unsubscribeFromSymbols(Array.from(this.subscribedSymbols));
      }
      
      await this.connection.stop();
      signalRDebugLogService.endSession('disconnect-called');
      this.updateConnectionState(ConnectionState.Disconnected);
    } catch (error) {
      signalRDebugLogService.logError('DISCONNECT_FAILED', error);
      console.error('[SignalR] Error during disconnect:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe nhận dữ liệu cho các mã chứng khoán cụ thể
   * Server method: SubscribeToSymbols(string[] symbols)
   * 
   * @param symbols - Mảng các mã chứng khoán (VD: ['VNM', 'HPG', 'VCB'])
   * @returns Promise resolve khi subscribe thành công
   */
  public async subscribeToSymbols(symbols: string[]): Promise<void> {
    if (!this.connection || this.connectionState !== ConnectionState.Connected) {
      throw new Error('[SignalR] Cannot subscribe. Connection not established.');
    }
    
    try {
      // Normalize symbols to uppercase
      const normalizedSymbols = symbols.map(s => s.toUpperCase());
      
      // Gọi server method: SubscribeToSymbols
      await this.connection.invoke('SubscribeToSymbols', normalizedSymbols);
      signalRDebugLogService.ensureSession({ reason: 'subscribe-symbols' });
      signalRDebugLogService.logAction('SubscribeToSymbols', {
        count: normalizedSymbols.length,
        symbols: normalizedSymbols,
      });
      
      // Lưu vào danh sách subscribed
      normalizedSymbols.forEach(symbol => this.subscribedSymbols.add(symbol));

      this.debugLog('Subscribed symbols', {
        count: normalizedSymbols.length,
        sample: normalizedSymbols.slice(0, 10),
      });
    } catch (error) {
      console.error('[SignalR] Error subscribing to symbols:', error);
      throw error;
    }
  }
  
  /**
   * Unsubscribe khỏi các mã chứng khoán cụ thể
   * Server method: UnsubscribeFromSymbols(string[] symbols)
   * 
   * @param symbols - Mảng các mã chứng khoán cần unsubscribe
   */
  public async unsubscribeFromSymbols(symbols: string[]): Promise<void> {
    if (!this.connection || this.connectionState !== ConnectionState.Connected) {
      throw new Error('[SignalR] Cannot unsubscribe. Connection not established.');
    }
    
    try {
      const normalizedSymbols = symbols.map(s => s.toUpperCase());
      
      // Gọi server method: UnsubscribeFromSymbols
      await this.connection.invoke('UnsubscribeFromSymbols', normalizedSymbols);
      signalRDebugLogService.ensureSession({ reason: 'unsubscribe-symbols' });
      signalRDebugLogService.logAction('UnsubscribeFromSymbols', {
        count: normalizedSymbols.length,
        symbols: normalizedSymbols,
      });
      
      // Xóa khỏi danh sách subscribed
      normalizedSymbols.forEach(symbol => this.subscribedSymbols.delete(symbol));

      this.debugLog('Unsubscribed symbols', {
        count: normalizedSymbols.length,
        sample: normalizedSymbols.slice(0, 10),
      });
  
    } catch (error) {
      console.error('[SignalR] Error unsubscribing from symbols:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe tất cả dữ liệu market (sử dụng cẩn thận - có thể có nhiều data)
   * Server method: SubscribeToAll()
   */
  public async subscribeToAll(): Promise<void> {
    if (!this.connection || this.connectionState !== ConnectionState.Connected) {
      throw new Error('[SignalR] Cannot subscribe. Connection not established.');
    }
    
    try {
      await this.connection.invoke('SubscribeToAll');
    } catch (error) {
      console.error('[SignalR] Error subscribing to all:', error);
      throw error;
    }
  }
  
  /**
   * Unsubscribe khỏi tất cả dữ liệu market
   * Server method: UnsubscribeFromAll()
   */
  public async unsubscribeFromAll(): Promise<void> {
    if (!this.connection || this.connectionState !== ConnectionState.Connected) {
      throw new Error('[SignalR] Cannot unsubscribe. Connection not established.');
    }
    
    try {
      await this.connection.invoke('UnsubscribeFromAll');
      this.subscribedSymbols.clear();
    } catch (error) {
      console.error('[SignalR] Error unsubscribing from all:', error);
      throw error;
    }
  }
  
  /**
   * Invoke a Hub method and return the result.
   */
  public async invoke<T = void>(method: string, ...args: any[]): Promise<T> {
    if (!this.connection || this.connectionState !== ConnectionState.Connected) {
      throw new Error('[SignalR] Cannot invoke. Connection not established.');
    }
    return await this.connection.invoke<T>(method, ...args);
  }

  /**
   * Subscribe to real-time matched orders for a specific ticker.
   * Server will push initial 20 trades (ReceiveRecentTrades) then each new trade (ReceiveTradeData).
   */
  public async subscribeToTradeUpdates(ticker: string): Promise<void> {
    if (!this.connection || this.connectionState !== ConnectionState.Connected) return;
    await this.connection.invoke('SubscribeToTradeUpdates', ticker.toUpperCase());
  }

  /**
   * Unsubscribe from real-time matched orders for a specific ticker.
   */
  public async unsubscribeFromTradeUpdates(ticker: string): Promise<void> {
    if (!this.connection || this.connectionState !== ConnectionState.Connected) return;
    await this.connection.invoke('UnsubscribeFromTradeUpdates', ticker.toUpperCase());
  }

  /** Subscribe to live index data for the given codes. Server joins INDEX:{code} groups. */
  public async subscribeToIndices(codes: string[]): Promise<void> {
    if (!this.connection || this.connectionState !== ConnectionState.Connected) return;
    const upper = codes.map(c => c.toUpperCase());
    await this.connection.invoke('SubscribeToIndices', upper);
    upper.forEach(c => this.subscribedIndices.add(c));
  }

  /** Unsubscribe from live index data for the given codes. */
  public async unsubscribeFromIndices(codes: string[]): Promise<void> {
    if (!this.connection || this.connectionState !== ConnectionState.Connected) return;
    const upper = codes.map(c => c.toUpperCase());
    await this.connection.invoke('UnsubscribeFromIndices', upper);
    upper.forEach(c => this.subscribedIndices.delete(c));
  }

  /**
   * Register a callback for ReceiveIndexData events.
   * Returns an unsubscribe function.
   */
  public onIndexDataReceived(callback: IndexDataCallback): () => void {
    this.indexDataCallbacks.add(callback);
    return () => this.indexDataCallbacks.delete(callback);
  }

  /**
   * Subscribe to price depth (3 bước giá) for a specific ticker.
   * Server sends current snapshot immediately (ReceivePriceDepth), then pushes on every change.
   */
  public async subscribeToPriceDepth(ticker: string): Promise<void> {
    if (!this.connection || this.connectionState !== ConnectionState.Connected) return;
    await this.connection.invoke('SubscribeToPriceDepth', ticker.toUpperCase());
  }

  /**
   * Unsubscribe from price depth updates for a specific ticker.
   */
  public async unsubscribeFromPriceDepth(ticker: string): Promise<void> {
    if (!this.connection || this.connectionState !== ConnectionState.Connected) return;
    await this.connection.invoke('UnsubscribeFromPriceDepth', ticker.toUpperCase());
  }

  /**
   * Register callback for price depth updates (3 bước giá).
   * Returns an unsubscribe function.
   */
  public onPriceDepthReceived(callback: PriceDepthCallback): () => void {
    this.priceDepthCallbacks.add(callback);
    return () => this.priceDepthCallbacks.delete(callback);
  }

  /**
   * Register callback for each incoming matched order (realtime).
   * Returns an unsubscribe function.
   */
  public onTradeDataReceived(callback: TradeDataCallback): () => void {
    this.tradeDataCallbacks.add(callback);
    return () => this.tradeDataCallbacks.delete(callback);
  }

  /**
   * Register callback for initial batch of recent trades.
   * Called once right after SubscribeToTradeUpdates.
   * Returns an unsubscribe function.
   */
  public onRecentTradesReceived(callback: RecentTradesCallback): () => void {
    this.recentTradesCallbacks.add(callback);
    return () => this.recentTradesCallbacks.delete(callback);
  }

  /**
   * Đăng ký callback để nhận dữ liệu market real-time
   * 
   * @param callback - Function sẽ được gọi mỗi khi nhận data từ server
   * @returns Function để unregister callback
   */
  public onMarketDataReceived(callback: MarketDataCallback): () => void {
    this.marketDataCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.marketDataCallbacks.delete(callback);
    };
  }
  
  /**
   * Đăng ký callback để theo dõi thay đổi trạng thái connection
   * 
   * @param callback - Function sẽ được gọi khi connection state thay đổi
   * @returns Function để unregister callback
   */
  public onConnectionStateChanged(callback: ConnectionStateCallback): () => void {
    this.connectionStateCallbacks.add(callback);
    
    // Gọi callback ngay lập tức với state hiện tại
    callback(this.connectionState);
    
    // Return unsubscribe function
    return () => {
      this.connectionStateCallbacks.delete(callback);
    };
  }
  
  /**
   * Cập nhật trạng thái connection và notify tất cả callbacks
   */
  private updateConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      
      // Notify tất cả callbacks
      this.connectionStateCallbacks.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('[SignalR] Error in connection state callback:', error);
        }
      });
    }
  }
  
  /**
   * Lấy trạng thái connection hiện tại
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  /**
   * Lấy danh sách symbols đang subscribe
   */
  public getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }
  
  /**
   * Kiểm tra xem có đang connected không
   */
  public isConnected(): boolean {
    return this.connectionState === ConnectionState.Connected;
  }
}

// Export singleton instance
export default SignalRService;
