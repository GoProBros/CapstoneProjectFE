'use client';

import React from 'react';

interface FinancialIndicatorPeriodNavigatorProps {
  activePeriodTab: 'annual' | 'quarterly';
  onChangePeriodTab: (tab: 'annual' | 'quarterly') => void;
  periodLabels: string[];
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  isDark: boolean;
}

export function FinancialIndicatorPeriodNavigator({
  activePeriodTab,
  onChangePeriodTab,
  periodLabels,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  isDark,
}: FinancialIndicatorPeriodNavigatorProps) {
  const navBtnBase = 'rounded-full text-xs p-[0.175rem] shadow-sm ring-1 ring-inset inline-flex items-center';
  const navBtnEnabled = isDark
    ? 'text-gray-200 bg-gray-800 ring-gray-700 hover:bg-gray-700 cursor-pointer'
    : 'text-gray-700 bg-white ring-gray-300 hover:bg-gray-50 cursor-pointer';
  const navBtnDisabled = isDark
    ? 'text-gray-500 bg-gray-800 ring-gray-700 cursor-not-allowed opacity-50'
    : 'text-gray-400 bg-gray-100 ring-gray-300 cursor-not-allowed opacity-50';

  return (
    <div className="px-6 pt-1">
      <div className="flex justify-between items-center gap-3">
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onChangePeriodTab('annual')}
            className={`px-2 py-0.5 text-xs rounded-full ${
              activePeriodTab === 'annual' ? 'bg-accentGreen text-black' : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Hàng Năm
          </button>
          <button
            type="button"
            onClick={() => onChangePeriodTab('quarterly')}
            className={`px-2 py-0.5 text-xs rounded-full ${
              activePeriodTab === 'quarterly' ? 'bg-accentGreen text-black' : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Hàng Quý
          </button>
        </div>

        <div className="relative min-w-0">
          <div className="absolute inset-y-0 -left-4 flex items-center">
            <button
              type="button"
              onClick={onPrev}
              disabled={!canGoPrev}
              className={`${navBtnBase} ${canGoPrev ? navBtnEnabled : navBtnDisabled}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2 text-center">
            {periodLabels.map((label) => (
              <div key={label} className={`font-semibold text-xs w-20 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {label}
              </div>
            ))}
          </div>

          <div className="absolute inset-y-0 -right-4 flex items-center">
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className={`${navBtnBase} ${canGoNext ? navBtnEnabled : navBtnDisabled}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="my-2" />
    </div>
  );
}
