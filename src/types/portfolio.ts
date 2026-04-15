export interface PortfolioDto {
  id: number;
  userId: string;
  name: string | null;
  description: string | null;
  status: number;
  createdAt: string;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string | null;
  status: number;
}

export interface UpdatePortfolioRequest {
  id: number;
  name: string;
  description?: string | null;
  status: number;
}

export interface TradingTransactionDto {
  id: number;
  portfolioId: number;
  ticker: string;
  side: number;
  quantity: number | null;
  price: number | null;
  fee: number | null;
  tax: number | null;
  transactionDate: string;
  recordedAt: string;
  note: string | null;
  originalMessage: string | null;
}

export interface CreateTradingTransactionRequest {
  ticker: string;
  side: number;
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  transactionDate?: string;
  note?: string | null;
  originalMessage?: string | null;
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