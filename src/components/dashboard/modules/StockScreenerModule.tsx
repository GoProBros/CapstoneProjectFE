"use client";

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { useTheme } from '@/contexts/ThemeContext';
import { useColumnStore } from '@/stores/columnStore';
import { ColumnSidebar } from '@/components/dashboard/ColumnSidebar';
 import { Settings, Save, Download, Wifi, WifiOff, Search } from 'lucide-react';
import { useSignalR } from '@/contexts/SignalRContext';
import { MarketSymbolDto } from '@/types/market';

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
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [draggedTicker, setDraggedTicker] = useState<string | null>(null);
  const [searchTicker, setSearchTicker] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Get column config from Zustand store
  const { columns, setColumnWidth, setColumnVisibility, setSidebarOpen, saveLayoutToDB, loadLayoutFromDB } = useColumnStore();

  // Get SignalR connection và market data
  const { isConnected, subscribeToSymbols, unsubscribeFromSymbols, marketData, connectionState } = useSignalR();
  
  // Logging state - Log MỌI event SignalR nhận được
  const [isLogging, setIsLogging] = useState(false);
  const loggingDataRef = React.useRef<{
    startTime: number;
    signalREvents: Array<{
      timestamp: string;
      elapsed: number;
      eventNumber: number;
      ticker: string;
      rawData: any; // RAW data từ SignalR event (chỉ fields thay đổi hoặc partial data)
    }>;
    symbolStats: Map<string, number>;
    totalEvents: number;
  }>({
    startTime: Date.now(),
    signalREvents: [],
    symbolStats: new Map(),
    totalEvents: 0,
  });

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
        
        console.log(`[StockScreener] Using hardcoded symbols: ${symbols.length} symbols`);
        console.log('[StockScreener] Symbols:', symbols.join(', '));
        
        // Subscribe tới danh sách hardcoded
        await subscribeToSymbols(symbols);
        console.log(`[StockScreener] ✅ Subscribed to ${symbols.length} hardcoded symbols`);
      } catch (error) {
        console.error('[StockScreener] Error subscribing to hardcoded symbols:', error);
      }
    };
    
    fetchAndSubscribeSymbols();

    // Cleanup: Unsubscribe khi component unmount
    // Note: Không cần unsubscribe explicitly vì Context sẽ tự cleanup
  }, [isConnected, subscribeToSymbols]);

  /**
   * Subscribe TRỰC TIẾP vào SignalR service để log RAW events
   * Điều này cho phép bắt CHÍNH XÁC data backend gửi lên (chỉ fields thay đổi)
   * KHÔNG ẢNH HƯỞNG đến việc update grid (grid vẫn nhận từ Context bình thường)
   */
  useEffect(() => {
    if (!isLogging) return;

    // Import SignalR service
    import('@/services/signalRService').then((module) => {
      const SignalRService = module.default;
      const service = SignalRService.getInstance();

      // Subscribe to RAW SignalR events - BẮT DATA TRƯỚC KHI NÓ ĐƯỢC MERGE VÀO MAP
      const unsubscribe = service.onMarketDataReceived((rawData: any) => {
        const timestamp = new Date().toISOString();
        const elapsed = (Date.now() - loggingDataRef.current.startTime) / 1000;
        loggingDataRef.current.totalEvents++;

        // Xác định ticker từ raw data
        const ticker = rawData.ticker || rawData.Ticker || rawData.symbol || 'UNKNOWN';

        // Track symbol statistics
        const currentCount = loggingDataRef.current.symbolStats.get(ticker) || 0;
        loggingDataRef.current.symbolStats.set(ticker, currentCount + 1);

        // ✅ LOG RAW DATA - CHÍNH XÁC NHỮNG GÌ BACKEND GỬI
        loggingDataRef.current.signalREvents.push({
          timestamp,
          elapsed: parseFloat(elapsed.toFixed(1)),
          eventNumber: loggingDataRef.current.totalEvents,
          ticker: ticker,
          rawData: { ...rawData }, // Clone RAW data từ SignalR (chỉ fields thay đổi)
        });

        // Console log để debug real-time (chỉ log mỗi 10 events để tránh spam)
        if (loggingDataRef.current.totalEvents % 10 === 0) {
          console.log(`[StockScreener] 📡 Logged ${loggingDataRef.current.totalEvents} RAW events | Latest:`, {
            ticker,
            fieldsCount: Object.keys(rawData).length,
            fields: Object.keys(rawData).join(', '),
          });
        }
      });

      // Cleanup khi unmount hoặc stop logging
      return () => {
        unsubscribe();
      };
    });
  }, [isLogging]);

  /**
   * Update row data khi nhận được market data từ SignalR
   * SỬ DỤNG AG GRID TRANSACTION API - Chỉ update cells thay đổi, KHÔNG reload toàn bộ grid
   * Grid LUÔN LUÔN update từ marketData Map (từ Context), BẤT KỂ có logging hay không
   */
  useEffect(() => {
    console.log(`[StockScreener] 🔄 marketData changed: ${marketData.size} symbols`);
    
    if (marketData.size === 0 || !gridApi) {
      console.log('[StockScreener] ⚠️ Skip update: marketData empty or grid not ready');
      return;
    }

    // Chuyển đổi marketData Map thành array để update grid
    const updatedRows = Array.from(marketData.values());
    
    // VALIDATE: Loại bỏ rows không có ticker (invalid data)
    const validRows = updatedRows.filter(row => {
      if (!row || !row.ticker) {
        console.warn('[StockScreener] Invalid row data detected (missing ticker):', row);
        return false;
      }
      return true;
    });

    if (validRows.length === 0) {
      console.warn('[StockScreener] No valid rows to process');
      return;
    }

    console.log(`[StockScreener] 📊 Processing ${validRows.length} valid rows for grid update`);

    // LẤY danh sách ticker hiện có trong grid
    const existingTickers = new Set<string>();
    gridApi.forEachNode((node: any) => {
      if (node.data?.ticker) {
        existingTickers.add(node.data.ticker);
      }
    });

    console.log(`[StockScreener] 📋 Grid currently has ${existingTickers.size} rows`);

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

    console.log(`[StockScreener] 🎯 Will ADD ${rowsToAdd.length} rows, UPDATE ${rowsToUpdate.length} rows`);

    // SỬ DỤNG TRANSACTION API - CHỈ UPDATE CELLS THAY ĐỔI
    if (rowsToAdd.length > 0 || rowsToUpdate.length > 0) {
      // Apply transaction - AG Grid tự động xác định cells nào thay đổi
      const transaction: any = {};
      if (rowsToAdd.length > 0) transaction.add = rowsToAdd;
      if (rowsToUpdate.length > 0) transaction.update = rowsToUpdate;

      const result = gridApi.applyTransaction(transaction);
      
      // Debug log để kiểm tra transaction result
      if (result) {
        console.log(`[StockScreener] ✅ Grid transaction applied:`, {
          added: result.add?.length || 0,
          updated: result.update?.length || 0,
          totalRows: gridApi.getDisplayedRowCount(),
        });
        
        // Log sample của data được update
        if (rowsToUpdate.length > 0) {
          const sampleRow = rowsToUpdate[0];
          console.log(`[StockScreener] 📝 Sample updated row:`, {
            ticker: sampleRow.ticker,
            lastPrice: sampleRow.lastPrice,
            bidPrice1: sampleRow.bidPrice1,
            askPrice1: sampleRow.askPrice1,
          });
        }
        
        // ✅ FLASH ANIMATION - Chỉ flash cells thực sự thay đổi
        if (result.update && result.update.length > 0) {
          // AG Grid tự động flash cells có value thay đổi nhờ enableCellChangeFlash: true
          // KHÔNG cần force refresh vì sẽ flash tất cả cells (kể cả không đổi)
          console.log(`[StockScreener] 💫 Transaction applied - AG Grid auto-flashing changed cells only`);
        }
      }

      // KHÔNG CẬP NHẬT rowData STATE - để AG Grid tự quản lý data qua Transaction API
      // Việc update state sẽ gây conflict với Transaction API
    } else {
      console.log('[StockScreener] ⏭️ No changes needed - all rows already exist and up-to-date');
    }
  }, [marketData, gridApi]);

  // Persist column width changes to Zustand
  const onColumnResized = useCallback((event: any) => {
    // Chỉ lưu khi user thực sự resize (không phải từ applyColumnState)
    if (event.finished && event.column && event.source === 'uiColumnDragged') {
      const field = event.column.getColId();
      const width = event.column.getActualWidth();
      console.log(`[StockScreener] Column resized: ${field} -> ${width}px`);
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
      console.log(`[StockScreener] Column visibility changed: ${field} -> ${visible} (source: ${event.source})`);
      setColumnVisibility(field, visible);
    }
    
    // CASE 2: Multiple columns change (event.columns) - XẢY RA KHI DRAG COLUMN GROUP
    if (event.columns && Array.isArray(event.columns)) {
      console.log(`[StockScreener] 🔄 Group visibility changed: ${event.columns.length} columns (source: ${event.source})`);
      
      event.columns.forEach((column: any) => {
        const field = column.getColId();
        const visible = event.visible;
        console.log(`  - ${field} -> ${visible}`);
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
        console.log('[StockScreener] ✅ Applied saved column state');
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
        console.log('[StockScreener] 🔄 Synced column visibility from sidebar (partial update)');
      }
    } catch (error) {
      console.error('[StockScreener] Error syncing column visibility:', error);
    }
  }, [columns, gridApi]); // Re-run khi columns thay đổi

  // Handle save layout
  const handleSaveLayout = async () => {
    setIsSaving(true);
    try {
      // Lấy column widths từ AG Grid
      const columnWidths = gridApi ? gridApi.getColumnState() : [];
      
      // Lấy danh sách tickers đang hiển thị
      const symbols = Array.from(marketData.keys());
      
      console.log('[StockScreener] Saving layout with:');
      console.log(`  - ${columnWidths.length} column widths`);
      console.log(`  - ${symbols.length} symbols: ${symbols.join(', ')}`);
      
      await saveLayoutToDB(columnWidths, symbols);
      alert(`Layout đã được lưu thành công!\n\n` +
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
      await loadLayoutFromDB();
      alert('Layout đã được tải thành công!');
    } catch (error) {
      alert('Có lỗi khi tải layout. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle search and subscribe to new symbol
  const handleSearchAndSubscribe = async () => {
    if (!searchTicker.trim()) return;
    
    const ticker = searchTicker.trim().toUpperCase();
    
    // Kiểm tra xem mã đã được subscribe chưa
    if (marketData.has(ticker)) {
      alert(`⚠️ Mã ${ticker} đã được theo dõi rồi!`);
      setSearchTicker('');
      return;
    }
    
    setIsSearching(true);
    try {
      console.log(`[StockScreener] 🔍 Searching and subscribing to: ${ticker}`);
      await subscribeToSymbols([ticker]);
      console.log(`[StockScreener] ✅ Successfully subscribed to ${ticker}`);
      setSearchTicker('');
      alert(`✅ Đã subscribe thành công mã ${ticker}!`);
    } catch (error) {
      console.error(`[StockScreener] ❌ Failed to subscribe to ${ticker}:`, error);
      alert(`❌ Lỗi khi subscribe mã ${ticker}. Vui lòng kiểm tra mã và thử lại.`);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle row drag end - unsubscribe nếu kéo ra ngoài grid
  const handleRowDragEnd = useCallback(async (event: any) => {
    console.log('[StockScreener] 🔍 Row drag end event:', {
      hasNode: !!event.node,
      ticker: event.node?.data?.ticker,
      hasOverNode: !!event.overNode,
      overIndex: event.overIndex,
      y: event.y,
      vDirection: event.vDirection,
    });
    
    const ticker = event.node?.data?.ticker;
    if (!ticker) {
      console.warn('[StockScreener] No ticker found in drag event');
      return;
    }
    
    // Kiểm tra nếu drag ra ngoài grid
    // AG Grid rowDrag không reliable cho "outside grid" detection
    // Workaround: Check if overNode is null AND not dragging to reorder
    const isOutsideGrid = !event.overNode && event.overIndex === -1;
    
    console.log('[StockScreener] isOutsideGrid:', isOutsideGrid);
    
    if (isOutsideGrid) {
      const confirmUnsubscribe = window.confirm(
        `Bạn có muốn bỏ theo dõi mã ${ticker}?\n\n` +
        'Mã này sẽ được xóa khỏi danh sách và không nhận dữ liệu real-time nữa.'
      );
      
      if (confirmUnsubscribe) {
        try {
          console.log(`[StockScreener] Unsubscribing from ticker: ${ticker}`);
          
          // 1. Unsubscribe từ SignalR
          await unsubscribeFromSymbols([ticker]);
          
          // 2. Xóa row khỏi grid
          if (gridApi) {
            const rowNode = gridApi.getRowNode(ticker);
            if (rowNode) {
              gridApi.applyTransaction({ remove: [rowNode.data] });
              console.log(`[StockScreener] ✅ Removed ${ticker} from grid`);
            }
          }
          
          // 3. Thông báo thành công
          console.log(`[StockScreener] ✅ Unsubscribed from ${ticker}`);
        } catch (error) {
          console.error(`[StockScreener] Error unsubscribing from ${ticker}:`, error);
          alert(`Lỗi khi bỏ theo dõi mã ${ticker}. Vui lòng thử lại.`);
        }
      }
    } else {
      console.log('[StockScreener] Drag within grid - no action');
    }
  }, [gridApi, unsubscribeFromSymbols]);
  
  // Start logging
  const handleStartLogging = () => {
    // Reset logging data
    loggingDataRef.current = {
      startTime: Date.now(),
      signalREvents: [],
      symbolStats: new Map(),
      totalEvents: 0,
    };
    
    setIsLogging(true);
    console.log('[StockScreener] Started logging ALL SignalR events');
    console.log(`[StockScreener] Tracking ${marketData.size} symbols`);
  };
  
  // Stop logging and save to file
  const handleStopLogging = async () => {
    setIsLogging(false);
    
    const endTime = Date.now();
    const duration = (endTime - loggingDataRef.current.startTime) / 1000;
    const totalEvents = loggingDataRef.current.totalEvents;
    
    console.log('[StockScreener] Stopped logging. Statistics:');
    console.log(`  Total SignalR events: ${totalEvents}`);
    console.log(`  Unique symbols: ${loggingDataRef.current.symbolStats.size}`);
    console.log(`  Duration: ${duration.toFixed(1)}s`);
    console.log(`  Average rate: ${(totalEvents / duration).toFixed(2)} events/sec`);
    console.log(`  Top 5 active symbols:`, 
      Array.from(loggingDataRef.current.symbolStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ticker, count]) => `${ticker}(${count})`)
    );
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // SỬ DỤNG JSONL (JSON Lines) - STREAMING FORMAT
      // Mỗi event = 1 dòng JSON → KHÔNG cần stringify toàn bộ array
      const EVENTS_PER_FILE = 500; // Tăng lên vì JSONL nhẹ hơn
      const totalFiles = Math.ceil(totalEvents / EVENTS_PER_FILE);
      
      console.log(`[StockScreener] Creating ${totalFiles} JSONL files (${EVENTS_PER_FILE} events each)...`);
      
      // 1. TẠO FILE SUMMARY
      const summaryData = {
        format: 'JSONL (JSON Lines) - One event per line',
        testInfo: {
          startTime: new Date(loggingDataRef.current.startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          duration: duration.toFixed(1) + 's',
          component: 'StockScreenerModule - Full Raw Data (JSONL)',
          subscribedSymbols: Array.from(marketData.keys()),
          totalDataFiles: totalFiles,
        },
        summary: {
          totalSignalREvents: totalEvents,
          uniqueSymbols: loggingDataRef.current.symbolStats.size,
          averageRate: (totalEvents / duration).toFixed(2) + ' events/sec',
          eventsPerFile: EVENTS_PER_FILE,
          symbolStats: Array.from(loggingDataRef.current.symbolStats.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([ticker, count]) => ({ ticker, count })),
          topActiveSymbols: Array.from(loggingDataRef.current.symbolStats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([ticker, count]) => ({ ticker, eventCount: count })),
        },
        howToRead: 'Each .jsonl file contains one JSON object per line. Use JSON.parse() for each line.',
        dataFiles: [] as string[],
      };
      
      // Download summary file
      const summaryBlob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' });
      const summaryUrl = URL.createObjectURL(summaryBlob);
      const summaryLink = document.createElement('a');
      summaryLink.href = summaryUrl;
      summaryLink.download = `signalr-summary-${timestamp}.json`;
      document.body.appendChild(summaryLink);
      summaryLink.click();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      document.body.removeChild(summaryLink);
      URL.revokeObjectURL(summaryUrl);
      
      // 2. TẠO CÁC FILE JSONL - STREAMING WRITE
      for (let fileIdx = 0; fileIdx < totalFiles; fileIdx++) {
        const startIdx = fileIdx * EVENTS_PER_FILE;
        const endIdx = Math.min(startIdx + EVENTS_PER_FILE, totalEvents);
        
        // BUILD JSONL STRING - MỖI EVENT = 1 DÒNG
        let jsonlContent = '';
        
        // Header line (metadata)
        jsonlContent += JSON.stringify({
          _fileInfo: {
            fileNumber: fileIdx + 1,
            totalFiles: totalFiles,
            eventsInThisFile: endIdx - startIdx,
            eventRange: `${startIdx + 1} - ${endIdx}`,
          }
        }) + '\n';
        
        // Data lines - MỖI EVENT TRÊN 1 DÒNG
        for (let i = startIdx; i < endIdx; i++) {
          const event = loggingDataRef.current.signalREvents[i];
          
          // TẠO 1 DÒNG JSON - KHÔNG stringify cả array
          const eventLine = JSON.stringify({
            timestamp: event.timestamp,
            elapsed: event.elapsed,
            eventNumber: event.eventNumber,
            ticker: event.ticker,
            data: event.rawData, // Full raw data
          });
          
          jsonlContent += eventLine + '\n';
        }
        
        // Create blob và download
        const blob = new Blob([jsonlContent], { type: 'application/x-ndjson' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `signalr-data-${timestamp}-part${(fileIdx + 1).toString().padStart(3, '0')}.jsonl`;
        link.download = filename;
        
        summaryData.dataFiles.push(filename);
        
        document.body.appendChild(link);
        link.click();
        
        // Đợi giữa các downloads
        await new Promise(resolve => setTimeout(resolve, 150));
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`[StockScreener] Downloaded file ${fileIdx + 1}/${totalFiles} (${endIdx - startIdx} events)`);
      }
      
      alert(`✅ Log đã được lưu thành công!\n\n` +
            `📊 Thống kê:\n` +
            `• Format: JSONL (JSON Lines - streaming)\n` +
            `• Tổng: ${totalEvents} SignalR events (FULL raw data)\n` +
            `• ${loggingDataRef.current.symbolStats.size} mã chứng khoán\n` +
            `• Thời gian: ${duration.toFixed(1)}s\n` +
            `• Tốc độ: ${(totalEvents / duration).toFixed(2)} events/giây\n\n` +
            `💾 Đã tải xuống:\n` +
            `• 1 file summary.json (tổng quan)\n` +
            `• ${totalFiles} file .jsonl (${EVENTS_PER_FILE} events/file)\n\n` +
            `📁 Tổng cộng: ${totalFiles + 1} files\n\n` +
            `💡 Cách đọc: Mỗi dòng trong .jsonl là 1 JSON object`);
            
    } catch (error) {
      console.error('[StockScreener] Error saving log:', error);
      alert('❌ Lỗi khi tải log file!\n\n' + 
            `Lỗi: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
            'Kiểm tra Console (F12) để xem chi tiết.');
    }
  };
  
  // Add FPT symbol for testing
  const handleAddFPTSymbol = async () => {
    if (!isConnected) {
      alert('SignalR chưa kết nối! Vui lòng đợi kết nối.');
      return;
    }
    
    // Kiểm tra xem FPT đã được subscribe chưa
    if (marketData.has('FPT')) {
      alert('⚠️ Mã FPT đã được subscribe rồi!\n\n' + 
            `Tổng số mã đang theo dõi: ${marketData.size}\n` +
            `Trạng thái logging: ${isLogging ? 'Đang ghi log (' + loggingDataRef.current.totalEvents + ' events)' : 'Chưa bật'}\n\n` +
            'Để test logging:\n' +
            '1. Click "Start Logging" để bắt đầu ghi log\n' +
            '2. Đợi một vài giây để nhận dữ liệu real-time\n' +
            '3. Click "Stop & Save Log" để tải file log');
      return;
    }
    
    setIsSubscribing(true);
    try {
      console.log('[StockScreener] 🧪 Testing: Adding FPT symbol to subscription list');
      await subscribeToSymbols(['FPT']);
      console.log('[StockScreener] ✅ Successfully subscribed to FPT');
      alert('✅ Đã subscribe thành công mã FPT!\n\n' + 
            'Hướng dẫn test logging:\n\n' +
            '1️⃣ Click "Start Logging" để bắt đầu ghi log\n' +
            '2️⃣ Đợi ít nhất 10-30 giây để nhận dữ liệu real-time từ SignalR\n' +
            '3️⃣ Quan sát số events tăng lên trên nút "Stop & Save Log"\n' +
            '4️⃣ Click "Stop & Save Log" để tải file JSON với đầy đủ dữ liệu\n\n' +
            '💡 Tip: Kiểm tra Console (F12) để xem log chi tiết');
    } catch (error) {
      console.error('[StockScreener] ❌ Failed to subscribe to FPT:', error);
      alert('❌ Lỗi khi subscribe mã FPT. Kiểm tra console để xem chi tiết.');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Định nghĩa cột và nhóm cột - THEO LAYOUT HÌNH
  const columnDefs: (ColDef | ColGroupDef)[] = useMemo(() => [
    // CỘT CỐ ĐỊNH BÊN TRÁI - Thứ tự: CK → Trần → Sàn → TC
    {
      field: 'ticker',
      headerName: 'CK',
      width: 80,
      pinned: 'left',
      filter: true,
      rowDrag: true, // Enable drag & drop để unsubscribe
      cellClass: 'font-bold text-blue-500 cursor-pointer text-xs',
    },
    {
      field: 'ceilingPrice',
      headerName: 'Trần',
      width: 80,
      pinned: 'left',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => formatPrice(params.value),
      cellClass: 'text-purple-500 font-semibold text-xs',
    },
    {
      field: 'floorPrice',
      headerName: 'Sàn',
      width: 80,
      pinned: 'left',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => formatPrice(params.value),
      cellClass: 'text-cyan-500 font-semibold text-xs',
    },
    {
      field: 'referencePrice',
      headerName: 'TC',
      width: 80,
      pinned: 'left',
      filter: 'agNumberColumnFilter',
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
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.value) return 'text-red-600 text-xs';
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
          filter: 'agNumberColumnFilter',
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
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.value) return 'text-red-600 font-semibold text-xs';
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
          filter: 'agNumberColumnFilter',
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
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.value) return 'text-red-600 font-bold text-xs';
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
          filter: 'agNumberColumnFilter',
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
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.value) return 'font-bold text-xs';
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
          filter: 'agNumberColumnFilter',
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
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => {
            if (!params.value) return '0';
            return params.value > 0 ? `+${params.value.toFixed(2)}` : params.value.toFixed(2);
          },
          cellClass: (params) => {
            if (!params.value) return 'text-xs';
            return params.value > 0 ? 'text-green-500 font-semibold text-xs' : params.value < 0 ? 'text-red-500 font-semibold text-xs' : 'text-xs';
          },
        },
        { 
          field: 'ratioChange',
          headerName: '+/- (%)', 
          width: 90, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => {
            if (!params.value) return '0%';
            const pct = (params.value * 100).toFixed(2);
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
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.value) return 'text-green-600 font-bold text-xs';
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
          filter: 'agNumberColumnFilter',
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
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.value) return 'text-green-600 font-semibold text-xs';
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
          filter: 'agNumberColumnFilter',
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
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.value) return 'text-green-600 text-xs';
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
          filter: 'agNumberColumnFilter',
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
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: 'font-semibold text-xs',
        },
        { 
          field: 'highest',
          headerName: 'Cao', 
          width: 85, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.value) return 'text-green-600 font-semibold text-xs';
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
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => formatPrice(params.value),
          cellClass: (params) => {
            if (!params.data?.referencePrice || !params.value) return 'text-red-600 font-semibold text-xs';
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
          filter: 'agNumberColumnFilter',
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
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          hide: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'side',
          headerName: 'Chiều', 
          width: 70, 
          filter: true,
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
          filter: true,
          hide: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'tradingStatus',
          headerName: 'Trạng thái', 
          width: 100, 
          filter: true,
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
          filter: 'agNumberColumnFilter', 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'volTB50', 
          headerName: 'KLTB (50 phiên)',
          width: columns.volTB50?.width || 140, 
          filter: 'agNumberColumnFilter', 
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'KL1KLTB',
          headerName: '%KLTB', 
          width: columns.KL1KLTB?.width || 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${params.value}%` : '0%',
          cellClass: 'text-xs',
        },
        { 
          field: 'bulVol',
          headerName: 'Bull Vol (5p)', 
          width: columns.bulVol?.width || 130, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'bearVol',
          headerName: 'Bear Vol (5p)', 
          width: columns.bearVol?.width || 130, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value?.toLocaleString() || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'NGANHAN',
          headerName: 'Ngắn hạn', 
          width: columns.NGANHAN?.width || 110, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'TRUNGHAN',
          headerName: 'Trung hạn', 
          width: columns.TRUNGHAN?.width || 110, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'DAIHAN',
          headerName: 'Dài hạn', 
          width: columns.DAIHAN?.width || 110, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'SUCMANH',
          headerName: 'Sức mạnh', 
          width: columns.SUCMANH?.width || 120, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'RS',
          headerName: 'RS', 
          width: columns.RS?.width || 80, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'rrg',
          headerName: 'RRG', 
          width: columns.rrg?.width || 100, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'signalSMC',
          headerName: 'Signal SMC', 
          width: columns.signalSMC?.width || 120, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'AiTrend',
          headerName: 'AI Trend', 
          width: columns.AiTrend?.width || 110, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'pVWMA20',
          headerName: '%VWMA20', 
          width: columns.pVWMA20?.width || 110, 
          filter: 'agNumberColumnFilter',
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
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: (params) => params.value > 0 ? 'text-green-500 text-xs' : 'text-red-500 text-xs',
        },
        { 
          field: 'plow52W',
          headerName: '%Low 52W', 
          width: columns.plow52W?.width || 110, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: 'text-xs',
        },
        { 
          field: 'pMA20',
          headerName: '%MA20', 
          width: columns.pMA20?.width || 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: 'text-xs',
        },
        { 
          field: 'pMA50',
          headerName: '%MA50', 
          width: columns.pMA50?.width || 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: 'text-xs',
        },
        { 
          field: 'pMA100',
          headerName: '%MA100', 
          width: columns.pMA100?.width || 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: 'text-xs',
        },
        { 
          field: 'pMA200',
          headerName: '%MA200', 
          width: columns.pMA200?.width || 100, 
          filter: 'agNumberColumnFilter',
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
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'ROE',
          headerName: 'ROE', 
          width: columns.ROE?.width || 80, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${params.value}%` : '0%',
          cellClass: 'text-xs',
        },
        { 
          field: 'BLNR',
          headerName: 'BLNR', 
          width: columns.BLNR?.width || 80, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'diemBinhquan',
          headerName: 'Action Score', 
          width: columns.diemBinhquan?.width || 120, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'DG_bq',
          headerName: 'Định giá', 
          width: columns.DG_bq?.width || 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'skTaichinh',
          headerName: 'Sức khỏe TC', 
          width: columns.skTaichinh?.width || 120, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'mohinhKinhdoanh',
          headerName: 'Mô hình KD', 
          width: columns.mohinhKinhdoanh?.width || 120, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'hieuquaHoatdong',
          headerName: 'Hiệu quả HĐ', 
          width: columns.hieuquaHoatdong?.width || 120, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'diemKythuat',
          headerName: 'Điểm KT', 
          width: columns.diemKythuat?.width || 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'BAT',
          headerName: 'BAT', 
          width: columns.BAT?.width || 80, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'AIPredict20d',
          headerName: 'AI Predict 20d', 
          width: columns.AIPredict20d?.width || 130, 
          filter: 'agNumberColumnFilter',
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
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'pattern',
          headerName: 'Pattern', 
          width: columns.pattern?.width || 150, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'vungcau',
          headerName: 'Vùng cầu', 
          width: columns.vungcau?.width || 120, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'vungcung',
          headerName: 'Vùng cung', 
          width: columns.vungcung?.width || 120, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'hotro',
          headerName: 'Hỗ trợ', 
          width: columns.hotro?.width || 100, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'khangcu',
          headerName: 'Kháng cự', 
          width: columns.khangcu?.width || 100, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'kenhduoi',
          headerName: 'Kênh dưới', 
          width: columns.kenhduoi?.width || 120, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'kenhtren',
          headerName: 'Kênh trên', 
          width: columns.kenhtren?.width || 120, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'cmtTA',
          headerName: 'Comment TA', 
          width: columns.cmtTA?.width || 250, 
          filter: true,
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
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'GIAMUA',
          headerName: 'Giá mua', 
          width: columns.GIAMUA?.width || 100, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'GIABAN',
          headerName: 'Giá bán', 
          width: columns.GIABAN?.width || 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'LAILO',
          headerName: 'Lãi/Lỗ', 
          width: columns.LAILO?.width || 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${params.value}%` : '0%',
          cellClass: (params) => params.value > 0 ? 'text-green-500 text-xs' : params.value < 0 ? 'text-red-500 text-xs' : 'text-gray-500 text-xs',
        },
        { 
          field: 'NGAYMUA',
          headerName: 'Ngày mua', 
          width: columns.NGAYMUA?.width || 120, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'NGAYBAN',
          headerName: 'Ngày bán', 
          width: columns.NGAYBAN?.width || 120, 
          filter: true,
          cellClass: 'text-xs',
        },
        { 
          field: 'TTDT',
          headerName: 'TTDT', 
          width: columns.TTDT?.width || 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value || '0',
          cellClass: 'text-xs',
        },
        { 
          field: 'TTLN',
          headerName: 'TTLN', 
          width: columns.TTLN?.width || 100, 
          filter: 'agNumberColumnFilter',
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
    filter: true,
    floatingFilter: true, // ✅ Community Edition - Filter ngay dưới header
    // QUAN TRỌNG: Enable cell flash animation cho real-time updates
    enableCellChangeFlash: true,
    // Tắt auto-size để tránh grid resize liên tục
    suppressSizeToFit: true,
  }), []);

  return (
    <div className={`w-full h-full rounded-lg p-4 border ${
      isDark ? 'bg-[#282832] border-gray-800' : 'bg-white border-gray-200'
    }`}>
      <div className='flex justify-between items-center mb-4'>
        <div className="flex items-center gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Stock Screener
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {marketData.size > 0 ? `${marketData.size} stocks receiving real-time data` : 'Waiting for real-time data...'}
              {marketData.size > 0 && ` • Last update: ${new Date().toLocaleTimeString()}`}
            </p>
          </div>
          
          {/* Search Box - Subscribe to new symbols */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Nhập mã CK để subscribe..."
              value={searchTicker}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                setSearchTicker(value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchAndSubscribe();
                }
              }}
              disabled={!isConnected || isSearching}
              className={`pl-9 pr-4 py-1.5 rounded-lg text-sm border transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 disabled:opacity-50' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 disabled:opacity-50'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
            {isSearching ? (
              <div className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <span className="animate-spin">⏳</span>
              </div>
            ) : searchTicker && (
              <button
                onClick={() => setSearchTicker('')}
                className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Connection Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {isConnected ? (
              <>
                <Wifi size={14} className="animate-pulse" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={14} />
                <span>{connectionState}</span>
              </>
            )}
          </div>
          
          {/* Real-time Data Stats */}
          {isConnected && marketData.size > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
              isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <span className="font-mono font-semibold">{marketData.size}</span>
              <span>stocks streaming</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Test Subscribe Button - Add FPT Symbol */}
          <button
            onClick={handleAddFPTSymbol}
            disabled={!isConnected || isSubscribing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-orange-600 hover:bg-orange-700 text-white disabled:bg-orange-800 disabled:opacity-50' 
                : 'bg-orange-500 hover:bg-orange-600 text-white disabled:bg-orange-300'
            }`}
            title="Test subscribe: Thêm mã FPT vào danh sách theo dõi"
          >
            <span className="text-lg">🧪</span>
            {isSubscribing ? 'Đang subscribe...' : 'Test FPT'}
          </button>
          
          {/* Data Logging Button */}
          {!isLogging ? (
            <button
              onClick={handleStartLogging}
              disabled={!isConnected || marketData.size === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-purple-800 disabled:opacity-50' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white disabled:bg-purple-300'
              }`}
              title="Start logging real-time data from Redis"
            >
              <Save size={18} />
              Start Logging
            </button>
          ) : (
            <button
              onClick={handleStopLogging}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors animate-pulse ${
                isDark 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              title={`Stop logging (${loggingDataRef.current.totalEvents} SignalR events recorded)`}
            >
              <Download size={18} />
              Stop & Save Log ({loggingDataRef.current.totalEvents})
            </button>
          )}
          
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
          
          {/* Load Layout Button - Icon Only */}
          <button
            onClick={handleLoadLayout}
            disabled={isLoading}
            title="Load layout"
            className={`flex items-center justify-center p-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-800 disabled:opacity-50' 
                : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-green-300'
            }`}
          >
            <Download size={18} />
          </button>
          
          {/* Column Manager Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            <Settings size={18} />
            Quản lý cột
          </button>
        </div>
      </div>
      
      {/* Column Sidebar */}
      <ColumnSidebar />
      
      <div className={`w-full h-[calc(100%-3rem)] ${isDark ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}`}>
        <AgGridReact
          rowData={undefined}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          animateRows={true}
          theme="legacy"
          rowDragManaged={false}
          suppressMoveWhenRowDragging={true}
          onGridReady={(params) => {
            setGridApi(params.api);
            console.log('[StockScreener] ✅ AG Grid ready - using Transaction API mode (no rowData prop)');
          }}
          onColumnResized={onColumnResized}
          onColumnVisible={onColumnVisible}
          onRowDragEnd={handleRowDragEnd}
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
          // Debug callbacks
          onRowDataUpdated={(event) => {
            console.log(`[StockScreener] 📊 Grid updated: ${event.api.getDisplayedRowCount()} rows displayed`);
          }}
          onCellValueChanged={(event) => {
            console.log(`[StockScreener] 🔥 Cell changed: ${event.data.ticker} - ${event.colDef.field} = ${event.newValue}`);
          }}
        />
      </div>
    </div>
  );
}
