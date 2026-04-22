"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  ColDef,
  ColGroupDef,
  ModuleRegistry,
  AllCommunityModule,
} from "ag-grid-community";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { useModule } from "@/contexts/ModuleContext";
import { useColumnStore } from "@/stores/columnStore";
import { ColumnSidebar } from "@/features/dashboard/components/ColumnSidebar";
import { Wifi, WifiOff, Table2, Link2, Link2Off } from "lucide-react";
import { useSignalR } from "@/contexts/SignalRContext";
import { MarketSymbolDto } from "@/types/market";
import SymbolSearchBox from "@/features/dashboard/components/SymbolSearchBox";
import ExchangeFilter from "./ExchangeFilter";
import SectorFilter from "./SectorFilter";
import SymbolTypeFilter from "./SymbolTypeFilter";
import IndexFilter from "./IndexFilter";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast, { ToastType } from "@/components/ui/Toast";
import { fetchSymbolsByExchange, fetchSymbols } from "@/services/market/symbolService";
import type { ExchangeCode, SymbolType } from "@/types/symbol";
import { SaveLayoutModal, LayoutSelector } from "@/features/dashboard/components/layout";
import WatchListSelector from "@/features/dashboard/components/layout/WatchListSelector";
import type {
  ModuleLayoutSummary,
  ModuleLayoutDetail,
  ColumnConfig,
} from "@/types/layout";
import type { WatchListSummary, WatchListDetail } from "@/types/watchList";
import * as layoutService from "@/services/workspace/layoutService";
import { useSelectedSymbolStore } from "@/stores/selectedSymbolStore";
import { watchListService } from "@/services/watchListService";
import { useStockScreener } from './useStockScreener';

// Module type constant for Stock Screener
const MODULE_TYPE_STOCK_SCREENER = 1;

// Đăng ký modules AG-Grid (bắt buộc từ v31+)
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Helper function: Format giá VND chia cho 1000
 * VD: 86500 → 86.5, 24300 → 24.3
 */
const formatPrice = (value: number | null | undefined): string => {
  if (!value) return "";
  return (value / 1000).toFixed(2);
};

/**
 * Returns true when a row is in a "zero session" state
 * (both matched price and matched volume are 0).
 * In this case, only the 4 basic columns should show values.
 */
const isZeroSession = (data: any): boolean => {
  if (!data) return false;

  const hasOrderBook =
    !!data.bidPrice1 ||
    !!data.bidVol1 ||
    !!data.askPrice1 ||
    !!data.askVol1 ||
    !!data.bidPrice2 ||
    !!data.bidVol2 ||
    !!data.askPrice2 ||
    !!data.askVol2 ||
    !!data.bidPrice3 ||
    !!data.bidVol3 ||
    !!data.askPrice3 ||
    !!data.askVol3;

  if (hasOrderBook) {
    // Auction phases (ATO/ATC) can have order-book data while lastPrice/lastVol are 0.
    return false;
  }

  return (
    (!data.lastPrice || data.lastPrice === 0) &&
    (!data.lastVol || data.lastVol === 0)
  );
};

/**
 * Vietnamese stock exchange price color convention:
 *  - Purple (tím)        = at or above ceiling price (giá trần)
 *  - Blue   (xanh dương)   = at or below floor price   (giá sàn)
 *  - Green  (xanh lá)    = above reference price     (giá TC)
 *  - Red    (đỏ)          = below reference price
 *  - Yellow (vàng)       = equal to reference price
 *
 * @param value  The price to color
 * @param data   Row data (must contain referencePrice, ceilingPrice, floorPrice)
 * @param weight Optional font-weight class ('font-semibold' | 'font-bold')
 */
const getPriceColorClass = (
  value: number | null | undefined,
  data: any,
  weight: "" | "font-semibold" | "font-bold" = "",
): string => {
  const base = weight ? `${weight} text-xs` : "text-xs";
  if (!value || !data?.referencePrice) return base;
  if (data.ceilingPrice && value >= data.ceilingPrice)
    return `text-purple-500 ${base}`;
  if (data.floorPrice && value <= data.floorPrice)
    return `text-blue-500 ${base}`;
  if (value > data.referencePrice) return `text-green-500 ${base}`;
  if (value < data.referencePrice) return `text-red-500 ${base}`;
  return `text-yellow-500 ${base}`;
};

export function StockScreenerModule() {
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
    handleGridBodyScroll,
    handleRowDragEnter,
    handleRowDragLeave,

    // Helper
    canEditLayout,
    highlightedTicker,
    setIsLinked,
    setTickerHighlight,
  } = useStockScreener();

  const [isLinked, setIsLinkedLocal] = useState(true);
  const handleToggleLink = useCallback(() => {
    setIsLinkedLocal(v => {
      setIsLinked(!v);
      return !v;
    });
  }, [setIsLinked]);

  // Định nghĩa cột và nhóm cột - THEO LAYOUT HÌNH
  // QUAN TRỌANG: deps là [] để columnDefs không bao giờ được recreate khi columns visibility thay đổi.
  // Việc recreate columnDefs sẽ khiến AG Grid re-process toàn bộ column, gây ra race condition
  // giữa column def và applyColumnState, dấn đến các cột ẩn bị flash visible rồi hidden lại → overlap.
  // Width của các cột luôn được quản lý bởi applyColumnState (trong sync effect).
  const columnDefs: (ColDef | ColGroupDef)[] = useMemo(
    () => [
      // CỘT CỐ ĐỊNH BÊN TRÁI - Thứ tự: CK → Trần → Sàn → TC
      {
        field: "ticker",
        headerName: "CK",
        width: 80,
        pinned: "left",
        rowDrag: true, // Enable drag & drop để unsubscribe
        cellClass: (params) =>
          `${getPriceColorClass(params.data?.lastPrice, params.data, "font-bold")} cursor-pointer`,
      },
      {
        field: "ceilingPrice",
        headerName: "Trần",
        width: 80,
        pinned: "left",
        valueFormatter: (params) => formatPrice(params.value),
        cellClass: "text-purple-500 font-semibold text-xs",
      },
      {
        field: "floorPrice",
        headerName: "Sàn",
        width: 80,
        pinned: "left",
        valueFormatter: (params) => formatPrice(params.value),
        cellClass: "text-blue-500 font-semibold text-xs",
      },
      {
        field: "referencePrice",
        headerName: "TC",
        width: 80,
        pinned: "left",
        valueFormatter: (params) => formatPrice(params.value),
        cellClass: "text-yellow-500 font-semibold text-xs",
      },

      // NHÓM BÊN MUA (ORDER BOOK - LEFT SIDE)
      {
        headerName: "Bên mua",
        children: [
          {
            field: "bidPrice3",
            headerName: "Giá 3",
            width: 85,
            valueFormatter: (params) =>
              isZeroSession(params.data) ? "" : formatPrice(params.value),
            cellClass: (params) =>
              getPriceColorClass(params.value, params.data),
          },
          {
            field: "bidVol3",
            headerName: "KL 3",
            width: 100,
            valueFormatter: (params) =>
              isZeroSession(params.data)
                ? ""
                : params.value
                  ? params.value.toLocaleString()
                  : "",
            cellClass: (params) =>
              getPriceColorClass(params.data?.bidPrice3, params.data),
          },
          {
            field: "bidPrice2",
            headerName: "Giá 2",
            width: 85,
            valueFormatter: (params) =>
              isZeroSession(params.data) ? "" : formatPrice(params.value),
            cellClass: (params) =>
              getPriceColorClass(params.value, params.data, "font-semibold"),
          },
          {
            field: "bidVol2",
            headerName: "KL 2",
            width: 100,
            valueFormatter: (params) =>
              isZeroSession(params.data)
                ? ""
                : params.value
                  ? params.value.toLocaleString()
                  : "",
            cellClass: (params) =>
              getPriceColorClass(
                params.data?.bidPrice2,
                params.data,
                "font-semibold",
              ),
          },
          {
            field: "bidPrice1",
            headerName: "Giá 1",
            width: 85,
            valueFormatter: (params) =>
              isZeroSession(params.data) ? "" : formatPrice(params.value),
            cellClass: (params) =>
              getPriceColorClass(params.value, params.data, "font-bold"),
          },
          {
            field: "bidVol1",
            headerName: "KL 1",
            width: 100,
            valueFormatter: (params) =>
              isZeroSession(params.data)
                ? ""
                : params.value
                  ? params.value.toLocaleString()
                  : "",
            cellClass: (params) =>
              getPriceColorClass(
                params.data?.bidPrice1,
                params.data,
                "font-bold",
              ),
          },
        ],
      },

      // NHÓM KHỚP LỆNH (CENTER - MATCHED ORDERS)
      {
        headerName: "Khớp lệnh",
        children: [
          {
            field: "lastPrice",
            headerName: "Giá",
            width: 95,
            valueFormatter: (params) =>
              isZeroSession(params.data) ? "" : formatPrice(params.value),
            cellClass: (params) =>
              getPriceColorClass(params.value, params.data, "font-bold"),
          },
          {
            field: "lastVol",
            headerName: "KL",
            width: 110,
            valueFormatter: (params) =>
              isZeroSession(params.data)
                ? ""
                : params.value
                  ? params.value.toLocaleString()
                  : "",
            cellClass: (params) =>
              getPriceColorClass(
                params.data?.lastPrice,
                params.data,
                "font-semibold",
              ),
          },
          {
            field: "change",
            headerName: "+/-",
            width: 80,
            valueFormatter: (params) => {
              // During auction phases, backend can send synthetic -reference change while no trade is matched yet.
              if (!params.data?.lastPrice || !params.data?.lastVol) return "";
              if (isZeroSession(params.data)) return "";
              if (params.value == null || params.value === 0) return "";
              const valueInThousands = params.value / 1000;
              return valueInThousands > 0
                ? `+${valueInThousands.toFixed(2)}`
                : valueInThousands.toFixed(2);
            },
            cellClass: (params) =>
              getPriceColorClass(
                params.data?.lastPrice,
                params.data,
                "font-semibold",
              ),
          },
          {
            field: "ratioChange",
            headerName: "+/- (%)",
            width: 90,
            valueFormatter: (params) => {
              // During auction phases, backend can send synthetic -100% while no trade is matched yet.
              if (!params.data?.lastPrice || !params.data?.lastVol) return "";
              if (isZeroSession(params.data)) return "";
              if (params.value == null || params.value === 0) return "";
              const pct = params.value.toFixed(2);
              return params.value > 0 ? `+${pct}%` : `${pct}%`;
            },
            cellClass: (params) =>
              getPriceColorClass(
                params.data?.lastPrice,
                params.data,
                "font-bold",
              ),
          },
        ],
      },

      // NHÓM BÊN BÁN (ORDER BOOK - RIGHT SIDE)
      {
        headerName: "Bên bán",
        children: [
          {
            field: "askPrice1",
            headerName: "Giá 1",
            width: 85,
            valueFormatter: (params) =>
              isZeroSession(params.data) ? "" : formatPrice(params.value),
            cellClass: (params) =>
              getPriceColorClass(params.value, params.data, "font-bold"),
          },
          {
            field: "askVol1",
            headerName: "KL 1",
            width: 100,
            valueFormatter: (params) =>
              isZeroSession(params.data)
                ? ""
                : params.value
                  ? params.value.toLocaleString()
                  : "",
            cellClass: (params) =>
              getPriceColorClass(
                params.data?.askPrice1,
                params.data,
                "font-bold",
              ),
          },
          {
            field: "askPrice2",
            headerName: "Giá 2",
            width: 85,
            valueFormatter: (params) =>
              isZeroSession(params.data) ? "" : formatPrice(params.value),
            cellClass: (params) =>
              getPriceColorClass(params.value, params.data, "font-semibold"),
          },
          {
            field: "askVol2",
            headerName: "KL 2",
            width: 100,
            valueFormatter: (params) =>
              isZeroSession(params.data)
                ? ""
                : params.value
                  ? params.value.toLocaleString()
                  : "",
            cellClass: (params) =>
              getPriceColorClass(
                params.data?.askPrice2,
                params.data,
                "font-semibold",
              ),
          },
          {
            field: "askPrice3",
            headerName: "Giá 3",
            width: 85,
            valueFormatter: (params) =>
              isZeroSession(params.data) ? "" : formatPrice(params.value),
            cellClass: (params) =>
              getPriceColorClass(params.value, params.data),
          },
          {
            field: "askVol3",
            headerName: "KL 3",
            width: 100,
            valueFormatter: (params) =>
              isZeroSession(params.data)
                ? ""
                : params.value
                  ? params.value.toLocaleString()
                  : "",
            cellClass: (params) =>
              getPriceColorClass(params.data?.askPrice3, params.data),
          },
        ],
      },

      // NHÓM THỐNG KÊ PHIÊN - bao gồm cả các cột ẩn mặc định để group header luôn hiển thị
      {
        headerName: "Tổng",
        children: [
          {
            field: "totalVol",
            headerName: "Tổng KL",
            width: 120,
            valueFormatter: (params) =>
              isZeroSession(params.data)
                ? ""
                : params.value
                  ? params.value.toLocaleString()
                  : "",
            cellClass: "font-semibold text-xs",
          },
          {
            field: "highest",
            headerName: "Cao",
            width: 85,
            valueFormatter: (params) =>
              isZeroSession(params.data) ? "" : formatPrice(params.value),
            cellClass: (params) =>
              getPriceColorClass(params.value, params.data, "font-semibold"),
          },
          {
            field: "lowest",
            headerName: "Thấp",
            width: 85,
            valueFormatter: (params) =>
              isZeroSession(params.data) ? "" : formatPrice(params.value),
            cellClass: (params) =>
              getPriceColorClass(params.value, params.data, "font-semibold"),
          },
          {
            field: "avgPrice",
            headerName: "TB",
            width: 85,
            valueFormatter: (params) =>
              isZeroSession(params.data) ? "" : formatPrice(params.value),
            cellClass: "text-xs",
          },
          // CÁC CỘT ẨN MẶC ĐỊNH - đặt trong group 'Tổng' để group header luôn hiển thị (không bị ẩn khi toàn bộ children bị hide)
          {
            field: "totalVal",
            headerName: "Tổng GT",
            width: 120,
            valueFormatter: (params) =>
              isZeroSession(params.data)
                ? ""
                : params.value
                  ? params.value.toLocaleString()
                  : "",
            hide: true,
            cellClass: "text-xs",
          },
          {
            field: "side",
            headerName: "Chiều",
            width: 70,
            cellClass: (params) => {
              if (params.value === "B")
                return "text-green-500 font-bold text-xs";
              if (params.value === "S") return "text-red-500 font-bold text-xs";
              return "text-xs";
            },
            hide: true,
          },
          {
            field: "tradingSession",
            headerName: "Phiên",
            width: 80,
            hide: true,
            cellClass: "text-xs",
          },
          {
            field: "tradingStatus",
            headerName: "Trạng thái",
            width: 100,
            cellClass: (params) => {
              if (params.value === "Active") return "text-green-500 text-xs";
              if (params.value === "Halted") return "text-orange-500 text-xs";
              if (params.value === "Suspended") return "text-red-500 text-xs";
              return "text-xs";
            },
            hide: true,
          },
          {
            field: "totalBuyVol",
            headerName: "Tổng KL mua",
            width: 120,
            valueFormatter: (params) => {
              if (isZeroSession(params.data)) return "";
              return params.value ? params.value.toLocaleString() : "";
            },
            hide: true,
            cellClass: "text-xs",
          },
          {
            field: "totalSellVol",
            headerName: "Tổng KL bán",
            width: 120,
            valueFormatter: (params) => {
              if (isZeroSession(params.data)) return "";
              return params.value ? params.value.toLocaleString() : "";
            },
            hide: true,
            cellClass: "text-xs",
          },
        ],
      },
      {
        headerName: "ĐẦU TƯ NƯỚC NGOÀI",
        children: [
          {
            field: "fBuyVol",
            headerName: "KL mua NN",
            width: 120,
            valueFormatter: (params) => {
              if (isZeroSession(params.data)) return "";
              return params.value ? params.value.toLocaleString() : "";
            },
            hide: true,
            cellClass: "text-xs",
          },
          {
            field: "fSellVol",
            headerName: "KL bán NN",
            width: 120,
            valueFormatter: (params) => {
              if (isZeroSession(params.data)) return "";
              return params.value ? params.value.toLocaleString() : "";
            },
            hide: true,
            cellClass: "text-xs",
          },
          {
            field: "fBuyVal",
            headerName: "GT mua NN",
            width: 130,
            valueFormatter: (params) => {
              if (isZeroSession(params.data)) return "";
              return params.value ? params.value.toLocaleString() : "";
            },
            hide: true,
            cellClass: "text-xs",
          },
          {
            field: "fSellVal",
            headerName: "GT bán NN",
            width: 130,
            valueFormatter: (params) => {
              if (isZeroSession(params.data)) return "";
              return params.value ? params.value.toLocaleString() : "";
            },
            hide: true,
            cellClass: "text-xs",
          },
          {
            field: "totalRoom",
            headerName: "Tổng room NN",
            width: 120,
            valueFormatter: (params) =>
              isZeroSession(params.data)
                ? ""
                : params.value
                  ? params.value.toLocaleString()
                  : "",
            hide: true,
            cellClass: "text-xs",
          },
          {
            field: "currentRoom",
            headerName: "Room NN còn lại",
            width: 130,
            valueFormatter: (params) =>
              params.value ? params.value.toLocaleString() : "",
            hide: true,
            cellClass: (params) => {
              if (!params.value || !params.data?.totalRoom) return "text-xs";
              const pct = params.value / params.data.totalRoom;
              if (pct <= 0.05) return "text-red-500 text-xs";
              if (pct <= 0.2) return "text-yellow-500 text-xs";
              return "text-green-500 text-xs";
            },
          },
        ],
      },
    ],
    [],
  );

  // Cấu hình mặc định cho tất cả các cột
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      suppressMenu: true, // Ẩn menu button (bao gồm filter) trên tất cả cột
      // QUAN TRỌNG: Enable cell flash animation cho real-time updates
      enableCellChangeFlash: true,
      // Tắt auto-size để tránh grid resize liên tục
      suppressSizeToFit: true,
      // Thêm border cho từng cell body để dễ phân tách dữ liệu
      cellStyle: {
        borderRight: "1px solid rgba(148, 163, 184, 0.22)",
        borderBottom: "1px solid rgba(148, 163, 184, 0.22)",
      },
    }),
    [],
  );

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

      <div
        className={`relative w-full h-full rounded-lg overflow-hidden border flex flex-col ${
          isDark ? "bg-cardBackground border-gray-800" : "bg-white border-gray-200"
        }`}
      >
        {/* Save Layout Modal - only for creating new layout */}
        <SaveLayoutModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveLayoutSubmit}
          isLoading={isSaving}
        />

        {/* Badge title (drag zone) */}
        <div className="module-header flex items-center justify-center pt-1.5 pb-1">
          <div className="flex items-center gap-1.5">
            <div className="drag-handle relative flex items-center justify-center cursor-move select-none">
              <svg width="220" height="34" viewBox="0 0 136 22" className="block">
                <path
                  d="M134 0C151 0 -15 0 2 0C19 0 27 22 46 22H92C113 22 119 0 134 0Z"
                  fill="#4ADE80"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[14px] font-bold text-black tracking-wide">
                Bảng giá
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              {/* Symbol Search Box Component */}
              <SymbolSearchBox
                isConnected={isConnected}
                onSymbolSelect={handleSymbolSelect}
                trailingSlot={
                  <button
                    type="button"
                    onClick={handleToggleLink}
                    title={isLinked ? 'Đang đồng bộ mã — nhấn để tách biệt' : 'Đang tách biệt — nhấn để đồng bộ'}
                    className={`rounded p-1 transition-colors ${
                      isLinked
                        ? 'text-green-400 hover:bg-green-500/15'
                        : 'text-gray-500 hover:bg-white/8'
                    }`}
                  >
                    {isLinked ? <Link2 size={13} /> : <Link2Off size={13} />}
                  </button>
                }
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

              {/* Sector Filter Dropdown */}
              <SectorFilter
                onSectorChange={handleSectorChange}
                isLoading={isLoadingSector}
                selectedSector={selectedSector}
              />
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

              {/* Column Manager Button — same style as FinancialReportPro */}
              <button
                onClick={() => setSidebarOpen(true)}
                title="Quản lý cột"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                <Table2 size={14} />
                <span>Quản lý Cột</span>
              </button>
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
                  Đang tải cấu hình giao diện...
                </span>
              </div>
            </div>
          )}

          <div
            className={`flex-1 min-h-0 ${isDark ? "ag-theme-alpine-dark" : "ag-theme-alpine"}`}
          >
            <AgGridReact
              rowData={undefined}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowHeight={36}
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
              onBodyScroll={handleGridBodyScroll}
              onCellClicked={(params) => {
                if (params.colDef.field === "ticker" && params.data?.ticker) {
                  setTickerHighlight(params.data.ticker);
                  if (isLinked) {
                    useSelectedSymbolStore
                      .getState()
                      .setSelectedSymbol(params.data.ticker);
                  }
                }
              }}
              onRowDragEnter={handleRowDragEnter}
              onRowDragLeave={handleRowDragLeave}
              // Highlight row after search — driven by highlightedTicker state
              getRowClass={(params) =>
                params.data?.ticker?.toUpperCase() === highlightedTicker
                  ? 'ss-row-highlight'
                  : ''
              }
              // QUAN TRỌNG: getRowId để AG Grid có thể track và update đúng rows
              getRowId={(params) => {
                // Validate ticker exists
                if (!params.data || !params.data.ticker) {
                  console.error(
                    "[StockScreener] ❌ Invalid row data - missing ticker:",
                    params.data,
                  );
                  return "invalid-" + Math.random(); // Fallback ID
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
