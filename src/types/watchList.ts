/**
 * Watch List Types and Interfaces
 * Defines data structures for managing custom symbol watch lists
 */

/**
 * Watch List Summary - Used in list view
 */
export interface WatchListSummary {
  id: number;
  name: string;
  tickerCount: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Watch List Detail - Full watch list with tickers
 */
export interface WatchListDetail {
  id: number;
  name: string;
  tickers: string; // Dash-separated ticker symbols (e.g., "VNM-VCB-HPG")
  status: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Watch List Request Body
 */
export interface CreateWatchListRequest {
  name: string;
  tickers: string; // Dash-separated ticker symbols (e.g., "VNM-VCB-HPG")
}

/**
 * Update Watch List Request Body
 */
export interface UpdateWatchListRequest {
  id: number;
  name: string;
  tickers: string; // Dash-separated ticker symbols (e.g., "VNM-VCB-HPG")
}
