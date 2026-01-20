"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useHeatmapSignalR } from '@/hooks/useHeatmapSignalR';
import { HeatmapFilters } from '@/types/heatmap';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // SignalR connection for real-time data
  const filters = useMemo<HeatmapFilters>(() => ({
    exchange: exchange === 'Tất cả' ? undefined : exchange,
  }), [exchange]);

  const { data, isConnected, isLoading, error } = useHeatmapSignalR({
    filters,
    autoConnect: true,
    useRest: true, // Fallback to REST if SignalR fails
  });
  
  const pieChartRef = useRef<HTMLDivElement>(null);
  const heatmapChartRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'volatility', label: 'Biến động' },
    { id: 'foreign', label: 'Nước ngoài' },
    { id: 'proprietary', label: 'Tự doanh' },
    { id: 'liquidity', label: 'Thanh khoản' },
    { id: 'index-impact', label: 'Tác động tới index' },
  ];

  const exchanges = ['Tất cả', 'HSX', 'HNX', 'UPCOM'];

  // Sector name mapping (ID -> Vietnamese name)
  // Backend trả về SectorId có thể là: "1", "2", hoặc tên sector trực tiếp
  const sectorNameMap: Record<string, string> = {
    // Numeric IDs
    '1': 'Ngân hàng',
    '2': 'Chứng khoán',
    '3': 'Bảo hiểm',
    '4': 'Bất động sản',
    '5': 'Xây dựng & Vật liệu',
    '6': 'Dầu khí',
    '7': 'Hóa chất',
    '8': 'Điện',
    '9': 'Dược phẩm',
    '10': 'Thực phẩm & đồ uống',
    '11': 'Bán lẻ',
    '12': 'Công nghệ',
    '13': 'Viễn thông',
    '14': 'Du lịch & Giải trí',
    '15': 'Vận tải & Logistics',
    '16': 'Ô tô & phụ tùng',
    '17': 'Hàng tiêu dùng',
    '18': 'Dệt may',
    '19': 'Nông nghiệp',
    '20': 'Thủy sản',
    // Alternative formats (just in case backend returns different format)
    'BANK': 'Ngân hàng',
    'SECURITIES': 'Chứng khoán',
    'INSURANCE': 'Bảo hiểm',
    'REALESTATE': 'Bất động sản',
    'CONSTRUCTION': 'Xây dựng & Vật liệu',
    'OILGAS': 'Dầu khí',
    'CHEMICAL': 'Hóa chất',
    'POWER': 'Điện',
    'PHARMACEUTICAL': 'Dược phẩm',
    'FOOD': 'Thực phẩm & đồ uống',
    'RETAIL': 'Bán lẻ',
    'TECHNOLOGY': 'Công nghệ',
    'TELECOM': 'Viễn thông',
    'TOURISM': 'Du lịch & Giải trí',
    'LOGISTICS': 'Vận tải & Logistics',
    'AUTO': 'Ô tô & phụ tùng',
    'CONSUMER': 'Hàng tiêu dùng',
    'TEXTILE': 'Dệt may',
    'AGRICULTURE': 'Nông nghiệp',
    'AQUACULTURE': 'Thủy sản',
    'Khác': 'Khác',
  };

  // Number of top stocks to show per sector initially
  const TOP_STOCKS_PER_SECTOR = 5;

  // Calculate market stats from real-time data
  const marketStats: MarketStats = useMemo(() => {
    if (!data || !data.items || data.items.length === 0) {
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

    const upItems = data.items.filter(item => item.changePercent > 0);
    const noChangeItems = data.items.filter(item => item.changePercent === 0);
    const downItems = data.items.filter(item => item.changePercent < 0);

    const upValue = upItems.reduce((sum, item) => sum + (item.volume * item.currentPrice), 0) / 1e9; // Convert to billions
    const noChangeValue = noChangeItems.reduce((sum, item) => sum + (item.volume * item.currentPrice), 0) / 1e9;
    const downValue = downItems.reduce((sum, item) => sum + (item.volume * item.currentPrice), 0) / 1e9;

    const totalVolume = data.items.reduce((sum, item) => sum + item.volume, 0) / 1e9;
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
  }, [data, exchange]);

  // Transform real-time data to heatmap format
  const heatmapData = useMemo(() => {
    if (!data || !data.items) return [];

    // Debug: Log first item to see sector format
    if (data.items.length > 0) {
      console.log('[Heatmap] Sample sector data:', {
        sector: data.items[0].sector,
        sectorName: data.items[0].sectorName,
        ticker: data.items[0].ticker
      });
    }

    return data.items
      .map(item => {
        const sectorId = item.sector || 'Khác';
        // Use sectorName from API first, fallback to mapping if not available
        const sectorName = item.sectorName || sectorNameMap[sectorId] || sectorId || 'Khác';
        
        return {
          name: item.ticker,
          value: item.volume * item.currentPrice / 1e6, // Convert to millions for better visualization
          change: item.changePercent,
          sector: sectorId,
          sectorName: sectorName,
        };
      })
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [data, sectorNameMap]);

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

  // Initialize Heatmap Chart
  useEffect(() => {
    if (!heatmapChartRef.current || heatmapData.length === 0) return;

    const chart = echarts.init(heatmapChartRef.current);
    
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
      // Sort stocks by value and take top N for initial display
      const sortedStocks = [...sectorStocks].sort((a, b) => b.value - a.value);
      const topStocks = sortedStocks.slice(0, TOP_STOCKS_PER_SECTOR);
      const hasMore = sortedStocks.length > TOP_STOCKS_PER_SECTOR;
      
      return {
        name: sectorName,
        // Store all stocks for drill-down
        children: sortedStocks.map(stock => ({
          name: stock.name,
          value: stock.value,
          change: stock.change,
          itemStyle: {
            color: stock.change > 0 
              ? (stock.change >= 6.5 ? '#9333ea' : stock.change >= 3 ? '#16a34a' : stock.change >= 1 ? '#22c55e' : '#4ade80')
              : stock.change < 0
              ? (stock.change <= -6.5 ? '#06b6d4' : stock.change <= -3 ? '#dc2626' : stock.change <= -1 ? '#ef4444' : '#f87171')
              : '#f59e0b'
          },
          label: {
            formatter: `{name|${stock.name}}\n{change|${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%}`,
            align: 'center',
            position: 'inside',
            rich: {
              name: {
                fontSize: 14,
                fontWeight: 'bold',
                color: '#fff',
                lineHeight: 20,
                align: 'center',
              },
              change: {
                fontSize: 13,
                fontWeight: 'bold',
                color: '#fff',
                lineHeight: 18,
                align: 'center',
              }
            }
          }
        }))
      };
    });

    const option = {
      tooltip: {
        formatter: (params: any) => {
          if (params.treePathInfo && params.treePathInfo.length > 1) {
            const stock = params.data;
            return `<strong>${stock.name}</strong><br/>
                    Thay đổi: <span style="color: ${stock.change >= 0 ? '#22c55e' : '#ef4444'}">
                    ${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%</span><br/>
                    Giá trị: ${stock.value.toFixed(2)}M`;
          }
          return `<strong>${params.name}</strong><br/>Click để xem chi tiết`;
        },
      },
      series: [
        {
          type: 'treemap',
          width: '100%',
          height: '100%',
          roam: false,
          nodeClick: 'zoomToNode',
          breadcrumb: {
            show: true,
            height: 30,
            bottom: 0,
            itemStyle: {
              color: isDark ? '#374151' : '#e5e7eb',
              textStyle: {
                color: isDark ? '#fff' : '#000',
              },
            },
            emphasis: {
              itemStyle: {
                color: '#3b82f6',
              },
            },
          },
          label: {
            show: true,
            fontSize: 13,
            fontWeight: 'bold',
            color: '#fff',
            position: 'inside',
            align: 'center',
            formatter: (params: any) => {
              if (params.data.change !== undefined) {
                return params.name;
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
            backgroundColor: 'rgba(0,0,0,0.6)',
            formatter: '{b}',
          },
          itemStyle: {
            borderColor: isDark ? '#000' : '#1a1a1a',
            borderWidth: 2,
            gapWidth: 2,
          },
          levels: [
            {
              // Level 0: Root (not visible)
              itemStyle: {
                borderWidth: 0,
              },
            },
            {
              // Level 1: Sectors
              itemStyle: {
                borderColor: isDark ? '#000' : '#1a1a1a',
                borderWidth: 6,
                gapWidth: 6,
              },
              upperLabel: {
                show: true,
                height: 32,
                fontSize: 16,
                fontWeight: 'bold',
              },
            },
            {
              // Level 2: Stocks within sector
              itemStyle: {
                borderColor: isDark ? '#000' : '#1a1a1a',
                borderWidth: 2,
                gapWidth: 2,
              },
              label: {
                fontSize: 12,
                fontWeight: 'bold',
              },
            }
          ],
          data: treeData,
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [isDark, heatmapData]);

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

        {/* Exchange Dropdown & Connection Status */}
        <div className="flex items-center gap-3">
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {isLoading ? 'Đang tải...' : isConnected ? 'Realtime' : 'Ngắt kết nối'}
            </span>
          </div>

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

      {/* Error Message */}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border-l-4 border-red-500">
          <p className="text-sm text-red-500">
            Lỗi kết nối: {error.message}
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
        {isLoading && !data ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : heatmapData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Không có dữ liệu
            </p>
          </div>
        ) : (
          <div ref={heatmapChartRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
}