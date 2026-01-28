"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSignalR } from '@/contexts/SignalRContext';
import { HeatmapFilters, HeatmapItem } from '@/types/heatmap';
import { MarketSymbolDto } from '@/types/market';
import { fetchSymbols } from '@/services/symbolService';
import { heatmapService } from '@/services/heatmapService';
import { ExchangeCode, SymbolData } from '@/types/symbol';
import * as echarts from 'echarts';

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
  const [activeTab, setActiveTab] = useState('volatility');
  const [exchange, setExchange] = useState('HSX');
  const [sector, setSector] = useState<string | undefined>(undefined);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);
  
  // Get SignalR connection and market data (like stock screener)
  const { isConnected, subscribeToSymbols, unsubscribeFromSymbols, marketData } = useSignalR();
  
  // Store heatmap items computed from market data
  const [heatmapItems, setHeatmapItems] = useState<HeatmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Store symbol metadata (sector info)
  const symbolMetadataRef = useRef<Map<string, SymbolData>>(new Map());
  
  // Ref to track subscribed symbols
  const subscribedSymbolsRef = useRef<string[]>([]);
  
  const pieChartRef = useRef<HTMLDivElement>(null);
  const heatmapChartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const tabs = [
    { id: 'volatility', label: 'Biến động' },
    { id: 'foreign', label: 'Nước ngoài' },
    { id: 'proprietary', label: 'Tự doanh' },
    { id: 'liquidity', label: 'Thanh khoản' },
    { id: 'index-impact', label: 'Tác động tới index' },
  ];

  const exchanges = ['Tất cả', 'HSX', 'HNX', 'UPCOM'];

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
        
        console.log(`[Heatmap] 🔄 Fetching heatmap data for ${exchange}...`);
        
        // Fetch heatmap data from REST API (includes prices, sectors, etc.)
        const heatmapData = await heatmapService.getHeatmapData({
          exchange: exchange === 'Tất cả' ? undefined : exchange,
        });
        
        console.log(`[Heatmap] ✅ Loaded ${heatmapData.items.length} items from REST API`);
        if (heatmapData.items.length > 0) {
          console.log('[Heatmap] 📊 Sample item:', heatmapData.items[0]);
        }
        
        // Convert REST API data to HeatmapItem format
        const items: HeatmapItem[] = heatmapData.items.map(item => ({
          ticker: item.ticker,
          companyName: item.companyName,
          sector: item.sector || '',
          sectorName: item.sectorName || 'Khác',
          currentPrice: item.currentPrice,
          changePercent: item.changePercent,
          changeValue: item.changeValue,
          volume: item.volume,
          exchange: item.exchange,
          colorType: item.colorType as any,
          lastUpdate: item.lastUpdate,
        }));
        
        setHeatmapItems(items);
        
        // Subscribe to SignalR for real-time updates
        const tickers = items.map(item => item.ticker);
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
    console.log(`[Heatmap] 🔄 Exchange changed to: ${exchange}`);
    
    if (!isConnected) {
      console.log('[Heatmap] ⚠️ Not connected, skipping exchange change');
      return;
    }

    const reloadSymbols = async () => {
      try {
        setIsLoading(true);
        
        console.log(`[Heatmap] 🔄 Reloading symbols for exchange: ${exchange}`);
        
        // Unsubscribe from old symbols
        if (subscribedSymbolsRef.current.length > 0) {
          console.log(`[Heatmap] 🔕 Unsubscribing from ${subscribedSymbolsRef.current.length} old symbols`);
          await unsubscribeFromSymbols(subscribedSymbolsRef.current);
          subscribedSymbolsRef.current = [];
        }
        
        // Fetch new symbols
        const symbols = await fetchSymbols({
          Exchange: exchange === 'Tất cả' ? undefined : (exchange as ExchangeCode),
          PageIndex: 1,
          PageSize: 5000,
        });
        
        console.log(`[Heatmap] ✅ Loaded ${symbols.length} symbols for ${exchange}`);
        
        // Store symbol metadata
        symbolMetadataRef.current.clear();
        symbols.forEach(symbol => {
          symbolMetadataRef.current.set(symbol.ticker, symbol);
        });
        
        const tickers = symbols.map(s => s.ticker);
        
        // Subscribe to new symbols
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
  }, [exchange, isConnected]); // Only depend on exchange and isConnected

  // Convert market data to heatmap items
  useEffect(() => {
    console.log(`[Heatmap] 🔄 marketData changed, size: ${marketData.size}`);
    
    if (marketData.size === 0) {
      console.log('[Heatmap] ⚠️ No market data yet - waiting for SignalR data...');
      console.log('[Heatmap] 📊 Current state:', {
        isConnected,
        subscribedCount: subscribedSymbolsRef.current.length,
        hasLoadedSymbols: hasLoadedSymbols.current,
        metadataCount: symbolMetadataRef.current.size
      });
      return;
    }
    
    const sampleTickers = Array.from(marketData.keys()).slice(0, 5);
    console.log('[Heatmap] ✅ Processing market data...', {
      sampleTickers,
      metadataAvailable: symbolMetadataRef.current.size
    });
    
    const items: HeatmapItem[] = Array.from(marketData.values()).map((data: MarketSymbolDto) => {
      const metadata = symbolMetadataRef.current.get(data.ticker);
      const sectorId = metadata?.sectorId || '';
      const sectorName = 'Khác'; // Fallback, should not be used since we have REST API data
      
      // Log first few to see actual sector IDs
      if (symbolMetadataRef.current.size > 0 && Math.random() < 0.01) {
        console.log('[Heatmap] 🔍 Sample sector mapping:', {
          ticker: data.ticker,
          sectorId,
          sectorName,
          metadata: metadata
        });
      }
      
      // Check if ratioChange is already percentage or decimal
      // If ratioChange is < -1 or > 1, it's likely already percentage (e.g., -3.04, +2.5)
      // If ratioChange is between -1 and 1, it's decimal (e.g., -0.0304, +0.025)
      const isAlreadyPercentage = Math.abs(data.ratioChange) > 1;
      const changePercent = isAlreadyPercentage ? data.ratioChange : data.ratioChange * 100;
      
      return {
        ticker: data.ticker,
        companyName: metadata?.viCompanyName || '',
        sector: sectorId,
        sectorName: sectorName,
        currentPrice: data.lastPrice || data.referencePrice || 0,
        changePercent: changePercent,
        changeValue: data.change,
        volume: data.totalVol || 0,
        exchange: metadata?.exchangeCode || '',
        colorType: 'neutral' as const,
        lastUpdate: new Date().toISOString(),
      };
    });
    
    setHeatmapItems(items);
    console.log(`[Heatmap] ✅ Created ${items.length} heatmap items`);
    if (items.length > 0) {
      console.log('[Heatmap] 📊 Sample heatmap item:', {
        ticker: items[0].ticker,
        changePercent: items[0].changePercent,
        rawRatioChange: Array.from(marketData.values())[0]?.ratioChange
      });
    }
  }, [marketData, isConnected]);

  // Update heatmap items with real-time data from SignalR
  useEffect(() => {
    console.log(`[Heatmap] 🔄 marketData changed, size: ${marketData.size}`);
    
    // If no initial items loaded yet, skip (wait for REST API first)
    if (heatmapItems.length === 0) {
      console.log('[Heatmap] ⏸️ Waiting for initial REST API data...');
      return;
    }
    
    if (marketData.size === 0) {
      console.log('[Heatmap] ⚠️ No SignalR data yet');
      return;
    }
    
    console.log('[Heatmap] 🔄 Merging SignalR updates with existing data...');
    
    // Update existing items with real-time data
    const updatedItems = heatmapItems.map(item => {
      const realtimeData = marketData.get(item.ticker);
      
      if (realtimeData) {
        // Update price and change data from SignalR
        const isAlreadyPercentage = Math.abs(realtimeData.ratioChange) > 1;
        const changePercent = isAlreadyPercentage ? realtimeData.ratioChange : realtimeData.ratioChange * 100;
        
        return {
          ...item,
          currentPrice: realtimeData.lastPrice || realtimeData.referencePrice || item.currentPrice,
          changePercent: changePercent,
          changeValue: realtimeData.change,
          volume: realtimeData.totalVol || item.volume,
          lastUpdate: new Date().toISOString(),
        };
      }
      
      return item;
    });
    
    setHeatmapItems(updatedItems);
    console.log(`[Heatmap] ✅ Updated ${updatedItems.length} items with real-time data`);
  }, [marketData]); // Only depend on marketData changes

  // Calculate market stats from real-time data
  const marketStats: MarketStats = useMemo(() => {
    if (heatmapItems.length === 0) {
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

    const upItems = heatmapItems.filter(item => item.changePercent > 0);
    const noChangeItems = heatmapItems.filter(item => item.changePercent === 0);
    const downItems = heatmapItems.filter(item => item.changePercent < 0);

    const upValue = upItems.reduce((sum, item) => sum + (item.volume * item.currentPrice), 0) / 1e9; // Convert to billions
    const noChangeValue = noChangeItems.reduce((sum, item) => sum + (item.volume * item.currentPrice), 0) / 1e9;
    const downValue = downItems.reduce((sum, item) => sum + (item.volume * item.currentPrice), 0) / 1e9;

    const totalVolume = heatmapItems.reduce((sum, item) => sum + item.volume, 0) / 1e9;
    const totalValue = upValue + noChangeValue + downValue;

    // TODO: Get actual index value from backend
    return {
      index: exchange === 'HSX' ? 'VNINDEX' : exchange === 'HNX' ? 'HNX-INDEX' : 'UPCOM-INDEX',
      indexValue: 1722.26, // Placeholder - should come from backend
      indexChange: -0.23,  // Placeholder - should come from backend
      up: { count: upItems.length, value: upValue },
      noChange: { count: noChangeItems.length, value: noChangeValue },
      down: { count: downItems.length, value: downValue },
      volume: totalVolume,
      totalValue: totalValue,
      foreignNetValue: -1288.2, // Placeholder - should come from backend
    };
  }, [heatmapItems, exchange]);

  // Extract available sectors for dropdown
  useEffect(() => {
    if (heatmapItems.length > 0) {
      const sectors = Array.from(new Set(heatmapItems.map(item => item.sectorName).filter(Boolean)));
      setAvailableSectors(['Tất cả', ...sectors.sort()]);
    }
  }, [heatmapItems]);

  // Transform real-time data to heatmap format
  const heatmapData = useMemo(() => {
    console.log(`[Heatmap] 🔄 Computing heatmapData from ${heatmapItems.length} items`);
    if (heatmapItems.length === 0) {
      console.log('[Heatmap] ⚠️ No heatmapItems, returning empty array');
      return [];
    }

    // Debug: Log first item to see sector format
    if (heatmapItems.length > 0) {
      console.log('[Heatmap] 📋 Sample sector data:', {
        sector: heatmapItems[0].sector,
        sectorName: heatmapItems[0].sectorName,
        ticker: heatmapItems[0].ticker
      });
    }

    // Filter by selected sector
    const filteredItems = sector && sector !== 'Tất cả' 
      ? heatmapItems.filter(item => item.sectorName === sector)
      : heatmapItems;

    return filteredItems
      .map(item => {
        const sectorId = item.sector || 'Khác';
        // Use sectorName from API first, fallback to mapping if not available
        const sectorName = item.sectorName || 'Khác';
        
        return {
          name: item.ticker,
          value: item.volume * item.currentPrice / 1e6, // Convert to millions for better visualization
          change: item.changePercent,
          sector: sectorId,
          sectorName: sectorName,
        };
      })
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [heatmapItems, sector]);

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
    
    // Force resize after init to ensure proper sizing
    setTimeout(() => {
      chart.resize();
      console.log('[Heatmap] 📐 Initial resize triggered');
    }, 100);
    
    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      console.log('[Heatmap] 🧹 Disposing chart');
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
    
    // Group data by sector
    const sectorsMap = new Map<string, typeof heatmapData>();
    heatmapData.forEach(stock => {
      const sectorName = stock.sectorName;
      if (!sectorsMap.has(sectorName)) {
        sectorsMap.set(sectorName, []);
      }
      sectorsMap.get(sectorName)!.push(stock);
    });

    const treeData = Array.from(sectorsMap.entries()).map(([sectorName, sectorStocks]) => {
      // Sort stocks by value descending
      const sortedStocks = [...sectorStocks].sort((a, b) => b.value - a.value);
      
      // Calculate total value for sector (for proper sizing)
      const sectorTotalValue = sortedStocks.reduce((sum, stock) => sum + stock.value, 0);
      
      return {
        name: sectorName,
        value: sectorTotalValue,
        children: sortedStocks.map(stock => {
          // Determine color based on change percent
          let color: string;
          if (stock.change >= 6.5) {
            color = '#9333ea'; // Purple - Ceiling (Trần)
          } else if (stock.change >= 3) {
            color = '#16a34a'; // Dark Green
          } else if (stock.change >= 1) {
            color = '#22c55e'; // Green
          } else if (stock.change > 0) {
            color = '#4ade80'; // Light Green
          } else if (stock.change === 0) {
            color = '#f59e0b'; // Yellow (Reference)
          } else if (stock.change > -1) {
            color = '#f87171'; // Light Red
          } else if (stock.change > -3) {
            color = '#ef4444'; // Red
          } else if (stock.change > -6.5) {
            color = '#dc2626'; // Dark Red
          } else {
            color = '#06b6d4'; // Cyan - Floor (Sàn)
          }
          
          return {
            name: stock.name,
            value: stock.value,
            change: stock.change,
            itemStyle: {
              color: color,
            },
          };
        })
      };
    });

    console.log('[Heatmap] 📊 TreeData created:', {
      sectorsCount: treeData.length,
      sampleSector: treeData[0]?.name,
      sampleStock: treeData[0]?.children[0]
    });

    const option = {
      tooltip: {
        formatter: (params: any) => {
          if (params.treePathInfo && params.treePathInfo.length > 1) {
            // This is a stock (leaf node)
            const stock = params.data;
            return `<strong>${stock.name}</strong><br/>
                    Thay đổi: <span style="color: ${stock.change >= 0 ? '#22c55e' : '#ef4444'}">
                    ${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%</span><br/>
                    Giá trị: ${stock.value.toFixed(2)}M`;
          }
          // This is a sector (parent node)
          const stockCount = params.data.children?.length || 0;
          return `<strong>${params.name}</strong><br/>
                  ${stockCount} mã cổ phiếu<br/>
                  Click để xem chi tiết`;
        },
      },
      series: [
        {
          type: 'treemap',
          width: '100%',
          height: '100%',
          roam: true, // Enable both zoom and pan
          scaleLimit: {
            min: 0.5,  // Can zoom out to 50%
            max: 5,    // Can zoom in to 500%
          },
          nodeClick: 'zoomToNode', // Click on sector to drill down
          zoomToNodeRatio: 0.32 * 0.32, // Zoom ratio when clicking
          breadcrumb: {
            show: true,
            height: 32,
            bottom: 0,
            left: 'center',
            itemStyle: {
              color: isDark ? '#374151' : '#e5e7eb',
              borderColor: isDark ? '#4b5563' : '#d1d5db',
              borderWidth: 1,
              shadowColor: 'rgba(0,0,0,0.3)',
              shadowBlur: 3,
              textStyle: {
                color: isDark ? '#fff' : '#000',
                fontSize: 14,
              },
            },
            emphasis: {
              itemStyle: {
                color: '#3b82f6',
                shadowBlur: 5,
                textStyle: {
                  color: '#fff',
                },
              },
            },
          },
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#fff',
            position: 'inside',
            align: 'center',
            formatter: (params: any) => {
              // For leaf nodes (stocks), show ticker + change percent
              if (params.data.change !== undefined) {
                const changeText = `${params.data.change > 0 ? '+' : ''}${params.data.change.toFixed(2)}%`;
                return `${params.name}\n${changeText}`;
              }
              // For parent nodes (sectors), just show name
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
            borderWidth: 2,
            gapWidth: 2,
            // Don't set default color - let children define their own colors
          },
          levels: [
            {
              // Level 0: Root (not visible)
              itemStyle: {
                borderWidth: 0,
              },
            },
            {
              // Level 1: Sectors (parent nodes)
              itemStyle: {
                borderColor: isDark ? '#000' : '#1a1a1a',
                borderWidth: 6,
                gapWidth: 6,
              },
              upperLabel: {
                show: true,
                height: 35,
                fontSize: 16,
                fontWeight: 'bold',
                color: '#fff',
              },
              label: {
                show: false, // Hide label for sector level (use upperLabel instead)
              },
            },
            {
              // Level 2: Stocks within sector (leaf nodes)
              itemStyle: {
                borderColor: isDark ? '#000' : '#1a1a1a',
                borderWidth: 2,
                gapWidth: 2,
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
                    // Always show ticker and change, let ECharts handle overflow
                    return `${params.name}\n${changeStr}`;
                  }
                  return params.name;
                },
              },
              upperLabel: {
                show: false, // No upper label for leaf nodes
              },
            }
          ],
          data: treeData,
        },
      ],
    };

    // Incremental update - only update data, don't recreate chart
    chart.setOption(option, {
      notMerge: false, // Merge with existing option instead of replacing
      lazyUpdate: true, // Defer update until next animation frame
    });

    // Force resize after setting option to ensure proper display
    setTimeout(() => {
      chart.resize();
    }, 50);

    console.log('[Heatmap] ✅ Chart data updated incrementally');
  }, [heatmapData, isDark]); // Update when data or theme changes

  return (
    <div className={`w-full h-full flex flex-col ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header Tab Bar */}
      <div className={`flex items-center justify-between px-3 py-4 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-200'}`}>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Exchange & Sector Dropdowns + Connection Status */}
        <div className="flex items-center gap-3">
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {isLoading ? 'Đang tải...' : isConnected ? 'Realtime' : 'Ngắt kết nối'}
            </span>
          </div>

          {/* Sector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                isDark ? 'text-white hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-300'
              }`}
            >
              <span>{sector || 'Tất cả ngành'}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${isSectorDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isSectorDropdownOpen && (
              <div className={`absolute right-0 mt-1 w-48 max-h-96 overflow-y-auto rounded shadow-lg z-50 ${isDark ? 'bg-[#2a2a2a]' : 'bg-white'}`}>
                {availableSectors.map((sec) => (
                  <div
                    key={sec}
                    onClick={() => {
                      setSector(sec === 'Tất cả' ? undefined : sec);
                      setIsSectorDropdownOpen(false);
                    }}
                    className={`px-4 py-2 cursor-pointer text-sm ${
                      (sector || 'Tất cả') === sec
                        ? 'bg-blue-600 text-white'
                        : isDark
                          ? 'text-white hover:bg-gray-700'
                          : 'text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {sec}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exchange Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                isDark ? 'text-white hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-300'
              }`}
            >
              <span>{exchange}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className={`absolute right-0 mt-1 w-32 rounded shadow-lg z-50 ${isDark ? 'bg-[#2a2a2a]' : 'bg-white'}`}>
                {exchanges.map((ex) => (
                  <div
                    key={ex}
                    onClick={() => {
                      setExchange(ex);
                      setIsDropdownOpen(false);
                    }}
                    className={`px-4 py-2 cursor-pointer text-sm ${
                      exchange === ex
                        ? 'bg-blue-600 text-white'
                        : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {ex}
                  </div>
                ))}
              </div>
            )}
          </div>
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
      <div className={`px-4 py-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-10">
          {/* Pie Chart with Index */}
          <div className="relative flex-shrink-0">
            <div ref={pieChartRef} style={{ width: '100px', height: '100px' }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] font-bold">{marketStats.index}</p>
              <p className={`text-sm font-bold ${marketStats.indexChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {marketStats.indexValue.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Statistics Column 1 */}
          <div className="flex flex-col gap-1.5">
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
          </div>

          {/* Statistics Column 2 */}
          <div className="flex flex-col gap-1.5">
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
        </div>
      </div>

      {/* Heatmap */}
      <div className="flex-1 p-3 overflow-hidden relative">
        {/* Always render chart div to ensure ref is available */}
        <div ref={heatmapChartRef} className={`w-full h-full ${heatmapData.length === 0 ? 'hidden' : ''}`} />
        
        {/* Loading state */}
        {isLoading && heatmapItems.length === 0 && (
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