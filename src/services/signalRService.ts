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

/**
 * Callback type cho việc nhận dữ liệu market real-time
 */
export type MarketDataCallback = (data: MarketSymbolDto) => void;

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
  
  /** Trạng thái kết nối hiện tại */
  private connectionState: ConnectionState = ConnectionState.Disconnected;
  
  /** Danh sách callbacks nhận dữ liệu market */
  private marketDataCallbacks: Set<MarketDataCallback> = new Set();
  
  /** Danh sách callbacks theo dõi trạng thái connection */
  private connectionStateCallbacks: Set<ConnectionStateCallback> = new Set();
  
  /** Danh sách symbols đang subscribe */
  private subscribedSymbols: Set<string> = new Set();
  
  /** Configuration */
  private config: SignalRConfig = {
    baseUrl: 'https://localhost:7148',  // Default backend port (HTTPS, update via initialize() if different)
    automaticReconnect: true,
    reconnectDelays: [0, 2000, 5000, 10000, 30000], // 0s, 2s, 5s, 10s, 30s
  };
  
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
    this.config = { ...this.config, ...config };
    
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
    
    console.log('[SignalR] Service initialized with config:', this.config);
  }
  
  /**
   * Setup các event handlers cho connection
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;
    
    // Handler: Nhận dữ liệu market từ server
    // Server gọi: await Clients.Caller.SendAsync("ReceiveMarketData", marketData)
    this.connection.on('ReceiveMarketData', (rawData: any) => {
      // Parse data - Backend gửi PascalCase, cần convert thành camelCase
      let data: MarketSymbolDto;
      
      // Helper function: Convert PascalCase to camelCase
      const toCamelCase = (str: string): string => {
        return str.charAt(0).toLowerCase() + str.slice(1);
      };
      
      if (Array.isArray(rawData)) {
        // Convert array [{field: "Ticker", value: "ACB"}, ...] → {ticker: "ACB", ...}
        const parsedData: any = {};
        rawData.forEach((item: any) => {
          if (item.field && item.value !== undefined) {
            // Convert PascalCase to camelCase: "LastPrice" → "lastPrice"
            const fieldName = toCamelCase(item.field);
            // Parse number if possible
            const value = item.value;
            parsedData[fieldName] = isNaN(value) ? value : parseFloat(value);
          }
        });
        data = parsedData as MarketSymbolDto;
      } else if (typeof rawData === 'object' && rawData !== null) {
        // ✅ FIX: Backend gửi plain object với PascalCase keys
        // Convert tất cả keys từ PascalCase → camelCase
        const parsedData: any = {};
        Object.keys(rawData).forEach((key: string) => {
          const camelKey = toCamelCase(key);
          const value = (rawData as any)[key];
          // Parse number nếu có thể (giữ nguyên string nếu không phải number)
          parsedData[camelKey] = (typeof value === 'number') ? value : 
                                  (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(value as any)) ? parseFloat(value) : 
                                  value;
        });
        data = parsedData as MarketSymbolDto;
      } else {
        console.error('[SignalR] Invalid data format received:', rawData);
        return; // Skip invalid data
      }
      
      console.log('[SignalR] ✅ Received & converted market data:', data.ticker, 'Price:', data.lastPrice);
      
      // Gọi tất cả callbacks đã đăng ký
      this.marketDataCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[SignalR] Error in market data callback:', error);
        }
      });
    });
    
    // Event: Kết nối đã được thiết lập
    this.connection.onclose((error) => {
      if (error) {
        console.error('[SignalR] Connection closed with error:', error);
        this.updateConnectionState(ConnectionState.Error);
      } else {
        console.log('[SignalR] Connection closed');
        this.updateConnectionState(ConnectionState.Disconnected);
      }
    });
    
    // Event: Đang reconnecting
    this.connection.onreconnecting((error) => {
      console.warn('[SignalR] Connection lost. Reconnecting...', error);
      this.updateConnectionState(ConnectionState.Reconnecting);
    });
    
    // Event: Reconnect thành công
    this.connection.onreconnected(async (connectionId) => {
      console.log('[SignalR] Reconnected successfully. Connection ID:', connectionId);
      this.updateConnectionState(ConnectionState.Connected);
      
      // Tự động subscribe lại các symbols đã subscribe trước đó
      if (this.subscribedSymbols.size > 0) {
        console.log('[SignalR] Re-subscribing to symbols:', Array.from(this.subscribedSymbols));
        await this.subscribeToSymbols(Array.from(this.subscribedSymbols));
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
    
    if (this.connectionState === ConnectionState.Connected) {
      console.log('[SignalR] Already connected');
      return;
    }
    
    try {
      this.updateConnectionState(ConnectionState.Connecting);
      console.log('[SignalR] Connecting to hub...');
      console.log('[SignalR] Hub URL:', `${this.config.baseUrl}/hubs/marketdata`);
      
      await this.connection.start();
      
      this.updateConnectionState(ConnectionState.Connected);
      console.log('[SignalR] Connected successfully. Connection ID:', this.connection.connectionId);
    } catch (error: any) {
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
   * Ngắt kết nối khỏi SignalR Hub
   */
  public async disconnect(): Promise<void> {
    if (!this.connection) return;
    
    try {
      console.log('[SignalR] Disconnecting...');
      
      // Unsubscribe tất cả symbols trước khi disconnect
      if (this.subscribedSymbols.size > 0) {
        await this.unsubscribeFromSymbols(Array.from(this.subscribedSymbols));
      }
      
      await this.connection.stop();
      this.updateConnectionState(ConnectionState.Disconnected);
      
      console.log('[SignalR] Disconnected successfully');
    } catch (error) {
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
      
      console.log('[SignalR] Subscribing to symbols:', normalizedSymbols);
      
      // Gọi server method: SubscribeToSymbols
      await this.connection.invoke('SubscribeToSymbols', normalizedSymbols);
      
      // Lưu vào danh sách subscribed
      normalizedSymbols.forEach(symbol => this.subscribedSymbols.add(symbol));
      
      console.log('[SignalR] Successfully subscribed to symbols:', normalizedSymbols);
      console.log('[SignalR] Total subscribed symbols:', this.subscribedSymbols.size);
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
      
      console.log('[SignalR] Unsubscribing from symbols:', normalizedSymbols);
      
      // Gọi server method: UnsubscribeFromSymbols
      await this.connection.invoke('UnsubscribeFromSymbols', normalizedSymbols);
      
      // Xóa khỏi danh sách subscribed
      normalizedSymbols.forEach(symbol => this.subscribedSymbols.delete(symbol));
      
      console.log('[SignalR] Successfully unsubscribed from symbols:', normalizedSymbols);
      console.log('[SignalR] Remaining subscribed symbols:', this.subscribedSymbols.size);
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
      console.log('[SignalR] Subscribing to all market data');
      await this.connection.invoke('SubscribeToAll');
      console.log('[SignalR] Successfully subscribed to all market data');
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
      console.log('[SignalR] Unsubscribing from all market data');
      await this.connection.invoke('UnsubscribeFromAll');
      this.subscribedSymbols.clear();
      console.log('[SignalR] Successfully unsubscribed from all market data');
    } catch (error) {
      console.error('[SignalR] Error unsubscribing from all:', error);
      throw error;
    }
  }
  
  /**
   * Đăng ký callback để nhận dữ liệu market real-time
   * 
   * @param callback - Function sẽ được gọi mỗi khi nhận data từ server
   * @returns Function để unregister callback
   */
  public onMarketDataReceived(callback: MarketDataCallback): () => void {
    this.marketDataCallbacks.add(callback);
    console.log('[SignalR] Registered market data callback. Total callbacks:', this.marketDataCallbacks.size);
    
    // Return unsubscribe function
    return () => {
      this.marketDataCallbacks.delete(callback);
      console.log('[SignalR] Unregistered market data callback. Remaining callbacks:', this.marketDataCallbacks.size);
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
      console.log(`[SignalR] Connection state changed: ${this.connectionState} -> ${state}`);
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
