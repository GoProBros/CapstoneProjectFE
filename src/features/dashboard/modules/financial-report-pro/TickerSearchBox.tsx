"use client";

/**
 * TickerSearchBox Component
 * Input search với debounce và Iconify icons
 */

import React, { useState, useEffect } from 'react';
import { useFinancialReportStore } from '@/stores/financialReportStore';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';
import { useTheme } from '@/contexts/ThemeContext';

export default function TickerSearchBox() {
  const { tickerList, setTickerList, clearAllData, setSelectedSectorId, lockState } = useFinancialReportStore();
  const setSelectedSymbol = useSelectedSymbolStore((s) => s.setSelectedSymbol);
  const { theme } = useTheme();
  const [localValue, setLocalValue] = useState(tickerList.join(','));

  // Sync with store when tickerList changes externally (e.g., from sector selection)
  useEffect(() => {
    setLocalValue(tickerList.join(','));
  }, [tickerList]);

  /**
   * Process and execute search
   * Splits by comma, trims whitespace, and filters empty strings
   */
  const handleSearch = () => {
    if (!localValue.trim()) {
      handleClear();
      return;
    }

    // Split by comma, trim each ticker, filter empty, convert to uppercase
    const newTickerList = localValue
      .split(',')
      .map(ticker => ticker.trim().toUpperCase())
      .filter(ticker => ticker.length > 0);

    setSelectedSectorId(''); // Clear sector selection when manually searching
    setTickerList(newTickerList); // This will auto-clear data for removed tickers
    setLocalValue(newTickerList.join(',')); // Update local value with cleaned version
    // Push to global symbol store so other modules stay in sync
    if (lockState && newTickerList.length === 1) {
      setSelectedSymbol(newTickerList[0]);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setLocalValue('');
    setTickerList([]);
    setSelectedSectorId(''); // Also clear sector selection
    clearAllData();
  };

  return (
    <div className="w-full sm:w-[160px] flex-none">
      <div className="relative">
        <input
          type="text"
          placeholder="Nhập mã CK"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          className={`
            block w-full text-xs rounded border px-2 py-1.5 pe-8 outline-none transition-colors
            ${
              theme === 'dark'
                ? 'bg-cardBackground border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-green-500'
            }
          `}
          autoComplete="off"
        />
        <span className="absolute inset-y-0 end-0 flex items-center pe-1">
          {localValue ? (
            <button
              type="button"
              onClick={handleClear}
              className={`rounded p-0.5 ${
                theme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
              }`}
              title="Xóa"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSearch}
              className={`rounded p-0.5 ${
                theme === 'dark' ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'
              }`}
              title="Tìm kiếm"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
