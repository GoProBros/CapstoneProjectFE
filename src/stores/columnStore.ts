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
  saveLayoutToDB: (columnWidths?: any[], symbols?: string[], name?: string) => Promise<void>;
  loadLayoutFromDB: () => Promise<any>;
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
  
  // PHÂN TÍCH KỸ THUẬT (hidden by default)
  ThanhKhoanTB50: { field: 'ThanhKhoanTB50', visible: false, width: 140, order: 28 },
  volTB50: { field: 'volTB50', visible: false, width: 140, order: 29 },
  KL1KLTB: { field: 'KL1KLTB', visible: false, width: 100, order: 30 },
  bulVol: { field: 'bulVol', visible: false, width: 130, order: 31 },
  bearVol: { field: 'bearVol', visible: false, width: 130, order: 32 },
  NGANHAN: { field: 'NGANHAN', visible: false, width: 110, order: 33 },
  TRUNGHAN: { field: 'TRUNGHAN', visible: false, width: 110, order: 34 },
  DAIHAN: { field: 'DAIHAN', visible: false, width: 110, order: 35 },
  SUCMANH: { field: 'SUCMANH', visible: false, width: 120, order: 36 },
  RS: { field: 'RS', visible: false, width: 80, order: 37 },
  rrg: { field: 'rrg', visible: false, width: 100, order: 38 },
  signalSMC: { field: 'signalSMC', visible: false, width: 120, order: 39 },
  AiTrend: { field: 'AiTrend', visible: false, width: 110, order: 40 },
  pVWMA20: { field: 'pVWMA20', visible: false, width: 110, order: 41 },
  
  // CHỈ SỐ GIÁ
  ptop52W: { field: 'ptop52W', visible: false, width: 110, order: 42 },
  plow52W: { field: 'plow52W', visible: false, width: 110, order: 43 },
  pMA20: { field: 'pMA20', visible: false, width: 100, order: 44 },
  pMA50: { field: 'pMA50', visible: false, width: 100, order: 45 },
  pMA100: { field: 'pMA100', visible: false, width: 100, order: 46 },
  pMA200: { field: 'pMA200', visible: false, width: 100, order: 47 },
  
  // PHÂN TÍCH CƠ BẢN
  PE: { field: 'PE', visible: false, width: 80, order: 48 },
  ROE: { field: 'ROE', visible: false, width: 80, order: 49 },
  BLNR: { field: 'BLNR', visible: false, width: 80, order: 50 },
  diemBinhquan: { field: 'diemBinhquan', visible: false, width: 120, order: 51 },
  DG_bq: { field: 'DG_bq', visible: false, width: 100, order: 52 },
  skTaichinh: { field: 'skTaichinh', visible: false, width: 120, order: 53 },
  mohinhKinhdoanh: { field: 'mohinhKinhdoanh', visible: false, width: 120, order: 54 },
  hieuquaHoatdong: { field: 'hieuquaHoatdong', visible: false, width: 120, order: 55 },
  diemKythuat: { field: 'diemKythuat', visible: false, width: 100, order: 56 },
  BAT: { field: 'BAT', visible: false, width: 80, order: 57 },
  AIPredict20d: { field: 'AIPredict20d', visible: false, width: 130, order: 58 },
  
  // PHÂN TÍCH KỸ THUẬT NÂNG CAO
  candles: { field: 'candles', visible: false, width: 150, order: 59 },
  pattern: { field: 'pattern', visible: false, width: 150, order: 60 },
  vungcau: { field: 'vungcau', visible: false, width: 120, order: 61 },
  vungcung: { field: 'vungcung', visible: false, width: 120, order: 62 },
  hotro: { field: 'hotro', visible: false, width: 100, order: 63 },
  khangcu: { field: 'khangcu', visible: false, width: 100, order: 64 },
  kenhduoi: { field: 'kenhduoi', visible: false, width: 120, order: 65 },
  kenhtren: { field: 'kenhtren', visible: false, width: 120, order: 66 },
  cmtTA: { field: 'cmtTA', visible: false, width: 250, order: 67 },
  
  // CHIẾN LƯỢC
  CHIENLUOC: { field: 'CHIENLUOC', visible: false, width: 150, order: 68 },
  GIAMUA: { field: 'GIAMUA', visible: false, width: 100, order: 69 },
  GIABAN: { field: 'GIABAN', visible: false, width: 100, order: 70 },
  LAILO: { field: 'LAILO', visible: false, width: 100, order: 71 },
  NGAYMUA: { field: 'NGAYMUA', visible: false, width: 120, order: 72 },
  NGAYBAN: { field: 'NGAYBAN', visible: false, width: 120, order: 73 },
  TTDT: { field: 'TTDT', visible: false, width: 100, order: 74 },
  TTLN: { field: 'TTLN', visible: false, width: 100, order: 75 },
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
      
      saveLayoutToDB: async (columnWidths?: any[], symbols?: string[], name?: string) => {
        const state = get();
        const layoutData = {
          name: name || 'Layout gốc', // Lưu tên layout
          columns: state.columns,
          columnWidths: columnWidths || [], // Lưu column widths từ AG Grid
          symbols: symbols || [], // Lưu danh sách tickers
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
          console.log(`  - Name: ${name || 'Layout gốc'}`);
          console.log(`  - Column widths: ${columnWidths?.length || 0} columns`);
          console.log(`  - Symbols: ${symbols?.length || 0} tickers`);
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
            return result.data; // Trả về layoutData để lấy name
          } else {
            // Fallback: load from localStorage
            const savedLayout = localStorage.getItem('stock-screener-layout');
            if (savedLayout) {
              const layoutData = JSON.parse(savedLayout);
              set({ columns: layoutData.columns });
              console.log('Layout loaded from localStorage:', layoutData);
              return layoutData; // Trả về layoutData để lấy name
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
            return layoutData; // Trả về layoutData để lấy name
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
