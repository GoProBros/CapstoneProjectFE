"use client";

/**
 * ExchangeFilter Component
 * Buttons to filter symbols by exchange (HSX, HNX, UPCOM)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import type { ExchangeCode } from '@/types/symbol';

interface ExchangeFilterProps {
  onExchangeChange: (exchange: ExchangeCode | null) => void;
  isLoading?: boolean;
  selectedExchange?: ExchangeCode | null;
  variant?: 'pills' | 'dropdown';
}

export default function ExchangeFilter({ onExchangeChange, isLoading, selectedExchange = null, variant = 'pills' }: ExchangeFilterProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const exchanges: ExchangeCode[] = ['HSX', 'HNX', 'UPCOM'];

  const handleClick = (exchange: ExchangeCode) => {
    if (isLoading) return;
    // Re-click to deselect
    if (selectedExchange === exchange) {
      onExchangeChange(null);
    } else {
      onExchangeChange(exchange);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (variant === 'dropdown') {
    const label = selectedExchange ?? 'Tất cả';
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`
            flex items-center justify-between gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${selectedExchange
              ? isDark ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-400 text-white shadow-lg'
              : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
        >
          <span>{label}</span>
          <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className={`absolute top-full left-0 mt-2 w-36 rounded-lg shadow-xl z-50 overflow-hidden ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            {/* Tất cả */}
            <button
              onClick={() => { onExchangeChange(null); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-all ${
                selectedExchange === null
                  ? 'bg-blue-600 text-white'
                  : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tất cả
            </button>
            {exchanges.map((exchange) => (
              <button
                key={exchange}
                onClick={() => { onExchangeChange(exchange); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm transition-all ${
                  selectedExchange === exchange
                    ? 'bg-blue-600 text-white'
                    : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {exchange}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {exchanges.map((exchange) => (
        <button
          key={exchange}
          onClick={() => handleClick(exchange)}
          disabled={isLoading}
          className={`
            px-4 py-2 rounded-lg font-semibold text-sm transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${selectedExchange === exchange
              ? isDark
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-blue-400 text-white shadow-lg'
              : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
        >
          {exchange}
        </button>
      ))}
    </div>
  );
}
