"use client";

/**
 * FilterLayoutSelector Component
 * 2 dropdowns: Bộ lọc và Bố cục với add buttons
 */

import React from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '@/contexts/ThemeContext';

export default function FilterLayoutSelector() {
  const { theme } = useTheme();

  return (
    <>
      {/* Bộ lọc selector */}
      <div className="w-full sm:w-[180px] flex-none flex gap-1">
        <div className="relative w-full">
          <select
            className={`
              relative block w-full disabled:cursor-not-allowed disabled:opacity-75
              focus:outline-none border-0 form-select rounded-full text-sm px-2.5 py-1.5
              shadow-sm ring-1 ring-inset pe-9 transition-all
              ${
                theme === 'dark'
                  ? 'bg-transparent text-white ring-green-400 focus:ring-green-400'
                  : 'bg-transparent text-gray-900 ring-green-500 focus:ring-green-500'
              }
            `}
            defaultValue="default"
          >
            <option value="default">Bộ lọc gốc</option>
          </select>
          <span className="absolute inset-y-0 end-0 flex items-center">
            <button
              type="button"
              className={`
                ani-pop font-medium rounded-full text-sm gap-x-1.5 p-1.5 shadow-sm
                inline-flex items-center transition-all
                ${
                  theme === 'dark'
                    ? 'text-gray-900 bg-green-400 hover:bg-green-500 focus-visible:outline-green-400'
                    : 'text-white bg-green-500 hover:bg-green-600 focus-visible:outline-green-500'
                }
              `}
            >
              <Icon icon="ri:add-circle-line" className="flex-shrink-0 h-5 w-5" />
            </button>
          </span>
        </div>
      </div>

      {/* Bố cục selector */}
      <div className="w-full sm:w-[180px] flex-none flex gap-1">
        <div className="relative w-full">
          <select
            className={`
              relative block w-full disabled:cursor-not-allowed disabled:opacity-75
              focus:outline-none border-0 form-select rounded-full text-sm px-2.5 py-1.5
              shadow-sm ring-1 ring-inset pe-9 transition-all
              ${
                theme === 'dark'
                  ? 'bg-transparent text-white ring-yellow-400 focus:ring-yellow-400'
                  : 'bg-transparent text-gray-900 ring-yellow-500 focus:ring-yellow-500'
              }
            `}
            defaultValue="default"
          >
            <option value="default">Bố cục gốc</option>
          </select>
          <span className="absolute inset-y-0 end-0 flex items-center">
            <button
              type="button"
              className={`
                ani-pop font-medium rounded-full text-sm gap-x-1.5 p-1.5 shadow-sm
                inline-flex items-center transition-all
                ${
                  theme === 'dark'
                    ? 'text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus-visible:outline-yellow-400'
                    : 'text-white bg-yellow-500 hover:bg-yellow-600 focus-visible:outline-yellow-500'
                }
              `}
            >
              <Icon icon="ri:add-circle-line" className="flex-shrink-0 h-5 w-5" />
            </button>
          </span>
        </div>
      </div>
    </>
  );
}
