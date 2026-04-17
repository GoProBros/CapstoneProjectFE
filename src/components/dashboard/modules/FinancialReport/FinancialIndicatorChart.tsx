'use client';

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type IndicatorChartType = 'line' | 'bar';
type MetricFormat = 'percent' | 'ratio' | 'percent_signed';

export interface FinancialIndicatorChartSeries {
  key: string;
  label: string;
  color: string;
  format: MetricFormat;
}

export interface FinancialIndicatorChartDataPoint {
  label: string;
  [key: string]: string | number | null;
}

interface FinancialIndicatorChartProps {
  chartType: IndicatorChartType;
  data: FinancialIndicatorChartDataPoint[];
  series: FinancialIndicatorChartSeries[];
  isDark: boolean;
}

function formatChartValue(value: unknown, format: MetricFormat): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  if (format === 'ratio') {
    return value.toFixed(2);
  }

  const signedText = value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  return signedText;
}

export default function FinancialIndicatorChart({
  chartType,
  data,
  series,
  isDark,
}: FinancialIndicatorChartProps) {
  const commonProps = {
    data,
    margin: { top: 5, right: 10, left: 10, bottom: 5 },
  };

  const tooltipFormatter = (value: unknown, name: unknown) => {
    const seriesConfig = series.find((s) => s.label === name);
    const display = formatChartValue(value, seriesConfig?.format ?? 'ratio');
    return [display, String(name)];
  };

  return (
    <ResponsiveContainer width="100%" height={185}>
      {chartType === 'bar' ? (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="label" stroke="#e0e0e0" tick={{ fill: isDark ? '#d1d5db' : '#555', fontSize: 10 }} />
          <YAxis stroke="#e0e0e0" tick={{ fill: isDark ? '#d1d5db' : '#555', fontSize: 10 }} />
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: '6px' }}
            labelStyle={{ color: isDark ? '#fff' : '#000' }}
          />
          {/* <Legend wrapperStyle={{ fontSize: 8 }} /> */}
          {series.map((item) => (
            <Bar key={item.key} dataKey={item.key} name={item.label} fill={item.color} radius={[1, 1, 0, 0]} />
          ))}
        </BarChart>
      ) : (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="label" stroke="#e0e0e0" tick={{ fill: isDark ? '#d1d5db' : '#555', fontSize: 10 }} />
          <YAxis stroke="#e0e0e0" tick={{ fill: isDark ? '#d1d5db' : '#555', fontSize: 10 }} />
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: '6px' }}
            labelStyle={{ color: isDark ? '#fff' : '#000' }}
          />
          {/* <Legend wrapperStyle={{ fontSize: 11 }} /> */}
          {series.map((item) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
