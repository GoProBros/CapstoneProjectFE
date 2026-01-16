"use client";

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { useModule } from '@/contexts/ModuleContext';
import { useColumnStore } from '@/stores/columnStore';
import { ColumnSidebar } from '@/components/dashboard/ColumnSidebar';
import { Wifi, WifiOff, Table2 } from 'lucide-react';
import { useSignalR } from '@/contexts/SignalRContext';
import { MarketSymbolDto } from '@/types/market';
import SymbolSearchBox from '@/components/dashboard/SymbolSearchBox';
import ExchangeFilter from './StockScreener/ExchangeFilter';
import SymbolTypeFilter from './StockScreener/SymbolTypeFilter';
import IndexFilter, { type IndexType } from './StockScreener/IndexFilter';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Toast, { ToastType } from '@/components/ui/Toast';
import { fetchSymbolsByExchange, fetchSymbols } from '@/services/symbolService';
import type { ExchangeCode, SymbolType } from '@/types/symbol';
import { SaveLayoutModal, LayoutSelector } from '@/components/dashboard/layout';
import WatchListSelector from '@/components/dashboard/layout/WatchListSelector';
import { HEADER_GREEN } from '@/constants/colors';
import type { ModuleLayoutSummary, ModuleLayoutDetail, ColumnConfig } from '@/types/layout';
import type { WatchListSummary, WatchListDetail } from '@/types/watchList';
import * as layoutService from '@/services/layoutService';
import { watchListService } from '@/services/watchListService';
import { useStockScreener } from '@/hooks/useStockScreener';

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
  // Use custom hook chứa toàn bộ logic
  const {
    // Theme & UI
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
    
    // Helper
    canEditLayout,
  } = useStockScreener();

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
        
        {/* Save Layout Modal - only for creating new layout */}
        <SaveLayoutModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveLayoutSubmit}
          onUpdate={handleUpdateLayoutSubmit}
          currentLayoutId={currentLayoutId}
          currentLayoutName={currentLayoutName}
          isSystemDefault={currentLayoutIsSystemDefault}
          isLoading={isSaving}
          canEdit={canEditLayout(currentLayoutId)}
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
              {/* Symbol Search Box Component */}
              <SymbolSearchBox 
                isConnected={isConnected}
                onSymbolSelect={handleSymbolSelect}
              />
              
              {/* Watch List Selector */}
              <WatchListSelector
                watchLists={watchLists}
                currentWatchListId={currentWatchListId}
                currentWatchListName={currentWatchListName}
                isLoading={isLoadingWatchLists}
                onSelect={handleSelectWatchList}
                onDelete={handleDeleteWatchList}
                onRefresh={fetchWatchLists}
                onCreateNew={handleCreateWatchList}
              />
          
              {/* Index Filter Dropdown */}
              <IndexFilter
                onIndexChange={handleIndexChange}
                isLoading={isLoadingIndex}
                selectedIndex={selectedIndex}
              />

              {/* Symbol Type Filter Dropdown */}
              <SymbolTypeFilter
                onSymbolTypeChange={handleSymbolTypeChange}
                isLoading={isLoadingSymbolType}
                selectedType={selectedSymbolType}
              />
          
              {/* Exchange Filter Buttons */}
              <ExchangeFilter 
                onExchangeChange={handleExchangeChange}
                isLoading={isLoadingExchange}
                selectedExchange={selectedExchange}
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
              {/* Loading indicator when fetching workspace layout */}
              {!isWorkspaceLayoutIdLoaded && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-500/10 text-blue-500 text-xs">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent"></div>
                  <span>Đang tải cấu hình...</span>
                </div>
              )}
              
              {/* Layout Selector Dropdown */}
              <LayoutSelector
                layouts={layouts}
                currentLayoutId={currentLayoutId}
                currentLayoutName={currentLayoutName}
                isLoading={isLoadingLayouts}
                onSelect={handleSelectLayout}
                onDelete={handleDeleteLayout}
                onRefresh={fetchLayouts}
                onCreateNew={handleCreateNewLayout}
              />
            </div>
          </div>
      
          {/* Column Sidebar */}
          <ColumnSidebar />
      
          {/* Loading Overlay - Hide content until layout is ready */}
          {!isLayoutReady && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-[#282832]/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-buttonGreen border-t-transparent"></div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Đang tải cấu hình workspace...
                </span>
              </div>
            </div>
          )}
      
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

