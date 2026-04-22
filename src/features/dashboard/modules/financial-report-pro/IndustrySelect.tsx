"use client";

/**
 * IndustrySelect Component
 * Dropdown chọn ngành — cùng visual pattern với SectorFilter
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFinancialReportStore } from '@/stores/financialReportStore';
import { useSectors } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';

export default function IndustrySelect() {
  const { selectedSectorId, setSelectedSectorId, setTickerList } = useFinancialReportStore();
  const { sectors, isLoading, fetchSectors, getSectorFromCache } = useSectors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Fetch sectors on mount (level 2 only)
  useEffect(() => {
    if (sectors.length === 0 && !isLoading) {
      fetchSectors({ level: 2, status: 1, pageIndex: 1, pageSize: 100 });
    }
  }, [fetchSectors, sectors.length, isLoading]);

  // Compute dropdown position relative to viewport when opening
  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSectorClick = (sectorId: string) => {
    // Re-click same sector → deselect
    if (sectorId === selectedSectorId) {
      setSelectedSectorId('');
      setTickerList([]);
      setIsOpen(false);
      return;
    }

    setSelectedSectorId(sectorId);
    const sector = getSectorFromCache(sectorId);
    if (sector?.symbols && sector.symbols.length > 0) {
      setTickerList(sector.symbols);
    }
    setIsOpen(false);
  };

  const selectedSector = sectors.find((s) => s.id === selectedSectorId);

  const truncate = (text: string, max = 20) =>
    text.length <= max ? text : text.slice(0, max - 3) + '...';

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        disabled={isLoading}
        className={`
          w-44 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
          flex items-center justify-between gap-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${selectedSector
            ? isDark
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-blue-400 text-white shadow-lg'
            : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }
        `}
      >
        <span className="truncate">
          {isLoading ? 'Đang tải...' : selectedSector ? truncate(selectedSector.viName) : 'Chọn ngành'}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown — rendered fixed to escape overflow:hidden parent */}
      {isOpen && !isLoading && (
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          className={`
            fixed w-[480px] rounded-lg shadow-xl z-[9999]
            max-h-[300px] overflow-y-auto
            ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}
          `}>
          {sectors.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">Không có ngành nào</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-3">
              {sectors.map((sector) => (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => handleSectorClick(sector.id)}
                  className={`
                    px-3 py-2 rounded text-sm text-left transition-all
                    ${selectedSectorId === sector.id
                      ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-400 text-white'
                      : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                  title={sector.viName}
                >
                  <div className="font-normal truncate">{sector.viName}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
