"use client";

/**
 * SmartBoardFilterBar
 * General filter bar for the Smart Market Board module.
 * Contains: Exchange filter | Sector filter (level 2) | WatchList selector | Volume filter
 */

import React, { useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import ExchangeFilter from '@/components/dashboard/modules/StockScreener/ExchangeFilter';
import SectorFilter from '@/components/dashboard/modules/StockScreener/SectorFilter';
import WatchListSelector from '@/components/dashboard/layout/WatchListSelector';
import {
  SMART_BOARD_VOLUME_THRESHOLD,
} from '@/constants/smartBoard';
import type { SmartBoardFilters } from '@/types/smartBoard';
import type { ExchangeCode } from '@/types/symbol';
import type { Sector } from '@/types/sector';
import type { WatchListSummary } from '@/types/watchList';

interface SmartBoardFilterBarProps {
  filters: SmartBoardFilters;
  isLoading?: boolean;
  onFiltersChange: (filters: SmartBoardFilters) => void;
  /** Watchlist data + event handlers passed down from SmartBoardModule */
  watchLists: WatchListSummary[];
  isLoadingWatchLists: boolean;
  onRefreshWatchLists: () => void;
}

export default function SmartBoardFilterBar({
  filters,
  isLoading = false,
  onFiltersChange,
  watchLists,
  isLoadingWatchLists,
  onRefreshWatchLists,
}: SmartBoardFilterBarProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleExchangeChange = useCallback(
    (exchange: ExchangeCode | null) => {
      onFiltersChange({ ...filters, exchange });
    },
    [filters, onFiltersChange]
  );

  const handleSectorChange = useCallback(
    (sector: Sector | null) => {
      onFiltersChange({ ...filters, sector });
    },
    [filters, onFiltersChange]
  );

  const handleWatchListSelect = useCallback(
    (wl: WatchListSummary) => {
      const next = filters.watchlistId === wl.id ? null : wl.id;
      onFiltersChange({ ...filters, watchlistId: next });
    },
    [filters, onFiltersChange]
  );

  /** Toggle the volume filter on/off. */
  const handleVolumeToggle = useCallback(() => {
    const active = filters.volumeThreshold !== null;
    onFiltersChange({
      ...filters,
      volumeThreshold: active ? null : SMART_BOARD_VOLUME_THRESHOLD,
      volumePeriod: '1d',
    });
  }, [filters, onFiltersChange]);

  /** Toggle hide-no-trading filter */
  const handleHideNoTradingToggle = useCallback(() => {
    onFiltersChange({ ...filters, hideNoTrading: !filters.hideNoTrading });
  }, [filters, onFiltersChange]);

  const volumeActive = filters.volumeThreshold !== null;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 border-b flex-wrap
        ${isDark ? 'border-gray-800 bg-cardBackground' : 'border-gray-200 bg-gray-50'}`}
    >
      {/* Exchange Filter */}
      <ExchangeFilter
        selectedExchange={filters.exchange}
        onExchangeChange={handleExchangeChange}
        isLoading={isLoading}
        variant="dropdown"
      />

      {/* Divider */}
      <div className={`h-5 w-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

      {/* WatchList Selector */}
      <WatchListSelector
        watchLists={watchLists}
        currentWatchListId={filters.watchlistId}
        currentWatchListName={
          watchLists.find((w) => w.id === filters.watchlistId)?.name ?? 'Watchlist'
        }
        isLoading={isLoadingWatchLists}
        onSelect={handleWatchListSelect}
        onRefresh={onRefreshWatchLists}
      />

      {/* Divider */}
      <div className={`h-5 w-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

      {/* Sector Filter */}
      <SectorFilter
        selectedSector={filters.sector}
        onSectorChange={handleSectorChange}
        isLoading={isLoading}
        showAllOption
      />

      {/* Divider */}
      <div className={`h-5 w-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

      {/* Hide not-yet-trading toggle */}
      <button
        onClick={handleHideNoTradingToggle}
        disabled={isLoading}
        title={filters.hideNoTrading ? 'Hiển thị tất cả mã (kể cả chưa GD)' : 'Chỉ hiển thị mã đang giao dịch'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${filters.hideNoTrading
            ? isDark
              ? 'bg-green-700 text-white shadow-lg'
              : 'bg-green-500 text-white shadow-lg'
            : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
      >
        <span>Đang GD</span>
      </button>

      {/* Divider */}
      <div className={`h-5 w-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

      {/* Volume Filter */}
      <div className="flex items-center gap-2">
        {/* Toggle button */}
        <button
          onClick={handleVolumeToggle}
          disabled={isLoading}
          title={volumeActive ? 'Tắt lọc khối lượng' : 'Bật lọc khối lượng ≥ 500K/ngày'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${volumeActive
              ? isDark
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-amber-500 text-white shadow-lg'
              : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          {/* Bar-chart icon */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="9" width="3" height="6" rx="0.5" />
            <rect x="6" y="5" width="3" height="10" rx="0.5" />
            <rect x="11" y="1" width="3" height="14" rx="0.5" />
          </svg>
          <span>KL ≥ 500K</span>
        </button>
      </div>

      {/* Right-side: active filter summary chips */}
      {(filters.exchange || filters.sector || filters.watchlistId !== null || volumeActive) && (
        <div className="ml-auto flex items-center gap-1.5">
          {filters.exchange && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full
                ${isDark ? 'bg-blue-900/60 text-blue-300' : 'bg-blue-100 text-blue-700'}`}
            >
              {filters.exchange}
            </span>
          )}
          {filters.sector && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full max-w-[120px] truncate
                ${isDark ? 'bg-blue-900/60 text-blue-300' : 'bg-blue-100 text-blue-700'}`}
              title={filters.sector.viName}
            >
              {filters.sector.viName}
            </span>
          )}
          {filters.watchlistId !== null && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full
                ${isDark ? 'bg-green-900/60 text-green-300' : 'bg-green-100 text-green-700'}`}
            >
              {watchLists.find((w) => w.id === filters.watchlistId)?.name ?? 'WL'}
            </span>
          )}
          {volumeActive && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full
                ${isDark ? 'bg-amber-900/60 text-amber-300' : 'bg-amber-100 text-amber-700'}`}
            >
              KL&gt;500K
            </span>
          )}
          {/* Clear all */}
          <button
            onClick={() =>
              onFiltersChange({
                exchange: null,
                sector: null,
                watchlistId: null,
                volumeThreshold: null,
                volumePeriod: '1d',
                hideNoTrading: true,
              })
            }
            className={`text-xs px-2 py-0.5 rounded-full transition-colors
              ${isDark
                ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          >
            Xóa lọc
          </button>
        </div>
      )}
    </div>
  );
}
