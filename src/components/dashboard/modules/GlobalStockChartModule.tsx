"use client";

import React, { useState } from 'react';
import TradingViewWidget from './TradingViewWidget';

export default function GlobalStockChartModule() {
  const [selectedSymbol, setSelectedSymbol] = useState('NASDAQ:AAPL');

  const popularSymbols = [
    { label: 'Apple', symbol: 'NASDAQ:AAPL' },
    { label: 'Microsoft', symbol: 'NASDAQ:MSFT' },
    { label: 'Google', symbol: 'NASDAQ:GOOGL' },
    { label: 'Amazon', symbol: 'NASDAQ:AMZN' },
    { label: 'Tesla', symbol: 'NASDAQ:TSLA' },
    { label: 'Meta', symbol: 'NASDAQ:META' },
    { label: 'NVIDIA', symbol: 'NASDAQ:NVDA' },
    { label: 'Bitcoin', symbol: 'BINANCE:BTCUSDT' },
  ];

  return (
    <div className="w-full h-full bg-[#282832] rounded-lg border border-gray-800 flex flex-col overflow-hidden">
      {/* Header with symbol selector */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:border-accentGreen"
        >
          {popularSymbols.map((item) => (
            <option key={item.symbol} value={item.symbol}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* TradingView Chart */}
      <div className="flex-1 overflow-hidden">
        <TradingViewWidget 
          symbol={selectedSymbol}
          theme="dark"
          interval="D"
          style="1"
        />
      </div>
    </div>
  );
}
