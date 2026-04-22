import React from 'react';

interface NewsFilterBarProps {
  isDark: boolean;
  searchKeywordInput: string;
  tickerInput: string;
  onSearchKeywordInputChange: (value: string) => void;
  onTickerInputChange: (value: string) => void;
  onReset: () => void;
}

export default function NewsFilterBar({
  isDark,
  searchKeywordInput,
  tickerInput,
  onSearchKeywordInputChange,
  onTickerInputChange,
  onReset,
}: NewsFilterBarProps) {
  return (
    <div
      className={`sticky top-0 z-20 grid grid-cols-1 gap-2 px-3 pt-2 pb-2 sm:grid-cols-[1fr_110px_auto] ${isDark ? 'bg-cardBackground' : 'bg-white'}`}
    >
      <input
        type="text"
        value={searchKeywordInput}
        onChange={(event) => onSearchKeywordInputChange(event.target.value)}
        placeholder="Tìm theo tiêu đề, nguồn..."
        className={`rounded border px-2 py-1 text-xs outline-none ${
          isDark
            ? 'border-gray-700 bg-cardBackground text-gray-100 placeholder:text-gray-500 focus:border-green-500'
            : 'border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 focus:border-green-500'
        }`}
      />

      <input
        type="text"
        value={tickerInput}
        onChange={(event) => onTickerInputChange(event.target.value.toUpperCase())}
        placeholder="Mã cổ phiếu"
        className={`rounded border px-2 py-1 text-xs outline-none ${
          isDark
            ? 'border-gray-700 bg-cardBackground text-gray-100 placeholder:text-gray-500 focus:border-green-500'
            : 'border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 focus:border-green-500'
        }`}
      />

      <button
        type="button"
        onClick={onReset}
        className={`rounded border px-3 py-1 text-xs transition-colors ${
          isDark
            ? 'border-gray-600 text-gray-300 hover:bg-gray-700/60'
            : 'border-gray-200 text-gray-600 hover:bg-gray-100'
        }`}
      >
        Đặt lại
      </button>
    </div>
  );
}
