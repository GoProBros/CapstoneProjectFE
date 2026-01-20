/**
 * Heatmap Types
 * TypeScript interfaces for market heatmap data
 */

/**
 * Color types for heatmap cells based on change percent
 */
export type HeatmapColorType =
  | 'ceiling'       // >= +6.5% (Purple - Trần)
  | 'strong-up'     // >= +3.0% (Dark Green)
  | 'up'            // >= +1.0% (Light Green)
  | 'neutral'       // -1% to +1% (Yellow)
  | 'down'          // >= -3.0% (Light Red)
  | 'strong-down'   // >= -6.5% (Dark Red)
  | 'floor';        // < -6.5% (Cyan - Sàn)

/**
 * Individual heatmap cell item representing one stock symbol
 */
export interface HeatmapItem {
  /** Stock ticker symbol (e.g., VNM, VIC, HPG) */
  ticker: string;

  /** Company name */
  companyName: string;

  /** Current price */
  currentPrice: number;

  /** Change percent from reference price */
  changePercent: number;

  /** Change value (current - reference) */
  changeValue: number;

  /** Trading volume */
  volume: number;

  /** Market capitalization (optional) */
  marketCap?: number;

  /** Exchange code (HSX, HNX, UPCOM) */
  exchange: string;

  /** Sector ID */
  sector?: string;

  /** Sector name (Vietnamese) */
  sectorName?: string;

  /** Color type for rendering */
  colorType: HeatmapColorType;

  /** Last update timestamp */
  lastUpdate: string;
}

/**
 * Complete heatmap data with metadata
 */
export interface HeatmapData {
  /** Exchange filter applied */
  exchange?: string;

  /** Sector filter applied */
  sector?: string;

  /** List of heatmap items */
  items: HeatmapItem[];

  /** Timestamp of data snapshot */
  timestamp: string;

  /** Total count of items */
  totalCount: number;
}

/**
 * Heatmap filter options
 */
export interface HeatmapFilters {
  exchange?: string;
  sector?: string;
}

/**
 * Heatmap cell click event handler
 */
export type HeatmapCellClickHandler = (ticker: string) => void;

/**
 * Sort options for heatmap
 */
export type HeatmapSortBy = 
  | 'ticker' 
  | 'change-percent' 
  | 'volume' 
  | 'market-cap';

export type HeatmapSortOrder = 'asc' | 'desc';

/**
 * Heatmap settings
 */
export interface HeatmapSettings {
  sortBy: HeatmapSortBy;
  sortOrder: HeatmapSortOrder;
  showVolume: boolean;
  showMarketCap: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
}
