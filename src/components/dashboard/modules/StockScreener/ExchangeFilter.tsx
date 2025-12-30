"use client";

/**
 * ExchangeFilter Component
 * Buttons to filter symbols by exchange (HSX, HNX, UPCOM)
 */

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import type { ExchangeCode } from '@/types/symbol';

interface ExchangeFilterProps {
  onExchangeChange: (exchange: ExchangeCode) => void;
  isLoading?: boolean;
}

export default function ExchangeFilter({ onExchangeChange, isLoading }: ExchangeFilterProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeExchange, setActiveExchange] = useState<ExchangeCode | null>(null);

  const exchanges: ExchangeCode[] = ['HSX', 'HNX', 'UPCOM'];

  const handleClick = (exchange: ExchangeCode) => {
    if (isLoading) return;
    setActiveExchange(exchange);
    onExchangeChange(exchange);
  };

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
            ${activeExchange === exchange
              ? isDark
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-blue-500 text-white shadow-lg'
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
