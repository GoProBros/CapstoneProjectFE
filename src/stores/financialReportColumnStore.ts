import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─────────────────────────────────────────────────────────────────────────────
// Column Structure Definition
// Source of truth for the 3-level sidebar tree
// ─────────────────────────────────────────────────────────────────────────────

export interface FieldDef {
  field: string;
  label: string;
}

export interface SubGroupDef {
  groupId: string;
  label: string;
  fields: FieldDef[];
}

export interface TopGroupDef {
  groupId: string;
  label: string;
  locked?: boolean; // cannot be hidden (e.g. Kỳ báo cáo)
  subGroups?: SubGroupDef[];
  /** For top-level groups with direct fields (no sub-groups) */
  fields?: FieldDef[];
}

export const FINANCIAL_COLUMN_STRUCTURE: TopGroupDef[] = [
  {
    groupId: 'kyBaoCao',
    label: 'Kỳ báo cáo',
    locked: true,
    fields: [
      { field: 'ticker', label: 'Mã' },
      { field: 'year', label: 'Năm' },
      { field: 'periodLabel', label: 'Kỳ' },
    ],
  },
  {
    groupId: 'balanceSheet',
    label: 'Cân đối kế toán',
    subGroups: [
      {
        groupId: 'shortTermAssets',
        label: 'Tài sản ngắn hạn',
        fields: [
          { field: 'cash', label: 'Tiền mặt' },
          { field: 'financialInvestmentsShortTerm', label: 'Đầu tư tài chính' },
          { field: 'receivablesShortTerm', label: 'Phải thu' },
          { field: 'inventories', label: 'Hàng tồn kho' },
          { field: 'otherAssetsShortTerm', label: 'Tài sản khác' },
        ],
      },
      {
        groupId: 'longTermAssets',
        label: 'Tài sản dài hạn',
        fields: [
          { field: 'receivablesLongTerm', label: 'Phải thu' },
          { field: 'fixedAssets', label: 'Tài sản cố định' },
          { field: 'investmentProperty', label: 'BĐS đầu tư' },
          { field: 'longTermAssetsInProgress', label: 'Tài sản dở dang' },
          { field: 'financialInvestmentsLongTerm', label: 'Đầu tư tài chính' },
          { field: 'otherAssetsLongTerm', label: 'Tài sản khác' },
        ],
      },
      {
        groupId: 'bankAssets',
        label: 'Tài sản ngân hàng',
        fields: [
          { field: 'depositsAtCentralBank', label: 'Tiền gửi NHNN' },
          { field: 'depositsAtOtherCreditInstitutions', label: 'Tiền gửi TCTD' },
          { field: 'investmentSecurities', label: 'CK đầu tư' },
          { field: 'loansToCustomers', label: 'Cho vay KH' },
          { field: 'bankOtherAssets', label: 'Tài sản khác' },
          { field: 'tradingSecurities', label: 'CK kinh doanh' },
        ],
      },
      {
        groupId: 'shortTermFinancialAssets',
        label: 'TS tài chính ngắn hạn',
        fields: [
          { field: 'shortTermFinancialAssetsCash', label: 'Tiền (CK)' },
          { field: 'shortTermFinancialAssetsLoans', label: 'Cho vay (CK)' },
          { field: 'shortTermFinancialAssetsOther', label: 'Khác (CK)' },
        ],
      },
      {
        groupId: 'tradingAndCapitalAssets',
        label: 'TS kinh doanh & vốn',
        fields: [
          { field: 'heldToMaturity', label: 'Giữ đến đáo hạn' },
          { field: 'availableForSale', label: 'Sẵn sàng bán' },
          { field: 'fvtpl', label: 'FVTPL' },
        ],
      },
      {
        groupId: 'liabilities',
        label: 'Nợ phải trả',
        fields: [
          { field: 'totalLiabilities', label: 'Tổng nợ' },
          { field: 'shortTermLiabilities', label: 'Ngắn hạn' },
          { field: 'longTermLiabilities', label: 'Dài hạn' },
        ],
      },
      {
        groupId: 'borrowings',
        label: 'Nợ vay',
        fields: [
          { field: 'shortTermBorrowings', label: 'Ngắn hạn' },
          { field: 'longTermBorrowings', label: 'Dài hạn' },
        ],
      },
      {
        groupId: 'equity',
        label: 'Vốn chủ sở hữu',
        fields: [
          { field: 'totalEquity', label: 'Tổng VCSH' },
          { field: 'contributedCapital', label: 'Vốn góp' },
          { field: 'retainedEarnings', label: 'LN giữ lại' },
          { field: 'treasuryShares', label: 'Cổ phiếu quỹ' },
          { field: 'otherCapital', label: 'Vốn khác' },
        ],
      },
    ],
  },
  {
    groupId: 'incomeStatement',
    label: 'Kết quả kinh doanh',
    subGroups: [
      {
        groupId: 'bankOperatingIncome',
        label: 'Thu nhập HĐ (Ngân hàng)',
        fields: [
          { field: 'netInterestIncome', label: 'TN lãi thuần' },
          { field: 'bankOtherIncome', label: 'TN khác' },
          { field: 'serviceFeeIncome', label: 'TN dịch vụ' },
          { field: 'tradingIncome', label: 'TN tự doanh' },
        ],
      },
      {
        groupId: 'insuranceBusiness',
        label: 'Kinh doanh bảo hiểm',
        fields: [
          { field: 'insuranceNetOperatingRevenue', label: 'DT hoạt động' },
          { field: 'insuranceOperatingExpenses', label: 'CP hoạt động' },
          { field: 'insuranceOperatingProfit', label: 'LN hoạt động' },
        ],
      },
      {
        groupId: 'securitiesRevenue',
        label: 'DT chứng khoán',
        fields: [
          { field: 'brokerageAndCustodyRevenue', label: 'Môi giới' },
          { field: 'lendingRevenue', label: 'Cho vay' },
          { field: 'tradingAndCapitalRevenue', label: 'Tự doanh & vốn' },
          { field: 'investmentBankingRevenue', label: 'NH đầu tư' },
        ],
      },
      {
        groupId: 'grossProfit',
        label: 'Lợi nhuận gộp',
        fields: [
          { field: 'netRevenue', label: 'DT thuần' },
          { field: 'costOfGoodsSold', label: 'Giá vốn' },
          { field: 'grossProfit', label: 'LN gộp' },
        ],
      },
      {
        groupId: 'expenses',
        label: 'Chi phí kinh doanh',
        fields: [
          { field: 'interestExpenses', label: 'CP lãi vay' },
          { field: 'sellingExpenses', label: 'CP bán hàng' },
          { field: 'financialExpenses', label: 'CP tài chính' },
          { field: 'managementExpenses', label: 'CP quản lý' },
        ],
      },
      {
        groupId: 'profitBeforeTax',
        label: 'LN trước thuế',
        fields: [
          { field: 'operatingProfit', label: 'LN kinh doanh' },
          { field: 'financialProfit', label: 'LN tài chính' },
          { field: 'shareProfitOfAssociates', label: 'LN liên doanh' },
          { field: 'otherProfit', label: 'LN khác' },
          { field: 'profitBeforeTax', label: 'LN trước thuế' },
        ],
      },
      {
        groupId: 'profitAfterTaxAndAFS',
        label: 'LN sau thuế & AFS',
        fields: [
          { field: 'profitAfterTaxAndAfs', label: 'LN sau thuế AFS' },
          { field: 'netProfit', label: 'LN cổ đông' },
          { field: 'afsGains', label: 'Lãi AFS' },
        ],
      },
      {
        groupId: 'parentCompanyNetProfit',
        label: 'LN sau thuế CTM',
        fields: [
          { field: 'corporateIncomeTax', label: 'Thuế TNDN' },
          { field: 'minorityInterests', label: 'Lợi ích CĐTS' },
        ],
      },
    ],
  },
  {
    groupId: 'cashFlowStatement',
    label: 'Lưu chuyển tiền tệ',
    fields: [
      { field: 'netCashFlow', label: 'LC tiền thuần' },
      { field: 'operatingCashFlow', label: 'HĐ kinh doanh' },
      { field: 'investingCashFlow', label: 'HĐ đầu tư' },
      { field: 'financingCashFlow', label: 'HĐ tài chính' },
    ],
  },
  {
    groupId: 'documents',
    label: 'Tài liệu',
    fields: [
      { field: 'fileUrl', label: 'Tải xuống' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Derive default states from structure
// ─────────────────────────────────────────────────────────────────────────────

/** Build default groups map: all groups + sub-groups → true */
const buildDefaultGroups = (): Record<string, boolean> => {
  const map: Record<string, boolean> = {};
  for (const top of FINANCIAL_COLUMN_STRUCTURE) {
    map[top.groupId] = true;
    if (top.subGroups) {
      for (const sub of top.subGroups) {
        map[sub.groupId] = true;
      }
    }
  }
  return map;
};

/** Build default fields map: all named fields → true */
const buildDefaultFields = (): Record<string, boolean> => {
  const map: Record<string, boolean> = {};
  for (const top of FINANCIAL_COLUMN_STRUCTURE) {
    const allFields = [
      ...(top.fields ?? []),
      ...(top.subGroups?.flatMap((s) => s.fields) ?? []),
    ];
    for (const f of allFields) {
      map[f.field] = true;
    }
  }
  return map;
};

const defaultGroups = buildDefaultGroups();
const defaultFields = buildDefaultFields();

// ─────────────────────────────────────────────────────────────────────────────
// Zustand Store
// ─────────────────────────────────────────────────────────────────────────────

export interface FinancialColumnGroupState {
  /** groupId (top-level or sub-group) → visible */
  groups: Record<string, boolean>;
  /** field name → visible */
  fields: Record<string, boolean>;
  isSidebarOpen: boolean;

  toggleGroup: (groupId: string) => void;
  setGroupVisible: (groupId: string, visible: boolean) => void;
  /** Toggle all fields inside a sub-group at once */
  setSubGroupFieldsVisible: (subGroupId: string, visible: boolean) => void;
  toggleField: (field: string) => void;
  setFieldVisible: (field: string, visible: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  resetAll: () => void;
}

export const useFinancialReportColumnStore = create<FinancialColumnGroupState>()(
  persist(
    (set) => ({
      groups: defaultGroups,
      fields: defaultFields,
      isSidebarOpen: false,

      toggleGroup: (groupId) =>
        set((state) => ({
          groups: { ...state.groups, [groupId]: !state.groups[groupId] },
        })),

      setGroupVisible: (groupId, visible) =>
        set((state) => ({
          groups: { ...state.groups, [groupId]: visible },
        })),

      setSubGroupFieldsVisible: (subGroupId, visible) => {
        // Find the sub-group in structure to get its fields
        let targetFields: string[] = [];
        for (const top of FINANCIAL_COLUMN_STRUCTURE) {
          const sub = top.subGroups?.find((s) => s.groupId === subGroupId);
          if (sub) {
            targetFields = sub.fields.map((f) => f.field);
            break;
          }
          // Also handle top-level groups with direct fields
          if (top.groupId === subGroupId && top.fields) {
            targetFields = top.fields.map((f) => f.field);
            break;
          }
        }
        set((state) => {
          const newFields = { ...state.fields };
          for (const f of targetFields) {
            newFields[f] = visible;
          }
          return { fields: newFields };
        });
      },

      toggleField: (field) =>
        set((state) => ({
          fields: { ...state.fields, [field]: !state.fields[field] },
        })),

      setFieldVisible: (field, visible) =>
        set((state) => ({
          fields: { ...state.fields, [field]: visible },
        })),

      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      resetAll: () => set({ groups: defaultGroups, fields: defaultFields }),
    }),
    {
      name: 'financial-report-columns',
      version: 2, // bump version due to schema change (added fields)
    }
  )
);
