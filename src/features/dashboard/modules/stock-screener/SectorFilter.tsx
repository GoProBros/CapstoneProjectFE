"use client";

/**
 * SectorFilter Component
 * Dropdown to filter symbols by sector (Level 2 only)
 * Displays sectors in 2-column grid layout with fixed button width
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSectorStore } from '@/stores/sectorStore';
import { getSectors } from '@/services/market/sectorService';
import type { Sector } from '@/types/sector';

interface SectorFilterProps {
  onSectorChange: (sector: Sector | null) => void;
  isLoading?: boolean;
  selectedSector?: Sector | null;
  showAllOption?: boolean;
  compact?: boolean;
  fullWidth?: boolean;
}

export default function SectorFilter({ onSectorChange, isLoading, selectedSector = null, showAllOption = false, compact = false, fullWidth = false }: SectorFilterProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isOpen, setIsOpen] = useState(false);
  const [level2Sectors, setLevel2Sectors] = useState<Sector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasFetchedRef = useRef(false);
  
  // Get sectors store setter
  const { setSectors } = useSectorStore();

  // Load level 2 sectors on mount only
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const loadSectors = async () => {
      setLoadingSectors(true);
      try {
        // Always fetch fresh from API to ensure symbols are populated
        const response = await getSectors({ 
          level: 2, 
          status: 1, // Active only
          pageSize: 100 
        });
        
        if (response.isSuccess && response.data) {
          setSectors(response.data);
          setLevel2Sectors(response.data.items);
        }
      } catch (error) {
        console.error('[SectorFilter] Error loading sectors:', error);
      } finally {
        setLoadingSectors(false);
      }
    };

    loadSectors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSectorClick = (sector: Sector) => {
    if (isLoading) return;
    // Re-click selected sector to deselect
    if (selectedSector?.id === sector.id) {
      onSectorChange(null);
    } else {
      onSectorChange(sector);
    }
    setIsOpen(false);
  };

  // Truncate text helper
  const truncateText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button with fixed width */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || loadingSectors}
        className={`
          ${(compact || fullWidth) ? 'w-full min-w-0 px-3 py-1.5 text-xs' : 'w-48 px-4 py-2 text-sm'} rounded-lg font-semibold transition-all
          flex items-center justify-between
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
          {loadingSectors 
            ? 'Đang tải...' 
            : selectedSector 
              ? truncateText(selectedSector.viName) 
              : 'Chọn ngành'
          }
        </span>
        <svg 
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu with 2 columns */}
      {isOpen && !loadingSectors && (
        <div className={`
          absolute top-full left-0 mt-2 ${(compact || fullWidth) ? 'w-full min-w-[220px]' : 'w-[500px]'} rounded-lg shadow-xl z-50
          max-h-[300px] overflow-y-auto
          ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}
        `}>
          {level2Sectors.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Không có ngành nào
            </div>
          ) : (
            <>
              {showAllOption && (
                <button
                  onClick={() => { onSectorChange(null); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm border-b transition-all ${
                    selectedSector === null
                      ? 'bg-blue-600 text-white'
                      : isDark ? 'text-gray-300 hover:bg-gray-700 border-gray-700' : 'text-gray-700 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  Tất cả ngành
                </button>
              )}
              <div className={`grid ${(compact || fullWidth) ? 'grid-cols-1' : 'grid-cols-2'} gap-2 p-3`}>
              {level2Sectors.map((sector) => (
                <button
                  key={sector.id}
                  onClick={() => handleSectorClick(sector)}
                  className={`
                    ${(compact || fullWidth) ? 'px-3 py-2 text-xs' : 'px-3 py-2 text-sm'} rounded text-left transition-all
                    ${selectedSector?.id === sector.id
                      ? isDark
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-400 text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <div className="font-normal truncate" title={sector.viName}>
                    {sector.viName}
                  </div>
                </button>
              ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
