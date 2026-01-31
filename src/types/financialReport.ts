/**
 * Financial Report Types & Interfaces
 * Matching backend API response structure
 */

// ===========================
// Enums matching backend
// ===========================

/**
 * Period type for financial reports
 * 1 = Yearly (Năm), 2 = Quarterly (Quý), 3 = Cumulative (Lũy kế)
 */
export enum FinancialPeriodType {
  Yearly = 1,
  Quarterly = 2,
  Cumulative = 3,
}

/**
 * Status of financial report
 */
export enum FinancialReportStatus {
  Draft = 0,
  Published = 1,
  Archived = 2,
}

// ===========================
// Balance Sheet Types
// ===========================

export interface ShortTermAssets {
  cash: number;
  financialInvestments: number;
  receivables: number;
  inventories: number;
  otherAssets: number;
}

export interface LongTermAssets {
  receivables: number;
  fixedAssets: number;
  investmentProperty: number;
  longTermAssetsInProgress: number;
  financialInvestments: number;
  otherAssets: number;
}

export interface BankAssets {
  depositsAtCentralBank: number;
  depositsAtOtherCreditInstitutions: number;
  tradingSecurities: number;
  loansToCustomers: number;
  investmentSecurities: number;
  otherAssets: number;
}

export interface ShortTermFinancialAssets {
  cash: number;
  loans: number;
  other: number;
}

export interface TradingAndCapitalAssets {
  heldToMaturity: number;
  availableForSale: number;
  fvtpl: number; // Fair Value Through Profit or Loss
}

export interface Liabilities {
  shortTerm: number;
  longTerm: number;
}

export interface Borrowings {
  shortTermBorrowings: number;
  longTermBorrowings: number;
}

export interface Equity {
  contributedCapital: number;
  retainedEarnings: number;
  treasuryShares: number;
  otherCapital: number;
}

export interface BalanceSheet {
  shortTermAssets: ShortTermAssets;
  longTermAssets: LongTermAssets;
  bankAssets: BankAssets;
  shortTermFinancialAssets: ShortTermFinancialAssets;
  tradingAndCapitalAssets: TradingAndCapitalAssets;
  liabilities: Liabilities;
  borrowings: Borrowings;
  equity: Equity;
}

// ===========================
// Income Statement Types
// ===========================

export interface BankOperatingIncome {
  netInterestIncome: number;
  serviceFeeIncome: number;
  tradingIncome: number;
  otherIncome: number;
}

export interface InsuranceBusiness {
  operatingProfit: number;
  netOperatingRevenue: number;
  operatingExpenses: number;
}

export interface SecuritiesRevenue {
  brokerageAndCustodyRevenue: number;
  lendingRevenue: number;
  tradingAndCapitalRevenue: number;
  investmentBankingRevenue: number;
}

export interface GrossProfit {
  grossProfit: number;
  netRevenue: number;
  costOfGoodsSold: number;
}

export interface Expenses {
  costOfGoodsSold: number;
  interestExpenses: number;
  sellingExpenses: number;
  financialExpenses: number;
  managementExpenses: number;
}

export interface ProfitBeforeTax {
  profitBeforeTax: number;
  operatingProfit: number;
  financialProfit: number;
  shareProfitOfAssociatesAndJoint: number;
  otherProfit: number;
  managementExpenses: number;
}

export interface ProfitAfterTaxAndAFS {
  profitAfterTaxAndAfs: number;
  parentCompanyNetProfit: number;
  afsGains: number; // Available-for-Sale Gains
}

export interface ParentCompanyNetProfit {
  parentCompanyNetProfit: number;
  profitBeforeTax: number;
  corporateIncomeTax: number;
  minorityInterests: number;
}

export interface IncomeStatement {
  bankOperatingIncome: BankOperatingIncome;
  insuranceBusiness: InsuranceBusiness;
  securitiesRevenue: SecuritiesRevenue;
  grossProfit: GrossProfit;
  expenses: Expenses;
  profitBeforeTax: ProfitBeforeTax;
  profitAfterTaxAndAFS: ProfitAfterTaxAndAFS;
  parentCompanyNetProfit: ParentCompanyNetProfit;
}

// ===========================
// Cash Flow Statement Types
// ===========================

export interface CashFlowStatement {
  netCashFlow: number;
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
}

// ===========================
// Main Report Data Types
// ===========================

export interface ReportData {
  balanceSheet: BalanceSheet;
  incomeStatement: IncomeStatement;
  cashFlowStatement: CashFlowStatement;
}

export interface FinancialReport {
  id: string;
  ticker: string;
  year: number;
  period: FinancialPeriodType;
  reportData: ReportData;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  status: FinancialReportStatus;
  createdAt: string;
  updatedAt: string;
}

// ===========================
// API Request/Response Types
// ===========================

export interface FinancialReportFilters {
  ticker?: string;
  year?: number;
  period?: FinancialPeriodType;
  status?: FinancialReportStatus;
  pageIndex?: number;
  pageSize?: number;
}

export interface FinancialReportQueryParams {
  ticker?: string;
  year?: number;
  period?: number;
  status?: number;
  pageIndex?: number;
  pageSize?: number;
}

// ===========================
// UI Helper Types
// ===========================

export interface IndustryOption {
  value: string;
  label: string;
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

// ===========================
// Display Types for Tables
// ===========================

/**
 * Flattened view for table display
 */
export interface FinancialReportTableRow {
  id: string;
  ticker: string;
  year: number;
  period: FinancialPeriodType;
  periodLabel: string;
  
  // Balance Sheet - Key Metrics
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  shortTermAssets: number;
  longTermAssets: number;
  
  // Income Statement - Key Metrics
  netRevenue: number;
  grossProfit: number;
  operatingProfit: number;
  profitBeforeTax: number;
  netProfit: number;
  
  // Cash Flow - Key Metrics
  netCashFlow: number;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  
  // Metadata
  status: FinancialReportStatus;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
}
