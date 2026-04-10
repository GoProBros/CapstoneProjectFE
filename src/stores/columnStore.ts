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

type PersistedColumnPatch = {
  visible?: boolean;
  width?: number;
  order?: number;
};

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

const validColumnIds = new Set(Object.keys(defaultColumns));

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const normalizeColumnFromUnknown = (columnId: string, raw: unknown): ColumnConfig => {
  const fallback = defaultColumns[columnId];
  if (!fallback || !raw || typeof raw !== 'object') {
    return { ...fallback };
  }

  const candidate = raw as Partial<ColumnConfig>;
  return {
    field: fallback.field,
    visible: typeof candidate.visible === 'boolean' ? candidate.visible : fallback.visible,
    width: isFiniteNumber(candidate.width) ? candidate.width : fallback.width,
    order: isFiniteNumber(candidate.order) ? candidate.order : fallback.order,
  };
};

const sanitizeColumns = (columns: Record<string, ColumnConfig> | null | undefined): Record<string, ColumnConfig> => {
  const sanitized: Record<string, ColumnConfig> = {};

  Object.keys(defaultColumns).forEach((columnId) => {
    const raw = columns?.[columnId];
    sanitized[columnId] = normalizeColumnFromUnknown(columnId, raw);
  });

  return sanitized;
};

const isSameColumnConfig = (a: ColumnConfig | undefined, b: ColumnConfig | undefined): boolean => {
  if (!a || !b) return false;
  return (
    a.field === b.field &&
    a.visible === b.visible &&
    a.width === b.width &&
    a.order === b.order
  );
};

const isSameColumnsState = (a: Record<string, ColumnConfig>, b: Record<string, ColumnConfig>): boolean => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!isSameColumnConfig(a[key], b[key])) {
      return false;
    }
  }

  return true;
};

const buildPersistedColumnPatch = (columns: Record<string, ColumnConfig>): Record<string, PersistedColumnPatch> => {
  const compacted: Record<string, PersistedColumnPatch> = {};

  Object.keys(defaultColumns).forEach((columnId) => {
    const defaults = defaultColumns[columnId];
    const current = columns[columnId] ?? defaults;
    const patch: PersistedColumnPatch = {};

    if (current.visible !== defaults.visible) {
      patch.visible = current.visible;
    }
    if (current.width !== defaults.width) {
      patch.width = current.width;
    }
    if (current.order !== defaults.order) {
      patch.order = current.order;
    }

    if (Object.keys(patch).length > 0) {
      compacted[columnId] = patch;
    }
  });

  return compacted;
};

const mergeColumnsWithPatch = (patches: unknown): Record<string, ColumnConfig> => {
  const merged: Record<string, ColumnConfig> = sanitizeColumns(defaultColumns);

  if (!patches || typeof patches !== 'object') {
    return merged;
  }

  Object.entries(patches as Record<string, unknown>).forEach(([columnId, rawPatch]) => {
    if (!validColumnIds.has(columnId)) return;
    if (!rawPatch || typeof rawPatch !== 'object') return;

    const patch = rawPatch as PersistedColumnPatch;
    const base = merged[columnId] ?? defaultColumns[columnId];

    merged[columnId] = {
      field: base.field,
      visible: typeof patch.visible === 'boolean' ? patch.visible : base.visible,
      width: isFiniteNumber(patch.width) ? patch.width : base.width,
      order: isFiniteNumber(patch.order) ? patch.order : base.order,
    };
  });

  return merged;
};

export const useColumnStore = create<ColumnState>()(
  persist(
    (set) => ({
      columns: defaultColumns,
      isSidebarOpen: false,
      
      setColumns: (columns) =>
        set((state) => {
          const sanitizedColumns = sanitizeColumns(columns);
          if (isSameColumnsState(state.columns, sanitizedColumns)) {
            return state;
          }
          return { columns: sanitizedColumns };
        }),
      
      setColumnVisibility: (field, visible) =>
        set((state) => {
          if (!validColumnIds.has(field)) return state;
          const existing = state.columns[field] ?? defaultColumns[field];
          if (!existing || existing.visible === visible) return state;
          return {
            columns: {
              ...state.columns,
              [field]: { ...existing, visible },
            },
          };
        }),
      
      setColumnWidth: (field, width) =>
        set((state) => {
          if (!validColumnIds.has(field)) return state;
          const normalizedWidth = isFiniteNumber(width) ? width : undefined;
          const existing = state.columns[field] ?? defaultColumns[field];
          if (!existing || existing.width === normalizedWidth) return state;
          return {
            columns: {
              ...state.columns,
              [field]: { ...existing, width: normalizedWidth },
            },
          };
        }),
      
      setColumnOrder: (field, order) =>
        set((state) => {
          if (!validColumnIds.has(field)) return state;
          const existing = state.columns[field] ?? defaultColumns[field];
          if (!existing || existing.order === order) return state;
          return {
            columns: {
              ...state.columns,
              [field]: { ...existing, order },
            },
          };
        }),
      
      reorderColumns: (fields) =>
        set((state) => {
          const validFields = fields.filter((field) => validColumnIds.has(field));
          if (validFields.length === 0) return state;

          const newColumns = { ...state.columns };
          let changed = false;

          validFields.forEach((field, index) => {
            if (newColumns[field]) {
              if (newColumns[field].order === index) return;
              newColumns[field] = { ...newColumns[field], order: index };
              changed = true;
            }
          });

          return changed ? { columns: newColumns } : state;
        }),
      
      resetColumns: () =>
        set((state) => {
          if (isSameColumnsState(state.columns, defaultColumns)) return state;
          return { columns: defaultColumns };
        }),
      
      toggleColumnVisibility: (field) =>
        set((state) => {
          if (!validColumnIds.has(field)) return state;
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
          const validFields = fields.filter((field) => validColumnIds.has(field));
          if (validFields.length === 0) return state;

          const newColumns = { ...state.columns };
          let changed = false;

          validFields.forEach((field) => {
            if (newColumns[field]) {
              if (newColumns[field].visible === visible) return;
              newColumns[field] = { ...newColumns[field], visible };
              changed = true;
            }
          });

          return changed ? { columns: newColumns } : state;
        }),
      
      setSidebarOpen: (open) =>
        set((state) => (state.isSidebarOpen === open ? state : { isSidebarOpen: open })),
    }),
    {
      name: 'stock-screener-columns',
      version: 3,
      migrate: (persistedState: unknown, version: number): unknown => {
        const state = persistedState as {
          columns?: Record<string, unknown>;
          isSidebarOpen?: boolean;
        } | null;

        if (!state) {
          return state;
        }

        const mergedColumns = mergeColumnsWithPatch(state.columns);

        if (version < 2 && state?.columns) {
          // fBuyVol and fSellVol are now visible by default. Make sure old data reflects this
          // so the "ĐẦU TƯ NƯỚC NGOÀI" group header is never fully hidden on upgrade.
          if (mergedColumns.fBuyVol) mergedColumns.fBuyVol = { ...mergedColumns.fBuyVol, visible: true };
          if (mergedColumns.fSellVol) mergedColumns.fSellVol = { ...mergedColumns.fSellVol, visible: true };
        }

        return {
          ...state,
          columns: mergedColumns,
        };
      },
      merge: (persistedState: unknown, currentState: ColumnState): ColumnState => {
        const persisted = persistedState as {
          columns?: Record<string, unknown>;
          isSidebarOpen?: boolean;
        };
        const mergedColumns = mergeColumnsWithPatch(persisted?.columns);

        return {
          ...currentState,
          isSidebarOpen:
            typeof persisted?.isSidebarOpen === 'boolean'
              ? persisted.isSidebarOpen
              : currentState.isSidebarOpen,
          columns: mergedColumns,
        };
      },
      partialize: (state) => ({
        isSidebarOpen: state.isSidebarOpen,
        columns: buildPersistedColumnPatch(state.columns),
      }),
    }
  )
);
