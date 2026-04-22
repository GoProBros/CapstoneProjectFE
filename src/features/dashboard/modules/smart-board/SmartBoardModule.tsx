"use client";

/**
 * SmartBoardModule
 * "Bảng Điện Thông Minh" — sector-grouped live market board
 * with configurable exchange / sector / volume filters.
 *
 * Data flow: heatmapService (REST) → subscribeToSymbols (SignalR) → client-side filtering
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { SmartBoardFilterBar } from './SmartBoardFilterBar';
import type { HeatmapItem } from '@/types/heatmap';
import { useSmartBoard } from './useSmartBoard';

/** Format price: raw value in VND units → display in thousands (26700 → "26.70") */
function fmtPrice(price: number): string {
  return (price / 1000).toFixed(2);
}

/** Format volume with Vietnamese units: triệu (tr) / nghìn (ng) */
function fmtVol(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}tr`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}ng`;
  return String(vol);
}

/** Price change color class based on changePercent — 9 intensity levels */
function getPriceColorClass(item: HeatmapItem, isDark: boolean): string {
  const pct = item.changePercent;

  // Trần (ceiling ≥ +6.5%)
  if (pct >= 6.5)
    return isDark
      ? 'bg-purple-800/80 text-purple-100'
      : 'bg-purple-200 text-purple-900';

  // Tăng mạnh (+3% → <+6.5%)
  if (pct >= 3)
    return isDark
      ? 'bg-green-700/80 text-green-100'
      : 'bg-green-300 text-green-900';

  // Tăng vừa (+1% → <+3%)
  if (pct >= 1)
    return isDark
      ? 'bg-green-800/60 text-green-200'
      : 'bg-green-200 text-green-800';

  // Tăng nhẹ (>0 → <+1%)
  if (pct > 0)
    return isDark
      ? 'bg-green-900/50 text-green-400'
      : 'bg-green-100 text-green-700';

  // Tham chiếu (= 0)
  if (pct === 0)
    return isDark
      ? 'bg-yellow-900/40 text-yellow-300'
      : 'bg-yellow-50 text-yellow-700';

  // Giảm nhẹ (>-1% → <0)
  if (pct > -1)
    return isDark
      ? 'bg-red-900/50 text-red-400'
      : 'bg-red-100 text-red-600';

  // Giảm vừa (-3% → >-1%)  (note: pct < -1 here)
  if (pct > -3)
    return isDark
      ? 'bg-red-800/60 text-red-200'
      : 'bg-red-200 text-red-800';

  // Giảm mạnh (-6.5% → -3%)
  if (pct > -6.5)
    return isDark
      ? 'bg-red-700/80 text-red-100'
      : 'bg-red-300 text-red-900';

  // Sàn (floor ≤ -6.5%)
  return isDark
    ? 'bg-cyan-800/80 text-cyan-100'
    : 'bg-cyan-200 text-cyan-900';
}

interface TickerRowProps {
  item: HeatmapItem;
}

function TickerRow({ item }: TickerRowProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colorCls = getPriceColorClass(item, isDark);

  const prevPriceRef = useRef<number>(item.currentPrice);
  const [flashClass, setFlashClass] = useState<string>('');
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (item.currentPrice !== prevPriceRef.current) {
      prevPriceRef.current = item.currentPrice;
      const pct = item.changePercent;
      let cls = 'sb-flash-yellow';
      if (pct >= 6.5)       cls = 'sb-flash-purple';
      else if (pct <= -6.5) cls = 'sb-flash-cyan';
      else if (pct > 0)     cls = 'sb-flash-green';
      else if (pct < 0)     cls = 'sb-flash-red';
      // Re-trigger animation by clearing then re-setting
      setFlashClass('');
      requestAnimationFrame(() => setFlashClass(cls));
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashClass(''), 750);
    }
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [item.currentPrice, item.changePercent]);

  return (
    <div
      className={`grid grid-cols-4 gap-1 px-2 py-1 text-xs rounded mb-0.5 ${colorCls} ${flashClass}`}
    >
      <span className="font-bold truncate">{item.ticker}</span>
      <span className="text-right tabular-nums">
        {fmtPrice(item.currentPrice)}
      </span>
      <span className="text-right tabular-nums">
        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
      </span>
      <span className="text-right tabular-nums text-gray-400">
        {fmtVol(item.volume)}
      </span>
    </div>
  );
}

interface SectorColumnProps {
  sectorName: string;
  items: HeatmapItem[];
}

function SectorColumn({ sectorName, items }: SectorColumnProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const avgChange =
    items.length > 0
      ? items.reduce((s, i) => s + i.changePercent, 0) / items.length
      : 0;

  const headerColor =
    avgChange > 0
      ? 'text-green-400'
      : avgChange < 0
        ? 'text-red-400'
        : isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div
      className={`flex flex-col min-w-[180px] max-w-[220px] flex-shrink-0 rounded-lg overflow-hidden border
        ${isDark ? 'border-gray-700/60 bg-componentBackground' : 'border-gray-200 bg-white'}`}
    >
      {/* Column header */}
      <div
        className={`px-2 py-1.5 border-b flex items-center justify-between
          ${isDark ? 'border-gray-700/60 bg-cardBackground' : 'border-gray-200 bg-gray-50'}`}
      >
        <span
          className={`text-xs font-semibold truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
          title={sectorName}
        >
          {sectorName}
        </span>
        <span className={`text-xs font-bold ml-2 tabular-nums flex-shrink-0 ${headerColor}`}>
          {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
        </span>
      </div>

      {/* Column header row labels */}
      <div
        className={`grid grid-cols-4 gap-1 px-2 py-0.5 text-[10px]
          ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
      >
        <span>Mã</span>
        <span className="text-right">Giá</span>
        <span className="text-right">+/-</span>
        <span className="text-right">KL</span>
      </div>

      {/* Ticker rows */}
      <div className="flex-1 overflow-y-auto p-1">
        {items.length === 0 ? (
          <span className={`text-xs px-2 py-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Không có dữ liệu
          </span>
        ) : (
          items.map((item) => <TickerRow key={item.ticker} item={item} />)
        )}
      </div>
    </div>
  );
}

export function SmartBoardModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    filters,
    isLoading,
    isLoadingVol,
    watchLists,
    isLoadingWatchLists,
    sectorColumns,
    vn30Column,
    totalShown,
    handleFiltersChange,
    loadWatchLists,
  } = useSmartBoard();

  return (
    <div className={`w-full h-full flex flex-col ${isDark ? 'bg-cardBackground text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Badge title — same pattern as HeatmapModule / StockScreenerModule */}
      <div className="flex-none flex items-center justify-center pt-1.5 pb-0.5">
        <div className="drag-handle relative flex items-center justify-center cursor-move select-none">
          <svg width="360" height="28" viewBox="0 0 222 22" className="block">
            <path d="M220 0C237 0 -15 0 2 0C19 0 27 22 46 22H178C197 22 203 0 220 0Z" fill="#4ADE80"/>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-black tracking-wide">
            Bảng Điện Thông Minh
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <SmartBoardFilterBar
        filters={filters}
        isLoading={isLoading || isLoadingVol}
        onFiltersChange={handleFiltersChange}
        watchLists={watchLists}
        isLoadingWatchLists={isLoadingWatchLists}
        onRefreshWatchLists={loadWatchLists}
      />

      {/* Status bar */}
      <div
        className={`flex items-center gap-3 px-3 py-1 text-xs border-b
          ${isDark ? 'border-gray-800 text-gray-400' : 'border-gray-100 text-gray-500'}`}
      >
        {isLoading ? (
          <span className="animate-pulse">Đang tải dữ liệu...</span>
        ) : (
          <>
            <span>{totalShown.toLocaleString()} mã</span>
            <span>·</span>
            <span>{sectorColumns.length} ngành</span>
            {isLoadingVol && (
              <>
                <span>·</span>
                <span className="animate-pulse">Đang tải KL lịch sử...</span>
              </>
            )}
          </>
        )}
      </div>

      {/* Column header instructions */}
      <div
        className={`px-3 py-1 text-[10px] grid grid-cols-4 gap-1 w-[200px] opacity-50
          ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
      />

      {/* Sector columns — horizontal scroll */}
      <div className="flex-1 overflow-auto p-2">
        {isLoading ? (
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`min-w-[180px] h-40 rounded-lg animate-pulse
                  ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
              />
            ))}
          </div>
        ) : sectorColumns.length === 0 ? (
          <div className={`flex items-center justify-center h-32 text-sm
            ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Không tìm thấy mã nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="flex gap-2 h-full">
            {/* Pinned VN30 column */}
            <SectorColumn key="VN30" sectorName="VN30" items={vn30Column} />
            {/* Vertical divider */}
            <div className={`w-px flex-shrink-0 self-stretch ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
            {sectorColumns.map(({ sectorName, items: colItems }) => (
              <SectorColumn key={sectorName} sectorName={sectorName} items={colItems} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
