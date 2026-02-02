import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { useModule } from '@/contexts/ModuleContext';
import { useColumnStore } from '@/stores/columnStore';
import { useSignalR } from '@/contexts/SignalRContext';
import { fetchSymbolsByExchange, fetchSymbols } from '@/services/symbolService';
import { watchListService } from '@/services/watchListService';
import * as layoutService from '@/services/layoutService';
import type { ExchangeCode, SymbolType } from '@/types/symbol';
import type { IndexType } from '@/components/dashboard/modules/StockScreener/IndexFilter';
import type { ModuleLayoutSummary, ModuleLayoutDetail, ColumnConfig } from '@/types/layout';
import type { WatchListSummary, WatchListDetail } from '@/types/watchList';
import type { MarketSymbolDto } from '@/types/market';
import { ToastType } from '@/components/ui/Toast';

// Module type constant for Stock Screener
const MODULE_TYPE_STOCK_SCREENER = 1;

/**
 * Custom hook chứa toàn bộ logic của StockScreenerModule
 * Tách riêng để dễ bảo trì và phát triển
 */
export function useStockScreener() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const [gridApi, setGridApi] = useState<any>(null);
  
  /**
   * Helper: Kiểm tra user có quyền edit layout không
   * Layout id = 1 là system default, chỉ admin mới được sửa
   */
  const canEditLayout = useCallback((layoutId: number | null): boolean => {
    if (!layoutId) return false;
    
    // Layout id = 1 là system default
    if (layoutId === 1) {
      // Chỉ admin mới được sửa
      return user?.role?.toLowerCase() === 'admin';
    }
    
    // Các layout khác thì được phép sửa
    return true;
  }, [user]);
  
  // Get module context (moduleId and moduleType)
  const moduleContext = useModule();
  const moduleId = moduleContext?.moduleId;
  
  // Get dashboard context to access workspace data
  const { getModuleById, updateModuleLayoutId, currentPageId } = useDashboard();
  
  // Get workspace layoutId if this module has one saved
  const [workspaceLayoutId, setWorkspaceLayoutId] = useState<number | null>(null);
  const [isWorkspaceLayoutIdLoaded, setIsWorkspaceLayoutIdLoaded] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false); // NEW: Track if layout is fully loaded
  
  // Load workspace layoutId on mount AND when page changes
  useEffect(() => {
    if (moduleId) {
      const moduleData = getModuleById(moduleId);
      const newLayoutId = moduleData?.layoutId || null;
      
      // CRITICAL: Reset layout ready state when page changes
      setIsLayoutReady(false);
      
      // OPTIMIZATION: Clear grid data immediately when switching workspace
      // This prevents showing old layout's columns with wrong data
      if (gridApi) {
        gridApi.setGridOption('rowData', []);
      }
      
      // Always update, even if same value (to ensure flag is set)
      setWorkspaceLayoutId(newLayoutId);
      setIsWorkspaceLayoutIdLoaded(true);
    } else {
      // FIX: If no moduleId yet (newly added module), set ready immediately
      // This prevents infinite loading overlay on new module addition
      setIsWorkspaceLayoutIdLoaded(true);
      setIsLayoutReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, currentPageId]); // getModuleById and gridApi accessed directly, not as dependencies
  
  // NOTE: KHÔNG dùng rowData state - AG Grid sẽ quản lý data hoàn toàn qua Transaction API
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(false);
  const [isLoadingExchange, setIsLoadingExchange] = useState(false);
  const [isLoadingSymbolType, setIsLoadingSymbolType] = useState(false);
  const [isLoadingIndex, setIsLoadingIndex] = useState(false);
  const [draggedTicker, setDraggedTicker] = useState<string | null>(null);
  const [isDraggingOutside, setIsDraggingOutside] = useState<string | null>(null); // Track ticker being dragged outside
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  // Filter states to track selections
  const [selectedExchange, setSelectedExchange] = useState<ExchangeCode | null>(null);
  const [selectedSymbolType, setSelectedSymbolType] = useState<SymbolType | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<IndexType | null>(null);
  
  // Layout state
  const [layouts, setLayouts] = useState<ModuleLayoutSummary[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<number | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<string>('Layout mặc định');
  const [currentLayoutIsSystemDefault, setCurrentLayoutIsSystemDefault] = useState<boolean>(false);
  
  // Watch List state
  const [watchLists, setWatchLists] = useState<WatchListSummary[]>([]);
  const [currentWatchListId, setCurrentWatchListId] = useState<number | null>(null);
  const [currentWatchListName, setCurrentWatchListName] = useState<string>('Watch-list của tôi');
  const [isLoadingWatchLists, setIsLoadingWatchLists] = useState(false);
  
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
  
  // Save Layout Modal state (for creating new layout only)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  
  // Get column config from Zustand store
  const { columns, setColumns, setColumnWidth, setColumnVisibility, setSidebarOpen, resetColumns } = useColumnStore();

  // Get SignalR connection và market data
  const { isConnected, subscribeToSymbols, unsubscribeFromSymbols, marketData, connectionState } = useSignalR();

  /**
   * Subscribe to default symbols when connected
   * SỬ DỤNG useRef để track việc đã load symbols, tránh duplicate subscription
   */
  const hasLoadedDefaultSymbols = useRef(false);
  
  /**
   * Track current watch-list tickers để validate grid display
   * Chỉ hiển thị ticker thuộc watch-list hiện tại
   */
  const currentWatchListTickers = useRef<Set<string>>(new Set());

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
    setSelectedExchange(exchange);
    
    try {
      // Clear watch-list selection and tracking when using exchange filter
      setCurrentWatchListId(null);
      setCurrentWatchListName('Watch-list của tôi');
      currentWatchListTickers.current.clear();
      
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
   * Handle index filter change
   * TODO: Implement API integration when endpoint is available
   * Expected API: GET /api/v1/symbols/indices/{indexType}
   * Should return array of ticker symbols belonging to the index
   */
  const handleIndexChange = async (indexType: IndexType) => {
    if (!isConnected) {
      setToast({
        isOpen: true,
        message: 'Chưa kết nối tới server. Vui lòng đợi...',
        type: 'warning'
      });
      return;
    }

    setIsLoadingIndex(true);
    setSelectedIndex(indexType);
    
    try {
      // Clear watch-list selection and tracking when using index filter
      setCurrentWatchListId(null);
      setCurrentWatchListName('Watch-list của tôi');
      currentWatchListTickers.current.clear();
      
      // TODO: Replace with actual API call when available
      // Example implementation:
      // const tickers = await fetchSymbolsByIndex(indexType);
      
      // Temporary notification
      setToast({
        isOpen: true,
        message: `Tính năng tải ${indexType} đang được phát triển. API chưa sẵn sàng.`,
        type: 'info'
      });
      
      /* TODO: Uncomment when API is ready
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
      
      // 4. Reset flag
      hasLoadedDefaultSymbols.current = false;
      
      // 5. Fetch symbols by index
      const tickers = await fetchSymbolsByIndex(indexType);
      
      if (tickers.length === 0) {
        setToast({
          isOpen: true,
          message: `Không tìm thấy mã nào trong chỉ số ${indexType}`,
          type: 'warning'
        });
        return;
      }
      
      // 6. Subscribe to new symbols
      await subscribeToSymbols(tickers);
      
      setToast({
        isOpen: true,
        message: `Đã tải ${tickers.length} mã từ chỉ số ${indexType}`,
        type: 'success'
      });
      */
    } catch (error) {
      console.error(`[StockScreener] Error changing to index ${indexType}:`, error);
      setToast({
        isOpen: true,
        message: `Lỗi khi tải dữ liệu chỉ số ${indexType}. Vui lòng thử lại.`,
        type: 'error'
      });
    } finally {
      setIsLoadingIndex(false);
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
    setSelectedSymbolType(type);
    
    try {
      // Clear watch-list selection and tracking when using symbol type filter
      setCurrentWatchListId(null);
      setCurrentWatchListName('Watch-list của tôi');
      currentWatchListTickers.current.clear();
      
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
      
      // 5. If type is null, load default symbols from HSX exchange
      if (type === null) {
        const tickers = await fetchSymbolsByExchange('HSX');
        
        if (!tickers || tickers.length === 0) {
          setToast({
            isOpen: true,
            message: 'Không tìm thấy mã nào trên sàn HSX',
            type: 'warning'
          });
          return;
        }
        
        await subscribeToSymbols(tickers);
        
        // Đánh dấu đã load
        hasLoadedDefaultSymbols.current = true;
        
        setToast({
          isOpen: true,
          message: `Đã tải ${tickers.length} mã từ sàn HSX`,
          type: 'success'
        });
        return;
      }
      
      // 6. Fetch symbols by type (returns SymbolData[] directly)
      const symbols = await fetchSymbols({ 
        Type: type, 
        PageSize: 5000,
        PageIndex: 1 
      });
      
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

  // Subscribe to default symbols when connected
  useEffect(() => {
    // Chỉ subscribe khi đã connected VÀ chưa load symbols
    if (!isConnected || hasLoadedDefaultSymbols.current) {
      return;
    }

    // Load default symbol list on first connection - SỬ DỤNG EXCHANGE HSX
    const loadDefaultSymbols = async () => {
      try {
        const tickers = await fetchSymbolsByExchange('HSX');
        
        if (!tickers || tickers.length === 0) {
          setToast({
            isOpen: true,
            message: 'Không tìm thấy mã nào trên sàn HSX',
            type: 'warning'
          });
          return;
        }
        
        await subscribeToSymbols(tickers);
        
        // ĐÁNH DẤU đã load để tránh load lại
        hasLoadedDefaultSymbols.current = true;
        
        setToast({
          isOpen: true,
          message: `Đã tải ${tickers.length} mã từ sàn HSX`,
          type: 'success'
        });
      } catch (error) {
        console.error('[StockScreener] Error loading default symbols:', error);
        setToast({
          isOpen: true,
          message: 'Lỗi khi tải danh sách mặc định',
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
              
              // 3. If using watch-list, update watch-list to remove this ticker
              if (currentWatchListId !== null) {
                try {
                  // Get current watch list detail
                  const watchListDetail = await watchListService.getWatchListById(currentWatchListId);
                  
                  // Remove ticker from tickers array
                  const updatedTickers = watchListDetail.tickers.filter(t => t.toUpperCase() !== ticker.toUpperCase());
                  
                  // Update watch list
                  await watchListService.updateWatchList(
                    currentWatchListId,
                    watchListDetail.name,
                    updatedTickers
                  );
                  
                  // Refresh watch lists to update ticker count
                  await fetchWatchLists();
                } catch (watchListError) {
                  console.error(`[StockScreener] Error updating watch-list:`, watchListError);
                  // Don't show error to user - unsubscribe was successful
                }
              }
              
              // 4. Show success toast
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
    let validRows = updatedRows.filter(row => row && row.ticker);
    
    // FILTER: Nếu đang dùng watch-list, CHỈ hiển thị ticker trong watch-list
    if (currentWatchListId !== null && currentWatchListTickers.current.size > 0) {
      validRows = validRows.filter(row => 
        currentWatchListTickers.current.has(row.ticker.toUpperCase())
      );
    }

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
        rowsToUpdate.push(row);
      } else {
        rowsToAdd.push(row);
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
        const visible = column.isVisible();
        setColumnVisibility(field, visible);
      });
    }
  }, [setColumnVisibility]);

  // Apply saved column state to AG Grid - CHỈ 1 LẦN khi grid ready
  useEffect(() => {
    if (!gridApi) return;
    
    try {
      // LẤY danh sách tất cả column IDs hiện có trong grid
      const allColumnIds: string[] = [];
      gridApi.getColumns()?.forEach((column: any) => {
        allColumnIds.push(column.getColId());
      });

      // BUILD column state từ Zustand store
      const columnState = allColumnIds.map(colId => {
        const columnConfig = columns[colId];
        return {
          colId,
          width: columnConfig?.width || undefined,
          hide: columnConfig?.visible === false, // AG Grid dùng 'hide', không phải 'visible'
        };
      });

      // APPLY column state vào grid - CHỈ 1 LẦN
      gridApi.applyColumnState({
        state: columnState,
        applyOrder: false, // Giữ nguyên thứ tự columns
      });
    } catch (error) {
      console.error('[StockScreener] Error applying column state:', error);
    }
  }, [gridApi]); // CHỈ dependency gridApi - KHÔNG có columns!

  // Sync column visibility changes from sidebar to AG Grid
  // CHỈ update các cột được specify, KHÔNG override toàn bộ grid state
  useEffect(() => {
    if (!gridApi) return;
    
    try {
      // BUILD partial column state - CHỈ update visibility
      const columnState = Object.keys(columns).map(colId => {
        const columnConfig = columns[colId];
        return {
          colId,
          hide: columnConfig?.visible === false,
        };
      });

      // APPLY partial column state - CHỈ update visibility, giữ nguyên width
      gridApi.applyColumnState({
        state: columnState,
        applyOrder: false,
      });
    } catch (error) {
      console.error('[StockScreener] Error syncing column visibility:', error);
    }
  }, [columns, gridApi]); // Re-run khi columns thay đổi

  // AUTO-SAVE: Tự động update layout khi columns thay đổi
  // CHỈ UPDATE nếu KHÔNG phải system default layout
  useEffect(() => {
    // Skip nếu không có currentLayoutId hoặc đang là system default
    if (!currentLayoutId || currentLayoutIsSystemDefault) {
      return;
    }
    
    // Skip nếu user không có quyền edit layout này (vd: layout id=1 và user không phải admin)
    if (!canEditLayout(currentLayoutId)) {
      console.log(`[StockScreener] User không có quyền edit layout ${currentLayoutId}`);
      return;
    }
    
    // Debounce: Chờ 1 giây sau khi user thay đổi mới save
    const timeoutId = setTimeout(async () => {
      try {
        console.log(`[StockScreener] Auto-saving layout ${currentLayoutId}...`);
        await layoutService.updateUserLayout(
          currentLayoutId,
          currentLayoutName,
          columns
        );
        console.log(`[StockScreener] Layout ${currentLayoutId} auto-saved successfully`);
      } catch (error) {
        console.error(`[StockScreener] Error auto-saving layout:`, error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [columns, currentLayoutId, currentLayoutName, currentLayoutIsSystemDefault, canEditLayout]);

  // Fetch layouts from API (for refresh, không load layout)
  const fetchLayouts = useCallback(async () => {
    setIsLoadingLayouts(true);
    try {
      const fetchedLayouts = await layoutService.getLayouts(MODULE_TYPE_STOCK_SCREENER);
      setLayouts(fetchedLayouts);
    } catch (error) {
      console.error('[StockScreener] Error fetching layouts:', error);
    } finally {
      setIsLoadingLayouts(false);
    }
  }, []);
  
  /**
   * Helper: Load layout by ID and apply to column store
   */
  const loadLayoutById = useCallback(async (layout: ModuleLayoutSummary) => {
    try {
      const layoutDetail: ModuleLayoutDetail = await layoutService.getLayoutById(layout.id);
      
      // Apply to Zustand store - configJson.state.columns
      if (layoutDetail.configJson?.state?.columns) {
        setColumns(layoutDetail.configJson.state.columns);
      }
      
      // Update current layout state
      setCurrentLayoutId(layout.id);
      setCurrentLayoutName(layout.layoutName);
      setCurrentLayoutIsSystemDefault(layout.isSystemDefault);
    } catch (error) {
      console.error('[StockScreener] Error loading layout:', error);
      throw error;
    }
  }, [setColumns]);

  /**
   * Fetch layouts on mount and load workspace layout if exists
   * OPTIMIZED: Only fetch when needed, use useMemo for layout lookup
   */
  useEffect(() => {
    // ONLY fetch and load if workspace layout is loaded and layout is not ready
    if (!isWorkspaceLayoutIdLoaded || isLayoutReady) {
      return;
    }

    const initializeLayout = async () => {
      try {
        console.log('[StockScreener] Initializing layout...');
        
        // 1. Fetch layouts first
        const fetchedLayouts = await layoutService.getLayouts(MODULE_TYPE_STOCK_SCREENER);
        setLayouts(fetchedLayouts);
        
        // 2. Determine which layout to load
        let layoutToLoad: ModuleLayoutSummary | undefined;
        
        if (workspaceLayoutId) {
          // Find workspace layout
          layoutToLoad = fetchedLayouts.find((l: ModuleLayoutSummary) => l.id === workspaceLayoutId);
          
          if (!layoutToLoad) {
            console.warn(`[StockScreener] Workspace layout ${workspaceLayoutId} not found, falling back to system default`);
          }
        }
        
        // Fallback to system default if no workspace layout
        if (!layoutToLoad) {
          layoutToLoad = fetchedLayouts.find((l: ModuleLayoutSummary) => l.isSystemDefault);
        }
        
        // 3. Load layout if found
        if (layoutToLoad) {
          console.log(`[StockScreener] Loading layout: ${layoutToLoad.layoutName} (${layoutToLoad.id})`);
          await loadLayoutById(layoutToLoad);
        } else {
          console.warn('[StockScreener] No layout found to load');
          // Set default state if no layout found
          setCurrentLayoutId(null);
          setCurrentLayoutName('Layout mặc định');
          setCurrentLayoutIsSystemDefault(false);
        }
        
        // 4. Mark layout as ready
        setIsLayoutReady(true);
        console.log('[StockScreener] Layout initialization complete');
      } catch (error) {
        console.error('[StockScreener] Error initializing layout:', error);
        // Still mark as ready to avoid infinite loading
        setIsLayoutReady(true);
      }
    };

    initializeLayout();
  }, [moduleId, workspaceLayoutId, isWorkspaceLayoutIdLoaded, currentPageId, loadLayoutById]);

  // Handle create new layout - clone from system default (id=1)
  const handleCreateNewLayout = async () => {
    try {
      // Fetch system default layout (id=1)
      const systemDefaultLayout = await layoutService.getLayoutById(1);
      
      // Apply config vào column store để modal save có data từ system default
      if (systemDefaultLayout.configJson?.state?.columns) {
        setColumns(systemDefaultLayout.configJson.state.columns);
      }
      
      // Mở modal để user nhập tên layout mới
      setIsSaveModalOpen(true);
    } catch (error) {
      console.error('[StockScreener] Error loading system default layout:', error);
      setToast({
        isOpen: true,
        message: 'Có lỗi khi tải layout mặc định. Vui lòng thử lại.',
        type: 'error'
      });
    }
  };

  // Handle save layout submit from modal (create new layout)
  const handleSaveLayoutSubmit = async (layoutName: string) => {
    setIsSaving(true);
    try {
      // Create new layout with current columns
      const newLayout = await layoutService.saveUserLayout(
        MODULE_TYPE_STOCK_SCREENER,
        layoutName,
        columns
      );
      
      // Refresh layouts list
      await fetchLayouts();
      
      // Switch to new layout
      setCurrentLayoutId(newLayout.id);
      setCurrentLayoutName(newLayout.layoutName);
      setCurrentLayoutIsSystemDefault(false);
      
      // Update workspace to use new layout
      if (moduleId) {
        await updateModuleLayoutId(moduleId, newLayout.id);
      }
      
      setToast({
        isOpen: true,
        message: `Đã tạo layout "${layoutName}" thành công`,
        type: 'success'
      });
      
      setIsSaveModalOpen(false);
    } catch (error) {
      console.error('[StockScreener] Error creating layout:', error);
      setToast({
        isOpen: true,
        message: 'Lỗi khi tạo layout. Vui lòng thử lại.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle update existing layout
  const handleUpdateLayoutSubmit = async (layoutName: string) => {
    if (!currentLayoutId) return;
    
    setIsSaving(true);
    try {
      await layoutService.updateUserLayout(
        currentLayoutId,
        layoutName,
        columns
      );
      
      // Refresh layouts list
      await fetchLayouts();
      
      // Update current layout name
      setCurrentLayoutName(layoutName);
      
      setToast({
        isOpen: true,
        message: `Đã cập nhật layout "${layoutName}" thành công`,
        type: 'success'
      });
    } catch (error) {
      console.error('[StockScreener] Error updating layout:', error);
      setToast({
        isOpen: true,
        message: 'Lỗi khi cập nhật layout. Vui lòng thử lại.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle select layout from dropdown
  const handleSelectLayout = async (layout: ModuleLayoutSummary) => {
    try {
      // Load layout
      await loadLayoutById(layout);
      
      // Update workspace to use this layout
      if (moduleId) {
        await updateModuleLayoutId(moduleId, layout.id);
        setWorkspaceLayoutId(layout.id);
      }
      
      setToast({
        isOpen: true,
        message: `Đã chuyển sang layout "${layout.layoutName}"`,
        type: 'success'
      });
    } catch (error) {
      console.error('[StockScreener] Error selecting layout:', error);
      setToast({
        isOpen: true,
        message: 'Lỗi khi chuyển layout. Vui lòng thử lại.',
        type: 'error'
      });
    }
  };

  // Handle delete layout
  const handleDeleteLayout = async (layout: ModuleLayoutSummary) => {
    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xóa layout',
      message: `Bạn có chắc muốn xóa layout "${layout.layoutName}"?\n\nHành động này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          await layoutService.deleteLayout(layout.id);
          
          // Refresh layouts list
          await fetchLayouts();
          
          // If deleted layout is current, switch to system default
          if (currentLayoutId === layout.id) {
            const systemDefault = layouts.find(l => l.isSystemDefault);
            if (systemDefault) {
              await handleSelectLayout(systemDefault);
            }
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
            message: 'Lỗi khi xóa layout. Vui lòng thử lại.',
            type: 'error'
          });
        }
      }
    });
  };
  
  /**
   * Fetch watch lists from API
   */
  const fetchWatchLists = useCallback(async () => {
    setIsLoadingWatchLists(true);
    try {
      const fetchedWatchLists = await watchListService.getWatchLists();
      setWatchLists(fetchedWatchLists);
    } catch (error) {
      console.error('[StockScreener] Error fetching watch lists:', error);
    } finally {
      setIsLoadingWatchLists(false);
    }
  }, []);

  /**
   * Handle select watch list - load and subscribe to tickers
   */
  const handleSelectWatchList = async (watchList: WatchListSummary) => {
    if (!isConnected) {
      setToast({
        isOpen: true,
        message: 'Chưa kết nối tới server. Vui lòng đợi...',
        type: 'warning'
      });
      return;
    }

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
      
      // 5. Get watch list detail to fetch tickers
      const watchListDetail: WatchListDetail = await watchListService.getWatchListById(watchList.id);
      
      if (!watchListDetail.tickers || watchListDetail.tickers.length === 0) {
        setToast({
          isOpen: true,
          message: `Watch-list "${watchList.name}" không có mã nào`,
          type: 'warning'
        });
        
        // Update state
        setCurrentWatchListId(watchList.id);
        setCurrentWatchListName(watchList.name);
        currentWatchListTickers.current.clear();
        return;
      }
      
      // 6. Subscribe to watch list tickers
      await subscribeToSymbols(watchListDetail.tickers);
      
      // 7. Update state - QUAN TRỌNG: Track tickers để filter grid display
      setCurrentWatchListId(watchList.id);
      setCurrentWatchListName(watchList.name);
      currentWatchListTickers.current = new Set(watchListDetail.tickers.map(t => t.toUpperCase()));
      
      // 8. Clear filter selections when using watch-list
      setSelectedExchange(null);
      setSelectedSymbolType(null);
      setSelectedIndex(null);
      
      setToast({
        isOpen: true,
        message: `Đã tải ${watchListDetail.tickers.length} mã từ watch-list "${watchList.name}"`,
        type: 'success'
      });
    } catch (error) {
      console.error('[StockScreener] Error selecting watch list:', error);
      setToast({
        isOpen: true,
        message: 'Lỗi khi tải watch-list. Vui lòng thử lại.',
        type: 'error'
      });
    }
  };

  /**
   * Handle create new watch list
   */
  const handleCreateWatchList = async (name: string) => {
    try {
      // Create empty watch list
      const newWatchList = await watchListService.createWatchList(name, []);
      
      // Refresh watch lists
      await fetchWatchLists();
      
      setToast({
        isOpen: true,
        message: `Đã tạo watch-list "${name}" thành công`,
        type: 'success'
      });
    } catch (error) {
      console.error('[StockScreener] Error creating watch list:', error);
      setToast({
        isOpen: true,
        message: 'Lỗi khi tạo watch-list. Vui lòng thử lại.',
        type: 'error'
      });
      throw error;
    }
  };

  /**
   * Handle delete watch list
   */
  const handleDeleteWatchList = async (watchList: WatchListSummary) => {
    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xóa watch-list',
      message: `Bạn có chắc muốn xóa watch-list "${watchList.name}"?\n\nHành động này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          await watchListService.deleteWatchList(watchList.id);
          
          // Refresh watch lists
          await fetchWatchLists();
          
          // If deleted watch list is current, clear selection
          if (currentWatchListId === watchList.id) {
            setCurrentWatchListId(null);
            setCurrentWatchListName('Watch-list của tôi');
            currentWatchListTickers.current.clear();
          }
          
          setToast({
            isOpen: true,
            message: `Đã xóa watch-list "${watchList.name}"`,
            type: 'success'
          });
        } catch (error) {
          console.error('[StockScreener] Error deleting watch list:', error);
          setToast({
            isOpen: true,
            message: 'Lỗi khi xóa watch-list. Vui lòng thử lại.',
            type: 'error'
          });
        }
      }
    });
  };
  
  /**
   * Handle symbol selection from search box
   * If a watch list is selected, add the ticker to it
   */
  const handleSymbolSelect = async (ticker: string) => {
    if (!isConnected) {
      setToast({
        isOpen: true,
        message: 'Chưa kết nối tới server. Vui lòng đợi...',
        type: 'warning'
      });
      return;
    }

    try {
      // 1. Check if ticker is already subscribed
      if (marketData.has(ticker.toUpperCase())) {
        setToast({
          isOpen: true,
          message: `Mã ${ticker} đã có trong danh sách`,
          type: 'info'
        });
        return;
      }

      // 2. Subscribe to the ticker
      await subscribeToSymbols([ticker]);

      // 3. If a watch list is selected, add ticker to it
      if (currentWatchListId !== null) {
        try {
          // Get current watch list detail
          const watchListDetail = await watchListService.getWatchListById(currentWatchListId);
          
          // Add ticker to tickers array
          const updatedTickers = [...watchListDetail.tickers, ticker.toUpperCase()];
          
          // Update watch list
          await watchListService.updateWatchList(
            currentWatchListId,
            watchListDetail.name,
            updatedTickers
          );
          
          // Update tracking set
          currentWatchListTickers.current.add(ticker.toUpperCase());
          
          // Refresh watch lists to update ticker count
          await fetchWatchLists();
        } catch (watchListError) {
          console.error(`[StockScreener] Error updating watch-list:`, watchListError);
          // Don't show error to user - subscription was successful
        }
      }

      setToast({
        isOpen: true,
        message: `Đã thêm mã ${ticker} vào danh sách theo dõi`,
        type: 'success'
      });
    } catch (error) {
      console.error(`[StockScreener] Error subscribing to ${ticker}:`, error);
      setToast({
        isOpen: true,
        message: `Lỗi khi thêm mã ${ticker}. Vui lòng thử lại.`,
        type: 'error'
      });
    }
  };

  // Handle row drag leave - set flag khi kéo ra ngoài grid, chờ mouseup để confirm
  const handleRowDragLeave = useCallback((event: any) => {
    const ticker = event.node?.data?.ticker;
    if (ticker) setIsDraggingOutside(ticker);
  }, []);

  // Handle row drag enter - clear flag khi drag trở lại vào grid
  const handleRowDragEnter = useCallback(() => {
    setIsDraggingOutside(null);
  }, []);

  // Return all states and handlers for the component to use
  return {
    // Theme & UI
    theme,
    isDark,
    
    // Grid state
    gridApi,
    setGridApi,
    lastUpdateTime,
    
    // Loading states
    isSaving,
    isLoadingLayouts,
    isLoadingExchange,
    isLoadingSymbolType,
    isLoadingIndex,
    isLoadingWatchLists,
    isWorkspaceLayoutIdLoaded,
    isLayoutReady,
    
    // Filter states
    selectedExchange,
    selectedSymbolType,
    selectedIndex,
    
    // Layout states
    layouts,
    currentLayoutId,
    currentLayoutName,
    currentLayoutIsSystemDefault,
    
    // Watch list states
    watchLists,
    currentWatchListId,
    currentWatchListName,
    
    // Dialog & Toast
    confirmDialog,
    setConfirmDialog,
    toast,
    setToast,
    
    // Modal state
    isSaveModalOpen,
    setIsSaveModalOpen,
    
    // Column store
    columns,
    setSidebarOpen,
    
    // SignalR
    isConnected,
    connectionState,
    
    // Handlers
    handleExchangeChange,
    handleIndexChange,
    handleSymbolTypeChange,
    handleSymbolSelect,
    handleSelectLayout,
    handleDeleteLayout,
    handleCreateNewLayout,
    handleSaveLayoutSubmit,
    handleUpdateLayoutSubmit,
    fetchLayouts,
    handleSelectWatchList,
    handleDeleteWatchList,
    fetchWatchLists,
    handleCreateWatchList,
    onColumnResized,
    onColumnVisible,
    handleRowDragEnter,
    handleRowDragLeave,
    
    // Helpers
    canEditLayout,
  };
}
