"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSignalR } from '@/contexts/SignalRContext';
import { HeatmapItem } from '@/types/heatmap';
import { heatmapService } from '@/services/heatmapService';
import { watchListService } from '@/services/watchListService';
import SignalRService from '@/services/signalRService';
import { ExchangeCode, SymbolData, SymbolType } from '@/types/symbol';
import { Sector } from '@/types/sector';
import { WatchListSummary } from '@/types/watchList';
import * as echarts from 'echarts';
import WatchListSelector from '@/components/dashboard/layout/WatchListSelector';
import ExchangeFilter from './StockScreener/ExchangeFilter';
import SectorFilter from './StockScreener/SectorFilter';
import IndexFilter, { type IndexType } from './StockScreener/IndexFilter';
import SymbolTypeFilter from './StockScreener/SymbolTypeFilter';

interface MarketStats {
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

export default function HeatmapModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedExchange, setSelectedExchange] = useState<ExchangeCode | null>(() => {
    if (typeof window === 'undefined') return 'HSX';
    const saved = localStorage.getItem('heatmap-exchange');
    return (saved === 'HSX' || saved === 'HNX' || saved === 'UPCOM') ? saved as ExchangeCode : 'HSX';
  });
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<IndexType | null>(null);
  const [selectedSymbolType, setSelectedSymbolType] = useState<SymbolType | null>(null);
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
  
  // Get SignalR connection and market data (like stock screener)
  const { isConnected, subscribeToSymbols, unsubscribeFromSymbols, marketData } = useSignalR();
  
  // Use Map for O(1) lookups and updates instead of array
  const heatmapItemsMapRef = useRef<Map<string, HeatmapItem>>(new Map());
  const [heatmapItemsVersion, setHeatmapItemsVersion] = useState(0); // Trigger re-render without copying entire map
  const [isLoading, setIsLoading] = useState(true);
  
  // Store symbol metadata (sector info)
  const symbolMetadataRef = useRef<Map<string, SymbolData>>(new Map());
  
  // Ref to track subscribed symbols
  const subscribedSymbolsRef = useRef<string[]>([]);
  
  const pieChartRef = useRef<HTMLDivElement>(null);
  const heatmapChartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  
  // Cache previous heatmapData to avoid unnecessary recalculations
  const prevHeatmapDataRef = useRef<any[]>([]);
  // Tracks cumulative zoom step sum so we can fully restore when scrolling back to origin.
  // Positive = zoomed in, 0 = original view.
  const zoomSumRef = useRef(0);
  // Stores the last applied ECharts option (including current filtered data).
  // Used to reset zoom/pan without losing the active filter state.
  const lastChartOptionRef = useRef<any>(null);

  // Persist filter state across page refreshes
  useEffect(() => {
    if (selectedExchange) localStorage.setItem('heatmap-exchange', selectedExchange);
    else localStorage.removeItem('heatmap-exchange');
  }, [selectedExchange]);
  useEffect(() => { localStorage.setItem('heatmap-customTickers', JSON.stringify(customTickers)); }, [customTickers]);
  useEffect(() => {
    if (selectedWatchlistId !== null) localStorage.setItem('heatmap-watchlistId', String(selectedWatchlistId));
    else localStorage.removeItem('heatmap-watchlistId');
  }, [selectedWatchlistId]);

  // Track if symbols have been loaded
  const hasLoadedSymbols = useRef(false);

  // Load symbols when SignalR connects (like StockScreener)
  useEffect(() => {
    console.log(`[Heatmap] 📡 Connection status changed - isConnected: ${isConnected}, hasLoaded: ${hasLoadedSymbols.current}`);
    
    // Only load if connected AND not already loaded
    if (!isConnected || hasLoadedSymbols.current) {
      console.log('[Heatmap] ⏸️ Skipping load - not connected or already loaded');
      return;
    }

    const loadSymbols = async () => {
      try {
        setIsLoading(true);
        
        console.log(`[Heatmap] 🔄 Fetching heatmap data for ${selectedExchange ?? 'all'}...`);
        
        // Fetch heatmap data from REST API (includes prices, sectors, etc.)
        const heatmapData = await heatmapService.getHeatmapData({
          exchange: selectedExchange ?? undefined,
        });
        
        console.log(`[Heatmap] ✅ Loaded ${heatmapData.items.length} items from REST API`);
        if (heatmapData.items.length > 0) {
          console.log('[Heatmap] 📊 Sample item:', heatmapData.items[0]);
        }
        
        // Convert REST API data to Map for O(1) access
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
        
        setHeatmapItemsVersion(v => v + 1); // Trigger re-render
        
        // Subscribe to SignalR for real-time updates
        const tickers = heatmapData.items.map(item => item.ticker);
        if (tickers.length > 0) {
          console.log(`[Heatmap] 📡 Subscribing to ${tickers.length} symbols for real-time updates...`);
          await subscribeToSymbols(tickers);
          subscribedSymbolsRef.current = tickers;
          hasLoadedSymbols.current = true;
          console.log(`[Heatmap] ✅ Subscribed to real-time updates!`);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('[Heatmap] ❌ Failed to load heatmap data:', error);
        setIsLoading(false);
      }
    };
    
    console.log('[Heatmap] 🚀 Starting to load symbols...');
    loadSymbols();
  }, [isConnected]); // Only depend on isConnected to avoid infinite loop

  // Reload symbols when exchange changes
  useEffect(() => {
    console.log(`[Heatmap] 🔄 Exchange changed to: ${selectedExchange ?? 'all'}`);
    
    if (!isConnected) {
      console.log('[Heatmap] ⚠️ Not connected, skipping exchange change');
      return;
    }

    const reloadSymbols = async () => {
      try {
        setIsLoading(true);
        
        console.log(`[Heatmap] 🔄 Reloading symbols for exchange: ${selectedExchange ?? 'all'}`);
        
        // Unsubscribe from old symbols
        if (subscribedSymbolsRef.current.length > 0) {
          console.log(`[Heatmap] 🔕 Unsubscribing from ${subscribedSymbolsRef.current.length} old symbols`);
          await unsubscribeFromSymbols(subscribedSymbolsRef.current);
          subscribedSymbolsRef.current = [];
        }

        // Clear existing heatmap data so stale items from the old exchange don't linger
        heatmapItemsMapRef.current.clear();
        
        // Fetch heatmap data (price + sector) for the new exchange — same path as initial load
        const heatmapData = await heatmapService.getHeatmapData({
          exchange: selectedExchange ?? undefined,
        });

        console.log(`[Heatmap] ✅ Loaded ${heatmapData.items.length} items for ${selectedExchange ?? 'all'}`);

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
        
        // Subscribe to SignalR for real-time updates
        const tickers = heatmapData.items.map(item => item.ticker);
        if (tickers.length > 0) {
          console.log(`[Heatmap] 📡 Subscribing to ${tickers.length} new symbols...`);
          await subscribeToSymbols(tickers);
          subscribedSymbolsRef.current = tickers;
          console.log(`[Heatmap] ✅ Subscribed successfully!`);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('[Heatmap] ❌ Failed to reload symbols:', error);
        setIsLoading(false);
      }
    };
    
    // Only reload if already loaded initially (don't run on first mount)
    if (hasLoadedSymbols.current) {
      reloadSymbols();
    }
  }, [selectedExchange, isConnected]); // Only depend on exchange and isConnected

  // Real-time SignalR updates — O(1) Map update per message, chart re-render throttled to
  // once every 500 ms. ECharts treemap layout for 400+ nodes takes 50–200 ms; firing it
  // on every RAF tick (16 ms) saturates the JS thread and causes extreme perceived lag.
  // The Map always holds the latest values, so each 500 ms flush captures all accumulated changes.
  useEffect(() => {
    const THROTTLE_MS = 500;
    const throttleRef = { current: null as ReturnType<typeof setTimeout> | null };

    const unsubscribe = SignalRService.getInstance().onMarketDataReceived((realtimeData) => {
      const ticker = realtimeData.ticker?.toUpperCase();
      if (!ticker) return;

      const existingItem = heatmapItemsMapRef.current.get(ticker);
      if (!existingItem) return; // Not tracked in this heatmap view

      const lastPrice = realtimeData.lastPrice;

      // Guard 1: Skip if lastPrice is 0 or missing — hub sends initial snapshot on subscribe;
      // untraded stocks have LastPrice=0 which would overwrite correct REST data with 0%.
      if (!lastPrice || lastPrice === 0) return;

      const refPrice = realtimeData.referencePrice || existingItem.currentPrice;

      // Guard 2: Skip snapshot-replay where price == reference (no real trade yet),
      // but only when existing data already has a meaningful non-zero changePercent.
      if (lastPrice === refPrice && existingItem.changePercent !== 0) return;

      // Prefer server-computed ratioChange (e.g. -6.82 = -6.82%).
      // Fall back to local calculation only when ratioChange is absent.
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

      // Throttle chart re-renders: at most one flush per THROTTLE_MS window.
      // Multiple ticks within the window fold silently into the Map.
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
  }, []); // Mount once — no dependency on the batched marketData Map

  // When a specific sector is selected, load ALL stocks in that sector regardless of exchange.
  // Without this, stocks on other exchanges (HNX/UPCOM) are missing from the heatmap because
  // the initial load only fetches data for the currently selected exchange.
  useEffect(() => {
    if (!selectedSector || !isConnected) return;

    const loadSectorData = async () => {
      try {
        console.log(`[Heatmap] 🏭 Loading all-exchange data for sector: ${selectedSector.id}`);
        // Fetch without exchange filter so we get stocks from all exchanges
        const sectorData = await heatmapService.getHeatmapData({ sector: selectedSector.id });

        const newTickers: string[] = [];
        sectorData.items.forEach(item => {
          // Upsert — update price if already exists, add if new
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

        // Subscribe to SignalR for newly discovered tickers
        if (newTickers.length > 0) {
          console.log(`[Heatmap] 📡 Subscribing to ${newTickers.length} cross-exchange sector tickers`);
          await subscribeToSymbols(newTickers);
          subscribedSymbolsRef.current = [...subscribedSymbolsRef.current, ...newTickers];
        }

        console.log(`[Heatmap] ✅ Sector data loaded: ${sectorData.items.length} stocks`);
        setHeatmapItemsVersion(v => v + 1);
      } catch (error) {
        console.error('[Heatmap] ❌ Failed to load sector data:', error);
      }
    };

    loadSectorData();
  }, [selectedSector?.id, isConnected]); // Re-run when sector selection changes

  // Load selected watchlist details (tickers) when watchlist is selected
  useEffect(() => {
    if (selectedWatchlistId) {
      const loadWatchlistDetail = async () => {
        try {
          console.log(`[Heatmap] 📥 Loading watchlist detail for ID: ${selectedWatchlistId}`);
          const detail = await watchListService.getWatchListById(selectedWatchlistId);
          
          setCustomTickers(detail.tickers);
          console.log(`[Heatmap] ✅ Loaded ${detail.tickers.length} tickers from watchlist: ${detail.name}`);
        } catch (error) {
          console.error('[Heatmap] ❌ Failed to load watchlist detail:', error);
          setCustomTickers([]);
        }
      };
      
      loadWatchlistDetail();
    } else {
      setCustomTickers([]);
    }
  }, [selectedWatchlistId]);

  // Calculate market stats from real-time data (use Map values)
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

    const upValue = upItems.reduce((sum, item) => sum + (item.volume * item.currentPrice), 0) / 1e9; // Convert to billions
    const noChangeValue = noChangeItems.reduce((sum, item) => sum + (item.volume * item.currentPrice), 0) / 1e9;
    const downValue = downItems.reduce((sum, item) => sum + (item.volume * item.currentPrice), 0) / 1e9;

    const totalVolume = items.reduce((sum, item) => sum + item.volume, 0) / 1e9;
    const totalValue = upValue + noChangeValue + downValue;

    // TODO: Get actual index value from backend
    return {
      index: selectedExchange === 'HSX' ? 'VNINDEX' : selectedExchange === 'HNX' ? 'HNX-INDEX' : 'UPCOM-INDEX',
      indexValue: 1722.26, // Placeholder - should come from backend
      indexChange: -0.23,  // Placeholder - should come from backend
      up: { count: upItems.length, value: upValue },
      noChange: { count: noChangeItems.length, value: noChangeValue },
      down: { count: downItems.length, value: downValue },
      volume: totalVolume,
      totalValue: totalValue,
      foreignNetValue: -1288.2, // Placeholder - should come from backend
    };
  }, [heatmapItemsVersion, selectedExchange]); // Depend on version counter instead of items array

  // Transform real-time data to heatmap format (with optimization)
  const heatmapData = useMemo(() => {
    const items = Array.from(heatmapItemsMapRef.current.values());
    
    console.log(`[Heatmap] 🔄 Computing heatmapData from ${items.length} items (Map-based)`);
    if (items.length === 0) {
      console.log('[Heatmap] ⚠️ No heatmapItems, returning empty array');
      return [];
    }

    // Debug: Log first item to see sector format
    if (items.length > 0) {
      console.log('[Heatmap] 📋 Sample sector data:', {
        sector: items[0].sector,
        sectorName: items[0].sectorName,
        ticker: items[0].ticker
      });
    }

    // Filter by mode
    let filteredItems = items;
    
    if (selectedSector && selectedSector.symbols.length > 0) {
      // Filter by selected sector
      filteredItems = items.filter(item => selectedSector.symbols.includes(item.ticker));
    } else if (customTickers.length > 0) {
      // Filter by custom tickers (watchlist)
      filteredItems = items.filter(item => customTickers.includes(item.ticker));
    }
    // else: show all items

    const result = filteredItems
      .map(item => {
        const sectorId = item.sector || 'Khác';
        // Use sectorName from API first, fallback to mapping if not available
        const sectorName = item.sectorName || 'Khác';
        
        // Sizing strategy:
        // - custom (watchlist): equal size for every stock so all watched items are
        //   clearly visible regardless of market cap differences.
        // - all / sector modes: sqrt-compress trading value to reduce dynamic range
        //   without completely hiding small-cap stocks.
        let compressedValue: number;
        if (selectedWatchlistId !== null) {
          compressedValue = 1; // equal weight — user picked these stocks to monitor
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
          sectorName: sectorName,
        };
      })
      .sort((a, b) => b.value - a.value); // Sort by value descending
    
    // Only log if data actually changed (reduce console spam)
    const hasChanged = result.length !== prevHeatmapDataRef.current.length ||
      result.some((item, i) => {
        const prev = prevHeatmapDataRef.current[i];
        return !prev || 
          item.name !== prev.name || 
          Math.abs(item.change - prev.change) > 0.01;
      });
    
    if (hasChanged) {
      console.log(`[Heatmap] 📊 HeatmapData changed: ${result.length} items`);
      prevHeatmapDataRef.current = result;
    }
    
    return result;
  }, [heatmapItemsVersion, selectedSector, customTickers, selectedWatchlistId]);

  // Initialize Pie Chart
  useEffect(() => {
    if (!pieChartRef.current) return;

    const chart = echarts.init(pieChartRef.current);
    const option = {
      series: [
        {
          type: 'pie',
          radius: ['65%', '85%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          data: [
            { value: marketStats.up.value, itemStyle: { color: '#10b981' } },
            { value: marketStats.noChange.value, itemStyle: { color: '#f59e0b' } },
            { value: marketStats.down.value, itemStyle: { color: '#ef4444' } },
          ],
        },
      ],
    };

    chart.setOption(option);

    return () => {
      chart.dispose();
    };
  }, [isDark, marketStats]);

  // Initialize Heatmap Chart (only once)
  useEffect(() => {
    console.log(`[Heatmap] 🎨 Chart initialization - ref: ${!!heatmapChartRef.current}`);
    if (!heatmapChartRef.current) {
      console.log('[Heatmap] ⏸️ Chart ref not ready');
      return;
    }

    // Dispose existing chart if any
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    const chart = echarts.init(heatmapChartRef.current);
    chartInstanceRef.current = chart;
    
    console.log('[Heatmap] ✅ Chart initialized');

    // Reduce zoom sensitivity: intercept wheel events and slow down deltaY
    // by a factor before ECharts processes them (default feels too fast).
    // Only intercept trusted (real user) events — isTrusted=false means it's our
    // own re-dispatched event, so we let it pass through to ECharts normally.
    const wheelTarget = heatmapChartRef.current;
    const handleWheel = (e: WheelEvent) => {
      if (!e.isTrusted) return; // Already dampened — let ECharts handle it
      e.preventDefault();
      e.stopImmediatePropagation();

      // step > 0 = zoom in, step < 0 = zoom out
      const step = -e.deltaY * 0.1;
      const newSum = zoomSumRef.current + step;

      if (newSum <= 0) {
        // Zoomed back out to (or past) original — re-apply the current filtered option
        // to reset scale + pan without losing the active sector/exchange filter.
        // (dispatchAction 'restore' would reset to the *initial* unfiltered state.)
        if (zoomSumRef.current > 0 && lastChartOptionRef.current) {
          chartInstanceRef.current?.setOption(lastChartOptionRef.current, {
            notMerge: true,
            lazyUpdate: false,
          });
        }
        zoomSumRef.current = 0;
        return; // Do NOT forward to ECharts
      }

      zoomSumRef.current = newSum;
      const dampened = new WheelEvent('wheel', {
        deltaX: e.deltaX,
        deltaY: -e.deltaY * 0.1,  // Negate to fix reversed direction; 0.1 = reduce sensitivity
        deltaZ: e.deltaZ,
        deltaMode: e.deltaMode,
        clientX: e.clientX,
        clientY: e.clientY,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        bubbles: true,
        cancelable: true,
      });
      (e.target as Element).dispatchEvent(dampened);
    };
    wheelTarget.addEventListener('wheel', handleWheel, { capture: true, passive: false });

    // Use ResizeObserver to track container size changes (covers grid resize, module resize, etc.)
    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(heatmapChartRef.current);

    // Also listen to window resize as fallback
    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      console.log('[Heatmap] 🧹 Disposing chart');
      wheelTarget.removeEventListener('wheel', handleWheel, { capture: true });
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [isDark]); // Only re-create chart when theme changes

  // Update chart data when heatmapData changes (incremental update)
  useEffect(() => {
    console.log(`[Heatmap] 🔄 Updating chart data - dataLen: ${heatmapData.length}`);
    if (!chartInstanceRef.current || heatmapData.length === 0) {
      console.log('[Heatmap] ⏸️ Skipping update - no chart instance or data');
      return;
    }

    const chart = chartInstanceRef.current;
    console.log(`[Heatmap] 🚨 Updating chart with ${heatmapData.length} items`);
    
    // Group data by sector (with caching to avoid repeated work)
    const sectorsMap = new Map<string, typeof heatmapData>();
    heatmapData.forEach(stock => {
      const sectorName = stock.sectorName;
      if (!sectorsMap.has(sectorName)) {
        sectorsMap.set(sectorName, []);
      }
      sectorsMap.get(sectorName)!.push(stock);
    });

    const treeData = Array.from(sectorsMap.entries()).map(([sectorName, sectorStocks]) => {
      // Sort stocks by value descending (only once)
      const sortedStocks = [...sectorStocks].sort((a, b) => b.value - a.value);
      
      // Calculate total value for sector (for proper sizing)
      const sectorTotalValue = sortedStocks.reduce((sum, stock) => sum + stock.value, 0);
      
      return {
        name: sectorName,
        value: sectorTotalValue,
        children: sortedStocks.map(stock => {
          // Determine color based on change percent (optimized with early returns)
          let color: string;
          const change = stock.change;
          
          if (change >= 6.5) color = '#9333ea'; // Purple - Ceiling
          else if (change >= 3) color = '#16a34a'; // Dark Green
          else if (change >= 1) color = '#22c55e'; // Green
          else if (change > 0) color = '#4ade80'; // Light Green
          else if (change === 0) color = '#f59e0b'; // Yellow
          else if (change > -1) color = '#f87171'; // Light Red
          else if (change > -3) color = '#ef4444'; // Red
          else if (change > -6.5) color = '#dc2626'; // Dark Red
          else color = '#06b6d4'; // Cyan - Floor
          
          return {
            name: stock.name,
            value: stock.value,
            change: stock.change,
            changeValue: stock.changeValue,
            price: stock.price,
            volume: stock.volume,
            totalValue: stock.totalValue,
            itemStyle: { color },
          };
        })
      };
    });

    console.log('[Heatmap] 📊 TreeData created:', {
      sectorsCount: treeData.length,
      sampleSector: treeData[0]?.name,
      sampleStock: treeData[0]?.children[0]
    });

    // Simplified tooltip configuration (reduce computation)
    const option = {
      tooltip: {
        confine: true, // Keep tooltip within chart bounds
        formatter: (params: any) => {
          if (params.treePathInfo && params.treePathInfo.length > 1) {
            const stock = params.data;
            const changeColor = stock.change >= 0 ? '#22c55e' : '#ef4444';
            const changePrefix = stock.change > 0 ? '+' : '';
            const formatPrice = (v: number) => v > 0 ? v.toLocaleString('vi-VN') : '—';
            const formatVolume = (v: number) => {
              if (!v || v === 0) return '—';
              if (v >= 1e6) return (v / 1e6).toFixed(2) + ' triệu';
              if (v >= 1e3) return (v / 1e3).toFixed(1) + ' nghìn';
              return v.toLocaleString('vi-VN');
            };
            const formatValue = (v: number) => {
              if (!v || v === 0) return '—';
              if (v >= 1e9) return (v / 1e9).toFixed(2) + ' tỷ';
              if (v >= 1e6) return (v / 1e6).toFixed(2) + ' triệu';
              return v.toLocaleString('vi-VN');
            };
            return `<div style="min-width:160px;font-size:13px;line-height:1.7">`
              + `<div style="font-weight:700;font-size:15px;margin-bottom:4px">${stock.name}</div>`
              + `<div>Giá: <b>${formatPrice(stock.price)}</b></div>`
              + `<div>Thay đổi: <b><span style="color:${changeColor}">${changePrefix}${stock.changeValue?.toLocaleString('vi-VN') ?? '—'} (${changePrefix}${stock.change?.toFixed(2) ?? '—'}%)</span></b></div>`
              + `<div>KL giao dịch: <b>${formatVolume(stock.volume)}</b></div>`
              + `<div>GT giao dịch: <b>${formatValue(stock.totalValue)}</b></div>`
              + `</div>`;
          }
          const stockCount = params.data.children?.length || 0;
          return `<strong>${params.name}</strong><br/>${stockCount} mã cổ phiếu`;
        },
      },
      series: [
        {
          type: 'treemap',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          roam: true, // Allow both zoom (scale) and pan — pan resets automatically when zoomed out to origin
          scaleLimit: { min: 0.1, max: 5 }, // Lower bound handled by wheel handler (restore at origin)
          nodeClick: false, // Disable built-in zoomToNode so drag works; zoom handled by wheel handler
          zoomToNodeRatio: 0.32 * 0.32,
          animation: false, // Disable animations for better performance
          animationDuration: 0,
          breadcrumb: {
            show: false, // Hidden to use full chart height; navigate via nodeClick drill-down
          },
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#fff',
            position: 'inside',
            align: 'center',
            formatter: (params: any) => {
              if (params.data.change !== undefined) {
                const changeText = `${params.data.change > 0 ? '+' : ''}${params.data.change.toFixed(2)}%`;
                return `${params.name}\n${changeText}`;
              }
              return params.name;
            },
          },
          upperLabel: {
            show: true,
            height: 32,
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderColor: 'rgba(255,255,255,0.2)',
            borderWidth: 1,
            formatter: (params: any) => {
              const stockCount = params.data.children?.length || 0;
              return `${params.name} (${stockCount})`;
            },
          },
          itemStyle: {
            borderColor: isDark ? '#000' : '#1a1a1a',
            borderWidth: 1,
            gapWidth: 1,
          },
          levels: [
            { itemStyle: { borderWidth: 0 }, upperLabel: { show: false }, label: { show: false } },
            {
              itemStyle: {
                borderColor: isDark ? '#000' : '#1a1a1a',
                borderWidth: 2,
                gapWidth: 2,
              },
              upperLabel: {
                show: true,
                height: 35,
                fontSize: 16,
                fontWeight: 'bold',
                color: '#fff',
              },
              label: { show: false },
            },
            {
              itemStyle: {
                borderColor: isDark ? '#000' : '#1a1a1a',
                borderWidth: 1,
                gapWidth: 1,
              },
              label: {
                show: true,
                fontSize: 13,
                fontWeight: 'bold',
                color: '#fff',
                overflow: 'truncate',
                formatter: (params: any) => {
                  const change = params.data?.change;
                  if (change !== undefined && change !== null) {
                    const changeStr = change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
                    return `${params.name}\n${changeStr}`;
                  }
                  return params.name;
                },
              },
              upperLabel: { show: false },
            }
          ],
          data: treeData,
        },
      ],
    };

    // Save current option so the wheel handler can re-apply it (with current filters)
    // when the user zooms back out to the original level — avoids calling restore()
    // which would reset to the *initial* (empty/unfiltered) chart state.
    lastChartOptionRef.current = option;

    // Incremental update - only update data, don't recreate chart
    // Use silent mode to prevent animations on every update (reduces lag)
    chart.setOption(option, {
      notMerge: false, // Merge with existing option instead of replacing
      lazyUpdate: false, // Render immediately — RAF batching is handled by our own heatmapRafRef
      silent: false, // Keep animations but optimize
    });

    console.log('[Heatmap] ✅ Chart data updated incrementally (optimized)');
  }, [heatmapData, isDark]); // Update when data or theme changes

  // Filter event handlers
  const handleExchangeChange = (ex: ExchangeCode) => {
    setSelectedExchange(prev => prev === ex ? null : ex);
  };

  const handleSectorChange = (sector: Sector) => {
    setSelectedSector(prev => prev?.id === sector.id ? null : sector);
  };

  const handleIndexChange = (index: IndexType | null) => {
    setSelectedIndex(index);
  };

  const handleSymbolTypeChange = (type: SymbolType | null) => {
    setSelectedSymbolType(type);
  };

  const fetchWatchLists = async () => {
    try {
      setIsLoadingWatchlists(true);
      const watchlists = await watchListService.getWatchLists();
      setAvailableWatchlists(watchlists);
    } catch (error) {
      console.error('[Heatmap] ❌ Failed to load watchlists:', error);
      setAvailableWatchlists([]);
    } finally {
      setIsLoadingWatchlists(false);
    }
  };

  const handleSelectWatchList = (watchList: WatchListSummary) => {
    setSelectedWatchlistId(prev => prev === watchList.id ? null : watchList.id);
  };

  return (
    <div className={`w-full h-full flex flex-col ${isDark ? 'bg-cardBackground text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Badge title */}
      <div className="flex-none flex items-center justify-center pt-1.5 pb-0.5">
        <div className="relative flex items-center justify-center cursor-move drag-handle select-none">
          <svg width="180" height="28" viewBox="0 0 136 22" className="block">
            <path d="M134 0C151 0 -15 0 2 0C19 0 27 22 46 22H92C113 22 119 0 134 0Z" fill="#4ADE80"/>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-black tracking-wide">
            Biểu đồ nhiệt
          </span>
        </div>
      </div>
      {/* Filter Bar */}
      <div className={`flex items-center gap-2 px-4 py-2 border-b flex-wrap ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        {/* Watch List Selector */}
        <WatchListSelector
          watchLists={availableWatchlists}
          currentWatchListId={selectedWatchlistId}
          currentWatchListName={availableWatchlists.find(w => w.id === selectedWatchlistId)?.name || 'Danh mục của tôi'}
          isLoading={isLoadingWatchlists}
          onSelect={handleSelectWatchList}
          onRefresh={fetchWatchLists}
        />

        {/* Index Filter */}
        <IndexFilter
          onIndexChange={handleIndexChange}
          selectedIndex={selectedIndex}
        />

        {/* Symbol Type Filter */}
        <SymbolTypeFilter
          onSymbolTypeChange={handleSymbolTypeChange}
          selectedType={selectedSymbolType}
        />

        {/* Exchange Filter */}
        <ExchangeFilter
          onExchangeChange={handleExchangeChange}
          selectedExchange={selectedExchange}
        />

        {/* Sector Filter */}
        <SectorFilter
          onSectorChange={handleSectorChange}
          selectedSector={selectedSector}
        />

        {/* Connection Status */}
        <div className={`ml-auto flex items-center justify-center w-8 h-8 rounded-full ${
          isConnected ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={isConnected ? 'Đang kết nối' : 'Ngắt kết nối'} />
        </div>
      </div>

      {/* Connection Status Message */}
      {!isConnected && (
        <div className="px-4 py-3 bg-yellow-500/10 border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-500">
            Đang kết nối tới SignalR...
          </p>
        </div>
      )}

      {/* Market Overview */}
      {/* <div className={`px-4 py-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-10"> */}
          {/* Pie Chart with Index */}
          {/* <div className="relative flex-shrink-0">
            <div ref={pieChartRef} style={{ width: '100px', height: '100px' }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] font-bold">{marketStats.index}</p>
              <p className={`text-sm font-bold ${marketStats.indexChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {marketStats.indexValue.toFixed(2)}
              </p>
            </div>
          </div> */}

          {/* Statistics Column 1 */}
          {/* <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-green-500">Tăng giá</span>
              </div>
              <span className="font-medium">
                <span className="text-green-500">{marketStats.up.count} CP</span>
                <span className="mx-1">/</span>
                <span>{marketStats.up.value.toLocaleString()} tỷ</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-orange-500">Không đổi</span>
              </div>
              <span className="font-medium">
                <span className="text-orange-500">{marketStats.noChange.count} CP</span>
                <span className="mx-1">/</span>
                <span>{marketStats.noChange.value.toLocaleString()} tỷ</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-red-500">Giảm giá</span>
              </div>
              <span className="font-medium">
                <span className="text-red-500">{marketStats.down.count} CP</span>
                <span className="mx-1">/</span>
                <span>{marketStats.down.value.toLocaleString()} tỷ</span>
              </span>
            </div>
          </div> */}

          {/* Statistics Column 2 */}
          {/* <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-6 text-xs">
              <span>Khối lượng</span>
              <span className="font-medium">{marketStats.volume.toLocaleString()} tỷ</span>
            </div>
            <div className="flex items-center justify-between gap-6 text-xs">
              <span>Giá trị giao dịch</span>
              <span className="font-medium">{marketStats.totalValue.toLocaleString()} tỷ</span>
            </div>
            <div className="flex items-center justify-between gap-6 text-xs">
              <span>Giá trị NN mua ròng</span>
              <span className={`font-medium ${marketStats.foreignNetValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {marketStats.foreignNetValue.toLocaleString()} tỷ
              </span>
            </div>
          </div>
        </div> */}
      {/* </div> */}

      {/* Heatmap */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        {/* Always render chart div to ensure ref is available */}
        <div ref={heatmapChartRef} className={`absolute inset-2 ${heatmapData.length === 0 ? 'hidden' : ''}`} />
        
        {/* Loading state */}
        {isLoading && heatmapItemsMapRef.current.size === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Đang tải dữ liệu...</p>
            </div>
          </div>
        )}
        
        {/* No data state */}
        {!isLoading && heatmapData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Không có dữ liệu
            </p>
          </div>
        )}
      </div>
    </div>
  );
}