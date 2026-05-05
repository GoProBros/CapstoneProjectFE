'use client';

import React from 'react';

export interface FinancialIndicatorMetricDisplayCell {
  key: string;
  text: string;
  tone: 'default' | 'positive' | 'negative';
}

export interface FinancialIndicatorMetricDisplayRow {
  key: string;
  label: string;
  cells: FinancialIndicatorMetricDisplayCell[];
}

interface FinancialIndicatorMetricsTableProps {
  rows: FinancialIndicatorMetricDisplayRow[];
  isDark: boolean;
  compact?: boolean;
}

export function FinancialIndicatorMetricsTable({
  rows,
  isDark,
  compact = false,
}: FinancialIndicatorMetricsTableProps) {
  const labelWidthClass = compact ? 'w-24 text-xs' : 'w-30 text-sm';
  const valueWidthClass = compact ? 'w-16 text-xs' : 'w-20 text-sm';

  return (
    <div className={`${compact ? 'px-3' : 'px-6'} pb-4 overflow-x-auto scrollbar-hide`}>
      {rows.map((row) => (
        <div key={row.key} className="flex justify-between items-center py-0.5 gap-3 min-w-max">
          <div className={`flex-shrink-0 ${labelWidthClass} leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {row.label}
          </div>

          <div className="flex gap-3 text-center">
            {row.cells.map((cell) => {
              const colorClass = cell.tone === 'positive'
                ? 'text-emerald-400'
                : cell.tone === 'negative'
                  ? 'text-rose-400'
                  : isDark
                    ? 'text-white'
                    : 'text-gray-900';

              return (
                <div key={cell.key} className={`${valueWidthClass} ${colorClass}`}>
                  {cell.text}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
