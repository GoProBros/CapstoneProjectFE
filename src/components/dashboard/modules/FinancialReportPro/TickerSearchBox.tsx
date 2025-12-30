"use client";

/**
 * TickerSearchBox Component
 * Input search với debounce và Iconify icons
 */

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useFinancialReportStore } from '@/stores/financialReportStore';
import { useTheme } from '@/contexts/ThemeContext';
import { debounce } from '@/lib/utils';

export default function TickerSearchBox() {
  const { searchTicker, setSearchTicker } = useFinancialReportStore();
  const { theme } = useTheme();
  const [localValue, setLocalValue] = useState(searchTicker);

  // Debounced update to store
  useEffect(() => {
    const debouncedUpdate = debounce(() => {
      setSearchTicker(localValue);
    }, 500);

    debouncedUpdate();
  }, [localValue, setSearchTicker]);

  const handleClear = () => {
    setLocalValue('');
    setSearchTicker('');
  };

  return (
    <div className="w-full sm:w-[160px] flex-none">
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm cổ phiếu..."
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value.toUpperCase())}
          className={`
            relative block w-full disabled:cursor-not-allowed disabled:opacity-75
            focus:outline-none border-0 form-input rounded-full text-sm px-2.5 py-1.5
            shadow-sm ring-1 ring-inset pe-9 transition-all
            ${
              theme === 'dark'
                ? 'bg-gray-900 text-white ring-gray-700 focus:ring-primary-400 placeholder-gray-500'
                : 'bg-white text-gray-900 ring-gray-300 focus:ring-primary-500 placeholder-gray-400'
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
            >
              <Icon icon="ri:close-line" className="flex-shrink-0 h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              className={`
                ani-pop font-medium rounded-full text-sm gap-x-1.5 p-1.5 shadow-sm
                ring-1 ring-inset inline-flex items-center transition-all
                ${
                  theme === 'dark'
                    ? 'ring-gray-700 text-gray-200 bg-gray-800 hover:bg-gray-700/50'
                    : 'ring-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100'
                }
              `}
            >
              <Icon icon="ri:search-line" className="flex-shrink-0 h-5 w-5" />
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
