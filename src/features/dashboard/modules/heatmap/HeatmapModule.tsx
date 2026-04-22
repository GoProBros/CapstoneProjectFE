"use client";

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import * as echarts from 'echarts';
import WatchListSelector from '@/features/dashboard/components/layout/WatchListSelector';
import ExchangeFilter from '@/features/dashboard/modules/stock-screener/ExchangeFilter';
import SectorFilter from '@/features/dashboard/modules/stock-screener/SectorFilter';
import { useHeatmap } from './useHeatmap';

export function HeatmapModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    selectedExchange,
    selectedSector,
    selectedWatchlistId,
    availableWatchlists,
    isLoadingWatchlists,
    isLoading,
    heatmapItemsMapRef,
    heatmapItemsVersion,
    marketStats,
    heatmapData,
    flashingTickers,
    handleExchangeChange,
    handleSectorChange,
    fetchWatchLists,
    handleSelectWatchList,
  } = useHeatmap();

  const pieChartRef = useRef<HTMLDivElement>(null);
  const heatmapChartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const zoomSumRef = useRef(0);
  const lastChartOptionRef = useRef<any>(null);

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

          // Flash: switch to a much lighter shade of the same color family
          const isFlashing = flashingTickers.has(stock.name);
          const flashColorMap: Record<string, string> = {
            '#9333ea': '#d8b4fe', // Purple → light purple
            '#16a34a': '#86efac', // Dark Green → light green
            '#22c55e': '#bbf7d0', // Green → very light green
            '#4ade80': '#dcfce7', // Light Green → near-white green
            '#f59e0b': '#fef08a', // Yellow → light yellow
            '#f87171': '#fee2e2', // Light Red → near-white red
            '#ef4444': '#fca5a5', // Red → light red
            '#dc2626': '#fca5a5', // Dark Red → light red
            '#06b6d4': '#a5f3fc', // Cyan → light cyan
          };
          
          return {
            name: stock.name,
            value: stock.value,
            change: stock.change,
            changeValue: stock.changeValue,
            price: stock.price,
            volume: stock.volume,
            totalValue: stock.totalValue,
            itemStyle: {
              color: isFlashing ? (flashColorMap[color] ?? '#ffffff') : color,
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
            height: 28,
            color: '#fff',
            fontSize: 12,
            fontWeight: '600',
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
            backgroundColor: 'rgba(0,0,0,0.55)',
            borderColor: 'rgba(255,255,255,0.15)',
            borderWidth: 1,
            padding: [0, 8],
            formatter: (params: any) => params.name,
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
                height: 28,
                fontSize: 12,
                fontWeight: '600',
                fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                color: '#fff',
                padding: [0, 8],
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
  }, [heatmapData, flashingTickers, isDark]); // Update when data, flash state, or theme changes

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

        {/* Exchange Filter */}
        <ExchangeFilter
          onExchangeChange={handleExchangeChange}
          selectedExchange={selectedExchange}
          variant="dropdown"
        />

        {/* Sector Filter */}
        <SectorFilter
          onSectorChange={handleSectorChange}
          selectedSector={selectedSector}
          showAllOption
        />

        {/* Connection Status */}
        {/* <div className={`ml-auto flex items-center justify-center w-8 h-8 rounded-full ${
          isConnected ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={isConnected ? 'Đang kết nối' : 'Ngắt kết nối'} />
        </div> */}
      </div>

      {/* Connection Status Message */}
      {/* {!isConnected && (
        <div className="px-4 py-3 bg-yellow-500/10 border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-500">
            Đang kết nối tới SignalR...
          </p>
        </div>
      )} */}

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