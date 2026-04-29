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

const indicatorPercentCellStyle = (params: { value?: unknown }) => {
  if (typeof params.value !== 'number' || Number.isNaN(params.value)) {
    return undefined;
  }

  if (params.value > 0) {
    return { color: '#10b981' };
  }

  if (params.value < 0) {
    return { color: '#ef4444' };
  }

  return undefined;
};

const formatIndicatorPercent = (num: number): string => {
  if (num == null || num === 0) return '';
  return `${(num * 100).toFixed(1)}%`;
};

const formatIndicatorPercentSigned = (num: number): string => {
  if (num == null || num === 0) return '0.0%';

  const percentValue = num * 100;
  if (percentValue > 0) {
    return `↑ +${percentValue.toFixed(1)}%`;
  }

  if (percentValue < 0) {
    return `↓ ${percentValue.toFixed(1)}%`;
  }

  return '0.0%';
};

const formatIndicatorRatio = (num: number): string => {
  if (num == null || num === 0) return '';
  return num.toFixed(2);
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
export const getColumnDefs = (
  visibleGroups?: Record<string, boolean>,
  visibleFields?: Record<string, boolean>,
): (ColDef | ColGroupDef)[] => {
  /**
   * Returns true when a group should be shown.
   * If visibleGroups is undefined (no store connected), all groups are shown.
   */
  const isVisible = (groupId: string) =>
    visibleGroups ? (visibleGroups[groupId] ?? true) : true;

  /**
   * Returns true when a column field should be HIDDEN.
   * visibleFields[field] === false → hide.
   * Missing entry (undefined) → show.
   */
  const fieldHide = (field: string): boolean =>
    visibleFields ? visibleFields[field] === false : false;

  // Build the full column definitions array, filtering out hidden groups
  const defs: (ColDef | ColGroupDef)[] = [
    // ===== KỲ BÁO CÁO (Always visible - Pinned) =====
    {
      headerName: 'KỲ BÁO CÁO',
      groupId: 'kyBaoCao',
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
        hide: fieldHide('year'),
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
        hide: fieldHide('periodLabel'),
        valueFormatter: periodFormatter,
        cellRenderer: (params: any) => {
          if (params.data?.isTickerHeader) return '';
          return params.data?.periodLabel || '';
        }
      },
    ],
  },

  // ===== 1. BALANCE SHEET =====
  ...(!isVisible('balanceSheet') ? [] : [
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
  ] as (ColDef | ColGroupDef)[]),

  // ===== 2. INCOME STATEMENT =====
  ...(!isVisible('incomeStatement') ? [] : [
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
            colId: 'grossProfit_summary',
            headerName: 'LN gộp',
            columnGroupShow: 'closed',
            width: 160,
            valueGetter: (params) => params.data?.grossProfit ?? 0,
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
            colId: 'profitBeforeTax_summary',
            headerName: 'LN trước thuế',
            columnGroupShow: 'closed',
            width: 150,
            valueGetter: (params) => params.data?.profitBeforeTax ?? 0,
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
        ]
      },
    ]
  },
  ] as (ColDef | ColGroupDef)[]),

  // ===== 3. CASH FLOW STATEMENT =====
  ...(!isVisible('cashFlowStatement') ? [] : [
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
  ] as (ColDef | ColGroupDef)[]),

  // ===== 4. INDICATORS =====
  ...(!isVisible('indicator') ? [] : [
  {
    headerName: 'CHỈ SỐ',
    groupId: 'indicator',
    children: [
      {
        headerName: 'Sinh lời',
        groupId: 'profitability',
        children: [
          { colId: 'profitability_summary', headerName: 'ROE', columnGroupShow: 'closed', width: 110, valueGetter: (p) => p.data?.profitability_roe, valueFormatter: (p) => formatIndicatorPercent(p.value), cellStyle: indicatorPercentCellStyle, cellClass: 'font-semibold' },
          { field: 'profitability_grossMargin', headerName: 'Biên LN gộp', columnGroupShow: 'open', width: 120, valueFormatter: (p) => formatIndicatorPercent(p.value), cellStyle: indicatorPercentCellStyle },
          { field: 'profitability_operatingProfitMargin', headerName: 'Biên LN HĐ', columnGroupShow: 'open', width: 120, valueFormatter: (p) => formatIndicatorPercent(p.value), cellStyle: indicatorPercentCellStyle },
          { field: 'profitability_netMargin', headerName: 'Biên ròng', columnGroupShow: 'open', width: 120, valueFormatter: (p) => formatIndicatorPercent(p.value), cellStyle: indicatorPercentCellStyle },
          { field: 'profitability_roe', headerName: 'ROE', columnGroupShow: 'open', width: 100, valueFormatter: (p) => formatIndicatorPercent(p.value), cellStyle: indicatorPercentCellStyle },
          { field: 'profitability_roa', headerName: 'ROA', columnGroupShow: 'open', width: 100, valueFormatter: (p) => formatIndicatorPercent(p.value), cellStyle: indicatorPercentCellStyle },
          { field: 'profitability_returnOnFixedAssets', headerName: 'Lợi tức TSCĐ', columnGroupShow: 'open', width: 140, valueFormatter: (p) => formatIndicatorPercent(p.value), cellStyle: indicatorPercentCellStyle },
        ],
      },
      {
        headerName: 'Thanh khoản & Đòn bẩy',
        groupId: 'liquidityAndSolvency',
        children: [
          { colId: 'liquidityAndSolvency_summary', headerName: 'Current Ratio', columnGroupShow: 'closed', width: 130, valueGetter: (p) => p.data?.liquidityAndSolvency_currentRatio, valueFormatter: (p) => formatIndicatorRatio(p.value), cellClass: 'font-semibold' },
          { field: 'liquidityAndSolvency_currentRatio', headerName: 'Current Ratio', columnGroupShow: 'open', width: 120, valueFormatter: (p) => formatIndicatorRatio(p.value) },
          { field: 'liquidityAndSolvency_quickRatio', headerName: 'Quick Ratio', columnGroupShow: 'open', width: 120, valueFormatter: (p) => formatIndicatorRatio(p.value) },
          { field: 'liquidityAndSolvency_cashRatio', headerName: 'Cash Ratio', columnGroupShow: 'open', width: 120, valueFormatter: (p) => formatIndicatorRatio(p.value) },
          { field: 'liquidityAndSolvency_debtToEquity', headerName: 'Nợ/Vốn', columnGroupShow: 'open', width: 120, valueFormatter: (p) => formatIndicatorRatio(p.value) },
          { field: 'liquidityAndSolvency_debtRatio', headerName: 'Tỷ lệ nợ', columnGroupShow: 'open', width: 120, valueFormatter: (p) => formatIndicatorPercent(p.value), cellStyle: indicatorPercentCellStyle },
          { field: 'liquidityAndSolvency_longTermDebtRatio', headerName: 'Nợ dài hạn/Tổng', columnGroupShow: 'open', width: 140, valueFormatter: (p) => formatIndicatorPercent(p.value), cellStyle: indicatorPercentCellStyle },
          { field: 'liquidityAndSolvency_interestCoverageRatio', headerName: 'Khả năng trả lãi', columnGroupShow: 'open', width: 160, valueFormatter: (p) => formatIndicatorRatio(p.value) },
          { field: 'liquidityAndSolvency_retainedEarningsToTotalAssets', headerName: 'LN giữ lại/Tổng TS', columnGroupShow: 'open', width: 160, valueFormatter: (p) => formatIndicatorPercent(p.value), cellStyle: indicatorPercentCellStyle },
        ],
      },
      {
        headerName: 'Hiệu quả',
        groupId: 'efficiency',
        children: [
          { colId: 'efficiency_summary', headerName: 'Vòng quay TTS', columnGroupShow: 'closed', width: 130, valueGetter: (p) => p.data?.efficiency_totalAssetTurnover, valueFormatter: (p) => formatIndicatorRatio(p.value), cellClass: 'font-semibold' },
          { field: 'efficiency_totalAssetTurnover', headerName: 'Vòng quay TTS', columnGroupShow: 'open', width: 130, valueFormatter: (p) => formatIndicatorRatio(p.value) },
          { field: 'efficiency_inventoryTurnover', headerName: 'Vòng quay H.T.K', columnGroupShow: 'open', width: 130, valueFormatter: (p) => formatIndicatorRatio(p.value) },
        ],
      },
      {
        headerName: 'Tăng trưởng',
        groupId: 'growth',
        children: [
          { colId: 'growth_summary', headerName: 'Tăng trưởng DT', columnGroupShow: 'closed', width: 140, valueGetter: (p) => p.data?.growth_revenueGrowth, valueFormatter: (p) => formatIndicatorPercentSigned(p.value), cellStyle: indicatorPercentCellStyle, cellClass: 'font-semibold' },
          { field: 'growth_comparisonType', headerName: 'So sánh', columnGroupShow: 'open', width: 120 },
          { field: 'growth_grossProfitGrowth', headerName: 'Tăng trưởng LN gộp', columnGroupShow: 'open', width: 150, valueFormatter: (p) => formatIndicatorPercentSigned(p.value), cellStyle: indicatorPercentCellStyle },
          { field: 'growth_revenueGrowth', headerName: 'Tăng trưởng doanh thu', columnGroupShow: 'open', width: 150, valueFormatter: (p) => formatIndicatorPercentSigned(p.value), cellStyle: indicatorPercentCellStyle },
        ],
      },
      {
        headerName: 'Ngân hàng',
        groupId: 'bankSpecific',
        children: [
          { colId: 'bankSpecific_summary', headerName: 'NIM', columnGroupShow: 'closed', width: 110, valueGetter: (p) => p.data?.bankSpecific_nim, valueFormatter: (p) => formatIndicatorPercent(p.value), cellStyle: indicatorPercentCellStyle, cellClass: 'font-semibold' },
          { field: 'bankSpecific_nim', headerName: 'NIM', columnGroupShow: 'open', width: 110, valueFormatter: (p) => formatIndicatorPercent(p.value), cellStyle: indicatorPercentCellStyle },
          { field: 'bankSpecific_nonInterestIncomeRatio', headerName: 'Tỷ lệ TN phi lãi', columnGroupShow: 'open', width: 150, valueFormatter: (p) => formatIndicatorPercent(p.value), cellStyle: indicatorPercentCellStyle },
        ],
      },
      {
        headerName: 'Dòng tiền (CN)',
        groupId: 'cashFlow',
        children: [
          { colId: 'cashFlow_summary', headerName: 'Dòng tiền/HNST', columnGroupShow: 'closed', width: 150, valueGetter: (p) => p.data?.cashFlow_operatingCashFlowToNetProfit, valueFormatter: (p) => formatIndicatorRatio(p.value), cellClass: 'font-semibold' },
          { field: 'cashFlow_operatingCashFlowToNetProfit', headerName: 'Dòng tiền/HNST', columnGroupShow: 'open', width: 150, valueFormatter: (p) => formatIndicatorRatio(p.value) },
        ],
      },
    ],
  },
  ] as (ColDef | ColGroupDef)[]),

  // ===== FILE DOWNLOAD =====
  ...(!isVisible('documents') ? [] : [
  {
    headerName: 'TÀI LIỆU',
    groupId: 'documents',
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
  ] as (ColDef | ColGroupDef)[]),
  ];

  // ── Filter hidden sub-groups out of defs (removes column group headers) ────
  // This must run BEFORE applyHide so field-level hide is applied on survivors.
  const applyGroupFilter = (columns: (ColDef | ColGroupDef)[]): (ColDef | ColGroupDef)[] =>
    columns
      .filter((col) => {
        const groupId = (col as ColGroupDef).groupId;
        // Keep columns with no groupId; keep groups whose groupId is visible
        return !groupId || isVisible(groupId);
      })
      .map((col) => {
        if ('children' in col && Array.isArray((col as ColGroupDef).children)) {
          return {
            ...col,
            children: applyGroupFilter(
              (col as ColGroupDef).children as (ColDef | ColGroupDef)[]
            ),
          };
        }
        return col;
      });

  const filteredDefs = visibleGroups ? applyGroupFilter(defs) : defs;

  // ── Apply per-field hide after building the full defs ─────────────────────
  if (visibleFields) {
    const applyHide = (columns: (ColDef | ColGroupDef)[]): (ColDef | ColGroupDef)[] =>
      columns.map((col) => {
        if ('children' in col) {
          return { ...col, children: applyHide(col.children as (ColDef | ColGroupDef)[]) };
        }
        const c = col as ColDef;
        if (c.field && visibleFields[c.field] === false) {
          return { ...c, hide: true };
        }
        return c;
      });
    return applyHide(filteredDefs);
  }

  return filteredDefs;
};

/**
 * Default column definition
 */
export const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  floatingFilter: true,
};
