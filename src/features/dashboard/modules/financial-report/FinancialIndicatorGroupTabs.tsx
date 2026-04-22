'use client';

import React from 'react';

export interface FinancialIndicatorGroupTabItem {
  key: string;
  label: string;
  description: string;
  accent?: 'default' | 'growth' | 'risk';
}

interface FinancialIndicatorGroupTabsProps {
  tabs: FinancialIndicatorGroupTabItem[];
  activeTab: string;
  isDark: boolean;
  onSelectTab: (tab: string) => void;
}

export function FinancialIndicatorGroupTabs({
  tabs,
  activeTab,
  isDark,
  onSelectTab,
}: FinancialIndicatorGroupTabsProps) {
  const baseClass = 'rounded-xl border px-3 py-2 text-left transition-all min-w-[80px]';

  return (
    <div className="px-4 pb-2 mt-[6px] overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 whitespace-nowrap">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          const accentClass = tab.accent === 'growth'
            ? isActive
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
              : isDark
                ? 'border-emerald-900/50 text-emerald-300/80 hover:border-emerald-700'
                : 'border-emerald-200 text-emerald-700 hover:border-emerald-400'
            : tab.accent === 'risk'
              ? isActive
                ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                : isDark
                  ? 'border-amber-900/50 text-amber-300/80 hover:border-amber-700'
                  : 'border-amber-200 text-amber-700 hover:border-amber-400'
              : isActive
                ? 'bg-accentGreen text-black border-accentGreen'
                : isDark
                  ? 'border-gray-700 text-gray-300 hover:border-gray-500'
                  : 'border-gray-300 text-gray-700 hover:border-gray-500';

          return (
            <button
              key={tab.key}
              type="button"
              className={`${baseClass} ${accentClass}`}
              onClick={() => onSelectTab(tab.key)}
            >
              <div className="text-sm font-semibold">{tab.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
