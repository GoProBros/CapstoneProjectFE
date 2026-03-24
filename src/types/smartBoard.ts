/**
 * Smart Market Board Types
 */

import type { ExchangeCode } from '@/types/symbol';
import type { Sector } from '@/types/sector';

/** Volume filter period options */
export type VolumePeriod = '1d' | '7d' | '30d';

/** Filter state for the Smart Market Board */
export interface SmartBoardFilters {
  exchange: ExchangeCode | null;
  sector: Sector | null;
  /** If set, only show tickers with avg daily vol >= volumeThreshold */
  volumeThreshold: number | null;
  volumePeriod: VolumePeriod;
  /** If set, restrict displayed tickers to those in this watchlist */
  watchlistId: number | null;
  /** If true, hide tickers with volume === 0 (not yet traded today) */
  hideNoTrading: boolean;
}

/** Average daily volume for one ticker (from backend) */
export interface TickerAvgVolumeDto {
  ticker: string;
  avgDailyVolume: number;
}
