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
}

export function FinancialIndicatorMetricsTable({
  rows,
  isDark,
}: FinancialIndicatorMetricsTableProps) {
  return (
    <div className="px-6 pb-4">
      {rows.map((row) => (
        <div key={row.key} className="flex justify-between items-center py-0.5 gap-3">
          <div className={`flex-shrink-0 w-30 text-sm leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                <div key={cell.key} className={`w-20 text-sm ${colorClass}`}>
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
