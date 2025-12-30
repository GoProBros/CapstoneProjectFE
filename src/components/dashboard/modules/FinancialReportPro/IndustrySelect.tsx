"use client";

/**
 * IndustrySelect Component
 * Dropdown chọn ngành với data từ API
 */

import React from 'react';
import { Icon } from '@iconify/react';
import { useFinancialReportStore } from '@/stores/financialReportStore';
import { useIndustriesQuery } from '@/hooks/useFinancialReportQuery';
import { useTheme } from '@/contexts/ThemeContext';

export default function IndustrySelect() {
  const { selectedIndustry, setSelectedIndustry } = useFinancialReportStore();
  const { data: industries, isLoading } = useIndustriesQuery();
  const { theme } = useTheme();

  return (
    <div className="w-full sm:w-[160px] flex-none">
      <div className="relative">
        <select
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          disabled={isLoading}
          className={`
            relative block w-full disabled:cursor-not-allowed disabled:opacity-75
            focus:outline-none border-0 form-select rounded-full text-sm px-2.5 py-1.5
            shadow-sm ring-1 ring-inset pe-9 transition-all
            ${
              theme === 'dark'
                ? 'bg-gray-900 text-white ring-gray-700 focus:ring-primary-400'
                : 'bg-white ring-gray-300 focus:ring-primary-500'
            }
            ${!selectedIndustry ? 'text-gray-400' : ''}
          `}
        >
          <option value="" disabled>
            {isLoading ? 'Đang tải...' : 'Xem theo ngành...'}
          </option>
          {industries?.map((industry) => (
            <option key={industry.value} value={industry.value}>
              {industry.label}
            </option>
          ))}
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
