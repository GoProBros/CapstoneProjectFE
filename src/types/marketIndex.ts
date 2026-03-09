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
