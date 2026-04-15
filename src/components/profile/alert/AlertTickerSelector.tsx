"use client";

import React from 'react';
import type { SymbolData } from '@/types/symbol';
import { Spinner } from '../Spinner';

interface TickerOption extends Pick<SymbolData, 'ticker' | 'viCompanyName' | 'enCompanyName'> {}

interface AlertTickerSelectorProps {
  selectedTicker: string;
  symbols: TickerOption[];
  filteredSymbols: TickerOption[];
  tickerSearch: string;
  dropdownOpen: boolean;
  symbolLoading: boolean;
  symbolError: string | null;
  symbolHasNextPage: boolean;
  selectedTickerLabel: string;
  onTickerChange: (ticker: string) => void;
  onSearchChange: (search: string) => void;
  onDropdownToggle: (open: boolean) => void;
  onLoadMore: () => void;
  borderCls: string;
  fieldBg: string;
  textPrimary: string;
  textMuted: string;
  textSecondary: string;
}

export function AlertTickerSelector({
  selectedTicker,
  symbols,
  filteredSymbols,
  tickerSearch,
  dropdownOpen,
  symbolLoading,
  symbolError,
  symbolHasNextPage,
  selectedTickerLabel,
  onTickerChange,
  onSearchChange,
  onDropdownToggle,
  onLoadMore,
  borderCls,
  fieldBg,
  textPrimary,
  textMuted,
  textSecondary,
}: AlertTickerSelectorProps) {
  return (
    <div className={`relative rounded-xl border ${borderCls} ${fieldBg} p-3`}>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Ticker</span>
      <button
        type="button"
        onClick={() => onDropdownToggle(!dropdownOpen)}
        className={`mt-2 flex w-full items-center justify-between rounded-lg border ${borderCls} bg-transparent px-3 py-2 text-left text-sm ${textPrimary}`}
      >
        <span className={selectedTicker ? '' : textMuted}>{selectedTickerLabel || 'Chọn ticker...'}</span>
        <span className={textMuted}>▾</span>
      </button>

      {dropdownOpen && (
        <div className={`absolute left-0 top-full z-[120] mt-2 w-full rounded-xl border ${borderCls} bg-white p-3 shadow-2xl dark:bg-[#1e1e26]`}>
          <input
            value={tickerSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm ticker..."
            className={`w-full rounded-lg border ${borderCls} ${fieldBg} px-3 py-2 text-sm ${textPrimary} outline-none`}
          />

          {symbolError && (
            <div className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500">{symbolError}</div>
          )}

          <div className="mt-2 max-h-48 overflow-y-auto">
            {symbolLoading && symbols.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-green-500">
                <Spinner className="h-4 w-4" />
                Đang tải ticker...
              </div>
            ) : filteredSymbols.length === 0 ? (
              <div className={`py-3 text-center text-xs ${textSecondary}`}>Không tìm thấy ticker</div>
            ) : (
              <>
                {filteredSymbols.map((symbol) => (
                  <button
                    key={symbol.ticker}
                    type="button"
                    onClick={() => {
                      onTickerChange(symbol.ticker);
                      onDropdownToggle(false);
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                      selectedTicker === symbol.ticker
                        ? `bg-green-500/15 font-semibold ${textPrimary}`
                        : `${textPrimary} hover:bg-gray-100 dark:hover:bg-gray-800`
                    }`}
                  >
                    <div className="font-medium">{symbol.ticker}</div>
                    <div className={`text-[11px] ${textMuted}`}>{symbol.viCompanyName || symbol.enCompanyName || ''}</div>
                  </button>
                ))}

                {symbolHasNextPage && filteredSymbols.length > 0 && (
                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={symbolLoading}
                    className={`mt-2 block w-full rounded-lg border ${borderCls} px-3 py-2 text-xs font-semibold transition-colors ${textSecondary} hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800`}
                  >
                    {symbolLoading ? 'Đang tải...' : 'Tải thêm'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
