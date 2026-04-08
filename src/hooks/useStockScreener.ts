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
import { getIndexConstituents } from '@/services/marketIndexService';
import type { MarketIndex } from '@/types/marketIndex';
import type { ModuleLayoutSummary, ModuleLayoutDetail, ColumnConfig } from '@/types/layout';
import type { WatchListSummary, WatchListDetail } from '@/types/watchList';
import type { MarketSymbolDto } from '@/types/market';
import type { Sector } from '@/types/sector';
import { ToastType } from '@/components/ui/Toast';

// Module type constant for Stock Screener
const MODULE_TYPE_STOCK_SCREENER = 1;
const FILTER_DEFAULT_PAGE_SIZE = 1000;

const isStockScreenerDebugEnabled = (): boolean => {
  if (process.env.NEXT_PUBLIC_STOCK_SCREENER_DEBUG === '1') {
    return true;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.localStorage.getItem('debug:stockscreener') === '1';
  } catch {
    return false;
  }
};

const stockScreenerDebugLog = (message: string, payload?: unknown): void => {
  if (!isStockScreenerDebugEnabled()) return;
  if (payload === undefined) {
    console.log(`[StockScreenerDebug] ${message}`);
    return;
  }
  console.log(`[StockScreenerDebug] ${message}`, payload);
};

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
      const role = user?.role?.trim().toLowerCase();
      return role === 'admin' || role === 'quản trị viên';
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
  
  // Reset layout ready state when user logs in/out so the layout is re-fetched
  const prevUserRef = useRef<typeof user>(user);
  useEffect(() => {
    const prevUser = prevUserRef.current;
    prevUserRef.current = user;
    // Transition from unauthenticated → authenticated: reload layout
    if (!prevUser && user) {
      setIsLayoutReady(false);
    }
  }, [user]);

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
  const [selectedIndex, setSelectedIndex] = useState<MarketIndex | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [isLoadingSector, setIsLoadingSector] = useState(false);
  
  // Layout state
  const [layouts, setLayouts] = useState<ModuleLayoutSummary[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<number | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<string>('Layout mặc định');
  const [currentLayoutIsSystemDefault, setCurrentLayoutIsSystemDefault] = useState<boolean>(false);
  
  // Watch List state
  const [watchLists, setWatchLists] = useState<WatchListSummary[]>([]);
  const [currentWatchListId, setCurrentWatchListId] = useState<number | null>(null);
  const [currentWatchListName, setCurrentWatchListName] = useState<string>('Danh mục của tôi');
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
  const { isConnected, subscribeToSymbols, unsubscribeFromSymbols, marketData, connectionState, subscribedSymbols } = useSignalR();

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
   * Ref to track the currently active sector ID, used to prevent
   * re-subscribing when the same sector is clicked multiple times.
   */
  const activeSectorIdRef = useRef<string | null>(null);

  /** Counter for sampled debug logs in high-frequency grid updates. */
  const gridUpdateDebugCountRef = useRef(0);

  /**
   * Shared helper: fetch symbols with combined filters (Exchange + Type + Sector)
   * then unsubscribe old tickers and subscribe to new ones.
   * This is the single source of truth for filter-driven subscription changes.
   */
  const fetchAndSubscribeWithFilters = async (opts: {
    exchange: ExchangeCode | null;
    symbolType: SymbolType | null;
    sector: Sector | null;
  }) => {
    const { exchange, symbolType, sector } = opts;
    const currentTickers = Array.from(marketData.keys());

    // Clear grid immediately for visual feedback
    if (gridApi) {
      const allRows: any[] = [];
      gridApi.forEachNode((node: any) => { if (node.data) allRows.push(node.data); });
      if (allRows.length > 0) gridApi.applyTransaction({ remove: allRows });
    }

    // All 3 filters are now combinable; build query params from whatever is active
    const params: Parameters<typeof fetchSymbols>[0] = {
      PageSize: FILTER_DEFAULT_PAGE_SIZE,
      PageIndex: 1,
    };
    if (exchange) params.Exchange = exchange;
    if (symbolType !== null) params.Type = symbolType;
    if (sector) params.Sector = sector.id;

    // If NO filter is selected, fall back to entire HSX list (cheap exchange-only endpoint)
    const tickerPromise: Promise<string[]> =
      !exchange && symbolType === null && !sector
        ? fetchSymbolsByExchange('HSX')
        : fetchSymbols(params).then((symbols) => {
            // When Type filter is active, ensure server-side type matches
            const filtered =
              symbolType !== null
                ? symbols.filter((s) => s.type === symbolType)
                : symbols;
            return filtered.map((s) => s.ticker);
          });

    const [newTickers] = await Promise.all([
      tickerPromise,
      currentTickers.length > 0 ? unsubscribeFromSymbols(currentTickers) : Promise.resolve(),
    ]);

    if (!newTickers || newTickers.length === 0) return;
    await subscribeToSymbols(newTickers);
  };

  /**
   * Handle exchange filter change.
   * Now COMBINABLE with SymbolType and Sector — selecting Exchange does NOT clear other filters.
   * Only Index (which needs a dedicated API) is cleared because it is incompatible.
   */
  const handleExchangeChange = async (exchange: ExchangeCode | null) => {
    if (!isConnected) return;

    setIsLoadingExchange(true);
    setSelectedExchange(exchange);
    gridApi?.showLoadingOverlay();

    // Exchange changing clears Index (incompatible data source) and WatchList,
    // but KEEPS SymbolType and Sector so they can combine.
    setCurrentWatchListId(null);
    setCurrentWatchListName('Danh mục của tôi');
    currentWatchListTickers.current.clear();
    setSelectedIndex(null);
    hasLoadedDefaultSymbols.current = false;

    try {
      await fetchAndSubscribeWithFilters({
        exchange,
        symbolType: selectedSymbolType,
        sector: selectedSector,
      });
      if (!exchange && selectedSymbolType === null && !selectedSector) {
        hasLoadedDefaultSymbols.current = true;
      }
    } catch (error) {
      console.error(`[StockScreener] Error changing exchange to ${exchange ?? 'default'}:`, error);
    } finally {
      setIsLoadingExchange(false);
    }
  };


  /**
   * Handle index filter change
   * Fetches constituent symbols from the market-indices API and subscribes to them
   */
  const handleIndexChange = async (index: MarketIndex | null) => {
    if (!isConnected) return;

    setIsLoadingIndex(true);
    setSelectedIndex(index);
    gridApi?.showLoadingOverlay();

    const currentTickers = Array.from(marketData.keys());

    // Clear grid immediately
    if (gridApi) {
      const allRows: any[] = [];
      gridApi.forEachNode((node: any) => { if (node.data) allRows.push(node.data); });
      if (allRows.length > 0) gridApi.applyTransaction({ remove: allRows });
    }

    // Reset filter state
    setCurrentWatchListId(null);
    setCurrentWatchListName('Danh mục của tôi');
    currentWatchListTickers.current.clear();
    setSelectedExchange(null);
    setSelectedSector(null);
    activeSectorIdRef.current = null;
    setSelectedSymbolType(null);
    // Prevent the default HSX load from firing
    hasLoadedDefaultSymbols.current = true;

    try {
      // Unsubscribe old tickers and fetch new ones in parallel
      const [response] = await Promise.all([
        index ? getIndexConstituents(index.code, { pageSize: 100 }) : Promise.resolve(null),
        currentTickers.length > 0 ? unsubscribeFromSymbols(currentTickers) : Promise.resolve(),
      ]);

      if (!index) {
        setIsLoadingIndex(false);
        return;
      }

      if (response && response.isSuccess && response.data?.items?.length) {
        const tickers = response.data.items.map((s) => s.ticker);
        await subscribeToSymbols(tickers);
      }
    } catch (error) {
      console.error(`[StockScreener] Error changing to index ${index?.code}:`, error);
    } finally {
      setIsLoadingIndex(false);
    }
  };

  /**
   * Handle sector filter change.
   * Now COMBINABLE with Exchange and SymbolType — selecting Sector does NOT clear other filters.
   * Index is cleared because it uses a different data source (market-indices API).
   */
  const handleSectorChange = async (sector: Sector | null) => {
    if (!isConnected) return;

    // Deselect (null) → keep Exchange + SymbolType but remove Sector
    if (sector === null) {
      activeSectorIdRef.current = null;
      setSelectedSector(null);
      setIsLoadingSector(true);
      gridApi?.showLoadingOverlay();
      try {
        await fetchAndSubscribeWithFilters({
          exchange: selectedExchange,
          symbolType: selectedSymbolType,
          sector: null,
        });
      } catch (error) {
        console.error('[StockScreener] Error deselecting sector:', error);
      } finally {
        setIsLoadingSector(false);
      }
      return;
    }

    // Prevent re-subscribing the same sector
    if (activeSectorIdRef.current === sector.id) return;
    activeSectorIdRef.current = sector.id;

    setIsLoadingSector(true);
    setSelectedSector(sector);
    gridApi?.showLoadingOverlay();

    // Sector changes clear Index and WatchList, but KEEP Exchange and SymbolType
    setCurrentWatchListId(null);
    setCurrentWatchListName('Danh mục của tôi');
    currentWatchListTickers.current.clear();
    setSelectedIndex(null);
    hasLoadedDefaultSymbols.current = false;

    try {
      // Use the shared helper so Exchange + SymbolType are automatically combined
      await fetchAndSubscribeWithFilters({
        exchange: selectedExchange,
        symbolType: selectedSymbolType,
        sector,
      });
    } catch (error) {
      console.error(`[StockScreener] Error changing to sector ${sector.viName}:`, error);
      activeSectorIdRef.current = null;
    } finally {
      setIsLoadingSector(false);
    }
  };


  /**
   * Handle symbol type filter change.
   * Now COMBINABLE with Exchange and Sector — selecting SymbolType does NOT clear other filters.
   * Index is cleared because it uses a different data source.
   */
  const handleSymbolTypeChange = async (type: SymbolType | null) => {
    if (!isConnected) return;

    setIsLoadingSymbolType(true);
    setSelectedSymbolType(type);
    gridApi?.showLoadingOverlay();

    // SymbolType changes clear Index and WatchList, but KEEP Exchange and Sector
    setCurrentWatchListId(null);
    setCurrentWatchListName('Danh mục của tôi');
    currentWatchListTickers.current.clear();
    setSelectedIndex(null);
    hasLoadedDefaultSymbols.current = false;

    try {
      await fetchAndSubscribeWithFilters({
        exchange: selectedExchange,
        symbolType: type,
        sector: selectedSector,
      });
      if (!selectedExchange && type === null && !selectedSector) {
        hasLoadedDefaultSymbols.current = true;
      }
    } catch (error) {
      console.error('[StockScreener] Error changing symbol type:', error);
    } finally {
      setIsLoadingSymbolType(false);
    }
  };


  // Subscribe to default symbols when connected - default is VN30 index
  useEffect(() => {
    if (!isConnected || hasLoadedDefaultSymbols.current) {
      return;
    }

    const loadDefaultSymbols = async () => {
      // Mark as loaded immediately to prevent concurrent runs
      hasLoadedDefaultSymbols.current = true;
      try {
        const response = await getIndexConstituents('VN30', { pageSize: 100 });

        if (!response.isSuccess || !response.data?.items?.length) {
          return;
        }

        const tickers = response.data.items.map((s) => s.ticker);
        // Set selectedIndex to VN30 so the UI reflects the default selection
        setSelectedIndex({ code: 'VN30', name: 'VN30', exchangeCode: 'HSX', isBenchmark: true, status: 1 });
        await subscribeToSymbols(tickers);
      } catch (error) {
        console.error('[StockScreener] Error loading default symbols:', error);
        hasLoadedDefaultSymbols.current = false;
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
   * 
   * CRITICAL: Include currentWatchListId in dependencies để đảm bảo filter được apply
   * khi chuyển đổi giữa Exchange và Watch-list
   */
  useEffect(() => {
    if (!gridApi) {
      return;
    }

    const updateCount = ++gridUpdateDebugCountRef.current;
    const shouldDebugLog = isStockScreenerDebugEnabled() && (updateCount <= 20 || updateCount % 100 === 0);

    if (shouldDebugLog) {
      stockScreenerDebugLog(`Grid sync tick #${updateCount}`, {
        marketDataSize: marketData.size,
        currentWatchListId,
      });
    }

    // CRITICAL: Nếu marketData rỗng nhưng grid vẫn còn rows → Clear grid
    if (marketData.size === 0) {
      const allRows: any[] = [];
      gridApi.forEachNode((node: any) => {
        if (node.data) allRows.push(node.data);
      });
      
      if (allRows.length > 0) {
        console.log('[StockScreener] marketData is empty, clearing', allRows.length, 'rows from grid');
        gridApi.applyTransaction({ remove: allRows });
      }
      return;
    }

    // Chuyển đổi marketData Map thành array để update grid
    const updatedRows = Array.from(marketData.values());
    
    // VALIDATE: Loại bỏ rows không có ticker (invalid data)
    let validRows = updatedRows.filter(row => row && row.ticker);
    
    // FILTER: Nếu đang dùng watch-list, CHỈ hiển thị ticker trong watch-list
    if (currentWatchListId !== null && currentWatchListTickers.current.size > 0) {
      const allowedTickers = currentWatchListTickers.current;
      console.log('[StockScreener] Filtering grid for watch-list. Allowed tickers:', Array.from(allowedTickers));
      
      validRows = validRows.filter(row => 
        allowedTickers.has(row.ticker.toUpperCase())
      );
      
      console.log('[StockScreener] After filter: validRows =', validRows.length, 'rows');
      
      // CLEANUP: Xóa các rows KHÔNG thuộc watch-list khỏi grid
      const rowsToRemove: MarketSymbolDto[] = [];
      gridApi.forEachNode((node: any) => {
        if (node.data?.ticker && !allowedTickers.has(node.data.ticker.toUpperCase())) {
          rowsToRemove.push(node.data);
        }
      });
      
      if (rowsToRemove.length > 0) {
        console.log('[StockScreener] Removing', rowsToRemove.length, 'rows not in watch-list');
        gridApi.applyTransaction({ remove: rowsToRemove });
      }
    }

    if (validRows.length === 0) {
      // Nếu không có rows hợp lệ, skip update nhưng KHÔNG clear grid
      // (grid có thể đã được clear ở trên bởi cleanup logic)
      console.log('[StockScreener] No valid rows to display, skipping grid update');
      return;
    }

    // LẤY danh sách ticker hiện có trong grid, đồng thời phát hiện stale rows
    // (rows có trong grid nhưng không còn trong marketData - do RAF batch race condition)
    const validTickerSet = new Set(validRows.map(r => r.ticker));
    const existingTickers = new Set<string>();
    const staleGridRows: any[] = [];

    gridApi.forEachNode((node: any) => {
      if (node.data?.ticker) {
        if (validTickerSet.has(node.data.ticker)) {
          existingTickers.add(node.data.ticker);
        } else {
          // Row in grid but no longer in marketData (unsubscribed) → remove it
          staleGridRows.push(node.data);
        }
      }
    });

    if (staleGridRows.length > 0) {
      gridApi.applyTransaction({ remove: staleGridRows });

      if (shouldDebugLog) {
        stockScreenerDebugLog('Removed stale rows', {
          count: staleGridRows.length,
          sampleTickers: staleGridRows.slice(0, 5).map((row) => row.ticker),
        });
      }
    }

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

      if (shouldDebugLog) {
        stockScreenerDebugLog('Applying AG Grid transaction', {
          add: rowsToAdd.length,
          update: rowsToUpdate.length,
          sampleAddTickers: rowsToAdd.slice(0, 5).map((row) => row.ticker),
          sampleUpdateTickers: rowsToUpdate.slice(0, 5).map((row) => row.ticker),
        });
      }

      gridApi.applyTransaction(transaction);
      
      // Hide loading overlay when first data arrives
      if (rowsToAdd.length > 0) {
        gridApi.hideOverlay();
      }
      
      // Cập nhật last update time
      setLastUpdateTime(new Date());

      // KHÔNG CẬP NHẬT rowData STATE - để AG Grid tự quản lý data qua Transaction API
      // Việc update state sẽ gây conflict với Transaction API
    }
  }, [marketData, gridApi, currentWatchListId]); // CRITICAL: Add currentWatchListId to dependencies

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
      // BUILD partial column state - update visibility AND width
      const columnState = Object.keys(columns).map(colId => {
        const columnConfig = columns[colId];
        return {
          colId,
          hide: columnConfig?.visible === false,
          width: columnConfig?.width, // Include width to prevent columns rendering at wrong size when shown
        };
      });

      // APPLY column state
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

    // If user is not authenticated, skip user-specific layout loading but still mark as ready
    // so the loading overlay does not block the module for unauthenticated users
    if (!user) {
      setCurrentLayoutId(null);
      setCurrentLayoutName('Layout mặc định');
      setCurrentLayoutIsSystemDefault(false);
      setIsLayoutReady(true);
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
  }, [user, moduleId, workspaceLayoutId, isWorkspaceLayoutIdLoaded, currentPageId, loadLayoutById]);

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
    if (!isConnected) return;

    gridApi?.showLoadingOverlay();

    // Snapshot current tickers before any state changes
    const currentTickers = Array.from(marketData.keys());

    // Clear grid immediately
    if (gridApi) {
      const allRows: any[] = [];
      gridApi.forEachNode((node: any) => { if (node.data) allRows.push(node.data); });
      if (allRows.length > 0) gridApi.applyTransaction({ remove: allRows });
    }

    // Reset filter state
    setCurrentWatchListId(null);
    currentWatchListTickers.current.clear();
    setSelectedExchange(null);
    setSelectedSymbolType(null);
    setSelectedIndex(null);
    setSelectedSector(null);

    try {
      // Unsubscribe old (SignalR) and fetch watch-list detail (REST) in parallel
      const [watchListDetail] = await Promise.all([
        watchListService.getWatchListById(watchList.id),
        currentTickers.length > 0 ? unsubscribeFromSymbols(currentTickers) : Promise.resolve(),
      ]);

      if (!watchListDetail.tickers || watchListDetail.tickers.length === 0) {
        setCurrentWatchListId(watchList.id);
        setCurrentWatchListName(watchList.name);
        return;
      }

      const normalizedTickers = watchListDetail.tickers.map(t => t.toUpperCase());

      // Set watch-list state BEFORE subscribing so the marketData useEffect filters correctly
      setCurrentWatchListId(watchList.id);
      setCurrentWatchListName(watchList.name);
      currentWatchListTickers.current = new Set(normalizedTickers);

      await subscribeToSymbols(normalizedTickers);
    } catch (error) {
      console.error('[StockScreener] Error selecting watch list:', error);
      setCurrentWatchListId(null);
      setCurrentWatchListName('Danh mục của tôi');
      currentWatchListTickers.current.clear();
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
            setCurrentWatchListName('Danh mục của tôi');
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
    if (!isConnected) return;

    try {
      // 1. Check if ticker is already in the current view
      // In watchlist mode: check against watchlist tickers (not marketData which may be stale)
      // In exchange/sector/type mode: check against marketData
      const isAlreadyTracked = currentWatchListId !== null
        ? currentWatchListTickers.current.has(ticker.toUpperCase())
        : marketData.has(ticker.toUpperCase());

      if (isAlreadyTracked) return;

      // 2. If a watch list is selected, update tracking ref BEFORE subscribing
      // so the watchlist filter is active the moment real-time data starts arriving
      if (currentWatchListId !== null) {
        currentWatchListTickers.current.add(ticker.toUpperCase());
      }

      // 3. Subscribe to the ticker
      await subscribeToSymbols([ticker]);

      // 4. If a watch list is selected, persist the change to the backend
      if (currentWatchListId !== null) {
        try {
          // Get current watch list detail
          const watchListDetail = await watchListService.getWatchListById(currentWatchListId);
          
          // Add ticker to tickers array (normalize to uppercase)
          const updatedTickers = [...watchListDetail.tickers, ticker.toUpperCase()];
          
          // Update watch list
          await watchListService.updateWatchList(
            currentWatchListId,
            watchListDetail.name,
            updatedTickers
          );
          
          // Refresh watch lists to update ticker count in dropdown
          await fetchWatchLists();
        } catch (watchListError) {
          // Rollback tracking ref if backend update failed
          currentWatchListTickers.current.delete(ticker.toUpperCase());
          console.error(`[StockScreener] Error updating watch-list:`, watchListError);
          // Don't show error - subscription was successful
        }
      }

    } catch (error) {
      console.error(`[StockScreener] Error subscribing to ${ticker}:`, error);
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
    selectedSector,
    isLoadingSector,
    
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
    handleSectorChange,
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
