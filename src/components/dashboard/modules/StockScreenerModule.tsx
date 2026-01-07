"use client";

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { useTheme } from '@/contexts/ThemeContext';
import { useColumnStore } from '@/stores/columnStore';
import { ColumnSidebar } from '@/components/dashboard/ColumnSidebar';
import { Save, Wifi, WifiOff, Table2 } from 'lucide-react';
import { useSignalR } from '@/contexts/SignalRContext';
import { MarketSymbolDto } from '@/types/market';
import SymbolSearchBox from '@/components/dashboard/SymbolSearchBox';
import ExchangeFilter from './StockScreener/ExchangeFilter';
import SymbolTypeFilter from './StockScreener/SymbolTypeFilter';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Toast, { ToastType } from '@/components/ui/Toast';
import { fetchSymbolsByExchange, fetchSymbols } from '@/services/symbolService';
import type { ExchangeCode, SymbolType } from '@/types/symbol';
import { SaveLayoutModal, LayoutSelector } from '@/components/dashboard/layout';
import { HEADER_GREEN } from '@/constants/colors';
import type { ModuleLayoutSummary, ModuleLayoutDetail, ColumnConfig } from '@/types/layout';
import * as layoutService from '@/services/layoutService';

// Module type constant for Stock Screener
const MODULE_TYPE_STOCK_SCREENER = 1;

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
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(false);
  const [isLoadingExchange, setIsLoadingExchange] = useState(false);
  const [isLoadingSymbolType, setIsLoadingSymbolType] = useState(false);
  const [draggedTicker, setDraggedTicker] = useState<string | null>(null);
  const [isDraggingOutside, setIsDraggingOutside] = useState<string | null>(null); // Track ticker being dragged outside
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  // Layout state
  const [layouts, setLayouts] = useState<ModuleLayoutSummary[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<number | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<string>('Layout mặc định');
  const [currentLayoutIsSystemDefault, setCurrentLayoutIsSystemDefault] = useState<boolean>(false);
  
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
  
  // Save Layout Modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  
  // Get column config from Zustand store
  const { columns, setColumns, setColumnWidth, setColumnVisibility, setSidebarOpen, resetColumns } = useColumnStore();

  // Get SignalR connection và market data
  const { isConnected, subscribeToSymbols, unsubscribeFromSymbols, marketData, connectionState } = useSignalR();

  /**
   * Handle exchange filter change
   */
  const handleExchangeChange = async (exchange: ExchangeCode) => {
    if (!isConnected) {
      setToast({
        isOpen: true,
        message: 'Chưa kết nối tới server. Vui lòng đợi...',
        type: 'warning'
      });
      return;
    }

    setIsLoadingExchange(true);
    
    try {
      // 1. Get current subscribed tickers
      const currentTickers = Array.from(marketData.keys());
      
      // 2. Unsubscribe all current symbols
      if (currentTickers.length > 0) {
        await unsubscribeFromSymbols(currentTickers);
        
        // 3. Clear grid data
        if (gridApi) {
          gridApi.setGridOption('rowData', []);
        }
      }
      
      // 4. Reset flag để cho phép reload default symbols
      hasLoadedDefaultSymbols.current = false;
      
      // 5. Fetch new symbols by exchange
      const newTickers = await fetchSymbolsByExchange(exchange);
      
      if (newTickers.length === 0) {
        setToast({
          isOpen: true,
          message: `Không tìm thấy mã nào trên sàn ${exchange}`,
          type: 'warning'
        });
        return;
      }
      
      // 6. Subscribe to new symbols
      await subscribeToSymbols(newTickers);
      
      setToast({
        isOpen: true,
        message: `Đã tải ${newTickers.length} mã từ sàn ${exchange}`,
        type: 'success'
      });
    } catch (error) {
      console.error(`[StockScreener] Error changing to ${exchange}:`, error);
      setToast({
        isOpen: true,
        message: `Lỗi khi tải dữ liệu sàn ${exchange}. Vui lòng thử lại.`,
        type: 'error'
      });
    } finally {
      setIsLoadingExchange(false);
    }
  };

  /**
   * Handle symbol type filter change
   */
  const handleSymbolTypeChange = async (type: SymbolType | null) => {
    if (!isConnected) {
      setToast({
        isOpen: true,
        message: 'Chưa kết nối tới server. Vui lòng đợi...',
        type: 'warning'
      });
      return;
    }

    setIsLoadingSymbolType(true);
    
    try {
      // 1. Get current subscribed tickers
      const currentTickers = Array.from(marketData.keys());
      
      // 2. Unsubscribe all current symbols
      if (currentTickers.length > 0) {
        await unsubscribeFromSymbols(currentTickers);
        
        // 3. Clear grid data
        if (gridApi) {
          gridApi.setGridOption('rowData', []);
        }
      }
      
      // 4. Reset flag để cho phép reload default symbols
      hasLoadedDefaultSymbols.current = false;
      
      // 5. If type is null, load default symbols (type = 1)
      if (type === null) {
        console.log('[StockScreener] 🔍 Loading default symbols (Type=1)');
        const symbols = await fetchSymbols({ 
          Type: 1, 
          PageSize: 5000,
          PageIndex: 1 
        });
        
        console.log('[StockScreener] 📊 Received symbols:', symbols?.length || 0);
        
        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
          setToast({
            isOpen: true,
            message: 'Không tìm thấy mã nào',
            type: 'warning'
          });
          return;
        }
        
        // FILTER: CHỈ LẤY CÁC SYMBOLS CÓ TYPE = 1
        const stockSymbols = symbols.filter(s => s.type === 1);
        console.log('[StockScreener] ✅ Filtered stock symbols:', stockSymbols.length);
        
        const tickers = stockSymbols.map(symbol => symbol.ticker);
        await subscribeToSymbols(tickers);
        
        // Đánh dấu đã load
        hasLoadedDefaultSymbols.current = true;
        
        setToast({
          isOpen: true,
          message: `Đã tải ${tickers.length} mã mặc định (Cổ phiếu)`,
          type: 'success'
        });
        return;
      }
      
      // 6. Fetch symbols by type (returns SymbolData[] directly)
      console.log(`[StockScreener] 🔍 Fetching symbols with Type=${type}`);
      const symbols = await fetchSymbols({ 
        Type: type, 
        PageSize: 5000,
        PageIndex: 1 
      });
      
      console.log(`[StockScreener] 📊 Received symbols for type ${type}:`, symbols?.length || 0);
      
      // Check for empty array
      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        const typeLabel = type === 1 ? 'Cổ phiếu' : type === 2 ? 'ETF' : type === 3 ? 'Trái phiếu' : 'Phái sinh';
        setToast({
          isOpen: true,
          message: `Không tìm thấy mã nào thuộc loại ${typeLabel}`,
          type: 'warning'
        });
        return;
      }
      
      // FILTER: CHỈ LẤY CÁC SYMBOLS ĐÚNG TYPE
      const filteredSymbols = symbols.filter(s => s.type === type);
      console.log(`[StockScreener] ✅ Filtered symbols matching type ${type}:`, filteredSymbols.length);
      
      // 7. Extract tickers and subscribe
      const newTickers = filteredSymbols.map(symbol => symbol.ticker);
      await subscribeToSymbols(newTickers);
      
      const typeLabel = type === 1 ? 'Cổ phiếu' : type === 2 ? 'ETF' : type === 3 ? 'Trái phiếu' : 'Phái sinh';
      setToast({
        isOpen: true,
        message: `Đã tải ${newTickers.length} mã ${typeLabel}`,
        type: 'success'
      });
    } catch (error) {
      console.error(`[StockScreener] Error changing symbol type:`, error);
      setToast({
        isOpen: true,
        message: `Lỗi khi tải dữ liệu theo loại. Vui lòng thử lại.`,
        type: 'error'
      });
    } finally {
      setIsLoadingSymbolType(false);
    }
  };

  /**
   * Subscribe to default symbols when connected
   * SỬ DỤNG useRef để track việc đã load symbols, tránh duplicate subscription
   */
  const hasLoadedDefaultSymbols = React.useRef(false);
  
  useEffect(() => {
    // Chỉ subscribe khi đã connected VÀ chưa load symbols
    if (!isConnected || hasLoadedDefaultSymbols.current) {
      return;
    }

    // Load default symbol list on first connection
    const loadDefaultSymbols = async () => {
      try {
        // Fetch all symbols from HSX exchange (default)
        console.log('[StockScreener] 🔍 Fetching symbols from HSX exchange');
        const tickers = await fetchSymbolsByExchange('HSX');
        
        console.log('[StockScreener] 📊 Received HSX tickers:', tickers.length);
        
        if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
          setToast({
            isOpen: true,
            message: 'Không tìm thấy mã nào trên sàn HSX',
            type: 'warning'
          });
          return;
        }
        
        // Subscribe to tickers
        console.log('[StockScreener] 📡 Subscribing to', tickers.length, 'HSX tickers');
        await subscribeToSymbols(tickers);
        
        // ĐÁNH DẤU đã load để tránh load lại
        hasLoadedDefaultSymbols.current = true;
        
        setToast({
          isOpen: true,
          message: `Đã tải ${tickers.length} mã từ sàn HSX`,
          type: 'success'
        });
      } catch (error) {
        console.error('[StockScreener] Error loading default HSX symbols:', error);
        setToast({
          isOpen: true,
          message: 'Lỗi khi tải danh sách mặc định từ HSX',
          type: 'error'
        });
      }
    };
    
    loadDefaultSymbols();
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

  // Fetch layouts from API
  const fetchLayouts = useCallback(async () => {
    setIsLoadingLayouts(true);
    try {
      const layoutList = await layoutService.getLayouts(MODULE_TYPE_STOCK_SCREENER);
      setLayouts(layoutList);
      
      // If no layouts exist, create default layout
      if (layoutList.length === 0) {
        const defaultConfig = layoutService.convertColumnsToConfigJson(columns);
        const defaultLayout = await layoutService.ensureDefaultLayout(
          MODULE_TYPE_STOCK_SCREENER,
          defaultConfig,
          'Layout mặc định'
        );
        setLayouts([defaultLayout]);
        setCurrentLayoutId(defaultLayout.id);
        setCurrentLayoutName(defaultLayout.layoutName);
        setCurrentLayoutIsSystemDefault(defaultLayout.isSystemDefault);
        setCurrentLayoutIsSystemDefault(defaultLayout.isSystemDefault);
      }
    } catch (error) {
      console.error('[StockScreener] Error fetching layouts:', error);
      setToast({
        isOpen: true,
        message: 'Không thể tải danh sách layout',
        type: 'error'
      });
    } finally {
      setIsLoadingLayouts(false);
    }
  }, [columns]);

  // Handle save layout - mở modal
  const handleSaveLayout = () => {
    setIsSaveModalOpen(true);
  };

  // Handle save layout submit from modal (create new layout)
  const handleSaveLayoutSubmit = async (layoutName: string) => {
    setIsSaving(true);
    try {
      // Save layout using layoutService
      const createdLayout = await layoutService.saveUserLayout(
        MODULE_TYPE_STOCK_SCREENER,
        layoutName,
        columns
      );
      
      // Update state
      setCurrentLayoutId(createdLayout.id);
      setCurrentLayoutName(createdLayout.layoutName);
      
      // Refresh layouts list
      await fetchLayouts();
      
      setToast({
        isOpen: true,
        message: `Layout "${layoutName}" đã được lưu thành công!`,
        type: 'success'
      });
    } catch (error) {
      console.error('[StockScreener] Error saving layout:', error);
      setToast({
        isOpen: true,
        message: 'Có lỗi khi lưu layout. Vui lòng thử lại.',
        type: 'error'
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle update existing layout
  const handleUpdateLayoutSubmit = async (layoutName: string) => {
    if (!currentLayoutId) {
      setToast({
        isOpen: true,
        message: 'Không có layout để cập nhật',
        type: 'error'
      });
      return;
    }

    setIsSaving(true);
    try {
      // Update layout using layoutService
      await layoutService.updateUserLayout(
        currentLayoutId,
        layoutName,
        columns
      );
      
      // Update current layout name
      setCurrentLayoutName(layoutName);
      
      // Refresh layouts list
      await fetchLayouts();
      
      setToast({
        isOpen: true,
        message: `Layout "${layoutName}" đã được cập nhật!`,
        type: 'success'
      });
    } catch (error) {
      console.error('[StockScreener] Error updating layout:', error);
      setToast({
        isOpen: true,
        message: 'Có lỗi khi cập nhật layout. Vui lòng thử lại.',
        type: 'error'
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle select layout from dropdown
  const handleSelectLayout = async (layout: ModuleLayoutSummary) => {
    setIsLoadingLayouts(true);
    try {
      // Fetch full layout detail with configJson
      const layoutDetail = await layoutService.getLayoutById(layout.id);
      
      // Apply layout config to column store
      if (layoutDetail.configJson?.state?.columns) {
        // Merge saved columns with current columns from localStorage
        // This preserves new fields and only updates saved properties
        const mergedColumns = layoutService.mergeLayoutColumns(
          columns,
          layoutDetail.configJson.state.columns
        );
        
        // Update zustand store with merged columns
        // This will automatically sync to localStorage 'stock-screener-columns'
        setColumns(mergedColumns);
      }
      
      // Update current layout state
      setCurrentLayoutId(layout.id);
      setCurrentLayoutName(layout.layoutName);
      setCurrentLayoutIsSystemDefault(layout.isSystemDefault);
      
      setToast({
        isOpen: true,
        message: `Đã tải layout "${layout.layoutName}"`,
        type: 'success'
      });
    } catch (error) {
      console.error('[StockScreener] Error loading layout:', error);
      setToast({
        isOpen: true,
        message: 'Có lỗi khi tải layout. Vui lòng thử lại.',
        type: 'error'
      });
    } finally {
      setIsLoadingLayouts(false);
    }
  };

  // Handle delete layout
  const handleDeleteLayout = async (layout: ModuleLayoutSummary) => {
    if (layout.isSystemDefault) {
      setToast({
        isOpen: true,
        message: 'Không thể xóa layout mặc định của hệ thống',
        type: 'warning'
      });
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xóa layout',
      message: `Bạn có chắc muốn xóa layout "${layout.layoutName}"? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          await layoutService.deleteLayout(layout.id);
          
          // Refresh layouts list
          await fetchLayouts();
          
          // If deleted current layout, reset to first available or default
          if (currentLayoutId === layout.id) {
            setCurrentLayoutId(null);
            setCurrentLayoutName('Layout mặc định');
            resetColumns();
          }
          
          setToast({
            isOpen: true,
            message: `Đã xóa layout "${layout.layoutName}"`,
            type: 'success'
          });
        } catch (error) {
          console.error('[StockScreener] Error deleting layout:', error);
          setToast({
            isOpen: true,
            message: 'Có lỗi khi xóa layout. Vui lòng thử lại.',
            type: 'error'
          });
        }
      }
    });
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
      
      <div className={`relative w-full h-full rounded-lg overflow-hidden border flex flex-col ${
        isDark ? 'bg-[#282832] border-gray-800' : 'bg-white border-gray-200'
      }`}>
        
        {/* Save Layout Modal - inside module container */}
        <SaveLayoutModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveLayoutSubmit}
          onUpdate={handleUpdateLayoutSubmit}
          currentLayoutId={currentLayoutId}
          currentLayoutName={currentLayoutName}
          isSystemDefault={currentLayoutIsSystemDefault}
          isLoading={isSaving}
        />
        
        {/* Module Header - Trapezoid Design */}
        <div className="module-header flex items-center justify-center px-4 pt-0 pb-2 relative">
          {/* Trapezoid Title Container - Only this part has green background and is draggable */}
          <div 
            className="drag-handle relative px-8 py-1.5 flex items-center gap-2 cursor-move select-none"
            style={{
              backgroundColor: HEADER_GREEN,
              clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)',
              minWidth: '400px',
              justifyContent: 'center'
            }}
          >
            <span className="text-borderDark font-semibold text-md">Bảng giá</span>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <div className='flex justify-between items-center mb-4'>
            <div className="flex items-center gap-3">
              {/* Exchange Filter Buttons */}
              <ExchangeFilter 
                onExchangeChange={handleExchangeChange}
                isLoading={isLoadingExchange}
              />
          
              {/* Symbol Type Filter Dropdown */}
              <SymbolTypeFilter
                onSymbolTypeChange={handleSymbolTypeChange}
                isLoading={isLoadingSymbolType}
              />
          
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
                title="Lưu layout mới"
                className={`flex items-center justify-center p-2 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800 disabled:opacity-50' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-300'
                }`}
              >
                <Save size={18} />
              </button>
          
              {/* Layout Selector Dropdown */}
              <LayoutSelector
                layouts={layouts}
                currentLayoutId={currentLayoutId}
                currentLayoutName={currentLayoutName}
                isLoading={isLoadingLayouts}
                onSelect={handleSelectLayout}
                onDelete={handleDeleteLayout}
                onRefresh={fetchLayouts}
              />
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
      </div>
    </>
  );
}
