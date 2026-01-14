"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { init, dispose, CandleType, getSupportedOverlays } from 'klinecharts';
import type { Chart, KLineData, IndicatorCreate } from 'klinecharts';
import { TrendingUp, TrendingDown, Maximize2, Settings, Download, ZoomIn, ZoomOut, BarChart3, LineChart as LineChartIcon, CandlestickChart, Clock, Calendar, Activity, Minus, TrendingUpIcon, Circle, Square, Type, ArrowRight, Edit3, Triangle, Trash2, Move, SplitSquareVertical, Pencil, MousePointer2, Crosshair } from 'lucide-react';
import SymbolSearchBox from '../SymbolSearchBox';

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
  
  const [chartType, setChartType] = useState<ChartType>('candle_solid');
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('1d');
  const [symbol, setSymbol] = useState('FPT');
  const [isLoading, setIsLoading] = useState(false);

  // Handle symbol selection
  const handleSymbolSelect = (ticker: string) => {
    console.log('Selected symbol:', ticker);
    setSymbol(ticker);
    // Re-fetch data with new symbol
    if (chartRef.current) {
      const apiTimeframe = getAPITimeframe(timeInterval);
      fetchOHLCVData(ticker, apiTimeframe).then(data => {
        if (data && data.length > 0) {
          chartRef.current?.applyNewData(data);
          chartRef.current?.setSymbol({
            ticker: ticker,
            name: ticker,
          });
        }
      });
    }
  };
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
      const toDateStr = toDate.toISOString().split('T')[0];
      
      console.log(`Fetching ${timeframe} data for ${ticker} from ${fromDateStr} to ${toDateStr}`);
      
      const response = await fetch(
        `http://localhost:5146/api/Ohlcv/${ticker}?timeframe=${timeframe}&fromDate=${fromDateStr}&toDate=${toDateStr}&useCache=true`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch OHLCV data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.isSuccess && result.data && result.data.data) {
        // Transform API data to KLineData format and divide prices by 1000
        const klineData: KLineData[] = result.data.data.map((item: any) => ({
          timestamp: item.time,
          open: item.open / 1000,
          high: item.high / 1000,
          low: item.low / 1000,
          close: item.close / 1000,
          volume: item.volume || 0,
        }));
        
        // Sort by timestamp ascending
        klineData.sort((a, b) => a.timestamp - b.timestamp);
        
        console.log(`Successfully loaded ${klineData.length} ${timeframe} bars for ${ticker}`);
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

    // Fetch and set data using DataLoader pattern
    fetchOHLCVData(symbol, getAPITimeframe(timeInterval)).then(data => {
      if (data.length > 0) {
        chart.setDataLoader({
          getBars: (params) => {
            // Return data immediately with no more data to load
            params.callback(data, false);
          },
        });
        
        // Set appropriate visible range based on timeframe
        setTimeout(() => {
          const visibleBarCount = getVisibleBarCount(timeInterval);
          // Scroll to show recent data with appropriate amount of history
          chart.scrollToRealTime();
          // Adjust zoom to show desired number of bars
          const currentBarSpace = chart.getBarSpace();
          if (currentBarSpace && typeof currentBarSpace === 'number') {
            const containerWidth = chartContainerRef.current?.offsetWidth || 800;
            const targetBarSpace = containerWidth / visibleBarCount;
            const zoomRatio = targetBarSpace / currentBarSpace;
            chart.zoomAtCoordinate(zoomRatio, { x: containerWidth, y: 0 }, 0);
          }
        }, 100);
      }
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
          chartRef.current.setDataLoader({
            getBars: (params) => {
              params.callback(data, false);
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
          <div className="w-64">
            <SymbolSearchBox 
              isConnected={true}
              onSymbolSelect={handleSymbolSelect}
            />
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

      {/* Portal Dropdown */}
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
    </div>
  );
}
