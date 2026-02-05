/**
 * AG Grid Column Definitions with Expand/Collapse Groups
 * Configuration cho Financial Report table
 * Updated to match backend API response structure with hierarchical column groups
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
 * Column definitions cho Financial Report with expand/collapse groups
 * Uses flattened data structure from FinancialReportTableRow type
 */
export const getColumnDefs = (): (ColDef | ColGroupDef)[] => [
  // ===== KỲ BÁO CÁO (Always visible - Pinned) =====
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
          if (params.data?.isTickerHeader) {
            return { fontWeight: 'bold', fontSize: '14px' };
          }
          return undefined;
        }
      },
      { 
        field: 'year', 
        headerName: 'Năm', 
        width: 80, 
        pinned: 'left',
        cellRenderer: (params: any) => {
          if (params.data?.isTickerHeader) return '';
          return params.value;
        }
      },
      { 
        field: 'periodLabel', 
        headerName: 'Kỳ', 
        width: 100, 
        pinned: 'left',
        valueFormatter: periodFormatter,
        cellRenderer: (params: any) => {
          if (params.data?.isTickerHeader) return '';
          return params.data?.periodLabel || '';
        }
      },
    ],
  },

  // ===== 1. BALANCE SHEET =====
  {
    headerName: 'CÂN ĐỐI KẾ TOÁN',
    groupId: 'balanceSheet',
    children: [
      // Short Term Assets
      {
        headerName: 'Tài sản ngắn hạn',
        groupId: 'shortTermAssets',
        children: [
          {
            field: 'shortTermAssets',
            headerName: 'Tổng TSNH',
            columnGroupShow: 'closed',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'cash',
            headerName: 'Tiền mặt',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'financialInvestmentsShortTerm',
            headerName: 'Đầu tư tài chính',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'receivablesShortTerm',
            headerName: 'Phải thu',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'inventories',
            headerName: 'Hàng tồn kho',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'otherAssetsShortTerm',
            headerName: 'Tài sản khác',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
        ]
      },

      // Long Term Assets
      {
        headerName: 'Tài sản dài hạn',
        groupId: 'longTermAssets',
        children: [
          {
            field: 'longTermAssets',
            headerName: 'Tổng TSDH',
            columnGroupShow: 'closed',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'receivablesLongTerm',
            headerName: 'Phải thu',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'fixedAssets',
            headerName: 'Tài sản cố định',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'investmentProperty',
            headerName: 'Bất động sản đầu tư',
            columnGroupShow: 'open',
            width: 170,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'longTermAssetsInProgress',
            headerName: 'Tài sản dở dang',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'financialInvestmentsLongTerm',
            headerName: 'Đầu tư tài chính',
            columnGroupShow: 'open',
            width: 150,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'otherAssetsLongTerm',
            headerName: 'Tài sản khác',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
        ]
      },

      // Bank Assets
      {
        headerName: 'Tài sản ngân hàng',
        groupId: 'bankAssets',
        children: [
          {
            headerName: 'Tổng TS NH',
            columnGroupShow: 'closed',
            width: 140,
            valueGetter: (params) => {
              const d = params.data;
              if (!d) return 0;
              return (d.depositsAtCentralBank || 0) + (d.depositsAtOtherCreditInstitutions || 0) + 
                     (d.investmentSecurities || 0) + (d.loansToCustomers || 0) + 
                     (d.bankOtherAssets || 0) + (d.tradingSecurities || 0);
            },
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'depositsAtCentralBank',
            headerName: 'Tiền gửi NHNN',
            columnGroupShow: 'open',
            width: 150,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'depositsAtOtherCreditInstitutions',
            headerName: 'Tiền gửi TCTD',
            columnGroupShow: 'open',
            width: 150,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'investmentSecurities',
            headerName: 'CK đầu tư',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'loansToCustomers',
            headerName: 'Cho vay KH',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'bankOtherAssets',
            headerName: 'Tài sản khác',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'tradingSecurities',
            headerName: 'CK kinh doanh',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
        ]
      },

      // Short Term Financial Assets (Securities)
      {
        headerName: 'TS tài chính ngắn hạn',
        groupId: 'shortTermFinancialAssets',
        children: [
          {
            headerName: 'Tổng TS TC NH',
            columnGroupShow: 'closed',
            width: 140,
            valueGetter: (params) => {
              const d = params.data;
              if (!d) return 0;
              return (d.shortTermFinancialAssetsCash || 0) + (d.shortTermFinancialAssetsLoans || 0) + 
                     (d.shortTermFinancialAssetsOther || 0);
            },
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'shortTermFinancialAssetsCash',
            headerName: 'Tiền (CK)',
            columnGroupShow: 'open',
            width: 120,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'shortTermFinancialAssetsLoans',
            headerName: 'Cho vay (CK)',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'shortTermFinancialAssetsOther',
            headerName: 'Khác (CK)',
            columnGroupShow: 'open',
            width: 120,
            valueFormatter: (p) => formatNumber(p.value)
          },
        ]
      },

      // Trading and Capital Assets (Securities)
      {
        headerName: 'TS kinh doanh & vốn',
        groupId: 'tradingAndCapitalAssets',
        children: [
          {
            headerName: 'Tổng TS KD',
            columnGroupShow: 'closed',
            width: 140,
            valueGetter: (params) => {
              const d = params.data;
              if (!d) return 0;
              return (d.heldToMaturity || 0) + (d.availableForSale || 0) + (d.fvtpl || 0);
            },
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'heldToMaturity',
            headerName: 'Giữ đến đáo hạn',
            columnGroupShow: 'open',
            width: 150,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'availableForSale',
            headerName: 'Sẵn sàng bán',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'fvtpl',
            headerName: 'FVTPL',
            columnGroupShow: 'open',
            width: 110,
            valueFormatter: (p) => formatNumber(p.value)
          },
        ]
      },

      // Liabilities
      {
        headerName: 'Nợ phải trả',
        groupId: 'liabilities',
        children: [
          {
            field: 'totalLiabilities',
            headerName: 'Tổng nợ',
            columnGroupShow: 'closed',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'shortTermLiabilities',
            headerName: 'Ngắn hạn',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'longTermLiabilities',
            headerName: 'Dài hạn',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
        ]
      },

      // Borrowings
      {
        headerName: 'Nợ vay',
        groupId: 'borrowings',
        children: [
          {
            headerName: 'Tổng vay',
            columnGroupShow: 'closed',
            width: 140,
            valueGetter: (params) => {
              const d = params.data;
              if (!d) return 0;
              return (d.shortTermBorrowings || 0) + (d.longTermBorrowings || 0);
            },
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'shortTermBorrowings',
            headerName: 'Ngắn hạn',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'longTermBorrowings',
            headerName: 'Dài hạn',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
        ]
      },

      // Equity
      {
        headerName: 'Vốn chủ sở hữu',
        groupId: 'equity',
        children: [
          {
            field: 'totalEquity',
            headerName: 'Tổng VCSH',
            columnGroupShow: 'closed',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'contributedCapital',
            headerName: 'Vốn góp',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'retainedEarnings',
            headerName: 'LN giữ lại',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'treasuryShares',
            headerName: 'Cổ phiếu quỹ',
            columnGroupShow: 'open',
            width: 120,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'otherCapital',
            headerName: 'Vốn khác',
            columnGroupShow: 'open',
            width: 120,
            valueFormatter: (p) => formatNumber(p.value)
          },
        ]
      },
    ]
  },

  // ===== 2. INCOME STATEMENT =====
  {
    headerName: 'KẾT QUẢ KINH DOANH',
    groupId: 'incomeStatement',
    children: [
      // Bank Operating Income
      {
        headerName: 'Thu nhập hoạt động (NH)',
        groupId: 'bankOperatingIncome',
        children: [
          {
            headerName: 'Tổng TN NH',
            columnGroupShow: 'closed',
            width: 140,
            valueGetter: (params) => {
              const d = params.data;
              if (!d) return 0;
              return (d.netInterestIncome || 0) + (d.bankOtherIncome || 0) + 
                     (d.serviceFeeIncome || 0) + (d.tradingIncome || 0);
            },
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'netInterestIncome',
            headerName: 'TN lãi thuần',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'bankOtherIncome',
            headerName: 'TN khác',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'serviceFeeIncome',
            headerName: 'TN dịch vụ',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'tradingIncome',
            headerName: 'TN tự doanh',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
        ]
      },

      // Insurance Business
      {
        headerName: 'Kinh doanh bảo hiểm',
        groupId: 'insuranceBusiness',
        children: [
          {
            field: 'insuranceOperatingProfit',
            headerName: 'LN BH',
            columnGroupShow: 'closed',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'insuranceNetOperatingRevenue',
            headerName: 'DT hoạt động',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'insuranceOperatingExpenses',
            headerName: 'CP hoạt động',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'insuranceOperatingProfit',
            headerName: 'LN hoạt động',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
        ]
      },

      // Securities Revenue
      {
        headerName: 'Doanh thu chứng khoán',
        groupId: 'securitiesRevenue',
        children: [
          {
            headerName: 'Tổng DT CK',
            columnGroupShow: 'closed',
            width: 140,
            valueGetter: (params) => {
              const d = params.data;
              if (!d) return 0;
              return (d.brokerageAndCustodyRevenue || 0) + (d.lendingRevenue || 0) + 
                     (d.tradingAndCapitalRevenue || 0) + (d.investmentBankingRevenue || 0);
            },
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'brokerageAndCustodyRevenue',
            headerName: 'Môi giới',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'lendingRevenue',
            headerName: 'Cho vay',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'tradingAndCapitalRevenue',
            headerName: 'Tự doanh & vốn',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'investmentBankingRevenue',
            headerName: 'NH đầu tư',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
        ]
      },

      // Gross Profit
      {
        headerName: 'Lợi nhuận gộp',
        groupId: 'grossProfit',
        children: [
          {
            field: 'grossProfit',
            headerName: 'LN gộp',
            columnGroupShow: 'closed',
            width: 160,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-bold'
          },
          {
            field: 'netRevenue',
            headerName: 'DT thuần',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'costOfGoodsSold',
            headerName: 'Giá vốn',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'grossProfit',
            headerName: 'LN gộp',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-bold'
          },
        ]
      },

      // Expenses
      {
        headerName: 'Chi phí kinh doanh',
        groupId: 'expenses',
        children: [
          {
            headerName: 'Tổng CP',
            columnGroupShow: 'closed',
            width: 140,
            valueGetter: (params) => {
              const d = params.data;
              if (!d) return 0;
              return (d.costOfGoodsSold || 0) + (d.interestExpenses || 0) + 
                     (d.sellingExpenses || 0) + (d.financialExpenses || 0) + 
                     (d.managementExpenses || 0);
            },
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'costOfGoodsSold',
            headerName: 'CP bán hàng',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'interestExpenses',
            headerName: 'CP lãi vay',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'sellingExpenses',
            headerName: 'CP bán hàng',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'financialExpenses',
            headerName: 'CP tài chính',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'managementExpenses',
            headerName: 'CP quản lý',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
        ]
      },

      // Profit Before Tax
      {
        headerName: 'LN trước thuế',
        groupId: 'profitBeforeTax',
        children: [
          {
            field: 'profitBeforeTax',
            headerName: 'LN trước thuế',
            columnGroupShow: 'closed',
            width: 150,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-bold'
          },
          {
            field: 'operatingProfit',
            headerName: 'LN Kinh doanh',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'financialProfit',
            headerName: 'LN tài chính',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'shareProfitOfAssociates',
            headerName: 'LN Liên doanh',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'otherProfit',
            headerName: 'LN khác',
            columnGroupShow: 'open',
            width: 120,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'profitBeforeTax',
            headerName: 'LN trước thuế',
            columnGroupShow: 'open',
            width: 150,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-bold'
          },
        ]
      },

      // Profit After Tax and AFS
      {
        headerName: 'LN sau thuế & AFS',
        groupId: 'profitAfterTaxAndAFS',
        children: [
          {
            field: 'profitAfterTaxAndAfs',
            headerName: 'LN sau thuế AFS',
            columnGroupShow: 'closed',
            width: 150,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'profitAfterTaxAndAfs',
            headerName: 'LN sau thuế AFS',
            columnGroupShow: 'open',
            width: 150,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-semibold'
          },
          {
            field: 'netProfit',
            headerName: 'LN cổ đông',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'afsGains',
            headerName: 'Lãi AFS',
            columnGroupShow: 'open',
            width: 120,
            valueFormatter: (p) => formatNumber(p.value)
          },
        ]
      },

      // Parent Company Net Profit
      {
        headerName: 'LN sau thuế công ty mẹ',
        groupId: 'parentCompanyNetProfit',
        children: [
          {
            field: 'netProfit',
            headerName: 'LN CTM',
            columnGroupShow: 'closed',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-bold'
          },
          {
            field: 'profitBeforeTax',
            headerName: 'LN trước thuế',
            columnGroupShow: 'open',
            width: 150,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'corporateIncomeTax',
            headerName: 'Thuế TNDN',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'minorityInterests',
            headerName: 'Lợi ích CĐTS',
            columnGroupShow: 'open',
            width: 130,
            valueFormatter: (p) => formatNumber(p.value)
          },
          {
            field: 'netProfit',
            headerName: 'LN C.ty mẹ',
            columnGroupShow: 'open',
            width: 140,
            valueFormatter: (p) => formatNumber(p.value),
            cellClass: 'font-bold'
          },
        ]
      },
    ]
  },

  // ===== 3. CASH FLOW STATEMENT =====
  {
    headerName: 'LƯU CHUYỂN TIỀN TỆ',
    groupId: 'cashFlowStatement',
    children: [
      {
        field: 'netCashFlow',
        headerName: 'Tổng LC tiền',
        columnGroupShow: 'closed',
        width: 140,
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-bold',
        cellClassRules: percentageCellClassRules
      },
      {
        field: 'netCashFlow',
        headerName: 'LC tiền thuần',
        columnGroupShow: 'open',
        width: 140,
        valueFormatter: (p) => formatNumber(p.value),
        cellClass: 'font-bold',
        cellClassRules: percentageCellClassRules
      },
      {
        field: 'operatingCashFlow',
        headerName: 'HĐ kinh doanh',
        columnGroupShow: 'open',
        width: 140,
        valueFormatter: (p) => formatNumber(p.value),
        cellClassRules: percentageCellClassRules
      },
      {
        field: 'investingCashFlow',
        headerName: 'HĐ đầu tư',
        columnGroupShow: 'open',
        width: 140,
        valueFormatter: (p) => formatNumber(p.value),
        cellClassRules: percentageCellClassRules
      },
      {
        field: 'financingCashFlow',
        headerName: 'HĐ tài chính',
        columnGroupShow: 'open',
        width: 140,
        valueFormatter: (p) => formatNumber(p.value),
        cellClassRules: percentageCellClassRules
      },
    ]
  },

  // ===== FILE DOWNLOAD =====
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
