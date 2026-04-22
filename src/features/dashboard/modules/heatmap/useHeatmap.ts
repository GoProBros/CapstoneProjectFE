"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSignalR } from '@/contexts/SignalRContext';
import { HeatmapItem } from '@/types/heatmap';
import { heatmapService } from '@/services/market/heatmapService';
import { watchListService } from '@/services/watchListService';
import SignalRService from '@/services/market/signalRService';
import { ExchangeCode, SymbolData } from '@/types/symbol';
import { Sector } from '@/types/sector';
import { WatchListSummary } from '@/types/watchList';

export interface HeatmapStockNode {
  name: string;
  value: number;
  change: number;
  changeValue: number;
  price: number;
  volume: number;
  totalValue: number;
  itemStyle: { color: string };
}

export interface HeatmapSectorNode {
  name: string;
  value: number;
  children: HeatmapStockNode[];
}

export interface MarketStats {
  index: string;
  indexValue: number;
  indexChange: number;
  up: { count: number; value: number };
  noChange: { count: number; value: number };
  down: { count: number; value: number };
  volume: number;
  totalValue: number;
  foreignNetValue: number;
}

/**
 * useHeatmap — manages all data state for HeatmapModule.
 * Chart initialization and ECharts effects remain in the component
 * because they depend on DOM refs.
 */
export function useHeatmap() {
  const { isConnected, subscribeToSymbols, unsubscribeFromSymbols } = useSignalR();

  const [selectedExchange, setSelectedExchange] = useState<ExchangeCode | null>(() => {
    if (typeof window === 'undefined') return 'HSX';
    const saved = localStorage.getItem('heatmap-exchange');
    return (saved === 'HSX' || saved === 'HNX' || saved === 'UPCOM') ? saved as ExchangeCode : 'HSX';
  });
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [customTickers, setCustomTickers] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('heatmap-customTickers');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [availableWatchlists, setAvailableWatchlists] = useState<WatchListSummary[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('heatmap-watchlistId');
    return saved !== null ? parseInt(saved, 10) : null;
  });
  const [isLoadingWatchlists, setIsLoadingWatchlists] = useState(false);

  // Use Map for O(1) lookups and updates instead of array
  const heatmapItemsMapRef = useRef<Map<string, HeatmapItem>>(new Map());
  const [heatmapItemsVersion, setHeatmapItemsVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Store symbol metadata
  const symbolMetadataRef = useRef<Map<string, SymbolData>>(new Map());

  // Track subscribed symbols
  const subscribedSymbolsRef = useRef<string[]>([]);

  // Cache previous heatmapData to avoid unnecessary recalculations
  const prevHeatmapDataRef = useRef<any[]>([]);

  // Track if symbols have been loaded
  const hasLoadedSymbols = useRef(false);

  // Persist filter state across page refreshes
  useEffect(() => {
    if (selectedExchange) localStorage.setItem('heatmap-exchange', selectedExchange);
    else localStorage.removeItem('heatmap-exchange');
  }, [selectedExchange]);

  useEffect(() => {
    localStorage.setItem('heatmap-customTickers', JSON.stringify(customTickers));
  }, [customTickers]);

  useEffect(() => {
    if (selectedWatchlistId !== null) localStorage.setItem('heatmap-watchlistId', String(selectedWatchlistId));
    else localStorage.removeItem('heatmap-watchlistId');
  }, [selectedWatchlistId]);

  // Load symbols when SignalR connects
  useEffect(() => {
    if (!isConnected || hasLoadedSymbols.current) return;

    const loadSymbols = async () => {
      try {
        setIsLoading(true);
        const heatmapData = await heatmapService.getHeatmapData({
          exchange: selectedExchange ?? undefined,
        });

        heatmapItemsMapRef.current.clear();
        heatmapData.items.forEach(item => {
          heatmapItemsMapRef.current.set(item.ticker, {
            ticker: item.ticker,
            companyName: item.companyName,
            sector: item.sector || '',
            sectorName: item.sectorName || 'Khác',
            currentPrice: item.currentPrice,
            changePercent: item.changePercent,
            changeValue: item.changeValue,
            volume: item.volume,
            totalValue: (item as any).totalValue ?? 0,
            exchange: item.exchange,
            colorType: item.colorType as any,
            lastUpdate: item.lastUpdate,
          });
        });

        setHeatmapItemsVersion(v => v + 1);

        const tickers = heatmapData.items.map(item => item.ticker);
        if (tickers.length > 0) {
          await subscribeToSymbols(tickers);
          subscribedSymbolsRef.current = tickers;
          hasLoadedSymbols.current = true;
        }
      } catch (error) {
        console.error('[Heatmap] Failed to load heatmap data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSymbols();
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload symbols when exchange changes
  useEffect(() => {
    if (!isConnected) return;

    const reloadSymbols = async () => {
      try {
        setIsLoading(true);

        if (subscribedSymbolsRef.current.length > 0) {
          await unsubscribeFromSymbols(subscribedSymbolsRef.current);
          subscribedSymbolsRef.current = [];
        }

        heatmapItemsMapRef.current.clear();

        const heatmapData = await heatmapService.getHeatmapData({
          exchange: selectedExchange ?? undefined,
        });

        heatmapData.items.forEach(item => {
          heatmapItemsMapRef.current.set(item.ticker, {
            ticker: item.ticker,
            companyName: item.companyName,
            sector: item.sector || '',
            sectorName: item.sectorName || 'Khác',
            currentPrice: item.currentPrice,
            changePercent: item.changePercent,
            changeValue: item.changeValue,
            volume: item.volume,
            totalValue: (item as any).totalValue ?? 0,
            exchange: item.exchange,
            colorType: item.colorType as any,
            lastUpdate: item.lastUpdate,
          });
        });

        setHeatmapItemsVersion(v => v + 1);

        const tickers = heatmapData.items.map(item => item.ticker);
        if (tickers.length > 0) {
          await subscribeToSymbols(tickers);
          subscribedSymbolsRef.current = tickers;
        }
      } catch (error) {
        console.error('[Heatmap] Failed to reload symbols:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (hasLoadedSymbols.current) {
      reloadSymbols();
    }
  }, [selectedExchange, isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time SignalR updates — throttled to once every 500ms
  useEffect(() => {
    const THROTTLE_MS = 500;
    const throttleRef = { current: null as ReturnType<typeof setTimeout> | null };

    const unsubscribe = SignalRService.getInstance().onMarketDataReceived((realtimeData) => {
      const ticker = realtimeData.ticker?.toUpperCase();
      if (!ticker) return;

      const existingItem = heatmapItemsMapRef.current.get(ticker);
      if (!existingItem) return;

      const lastPrice = realtimeData.lastPrice;
      if (!lastPrice || lastPrice === 0) return;

      const refPrice = realtimeData.referencePrice || existingItem.currentPrice;
      if (lastPrice === refPrice && existingItem.changePercent !== 0) return;

      const changePercent = (realtimeData.ratioChange != null && realtimeData.ratioChange !== 0)
        ? realtimeData.ratioChange
        : (refPrice !== 0 ? ((lastPrice - refPrice) / refPrice * 100) : 0);

      const hasChanged =
        Math.abs(lastPrice - existingItem.currentPrice) > 0.01 ||
        Math.abs(changePercent - existingItem.changePercent) > 0.01 ||
        (realtimeData.totalVol != null && realtimeData.totalVol !== existingItem.volume);

      if (!hasChanged) return;

      heatmapItemsMapRef.current.set(ticker, {
        ...existingItem,
        currentPrice: lastPrice,
        changePercent,
        changeValue: realtimeData.change ?? existingItem.changeValue,
        volume: realtimeData.totalVol || existingItem.volume,
        totalValue: realtimeData.totalVal || existingItem.totalValue,
        lastUpdate: new Date().toISOString(),
      });

      if (throttleRef.current === null) {
        throttleRef.current = setTimeout(() => {
          throttleRef.current = null;
          setHeatmapItemsVersion(v => v + 1);
        }, THROTTLE_MS);
      }
    });

    return () => {
      unsubscribe();
      if (throttleRef.current !== null) {
        clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
    };
  }, []); // Mount once

  // Load sector data when a sector is selected
  useEffect(() => {
    if (!selectedSector || !isConnected) return;

    const loadSectorData = async () => {
      try {
        const sectorData = await heatmapService.getHeatmapData({ sector: selectedSector.id });

        const newTickers: string[] = [];
        sectorData.items.forEach(item => {
          heatmapItemsMapRef.current.set(item.ticker, {
            ticker: item.ticker,
            companyName: item.companyName,
            sector: item.sector || '',
            sectorName: item.sectorName || 'Khác',
            currentPrice: item.currentPrice,
            changePercent: item.changePercent,
            changeValue: item.changeValue,
            volume: item.volume,
            totalValue: (item as any).totalValue ?? 0,
            exchange: item.exchange,
            colorType: item.colorType as any,
            lastUpdate: item.lastUpdate,
          });
          if (!subscribedSymbolsRef.current.includes(item.ticker)) {
            newTickers.push(item.ticker);
          }
        });

        if (newTickers.length > 0) {
          await subscribeToSymbols(newTickers);
          subscribedSymbolsRef.current = [...subscribedSymbolsRef.current, ...newTickers];
        }

        setHeatmapItemsVersion(v => v + 1);
      } catch (error) {
        console.error('[Heatmap] Failed to load sector data:', error);
      }
    };

    loadSectorData();
  }, [selectedSector?.id, isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load watchlist tickers when watchlist selection changes
  useEffect(() => {
    if (selectedWatchlistId) {
      watchListService
        .getWatchListById(selectedWatchlistId)
        .then((detail) => { setCustomTickers(detail.tickers); })
        .catch(() => { setCustomTickers([]); });
    } else {
      setCustomTickers([]);
    }
  }, [selectedWatchlistId]);

  // Market statistics memo
  const marketStats: MarketStats = useMemo(() => {
    const items = Array.from(heatmapItemsMapRef.current.values());

    if (items.length === 0) {
      return {
        index: 'VNINDEX',
        indexValue: 0,
        indexChange: 0,
        up: { count: 0, value: 0 },
        noChange: { count: 0, value: 0 },
        down: { count: 0, value: 0 },
        volume: 0,
        totalValue: 0,
        foreignNetValue: 0,
      };
    }

    const upItems = items.filter(item => item.changePercent > 0);
    const noChangeItems = items.filter(item => item.changePercent === 0);
    const downItems = items.filter(item => item.changePercent < 0);

    const upValue = upItems.reduce((sum, item) => sum + (item.volume * item.currentPrice), 0) / 1e9;
    const noChangeValue = noChangeItems.reduce((sum, item) => sum + (item.volume * item.currentPrice), 0) / 1e9;
    const downValue = downItems.reduce((sum, item) => sum + (item.volume * item.currentPrice), 0) / 1e9;

    const totalVolume = items.reduce((sum, item) => sum + item.volume, 0) / 1e9;
    const totalValue = upValue + noChangeValue + downValue;

    return {
      index: selectedExchange === 'HSX' ? 'VNINDEX' : selectedExchange === 'HNX' ? 'HNX-INDEX' : 'UPCOM-INDEX',
      indexValue: 1722.26, // Placeholder
      indexChange: -0.23,  // Placeholder
      up: { count: upItems.length, value: upValue },
      noChange: { count: noChangeItems.length, value: noChangeValue },
      down: { count: downItems.length, value: downValue },
      volume: totalVolume,
      totalValue: totalValue,
      foreignNetValue: -1288.2, // Placeholder
    };
  }, [heatmapItemsVersion, selectedExchange]);

  // Transform data to ECharts treemap format
  const heatmapData = useMemo(() => {
    const items = Array.from(heatmapItemsMapRef.current.values());
    if (items.length === 0) return [];

    let filteredItems = items;

    if (selectedSector && selectedSector.symbols.length > 0) {
      filteredItems = items.filter(item => selectedSector.symbols.includes(item.ticker));
    } else if (customTickers.length > 0) {
      filteredItems = items.filter(item => customTickers.includes(item.ticker));
    }

    const result = filteredItems
      .map(item => {
        const sectorId = item.sector || 'Khác';
        const sectorName = item.sectorName || 'Khác';

        let compressedValue: number;
        if (selectedWatchlistId !== null) {
          compressedValue = 1;
        } else {
          const rawValue = item.totalValue > 0
            ? item.totalValue
            : item.volume * item.currentPrice;
          compressedValue = Math.sqrt(Math.max(rawValue, 1));
        }

        return {
          name: item.ticker,
          value: compressedValue,
          change: item.changePercent,
          changeValue: item.changeValue,
          price: item.currentPrice,
          volume: item.volume,
          totalValue: item.totalValue,
          sector: sectorId,
          sectorName,
        };
      })
      .sort((a, b) => b.value - a.value);

    prevHeatmapDataRef.current = result;
    return result;
  }, [heatmapItemsVersion, selectedSector, customTickers, selectedWatchlistId]);

  const handleExchangeChange = useCallback((ex: ExchangeCode | null) => {
    setSelectedExchange(ex);
  }, []);

  const handleSectorChange = useCallback((sector: Sector | null) => {
    setSelectedSector(sector);
  }, []);

  const fetchWatchLists = useCallback(async () => {
    try {
      setIsLoadingWatchlists(true);
      const watchlists = await watchListService.getWatchLists();
      setAvailableWatchlists(watchlists);
    } catch (error) {
      console.error('[Heatmap] Failed to load watchlists:', error);
      setAvailableWatchlists([]);
    } finally {
      setIsLoadingWatchlists(false);
    }
  }, []);

  const handleSelectWatchList = useCallback((watchList: WatchListSummary) => {
    setSelectedWatchlistId(prev => prev === watchList.id ? null : watchList.id);
  }, []);

  return {
    selectedExchange,
    selectedSector,
    selectedWatchlistId,
    availableWatchlists,
    isLoadingWatchlists,
    isLoading,
    heatmapItemsMapRef,
    heatmapItemsVersion,
    symbolMetadataRef,
    marketStats,
    heatmapData,
    handleExchangeChange,
    handleSectorChange,
    fetchWatchLists,
    handleSelectWatchList,
  };
}
