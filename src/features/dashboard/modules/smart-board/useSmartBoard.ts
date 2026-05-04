import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSignalR } from '@/contexts/SignalRContext';
import { smartBoardService } from '@/services/market/smartBoardService';
import { watchListService } from '@/services/watchListService';
import { getIndexConstituents } from '@/services/market/marketIndexService';
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
    return { ...DEFAULT_FILTERS, ...parsed, sector: null };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function useSmartBoard() {
  const { isConnected, subscribeToSymbols, marketData } = useSignalR();

  const [filters, setFilters] = useState<SmartBoardFilters>(loadSavedFilters);
  const [items, setItems] = useState<HeatmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vn30Tickers, setVn30Tickers] = useState<Set<string>>(VN30_FALLBACK);
  const [watchLists, setWatchLists] = useState<WatchListSummary[]>([]);
  const [isLoadingWatchLists, setIsLoadingWatchLists] = useState(false);
  const [watchlistTickers, setWatchlistTickers] = useState<Set<string> | null>(null);
  const [avgVolMap, setAvgVolMap] = useState<Map<string, number>>(new Map());
  const [isLoadingVol, setIsLoadingVol] = useState(false);

  const subscribedRef = useRef<string[]>([]);
  const hasLoadedRef = useRef(false);

  // Load VN30 constituents
  useEffect(() => {
    getIndexConstituents('VN30', { isActive: true, pageSize: 100 })
      .then((res) => {
        if (res.data?.items && res.data.items.length > 0) {
          setVn30Tickers(new Set(res.data.items.map((s) => s.ticker.toUpperCase())));
        }
      })
      .catch(() => { /* fallback set already in state */ });
  }, []);

  // Persist filter state
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
      console.error('[useSmartBoard] Failed to load watchlists:', err);
    } finally {
      setIsLoadingWatchLists(false);
    }
  }, []);

  useEffect(() => { loadWatchLists(); }, [loadWatchLists]);

  // When watchlistId changes, fetch tickers
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
      .catch((err) => console.error('[useSmartBoard] Failed to load watchlist detail:', err));
    return () => { cancelled = true; };
  }, [filters.watchlistId]);

  // Initial data load — fetch ALL exchanges so VN30 column always has data
  useEffect(() => {
    if (!isConnected || hasLoadedRef.current) return;

    const load = async () => {
      setIsLoading(true);
      try {
        // No exchange filter here: client-side filtering keeps VN30 intact
        const data = await smartBoardService.getMarketData();
        setItems(data.items);

        const tickers = data.items.map((i) => i.ticker);
        if (tickers.length > 0) {
          await subscribeToSymbols(tickers);
          subscribedRef.current = tickers;
          hasLoadedRef.current = true;
        }
      } catch (err) {
        console.error('[useSmartBoard] Failed to load market data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync live prices from SignalR
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

  // Fetch avg volume when filter changes
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
      .catch((err) => console.error('[useSmartBoard] avg-volume fetch failed:', err))
      .finally(() => { if (!cancelled) setIsLoadingVol(false); });

    return () => { cancelled = true; };
  }, [filters.volumeThreshold, filters.volumePeriod]);

  // Compute filtered + sector-grouped items
  const sectorColumns = useMemo(() => {
    let filtered = items;

    // Exchange filter applied client-side so VN30 column is unaffected
    if (filters.exchange) {
      filtered = filtered.filter(
        (i) => i.exchange?.toLowerCase() === filters.exchange!.toLowerCase()
      );
    }

    if (filters.hideNoTrading) {
      filtered = filtered.filter((i) => i.volume > 0);
    }

    if (watchlistTickers !== null) {
      filtered = filtered.filter((i) => watchlistTickers.has(i.ticker.toUpperCase()));
    }

    if (filters.sector) {
      filtered = filtered.filter(
        (i) => i.sector === filters.sector!.id || i.sectorName === filters.sector!.viName
      );
    }

    if (filters.volumeThreshold !== null) {
      if (filters.volumePeriod === '1d') {
        filtered = filtered.filter((i) => i.volume >= filters.volumeThreshold!);
      } else {
        filtered = filtered.filter((i) => {
          const avg = avgVolMap.get(i.ticker);
          return avg !== undefined && avg >= filters.volumeThreshold!;
        });
      }
    }

    const groups = new Map<string, HeatmapItem[]>();
    for (const item of filtered) {
      const key = item.sectorName || 'Khác';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'vi'))
      .map(([sectorName, sectorItems]) => ({
        sectorName,
        items: sectorItems.sort((a, b) => b.changePercent - a.changePercent),
      }));
  }, [items, filters, avgVolMap, watchlistTickers]);

  // VN30 column
  const vn30Column = useMemo(() => {
    return items
      .filter((i) => vn30Tickers.has(i.ticker.toUpperCase()))
      .sort((a, b) => b.changePercent - a.changePercent);
  }, [items, vn30Tickers]);

  const handleFiltersChange = useCallback((f: SmartBoardFilters) => {
    setFilters(f);
  }, []);

  const totalShown = sectorColumns.reduce((s, c) => s + c.items.length, 0);

  return {
    filters,
    items,
    isLoading,
    isLoadingVol,
    watchLists,
    isLoadingWatchLists,
    sectorColumns,
    vn30Column,
    totalShown,
    handleFiltersChange,
    loadWatchLists,
  };
}
