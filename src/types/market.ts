/**
 * Market Data Types - Matching backend DTOs
 * These types correspond to the MarketSymbolDto from the .NET backend
 */

/**
 * Real-time market data for a single stock symbol
 * Received from SignalR Hub: /hubs/marketdata
 * Data is stored in Redis with key format: "market:symbol:{TICKER}"
 */
export interface MarketSymbolDto {
  /** Stock ticker/symbol (e.g., "VNM", "HPG", "VCB") */
  ticker: string;
  
  /** Giá trần - Maximum allowed price for the day */
  ceilingPrice: number;
  
  /** Giá sàn - Minimum allowed price for the day */
  floorPrice: number;
  
  /** Giá tham chiếu - Reference price from previous session */
  referencePrice: number;
  
  /** Giá bán 1 - Best ask price (level 1) */
  askPrice1: number;
  
  /** Khối lượng bán 1 - Best ask volume (level 1) */
  askVol1: number;
  
  /** Giá bán 2 - Second best ask price (level 2) */
  askPrice2: number;
  
  /** Khối lượng bán 2 - Second best ask volume (level 2) */
  askVol2: number;
  
  /** Giá bán 3 - Third best ask price (level 3) */
  askPrice3: number;
  
  /** Khối lượng bán 3 - Third best ask volume (level 3) */
  askVol3: number;
  
  /** Giá khớp lệnh cuối - Last matched price */
  lastPrice: number;
  
  /** Khối lượng khớp lệnh cuối - Last matched volume */
  lastVol: number;
  
  /** Thay đổi giá - Price change from reference (absolute value) */
  change: number;
  
  /** Tỷ lệ thay đổi - Price change percentage (e.g., 0.025 = +2.5%) */
  ratioChange: number;
  
  /** Giá mua 1 - Best bid price (level 1) */
  bidPrice1: number;
  
  /** Khối lượng mua 1 - Best bid volume (level 1) */
  bidVol1: number;
  
  /** Giá mua 2 - Second best bid price (level 2) */
  bidPrice2: number;
  
  /** Khối lượng mua 2 - Second best bid volume (level 2) */
  bidVol2: number;
  
  /** Giá mua 3 - Third best bid price (level 3) */
  bidPrice3: number;
  
  /** Khối lượng mua 3 - Third best bid volume (level 3) */
  bidVol3: number;
  
  /** Tổng giá trị giao dịch - Total trading value in VND */
  totalVal: number;
  
  /** Tổng khối lượng giao dịch - Total trading volume */
  totalVol: number;
  
  /** Giá cao nhất trong ngày - Highest price of the session */
  highest: number;
  
  /** Giá thấp nhất trong ngày - Lowest price of the session */
  lowest: number;
  
  /** Chiều giao dịch - Trade side ("B" = Buy, "S" = Sell, "N" = Neutral) */
  side: string;
  
  /** Giá bình quân - Average trading price */
  avgPrice: number;
  
  /** Giá trị phiên trước - Prior session value */
  priorVal: number;
  
  /** Phiên giao dịch - Trading session (e.g., "ATO", "LO", "ATC") */
  tradingSession?: string;
  
  /** Trạng thái giao dịch - Trading status (e.g., "Active", "Halted", "Suspended") */
  tradingStatus?: string;
}

/**
 * SignalR connection states
 */
export enum ConnectionState {
  /** Chưa kết nối */
  Disconnected = "Disconnected",
  
  /** Đang kết nối */
  Connecting = "Connecting",
  
  /** Đã kết nối */
  Connected = "Connected",
  
  /** Đang kết nối lại sau khi mất kết nối */
  Reconnecting = "Reconnecting",
  
  /** Kết nối bị lỗi */
  Error = "Error"
}

/**
 * SignalR Hub methods available on the server
 */
export interface IMarketDataHub {
  /** Subscribe to specific stock symbols */
  subscribeToSymbols: (symbols: string[]) => Promise<void>;
  
  /** Unsubscribe from specific stock symbols */
  unsubscribeFromSymbols: (symbols: string[]) => Promise<void>;
  
  /** Subscribe to all market data (use with caution) */
  subscribeToAll: () => Promise<void>;
  
  /** Unsubscribe from all market data */
  unsubscribeFromAll: () => Promise<void>;
}

/**
 * SignalR client methods (callbacks from server)
 */
export interface IMarketDataClient {
  /** Callback when receiving market data updates */
  receiveMarketData: (data: MarketSymbolDto) => void;
}
