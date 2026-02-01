/**
 * AG Grid Column Definitions
 * Configuration cho Financial Report table
 * Updated to match backend API response structure
 */

import type { ColDef, ColGroupDef } from 'ag-grid-community';
import type { FinancialReportTableRow } from '@/types/financialReport';

/**
 * Format number với dấu phân cách và đơn vị tỷ đồng
 * Converts from VND to billion VND
 */
export const formatNumber = (num: number): string => {
  if (num == null || num === 0) return '';
  const billion = num / 1_000_000_000; // Convert to billion
  return billion.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
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
 * Format period label
 */
const periodFormatter = (params: any) => {
  return params.data?.periodLabel || '';
};

/**
 * Column definitions cho Financial Report
 * Mapped from backend API response structure
 */
export const getColumnDefs = (): (ColDef | ColGroupDef)[] => [
  // KỲ BÁO CÁO Group
  {
    headerName: 'KỲ BÁO CÁO',
    children: [
      { 
        field: 'ticker', 
        headerName: 'Mã', 
        width: 100, 
        pinned: 'left', 
        cellClass: 'font-bold',
        cellStyle: (params: any) => {
          // For ticker header rows, apply larger bold font
          if (params.data?.isTickerHeader) {
            return {
              fontWeight: 'bold',
              fontSize: '14px',
            };
          }
          return undefined;
        }
      },
      { 
        field: 'year', 
        headerName: 'Năm', 
        width: 100, 
        pinned: 'left',
        cellRenderer: (params: any) => {
          // Hide for ticker header rows
          if (params.data?.isTickerHeader) return '';
          return params.value;
        }
      },
      { 
        field: 'periodLabel', 
        headerName: 'Kỳ', 
        width: 150, 
        pinned: 'left',
        valueFormatter: periodFormatter,
        cellRenderer: (params: any) => {
          // Hide for ticker header rows
          if (params.data?.isTickerHeader) return '';
          return params.data?.periodLabel || '';
        }
      },
    ],
  },
  
  // BẢNG CÂN ĐỐI KẾ TOÁN - Balance Sheet Summary
  {
    headerName: 'BẢNG CÂN ĐỐI KẾ TOÁN - TỔNG QUAN (tỷ đồng)',
    children: [
      { 
        field: 'totalAssets', 
        headerName: 'Tổng tài sản', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-bold' 
      },
      { 
        field: 'shortTermAssets', 
        headerName: 'Tài sản ngắn hạn', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'longTermAssets', 
        headerName: 'Tài sản dài hạn', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'totalLiabilities', 
        headerName: 'Tổng nợ phải trả', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-semibold' 
      },
      { 
        field: 'totalEquity', 
        headerName: 'Vốn chủ sở hữu', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-semibold' 
      },
    ],
  },

  // BẢNG CÂN ĐỐI KẾ TOÁN - CHI TIẾT TÀI SẢN (Gom tất cả loại công ty)
  {
    headerName: 'CHI TIẾT TÀI SẢN (tỷ đồng)',
    children: [
      // Regular company assets
      { 
        field: 'cash', 
        headerName: 'Tiền và tương đương tiền', 
        width: 180, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'financialInvestmentsShortTerm', 
        headerName: 'Đầu tư tài chính NH', 
        width: 180, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'receivablesShortTerm', 
        headerName: 'Phải thu ngắn hạn', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'inventories', 
        headerName: 'Hàng tồn kho', 
        width: 140, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'otherAssetsShortTerm', 
        headerName: 'Tài sản NH khác', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'receivablesLongTerm', 
        headerName: 'Phải thu dài hạn', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'fixedAssets', 
        headerName: 'Tài sản cố định', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'investmentProperty', 
        headerName: 'Bất động sản đầu tư', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'longTermAssetsInProgress', 
        headerName: 'TSCĐ dở dang', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'financialInvestmentsLongTerm', 
        headerName: 'Đầu tư tài chính DH', 
        width: 180, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'otherAssetsLongTerm', 
        headerName: 'Tài sản DH khác', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      // Bank-specific assets
      { 
        field: 'depositsAtCentralBank', 
        headerName: 'Tiền gửi NHNN', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'depositsAtOtherCreditInstitutions', 
        headerName: 'Tiền gửi tại TCTD khác', 
        width: 180, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'tradingSecurities', 
        headerName: 'Chứng khoán kinh doanh', 
        width: 180, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'loansToCustomers', 
        headerName: 'Cho vay khách hàng', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'investmentSecurities', 
        headerName: 'Chứng khoán đầu tư', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'bankOtherAssets', 
        headerName: 'Tài sản khác (NH)', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      // Securities short-term financial assets
      { 
        field: 'shortTermFinancialAssetsCash', 
        headerName: 'Tiền (CK)', 
        width: 140, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'shortTermFinancialAssetsLoans', 
        headerName: 'Cho vay (CK)', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'shortTermFinancialAssetsOther', 
        headerName: 'Khác (CK)', 
        width: 140, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      // Securities trading and capital assets
      { 
        field: 'heldToMaturity', 
        headerName: 'Nắm giữ đến ngày đáo hạn', 
        width: 190, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'availableForSale', 
        headerName: 'Sẵn sàng bán', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'fvtpl', 
        headerName: 'FVTPL', 
        width: 120, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
    ],
  },

  // NỢ PHẢI TRẢ & VỐN CHỦ SỞ HỮU
  {
    headerName: 'NỢ & VỐN CHỦ SỞ HỮU (tỷ đồng)',
    children: [
      { 
        field: 'shortTermLiabilities', 
        headerName: 'Nợ ngắn hạn', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'longTermLiabilities', 
        headerName: 'Nợ dài hạn', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'shortTermBorrowings', 
        headerName: 'Vay ngắn hạn', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'longTermBorrowings', 
        headerName: 'Vay dài hạn', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'contributedCapital', 
        headerName: 'Vốn góp', 
        width: 140, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'retainedEarnings', 
        headerName: 'Lợi nhuận giữ lại', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'treasuryShares', 
        headerName: 'Cổ phiếu quỹ', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'otherCapital', 
        headerName: 'Vốn khác', 
        width: 130, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
    ],
  },

  // KẾT QUẢ KINH DOANH (Gom tất cả loại công ty)
  {
    headerName: 'KẾT QUẢ KINH DOANH (tỷ đồng)',
    children: [
      // Regular company income
      { 
        field: 'netRevenue', 
        headerName: 'Doanh thu thuần', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-semibold' 
      },
      { 
        field: 'costOfGoodsSold', 
        headerName: 'Giá vốn hàng bán', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'grossProfit', 
        headerName: 'Lợi nhuận gộp', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-semibold' 
      },
      { 
        field: 'sellingExpenses', 
        headerName: 'Chi phí bán hàng', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'managementExpenses', 
        headerName: 'Chi phí quản lý', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'financialExpenses', 
        headerName: 'Chi phí tài chính', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'interestExpenses', 
        headerName: 'Chi phí lãi vay', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'operatingProfit', 
        headerName: 'Lợi nhuận hoạt động', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-semibold' 
      },
      { 
        field: 'financialProfit', 
        headerName: 'Lợi nhuận tài chính', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'shareProfitOfAssociates', 
        headerName: 'LN từ công ty liên kết', 
        width: 180, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'otherProfit', 
        headerName: 'Lợi nhuận khác', 
        width: 150, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'profitBeforeTax', 
        headerName: 'Lợi nhuận trước thuế', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-bold' 
      },
      { 
        field: 'corporateIncomeTax', 
        headerName: 'Thuế TNDN', 
        width: 140, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'minorityInterests', 
        headerName: 'Lợi ích cổ đông thiểu số', 
        width: 180, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'netProfit', 
        headerName: 'Lợi nhuận sau thuế', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-bold' 
      },
      // Bank-specific income
      { 
        field: 'netInterestIncome', 
        headerName: 'Thu nhập lãi thuần', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-semibold' 
      },
      { 
        field: 'serviceFeeIncome', 
        headerName: 'Thu nhập phí dịch vụ', 
        width: 180, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'tradingIncome', 
        headerName: 'Thu nhập từ kinh doanh', 
        width: 180, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'bankOtherIncome', 
        headerName: 'Thu nhập khác (NH)', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      // Insurance-specific income
      { 
        field: 'insuranceNetOperatingRevenue', 
        headerName: 'Doanh thu hoạt động BH', 
        width: 190, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-semibold' 
      },
      { 
        field: 'insuranceOperatingExpenses', 
        headerName: 'Chi phí hoạt động BH', 
        width: 180, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'insuranceOperatingProfit', 
        headerName: 'Lợi nhuận hoạt động BH', 
        width: 190, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-semibold' 
      },
      // Securities-specific income
      { 
        field: 'brokerageAndCustodyRevenue', 
        headerName: 'DT môi giới & lưu ký', 
        width: 180, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'lendingRevenue', 
        headerName: 'DT cho vay & GDCPS', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'tradingAndCapitalRevenue', 
        headerName: 'DT kinh doanh & ĐT', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'investmentBankingRevenue', 
        headerName: 'DT ngân hàng đầu tư', 
        width: 180, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      // Additional profit fields
      { 
        field: 'profitAfterTaxAndAfs', 
        headerName: 'Lợi nhuận sau thuế & AFS', 
        width: 190, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-semibold' 
      },
      { 
        field: 'afsGains', 
        headerName: 'Lãi AFS', 
        width: 130, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
    ],
  },

  // LƯU CHUYỂN TIỀN TỆ - Cash Flow Statement
  {
    headerName: 'LƯU CHUYỂN TIỀN TỆ (tỷ đồng)',
    children: [
      { 
        field: 'netCashFlow', 
        headerName: 'Lưu chuyển tiền thuần', 
        width: 180, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-semibold',
        cellClassRules: percentageCellClassRules
      },
      { 
        field: 'operatingCashFlow', 
        headerName: 'LC tiền từ HĐKD', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClassRules: percentageCellClassRules
      },
      { 
        field: 'investingCashFlow', 
        headerName: 'LC tiền từ HĐĐT', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClassRules: percentageCellClassRules
      },
      { 
        field: 'financingCashFlow', 
        headerName: 'LC tiền từ HĐTC', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClassRules: percentageCellClassRules
      },
    ],
  },

  // FILE DOWNLOAD
  {
    headerName: 'TÀI LIỆU',
    children: [
      { 
        field: 'fileUrl', 
        headerName: 'Tải xuống', 
        width: 110,
        cellRenderer: (params: any) => {
          // Skip for ticker header rows
          if (params.data?.isTickerHeader) return '';
          
          const fileUrl = params.value;
          if (!fileUrl) return '';
          
          // Return download icon with link
          return `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center text-blue-600 hover:text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </a>`;
        },
        cellStyle: { textAlign: 'center' }
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
