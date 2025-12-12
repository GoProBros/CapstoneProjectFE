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
  setColumnVisibility: (field: string, visible: boolean) => void;
  setColumnWidth: (field: string, width: number) => void;
  setColumnOrder: (field: string, order: number) => void;
  reorderColumns: (fields: string[]) => void;
  resetColumns: () => void;
  toggleColumnVisibility: (field: string) => void;
  setGroupVisibility: (fields: string[], visible: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  saveLayoutToDB: () => Promise<void>;
  loadLayoutFromDB: () => Promise<void>;
}

// Default column configuration
const defaultColumns: Record<string, ColumnConfig> = {
  // THÔNG TIN TỔNG QUAN
  MA: { field: 'MA', visible: true, width: 100, order: 0 },
  NGANH: { field: 'NGANH', visible: true, width: 150, order: 1 },
  GIA: { field: 'GIA', visible: true, width: 100, order: 2 },
  THAYDOI: { field: 'THAYDOI', visible: true, width: 100, order: 3 },
  THANHKHOAN: { field: 'THANHKHOAN', visible: false, width: 120, order: 4 },
  volume: { field: 'volume', visible: true, width: 120, order: 5 },
  
  // PHÂN TÍCH KỸ THUẬT
  ThanhKhoanTB50: { field: 'ThanhKhoanTB50', visible: false, width: 140, order: 6 },
  volTB50: { field: 'volTB50', visible: false, width: 140, order: 7 },
  KL1KLTB: { field: 'KL1KLTB', visible: false, width: 100, order: 8 },
  bulVol: { field: 'bulVol', visible: false, width: 130, order: 9 },
  bearVol: { field: 'bearVol', visible: false, width: 130, order: 10 },
  NGANHAN: { field: 'NGANHAN', visible: true, width: 110, order: 11 },
  TRUNGHAN: { field: 'TRUNGHAN', visible: false, width: 110, order: 12 },
  DAIHAN: { field: 'DAIHAN', visible: false, width: 110, order: 13 },
  SUCMANH: { field: 'SUCMANH', visible: true, width: 120, order: 14 },
  RS: { field: 'RS', visible: true, width: 80, order: 15 },
  rrg: { field: 'rrg', visible: false, width: 100, order: 16 },
  signalSMC: { field: 'signalSMC', visible: false, width: 120, order: 17 },
  AiTrend: { field: 'AiTrend', visible: false, width: 110, order: 18 },
  pVWMA20: { field: 'pVWMA20', visible: false, width: 110, order: 19 },
  
  // CHỈ SỐ GIÁ
  ptop52W: { field: 'ptop52W', visible: false, width: 110, order: 20 },
  plow52W: { field: 'plow52W', visible: false, width: 110, order: 21 },
  pMA20: { field: 'pMA20', visible: false, width: 100, order: 22 },
  pMA50: { field: 'pMA50', visible: false, width: 100, order: 23 },
  pMA100: { field: 'pMA100', visible: false, width: 100, order: 24 },
  pMA200: { field: 'pMA200', visible: false, width: 100, order: 25 },
  
  // PHÂN TÍCH CƠ BẢN
  PE: { field: 'PE', visible: false, width: 80, order: 26 },
  ROE: { field: 'ROE', visible: false, width: 80, order: 27 },
  BLNR: { field: 'BLNR', visible: false, width: 80, order: 28 },
  diemBinhquan: { field: 'diemBinhquan', visible: true, width: 120, order: 29 },
  DG_bq: { field: 'DG_bq', visible: false, width: 100, order: 30 },
  skTaichinh: { field: 'skTaichinh', visible: false, width: 120, order: 31 },
  mohinhKinhdoanh: { field: 'mohinhKinhdoanh', visible: false, width: 120, order: 32 },
  hieuquaHoatdong: { field: 'hieuquaHoatdong', visible: false, width: 120, order: 33 },
  diemKythuat: { field: 'diemKythuat', visible: false, width: 100, order: 34 },
  BAT: { field: 'BAT', visible: false, width: 80, order: 35 },
  AIPredict20d: { field: 'AIPredict20d', visible: false, width: 130, order: 36 },
  
  // PHÂN TÍCH KỸ THUẬT NÂNG CAO
  candles: { field: 'candles', visible: false, width: 150, order: 37 },
  pattern: { field: 'pattern', visible: false, width: 150, order: 38 },
  vungcau: { field: 'vungcau', visible: false, width: 120, order: 39 },
  vungcung: { field: 'vungcung', visible: false, width: 120, order: 40 },
  hotro: { field: 'hotro', visible: false, width: 100, order: 41 },
  khangcu: { field: 'khangcu', visible: false, width: 100, order: 42 },
  kenhduoi: { field: 'kenhduoi', visible: false, width: 120, order: 43 },
  kenhtren: { field: 'kenhtren', visible: false, width: 120, order: 44 },
  cmtTA: { field: 'cmtTA', visible: false, width: 250, order: 45 },
  
  // CHIẾN LƯỢC
  CHIENLUOC: { field: 'CHIENLUOC', visible: false, width: 150, order: 46 },
  GIAMUA: { field: 'GIAMUA', visible: false, width: 100, order: 47 },
  GIABAN: { field: 'GIABAN', visible: false, width: 100, order: 48 },
  LAILO: { field: 'LAILO', visible: false, width: 100, order: 49 },
  NGAYMUA: { field: 'NGAYMUA', visible: false, width: 120, order: 50 },
  NGAYBAN: { field: 'NGAYBAN', visible: false, width: 120, order: 51 },
  TTDT: { field: 'TTDT', visible: false, width: 100, order: 52 },
  TTLN: { field: 'TTLN', visible: false, width: 100, order: 53 },
};

export const useColumnStore = create<ColumnState>()(
  persist(
    (set, get) => ({
      columns: defaultColumns,
      isSidebarOpen: false,
      
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
        set((state) => ({
          columns: {
            ...state.columns,
            [field]: {
              ...state.columns[field],
              visible: !state.columns[field].visible,
            },
          },
        })),
      
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
      
      saveLayoutToDB: async () => {
        const state = get();
        const layoutData = {
          columns: state.columns,
          savedAt: new Date().toISOString(),
        };
        
        try {
          // TODO: Replace with actual API call
          const response = await fetch('/api/column-layout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(layoutData),
          });
          
          if (!response.ok) {
            throw new Error('Failed to save layout');
          }
          
          console.log('Layout saved successfully:', layoutData);
        } catch (error) {
          console.error('Error saving layout:', error);
          // Fallback: save to localStorage
          localStorage.setItem('stock-screener-layout', JSON.stringify(layoutData));
          console.log('Layout saved to localStorage as fallback');
        }
      },
      
      loadLayoutFromDB: async () => {
        try {
          // TODO: Replace with actual API call
          const response = await fetch('/api/column-layout', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (!response.ok) {
            throw new Error('Failed to load layout');
          }
          
          const result = await response.json();
          
          if (result.success && result.data) {
            set({ columns: result.data.columns });
            console.log('Layout loaded successfully from DB:', result.data);
          } else {
            // Fallback: load from localStorage
            const savedLayout = localStorage.getItem('stock-screener-layout');
            if (savedLayout) {
              const layoutData = JSON.parse(savedLayout);
              set({ columns: layoutData.columns });
              console.log('Layout loaded from localStorage:', layoutData);
            } else {
              throw new Error('No saved layout found');
            }
          }
        } catch (error) {
          console.error('Error loading layout:', error);
          // Try localStorage as fallback
          const savedLayout = localStorage.getItem('stock-screener-layout');
          if (savedLayout) {
            const layoutData = JSON.parse(savedLayout);
            set({ columns: layoutData.columns });
            console.log('Layout loaded from localStorage fallback:', layoutData);
          } else {
            throw error;
          }
        }
      },
    }),
    {
      name: 'stock-screener-columns',
    }
  )
);
