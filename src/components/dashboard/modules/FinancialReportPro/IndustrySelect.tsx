"use client";

/**
 * IndustrySelect Component
 * Dropdown chọn ngành với data từ Sector Store
 */

import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useFinancialReportStore } from '@/stores/financialReportStore';
import { useSectors } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';

export default function IndustrySelect() {
  const { selectedSectorId, setSelectedSectorId } = useFinancialReportStore();
  const { sectors, isLoading, fetchSectors } = useSectors();
  const { theme } = useTheme();

  // Fetch sectors on component mount (only once)
  useEffect(() => {
    if (sectors.length === 0 && !isLoading) {
      fetchSectors({ status: 1, pageIndex: 1, pageSize: 100 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty to run only once on mount

  return (
    <div className="w-full sm:w-[180px] flex-none">
      <div className="relative">
        <select
          value={selectedSectorId}
          onChange={(e) => setSelectedSectorId(e.target.value)}
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
            ${!selectedSectorId ? 'text-gray-400' : ''}
          `}
        >
          <option value="">
            {isLoading ? 'Đang tải...' : 'Xem theo ngành...'}
          </option>
          {sectors?.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.viName} ({sector.symbols.length})
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
