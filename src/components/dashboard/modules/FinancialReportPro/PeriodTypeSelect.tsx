"use client";

/**
 * PeriodTypeSelect Component
 * Dropdown để chọn Năm/Quý
 */

import React from 'react';
import { Icon } from '@iconify/react';
import { useFinancialReportStore } from '@/stores/financialReportStore';
import { useTheme } from '@/contexts/ThemeContext';

export default function PeriodTypeSelect() {
  const { periodType, setPeriodType } = useFinancialReportStore();
  const { theme } = useTheme();

  return (
    <div className="w-full sm:w-[100px] flex-none">
      <div className="relative">
        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value as '1' | '0')}
          className={`
            relative block w-full disabled:cursor-not-allowed disabled:opacity-75
            focus:outline-none border-0 form-select rounded-full text-sm px-2.5 py-1.5
            shadow-sm ring-1 ring-inset pe-9 transition-all
            ${
              theme === 'dark'
                ? 'bg-gray-900 text-white ring-gray-700 focus:ring-primary-400'
                : 'bg-white text-gray-900 ring-gray-300 focus:ring-primary-500'
            }
          `}
        >
          <option value="1">Năm</option>
          <option value="0">Quý</option>
        </select>
        <span className="absolute inset-y-0 end-0 flex items-center pointer-events-none px-2.5">
          <Icon
            icon="heroicons:chevron-down-20-solid"
            className={`flex-shrink-0 h-5 w-5 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}
          />
        </span>
      </div>
    </div>
  );
}
