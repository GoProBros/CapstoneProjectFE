"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { SymbolType } from '@/types/symbol';
import { ChevronDown } from 'lucide-react';

interface SymbolTypeFilterProps {
  onSymbolTypeChange: (type: SymbolType | null) => void;
  isLoading?: boolean;
}

const SYMBOL_TYPE_OPTIONS = [
  { value: null, label: 'Mặc định' },
  { value: SymbolType.Stock, label: 'Cổ phiếu' },
  { value: SymbolType.ETF, label: 'ETF' },
  { value: SymbolType.Bond, label: 'Trái phiếu' },
  { value: SymbolType.Futures, label: 'Phái sinh' },
];

export default function SymbolTypeFilter({ onSymbolTypeChange, isLoading = false }: SymbolTypeFilterProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedType, setSelectedType] = useState<SymbolType | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedOption = SYMBOL_TYPE_OPTIONS.find(opt => opt.value === selectedType) || SYMBOL_TYPE_OPTIONS[0];

  const handleSelect = (value: SymbolType | null) => {
    setSelectedType(value);
    onSymbolTypeChange(value);
    setIsOpen(false);
  };

  const handleMouseEnter = () => {
    // Clear any pending leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    // Open dropdown after short delay
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 200); // 200ms delay for better UX
  };

  const handleMouseLeave = () => {
    // Clear any pending hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Close dropdown after short delay
    leaveTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300); // 300ms delay to allow moving to dropdown
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      className="relative w-[140px]"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        disabled={isLoading}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isDark
            ? 'bg-gray-700 text-white border border-gray-600 hover:bg-gray-600'
            : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown 
          size={16} 
          className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isLoading && (
        <div
          className={`absolute top-full left-0 mt-1 w-full rounded-lg shadow-lg border z-50 overflow-hidden ${
            isDark
              ? 'bg-gray-700 border-gray-600'
              : 'bg-white border-gray-300'
          }`}
        >
          {SYMBOL_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value ?? 'default'}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                selectedType === option.value
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                    ? 'text-white hover:bg-gray-600'
                    : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
