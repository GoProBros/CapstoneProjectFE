/**
 * AG Grid Column Definitions
 * Configuration cho Financial Report table
 * Updated to match backend API response structure
 */

import type { ColDef, ColGroupDef } from 'ag-grid-community';
import type { FinancialReportTableRow } from '@/types/financialReport';

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
        cellClass: 'font-bold' 
      },
      { 
        field: 'year', 
        headerName: 'Năm', 
        width: 100, 
        pinned: 'left' 
      },
      { 
        field: 'periodLabel', 
        headerName: 'Kỳ', 
        width: 150, 
        pinned: 'left',
        valueFormatter: periodFormatter
      },
    ],
  },
  
  // BẢNG CÂN ĐỐI KẾ TOÁN - Balance Sheet
  {
    headerName: 'BẢNG CÂN ĐỐI KẾ TOÁN',
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

  // KẾT QUẢ KINH DOANH - Income Statement
  {
    headerName: 'KẾT QUẢ KINH DOANH',
    children: [
      { 
        field: 'netRevenue', 
        headerName: 'Doanh thu thuần', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-semibold' 
      },
      { 
        field: 'grossProfit', 
        headerName: 'Lợi nhuận gộp', 
        width: 160, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'operatingProfit', 
        headerName: 'Lợi nhuận hoạt động', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'profitBeforeTax', 
        headerName: 'Lợi nhuận trước thuế', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value) 
      },
      { 
        field: 'netProfit', 
        headerName: 'Lợi nhuận sau thuế', 
        width: 170, 
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-semibold' 
      },
    ],
  },

  // LƯU CHUYỂN TIỀN TỆ - Cash Flow Statement
  {
    headerName: 'LƯU CHUYỂN TIỀN TỆ',
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

  // METADATA
  {
    headerName: 'THÔNG TIN',
    children: [
      { 
        field: 'status', 
        headerName: 'Trạng thái', 
        width: 120,
        valueFormatter: (p) => {
          switch(p.value) {
            case 0: return 'Nháp';
            case 1: return 'Đã công bố';
            case 2: return 'Lưu trữ';
            default: return '';
          }
        }
      },
      { 
        field: 'fileUrl', 
        headerName: 'File URL', 
        width: 200,
        hide: true // Hide by default, can be shown if needed
      },
      { 
        field: 'createdAt', 
        headerName: 'Ngày tạo', 
        width: 160,
        valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('vi-VN') : ''
      },
      { 
        field: 'updatedAt', 
        headerName: 'Cập nhật', 
        width: 160,
        valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('vi-VN') : ''
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
