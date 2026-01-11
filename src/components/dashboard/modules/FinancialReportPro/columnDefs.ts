/**
 * AG Grid Column Definitions
 * Configuration cho Financial Report table
 */

import type { ColDef, ColGroupDef } from 'ag-grid-community';
import type { FinancialData } from '@/types/financialReport';

/**
 * Format number với dấu phân cách
 */
export const formatNumber = (num: number): string => {
  if (num == null || num === 0) return '';
  return num.toLocaleString('en-US');
};

/**
 * Format percentage
 */
export const formatPercentage = (num: number): string => {
  if (num == null || num === 0) return '';
  return `${num.toFixed(1)}%`;
};

/**
 * Cell class rules cho positive/negative values
 */
const percentageCellClassRules = {
  'tx_t': (params: any) => params.value > 0, // text-green for positive
  'tx_g': (params: any) => params.value < 0, // text-red for negative
};

/**
 * Column definitions cho Financial Report (93 columns)
 * Note: Using any type for fields since FinancialData type is incomplete
 */
export const getColumnDefs = (): (ColDef | ColGroupDef)[] => [
  // KỲ BÁO CÁO Group
  {
    headerName: 'KỲ BÁO CÁO',
    children: [
      { field: 'ticker', headerName: 'Mã', width: 100, pinned: 'left', cellClass: 'font-bold' },
      { field: 'year', headerName: 'Năm', width: 100, pinned: 'left' },
      { field: 'quarter', headerName: 'Quý', width: 100, pinned: 'left' },
    ],
  },
  
  // KẾT QUẢ KINH DOANH Group
  {
    headerName: 'KẾT QUẢ KINH DOANH',
    children: [
      { field: 'revenue', headerName: 'Doanh thu thuần', width: 140, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'revenueYoY', headerName: 'DTT YoY (%)', width: 120, valueFormatter: (p) => formatPercentage(p.value), cellClassRules: percentageCellClassRules },
      { field: 'costOfGoodsSold', headerName: 'Giá vốn hàng bán', width: 150, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'grossProfit', headerName: 'Lợi nhuận gộp', width: 140, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'operatingExpense', headerName: 'Chi phí hoạt động', width: 150, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'operatingProfit', headerName: 'LN hoạt động KD', width: 140, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'operatingProfitYoY', headerName: 'LNKD YoY (%)', width: 130, valueFormatter: (p) => formatPercentage(p.value), cellClassRules: percentageCellClassRules },
      { field: 'interestExpense', headerName: 'Chi phí lãi vay', width: 140, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'profitBeforeTax', headerName: 'LN trước thuế', width: 140, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'profitAfterTax', headerName: 'LN sau thuế', width: 130, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'profitAfterTaxMinority', headerName: 'LNST và CĐ thiểu số', width: 160, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'profitAfterTaxYoY', headerName: 'LNST YoY (%)', width: 130, valueFormatter: (p) => formatPercentage(p.value), cellClassRules: percentageCellClassRules },
      { field: 'ebitda', headerName: 'EBITDA', width: 130, valueFormatter: (p) => formatNumber(p.value) },
    ],
  },

  // BẢNG CÂN ĐỐI KẾ TOÁN Group
  {
    headerName: 'BẢNG CÂN ĐỐI KẾ TOÁN',
    children: [
      // TÀI SẢN NGẮN HẠN
      {
        headerName: 'TÀI SẢN NGẮN HẠN',
        children: [
          { field: 'cashAndEquivalents', headerName: 'Tiền và tương đương tiền', width: 180, valueFormatter: (p) => formatNumber(p.value) },
          { field: 'shortTermInvestments', headerName: 'Đầu tư TC ngắn hạn', width: 160, valueFormatter: (p) => formatNumber(p.value) },
          { field: 'receivables', headerName: 'Các khoản phải thu', width: 150, valueFormatter: (p) => formatNumber(p.value) },
          { field: 'inventory', headerName: 'Hàng tồn kho', width: 130, valueFormatter: (p) => formatNumber(p.value) },
          { field: 'otherCurrentAssets', headerName: 'Tài sản NH khác', width: 140, valueFormatter: (p) => formatNumber(p.value) },
        ],
      },
      // TÀI SẢN DÀI HẠN
      {
        headerName: 'TÀI SẢN DÀI HẠN',
        children: [
          { field: 'fixedAssets', headerName: 'Tài sản cố định', width: 140, valueFormatter: (p) => formatNumber(p.value) },
          { field: 'investmentProperty', headerName: 'BĐS đầu tư', width: 130, valueFormatter: (p) => formatNumber(p.value) },
          { field: 'longTermInvestments', headerName: 'Đầu tư TC dài hạn', width: 160, valueFormatter: (p) => formatNumber(p.value) },
          { field: 'constructionInProgress', headerName: 'Tài sản dở dang', width: 140, valueFormatter: (p) => formatNumber(p.value) },
          { field: 'otherLongTermAssets', headerName: 'Tài sản DH khác', width: 140, valueFormatter: (p) => formatNumber(p.value) },
        ],
      },
      { field: 'totalAssets', headerName: 'Tổng tài sản', width: 140, valueFormatter: (p) => formatNumber(p.value), cellClass: 'font-bold' },
      
      // NGUỒN VỐN
      { field: 'totalLiabilities', headerName: 'Tổng nợ phải trả', width: 150, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'shortTermDebt', headerName: 'Vay ngắn hạn', width: 130, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'longTermDebt', headerName: 'Vay dài hạn', width: 130, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'otherLiabilities', headerName: 'Nợ khác', width: 120, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'equity', headerName: 'Vốn chủ sở hữu', width: 140, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'charteredCapital', headerName: 'Vốn điều lệ', width: 130, valueFormatter: (p) => formatNumber(p.value) },
    ],
  },

  // LƯU CHUYỂN TIỀN TỆ Group
  {
    headerName: 'LƯU CHUYỂN TIỀN TỆ',
    children: [
      { field: 'cashFlowOperating', headerName: 'LC tiền từ HĐKD', width: 150, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'cashFlowInvesting', headerName: 'LC tiền từ HĐĐT', width: 150, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'cashFlowFinancing', headerName: 'LC tiền từ HĐTC', width: 150, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'netCashFlow', headerName: 'Lưu chuyển tiền thuần', width: 160, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'beginningCash', headerName: 'Tiền đầu kỳ', width: 130, valueFormatter: (p) => formatNumber(p.value) },
      { field: 'endingCash', headerName: 'Tiền cuối kỳ', width: 130, valueFormatter: (p) => formatNumber(p.value) },
    ],
  },

  // CHỈ SỐ TÀI CHÍNH Group
  {
    headerName: 'CHỈ SỐ TÀI CHÍNH',
    children: [
      // ĐỊNH GIÁ
      {
        headerName: 'ĐỊNH GIÁ',
        children: [
          { field: 'pe', headerName: 'P/E', width: 100, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'evEbitda', headerName: 'EV/EBITDA', width: 120, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'pb', headerName: 'P/B', width: 100, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'eps', headerName: 'EPS', width: 100, valueFormatter: (p) => formatNumber(p.value) },
          { field: 'epsGrowth', headerName: 'Thay đổi EPS (%)', width: 150, valueFormatter: (p) => formatPercentage(p.value), cellClassRules: percentageCellClassRules },
          { field: 'ebitdaPerShare', headerName: 'EBITDA/cp', width: 120, valueFormatter: (p) => formatNumber(p.value) },
          { field: 'ebitdaPerShareGrowth', headerName: 'Thay đổi EBITDA/cp (%)', width: 180, valueFormatter: (p) => formatPercentage(p.value), cellClassRules: percentageCellClassRules },
          { field: 'bvps', headerName: 'BVPS', width: 100, valueFormatter: (p) => formatNumber(p.value) },
          { field: 'bvpsGrowth', headerName: 'Thay đổi BVPS (%)', width: 160, valueFormatter: (p) => formatPercentage(p.value), cellClassRules: percentageCellClassRules },
          { field: 'dividendYield', headerName: 'Tỷ suất cổ tức (%)', width: 160, valueFormatter: (p) => formatPercentage(p.value) },
        ],
      },
      
      // HIỆU QUẢ HOẠT ĐỘNG
      {
        headerName: 'HIỆU QUẢ HOẠT ĐỘNG',
        children: [
          { field: 'roe', headerName: 'ROE (%)', width: 110, valueFormatter: (p) => formatPercentage(p.value) },
          { field: 'roa', headerName: 'ROA (%)', width: 110, valueFormatter: (p) => formatPercentage(p.value) },
          { field: 'grossMargin', headerName: 'Biên LN gộp (%)', width: 140, valueFormatter: (p) => formatPercentage(p.value) },
          { field: 'operatingMargin', headerName: 'Biên LN hoạt động (%)', width: 170, valueFormatter: (p) => formatPercentage(p.value) },
          { field: 'netMargin', headerName: 'Biên LNST (%)', width: 130, valueFormatter: (p) => formatPercentage(p.value) },
        ],
      },

      // SỨC KHỎE TÀI CHÍNH
      {
        headerName: 'SỨC KHỎE TÀI CHÍNH',
        children: [
          { field: 'debtToEquity', headerName: 'Vay/VCSH', width: 120, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'debtToAssets', headerName: 'Vay/Tài sản', width: 130, valueFormatter: (p) => formatPercentage(p.value) },
          { field: 'debtToEbitda', headerName: 'Vay/EBITDA', width: 130, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'shortToLongDebt', headerName: 'Vay NH/Vay DH', width: 140, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'interestCoverage', headerName: 'EBIT/Lãi vay', width: 130, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'leverage', headerName: 'Đòn bẩy tài chính (A/E)', width: 180, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'workingCapital', headerName: 'Cân đối vốn TDH', width: 150, valueFormatter: (p) => formatNumber(p.value) },
          { field: 'cashToEquity', headerName: 'Tiền mặt/VCSH', width: 140, valueFormatter: (p) => formatPercentage(p.value) },
          { field: 'cashToMarketCap', headerName: 'Tiền mặt/Vốn hóa', width: 160, valueFormatter: (p) => formatPercentage(p.value) },
        ],
      },

      // KHẢ NĂNG THANH TOÁN
      {
        headerName: 'KHẢ NĂNG THANH TOÁN',
        children: [
          { field: 'currentRatio', headerName: 'Thanh toán hiện hành', width: 170, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'quickRatio', headerName: 'Thanh toán nhanh', width: 150, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'daysReceivable', headerName: 'Số ngày phải thu', width: 150, valueFormatter: (p) => p.value?.toFixed(0) || '' },
          { field: 'daysInventory', headerName: 'Số ngày tồn kho', width: 150, valueFormatter: (p) => p.value?.toFixed(0) || '' },
          { field: 'daysPayable', headerName: 'Số ngày phải trả', width: 150, valueFormatter: (p) => p.value?.toFixed(0) || '' },
          { field: 'cashConversionCycle', headerName: 'Chu kỳ tiền mặt', width: 150, valueFormatter: (p) => p.value?.toFixed(0) || '' },
        ],
      },

      // HIỆU QUẢ SỬ DỤNG TÀI SẢN
      {
        headerName: 'HIỆU QUẢ SỬ DỤNG TÀI SẢN',
        children: [
          { field: 'workingCapitalTurnover', headerName: 'Vòng quay vốn LĐ', width: 160, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'capexToFixedAssets', headerName: 'Chi phí đầu tư/TSCĐ', width: 170, valueFormatter: (p) => formatPercentage(p.value) },
          { field: 'assetTurnover', headerName: 'Vòng quay tài sản', width: 160, valueFormatter: (p) => p.value?.toFixed(2) || '' },
        ],
      },

      // PHÂN TÍCH DUPONT
      {
        headerName: 'PHÂN TÍCH DUPONT',
        children: [
          { field: 'dupontNetToEbt', headerName: 'LNST/LNTT', width: 120, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'dupontEbtToEbit', headerName: 'LNTT/EBIT', width: 120, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'dupontEbitMargin', headerName: 'EBIT/DT thuần (%)', width: 160, valueFormatter: (p) => formatPercentage(p.value) },
          { field: 'dupontAssetTurnover', headerName: 'DT thuần/Tài sản', width: 160, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'dupontRoa', headerName: 'ROA (%)', width: 110, valueFormatter: (p) => formatPercentage(p.value) },
          { field: 'dupontEquityMultiplier', headerName: 'Tài sản/VCSH', width: 140, valueFormatter: (p) => p.value?.toFixed(2) || '' },
          { field: 'dupontRoe', headerName: 'ROE (%)', width: 110, valueFormatter: (p) => formatPercentage(p.value) },
        ],
      },
    ],
  },
];

/**
 * Default column definition
 */
export const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  floatingFilter: true,
};
