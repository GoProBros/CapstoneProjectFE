/**
 * Financial Report Types & Interfaces
 * Matching backend API response structure
 */

// ===========================
// Enums matching backend
// ===========================

/**
 * Period type for financial reports
 * 1 = quý 1, 2 = quý 2, 3 = quý 3, 4 = quý 4, 5 = lũy kế cả năm
 */
export enum FinancialPeriodType {
  FirstQuarter = 1,
  SecondQuarter = 2,
  ThirdQuarter = 3,
  FourthQuarter = 4,
  YearToDate = 5,
}

/**
 * Status of financial report
 */
export enum FinancialReportStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  Failed = 3,
  Archived = 4,
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
  status?: FinancialReportStatus;
  pageIndex?: number;
  pageSize?: number;
  sectorId?: string; // For fetching reports by sector
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
 * Supports all company types: Regular, Bank, Insurance, Securities
 */
export interface FinancialReportTableRow {
  id: string;
  ticker: string;
  year: number;
  period: FinancialPeriodType;
  periodLabel: string;
  
  // Balance Sheet - Summary
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  shortTermAssets: number;
  longTermAssets: number;
  
  // Balance Sheet - Regular Company Details
  cash?: number;
  financialInvestmentsShortTerm?: number;
  receivablesShortTerm?: number;
  inventories?: number;
  otherAssetsShortTerm?: number;
  receivablesLongTerm?: number;
  fixedAssets?: number;
  investmentProperty?: number;
  longTermAssetsInProgress?: number;
  financialInvestmentsLongTerm?: number;
  otherAssetsLongTerm?: number;
  
  // Balance Sheet - Bank Specific
  depositsAtCentralBank?: number;
  depositsAtOtherCreditInstitutions?: number;
  tradingSecurities?: number;
  loansToCustomers?: number;
  investmentSecurities?: number;
  bankOtherAssets?: number;
  
  // Balance Sheet - Securities Short-term Financial Assets
  shortTermFinancialAssetsCash?: number;
  shortTermFinancialAssetsLoans?: number;
  shortTermFinancialAssetsOther?: number;
  
  // Balance Sheet - Securities Trading and Capital Assets
  heldToMaturity?: number;
  availableForSale?: number;
  fvtpl?: number;
  
  // Balance Sheet - Liabilities & Equity Details
  shortTermLiabilities?: number;
  longTermLiabilities?: number;
  shortTermBorrowings?: number;
  longTermBorrowings?: number;
  contributedCapital?: number;
  retainedEarnings?: number;
  treasuryShares?: number;
  otherCapital?: number;
  
  // Income Statement - Regular Company
  netRevenue?: number;
  costOfGoodsSold?: number;
  grossProfit?: number;
  sellingExpenses?: number;
  managementExpenses?: number;
  financialExpenses?: number;
  interestExpenses?: number;
  operatingProfit?: number;
  financialProfit?: number;
  shareProfitOfAssociates?: number;
  otherProfit?: number;
  profitBeforeTax: number;
  corporateIncomeTax?: number;
  minorityInterests?: number;
  netProfit: number;
  
  // Income Statement - Bank Specific
  netInterestIncome?: number;
  serviceFeeIncome?: number;
  tradingIncome?: number;
  bankOtherIncome?: number;
  
  // Income Statement - Insurance Specific
  insuranceOperatingProfit?: number;
  insuranceNetOperatingRevenue?: number;
  insuranceOperatingExpenses?: number;
  
  // Income Statement - Securities Specific
  brokerageAndCustodyRevenue?: number;
  lendingRevenue?: number;
  tradingAndCapitalRevenue?: number;
  investmentBankingRevenue?: number;
  
  // Income Statement - Additional Profit Fields
  profitAfterTaxAndAfs?: number;
  afsGains?: number;
  
  // Cash Flow
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
