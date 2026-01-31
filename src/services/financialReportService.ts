/**
 * Financial Report Service
 * API calls for financial data from backend
 */

import { get } from './api';
import type { ApiResponse, PaginatedResponse } from '@/types';
import type {
  FinancialReport,
  FinancialReportFilters,
  FinancialReportQueryParams,
  FinancialReportTableRow,
  FinancialPeriodType,
  IndustryOption,
} from '@/types/financialReport';

/**
 * Convert FinancialReport to flattened table row
 */
function convertToTableRow(report: FinancialReport): FinancialReportTableRow {
  // Validate report structure
  if (!report || !report.reportData) {
    throw new Error('Invalid report structure: missing reportData');
  }

  const { reportData } = report;
  const { balanceSheet, incomeStatement, cashFlowStatement } = reportData;

  // Calculate total assets with null safety
  const totalShortTermAssets = balanceSheet?.shortTermAssets 
    ? Object.values(balanceSheet.shortTermAssets).reduce((sum, val) => sum + (val || 0), 0)
    : 0;
  const totalLongTermAssets = balanceSheet?.longTermAssets
    ? Object.values(balanceSheet.longTermAssets).reduce((sum, val) => sum + (val || 0), 0)
    : 0;
  const totalAssets = totalShortTermAssets + totalLongTermAssets;

  // Calculate total liabilities and equity with null safety
  const totalLiabilities = (balanceSheet?.liabilities?.shortTerm || 0) + (balanceSheet?.liabilities?.longTerm || 0);
  const totalEquity = balanceSheet?.equity
    ? Object.values(balanceSheet.equity).reduce((sum, val) => sum + (val || 0), 0)
    : 0;

  // Get period label
  const periodLabel = getPeriodLabel(report.year, report.period);

  return {
    id: report.id,
    ticker: report.ticker,
    year: report.year,
    period: report.period,
    periodLabel,

    // Balance Sheet
    totalAssets,
    totalLiabilities,
    totalEquity,
    shortTermAssets: totalShortTermAssets,
    longTermAssets: totalLongTermAssets,

    // Income Statement with null safety
    netRevenue: incomeStatement?.grossProfit?.netRevenue || 0,
    grossProfit: incomeStatement?.grossProfit?.grossProfit || 0,
    operatingProfit: incomeStatement?.profitBeforeTax?.operatingProfit || 0,
    profitBeforeTax: incomeStatement?.profitBeforeTax?.profitBeforeTax || 0,
    netProfit: incomeStatement?.parentCompanyNetProfit?.parentCompanyNetProfit || 0,

    // Cash Flow with null safety
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
 * Note: For quarterly reports, the API should provide quarter number in additional field
 * Current implementation shows only year for quarterly to avoid incorrect quarter display
 */
function getPeriodLabel(year: number, period: FinancialPeriodType): string {
  switch (period) {
    case 1: // Yearly
      return `${year}`;
    case 2: // Quarterly
      // TODO: Backend should provide quarter number (1-4) in the response
      return `${year} - Quý`; // Temporary: show "Quý" without number
    case 3: // Cumulative
      return `${year} - Lũy kế`;
    default:
      return `${year}`;
  }
}

/**
 * Fetch financial reports with filters and pagination
 * @returns Promise with items array and totalCount, or empty result on error
 */
export async function fetchFinancialReports(
  filters: FinancialReportFilters = {}
): Promise<{ items: FinancialReportTableRow[]; totalCount: number }> {
  try {
    // Build query parameters
    const params: FinancialReportQueryParams = {};
    if (filters.ticker) params.ticker = filters.ticker;
    if (filters.year) params.year = filters.year;
    if (filters.period !== undefined) params.period = filters.period;
    if (filters.status !== undefined) params.status = filters.status;
    if (filters.pageIndex !== undefined) params.pageIndex = filters.pageIndex;
    if (filters.pageSize !== undefined) params.pageSize = filters.pageSize;

    // Build query string
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    // Call API
    const endpoint = `/financial-reports${queryString ? `?${queryString}` : ''}`;
    const response = await get<PaginatedResponse<FinancialReport>>(endpoint);

    // Handle unsuccessful response
    if (!response.isSuccess) {
      console.error('API returned error:', response.message);
      return { items: [], totalCount: 0 };
    }

    // Handle empty or null data
    if (!response.data || !Array.isArray(response.data)) {
      return { items: [], totalCount: 0 };
    }

    // Convert to table rows with error handling per item
    const items = response.data
      .map((report, index) => {
        try {
          return convertToTableRow(report);
        } catch (err) {
          console.error(`Error converting report at index ${index} (id: ${report?.id || 'unknown'}):`, err);
          return null;
        }
      })
      .filter((item): item is FinancialReportTableRow => item !== null);

    const totalCount = response.pagination?.total || items.length;

    return { items, totalCount };
  } catch (error) {
    console.error('Error fetching financial reports:', error);
    // Return empty result instead of throwing to prevent app crash
    return { items: [], totalCount: 0 };
  }
}

/**
 * Fetch single financial report by ID
 * @returns FinancialReport object or null if not found/error
 */
export async function fetchFinancialReportById(id: string): Promise<FinancialReport | null> {
  try {
    // Type guard and validation
    if (typeof id !== 'string' || !id.trim()) {
      console.error('Invalid report ID provided:', id);
      return null;
    }

    const response = await get<ApiResponse<FinancialReport>>(`/financial-reports/${id}`);

    if (!response.isSuccess) {
      console.error('Failed to fetch financial report:', response.message);
      return null;
    }

    if (!response.data) {
      console.warn(`No data found for report ID: ${id}`);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching financial report:', error);
    return null;
  }
}

/**
 * Fetch financial report by ticker, year, and period
 * @returns FinancialReport object or null if not found/error
 */
export async function fetchFinancialReportByParams(
  ticker: string,
  year: number,
  period: FinancialPeriodType
): Promise<FinancialReport | null> {
  try {
    // Type guards and input validation
    if (typeof ticker !== 'string' || !ticker.trim()) {
      console.error('Invalid ticker provided:', ticker);
      return null;
    }

    if (typeof year !== 'number' || !Number.isInteger(year) || year < 1900 || year > 2100) {
      console.error('Invalid year provided:', year);
      return null;
    }

    if (typeof period !== 'number' || ![1, 2, 3].includes(period)) {
      console.error('Invalid period type provided:', period);
      return null;
    }

    // Encode ticker for URL path
    const encodedTicker = encodeURIComponent(ticker.trim());
    
    const response = await get<ApiResponse<FinancialReport>>(
      `/financial-reports/ticker/${encodedTicker}/year/${year}/period/${period}`
    );

    if (!response.isSuccess) {
      console.warn(`Report not found for ${ticker} ${year} period ${period}:`, response.message);
      return null;
    }

    if (!response.data) {
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching financial report by params:', error);
    return null;
  }
}

/**
 * Fetch available years for a ticker
 * @returns Array of years or empty array if not found/error
 */
export async function fetchAvailableYears(ticker?: string): Promise<number[]> {
  try {
    // Build endpoint with optional ticker
    const endpoint = ticker?.trim() 
      ? `/financial-reports/years?ticker=${encodeURIComponent(ticker.trim())}` 
      : '/financial-reports/years';
    
    const response = await get<ApiResponse<number[]>>(endpoint);

    if (!response.isSuccess) {
      console.error('Failed to fetch available years:', response.message);
      return [];
    }

    if (!response.data || !Array.isArray(response.data)) {
      return [];
    }

    // Filter valid years and sort descending
    const validYears = response.data
      .filter((year) => typeof year === 'number' && year >= 1900 && year <= 2100)
      .sort((a, b) => b - a);

    return validYears;
  } catch (error) {
    console.error('Error fetching available years:', error);
    return [];
  }
}

/**
 * Fetch list of industries (sectors)
 * @returns Array of industry options, always returns at least mock data
 * TODO: Update endpoint when sectors API is ready
 */
export async function fetchIndustries(): Promise<IndustryOption[]> {
  try {
    // TODO: Replace with actual sectors endpoint when ready
    // const response = await get<ApiResponse<IndustryOption[]>>('/sectors');
    // if (response.isSuccess && Array.isArray(response.data) && response.data.length > 0) {
    //   return response.data;
    // }

    // Using mock data until sectors API is ready
    return getMockIndustries();
  } catch (error) {
    console.error('Error fetching industries:', error);
    // Always return mock data as fallback to ensure UI works
    return getMockIndustries();
  }
}

/**
 * Mock industries data
 */
function getMockIndustries(): IndustryOption[] {
  return [
    { value: 'oil-gas', label: 'Sản xuất dầu khí' },
    { value: 'oil-equipment', label: 'Thiết bị, dịch vụ và phân phối dầu khí' },
    { value: 'renewable', label: 'Năng lượng thay thế' },
    { value: 'chemicals', label: 'Hóa chất' },
    { value: 'forestry', label: 'Lâm nghiệp và giấy' },
    { value: 'metals', label: 'Kim loại công nghiệp' },
    { value: 'mining', label: 'Khai khoáng' },
    { value: 'construction', label: 'Xây dựng và vật liệu xây dựng' },
    { value: 'banking', label: 'Ngân hàng' },
    { value: 'insurance', label: 'Bảo hiểm' },
    { value: 'securities', label: 'Công ty Chứng khoán' },
    { value: 'software', label: 'Phần mềm và dịch vụ điện toán' },
    { value: 'hardware', label: 'Công nghệ phần cứng và thiết bị' },
  ];
}
