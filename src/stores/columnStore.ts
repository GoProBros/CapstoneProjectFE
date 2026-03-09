import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColumnConfig {
  field: string;
  visible: boolean;
  width?: number;
  order: number;
}

export interface ColumnState {
  columns: Record<string, ColumnConfig>;
  isSidebarOpen: boolean;
  setColumns: (columns: Record<string, ColumnConfig>) => void;
  setColumnVisibility: (field: string, visible: boolean) => void;
  setColumnWidth: (field: string, width: number) => void;
  setColumnOrder: (field: string, order: number) => void;
  reorderColumns: (fields: string[]) => void;
  resetColumns: () => void;
  toggleColumnVisibility: (field: string) => void;
  setGroupVisibility: (fields: string[], visible: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
}

// Default column configuration - SSI STREAM MARKET DATA
const defaultColumns: Record<string, ColumnConfig> = {
  // THÔNG TIN GIAO DỊCH (SSI Stream - visible by default)
  ticker: { field: 'ticker', visible: true, width: 80, order: 0 },
  ceilingPrice: { field: 'ceilingPrice', visible: true, width: 80, order: 1 },
  floorPrice: { field: 'floorPrice', visible: true, width: 80, order: 2 },
  referencePrice: { field: 'referencePrice', visible: true, width: 80, order: 3 },
  
  // Bên mua
  bidPrice3: { field: 'bidPrice3', visible: true, width: 85, order: 4 },
  bidVol3: { field: 'bidVol3', visible: true, width: 100, order: 5 },
  bidPrice2: { field: 'bidPrice2', visible: true, width: 85, order: 6 },
  bidVol2: { field: 'bidVol2', visible: true, width: 100, order: 7 },
  bidPrice1: { field: 'bidPrice1', visible: true, width: 85, order: 8 },
  bidVol1: { field: 'bidVol1', visible: true, width: 100, order: 9 },
  
  // Khớp lệnh
  lastPrice: { field: 'lastPrice', visible: true, width: 95, order: 10 },
  lastVol: { field: 'lastVol', visible: true, width: 110, order: 11 },
  change: { field: 'change', visible: true, width: 80, order: 12 },
  ratioChange: { field: 'ratioChange', visible: true, width: 90, order: 13 },
  
  // Bên bán
  askPrice1: { field: 'askPrice1', visible: true, width: 85, order: 14 },
  askVol1: { field: 'askVol1', visible: true, width: 100, order: 15 },
  askPrice2: { field: 'askPrice2', visible: true, width: 85, order: 16 },
  askVol2: { field: 'askVol2', visible: true, width: 100, order: 17 },
  askPrice3: { field: 'askPrice3', visible: true, width: 85, order: 18 },
  askVol3: { field: 'askVol3', visible: true, width: 100, order: 19 },
  
  // Tổng
  totalVol: { field: 'totalVol', visible: true, width: 120, order: 20 },
  highest: { field: 'highest', visible: true, width: 85, order: 21 },
  lowest: { field: 'lowest', visible: true, width: 85, order: 22 },
  avgPrice: { field: 'avgPrice', visible: true, width: 85, order: 23 },
  
  // Thông tin khác (hidden by default)
  totalVal: { field: 'totalVal', visible: false, width: 120, order: 24 },
  side: { field: 'side', visible: false, width: 70, order: 25 },
  tradingSession: { field: 'tradingSession', visible: false, width: 80, order: 26 },
  tradingStatus: { field: 'tradingStatus', visible: false, width: 100, order: 27 },
  totalBuyVol: { field: 'totalBuyVol', visible: false, width: 120, order: 28 },
  totalSellVol: { field: 'totalSellVol', visible: false, width: 120, order: 29 },

  // ĐẦU TƯ NƯỚC NGOÀI
  fBuyVol: { field: 'fBuyVol', visible: true, width: 120, order: 30 },
  fSellVol: { field: 'fSellVol', visible: true, width: 120, order: 31 },
  fBuyVal: { field: 'fBuyVal', visible: false, width: 130, order: 32 },
  fSellVal: { field: 'fSellVal', visible: false, width: 130, order: 33 },
  totalRoom: { field: 'totalRoom', visible: false, width: 120, order: 34 },
  currentRoom: { field: 'currentRoom', visible: false, width: 130, order: 35 },
};

export const useColumnStore = create<ColumnState>()(
  persist(
    (set, get) => ({
      columns: defaultColumns,
      isSidebarOpen: false,
      
      setColumns: (columns) => set({ columns }),
      
      setColumnVisibility: (field, visible) =>
        set((state) => ({
          columns: {
            ...state.columns,
            [field]: { ...state.columns[field], visible },
          },
        })),
      
      setColumnWidth: (field, width) =>
        set((state) => ({
          columns: {
            ...state.columns,
            [field]: { ...state.columns[field], width },
          },
        })),
      
      setColumnOrder: (field, order) =>
        set((state) => ({
          columns: {
            ...state.columns,
            [field]: { ...state.columns[field], order },
          },
        })),
      
      reorderColumns: (fields) =>
        set((state) => {
          const newColumns = { ...state.columns };
          fields.forEach((field, index) => {
            if (newColumns[field]) {
              newColumns[field] = { ...newColumns[field], order: index };
            }
          });
          return { columns: newColumns };
        }),
      
      resetColumns: () => set({ columns: defaultColumns }),
      
      toggleColumnVisibility: (field) =>
        set((state) => {
          const existing = state.columns[field] ?? defaultColumns[field];
          if (!existing) return state;
          return {
            columns: {
              ...state.columns,
              [field]: { ...existing, visible: !existing.visible },
            },
          };
        }),
      
      setGroupVisibility: (fields, visible) =>
        set((state) => {
          const newColumns = { ...state.columns };
          fields.forEach((field) => {
            if (newColumns[field]) {
              newColumns[field] = { ...newColumns[field], visible };
            }
          });
          return { columns: newColumns };
        }),
      
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    }),
    {
      name: 'stock-screener-columns',
      version: 2,
      migrate: (persistedState: unknown, version: number): unknown => {
        const state = persistedState as { columns?: Record<string, ColumnConfig> } | null;
        if (version < 2 && state?.columns) {
          // fBuyVol and fSellVol are now visible by default. Make sure old data reflects this
          // so the "ĐẦU TƯ NƯỚC NGOÀI" group header is never fully hidden on upgrade.
          if (state.columns.fBuyVol) state.columns.fBuyVol = { ...state.columns.fBuyVol, visible: true };
          if (state.columns.fSellVol) state.columns.fSellVol = { ...state.columns.fSellVol, visible: true };
        }
        return state;
      },
      merge: (persistedState: unknown, currentState: ColumnState): ColumnState => {
        const persisted = persistedState as Partial<ColumnState>;
        const persistedColumns = persisted?.columns ?? {};
        // Only restore persisted settings for columns that still exist in defaultColumns.
        // This discards stale entries from old versions of the store so that
        // columns removed from defaultColumns are never force-hidden in AG Grid.
        const filteredColumns = Object.fromEntries(
          Object.entries(persistedColumns).filter(([key]) => key in defaultColumns)
        );
        return {
          ...currentState,
          ...persisted,
          columns: {
            ...defaultColumns,
            ...filteredColumns,
          },
        };
      },
    }
  )
);
