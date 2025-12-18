"use client";

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { useTheme } from '@/contexts/ThemeContext';
import { useColumnStore } from '@/stores/columnStore';
import { ColumnSidebar } from '@/components/dashboard/ColumnSidebar';
import { Save, Wifi, WifiOff, Table2, FolderOpen } from 'lucide-react';
import { useSignalR } from '@/contexts/SignalRContext';
import { MarketSymbolDto } from '@/types/market';
import SymbolSearchBox from '@/components/dashboard/SymbolSearchBox';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Toast, { ToastType } from '@/components/ui/Toast';

// Đăng ký modules AG-Grid (bắt buộc từ v31+)
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Helper function: Format giá VND chia cho 1000
 * VD: 86500 → 86.5, 24300 → 24.3
 */
const formatPrice = (value: number | null | undefined): string => {
  if (!value) return '0';
  return (value / 1000).toFixed(2);
};

export default function StockScreenerModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [gridApi, setGridApi] = useState<any>(null);
  // NOTE: KHÔNG dùng rowData state - AG Grid sẽ quản lý data hoàn toàn qua Transaction API
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draggedTicker, setDraggedTicker] = useState<string | null>(null);
  const [isDraggingOutside, setIsDraggingOutside] = useState<string | null>(null); // Track ticker being dragged outside
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<string>('Layout gốc');
  
  // Dialog and Toast state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: ToastType;
  }>({ isOpen: false, message: '', type: 'info' });
  
  // Get column config from Zustand store
  const { columns, setColumnWidth, setColumnVisibility, setSidebarOpen, saveLayoutToDB, loadLayoutFromDB } = useColumnStore();

  // Get SignalR connection và market data
  const { isConnected, subscribeToSymbols, unsubscribeFromSymbols, marketData, connectionState } = useSignalR();

  /**
   * Subscribe to ALL symbols từ backend API
   */
  useEffect(() => {
    // Chỉ subscribe khi đã connected
    if (!isConnected) {
      return;
    }

    // Fetch ALL symbols từ backend API
    const fetchAndSubscribeSymbols = async () => {
      try {
        // ✅ HARDCODED: Subscribe tới danh sách cố định 10 mã
        const symbols = ['ACB', 'BCM', 'BID', 'GVR', 'GAS', 'HDB', 'MBB', 'STB', 'MWG', 'VPB'];
        
        // Subscribe tới danh sách hardcoded
        await subscribeToSymbols(symbols);
      } catch (error) {
        console.error('[StockScreener] Error subscribing to hardcoded symbols:', error);
      }
    };
    
    fetchAndSubscribeSymbols();

    // Cleanup: Unsubscribe khi component unmount
    // Note: Không cần unsubscribe explicitly vì Context sẽ tự cleanup
  }, [isConnected, subscribeToSymbols]);

  /**
   * Global mouseup listener để detect khi user thả chuột sau khi drag ra ngoài grid
   */
  useEffect(() => {
    const handleGlobalMouseUp = async () => {
      if (isDraggingOutside) {
        const ticker = isDraggingOutside;
        
        // Reset state TRƯỚC KHI hiện dialog để tránh duplicate
        setIsDraggingOutside(null);
        
        // Show confirmation dialog
        setConfirmDialog({
          isOpen: true,
          title: 'Xác nhận bỏ theo dõi',
          message: `Bạn có muốn bỏ theo dõi mã ${ticker}?\n\nMã này sẽ được xóa khỏi danh sách và không nhận dữ liệu real-time nữa.`,
          onConfirm: async () => {
            try {
              // 1. Unsubscribe từ SignalR
              await unsubscribeFromSymbols([ticker]);
              
              // 2. Xóa row khỏi grid
              if (gridApi) {
                const rowNode = gridApi.getRowNode(ticker);
                if (rowNode) {
                  gridApi.applyTransaction({ remove: [rowNode.data] });
                }
              }
              
              // 3. Show success toast
              setToast({
                isOpen: true,
                message: `Đã bỏ theo dõi mã ${ticker}`,
                type: 'success'
              });
            } catch (error) {
              console.error(`[StockScreener] Error unsubscribing from ${ticker}:`, error);
              setToast({
                isOpen: true,
                message: `Lỗi khi bỏ theo dõi mã ${ticker}. Vui lòng thử lại.`,
                type: 'error'
              });
            }
          }
        });
      }
    };

    // Add global mouseup listener
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingOutside, gridApi, unsubscribeFromSymbols]);

  /**
   * Update row data khi nhận được market data từ SignalR
   * SỬ DỤNG AG GRID TRANSACTION API - Chỉ update cells thay đổi, KHÔNG reload toàn bộ grid
   * Grid LUÔN LUÔN update từ marketData Map (từ Context), BẤT KỂ có logging hay không
   */
  useEffect(() => {
    if (marketData.size === 0 || !gridApi) {
      return;
    }

    // Chuyển đổi marketData Map thành array để update grid
    const updatedRows = Array.from(marketData.values());
    
    // VALIDATE: Loại bỏ rows không có ticker (invalid data)
    const validRows = updatedRows.filter(row => row && row.ticker);

    if (validRows.length === 0) {
      return;
    }

    // LẤY danh sách ticker hiện có trong grid
    const existingTickers = new Set<string>();
    gridApi.forEachNode((node: any) => {
      if (node.data?.ticker) {
        existingTickers.add(node.data.ticker);
      }
    });

    // PHÂN LOẠI: Rows cần ADD (mới) vs UPDATE (đã tồn tại)
    const rowsToAdd: MarketSymbolDto[] = [];
    const rowsToUpdate: MarketSymbolDto[] = [];

    validRows.forEach(row => {
      if (existingTickers.has(row.ticker)) {
        rowsToUpdate.push(row); // Row đã tồn tại → update
      } else {
        rowsToAdd.push(row); // Row mới → add
      }
    });

    // SỬ DỤNG TRANSACTION API - CHỈ UPDATE CELLS THAY ĐỔI
    if (rowsToAdd.length > 0 || rowsToUpdate.length > 0) {
      // Apply transaction - AG Grid tự động xác định cells nào thay đổi
      const transaction: any = {};
      if (rowsToAdd.length > 0) transaction.add = rowsToAdd;
      if (rowsToUpdate.length > 0) transaction.update = rowsToUpdate;

      gridApi.applyTransaction(transaction);
      
      // Cập nhật last update time
      setLastUpdateTime(new Date());

      // KHÔNG CẬP NHẬT rowData STATE - để AG Grid tự quản lý data qua Transaction API
      // Việc update state sẽ gây conflict với Transaction API
    }
  }, [marketData, gridApi]);

  // Persist column width changes to Zustand
  const onColumnResized = useCallback((event: any) => {
    // Chỉ lưu khi user thực sự resize (không phải từ applyColumnState)
    if (event.finished && event.column && event.source === 'uiColumnDragged') {
      const field = event.column.getColId();
      const width = event.column.getActualWidth();
      setColumnWidth(field, width);
    }
  }, [setColumnWidth]);

  // Sync column visibility changes when user hides/shows columns via AG Grid UI
  const onColumnVisible = useCallback((event: any) => {
    // Bắt MỌI thay đổi visibility (drag column, drag group, toolPanel, API, etc.)
    // KHÔNG filter by source để sync đầy đủ
    
    // CASE 1: Single column change (event.column)
    if (event.column && !event.columns) {
      const field = event.column.getColId();
      const visible = event.visible;
      setColumnVisibility(field, visible);
    }
    
    // CASE 2: Multiple columns change (event.columns) - XẢY RA KHI DRAG COLUMN GROUP
    if (event.columns && Array.isArray(event.columns)) {
      event.columns.forEach((column: any) => {
        const field = column.getColId();
        const visible = event.visible;
        setColumnVisibility(field, visible);
      });
    }
  }, [setColumnVisibility]);

  // Apply saved column state to AG Grid - CHỈ 1 LẦN khi grid ready
  useEffect(() => {
    if (!gridApi) return;
    
    try {
      // LẤY danh sách tất cả column IDs hiện có trong grid
      const existingColumnIds = new Set<string>();
      gridApi.getAllGridColumns()?.forEach((col: any) => {
        const colId = col.getColId();
        if (colId) existingColumnIds.add(colId);
      });

      // CHỈ apply state cho các cột thực sự tồn tại
      const validColumnState = Object.values(columns)
        .filter(col => existingColumnIds.has(col.field)) // Filter out non-existent columns
        .sort((a, b) => a.order - b.order)
        .map(col => ({
          colId: col.field,
          hide: !col.visible,
          width: col.width,
        }));

      if (validColumnState.length > 0) {
        gridApi.applyColumnState({ 
          state: validColumnState,
          applyOrder: false // Không apply order để tránh conflict
        });
      }
    } catch (error) {
      console.error('[StockScreener] Error applying column state:', error);
    }
  }, [gridApi]); // CHỈ dependency gridApi - KHÔNG có columns!

  // Sync column visibility changes from sidebar to AG Grid
  // CHỈ update các cột được specify, KHÔNG override toàn bộ grid state
  useEffect(() => {
    if (!gridApi) return;
    
    try {
      const existingColumnIds = new Set<string>();
      gridApi.getAllGridColumns()?.forEach((col: any) => {
        const colId = col.getColId();
        if (colId) existingColumnIds.add(colId);
      });

      const validColumnState = Object.values(columns)
        .filter(col => existingColumnIds.has(col.field))
        .map(col => ({
          colId: col.field,
          hide: !col.visible,
        }));

      if (validColumnState.length > 0) {
        gridApi.applyColumnState({ 
          state: validColumnState,
          applyOrder: false,
          // QUAN TRỌNG: defaultColState giữ nguyên state của các cột KHÔNG được specify
          // Tránh các cột đã hide bị show lại khi user click checkbox cột khác
          defaultState: { hide: undefined } // Không thay đổi visibility của cột không được specify
        });
      }
    } catch (error) {
      console.error('[StockScreener] Error syncing column visibility:', error);
    }
  }, [columns, gridApi]); // Re-run khi columns thay đổi

  // Handle save layout
  const handleSaveLayout = async () => {
    // Prompt user to enter layout name
    const layoutName = prompt('Nhập tên layout:', currentLayoutName !== 'Layout gốc' ? currentLayoutName : '');
    
    if (!layoutName || !layoutName.trim()) {
      alert('Tên layout không được để trống!');
      return;
    }
    
    setIsSaving(true);
    try {
      // Lấy column widths từ AG Grid
      const columnWidths = gridApi ? gridApi.getColumnState() : [];
      
      // Lấy danh sách tickers đang hiển thị
      const symbols = Array.from(marketData.keys());
      
      await saveLayoutToDB(columnWidths, symbols, layoutName.trim());
      setCurrentLayoutName(layoutName.trim());
      alert(`Layout đã được lưu thành công!\n\n` +
            `• Tên: ${layoutName.trim()}\n` +
            `• ${columnWidths.length} cột với chiều rộng\n` +
            `• ${symbols.length} mã chứng khoán: ${symbols.join(', ')}`);
    } catch (error) {
      alert('Có lỗi khi lưu layout. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle load layout
  const handleLoadLayout = async () => {
    setIsLoading(true);
    try {
      const layoutData = await loadLayoutFromDB();
      
      // Update current layout name
      if (layoutData?.name) {
        setCurrentLayoutName(layoutData.name);
      } else {
        setCurrentLayoutName('Layout gốc');
      }
      
      alert('Layout đã được tải thành công!');
    } catch (error) {
      alert('Có lỗi khi tải layout. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle symbol selection from search box
   */
  const handleSymbolSelect = async (ticker: string) => {
    // Kiểm tra xem mã đã được subscribe chưa
    if (marketData.has(ticker)) {
      setToast({
        isOpen: true,
        message: `Mã ${ticker} đã được theo dõi rồi!`,
        type: 'warning'
      });
      return;
    }
    
    try {
      await subscribeToSymbols([ticker]);
      setToast({
        isOpen: true,
        message: `Đã subscribe thành công mã ${ticker} !`,
        type: 'success'
      });
    } catch (error) {
      console.error(`[StockScreener] Failed to subscribe to ${ticker}:`, error);
      setToast({
        isOpen: true,
        message: `Lỗi khi subscribe mã ${ticker}. Vui lòng kiểm tra mã và thử lại.`,
        type: 'error'
      });
    }
  };

  // Handle row drag leave - set flag khi kéo ra ngoài grid, chờ mouseup để confirm
  const handleRowDragLeave = useCallback((event: any) => {
    const ticker = event.node?.data?.ticker;
    if (ticker) {
      setIsDraggingOutside(ticker);
    }
  }, []);

  // Handle row drag enter - clear flag khi drag trở lại vào grid
  const handleRowDragEnter = useCallback(() => {
    setIsDraggingOutside(null);
  }, []);

  // Định nghĩa cột và nhóm cột - THEO LAYOUT HÌNH
  const columnDefs: (ColDef | ColGroupDef)[] = useMemo(() => [
    // CỘT CỐ ĐỊNH BÊN TRÁI - Thứ tự: CK → Trần → Sàn → TC
    {
      field: 'ticker',
      headerName: 'CK',
      width: 80,
      pinned: 'left',
      rowDrag: true, // Enable drag & drop để unsubscribe
      cellClass: 'font-bold text-blue-500 cursor-pointer text-xs',
    },
    {
      field: 'ceilingPrice',
      headerName: 'Trần',
      width: 80,
      pinned: 'left',
      valueFormatter: (params) => formatPrice(params.value),
      cellClass: 'text-purple-500 font-semibold text-xs',
    },
    {
      field: 'floorPrice',
      headerName: 'Sàn',
      width: 80,
      pinned: 'left',
      valueFormatter: (params) => formatPrice(params.value),
      cellClass: 'text-cyan-500 font-semibold text-xs',
    },
    {
      field: 'referencePrice',
      headerName: 'TC',
      width: 80,
      pinned: 'left',
      valueFormatter: (params) => formatPrice(params.value),
      cellClass: 'text-yellow-500 font-semibold text-xs',
    },
    
    // NHÓM BÊN MUA (ORDER BOOK - LEFT SIDE)
    {
      headerName: 'Bên mua',
      children: [
        { 
          field: 'bidPrice3',
          headerName: 'Giá 3', 
          width: 85, 
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || params.value == null) return 'text-red-600 text-xs';
            const diff = params.value - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 text-xs';
            if (diff < 0) return 'text-red-500 text-xs';
            return 'text-yellow-500 text-xs';
          },
        },
        { 
          field: 'bidVol3',
          headerName: 'KL 3', 
          width: 100, 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.data?.bidPrice3) return 'text-red-600 text-xs';
            const diff = params.data.bidPrice3 - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 text-xs';
            if (diff < 0) return 'text-red-500 text-xs';
            return 'text-yellow-500 text-xs';
          },
        },
        { 
          field: 'bidPrice2',
          headerName: 'Giá 2', 
          width: 85, 
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || params.value == null) return 'text-red-600 font-semibold text-xs';
            const diff = params.value - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 font-semibold text-xs';
            if (diff < 0) return 'text-red-500 font-semibold text-xs';
            return 'text-yellow-500 font-semibold text-xs';
          },
        },
        { 
          field: 'bidVol2',
          headerName: 'KL 2', 
          width: 100, 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.data?.bidPrice2) return 'text-red-600 font-semibold text-xs';
            const diff = params.data.bidPrice2 - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 font-semibold text-xs';
            if (diff < 0) return 'text-red-500 font-semibold text-xs';
            return 'text-yellow-500 font-semibold text-xs';
          },
        },
        { 
          field: 'bidPrice1',
          headerName: 'Giá 1', 
          width: 85, 
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || params.value == null) return 'text-red-600 font-bold text-xs';
            const diff = params.value - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 font-bold text-xs';
            if (diff < 0) return 'text-red-500 font-bold text-xs';
            return 'text-yellow-500 font-bold text-xs';
          },
        },
        { 
          field: 'bidVol1',
          headerName: 'KL 1', 
          width: 100, 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.data?.bidPrice1) return 'text-red-600 font-bold text-xs';
            const diff = params.data.bidPrice1 - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 font-bold text-xs';
            if (diff < 0) return 'text-red-500 font-bold text-xs';
            return 'text-yellow-500 font-bold text-xs';
          },
        },
      ]
    },
    
    // NHÓM KHỚP LỆNH (CENTER - MATCHED ORDERS)
    {
      headerName: 'Khớp lệnh',
      children: [
        { 
          field: 'lastPrice',
          headerName: 'Giá', 
          width: 95, 
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || params.value == null) return 'font-bold text-xs';
            const diff = params.value - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 font-bold text-xs';
            if (diff < 0) return 'text-red-500 font-bold text-xs';
            return 'text-yellow-500 font-bold text-xs';
          },
        },
        { 
          field: 'lastVol',
          headerName: 'KL', 
          width: 110, 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.data?.lastPrice) return 'font-semibold text-xs';
            const diff = params.data.lastPrice - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 font-semibold text-xs';
            if (diff < 0) return 'text-red-500 font-semibold text-xs';
            return 'text-yellow-500 font-semibold text-xs';
          },
        },
        { 
          field: 'change',
          headerName: '+/-', 
          width: 80, 
          valueFormatter: (params) => {
            if (params.value == null) return '0';
            // Chia 1000 để chuyển từ VND sang nghìn đồng
            const valueInThousands = params.value / 1000;
            return valueInThousands > 0 ? `+${valueInThousands.toFixed(2)}` : valueInThousands.toFixed(2);
          },
          cellClass: (params) => {
            // Khi change = 0, hiển thị theo màu của lastPrice so với referencePrice
            if (params.value === 0) {
              if (!params.data?.referencePrice || !params.data?.lastPrice) return 'text-xs';
              const diff = params.data.lastPrice - params.data.referencePrice;
              if (diff > 0) return 'text-green-500 font-semibold text-xs';
              if (diff < 0) return 'text-red-500 font-semibold text-xs';
              return 'text-yellow-500 font-semibold text-xs';
            }
            // Khi change != 0, hiển thị theo dấu của change
            if (params.value == null) return 'text-xs';
            return params.value > 0 ? 'text-green-500 font-semibold text-xs' : params.value < 0 ? 'text-red-500 font-semibold text-xs' : 'text-xs';
          },
        },
        { 
          field: 'ratioChange',
          headerName: '+/- (%)', 
          width: 90, 
          valueFormatter: (params) => {
            if (!params.value) return '0%';
            // Backend đã trả về %, chỉ cần format
            const pct = params.value.toFixed(2);
            return params.value > 0 ? `+${pct}%` : `${pct}%`;
          },
          cellClass: (params) => {
            if (!params.value) return 'text-xs';
            return params.value > 0 ? 'text-green-500 font-bold text-xs' : params.value < 0 ? 'text-red-500 font-bold text-xs' : 'text-xs';
          },
        },
      ]
    },
    
    // NHÓM BÊN BÁN (ORDER BOOK - RIGHT SIDE)
    {
      headerName: 'Bên bán',
      children: [
        { 
          field: 'askPrice1',
          headerName: 'Giá 1', 
          width: 85, 
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || params.value == null) return 'text-green-600 font-bold text-xs';
            const diff = params.value - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 font-bold text-xs';
            if (diff < 0) return 'text-red-500 font-bold text-xs';
            return 'text-yellow-500 font-bold text-xs';
          },
        },
        { 
          field: 'askVol1',
          headerName: 'KL 1', 
          width: 100, 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.data?.askPrice1) return 'text-green-600 font-bold text-xs';
            const diff = params.data.askPrice1 - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 font-bold text-xs';
            if (diff < 0) return 'text-red-500 font-bold text-xs';
            return 'text-yellow-500 font-bold text-xs';
          },
        },
        { 
          field: 'askPrice2',
          headerName: 'Giá 2', 
          width: 85, 
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || params.value == null) return 'text-green-600 font-semibold text-xs';
            const diff = params.value - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 font-semibold text-xs';
            if (diff < 0) return 'text-red-500 font-semibold text-xs';
            return 'text-yellow-500 font-semibold text-xs';
          },
        },
        { 
          field: 'askVol2',
          headerName: 'KL 2', 
          width: 100, 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.data?.askPrice2) return 'text-green-600 font-semibold text-xs';
            const diff = params.data.askPrice2 - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 font-semibold text-xs';
            if (diff < 0) return 'text-red-500 font-semibold text-xs';
            return 'text-yellow-500 font-semibold text-xs';
          },
        },
        { 
          field: 'askPrice3',
          headerName: 'Giá 3', 
          width: 85, 
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || params.value == null) return 'text-green-600 text-xs';
            const diff = params.value - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 text-xs';
            if (diff < 0) return 'text-red-500 text-xs';
            return 'text-yellow-500 text-xs';
          },
        },
        { 
          field: 'askVol3',
          headerName: 'KL 3', 
          width: 100, 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.data?.askPrice3) return 'text-green-600 text-xs';
            const diff = params.data.askPrice3 - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 text-xs';
            if (diff < 0) return 'text-red-500 text-xs';
            return 'text-yellow-500 text-xs';
          },
        },
      ]
    },
    
    // NHÓM THỐNG KÊ PHIÊN
    {
      headerName: 'Tổng',
      children: [
        { 
          field: 'totalVol',
          headerName: 'Tổng KL', 
          width: 120, 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: 'font-semibold text-xs',
        },
        { 
          field: 'highest',
          headerName: 'Cao', 
          width: 85, 
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || params.value == null) return 'text-green-600 font-semibold text-xs';
            const diff = params.value - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 font-semibold text-xs';
            if (diff < 0) return 'text-red-500 font-semibold text-xs';
            return 'text-yellow-500 font-semibold text-xs';
          },
        },
        { 
          field: 'lowest',
          headerName: 'Thấp', 
          width: 85, 
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || params.value == null) return 'text-red-600 font-semibold text-xs';
            const diff = params.value - params.data.referencePrice;
            if (diff > 0) return 'text-green-500 font-semibold text-xs';
            if (diff < 0) return 'text-red-500 font-semibold text-xs';
            return 'text-yellow-500 font-semibold text-xs';
          },
        },
        { 
          field: 'avgPrice',
          headerName: 'TB', 
          width: 85, 
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: 'text-xs',
        },
      ]
    },
    
    // CÁC CỘT BỔ SUNG (Ẩn mặc định - có thể bật trong column manager)
    {
      headerName: 'Thông tin khác',
      children: [
        { 
          field: 'totalVal',
          headerName: 'Tổng GT', 
          width: 120, 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          hide: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'side',
          headerName: 'Chiều', 
          width: 70, 
          cellClass: (params) => {
            if (params.value === 'B') return 'text-green-500 font-bold text-xs';
            if (params.value === 'S') return 'text-red-500 font-bold text-xs';
            return 'text-xs';
          },
          hide: true,
        },
        { 
          field: 'tradingSession',
          headerName: 'Phiên', 
          width: 80, 
          hide: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'tradingStatus',
          headerName: 'Trạng thái', 
          width: 100, 
          cellClass: (params) => {
            if (params.value === 'Active') return 'text-green-500 text-xs';
            if (params.value === 'Halted') return 'text-orange-500 text-xs';
            if (params.value === 'Suspended') return 'text-red-500 text-xs';
            return 'text-xs';
          },
          hide: true,
        },
      ]
    },
    
    // CÁC NHÓM CỘT PHÂN TÍCH (Các cột trùng lặp đã được xóa)
    {
      headerName: 'PHÂN TÍCH KỸ THUẬT',
      children: [
        { 
          field: 'ThanhKhoanTB50', 
          headerName: 'GTTB (50 phiên)',
          width: columns.ThanhKhoanTB50?.width || 140, 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'volTB50', 
          headerName: 'KLTB (50 phiên)',
          width: columns.volTB50?.width || 140, 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'KL1KLTB',
          headerName: '%KLTB', 
          width: columns.KL1KLTB?.width || 100, 
          valueFormatter: (params) => params.value ? `${params.value}%` : '0%',
          cellClass: 'text-xs',
        },
        { 
          field: 'bulVol',
          headerName: 'Bull Vol (5p)', 
          width: columns.bulVol?.width || 130, 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'bearVol',
          headerName: 'Bear Vol (5p)', 
          width: columns.bearVol?.width || 130, 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'NGANHAN',
          headerName: 'Ngắn hạn', 
          width: columns.NGANHAN?.width || 110, 
          cellClass: 'text-xs',
        },
        { 
          field: 'TRUNGHAN',
          headerName: 'Trung hạn', 
          width: columns.TRUNGHAN?.width || 110, 
          cellClass: 'text-xs',
        },
        { 
          field: 'DAIHAN',
          headerName: 'Dài hạn', 
          width: columns.DAIHAN?.width || 110, 
          cellClass: 'text-xs',
        },
        { 
          field: 'SUCMANH',
          headerName: 'Sức mạnh', 
          width: columns.SUCMANH?.width || 120, 
          cellClass: 'text-xs',
        },
        { 
          field: 'RS',
          headerName: 'RS', 
          width: columns.RS?.width || 80, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'rrg',
          headerName: 'RRG', 
          width: columns.rrg?.width || 100, 
          cellClass: 'text-xs',
        },
        { 
          field: 'signalSMC',
          headerName: 'Signal SMC', 
          width: columns.signalSMC?.width || 120, 
          cellClass: 'text-xs',
        },
        { 
          field: 'AiTrend',
          headerName: 'AI Trend', 
          width: columns.AiTrend?.width || 110, 
          cellClass: 'text-xs',
        },
        { 
          field: 'pVWMA20',
          headerName: '%VWMA20', 
          width: columns.pVWMA20?.width || 110, 
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: 'text-xs',
        },
      ]
    },
    {
      headerName: 'CHỈ SỐ GIÁ',
      children: [
        { 
          field: 'ptop52W',
          headerName: '%Top 52W', 
          width: columns.ptop52W?.width || 110, 
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: (params) => params.value > 0 ? 'text-green-500 text-xs' : 'text-red-500 text-xs',
        },
        { 
          field: 'plow52W',
          headerName: '%Low 52W', 
          width: columns.plow52W?.width || 110, 
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: 'text-xs',
        },
        { 
          field: 'pMA20',
          headerName: '%MA20', 
          width: columns.pMA20?.width || 100, 
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: 'text-xs',
        },
        { 
          field: 'pMA50',
          headerName: '%MA50', 
          width: columns.pMA50?.width || 100, 
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: 'text-xs',
        },
        { 
          field: 'pMA100',
          headerName: '%MA100', 
          width: columns.pMA100?.width || 100, 
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: 'text-xs',
        },
        { 
          field: 'pMA200',
          headerName: '%MA200', 
          width: columns.pMA200?.width || 100, 
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: 'text-xs',
        },
      ]
    },
    {
      headerName: 'PHÂN TÍCH CƠ BẢN',
      children: [
        { 
          field: 'PE',
          headerName: 'P/E', 
          width: columns.PE?.width || 80, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'ROE',
          headerName: 'ROE', 
          width: columns.ROE?.width || 80, 
          valueFormatter: (params) => params.value ? `${params.value}%` : '0%',
          cellClass: 'text-xs',
        },
        { 
          field: 'BLNR',
          headerName: 'BLNR', 
          width: columns.BLNR?.width || 80, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'diemBinhquan',
          headerName: 'Action Score', 
          width: columns.diemBinhquan?.width || 120, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'DG_bq',
          headerName: 'Định giá', 
          width: columns.DG_bq?.width || 100, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'skTaichinh',
          headerName: 'Sức khỏe TC', 
          width: columns.skTaichinh?.width || 120, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'mohinhKinhdoanh',
          headerName: 'Mô hình KD', 
          width: columns.mohinhKinhdoanh?.width || 120, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'hieuquaHoatdong',
          headerName: 'Hiệu quả HĐ', 
          width: columns.hieuquaHoatdong?.width || 120, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'diemKythuat',
          headerName: 'Điểm KT', 
          width: columns.diemKythuat?.width || 100, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'BAT',
          headerName: 'BAT', 
          width: columns.BAT?.width || 80, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'AIPredict20d',
          headerName: 'AI Predict 20d', 
          width: columns.AIPredict20d?.width || 130, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
      ]
    },
    {
      headerName: 'PHÂN TÍCH KỸ THUẬT NÂNG CAO',
      children: [
        { 
          field: 'candles',
          headerName: 'Candles', 
          width: columns.candles?.width || 150, 
          cellClass: 'text-xs',
        },
        { 
          field: 'pattern',
          headerName: 'Pattern', 
          width: columns.pattern?.width || 150, 
          cellClass: 'text-xs',
        },
        { 
          field: 'vungcau',
          headerName: 'Vùng cầu', 
          width: columns.vungcau?.width || 120, 
          cellClass: 'text-xs',
        },
        { 
          field: 'vungcung',
          headerName: 'Vùng cung', 
          width: columns.vungcung?.width || 120, 
          cellClass: 'text-xs',
        },
        { 
          field: 'hotro',
          headerName: 'Hỗ trợ', 
          width: columns.hotro?.width || 100, 
          cellClass: 'text-xs',
        },
        { 
          field: 'khangcu',
          headerName: 'Kháng cự', 
          width: columns.khangcu?.width || 100, 
          cellClass: 'text-xs',
        },
        { 
          field: 'kenhduoi',
          headerName: 'Kênh dưới', 
          width: columns.kenhduoi?.width || 120, 
          cellClass: 'text-xs',
        },
        { 
          field: 'kenhtren',
          headerName: 'Kênh trên', 
          width: columns.kenhtren?.width || 120, 
          cellClass: 'text-xs',
        },
        { 
          field: 'cmtTA',
          headerName: 'Comment TA', 
          width: columns.cmtTA?.width || 250, 
          wrapText: true,
          autoHeight: true,
          cellClass: 'text-xs',
        },
      ]
    },
    {
      headerName: 'CHIẾN LƯỢC',
      children: [
        { 
          field: 'CHIENLUOC',
          headerName: 'Chiến lược', 
          width: columns.CHIENLUOC?.width || 150, 
          cellClass: 'text-xs',
        },
        { 
          field: 'GIAMUA',
          headerName: 'Giá mua', 
          width: columns.GIAMUA?.width || 100, 
          cellClass: 'text-xs',
        },
        { 
          field: 'GIABAN',
          headerName: 'Giá bán', 
          width: columns.GIABAN?.width || 100, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'LAILO',
          headerName: 'Lãi/Lỗ', 
          width: columns.LAILO?.width || 100, 
          valueFormatter: (params) => params.value ? `${params.value}%` : '0%',
          cellClass: (params) => params.value > 0 ? 'text-green-500 text-xs' : params.value < 0 ? 'text-red-500 text-xs' : 'text-gray-500 text-xs',
        },
        { 
          field: 'NGAYMUA',
          headerName: 'Ngày mua', 
          width: columns.NGAYMUA?.width || 120, 
          cellClass: 'text-xs',
        },
        { 
          field: 'NGAYBAN',
          headerName: 'Ngày bán', 
          width: columns.NGAYBAN?.width || 120, 
          cellClass: 'text-xs',
        },
        { 
          field: 'TTDT',
          headerName: 'TTDT', 
          width: columns.TTDT?.width || 100, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'TTLN',
          headerName: 'TTLN', 
          width: columns.TTLN?.width || 100, 
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
      ]
    }
  ], [columns]);

  // Cấu hình mặc định cho tất cả các cột
  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    suppressMenu: true, // Ẩn menu button (bao gồm filter) trên tất cả cột
    // QUAN TRỌNG: Enable cell flash animation cho real-time updates
    enableCellChangeFlash: true,
    // Tắt auto-size để tránh grid resize liên tục
    suppressSizeToFit: true,
  }), []);

  return (
    <>
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Xác nhận"
        cancelText="Hủy"
        variant="danger"
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
      
      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        duration={3000}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
      
      <div className={`w-full h-full rounded-lg p-4 border ${
        isDark ? 'bg-[#282832] border-gray-800' : 'bg-white border-gray-200'
      }`}>
      <div className='flex justify-between items-center mb-4'>
        <div className="flex items-center gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Stock Screener
            </h2>
          </div>
          
          {/* Symbol Search Box Component */}
          <SymbolSearchBox 
            isConnected={isConnected}
            onSymbolSelect={handleSymbolSelect}
          />
          
          {/* Connection Status Indicator - Icon only */}
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            isConnected 
              ? 'bg-green-500/20 text-green-500' 
              : 'bg-red-500/20 text-red-500'
          }`}>
            {isConnected ? (
              <Wifi size={16} />
            ) : (
              <WifiOff size={16} />
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Save Layout Button - Icon Only */}
          <button
            onClick={handleSaveLayout}
            disabled={isSaving}
            title="Lưu layout"
            className={`flex items-center justify-center p-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800 disabled:opacity-50' 
                : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-300'
            }`}
          >
            <Save size={18} />
          </button>
          
          {/* Load Layout Button - Hiển thị tên layout */}
          <button
            onClick={handleLoadLayout}
            disabled={isLoading}
            title="Load layout"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-800 disabled:opacity-50' 
                : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-green-300'
            }`}
          >
            <FolderOpen size={18} />
            <span className="text-sm">{currentLayoutName}</span>
          </button>
        </div>
      </div>
      
      {/* Column Sidebar */}
      <ColumnSidebar />
      
      {/* Floating Column Manager Button - Sticky vertical button like scrollbar */}
      <button
        onClick={() => setSidebarOpen(true)}
        title="Quản lý cột"
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center gap-1 py-8 px-2 rounded-l-lg shadow-lg transition-all hover:px-3 ${
          isDark 
            ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-gray-900/50' 
            : 'bg-white hover:bg-gray-50 text-gray-900 shadow-gray-300/50 border border-r-0 border-gray-200'
        }`}
      >
        <Table2 size={16} />
        <span className="text-[10px] font-medium" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Cột</span>
      </button>
      
      <div className={`w-full h-[calc(100%-3rem)] ${isDark ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}`}>
        <AgGridReact
          rowData={undefined}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          animateRows={true}
          theme="legacy"
          rowDragManaged={false}
          rowDragEntireRow={true}
          suppressMoveWhenRowDragging={true}
          onGridReady={(params) => {
            setGridApi(params.api);
          }}
          onColumnResized={onColumnResized}
          onColumnVisible={onColumnVisible}
          onRowDragEnter={handleRowDragEnter}
          onRowDragLeave={handleRowDragLeave}
          // QUAN TRỌNG: getRowId để AG Grid có thể track và update đúng rows
          getRowId={(params) => {
            // Validate ticker exists
            if (!params.data || !params.data.ticker) {
              console.error('[StockScreener] ❌ Invalid row data - missing ticker:', params.data);
              return 'invalid-' + Math.random(); // Fallback ID
            }
            return params.data.ticker;
          }}
          // Optimize performance
          suppressAnimationFrame={false}
          suppressColumnVirtualisation={false}
        />
      </div>
    </div>
    </>
  );
}
