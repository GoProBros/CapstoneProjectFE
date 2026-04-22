"use client";

/**
 * TickerSearchBox Component
 * Input search với debounce và Iconify icons
 */

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useFinancialReportStore } from '@/stores/financialReportStore';
import { useTheme } from '@/contexts/ThemeContext';

export default function TickerSearchBox() {
  const { tickerList, setTickerList, clearAllData, setSelectedSectorId } = useFinancialReportStore();
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
            relative block w-full disabled:cursor-not-allowed disabled:opacity-75
            focus:outline-none border-0 form-input rounded-full text-sm px-2.5 py-1.5
            shadow-sm ring-1 ring-inset pe-9 transition-all
            ${
              theme === 'dark'
                ? 'bg-cardBackground text-white ring-gray-700 focus:ring-green-500 placeholder-gray-500'
                : 'bg-white text-gray-900 ring-gray-300 focus:ring-green-500 placeholder-gray-400'
            }
          `}
          autoComplete="off"
        />
        <span className="absolute inset-y-0 end-0 flex items-center">
          {localValue ? (
            <button
              type="button"
              onClick={handleClear}
              className={`
                ani-pop font-medium rounded-full text-sm gap-x-1.5 p-1.5 shadow-sm
                ring-1 ring-inset inline-flex items-center transition-all
                ${
                  theme === 'dark'
                    ? 'ring-gray-700 text-gray-200 bg-gray-800 hover:bg-gray-700/50'
                    : 'ring-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100'
                }
              `}
              title="Xóa"
            >
              <Icon icon="ri:close-line" className="flex-shrink-0 h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSearch}
              className={`
                ani-pop font-medium rounded-full text-sm gap-x-1.5 p-1.5 shadow-sm
                ring-1 ring-inset inline-flex items-center transition-all
                ${
                  theme === 'dark'
                    ? 'ring-gray-700 text-gray-200 bg-gray-800 hover:bg-gray-700/50'
                    : 'ring-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100'
                }
              `}
              title="Tìm kiếm"
            >
              <Icon icon="ri:search-line" className="flex-shrink-0 h-5 w-5" />
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
