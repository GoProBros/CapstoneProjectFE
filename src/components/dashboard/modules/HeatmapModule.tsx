"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
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
  const [exchange, setExchange] = useState('HOSE');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const pieChartRef = useRef<HTMLDivElement>(null);
  const heatmapChartRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'volatility', label: 'Biến động' },
    { id: 'foreign', label: 'Nước ngoài' },
    { id: 'proprietary', label: 'Tự doanh' },
    { id: 'liquidity', label: 'Thanh khoản' },
    { id: 'index-impact', label: 'Tác động tới index' },
  ];

  const exchanges = ['Tất cả', 'HOSE', 'HNX', 'UPCOM'];

  // Mock data
  const marketStats: MarketStats = {
    index: 'VNINDEX',
    indexValue: 1722.26,
    indexChange: -0.23,
    up: { count: 84, value: 7492.0 },
    noChange: { count: 50, value: 1397.1 },
    down: { count: 238, value: 17231.0 },
    volume: 1.0,
    totalValue: 31103.7,
    foreignNetValue: -1288.2,
  };

  // Heatmap data with sectors
  const heatmapData = [
    // Bất động sản
    { name: 'HPG', value: 5000, change: 2.86, sector: 'Bất động sản' },
    { name: 'CII', value: 800, change: 0, sector: 'Bất động sản' },
    { name: 'DXG', value: 600, change: -2.27, sector: 'Bất động sản' },
    { name: 'VRE', value: 1200, change: -2.64, sector: 'Bất động sản' },
    { name: 'VHM', value: 1500, change: -3.65, sector: 'Bất động sản' },
    { name: 'VIC', value: 1300, change: -3.92, sector: 'Bất động sản' },
    { name: 'PDR', value: 900, change: -2.31, sector: 'Bất động sản' },
    
    // Chứng khoán
    { name: 'DIG', value: 400, change: -2.25, sector: 'Chứng khoán' },
    { name: 'NVL', value: 350, change: -0.75, sector: 'Chứng khoán' },
    { name: 'HQC', value: 350, change: -1.31, sector: 'Chứng khoán' },
    { name: 'KHG', value: 400, change: -2.57, sector: 'Chứng khoán' },
    { name: 'VND', value: 1800, change: -0.5, sector: 'Chứng khoán' },
    { name: 'NKG', value: 450, change: 0.31, sector: 'Chứng khoán' },
    { name: 'VCG', value: 350, change: -3.65, sector: 'Chứng khoán' },
    { name: 'IJC', value: 350, change: -1.36, sector: 'Chứng khoán' },
    { name: 'NLG', value: 350, change: -0.31, sector: 'Chứng khoán' },
    { name: 'TCH', value: 450, change: -2.5, sector: 'Chứng khoán' },
    { name: 'KDH', value: 350, change: -2.03, sector: 'Chứng khoán' },
    { name: 'SCR', value: 300, change: -2, sector: 'Chứng khoán' },
    { name: 'LDG', value: 350, change: -2.76, sector: 'Chứng khoán' },
    { name: 'VIX', value: 2000, change: -1.09, sector: 'Chứng khoán' },
    { name: 'NRC', value: 400, change: 0.31, sector: 'Chứng khoán' },
    { name: 'HDC', value: 400, change: -2.77, sector: 'Chứng khoán' },
    { name: 'HPX', value: 300, change: -1.95, sector: 'Chứng khoán' },
    { name: 'CEO', value: 350, change: -2.76, sector: 'Chứng khoán' },
    { name: 'SSI', value: 1500, change: 1.31, sector: 'Chứng khoán' },
    { name: 'VCI', value: 800, change: 3.34, sector: 'Chứng khoán' },
    { name: 'HCM', value: 800, change: -0.44, sector: 'Chứng khoán' },
    
    // Ngân hàng
    { name: 'SHB', value: 3500, change: -1.52, sector: 'Ngân hàng' },
    { name: 'VPB', value: 1800, change: -2.09, sector: 'Ngân hàng' },
    { name: 'HDB', value: 1200, change: -0.73, sector: 'Ngân hàng' },
    { name: 'MBB', value: 1200, change: -1, sector: 'Ngân hàng' },
    { name: 'STB', value: 1500, change: 1.61, sector: 'Ngân hàng' },
    { name: 'CTG', value: 500, change: -0.18, sector: 'Ngân hàng' },
    { name: 'MSB', value: 400, change: -0.81, sector: 'Ngân hàng' },
    { name: 'ACB', value: 600, change: -0.6, sector: 'Ngân hàng' },
    { name: 'EIB', value: 400, change: -2.27, sector: 'Ngân hàng' },
    { name: 'VIB', value: 500, change: -1.6, sector: 'Ngân hàng' },
    { name: 'TCB', value: 600, change: -0.59, sector: 'Ngân hàng' },
    { name: 'TPB', value: 500, change: -0.9, sector: 'Ngân hàng' },
    { name: 'VCB', value: 600, change: -0.19, sector: 'Ngân hàng' },
    { name: 'BID', value: 500, change: -0.41, sector: 'Ngân hàng' },
    
    // Tiêu dùng
    { name: 'MWG', value: 800, change: -1.31, sector: 'Tiêu dùng' },
    { name: 'MSN', value: 600, change: -1.97, sector: 'Tiêu dùng' },
    { name: 'DBC', value: 700, change: -0.72, sector: 'Tiêu dùng' },
    { name: 'PET', value: 400, change: 1.2, sector: 'Tiêu dùng' },
    { name: 'VNM', value: 500, change: 0.2, sector: 'Tiêu dùng' },
    
    // Phòng thả
    { name: 'POW', value: 800, change: 1.59, sector: 'Phòng thả' },
    { name: 'GAS', value: 600, change: 1.0, sector: 'Phòng thả' },
    { name: 'FPT', value: 600, change: -1.08, sector: 'Phòng thả' },
    { name: 'VRE', value: 400, change: 0.2, sector: 'Phòng thả' },
    
    // Dầu khí
    { name: 'BSR', value: 800, change: 2.2, sector: 'Dầu khí' },
    { name: 'PVD', value: 700, change: 2.1, sector: 'Dầu khí' },
    { name: 'GAS', value: 600, change: 1.5, sector: 'Dầu khí' },
    
    // Logistics
    { name: 'GMD', value: 800, change: 1.82, sector: 'Logistics' },
    { name: 'VJC', value: 600, change: -2.18, sector: 'Logistics' },
    { name: 'PVT', value: 600, change: 0.6, sector: 'Logistics' },
  ];

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
    if (!heatmapChartRef.current) return;

    const chart = echarts.init(heatmapChartRef.current);
    
    // Group data by sector
    const sectors = ['Bất động sản', 'Chứng khoán', 'Ngân hàng', 'Tiêu dùng', 'Phòng thả', 'Dầu khí', 'Logistics'];
    const treeData = sectors.map(sector => {
      const sectorStocks = heatmapData.filter(s => s.sector === sector);
      return {
        name: sector,
        children: sectorStocks.map(stock => ({
          name: stock.name,
          value: stock.value,
          change: stock.change,
          itemStyle: {
            color: stock.change > 0 
              ? (stock.change > 2 ? '#16a34a' : stock.change > 1 ? '#22c55e' : '#4ade80')
              : stock.change < 0
              ? (stock.change < -2 ? '#dc2626' : stock.change < -1 ? '#ef4444' : '#f87171')
              : '#f59e0b'
          },
          label: {
            formatter: `{name|${stock.name}}\n{change|${stock.change > 0 ? '+' : ''}${stock.change}%}`,
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
      series: [
        {
          type: 'treemap',
          width: '100%',
          height: '100%',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#fff',
            position: 'inside',
            align: 'center',
          },
          upperLabel: {
            show: true,
            height: 28,
            color: '#fff',
            fontSize: 15,
            fontWeight: '300',
            backgroundColor: 'rgba(0,0,0,0.5)',
          },
          itemStyle: {
            borderColor: isDark ? '#000' : '#1a1a1a',
            borderWidth: 2,
            gapWidth: 2,
          },
          levels: [
            {
              itemStyle: {
                borderColor: isDark ? '#000' : '#1a1a1a',
                borderWidth: 6,
                gapWidth: 6,
              },
              upperLabel: {
                show: true,
                height: 28,
                fontSize: 15,
                fontWeight: '300',
              }
            },
            {
              itemStyle: {
                borderColor: isDark ? '#000' : '#1a1a1a',
                borderWidth: 2,
                gapWidth: 1,
              }
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

        {/* Exchange Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`mr-6 flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
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
      <div className="flex-1 p-3 overflow-hidde">
        <div ref={heatmapChartRef} className="w-full h-full" />
      </div>
    </div>
  );
}
