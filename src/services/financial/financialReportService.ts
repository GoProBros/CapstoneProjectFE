/**
 * Financial Report Service
 * API calls for financial data from backend
 */

import { del, get, post, put } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type { PaginatedData } from '@/types';
import type {
  FinancialReport,
  FinancialReportFilters,
  FinancialReportIndicatorListItem,
  FinancialReportTableRow,
  FinancialPeriodType,
  FinancialReportStatus,
  FetchSpecificFinancialReportRequest,
  CreateFinancialReportRequest,
  UpdateFinancialReportRequest,
  FetchFinancialReportsListParams,
} from '@/types/financialReport';

/**
 * Convert FinancialReport to flattened table row
 * Supports all company types: Regular, Bank, Insurance, Securities
 */
function convertToTableRow(report: FinancialReport): FinancialReportTableRow {
  // Validate report structure
  if (!report || !report.reportData) {
    throw new Error('Invalid report structure: missing reportData');
  }

  const { reportData } = report;
  const { balanceSheet, incomeStatement, cashFlowStatement } = reportData;

  // Determine company type
  const isBank = !!balanceSheet?.bankAssets;
  const isInsurance = !!incomeStatement?.insuranceBusiness;
  const isSecurities = !!incomeStatement?.securitiesRevenue;

  // ========== BALANCE SHEET ==========
  
  // Calculate total assets
  let totalShortTermAssets = 0;
  let totalLongTermAssets = 0;
  let totalAssets = 0;
  
  // Regular company asset details
  let cash = 0;
  let financialInvestmentsShortTerm = 0;
  let receivablesShortTerm = 0;
  let inventories = 0;
  let otherAssetsShortTerm = 0;
  let receivablesLongTerm = 0;
  let fixedAssets = 0;
  let investmentProperty = 0;
  let longTermAssetsInProgress = 0;
  let financialInvestmentsLongTerm = 0;
  let otherAssetsLongTerm = 0;
  
  // Bank-specific assets
  let depositsAtCentralBank = 0;
  let depositsAtOtherCreditInstitutions = 0;
  let tradingSecurities = 0;
  let loansToCustomers = 0;
  let investmentSecurities = 0;
  let bankOtherAssets = 0;
  
  // Securities short-term financial assets
  let shortTermFinancialAssetsCash = 0;
  let shortTermFinancialAssetsLoans = 0;
  let shortTermFinancialAssetsOther = 0;
  
  // Securities trading and capital assets
  let heldToMaturity = 0;
  let availableForSale = 0;
  let fvtpl = 0;

  if (isBank && balanceSheet?.bankAssets) {
    // Bank assets
    depositsAtCentralBank = balanceSheet.bankAssets.depositsAtCentralBank || 0;
    depositsAtOtherCreditInstitutions = balanceSheet.bankAssets.depositsAtOtherCreditInstitutions || 0;
    tradingSecurities = balanceSheet.bankAssets.tradingSecurities || 0;
    loansToCustomers = balanceSheet.bankAssets.loansToCustomers || 0;
    investmentSecurities = balanceSheet.bankAssets.investmentSecurities || 0;
    bankOtherAssets = balanceSheet.bankAssets.otherAssets || 0;
    
    totalShortTermAssets = depositsAtCentralBank + depositsAtOtherCreditInstitutions + tradingSecurities;
    totalLongTermAssets = loansToCustomers + investmentSecurities + bankOtherAssets;
    totalAssets = totalShortTermAssets + totalLongTermAssets;
  } else {
    // Regular company assets
    if (balanceSheet?.shortTermAssets) {
      cash = balanceSheet.shortTermAssets.cash || 0;
      financialInvestmentsShortTerm = balanceSheet.shortTermAssets.financialInvestments || 0;
      receivablesShortTerm = balanceSheet.shortTermAssets.receivables || 0;
      inventories = balanceSheet.shortTermAssets.inventories || 0;
      otherAssetsShortTerm = balanceSheet.shortTermAssets.otherAssets || 0;
      totalShortTermAssets = cash + financialInvestmentsShortTerm + receivablesShortTerm + inventories + otherAssetsShortTerm;
    }
    
    if (balanceSheet?.longTermAssets) {
      receivablesLongTerm = balanceSheet.longTermAssets.receivables || 0;
      fixedAssets = balanceSheet.longTermAssets.fixedAssets || 0;
      investmentProperty = balanceSheet.longTermAssets.investmentProperty || 0;
      longTermAssetsInProgress = balanceSheet.longTermAssets.longTermAssetsInProgress || 0;
      financialInvestmentsLongTerm = balanceSheet.longTermAssets.financialInvestments || 0;
      otherAssetsLongTerm = balanceSheet.longTermAssets.otherAssets || 0;
      totalLongTermAssets = receivablesLongTerm + fixedAssets + investmentProperty + longTermAssetsInProgress + financialInvestmentsLongTerm + otherAssetsLongTerm;
    }
    
    totalAssets = totalShortTermAssets + totalLongTermAssets;
  }
  
  // Securities-specific assets
  if (balanceSheet?.shortTermFinancialAssets) {
    shortTermFinancialAssetsCash = balanceSheet.shortTermFinancialAssets.cash || 0;
    shortTermFinancialAssetsLoans = balanceSheet.shortTermFinancialAssets.loans || 0;
    shortTermFinancialAssetsOther = balanceSheet.shortTermFinancialAssets.other || 0;
  }
  
  if (balanceSheet?.tradingAndCapitalAssets) {
    heldToMaturity = balanceSheet.tradingAndCapitalAssets.heldToMaturity || 0;
    availableForSale = balanceSheet.tradingAndCapitalAssets.availableForSale || 0;
    fvtpl = balanceSheet.tradingAndCapitalAssets.fvtpl || 0;
  }

  // Liabilities and Equity
  const shortTermLiabilities = balanceSheet?.liabilities?.shortTerm || 0;
  const longTermLiabilities = balanceSheet?.liabilities?.longTerm || 0;
  const totalLiabilities = shortTermLiabilities + longTermLiabilities;
  
  const shortTermBorrowings = balanceSheet?.borrowings?.shortTermBorrowings || 0;
  const longTermBorrowings = balanceSheet?.borrowings?.longTermBorrowings || 0;
  
  const contributedCapital = balanceSheet?.equity?.contributedCapital || 0;
  const retainedEarnings = balanceSheet?.equity?.retainedEarnings || 0;
  const treasuryShares = balanceSheet?.equity?.treasuryShares || 0;
  const otherCapital = balanceSheet?.equity?.otherCapital || 0;
  const totalEquity = contributedCapital + retainedEarnings + treasuryShares + otherCapital;

  // ========== INCOME STATEMENT ==========
  
  // Regular company income fields
  let netRevenue = 0;
  let costOfGoodsSold = 0;
  let grossProfit = 0;
  let sellingExpenses = 0;
  let managementExpenses = 0;
  let financialExpenses = 0;
  let interestExpenses = 0;
  let operatingProfit = 0;
  let financialProfit = 0;
  let shareProfitOfAssociates = 0;
  let otherProfit = 0;
  let profitBeforeTax = 0;
  let corporateIncomeTax = 0;
  let minorityInterests = 0;
  let netProfit = 0;
  
  // Bank-specific income fields
  let netInterestIncome = 0;
  let serviceFeeIncome = 0;
  let tradingIncome = 0;
  let bankOtherIncome = 0;
  
  // Insurance-specific income fields
  let insuranceOperatingProfit = 0;
  let insuranceNetOperatingRevenue = 0;
  let insuranceOperatingExpenses = 0;
  
  // Securities-specific income fields
  let brokerageAndCustodyRevenue = 0;
  let lendingRevenue = 0;
  let tradingAndCapitalRevenue = 0;
  let investmentBankingRevenue = 0;
  
  // Additional profit fields
  let profitAfterTaxAndAfs = 0;
  let afsGains = 0;

  if (isBank && incomeStatement?.bankOperatingIncome) {
    // Bank income
    netInterestIncome = incomeStatement.bankOperatingIncome.netInterestIncome || 0;
    serviceFeeIncome = incomeStatement.bankOperatingIncome.serviceFeeIncome || 0;
    tradingIncome = incomeStatement.bankOperatingIncome.tradingIncome || 0;
    bankOtherIncome = incomeStatement.bankOperatingIncome.otherIncome || 0;
    
    netRevenue = netInterestIncome;
    grossProfit = netInterestIncome + serviceFeeIncome + tradingIncome + bankOtherIncome;
    operatingProfit = grossProfit;
    profitBeforeTax = incomeStatement.parentCompanyNetProfit?.profitBeforeTax || 0;
    corporateIncomeTax = incomeStatement.parentCompanyNetProfit?.corporateIncomeTax || 0;
    minorityInterests = incomeStatement.parentCompanyNetProfit?.minorityInterests || 0;
    netProfit = incomeStatement.parentCompanyNetProfit?.parentCompanyNetProfit || 0;
  } else if (isInsurance && incomeStatement?.insuranceBusiness) {
    // Insurance income
    insuranceOperatingProfit = incomeStatement.insuranceBusiness.operatingProfit || 0;
    insuranceNetOperatingRevenue = incomeStatement.insuranceBusiness.netOperatingRevenue || 0;
    insuranceOperatingExpenses = incomeStatement.insuranceBusiness.operatingExpenses || 0;
    
    netRevenue = insuranceNetOperatingRevenue;
    grossProfit = insuranceNetOperatingRevenue + insuranceOperatingExpenses; // operatingExpenses is negative
    operatingProfit = insuranceOperatingProfit;
    profitBeforeTax = incomeStatement.profitBeforeTax?.profitBeforeTax || 0;
    financialProfit = incomeStatement.profitBeforeTax?.financialProfit || 0;
    shareProfitOfAssociates = incomeStatement.profitBeforeTax?.shareProfitOfAssociatesAndJoint || 0;
    otherProfit = incomeStatement.profitBeforeTax?.otherProfit || 0;
    managementExpenses = incomeStatement.profitBeforeTax?.managementExpenses || 0;
    corporateIncomeTax = incomeStatement.parentCompanyNetProfit?.corporateIncomeTax || 0;
    minorityInterests = incomeStatement.parentCompanyNetProfit?.minorityInterests || 0;
    netProfit = incomeStatement.parentCompanyNetProfit?.parentCompanyNetProfit || 0;
  } else if (isSecurities && incomeStatement?.securitiesRevenue) {
    // Securities income
    brokerageAndCustodyRevenue = incomeStatement.securitiesRevenue.brokerageAndCustodyRevenue || 0;
    lendingRevenue = incomeStatement.securitiesRevenue.lendingRevenue || 0;
    tradingAndCapitalRevenue = incomeStatement.securitiesRevenue.tradingAndCapitalRevenue || 0;
    investmentBankingRevenue = incomeStatement.securitiesRevenue.investmentBankingRevenue || 0;
    
    netRevenue = brokerageAndCustodyRevenue + lendingRevenue + tradingAndCapitalRevenue + investmentBankingRevenue;
    grossProfit = netRevenue;
    operatingProfit = incomeStatement.profitBeforeTax?.operatingProfit || 0;
    profitBeforeTax = incomeStatement.profitBeforeTax?.profitBeforeTax || 0;
    corporateIncomeTax = incomeStatement.parentCompanyNetProfit?.corporateIncomeTax || 0;
    minorityInterests = incomeStatement.parentCompanyNetProfit?.minorityInterests || 0;
    netProfit = incomeStatement.parentCompanyNetProfit?.parentCompanyNetProfit || 0;
  } else {
    // Regular company income
    netRevenue = incomeStatement?.grossProfit?.netRevenue || 0;
    costOfGoodsSold = incomeStatement?.grossProfit?.costOfGoodsSold || 0;
    grossProfit = incomeStatement?.grossProfit?.grossProfit || 0;
    
    sellingExpenses = incomeStatement?.expenses?.sellingExpenses || 0;
    managementExpenses = incomeStatement?.expenses?.managementExpenses || 0;
    financialExpenses = incomeStatement?.expenses?.financialExpenses || 0;
    interestExpenses = incomeStatement?.expenses?.interestExpenses || 0;
    
    operatingProfit = incomeStatement?.profitBeforeTax?.operatingProfit || 0;
    financialProfit = incomeStatement?.profitBeforeTax?.financialProfit || 0;
    shareProfitOfAssociates = incomeStatement?.profitBeforeTax?.shareProfitOfAssociatesAndJoint || 0;
    otherProfit = incomeStatement?.profitBeforeTax?.otherProfit || 0;
    profitBeforeTax = incomeStatement?.profitBeforeTax?.profitBeforeTax || 0;
    
    corporateIncomeTax = incomeStatement?.parentCompanyNetProfit?.corporateIncomeTax || 0;
    minorityInterests = incomeStatement?.parentCompanyNetProfit?.minorityInterests || 0;
    netProfit = incomeStatement?.parentCompanyNetProfit?.parentCompanyNetProfit || 0;
  }
  
  // Extract profit after tax and AFS gains
  if (incomeStatement?.profitAfterTaxAndAFS) {
    profitAfterTaxAndAfs = incomeStatement.profitAfterTaxAndAFS.profitAfterTaxAndAfs || 0;
    afsGains = incomeStatement.profitAfterTaxAndAFS.afsGains || 0;
  }

  // Get period label
  const periodLabel = getPeriodLabel(report.year, report.period);

  return {
    id: report.id,
    ticker: report.ticker,
    year: report.year,
    period: report.period,
    periodLabel,

    // Balance Sheet - Summary
    totalAssets,
    totalLiabilities,
    totalEquity,
    shortTermAssets: totalShortTermAssets,
    longTermAssets: totalLongTermAssets,
    
    // Balance Sheet - Regular Company Details
    cash,
    financialInvestmentsShortTerm,
    receivablesShortTerm,
    inventories,
    otherAssetsShortTerm,
    receivablesLongTerm,
    fixedAssets,
    investmentProperty,
    longTermAssetsInProgress,
    financialInvestmentsLongTerm,
    otherAssetsLongTerm,
    
    // Balance Sheet - Bank Specific
    depositsAtCentralBank,
    depositsAtOtherCreditInstitutions,
    tradingSecurities,
    loansToCustomers,
    investmentSecurities,
    bankOtherAssets,
    
    // Balance Sheet - Securities Short-term Financial Assets
    shortTermFinancialAssetsCash,
    shortTermFinancialAssetsLoans,
    shortTermFinancialAssetsOther,
    
    // Balance Sheet - Securities Trading and Capital Assets
    heldToMaturity,
    availableForSale,
    fvtpl,
    
    // Balance Sheet - Liabilities & Equity Details
    shortTermLiabilities,
    longTermLiabilities,
    shortTermBorrowings,
    longTermBorrowings,
    contributedCapital,
    retainedEarnings,
    treasuryShares,
    otherCapital,

    // Income Statement - Regular Company
    netRevenue,
    costOfGoodsSold,
    grossProfit,
    sellingExpenses,
    managementExpenses,
    financialExpenses,
    interestExpenses,
    operatingProfit,
    financialProfit,
    shareProfitOfAssociates,
    otherProfit,
    profitBeforeTax,
    corporateIncomeTax,
    minorityInterests,
    netProfit,
    
    // Income Statement - Bank Specific
    netInterestIncome,
    serviceFeeIncome,
    tradingIncome,
    bankOtherIncome,
    
    // Income Statement - Insurance Specific
    insuranceOperatingProfit,
    insuranceNetOperatingRevenue,
    insuranceOperatingExpenses,
    
    // Income Statement - Securities Specific
    brokerageAndCustodyRevenue,
    lendingRevenue,
    tradingAndCapitalRevenue,
    investmentBankingRevenue,
    
    // Income Statement - Additional Profit Fields
    profitAfterTaxAndAfs,
    afsGains,

    // Cash Flow
    netCashFlow: cashFlowStatement?.netCashFlow || 0,
    operatingCashFlow: cashFlowStatement?.operatingActivities || 0,
    investingCashFlow: cashFlowStatement?.investingActivities || 0,
    financingCashFlow: cashFlowStatement?.financingActivities || 0,

    // Metadata
    status: report.status,
    fileUrl: report.fileUrl || '',
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

/**
 * Get period label for display
 */
function getPeriodLabel(year: number, period: FinancialPeriodType): string {
  switch (period) {
    case 1:
      return `Quý 1/${year}`;
    case 2:
      return `Quý 2/${year}`;
    case 3:
      return `Quý 3/${year}`;
    case 4:
      return `Quý 4/${year}`;
    case 5:
      return `Năm ${year}`;
    default:
      return `${year}`;
  }
}

/**
 * Fetch financial reports by single ticker
 * @param ticker - Single ticker symbol (required)
 * @returns Promise with items array and totalCount
 */
export async function fetchFinancialReportsByTicker(
  ticker: string
): Promise<{ items: FinancialReportTableRow[]; totalCount: number }> {
  try {
    const pageIndex = 1;
    const pageSize = 100;
    const status = 2; // Status 2 = Active/Published reports

    // Build query string with 4 params: Ticker, Status, PageIndex, PageSize
    const params = new URLSearchParams({
      Ticker: ticker,
      Status: status.toString(),
      PageIndex: pageIndex.toString(),
      PageSize: pageSize.toString(),
    });

    const endpoint = `${API_ENDPOINTS.FINANCIAL_REPORTS.FINANCIAL_REPORTS}?${params.toString()}`;
    const response = await get<PaginatedData<FinancialReport>>(endpoint);

    // Handle unsuccessful response
    if (!response.isSuccess) {
      console.error('API returned error:', response.message);
      return { items: [], totalCount: 0 };
    }

    // Handle empty or null data
    if (!response.data || !response.data.items || !Array.isArray(response.data.items)) {
      return { items: [], totalCount: 0 };
    }

    // Convert to table rows with error handling
    const items = response.data.items
      .map((report, index) => {
        try {
          return convertToTableRow(report);
        } catch (err) {
          console.error(`Error converting report at index ${index}:`, err);
          return null;
        }
      })
      .filter((item): item is FinancialReportTableRow => item !== null);

    const totalCount = response.data.totalCount || items.length;

    return { items, totalCount };
  } catch (error) {
    console.error(`Error fetching financial reports for ${ticker}:`, error);
    return { items: [], totalCount: 0 };
  }
}

/**
 * Fetch financial report indicators by single ticker
 * @param ticker - Single ticker symbol (required)
 * @returns Promise with indicator items array and totalCount
 */
export async function fetchFinancialReportIndicatorsByTicker(
  ticker: string
): Promise<{ items: FinancialReportIndicatorListItem[]; totalCount: number }> {
  try {
    const pageIndex = 1;
    const pageSize = 100;
    const status = 2;

    const params = new URLSearchParams({
      Ticker: ticker,
      Status: status.toString(),
      PageIndex: pageIndex.toString(),
      PageSize: pageSize.toString(),
    });

    const endpoint = `${API_ENDPOINTS.FINANCIAL_REPORTS.INDICATORS}?${params.toString()}`;
    const response = await get<PaginatedData<FinancialReportIndicatorListItem>>(endpoint);

    if (!response.isSuccess) {
      console.error('Indicators API returned error:', response.message);
      return { items: [], totalCount: 0 };
    }

    if (!response.data || !response.data.items || !Array.isArray(response.data.items)) {
      return { items: [], totalCount: 0 };
    }

    const items = response.data.items;
    const totalCount = response.data.totalCount || items.length;

    return { items, totalCount };
  } catch (error) {
    console.error(`Error fetching financial report indicators for ${ticker}:`, error);
    return { items: [], totalCount: 0 };
  }
}

/**
 * Fetch paginated financial reports for dashboard listing
 * @param pageIndex - Page index (1-based)
 * @param pageSize - Number of records per page
 */
export async function fetchRecentFinancialReports(
  pageIndex: number = 1,
  pageSize: number = 5
): Promise<PaginatedData<FinancialReport>> {
  const response = await fetchFinancialReportsList({ pageIndex, pageSize });

  return response;
}

/**
 * Fetch financial reports with optional filters.
 * Query params follow backend naming: PageIndex, PageSize, Period, Status, Year.
 */
export async function fetchFinancialReportsList(
  filters: FetchFinancialReportsListParams = {}
): Promise<PaginatedData<FinancialReport>> {
  const params = new URLSearchParams({
    PageIndex: (filters.pageIndex ?? 1).toString(),
    PageSize: (filters.pageSize ?? 10).toString(),
  });

  if (typeof filters.period === 'number') {
    params.set('Period', filters.period.toString());
  }

  if (typeof filters.status === 'number') {
    params.set('Status', filters.status.toString());
  }

  if (typeof filters.year === 'number') {
    params.set('Year', filters.year.toString());
  }

  const endpoint = `${API_ENDPOINTS.FINANCIAL_REPORTS.FINANCIAL_REPORTS}?${params.toString()}`;
  const response = await get<PaginatedData<FinancialReport>>(endpoint);

  if (!response.isSuccess || !response.data) {
    throw new Error(response.message || 'Không thể tải dữ liệu báo cáo tài chính');
  }

  return response.data;
}

/**
 * Fetch financial report detail by id.
 */
export async function fetchFinancialReportById(
  reportId: string
): Promise<FinancialReport> {
  const response = await get<FinancialReport>(
    API_ENDPOINTS.FINANCIAL_REPORTS.BY_ID(reportId)
  );

  if (!response.isSuccess || !response.data) {
    throw new Error(response.message || 'Không thể tải chi tiết báo cáo tài chính');
  }

  return response.data;
}

/**
 * Fetch financial report data from DNSE for a specific ticker and period.
 */
export async function fetchSpecificFinancialReportData(
  payload: FetchSpecificFinancialReportRequest
): Promise<Record<string, unknown>> {
  const response = await post<Record<string, unknown>>(
    API_ENDPOINTS.DATA_FETCHING.FINANCIAL_REPORT_SPECIFIC,
    {
      ticker: payload.ticker,
      year: payload.year,
      quarter: payload.quarter,
    }
  );

  if (!response.isSuccess || !response.data) {
    throw new Error(response.message || 'Không thể lấy dữ liệu báo cáo tài chính');
  }

  return response.data;
}

/**
 * Create financial report from edited data.
 */
export async function createFinancialReport(
  payload: CreateFinancialReportRequest
): Promise<FinancialReport> {
  const requestBody = {
    ticker: payload.ticker,
    year: payload.year,
    period: payload.period,
    reportData: payload.reportData,
  };

  const response = await post<FinancialReport>(
    API_ENDPOINTS.FINANCIAL_REPORTS.FINANCIAL_REPORTS,
    requestBody
  );

  if (!response.isSuccess || !response.data) {
    throw new Error(response.message || 'Không thể tạo báo cáo tài chính');
  }

  return response.data;
}

/**
 * Update financial report by id.
 */
export async function updateFinancialReport(
  reportId: string,
  payload: UpdateFinancialReportRequest
): Promise<FinancialReport> {
  const response = await put<FinancialReport>(
    API_ENDPOINTS.FINANCIAL_REPORTS.BY_ID(reportId),
    payload
  );

  if (!response.isSuccess || !response.data) {
    throw new Error(response.message || 'Không thể cập nhật báo cáo tài chính');
  }

  return response.data;
}

/**
 * Delete financial report by id.
 */
export async function deleteFinancialReport(
  reportId: string
): Promise<void> {
  const response = await del<null>(
    API_ENDPOINTS.FINANCIAL_REPORTS.BY_ID(reportId)
  );

  if (!response.isSuccess) {
    throw new Error(response.message || 'Không thể xóa báo cáo tài chính');
  }
}
