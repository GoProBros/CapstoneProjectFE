"use client";

import React, { useState } from 'react';

interface FinancialData {
  ticker: string;
  year: number;
  quarter: string;
  revenue: number;
  yearRevenueGrowth: number;
  costOfGoodSold: number;
  grossProfit: number;
  operationExpense: number;
  operationProfit: number;
  yearOperationProfitGrowth: number;
}

export default function FinancialReportProModule() {
  const [periodType, setPeriodType] = useState<'1' | '0'>('1');
  const [searchTicker, setSearchTicker] = useState('BSR');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['BSR']));
  const [showSidebar, setShowSidebar] = useState(true);

  const financialData: FinancialData[] = [
    { ticker: 'BSR', year: 2024, quarter: '2024 - Q5', revenue: 123027, yearRevenueGrowth: -16.5, costOfGoodSold: -122536, grossProfit: 491, operationExpense: -1213, operationProfit: -722, yearOperationProfitGrowth: 0 },
    { ticker: 'BSR', year: 2023, quarter: '2023 - Q5', revenue: 147423, yearRevenueGrowth: -11.8, costOfGoodSold: -137664, grossProfit: 9760, operationExpense: -1656, operationProfit: 8104, yearOperationProfitGrowth: -44.8 },
    { ticker: 'BSR', year: 2022, quarter: '2022 - Q5', revenue: 167124, yearRevenueGrowth: 65.3, costOfGoodSold: -151027, grossProfit: 16096, operationExpense: -1424, operationProfit: 14673, yearOperationProfitGrowth: 125.4 },
    { ticker: 'BSR', year: 2021, quarter: '2021 - Q5', revenue: 101080, yearRevenueGrowth: 74.4, costOfGoodSold: -93381, grossProfit: 7699, operationExpense: -1188, operationProfit: 6511, yearOperationProfitGrowth: 0 },
    { ticker: 'BSR', year: 2020, quarter: '2020 - Q5', revenue: 57959, yearRevenueGrowth: -43.6, costOfGoodSold: -60184, grossProfit: -2225, operationExpense: -821, operationProfit: -3046, yearOperationProfitGrowth: 0 },
    { ticker: 'BSR', year: 2019, quarter: '2019 - Q5', revenue: 102824, yearRevenueGrowth: -8.2, costOfGoodSold: -98851, grossProfit: 3973, operationExpense: -1104, operationProfit: 2869, yearOperationProfitGrowth: -27.4 },
    { ticker: 'BSR', year: 2018, quarter: '2018 - Q5', revenue: 111952, yearRevenueGrowth: 37.6, costOfGoodSold: -106914, grossProfit: 5038, operationExpense: -1089, operationProfit: 3950, yearOperationProfitGrowth: -50.2 },
    { ticker: 'BSR', year: 2017, quarter: '2017 - Q5', revenue: 81333, yearRevenueGrowth: 0, costOfGoodSold: -72239, grossProfit: 9093, operationExpense: -1159, operationProfit: 7934, yearOperationProfitGrowth: 0 },
    { ticker: 'BSR', year: 2012, quarter: '2012 - Q5', revenue: 127491, yearRevenueGrowth: 0, costOfGoodSold: -124598, grossProfit: 2894, operationExpense: -971, operationProfit: 1923, yearOperationProfitGrowth: 0 },
    { ticker: 'BSR', year: 2016, quarter: '2016 - Q5', revenue: 0, yearRevenueGrowth: 0, costOfGoodSold: 0, grossProfit: 0, operationExpense: 0, operationProfit: 0, yearOperationProfitGrowth: 0 },
  ];

  const formatNumber = (num: number) => {
    if (num === 0) return '';
    return num.toLocaleString('en-US');
  };

  const formatPercentage = (num: number) => {
    if (num === 0) return '';
    return `${num.toFixed(1)}%`;
  };

  const toggleGroup = (ticker: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(ticker)) {
      newExpanded.delete(ticker);
    } else {
      newExpanded.add(ticker);
    }
    setExpandedGroups(newExpanded);
  };

  const groupedData = financialData.reduce((acc, row) => {
    if (!acc[row.ticker]) {
      acc[row.ticker] = [];
    }
    acc[row.ticker].push(row);
    return acc;
  }, {} as Record<string, FinancialData[]>);

  return (
    <div className="w-full h-full bg-[#1e222d] flex flex-col overflow-hidden relative">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-2 py-2 bg-[#1e222d] border-b border-gray-700">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative inline-flex">
            <input type="checkbox" id="lockToggle" className="sr-only peer" />
            <label htmlFor="lockToggle" className="cursor-pointer">
              <svg width="18" height="20" viewBox="0 0 36 40" className="text-gray-400">
                <path className="fill-current" d="M27 27C27 34.1797 21.1797 40 14 40C6.8203 40 1 34.1797 1 27C1 19.8203 6.8203 14 14 14C21.1797 14 27 19.8203 27 27ZM15.6298 26.5191C16.4544 25.9845 17 25.056 17 24C17 22.3431 15.6569 21 14 21C12.3431 21 11 22.3431 11 24C11 25.056 11.5456 25.9845 12.3702 26.5191L11 32H17L15.6298 26.5191Z" />
                <path className="stroke-current fill-none" strokeWidth="2" d="M6 21V10C6 5.58172 9.58172 2 14 2V2C18.4183 2 22 5.58172 22 10V21" />
              </svg>
            </label>
          </div>

          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as '1' | '0')}
            className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 w-[100px]"
          >
            <option value="1">Năm</option>
            <option value="0">Quý</option>
          </select>

          <div className="relative w-[160px]">
            <input
              type="text"
              placeholder="Tìm cổ phiếu..."
              value={searchTicker}
              onChange={(e) => setSearchTicker(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-full px-2.5 py-1.5 pr-9 text-sm border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 rounded-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 w-[160px]"
          >
            <option value="">Xem theo ngành...</option>
            <option value="oil">Sản xuất dầu khí</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-yellow-400 text-black rounded-sm px-3 py-1.5 font-semibold text-sm">
            <svg className="w-6 h-8 -ml-2" viewBox="0 0 30 32" fill="currentColor">
              <path d="M0,32C2.56273,31.7585,7.31779,31.219,10.7812,28C14.2447,24.781,16.875,18.1176,17.9297,15.8824C18.8466,13.939,21.3281,8.47059,23.3163,4.94118C25.3347,1.35811,29.1454,0,29.9781,0L0,0L0,32Z" />
            </svg>
            <span className="mx-2">Báo cáo tài chính</span>
            <svg className="w-6 h-8 -mr-2 transform scale-x-[-1]" viewBox="0 0 30 32" fill="currentColor">
              <path d="M0,32C2.56273,31.7585,7.31779,31.219,10.7812,28C14.2447,24.781,16.875,18.1176,17.9297,15.8824C18.8466,13.939,21.3281,8.47059,23.3163,4.94118C25.3347,1.35811,29.1454,0,29.9781,0L0,0L0,32Z" />
            </svg>
          </div>

          <div className="flex gap-1">
            <select className="bg-transparent text-white rounded-full px-2.5 py-1.5 pr-9 text-sm border border-green-500 focus:ring-2 focus:ring-green-500 w-[180px]">
              <option>Bộ lọc gốc</option>
            </select>
            <button className="absolute right-[210px] top-[14px] p-1.5 bg-green-500 rounded-full">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="flex gap-1">
            <select className="bg-transparent text-white rounded-full px-2.5 py-1.5 pr-9 text-sm border border-yellow-500 focus:ring-2 focus:ring-yellow-500 w-[180px]">
              <option>Bố cục gốc</option>
            </select>
            <button className="absolute right-[18px] top-[14px] p-1.5 bg-yellow-500 rounded-full">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table Container */}
        <div className="flex-1 overflow-auto bg-[#1e222d]">
          <div className="min-w-max">
            {/* Multi-level Header */}
            <div className="sticky top-0 z-20 bg-[#252836]">
              {/* Level 1: Main Groups */}
              <div className="flex border-b border-gray-700">
                <div className="w-[600px] px-3 py-3 text-yellow-400 font-medium text-sm border-r border-gray-700 sticky left-0 bg-[#252836] z-30">
                  KỲ BÁO CÁO
                </div>
                <div className="px-3 py-3 text-yellow-400 font-medium text-sm">
                  KẾT QUẢ KINH DOANH
                </div>
              </div>

              {/* Level 2 & 3: Empty rows for structure */}
              <div className="flex border-b border-gray-700">
                <div className="w-[600px] border-r border-gray-700 sticky left-0 bg-[#252836] z-30"></div>
                <div className="flex-1"></div>
              </div>
              <div className="flex border-b border-gray-700">
                <div className="w-[600px] border-r border-gray-700 sticky left-0 bg-[#252836] z-30"></div>
                <div className="flex-1"></div>
              </div>

              {/* Level 4: Column Headers */}
              <div className="flex border-b border-gray-700 text-xs">
                <div className="w-[200px] px-3 py-3 text-yellow-400 font-medium sticky left-0 bg-[#252836] z-30 border-r border-gray-700">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Mã
                  </div>
                </div>
                <div className="w-[200px] px-3 py-3 text-yellow-400 font-medium sticky left-[200px] bg-[#252836] z-30 border-r border-gray-700">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Năm
                  </div>
                </div>
                <div className="w-[200px] px-3 py-3 text-yellow-400 font-medium sticky left-[400px] bg-[#252836] z-30 border-r border-gray-700">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Quý
                  </div>
                </div>
                <div className="w-[100px] px-3 py-3 text-yellow-400 font-medium">Group</div>
                <div className="w-[100px] px-3 py-3 text-yellow-400 font-medium">Doanh thu thuần</div>
                <div className="w-[100px] px-3 py-3 text-yellow-400 font-medium">DTT YoY (%)</div>
                <div className="w-[100px] px-3 py-3 text-yellow-400 font-medium">Giá vốn hàng bán</div>
                <div className="w-[100px] px-3 py-3 text-yellow-400 font-medium">Lợi nhuận gộp</div>
                <div className="w-[100px] px-3 py-3 text-yellow-400 font-medium">Chi phí hoạt động</div>
                <div className="w-[100px] px-3 py-3 text-yellow-400 font-medium">LN hoạt động KD</div>
                <div className="w-[100px] px-3 py-3 text-yellow-400 font-medium">LNKD YoY (%)</div>
              </div>

              {/* Filter Row */}
              <div className="flex border-b border-gray-700 text-xs bg-[#1f2230]">
                <div className="w-[200px] px-3 py-2 sticky left-0 bg-[#1f2230] z-30 border-r border-gray-700">
                  <input type="text" disabled className="w-full bg-[#2a2d3a] border border-gray-600 rounded px-2 py-1 text-white text-xs" />
                </div>
                <div className="w-[200px] px-3 py-2 sticky left-[200px] bg-[#1f2230] z-30 border-r border-gray-700">
                  <input type="text" disabled className="w-full bg-[#2a2d3a] border border-gray-600 rounded px-2 py-1 text-white text-xs" />
                </div>
                <div className="w-[200px] px-3 py-2 sticky left-[400px] bg-[#1f2230] z-30 border-r border-gray-700">
                  <input type="text" disabled className="w-full bg-[#2a2d3a] border border-gray-600 rounded px-2 py-1 text-white text-xs" />
                </div>
                <div className="w-[100px] px-3 py-2"></div>
                <div className="w-[100px] px-3 py-2">
                  <input type="text" className="w-full bg-[#2a2d3a] border border-gray-600 rounded px-2 py-1 text-white text-xs" />
                </div>
                <div className="w-[100px] px-3 py-2">
                  <input type="text" className="w-full bg-[#2a2d3a] border border-gray-600 rounded px-2 py-1 text-white text-xs" />
                </div>
                <div className="w-[100px] px-3 py-2">
                  <input type="text" className="w-full bg-[#2a2d3a] border border-gray-600 rounded px-2 py-1 text-white text-xs" />
                </div>
                <div className="w-[100px] px-3 py-2">
                  <input type="text" className="w-full bg-[#2a2d3a] border border-gray-600 rounded px-2 py-1 text-white text-xs" />
                </div>
                <div className="w-[100px] px-3 py-2">
                  <input type="text" className="w-full bg-[#2a2d3a] border border-gray-600 rounded px-2 py-1 text-white text-xs" />
                </div>
                <div className="w-[100px] px-3 py-2">
                  <input type="text" className="w-full bg-[#2a2d3a] border border-gray-600 rounded px-2 py-1 text-white text-xs" />
                </div>
                <div className="w-[100px] px-3 py-2">
                  <input type="text" className="w-full bg-[#2a2d3a] border border-gray-600 rounded px-2 py-1 text-white text-xs" />
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="text-xs">
              {Object.entries(groupedData).map(([ticker, rows]) => (
                <React.Fragment key={ticker}>
                  {/* Group Header Row */}
                  <div className="flex bg-[#1e222d] hover:bg-[#252836] cursor-pointer" onClick={() => toggleGroup(ticker)}>
                    <div className="w-[200px] px-3 py-2.5 sticky left-0 bg-inherit z-10 border-r border-gray-800">
                      <div className="flex items-center gap-2">
                        <svg className={`w-3 h-3 text-white transition-transform ${expandedGroups.has(ticker) ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="text-blue-400 font-bold">{ticker}</span>
                        <span className="text-gray-400">({rows.length})</span>
                      </div>
                    </div>
                    <div className="w-[200px] px-3 py-2.5 sticky left-[200px] bg-inherit z-10 border-r border-gray-800"></div>
                    <div className="w-[200px] px-3 py-2.5 sticky left-[400px] bg-inherit z-10 border-r border-gray-800"></div>
                    <div className="w-[100px] px-3 py-2.5"></div>
                    <div className="w-[100px] px-3 py-2.5"></div>
                    <div className="w-[100px] px-3 py-2.5"></div>
                    <div className="w-[100px] px-3 py-2.5"></div>
                    <div className="w-[100px] px-3 py-2.5"></div>
                    <div className="w-[100px] px-3 py-2.5"></div>
                    <div className="w-[100px] px-3 py-2.5"></div>
                    <div className="w-[100px] px-3 py-2.5"></div>
                  </div>

                  {/* Data Rows */}
                  {expandedGroups.has(ticker) && rows.map((row, index) => (
                    <div key={index} className={`flex ${index % 2 === 0 ? 'bg-[#1e222d]' : 'bg-[#1a1d29]'} hover:bg-[#252836]`}>
                      <div className="w-[200px] px-3 py-2.5 text-blue-400 font-bold sticky left-0 bg-inherit z-10 border-r border-gray-800">
                        {row.ticker}
                      </div>
                      <div className="w-[200px] px-3 py-2.5 text-white sticky left-[200px] bg-inherit z-10 border-r border-gray-800">
                        {row.year}
                      </div>
                      <div className="w-[200px] px-3 py-2.5 text-white sticky left-[400px] bg-inherit z-10 border-r border-gray-800">
                        {row.quarter}
                      </div>
                      <div className="w-[100px] px-3 py-2.5"></div>
                      <div className="w-[100px] px-3 py-2.5 text-white">
                        {formatNumber(row.revenue)}
                      </div>
                      <div className={`w-[100px] px-3 py-2.5 ${row.yearRevenueGrowth > 0 ? 'text-green-400' : row.yearRevenueGrowth < 0 ? 'text-red-400' : 'text-white'}`}>
                        {formatPercentage(row.yearRevenueGrowth)}
                      </div>
                      <div className="w-[100px] px-3 py-2.5 text-white">
                        {formatNumber(row.costOfGoodSold)}
                      </div>
                      <div className="w-[100px] px-3 py-2.5 text-white">
                        {formatNumber(row.grossProfit)}
                      </div>
                      <div className="w-[100px] px-3 py-2.5 text-white">
                        {formatNumber(row.operationExpense)}
                      </div>
                      <div className="w-[100px] px-3 py-2.5 text-white">
                        {formatNumber(row.operationProfit)}
                      </div>
                      <div className={`w-[100px] px-3 py-2.5 ${row.yearOperationProfitGrowth > 0 ? 'text-green-400' : row.yearOperationProfitGrowth < 0 ? 'text-red-400' : 'text-white'}`}>
                        {formatPercentage(row.yearOperationProfitGrowth)}
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-[250px] bg-[#1e222d] border-l border-gray-700 flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
              <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="text-white text-sm font-medium">Thiết đặt bố cục</span>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked readOnly className="rounded" />
                  <span>Mã</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked readOnly className="rounded" />
                  <span>Năm</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked readOnly className="rounded" />
                  <span>Quý</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked readOnly className="rounded" />
                  <span>Doanh thu thuần</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked readOnly className="rounded" />
                  <span>DTT YoY (%)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
