export interface PortfolioDto {
  id: number;
  userId: string;
  name: string | null;
  description: string | null;
  status: number;
  createdAt: string;
  ticker: string;
  availableCapital: number;
  summary: PortfolioSummaryDto;
  historyPerformance: PortfolioHistoryPerformanceDto;
  overall: PortfolioOverallDto;
  transactionHistory: PortfolioTransactionHistoryItemDto[];
}

export interface PortfolioSummaryDto {
  remainingQuantity: number;
  averagePrice: number;
  currentPrice: number;
  holdingValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface PortfolioHistoryPerformanceDto {
  totalBuyQuantity: number;
  totalSellQuantity: number;
  realizedPnL: number;
  lastTradeDate: string | null;
}

export interface PortfolioOverallDto {
  totalPnL: number;
}

export interface PortfolioTransactionHistoryItemDto {
  transactionDate: string;
  side: TransactionSideValue;
  sideDisplayName: string;
  quantity: number;
  price: number;
  totalValue: number;
  note: string | null;
}

export interface CreatePortfolioRequest {
  ticker: string;
  name?: string | null;
  description?: string | null;
  status: number;
}

export interface UpdatePortfolioRequest {
  id: number;
  ticker: string;
  name: string;
  description: string;
  status: number;
}

export interface TradingTransactionDto {
  id: number;
  portfolioId: number;
  ticker: string;
  side: TransactionSideValue;
  quantity: number | null;
  price: number | null;
  transactionDate: string;
  recordedAt: string;
  note: string | null;
  originalMessage: string | null;
}

export interface CreateTradingTransactionRequest {
  side: TransactionSideValue;
  quantity: number;
  price: number;
  transactionDate?: string;
  note?: string | null;
  originalMessage?: string | null;
}

export interface UpdateInvestmentCapitalRequest {
  investmentCapital: number;
}

export interface UserInvestmentCapitalDto {
  userId: string;
  availableCapital: number;
}

export const PortfolioStatusType = {
  Inactive: 0,
  Active: 1,
} as const;

export type PortfolioStatusValue =
  (typeof PortfolioStatusType)[keyof typeof PortfolioStatusType];

export const TransactionSideType = {
  Buy: 1,
  Sell: 2,
} as const;

export type TransactionSideValue =
  (typeof TransactionSideType)[keyof typeof TransactionSideType];

export const PortfolioOverallFilterType = {
  Profit: 1,
  Loss: 2,
} as const;

export type PortfolioOverallFilterValue =
  (typeof PortfolioOverallFilterType)[keyof typeof PortfolioOverallFilterType];