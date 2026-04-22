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
  const { selectedSectorId, setSelectedSectorId, setTickerList } = useFinancialReportStore();
  const { sectors, isLoading, fetchSectors, getSectorFromCache } = useSectors();
  const { theme } = useTheme();

  // Fetch sectors on component mount (only once)
  useEffect(() => {
    // Only fetch if sectors list is truly empty - Level 2 only
    if (sectors.length === 0 && !isLoading) {
      fetchSectors({ level: 2, status: 1, pageIndex: 1, pageSize: 100 });
    }
  }, [fetchSectors, sectors.length, isLoading]);

  // Handle sector selection
  const handleSectorChange = (sectorId: string) => {
    setSelectedSectorId(sectorId);
    
    if (sectorId) {
      // Get sector from cache and set ticker list
      const sector = getSectorFromCache(sectorId);
      if (sector && sector.symbols && sector.symbols.length > 0) {
        setTickerList(sector.symbols); // This will auto-manage cache
      }
    } else {
      // Clear all when no sector selected
      setTickerList([]);
    }
  };

  return (
    <div className="w-full sm:w-[180px] flex-none">
      <div className="relative">
        <select
          value={selectedSectorId}
          onChange={(e) => handleSectorChange(e.target.value)}
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
            {isLoading ? 'Đang tải...' : 'Xem theo ngành'}
          </option>
          {sectors?.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.viName}
            </option>
          ))}
        </select>
        <span className="absolute inset-y-0 end-0 flex items-center pointer-events-none px-2.5">
          {/* <Icon
            icon="heroicons:chevron-down-20-solid"
            className={`flex-shrink-0 h-5 w-5 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}
          /> */}
        </span>
      </div>
    </div>
  );
}
