"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { init, dispose, CandleType, getSupportedOverlays } from 'klinecharts';
import type { Chart, KLineData, IndicatorCreate } from 'klinecharts';
import { TrendingUp, TrendingDown, Maximize2, Settings, Download, ZoomIn, ZoomOut, BarChart3, LineChart as LineChartIcon, CandlestickChart, Clock, Calendar, Activity, Minus, TrendingUpIcon, Circle, Square, Type, ArrowRight, Edit3, Triangle, Trash2, Move, SplitSquareVertical, Pencil, MousePointer2, Crosshair, Search, X } from 'lucide-react';
import { getAllTickers, fetchSymbols } from '@/services/symbolService';
import type { SymbolData } from '@/types/symbol';
import { useOhlcvSignalR } from '@/hooks/useOhlcvSignalR';

type ChartType = 'candle_solid' | 'candle_stroke' | 'candle_up_stroke' | 'candle_down_stroke' | 'ohlc' | 'area';
type TimeInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

interface Indicator {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
}

export default function VNStockChartModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const realtimeCallbackRef = useRef<((data: KLineData) => void) | null>(null);
  const pendingUpdatesRef = useRef<KLineData[]>([]);
  
  const [chartType, setChartType] = useState<ChartType>('candle_solid');
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('1m'); // Changed from '1d' to '1m' for realtime M1 updates
  const [symbol, setSymbol] = useState('FPT');
  const [isLoading, setIsLoading] = useState(false);
  const indicators = [
    { name: 'MA' },
    { name: 'EMA' },
    { name: 'VOL' },
    { name: 'MACD' },
    { name: 'RSI' },
    { name: 'BOLL' },
  ];
  const [activeIndicators, setActiveIndicators] = useState<Set<string>>(new Set());
  const [showVolume, setShowVolume] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [drawingMode, setDrawingMode] = useState<string | null>(null);
  const [allSymbols, setAllSymbols] = useState<SymbolData[]>([]);
  const [showSymbolModal, setShowSymbolModal] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [searchTab, setSearchTab] = useState<'ticker' | 'description'>('ticker');
  const symbolInputRef = useRef<HTMLInputElement>(null);

  // Map time interval to API timeframe
  const getAPITimeframe = (interval: TimeInterval): string => {
    const timeframeMap: Record<TimeInterval, string> = {
      '1m': 'M1',
      '5m': 'M5',
      '15m': 'M15',
      '30m': 'M30',
      '1h': 'H1',
      '4h': 'H4',
      '1d': 'D1',
      '1w': 'W1',
      '1M': 'MN1',
    };
    return timeframeMap[interval];
  };

  // Memoized callback to handle real-time candle updates
  const handleCandleUpdate = useCallback(async (candle: any) => {
    const klineData: KLineData = {
      timestamp: new Date(candle.startTime).getTime(), // Use startTime from OhlcvCandle
      open: candle.open / 1000,       // Divide by 1000 to match historical data format
      high: candle.high / 1000,       // SSI API returns prices in VND (e.g., 99800)
      low: candle.low / 1000,         // Chart expects prices in K VND (e.g., 99.8)
      close: candle.close / 1000,
      volume: candle.volume || 0,
    };
    
    const timestampDate = new Date(klineData.timestamp);
    console.log('[VNStockChart] handleCandleUpdate:', 
      candle.ticker, 
      candle.timeframe, 
      candle.isComplete ? '✅ COMPLETED' : '⏳ in-progress',
      '\n  timestamp:', klineData.timestamp,
      '\n  date:', timestampDate.toISOString(),
      '\n  close:', klineData.close,
      '\n  matches symbol:', candle.ticker === symbol,
      '\n  matches timeframe:', candle.timeframe === getAPITimeframe(timeInterval),
      '\n  current timeInterval:', timeInterval,
      '\n  expected API timeframe:', getAPITimeframe(timeInterval)
    );
    
    // CRITICAL: Handle completed vs in-progress differently
    if (candle.isComplete) {
      console.log('[VNStockChart] 🎯 Completed candle detected');
      
      // Completed candle: Just call the callback with final data
      // KLineCharts DataLoader will handle persistence automatically
      if (realtimeCallbackRef.current && candle.ticker === symbol && candle.timeframe === getAPITimeframe(timeInterval)) {
        console.log('[VNStockChart] ✅ Updating completed candle via subscribeBar callback');
        try {
          realtimeCallbackRef.current(klineData);
          console.log('[VNStockChart] ✅ Completed candle callback executed');
        } catch (err) {
          console.error('[VNStockChart] ❌ Completed candle callback error:', err);
        }
      }
    } else {
      // In-progress candle: Update via subscribeBar callback OR add new candle if needed
      if (realtimeCallbackRef.current) {
        // Check if this update is for current symbol and timeframe
        if (candle.ticker === symbol && candle.timeframe === getAPITimeframe(timeInterval)) {
          console.log('[VNStockChart] ✅ Updating in-progress candle via subscribeBar');
          console.log('[VNStockChart] 📊 Data:', klineData.timestamp, 'Close:', klineData.close, 'Volume:', klineData.volume);
          console.log('[VNStockChart] 📊 Full KLineData:', JSON.stringify(klineData));
          
          // Get current chart data to compare
          if (chartRef.current) {
            const dataList = chartRef.current.getDataList();
            if (dataList.length > 0) {
              const lastCandle = dataList[dataList.length - 1];
              console.log('[VNStockChart] 📊 Last candle in chart:', lastCandle.timestamp, new Date(lastCandle.timestamp).toISOString());
              console.log('[VNStockChart] 📊 New candle timestamp:', klineData.timestamp, new Date(klineData.timestamp).toISOString());
              console.log('[VNStockChart] 📊 Timestamps match:', lastCandle.timestamp === klineData.timestamp);
              
              // CRITICAL: Check if this is a NEW candle (newer timestamp)
              if (klineData.timestamp > lastCandle.timestamp) {
                console.log('[VNStockChart] 🆕 New candle detected - adding to chart');
                // Use applyNewData to add new candle instead of updating last one
                chartRef.current.applyNewData([klineData]);
                return; // Skip subscribeBar callback
              }
            } else {
              // No candles yet, add the first one
              console.log('[VNStockChart] 📝 First candle - adding to chart');
              chartRef.current.applyNewData([klineData]);
              return;
            }
          }
          
          // Update existing candle via subscribeBar callback
          realtimeCallbackRef.current(klineData);
        } else {
          console.log('[VNStockChart] ⏭️ Skipping update - different symbol/timeframe');
        }
      } else {
        // Buffer update until subscribeBar is called
        console.warn('[VNStockChart] ⚠️ Buffering update (subscribeBar not ready yet)');
        pendingUpdatesRef.current.push(klineData);
        
        // Keep only last 100 pending updates to avoid memory issues
        if (pendingUpdatesRef.current.length > 100) {
          pendingUpdatesRef.current = pendingUpdatesRef.current.slice(-100);
        }
      }
    }
  }, [symbol, timeInterval]); // Add symbol and timeInterval to deps
  
  // Helper function to get timeframe duration in milliseconds
  const getTimeframeMillis = (timeframe: string): number => {
    const map: Record<string, number> = {
      'M1': 60 * 1000,
      'M5': 5 * 60 * 1000,
      'M15': 15 * 60 * 1000,
      'M30': 30 * 60 * 1000,
      'H1': 60 * 60 * 1000,
      'H4': 4 * 60 * 60 * 1000,
      'D1': 24 * 60 * 60 * 1000,
      'W1': 7 * 24 * 60 * 60 * 1000,
      'MN1': 30 * 24 * 60 * 60 * 1000,
    };
    return map[timeframe] || 60 * 1000;
  };

  // Real-time OHLCV updates via SignalR
  const { candle: realtimeCandle, isConnected } = useOhlcvSignalR(
    symbol,
    getAPITimeframe(timeInterval),
    {
      onCandleUpdate: handleCandleUpdate
    }
  );
  
  // Debug: Log connection status
  useEffect(() => {
    console.log('[VNStockChart] SignalR Connection Status:', isConnected ? '✅ CONNECTED' : '❌ DISCONNECTED');
  }, [isConnected]);

  // Helper function to determine visible bar count based on timeframe
  const getVisibleBarCount = (interval: TimeInterval): number => {
    // Return appropriate number of bars to display initially
    const visibleBars: Record<TimeInterval, number> = {
      '1m': 200,    // ~3+ hours
      '5m': 150,    // ~12+ hours
      '15m': 120,   // ~2+ days
      '30m': 100,   // ~3+ days
      '1h': 100,    // ~4+ days
      '4h': 90,     // ~2+ weeks
      '1d': 180,    // ~6+ months
      '1w': 150,    // ~3+ years
      '1M': 60,     // ~5 years
    };
    return visibleBars[interval] || 100;
  };

  const drawingToolGroups = [
    {
      id: 'all-tools',
      name: 'Drawing Tools',
      icon: Pencil,
      tools: [
        { id: 'horizontalStraightLine', name: 'Horizontal Line', overlayName: 'horizontalStraightLine' },
        { id: 'horizontalRayLine', name: 'Horizontal Ray', overlayName: 'horizontalRayLine' },
        { id: 'horizontalSegment', name: 'Horizontal Segment', overlayName: 'horizontalSegment' },
        { id: 'verticalStraightLine', name: 'Vertical Line', overlayName: 'verticalStraightLine' },
        { id: 'verticalRayLine', name: 'Vertical Ray', overlayName: 'verticalRayLine' },
        { id: 'verticalSegment', name: 'Vertical Segment', overlayName: 'verticalSegment' },
        { id: 'segment', name: 'Trend Line', overlayName: 'segment' },
        { id: 'rayLine', name: 'Ray', overlayName: 'rayLine' },
      ]
    },
    {
      id: 'channels',
      name: 'Channels',
      icon: SplitSquareVertical,
      tools: [
        { id: 'priceChannelLine', name: 'Price Channel Line', overlayName: 'priceChannelLine' },
        { id: 'parallelStraightLine', name: 'Parallel Line', overlayName: 'parallelStraightLine' },
      ]
    },
    {
      id: 'shapes',
      name: 'Shapes',
      icon: Square,
      tools: [
        { id: 'circle', name: 'Circle', overlayName: 'circle' },
        { id: 'rect', name: 'Rect', overlayName: 'rect' },
        { id: 'parallelogram', name: 'Parallelogram', overlayName: 'parallelogram' },
        { id: 'triangle', name: 'Triangle', overlayName: 'triangle' },
      ]
    },
    {
      id: 'fibonacci',
      name: 'Fibonacci & Gann',
      icon: TrendingUpIcon,
      tools: [
        { id: 'fibonacciLine', name: 'Fibonacci Line', overlayName: 'fibonacciLine' },
      ]
    },
    {
      id: 'patterns',
      name: 'Patterns',
      icon: Activity,
      tools: [
        { id: 'xabcd', name: 'XABCD Pattern', overlayName: 'xabcd' },
        { id: 'abcd', name: 'ABCD Pattern', overlayName: 'abcd' },
        { id: 'threeWaves', name: 'Three Waves', overlayName: 'threeWaves' },
        { id: 'fiveWaves', name: 'Five Waves', overlayName: 'fiveWaves' },
        { id: 'eightWaves', name: 'Eight Waves', overlayName: 'eightWaves' },
        { id: 'anyWaves', name: 'Any Waves', overlayName: 'anyWaves' },
      ]
    },
  ];

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Fetch OHLCV data from API with proper date range
  const fetchOHLCVData = async (ticker: string, timeframe: string = 'D1'): Promise<KLineData[]> => {
    try {
      setIsLoading(true);
      
      // Calculate date range based on timeframe
      const toDate = new Date();
      let fromDate = new Date();
      
      // Set date range:
      // - D1: 5 years
      // - M1: 6 months
      // - Other intraday: proportional to M1
      if (timeframe === 'D1' || timeframe === 'W1' || timeframe === 'MN1') {
        fromDate.setFullYear(fromDate.getFullYear() - 5); // 5 years for daily
      } else if (timeframe === 'M1') {
        fromDate.setMonth(fromDate.getMonth() - 6); // 6 months for M1
      } else if (timeframe === 'M5') {
        fromDate.setMonth(fromDate.getMonth() - 3); // 3 months for M5
      } else if (timeframe === 'M15') {
        fromDate.setMonth(fromDate.getMonth() - 2); // 2 months for M15
      } else if (timeframe === 'M30') {
        fromDate.setMonth(fromDate.getMonth() - 1); // 1 month for M30
      } else if (timeframe === 'H1') {
        fromDate.setDate(fromDate.getDate() - 30); // 30 days for H1
      } else if (timeframe === 'H4') {
        fromDate.setDate(fromDate.getDate() - 60); // 60 days for H4
      } else {
        fromDate.setMonth(fromDate.getMonth() - 6); // Default 6 months
      }
      
      // Format dates to ISO string
      const fromDateStr = fromDate.toISOString().split('T')[0];
      // CRITICAL: Don't send toDate - let backend use current time to include today's data
      
      console.log(`Fetching ${timeframe} data for ${ticker} from ${fromDateStr} to NOW`);
      
      // CRITICAL: Don't cache M1/M5/M15 data - it changes frequently with realtime updates
      const shouldCache = !['M1', 'M5', 'M15'].includes(timeframe);
      
      const response = await fetch(
        `http://localhost:5146/api/Ohlcv/${ticker}?timeframe=${timeframe}&fromDate=${fromDateStr}&useCache=${shouldCache}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch OHLCV data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.isSuccess && result.data && result.data.data) {
        // Transform API data to KLineData format and divide prices by 1000
        // Backend stores timestamp in UTC, browser will display in local timezone
        const klineData: KLineData[] = result.data.data.map((item: any) => ({
          timestamp: item.time, // Use timestamp as-is from DB (UTC milliseconds)
          open: item.open / 1000,
          high: item.high / 1000,
          low: item.low / 1000,
          close: item.close / 1000,
          volume: item.volume || 0,
        }));
        
        // Sort by timestamp ascending
        klineData.sort((a, b) => a.timestamp - b.timestamp);
        
        // DEBUG: Log first and last candles with readable dates
        if (klineData.length > 0) {
          console.log(`[VNStockChart] Successfully loaded ${klineData.length} ${timeframe} bars for ${ticker}`);
          console.log('[VNStockChart] First candle:', new Date(klineData[0].timestamp).toISOString(), klineData[0]);
          console.log('[VNStockChart] Last candle:', new Date(klineData[klineData.length - 1].timestamp).toISOString(), klineData[klineData.length - 1]);
          console.log('[VNStockChart] Today is:', new Date().toISOString());
        }
        
        return klineData;
      } else {
        console.error('API returned unsuccessful response:', result.message || 'Unknown error');
        return [];
      }
    } catch (error) {
      console.error('Error fetching OHLCV data:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all symbols on mount
  useEffect(() => {
    const loadSymbols = async () => {
      try {
        const symbols = await fetchSymbols({ PageSize: 5000, PageIndex: 1 });
        setAllSymbols(symbols);
        console.log(`Loaded ${symbols.length} symbols`);
      } catch (error) {
        console.error('Error fetching symbols:', error);
      }
    };
    loadSymbols();
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Log supported overlays for debugging
    console.log('Supported overlays:', getSupportedOverlays());

    // Initialize chart
    const chart = init(chartContainerRef.current);
    chartRef.current = chart;

    if (!chart) return;

    // Store the container ref for cleanup
    const container = chartContainerRef.current;

    // Configure chart styles
    chart.setStyles({
      grid: {
        show: showGrid,
        horizontal: {
          show: showGrid,
          color: isDark ? '#2a2a3d' : '#e1e1e1',
        },
        vertical: {
          show: showGrid,
          color: isDark ? '#2a2a3d' : '#e1e1e1',
        },
      },
      candle: {
        type: chartType as CandleType,
        bar: {
          upColor: '#26a69a',
          downColor: '#ef5350',
          noChangeColor: '#888888',
        },
        tooltip: {
          showRule: 'always',
          showType: 'standard',
          text: {
            format: (data: any) => {
              if (!data) return [];
              return [
                { title: 'Time: ', value: data.timestamp },
                { title: 'O: ', value: data.open.toFixed(2) },
                { title: 'H: ', value: data.high.toFixed(2) },
                { title: 'L: ', value: data.low.toFixed(2) },
                { title: 'C: ', value: data.close.toFixed(2) },
                { title: 'V: ', value: data.volume ? (data.volume / 1000000).toFixed(2) + 'M' : '-' },
              ];
            },
          },
        },
        priceMark: {
          high: {
            show: true,
            color: '#26a69a',
            text: {
              show: true,
              color: '#ffffff',
            },
          },
          low: {
            show: true,
            color: '#ef5350',
            text: {
              show: true,
              color: '#ffffff',
            },
          },
          last: {
            show: true,
            upColor: '#26a69a',
            downColor: '#ef5350',
            noChangeColor: '#888888',
            text: {
              show: true,
              color: '#ffffff',
            },
          },
        },
      },

      indicator: {
        tooltip: {
          showRule: 'always',
          showType: 'standard',
        },
      },
      xAxis: {
        show: true,
        axisLine: {
          show: true,
          color: isDark ? '#2a2a3d' : '#cccccc',
        },
        tickLine: {
          show: true,
          color: isDark ? '#2a2a3d' : '#cccccc',
        },
        tickText: {
          show: true,
          color: isDark ? '#d1d4dc' : '#333333',
          family: 'Inter, sans-serif',
          size: 12,
        },
      },
      yAxis: {
        show: true,
        axisLine: {
          show: true,
          color: isDark ? '#2a2a3d' : '#cccccc',
        },
        tickLine: {
          show: true,
          color: isDark ? '#2a2a3d' : '#cccccc',
        },
        tickText: {
          show: true,
          color: isDark ? '#d1d4dc' : '#333333',
          family: 'Inter, sans-serif',
          size: 12,
        },
      },
      crosshair: {
        show: true,
        horizontal: {
          show: true,
          line: {
            color: isDark ? '#505050' : '#888888',
            style: 'dashed',
          },
          text: {
            show: true,
            color: '#ffffff',
            backgroundColor: isDark ? '#505050' : '#888888',
            size: 12,
            family: 'Inter, sans-serif',
          },
        },
        vertical: {
          show: true,
          line: {
            color: isDark ? '#505050' : '#888888',
            style: 'dashed',
          },
          text: {
            show: true,
            color: '#ffffff',
            backgroundColor: isDark ? '#505050' : '#888888',
            size: 12,
            family: 'Inter, sans-serif',
          },
        },
      },
    });

    // Set symbol and period first
    chart.setSymbol({
      ticker: symbol,
      name: symbol,
      pricePrecision: 2,
      volumePrecision: 0,
    });
    
    chart.setPeriod({ type: 'day', span: 1 });

    // Map time interval to API timeframe
    const getAPITimeframe = (interval: TimeInterval): string => {
      const timeframeMap: Record<TimeInterval, string> = {
        '1m': 'M1',
        '5m': 'M5',
        '15m': 'M15',
        '30m': 'M30',
        '1h': 'H1',
        '4h': 'H4',
        '1d': 'D1',
        '1w': 'W1',
        '1M': 'MN1',
      };
      return timeframeMap[interval];
    };

    // Set DataLoader immediately (before fetching data) to ensure subscribeBar is registered early
    chart.setDataLoader({
      getBars: async (params) => {
        console.log('[VNStockChart] DataLoader getBars called, fetching data...');
        try {
          const data = await fetchOHLCVData(symbol, getAPITimeframe(timeInterval));
          console.log('[VNStockChart] Data fetched:', data.length, 'candles');
          params.callback(data, false); // No more data to load
          
          // Set appropriate visible range after data is loaded
          setTimeout(() => {
            const visibleBarCount = getVisibleBarCount(timeInterval);
            chart.scrollToRealTime();
            const currentBarSpace = chart.getBarSpace();
            if (currentBarSpace && typeof currentBarSpace === 'number') {
              const containerWidth = chartContainerRef.current?.offsetWidth || 800;
              const targetBarSpace = containerWidth / visibleBarCount;
              const zoomRatio = targetBarSpace / currentBarSpace;
              chart.zoomAtCoordinate(zoomRatio, { x: containerWidth, y: 0 }, 0);
            }
          }, 100);
        } catch (error) {
          console.error('[VNStockChart] Failed to fetch OHLCV data:', error);
          params.callback([], false);
        }
      },
      subscribeBar: (params) => {
        // Store the callback for real-time updates
        console.log('[VNStockChart] ✅ DataLoader subscribeBar called for', params.symbol.ticker, params.period.type, params.period);
        
        // CRITICAL: Store the raw params.callback directly without wrapper
        // The callback updates the LAST candle only, not create new ones
        realtimeCallbackRef.current = params.callback;
        
        console.log('[VNStockChart] 📝 Stored callback reference, type:', typeof params.callback);
        
        // Apply any pending buffered updates
        if (pendingUpdatesRef.current.length > 0) {
          console.log('[VNStockChart] 📦 Applying', pendingUpdatesRef.current.length, 'buffered updates');
          pendingUpdatesRef.current.forEach(update => {
            try {
              params.callback(update);
            } catch (err) {
              console.error('[VNStockChart] Error applying buffered update:', err);
            }
          });
          pendingUpdatesRef.current = [];
        }
      },
      unsubscribeBar: (params) => {
        console.log('[VNStockChart] DataLoader unsubscribeBar called for', params.symbol.ticker, params.period.type);
        realtimeCallbackRef.current = null;
      },
    });

    // Add volume indicator in separate pane if enabled
    if (showVolume) {
      chart.createIndicator({ name: 'VOL' }, true);
    }

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver.disconnect();
      if (container) {
        dispose(container);
      }
      chartRef.current = null;
    };
  }, [chartType, isDark, showVolume, showGrid]);

  // Watch for symbol changes and reload data
  useEffect(() => {
    if (!chartRef.current) return;
    
    const chart = chartRef.current;
    console.log(`Symbol changed to: ${symbol}`);
    
    // Update chart symbol
    chart.setSymbol({
      ticker: symbol,
      name: symbol,
      pricePrecision: 2,
      volumePrecision: 0,
    });
    
    // Map time interval to API timeframe
    const getAPITimeframe = (interval: TimeInterval): string => {
      const timeframeMap: Record<TimeInterval, string> = {
        '1m': 'M1',
        '5m': 'M5',
        '15m': 'M15',
        '30m': 'M30',
        '1h': 'H1',
        '4h': 'H4',
        '1d': 'D1',
        '1w': 'W1',
        '1M': 'MN1',
      };
      return timeframeMap[interval];
    };
    
    // Fetch and reload data for new symbol
    fetchOHLCVData(symbol, getAPITimeframe(timeInterval)).then(data => {
      if (data.length > 0 && chartRef.current) {
        // CRITICAL: Re-register DataLoader with BOTH getBars AND subscribeBar
        // DO NOT use closure data - always fetch fresh
        chartRef.current.setDataLoader({
          getBars: async (params) => {
            console.log('[VNStockChart] getBars called for symbol change, fetching fresh data...');
            const freshData = await fetchOHLCVData(symbol, getAPITimeframe(timeInterval));
            params.callback(freshData, false);
          },
          subscribeBar: (params) => {
            // Re-register the real-time callback
            console.log('[VNStockChart] ✅ DataLoader subscribeBar re-registered for', params.symbol.ticker, params.period.type);
            realtimeCallbackRef.current = params.callback;
            
            // Apply any pending buffered updates
            if (pendingUpdatesRef.current.length > 0) {
              console.log('[VNStockChart] 📦 Applying', pendingUpdatesRef.current.length, 'buffered updates');
              pendingUpdatesRef.current.forEach(update => {
                try {
                  params.callback(update);
                } catch (err) {
                  console.error('[VNStockChart] Error applying buffered update:', err);
                }
              });
              pendingUpdatesRef.current = [];
            }
          },
          unsubscribeBar: (params) => {
            console.log('[VNStockChart] DataLoader unsubscribeBar called for', params.symbol.ticker, params.period.type);
            realtimeCallbackRef.current = null;
          },
        });
        
        // Scroll to recent data
        setTimeout(() => {
          if (chartRef.current) {
            chartRef.current.scrollToRealTime();
          }
        }, 100);
      }
    });
  }, [symbol, timeInterval]);

  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type);
    if (chartRef.current) {
      chartRef.current.setStyles({
        candle: {
          type: type as CandleType,
        },
      });
    }
  };

  const handleTimeIntervalChange = (interval: TimeInterval) => {
    setTimeInterval(interval);
    if (chartRef.current) {
      // Map intervals to API timeframe format
      const timeframeMap: Record<TimeInterval, string> = {
        '1m': 'M1',
        '5m': 'M5',
        '15m': 'M15',
        '30m': 'M30',
        '1h': 'H1',
        '4h': 'H4',
        '1d': 'D1',
        '1w': 'W1',
        '1M': 'MN1',
      };
      
      const apiTimeframe = timeframeMap[interval];
      console.log(`Changing interval to ${interval} (${apiTimeframe}) for ${symbol}`);
      
      // Fetch new data based on interval
      fetchOHLCVData(symbol, apiTimeframe).then(data => {
        if (data.length > 0 && chartRef.current) {
          // CRITICAL: Re-register DataLoader with BOTH getBars AND subscribeBar
          // DO NOT use closure data - always fetch fresh
          chartRef.current.setDataLoader({
            getBars: async (params) => {
              console.log('[VNStockChart] getBars called for interval change, fetching fresh data...');
              const freshData = await fetchOHLCVData(symbol, apiTimeframe);
              params.callback(freshData, false);
            },
            subscribeBar: (params) => {
              // Re-register the real-time callback
              console.log('[VNStockChart] ✅ DataLoader subscribeBar re-registered for', params.symbol.ticker, params.period.type);
              realtimeCallbackRef.current = params.callback;
              
              // Apply any pending buffered updates
              if (pendingUpdatesRef.current.length > 0) {
                console.log('[VNStockChart] 📦 Applying', pendingUpdatesRef.current.length, 'buffered updates');
                pendingUpdatesRef.current.forEach(update => {
                  try {
                    params.callback(update);
                  } catch (err) {
                    console.error('[VNStockChart] Error applying buffered update:', err);
                  }
                });
                pendingUpdatesRef.current = [];
              }
            },
            unsubscribeBar: (params) => {
              console.log('[VNStockChart] DataLoader unsubscribeBar called for', params.symbol.ticker, params.period.type);
              realtimeCallbackRef.current = null;
            },
          });
          
          // Update period based on interval
          if (interval.includes('m')) {
            chartRef.current.setPeriod({ type: 'minute', span: parseInt(interval) });
          } else if (interval === '1h') {
            chartRef.current.setPeriod({ type: 'hour', span: 1 });
          } else if (interval === '4h') {
            chartRef.current.setPeriod({ type: 'hour', span: 4 });
          } else if (interval === '1d') {
            chartRef.current.setPeriod({ type: 'day', span: 1 });
          } else if (interval === '1w') {
            chartRef.current.setPeriod({ type: 'week', span: 1 });
          } else if (interval === '1M') {
            chartRef.current.setPeriod({ type: 'month', span: 1 });
          }
          
          console.log(`Successfully updated chart with ${data.length} bars`);
          
          // Adjust visible range after data is loaded
          setTimeout(() => {
            if (chartRef.current) {
              const visibleBarCount = getVisibleBarCount(interval);
              chartRef.current.scrollToRealTime();
              
              const currentBarSpace = chartRef.current.getBarSpace();
              if (currentBarSpace && typeof currentBarSpace === 'number' && chartContainerRef.current) {
                const containerWidth = chartContainerRef.current.offsetWidth;
                const targetBarSpace = containerWidth / visibleBarCount;
                const zoomRatio = targetBarSpace / currentBarSpace;
                chartRef.current.zoomAtCoordinate(zoomRatio, { x: containerWidth, y: 0 }, 0);
              }
            }
          }, 100);
        } else {
          console.warn(`No data received for ${symbol} at ${apiTimeframe}`);
        }
      });
    }
  };

  const toggleIndicator = (indicatorName: string) => {
    if (!chartRef.current) return;

    const newActiveIndicators = new Set(activeIndicators);
    
    if (newActiveIndicators.has(indicatorName)) {
      // Remove indicator
      newActiveIndicators.delete(indicatorName);
      chartRef.current.removeIndicator({ name: indicatorName });
    } else {
      // Add indicator
      newActiveIndicators.add(indicatorName);
      
      // Indicators that draw on main chart (overlay)
      const overlayIndicators = ['MA', 'EMA', 'BOLL'];
      
      if (overlayIndicators.includes(indicatorName)) {
        // Draw on main chart - each indicator can coexist
        chartRef.current.createIndicator({ name: indicatorName }, false, { id: 'candle_pane' });
      } else {
        // Draw in separate pane below
        chartRef.current.createIndicator({ name: indicatorName }, true);
      }
    }
    
    setActiveIndicators(newActiveIndicators);
  };

  const handleZoomIn = () => {
    chartRef.current?.zoomAtCoordinate(1.2, { x: 0, y: 0 }, 0);
  };

  const handleZoomOut = () => {
    chartRef.current?.zoomAtCoordinate(0.8, { x: 0, y: 0 }, 0);
  };

  const handleReset = () => {
    chartRef.current?.scrollToRealTime();
  };

  const handleDownload = () => {
    const canvas = chartRef.current?.getConvertPictureUrl();
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${symbol}_chart_${new Date().getTime()}.png`;
      link.href = canvas;
      link.click();
    }
  };

  const handleDrawingToolSelect = (toolId: string, overlayName: string | null) => {
    if (!chartRef.current) return;
    
    setDrawingMode(toolId);
    setExpandedGroup(null); // Close dropdown after selection
    
    // Handle cursor mode (no overlay)
    if (!overlayName) {
      return;
    }
    
    console.log('Creating overlay:', overlayName);
    
    // Create new overlay when tool is selected
    try {
      if (overlayName === 'fibonacciLine') {
        chartRef.current.createOverlay({
          name: overlayName,
          extendData: {
            extendLeft: false,
            extendRight: false,
          },
        });
      } else {
        chartRef.current.createOverlay({ name: overlayName });
      }
    } catch (error) {
      console.error('Error creating overlay:', overlayName, error);
    }
  };

  const toggleGroup = (groupId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
      setDropdownPosition(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.right + 8
      });
      setExpandedGroup(groupId);
    }
  };

  const handleClearDrawings = () => {
    if (!chartRef.current) return;
    chartRef.current.removeOverlay();
    setDrawingMode(null);
  };

  return (
    <div className={`dashboard-module w-full h-full rounded-lg flex border ${
      isDark ? 'bg-[#1e1e2d] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      {/* Drawing Toolbar Sidebar */}
      <div className={`flex flex-col gap-1 p-2 border-r overflow-y-auto ${
        isDark ? 'border-gray-800 bg-[#252531]' : 'border-gray-200 bg-gray-50'
      }`} style={{ maxHeight: '100%', minWidth: '48px', position: 'relative' }}>
        {drawingToolGroups.map(group => {
          const IconComponent = group.icon;
          const isExpanded = expandedGroup === group.id;
          const isAnyToolActive = group.tools.some(tool => drawingMode === tool.id);
          
          return (
            <div key={group.id} className="relative">
              {/* Group Button */}
              <button
                ref={(el) => {
                  if (el) buttonRefs.current.set(group.id, el);
                }}
                onClick={(e) => toggleGroup(group.id, e)}
                className={`p-2 rounded transition-colors group w-full shrink-0 ${
                  isAnyToolActive || isExpanded
                    ? 'bg-blue-500 text-white'
                    : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
                title={group.name}
              >
                <IconComponent className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        
        <div className={`w-full h-px my-1 shrink-0 ${
          isDark ? 'bg-gray-700' : 'bg-gray-300'
        }`}></div>
        
        <button
          onClick={handleClearDrawings}
          className={`p-2 rounded transition-colors group relative shrink-0 ${
            isDark
              ? 'text-red-400 hover:text-white hover:bg-red-600'
              : 'text-red-600 hover:text-white hover:bg-red-500'
          }`}
          title="Xóa tất cả vẽ"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 flex flex-col overflow-visible">
      {/* Header with Symbol Info */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          {/* Symbol Search Button */}
          <div className="relative">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setShowSymbolModal(true)}>
              <h3 className="text-lg font-bold">{symbol}</h3>
              <Search className={`w-4 h-4 transition-colors ${
                isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
              }`} />
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-500 font-semibold">95.6</span>
            <span className="flex items-center gap-1 text-green-500">
              <TrendingUp className="w-4 h-4" />
              +2.34%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className={`p-1.5 rounded hover:bg-opacity-10 hover:bg-blue-500 transition-colors ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Tải xuống"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className={`p-1.5 rounded hover:bg-opacity-10 hover:bg-blue-500 transition-colors ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Đặt lại"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Toolbar */}
      <div className={`flex items-center gap-4 px-4 py-2 border-b overflow-visible ${
        isDark ? 'border-gray-800 bg-[#252531]' : 'border-gray-200 bg-gray-50'
      }`}>
        {/* Chart Type */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleChartTypeChange('candle_solid')}
            className={`p-1.5 rounded transition-colors ${
              chartType === 'candle_solid'
                ? 'bg-blue-500 text-white'
                : isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
            title="Nến Nhật"
          >
            <CandlestickChart className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleChartTypeChange('ohlc')}
            className={`p-1.5 rounded transition-colors ${
              chartType === 'ohlc'
                ? 'bg-blue-500 text-white'
                : isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
            title="OHLC"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleChartTypeChange('area')}
            className={`p-1.5 rounded transition-colors ${
              chartType === 'area'
                ? 'bg-blue-500 text-white'
                : isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
            title="Vùng"
          >
            <LineChartIcon className="w-4 h-4" />
          </button>
        </div>

        <div className={`w-px h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

        {/* Time Intervals */}
        <div className="flex items-center gap-1">
          {(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'] as TimeInterval[]).map(interval => (
            <button
              key={interval}
              onClick={() => handleTimeIntervalChange(interval)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeInterval === interval
                  ? 'bg-blue-500 text-white'
                  : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {interval}
            </button>
          ))}
        </div>

        <div className={`w-px h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

        {/* Indicators */}
        <div className="flex items-center gap-1">
          {indicators.map(indicator => (
            <button
              key={indicator.name}
              onClick={() => toggleIndicator(indicator.name)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeIndicators.has(indicator.name)
                  ? 'bg-blue-500 text-white'
                  : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {indicator.name}
            </button>
          ))}
        </div>

        <div className={`w-px h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className={`p-1.5 rounded transition-colors ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
            title="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className={`p-1.5 rounded transition-colors ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
            title="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* SignalR Connection Status */}
          <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${
            isConnected
              ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
              : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
            <span className="font-medium">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          
          {drawingMode && (
            <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
              isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
            }`}>
              <Activity className="w-3 h-3" />
              <span className="font-medium">
                {drawingToolGroups.flatMap(g => g.tools).find(t => t.id === drawingMode)?.name}
              </span>
            </div>
          )}
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded"
            />
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Lưới</span>
          </label>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="flex-1 relative min-h-[400px]">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Đang tải dữ liệu {symbol}...
              </span>
            </div>
          </div>
        )}
        {/* Chart will be rendered here */}
      </div>

      {/* Footer Info */}
      <div className={`flex items-center justify-between px-4 py-2 border-t text-xs ${
        isDark ? 'border-gray-800 bg-[#252531] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'
      }`}>
        <div className="flex items-center gap-4">
          <span>O: 95.2</span>
          <span>H: 96.5</span>
          <span>L: 94.8</span>
          <span>C: 95.6</span>
          <span className="ml-2">V: 2.45M</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3" />
          <span>Cập nhật: 14:45:32</span>
        </div>
      </div>
      </div>

      {/* Portal Dropdown for Drawing Tools */}
      {expandedGroup && dropdownPosition && typeof window !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => {
              setExpandedGroup(null);
              setDropdownPosition(null);
            }}
          />
          <div 
            className={`fixed rounded-lg shadow-2xl border min-w-[180px] z-[9999] ${
              isDark ? 'bg-[#2a2a3d] border-gray-700' : 'bg-white border-gray-200'
            }`}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            {drawingToolGroups.find(g => g.id === expandedGroup)?.tools.map((tool, index, arr) => (
              <button
                key={tool.id}
                onClick={() => handleDrawingToolSelect(tool.id, tool.overlayName)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  index === 0 ? 'rounded-t-lg' : ''
                } ${
                  index === arr.length - 1 ? 'rounded-b-lg' : ''
                } ${
                  drawingMode === tool.id
                    ? 'bg-blue-500 text-white'
                    : isDark
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tool.name}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}

      {/* Symbol Search Modal */}
      {showSymbolModal && typeof window !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center"
            onClick={() => {
              setShowSymbolModal(false);
              setSymbolSearch('');
            }}
          >
            <div 
              className={`w-[600px] rounded-lg shadow-2xl border ${
                isDark ? 'bg-[#1e1e2e] border-gray-700' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h2 className="text-lg font-semibold">Tìm kiếm Mã giao dịch</h2>
                <button
                  onClick={() => {
                    setShowSymbolModal(false);
                    setSymbolSearch('');
                  }}
                  className={`p-1 rounded hover:bg-opacity-10 transition-colors ${
                    isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Input */}
              <div className="p-4">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    ref={symbolInputRef}
                    type="text"
                    value={symbolSearch}
                    onChange={(e) => setSymbolSearch(e.target.value.toUpperCase())}
                    placeholder="Nhập mã chứng khoán..."
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border outline-none ${
                      isDark 
                        ? 'bg-[#2a2a3d] border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                    }`}
                    autoFocus
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className={`flex border-b ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={() => setSearchTab('ticker')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    searchTab === 'ticker'
                      ? isDark
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-blue-600 border-b-2 border-blue-600'
                      : isDark
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  MÃ
                </button>
                <button
                  onClick={() => setSearchTab('description')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    searchTab === 'description'
                      ? isDark
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-blue-600 border-b-2 border-blue-600'
                      : isDark
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  MÔ TẢ
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto">
                {(() => {
                  console.log('[SymbolModal] All symbols count:', allSymbols.length);
                  console.log('[SymbolModal] Search query:', symbolSearch);
                  console.log('[SymbolModal] Active tab:', searchTab);
                  
                  let filteredSymbols = allSymbols;
                  
                  // Only filter if there's a search query
                  if (symbolSearch.trim()) {
                    const searchLower = symbolSearch.toLowerCase();
                    filteredSymbols = allSymbols.filter(sym => {
                      if (searchTab === 'ticker') {
                        return sym.ticker.toLowerCase().includes(searchLower);
                      } else {
                        return sym.viCompanyName.toLowerCase().includes(searchLower) || 
                               sym.enCompanyName.toLowerCase().includes(searchLower);
                      }
                    });
                  }
                  
                  // Limit to 100 results
                  filteredSymbols = filteredSymbols.slice(0, 100);
                  
                  console.log('[SymbolModal] Filtered count:', filteredSymbols.length);

                  if (filteredSymbols.length === 0) {
                    return (
                      <div className={`px-4 py-8 text-center text-sm ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        Không tìm thấy mã chứng khoán
                      </div>
                    );
                  }

                  return filteredSymbols.map((sym, index) => (
                    <button
                      key={sym.ticker}
                      onClick={() => {
                        setSymbol(sym.ticker);
                        setSymbolSearch('');
                        setShowSymbolModal(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                        sym.ticker === symbol
                          ? isDark
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'bg-blue-50 text-blue-700'
                          : isDark
                          ? 'hover:bg-gray-800'
                          : 'hover:bg-gray-50'
                      } ${
                        index === 0 ? '' : isDark ? 'border-t border-gray-800' : 'border-t border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${
                          sym.ticker === symbol
                            ? 'text-blue-500'
                            : isDark ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {sym.ticker}
                        </span>
                        <span className={`${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {searchTab === 'ticker' ? sym.viCompanyName : `CTCP ${sym.viCompanyName}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {sym.type === 1 ? 'CỔ PHIẾU' : sym.type === 2 ? 'ETF' : sym.type === 3 ? 'TRÁI PHIẾU' : 'PHÁI SINH'}
                        </span>
                        <span className={`font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {sym.exchangeCode}
                        </span>
                      </div>
                    </button>
                  ));
                })()}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
