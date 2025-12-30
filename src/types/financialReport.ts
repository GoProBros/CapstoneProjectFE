/**
 * Financial Report Types & Interfaces
 */

export type PeriodType = '1' | '0'; // '1' = Năm, '0' = Quý

export interface FinancialData {
  ticker: string;
  year: number;
  quarter: string;
  revenue: number;
  yearRevenueGrowth: number;
  costOfGoodSold: number;
  grossProfit: number;
  operationExpense: number;
  operationProfit: number;
  yearOperationProfitGrowth: number;
}

export interface IndustryOption {
  value: string;
  label: string;
}

export interface FinancialReportFilters {
  periodType: PeriodType;
  searchTicker?: string;
  selectedIndustry?: string;
  yearFrom?: number;
  yearTo?: number;
}

export interface LayoutConfig {
  name: string;
  columns: string[];
  filters?: Record<string, any>;
}

export interface FilterConfig {
  name: string;
  criteria: Record<string, any>;
}
