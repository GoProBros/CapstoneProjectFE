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
  if (num === 0) return '';
  return num.toLocaleString('en-US');
};

/**
 * Format percentage
 */
export const formatPercentage = (num: number): string => {
  if (num === 0) return '';
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
 * Column definitions cho Financial Report
 */
export const getColumnDefs = (): (ColDef<FinancialData> | ColGroupDef<FinancialData>)[] => [
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
      },
      {
        field: 'year',
        headerName: 'Năm',
        width: 100,
        pinned: 'left',
      },
      {
        field: 'quarter',
        headerName: 'Quý',
        width: 120,
        pinned: 'left',
      },
    ],
  },
  
  // KẾT QUẢ KINH DOANH Group
  {
    headerName: 'KẾT QUẢ KINH DOANH',
    children: [
      {
        field: 'revenue',
        headerName: 'Doanh thu thuần',
        width: 100,
        valueFormatter: (params) => formatNumber(params.value),
      },
      {
        field: 'yearRevenueGrowth',
        headerName: 'DTT YoY (%)',
        width: 100,
        valueFormatter: (params) => formatPercentage(params.value),
        cellClassRules: percentageCellClassRules,
      },
      {
        field: 'costOfGoodSold',
        headerName: 'Giá vốn hàng bán',
        width: 100,
        valueFormatter: (params) => formatNumber(params.value),
      },
      {
        field: 'grossProfit',
        headerName: 'Lợi nhuận gộp',
        width: 100,
        valueFormatter: (params) => formatNumber(params.value),
      },
      {
        field: 'operationExpense',
        headerName: 'Chi phí hoạt động',
        width: 100,
        valueFormatter: (params) => formatNumber(params.value),
      },
      {
        field: 'operationProfit',
        headerName: 'Lợi nhuận hoạt động',
        width: 100,
        valueFormatter: (params) => formatNumber(params.value),
      },
      {
        field: 'yearOperationProfitGrowth',
        headerName: 'LNHĐ YoY (%)',
        width: 100,
        valueFormatter: (params) => formatPercentage(params.value),
        cellClassRules: percentageCellClassRules,
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
