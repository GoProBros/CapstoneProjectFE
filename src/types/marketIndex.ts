/**
 * Market Index TypeScript types
 * Mirrors GreenDragonTrading.Application.DTOs.MarketIndexDtos
 */

export interface MarketIndex {
  code: string;
  name: string;
  exchangeCode: string;
  description?: string | null;
  isBenchmark: boolean;
  status: number;
}

export interface MarketIndexSymbol {
  ticker: string;
  enCompanyName?: string | null;
  viCompanyName?: string | null;
  exchangeCode?: string | null;
  weight?: number | null;
  addedDate?: string | null;
  displayOrder: number;
}

/** Real-time snapshot of a market index from Redis / SignalR. Mirrors LiveIndexDataDto (C#). */
export interface LiveIndexData {
  code: string;
  name: string;
  indexValue: number;
  change: number;
  ratioChange: number;
  refIndex: number;
  openIndex: number;
  highIndex: number;
  lowIndex: number;
  totalTrade: number;
  totalMatchVol: number;
  totalMatchVal: number;
  advanceCount: number;
  declineCount: number;
  noChangeCount: number;
  /** Number of stocks hitting ceiling price in the basket (from SSI MI "Ceilings" field). */
  ceilingCount: number;
  /** Number of stocks hitting floor price in the basket (from SSI MI "Floors" field). */
  floorCount: number;
  exchange?: string | null;
  timestamp: string;
}

/** One point in intraday history stored in Redis. Mirrors IndexHistoryPointDto (C#). */
export interface IndexHistoryPoint {
  time: string;
  value: number;
}
