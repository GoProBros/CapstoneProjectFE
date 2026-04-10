"use client";

/**
 * SmartBoardModule
 * "Bảng Điện Thông Minh" — sector-grouped live market board
 * with configurable exchange / sector / volume filters.
 *
 * Data flow: heatmapService (REST) → subscribeToSymbols (SignalR) → client-side filtering
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSignalR } from '@/contexts/SignalRContext';
import SmartBoardFilterBar from '@/components/dashboard/modules/SmartBoard/SmartBoardFilterBar';
import { smartBoardService } from '@/services/smartBoardService';
import { watchListService } from '@/services/watchListService';
import { getIndexConstituents } from '@/services/marketIndexService';
import { SMART_BOARD_LS_FILTERS, SMART_BOARD_VOLUME_THRESHOLD } from '@/constants/smartBoard';
import type { SmartBoardFilters, VolumePeriod } from '@/types/smartBoard';
import type { HeatmapItem } from '@/types/heatmap';
import type { WatchListSummary } from '@/types/watchList';

const DEFAULT_FILTERS: SmartBoardFilters = {
  exchange: null,
  sector: null,
  watchlistId: null,
  volumeThreshold: null,
  volumePeriod: '1d',
  hideNoTrading: true,
};

/** Fallback VN30 constituent tickers if API is unavailable */
const VN30_FALLBACK = new Set([
  'ACB','BCM','BID','BVH','CTG','FPT','GAS','GVR','HDB','HPG',
  'MBB','MSN','MWG','PLX','POW','SAB','SHB','SSB','SSI','STB',
  'TCB','TPB','VCB','VHM','VIB','VIC','VJC','VNM','VPB','VRE',
]);

function loadSavedFilters(): SmartBoardFilters {
  if (typeof window === 'undefined') return DEFAULT_FILTERS;
  try {
    const raw = localStorage.getItem(SMART_BOARD_LS_FILTERS);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw);
    // Reset sector since it's an object — would need full Sector re-hydration
    return { ...DEFAULT_FILTERS, ...parsed, sector: null };
  } catch {
    return DEFAULT_FILTERS;
  }
}
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

/** Price change color class based on price vs reference */
function getPriceColorClass(item: HeatmapItem, isDark: boolean): string {
  const pct = item.changePercent;
  if (pct >= 6.5)  return isDark ? 'bg-purple-900/70 text-purple-200' : 'bg-purple-100 text-purple-800';
  if (pct <= -6.5) return isDark ? 'bg-cyan-900/70 text-cyan-200'   : 'bg-cyan-100 text-cyan-800';
  if (pct > 0)     return isDark ? 'bg-green-900/50 text-green-300'  : 'bg-green-50 text-green-700';
  if (pct < 0)     return isDark ? 'bg-red-900/50 text-red-300'      : 'bg-red-50 text-red-700';
  return isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600';
}

interface TickerRowProps {
  item: HeatmapItem;
}

function TickerRow({ item }: TickerRowProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colorCls = getPriceColorClass(item, isDark);

  return (
    <div
      className={`grid grid-cols-4 gap-1 px-2 py-1 text-xs rounded mb-0.5 ${colorCls}`}
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

export default function SmartBoardModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { isConnected, subscribeToSymbols, unsubscribeFromSymbols, marketData } = useSignalR();

  const [filters, setFilters] = useState<SmartBoardFilters>(loadSavedFilters);
  const [items, setItems] = useState<HeatmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // VN30 constituent tickers (fetched once on mount)
  const [vn30Tickers, setVn30Tickers] = useState<Set<string>>(VN30_FALLBACK);

  useEffect(() => {
    getIndexConstituents('VN30', { isActive: true, pageSize: 100 })
      .then((res) => {
        if (res.data?.items && res.data.items.length > 0) {
          setVn30Tickers(new Set(res.data.items.map((s) => s.ticker.toUpperCase())));
        }
      })
      .catch(() => { /* fallback set already in state */ });
  }, []);

  // Watchlist state
  const [watchLists, setWatchLists] = useState<WatchListSummary[]>([]);
  const [isLoadingWatchLists, setIsLoadingWatchLists] = useState(false);
  /** tickers from the currently selected watchlist — null means no watchlist filter */
  const [watchlistTickers, setWatchlistTickers] = useState<Set<string> | null>(null);

  /** avg volume map: ticker → avgDailyVol — fetched when volumeThreshold + volumePeriod change */
  const [avgVolMap, setAvgVolMap] = useState<Map<string, number>>(new Map());
  const [isLoadingVol, setIsLoadingVol] = useState(false);

  const subscribedRef = useRef<string[]>([]);
  const hasLoadedRef = useRef(false);

  // Persist filter state (exchange + volume + watchlist settings only)
  useEffect(() => {
    try {
      const toSave = {
        exchange: filters.exchange,
        volumeThreshold: filters.volumeThreshold,
        volumePeriod: filters.volumePeriod,
        watchlistId: filters.watchlistId,
      };
      localStorage.setItem(SMART_BOARD_LS_FILTERS, JSON.stringify(toSave));
    } catch {}
  }, [filters.exchange, filters.volumeThreshold, filters.volumePeriod, filters.watchlistId]);

  // Load watchlists on mount
  const loadWatchLists = useCallback(async () => {
    setIsLoadingWatchLists(true);
    try {
      const list = await watchListService.getWatchLists();
      setWatchLists(list);
    } catch (err) {
      console.error('[SmartBoard] Failed to load watchlists:', err);
    } finally {
      setIsLoadingWatchLists(false);
    }
  }, []);

  useEffect(() => { loadWatchLists(); }, [loadWatchLists]);

  // When watchlistId changes, fetch detail and extract tickers
  useEffect(() => {
    if (filters.watchlistId === null) {
      setWatchlistTickers(null);
      return;
    }
    let cancelled = false;
    watchListService
      .getWatchListById(filters.watchlistId)
      .then((detail) => {
        if (!cancelled)
          setWatchlistTickers(new Set(detail.tickers.map((t) => t.toUpperCase())));
      })
      .catch((err) => console.error('[SmartBoard] Failed to load watchlist detail:', err));
    return () => { cancelled = true; };
  }, [filters.watchlistId]);

  // Initial data load (same pattern as HeatmapModule)
  useEffect(() => {
    if (!isConnected || hasLoadedRef.current) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await smartBoardService.getMarketData({
          exchange: filters.exchange ?? undefined,
        });
        setItems(data.items);

        const tickers = data.items.map((i) => i.ticker);
        if (tickers.length > 0) {
          await subscribeToSymbols(tickers);
          subscribedRef.current = tickers;
          hasLoadedRef.current = true;
        }
      } catch (err) {
        console.error('[SmartBoard] Failed to load market data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when exchange changes
  useEffect(() => {
    if (!isConnected || !hasLoadedRef.current) return;

    const reload = async () => {
      setIsLoading(true);
      try {
        if (subscribedRef.current.length > 0) {
          await unsubscribeFromSymbols(subscribedRef.current);
          subscribedRef.current = [];
        }

        const data = await smartBoardService.getMarketData({
          exchange: filters.exchange ?? undefined,
        });
        setItems(data.items);

        const tickers = data.items.map((i) => i.ticker);
        if (tickers.length > 0) {
          await subscribeToSymbols(tickers);
          subscribedRef.current = tickers;
        }
      } catch (err) {
        console.error('[SmartBoard] Failed to reload:', err);
      } finally {
        setIsLoading(false);
      }
    };

    reload();
  }, [filters.exchange, isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync live prices from SignalR into items
  useEffect(() => {
    if (marketData.size === 0) return;
    setItems((prev) =>
      prev.map((item) => {
        const live = marketData.get(item.ticker);
        if (!live || !live.lastPrice || live.lastPrice === 0) return item;
        const ref = live.referencePrice || item.currentPrice;
        const change = live.lastPrice - ref;
        const changePct = ref > 0 ? (change / ref) * 100 : 0;
        return {
          ...item,
          currentPrice: live.lastPrice,
          changeValue: change,
          changePercent: changePct,
          volume: live.totalVol ?? item.volume,
        };
      })
    );
  }, [marketData]);

  // Fetch avg volume when the volume filter is toggled or period changes
  useEffect(() => {
    if (filters.volumeThreshold === null) {
      setAvgVolMap(new Map());
      return;
    }

    let cancelled = false;
    setIsLoadingVol(true);
    smartBoardService
      .getAvgVolume(filters.volumePeriod)
      .then((map) => { if (!cancelled) setAvgVolMap(map); })
      .catch((err) => console.error('[SmartBoard] avg-volume fetch failed:', err))
      .finally(() => { if (!cancelled) setIsLoadingVol(false); });

    return () => { cancelled = true; };
  }, [filters.volumeThreshold, filters.volumePeriod]);

  // Compute filtered + sector-grouped items
  const sectorColumns = useMemo(() => {
    let filtered = items;

    // Hide not-yet-trading tickers (volume === 0)
    if (filters.hideNoTrading) {
      filtered = filtered.filter((i) => i.volume > 0);
    }

    // Watchlist filter — restrict to tickers in the selected watchlist
    if (watchlistTickers !== null) {
      filtered = filtered.filter((i) => watchlistTickers.has(i.ticker.toUpperCase()));
    }

    // Sector filter (level 2 — filter by sectorName since items have sectorName from heatmap)
    if (filters.sector) {
      filtered = filtered.filter(
        (i) => i.sector === filters.sector!.id || i.sectorName === filters.sector!.viName
      );
    }

    // Volume filter
    if (filters.volumeThreshold !== null) {
      if (filters.volumePeriod === '1d') {
        // today's volume from live data
        filtered = filtered.filter((i) => i.volume >= filters.volumeThreshold!);
      } else {
        // historical avg from backend
        filtered = filtered.filter((i) => {
          const avg = avgVolMap.get(i.ticker);
          return avg !== undefined && avg >= filters.volumeThreshold!;
        });
      }
    }

    // Group by sectorName
    const groups = new Map<string, HeatmapItem[]>();
    for (const item of filtered) {
      const key = item.sectorName || 'Khác';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }

    // Sort sectors alphabetically, items within each by changePercent desc (gain → loss)
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'vi'))
      .map(([sectorName, sectorItems]) => ({
        sectorName,
        items: sectorItems.sort((a, b) => b.changePercent - a.changePercent),
      }));
  }, [items, filters, avgVolMap, watchlistTickers]);

  // VN30 column — all VN30 tickers from current items, sorted gain → loss
  const vn30Column = useMemo(() => {
    return items
      .filter((i) => vn30Tickers.has(i.ticker.toUpperCase()))
      .sort((a, b) => b.changePercent - a.changePercent);
  }, [items, vn30Tickers]);

  const handleFiltersChange = useCallback((f: SmartBoardFilters) => {
    setFilters(f);
  }, []);

  const totalShown = sectorColumns.reduce((s, c) => s + c.items.length, 0);

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
