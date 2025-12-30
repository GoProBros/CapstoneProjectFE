/**
 * Financial Report Service
 * API calls for financial data và industries
 */

import { get } from './api';
import type { FinancialData, IndustryOption, FinancialReportFilters } from '@/types/financialReport';

export interface FinancialDataResponse {
  data: FinancialData[];
  total: number;
}

/**
 * Fetch financial report data với filters
 */
export async function fetchFinancialData(filters: FinancialReportFilters): Promise<FinancialData[]> {
  // API is developing - using mockup data for now
  // Uncomment when API is ready:
  /*
  try {
    const params = new URLSearchParams();
    params.append('periodType', filters.periodType);
    if (filters.searchTicker) params.append('ticker', filters.searchTicker);
    if (filters.selectedIndustry) params.append('industry', filters.selectedIndustry);
    if (filters.yearFrom) params.append('yearFrom', filters.yearFrom.toString());
    if (filters.yearTo) params.append('yearTo', filters.yearTo.toString());

    const result = await get<FinancialDataResponse>(`/financial-reports?${params.toString()}`);
    return result.data.data;
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return getMockFinancialData(filters.searchTicker || 'FPT');
  }
  */

  // Using mockup data
  return getMockFinancialData(filters.searchTicker || 'FPT');
}

/**
 * Fetch danh sách ngành
 */
export async function fetchIndustries(): Promise<IndustryOption[]> {
  // API is developing - using mockup data for now
  // Uncomment when API is ready:
  /*
  try {
    const result = await get<{ data: IndustryOption[] }>('/industries');
    return result.data;
  } catch (error) {
    console.error('Error fetching industries:', error);
    return getMockIndustries();
  }
  */

  // Using mockup data
  return getMockIndustries();
}

/**
 * Mock data for development
 */
function getMockFinancialData(ticker: string): FinancialData[] {
  return [
    {
      ticker,
      year: 2024,
      quarter: '2024 - Q5',
      revenue: 62849,
      yearRevenueGrowth: 19.4,
      costOfGoodSold: -39150,
      grossProfit: 23698,
      operationExpense: -13190,
      operationProfit: 10508,
      yearOperationProfitGrowth: 25.3,
    },
    {
      ticker,
      year: 2023,
      quarter: '2023 - Q5',
      revenue: 52618,
      yearRevenueGrowth: 19.6,
      costOfGoodSold: -32298,
      grossProfit: 20320,
      operationExpense: -11868,
      operationProfit: 8452,
      yearOperationProfitGrowth: 22.1,
    },
    {
      ticker,
      year: 2022,
      quarter: '2022 - Q5',
      revenue: 44010,
      yearRevenueGrowth: 23.4,
      costOfGoodSold: -26842,
      grossProfit: 17167,
      operationExpense: -10373,
      operationProfit: 6794,
      yearOperationProfitGrowth: 28.7,
    },
    {
      ticker,
      year: 2021,
      quarter: '2021 - Q5',
      revenue: 35667,
      yearRevenueGrowth: 18.2,
      costOfGoodSold: -22134,
      grossProfit: 13533,
      operationExpense: -8912,
      operationProfit: 4621,
      yearOperationProfitGrowth: 15.8,
    },
    {
      ticker,
      year: 2020,
      quarter: '2020 - Q5',
      revenue: 30172,
      yearRevenueGrowth: 12.5,
      costOfGoodSold: -19245,
      grossProfit: 10927,
      operationExpense: -7834,
      operationProfit: 3093,
      yearOperationProfitGrowth: 8.9,
    },
    {
      ticker,
      year: 2019,
      quarter: '2019 - Q5',
      revenue: 26820,
      yearRevenueGrowth: 15.7,
      costOfGoodSold: -17456,
      grossProfit: 9364,
      operationExpense: -6923,
      operationProfit: 2441,
      yearOperationProfitGrowth: 12.3,
    },
    {
      ticker,
      year: 2018,
      quarter: '2018 - Q5',
      revenue: 23187,
      yearRevenueGrowth: 21.3,
      costOfGoodSold: -15678,
      grossProfit: 7509,
      operationExpense: -5834,
      operationProfit: 1675,
      yearOperationProfitGrowth: 18.7,
    },
    {
      ticker,
      year: 2017,
      quarter: '2017 - Q5',
      revenue: 19112,
      yearRevenueGrowth: 14.8,
      costOfGoodSold: -13245,
      grossProfit: 5867,
      operationExpense: -4923,
      operationProfit: 944,
      yearOperationProfitGrowth: 9.2,
    },
    {
      ticker,
      year: 2016,
      quarter: '2016 - Q5',
      revenue: 16648,
      yearRevenueGrowth: 8.9,
      costOfGoodSold: -11892,
      grossProfit: 4756,
      operationExpense: -4123,
      operationProfit: 633,
      yearOperationProfitGrowth: -5.4,
    },
    {
      ticker,
      year: 2015,
      quarter: '2015 - Q5',
      revenue: 15289,
      yearRevenueGrowth: 6.2,
      costOfGoodSold: -11234,
      grossProfit: 4055,
      operationExpense: -3892,
      operationProfit: 163,
      yearOperationProfitGrowth: -12.8,
    },
  ];
}

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
