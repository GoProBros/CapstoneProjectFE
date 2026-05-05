"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLinkedState } from '@/features/dashboard/hooks/useLinkedState';
import { useLocalSymbol } from '@/features/dashboard/hooks/useLocalSymbol';
import { Link2, Link2Off, Search, X } from 'lucide-react';
import { FinancialIndicatorChart, type FinancialIndicatorChartDataPoint, type MetricFormat } from './FinancialIndicatorChart';
import { FinancialIndicatorGroupTabs, type FinancialIndicatorGroupTabItem } from './FinancialIndicatorGroupTabs';
import { FinancialIndicatorMetricsTable, type FinancialIndicatorMetricDisplayRow } from './FinancialIndicatorMetricsTable';
import { FinancialIndicatorPeriodNavigator } from './FinancialIndicatorPeriodNavigator';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchFinancialReportsByTicker } from '@/services/financial/financialReportService';
import { searchSymbols } from '@/services/market/symbolService';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';
import { FINANCIAL_COLUMN_STRUCTURE, type FieldDef } from '@/stores/financialReportColumnStore';
import type { SymbolSearchResultDto } from '@/types/symbol';
import { formatBillion } from '@/lib/formatters';
import {
  FinancialPeriodType,
  type FinancialReportTableRow,
} from '@/types/financialReport';

type PeriodTab = 'annual' | 'quarterly';
type IndicatorGroupKey = 'balanceSheet' | 'incomeStatement' | 'cashFlow' | 'indicators';
type ChartType = 'line' | 'bar';

interface IndicatorMetricDefinition {
  key: string;
  label: string;
  format: MetricFormat;
  getValue: (row: FinancialReportTableRow) => number | null | undefined;
}

interface IndicatorChartSeriesDefinition {
  key: string;
  label: string;
  color: string;
  format: MetricFormat;
  getValue: (row: FinancialReportTableRow) => number | null | undefined;
}

interface IndicatorGroupDefinition {
  key: IndicatorGroupKey;
  label: string;
  description: string;
  accent?: 'default' | 'growth' | 'risk';
  chartType: ChartType;
  chartSeries: IndicatorChartSeriesDefinition[];
  metrics: IndicatorMetricDefinition[];
}

const GROUP_ID_BY_TAB: Record<IndicatorGroupKey, string> = {
  balanceSheet: 'balanceSheet',
  incomeStatement: 'incomeStatement',
  cashFlow: 'cashFlowStatement',
  indicators: 'indicator',
};

const BALANCE_SHEET_EXTRA_FIELDS: FieldDef[] = [
  { field: 'totalAssets', label: 'Tổng tài sản' },
  { field: 'shortTermAssets', label: 'Tài sản ngắn hạn' },
  { field: 'longTermAssets', label: 'Tài sản dài hạn' },
];

const INDICATOR_FIELD_FORMATS: Record<string, MetricFormat> = {
  profitability_grossMargin: 'percent',
  profitability_operatingProfitMargin: 'percent',
  profitability_netMargin: 'percent',
  profitability_roe: 'percent',
  profitability_roa: 'percent',
  profitability_returnOnFixedAssets: 'percent',
  liquidityAndSolvency_currentRatio: 'ratio',
  liquidityAndSolvency_quickRatio: 'ratio',
  liquidityAndSolvency_cashRatio: 'ratio',
  liquidityAndSolvency_debtToEquity: 'percent',
  liquidityAndSolvency_debtRatio: 'percent',
  liquidityAndSolvency_longTermDebtRatio: 'percent',
  liquidityAndSolvency_interestCoverageRatio: 'ratio',
  liquidityAndSolvency_retainedEarningsToTotalAssets: 'percent',
  efficiency_totalAssetTurnover: 'ratio',
  efficiency_inventoryTurnover: 'ratio',
  growth_grossProfitGrowth: 'percent_signed',
  growth_revenueGrowth: 'percent_signed',
  bankSpecific_nim: 'percent',
  bankSpecific_nonInterestIncomeRatio: 'percent',
  cashFlow_operatingCashFlowToNetProfit: 'ratio',
};

const INDICATOR_FIELDS_SKIP = new Set(['growth_comparisonType']);

function getFlattenedFields(groupId: string): FieldDef[] {
  const topGroup = FINANCIAL_COLUMN_STRUCTURE.find((group) => group.groupId === groupId);
  if (!topGroup) {
    return [];
  }

  const fields: FieldDef[] = [];

  if (topGroup.fields) {
    fields.push(...topGroup.fields);
  }

  if (topGroup.subGroups) {
    for (const subGroup of topGroup.subGroups) {
      fields.push(...subGroup.fields);
    }
  }

  const seen = new Set<string>();
  return fields.filter((field) => {
    if (seen.has(field.field)) {
      return false;
    }
    seen.add(field.field);
    return true;
  });
}

function getMetricFormat(field: string, groupKey: IndicatorGroupKey): MetricFormat | null {
  if (groupKey !== 'indicators') {
    return 'billion';
  }

  return INDICATOR_FIELD_FORMATS[field] ?? null;
}

function getNumericValue(row: FinancialReportTableRow, field: string): number | null {
  const value = (row as unknown as Record<string, unknown>)[field];
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  return null;
}

function buildMetricDefinitions(groupKey: IndicatorGroupKey): IndicatorMetricDefinition[] {
  const groupId = GROUP_ID_BY_TAB[groupKey];
  const baseFields = getFlattenedFields(groupId);
  const fields = groupKey === 'balanceSheet'
    ? [...BALANCE_SHEET_EXTRA_FIELDS, ...baseFields]
    : baseFields;

  const metrics: IndicatorMetricDefinition[] = [];

  for (const field of fields) {
    if (INDICATOR_FIELDS_SKIP.has(field.field)) {
      continue;
    }

    const format = getMetricFormat(field.field, groupKey);
    if (!format) {
      continue;
    }

    metrics.push({
      key: field.field,
      label: field.label,
      format,
      getValue: (row: FinancialReportTableRow) => getNumericValue(row, field.field),
    });
  }

  return metrics;
}

const INDICATOR_GROUPS: IndicatorGroupDefinition[] = [
  {
    key: 'balanceSheet',
    label: 'Cân đối kế toán',
    description: 'Tài sản và vốn chủ sở hữu',
    chartType: 'line',
    chartSeries: [
      {
        key: 'totalEquity',
        label: 'Vốn chủ sở hữu',
        color: '#22c55e',
        format: 'billion',
        getValue: (row) => row.totalEquity,
      },
      {
        key: 'contributedCapital',
        label: 'Vốn điều lệ',
        color: '#38bdf8',
        format: 'billion',
        getValue: (row) => row.contributedCapital ?? null,
      },
      {
        key: 'totalAssets',
        label: 'Tổng tài sản',
        color: '#a855f7',
        format: 'billion',
        getValue: (row) => row.totalAssets,
      },
    ],
    metrics: buildMetricDefinitions('balanceSheet'),
  },
  {
    key: 'incomeStatement',
    label: 'Kết quả kinh doanh',
    description: 'Hiệu quả hoạt động kinh doanh',
    accent: 'growth',
    chartType: 'bar',
    chartSeries: [
      {
        key: 'grossProfit',
        label: 'Lợi nhuận gộp',
        color: '#22c55e',
        format: 'billion',
        getValue: (row) => row.grossProfit ?? null,
      },
      {
        key: 'netProfit',
        label: 'Lợi nhuận sau thuế',
        color: '#f59e0b',
        format: 'billion',
        getValue: (row) => row.netProfit ?? null,
      },
      {
        key: 'netRevenue',
        label: 'Doanh thu thuần',
        color: '#3b82f6',
        format: 'billion',
        getValue: (row) => row.netRevenue ?? null,
      },
    ],
    metrics: buildMetricDefinitions('incomeStatement'),
  },
  {
    key: 'cashFlow',
    label: 'Dòng tiền',
    description: 'Lưu chuyển tiền tệ',
    chartType: 'line',
    chartSeries: [
      {
        key: 'netCashFlow',
        label: 'Lưu chuyển tiền thuần',
        color: '#10b981',
        format: 'billion',
        getValue: (row) => row.netCashFlow,
      },
      {
        key: 'operatingCashFlow',
        label: 'Hoạt động kinh doanh',
        color: '#38bdf8',
        format: 'billion',
        getValue: (row) => row.operatingCashFlow,
      },
      {
        key: 'investingCashFlow',
        label: 'Hoạt động đầu tư',
        color: '#f59e0b',
        format: 'billion',
        getValue: (row) => row.investingCashFlow,
      },
    ],
    metrics: buildMetricDefinitions('cashFlow'),
  },
  {
    key: 'indicators',
    label: 'Chỉ số tài chính',
    description: 'Biên lợi nhuận và đòn bẩy',
    accent: 'risk',
    chartType: 'line',
    chartSeries: [
      {
        key: 'grossMargin',
        label: 'Biên LN gộp',
        color: '#22c55e',
        format: 'percent',
        getValue: (row) => row.profitability_grossMargin ?? null,
      },
      {
        key: 'netMargin',
        label: 'Biên LN ròng',
        color: '#16a34a',
        format: 'percent',
        getValue: (row) => row.profitability_netMargin ?? null,
      },
      {
        key: 'debtToEquity',
        label: 'Nợ/Vốn chủ (D/E)',
        color: '#f59e0b',
        format: 'percent',
        getValue: (row) => row.liquidityAndSolvency_debtToEquity ?? null,
      },
    ],
    metrics: buildMetricDefinitions('indicators'),
  },
];

const GROUP_TAB_ITEMS: FinancialIndicatorGroupTabItem[] = INDICATOR_GROUPS.map((group) => ({
  key: group.key,
  label: group.label,
  description: group.description,
  accent: group.accent,
}));

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function toChartValue(value: number | null | undefined, format: MetricFormat): number | null {
  if (!isNumber(value)) {
    return null;
  }

  if (format === 'billion') {
    return Number((value / 1_000_000_000).toFixed(2));
  }

  if (format === 'ratio') {
    return Number(value.toFixed(3));
  }

  return Number((value * 100).toFixed(2));
}

function formatMetricValue(
  value: number | null | undefined,
  format: MetricFormat,
  options?: { hideUnit?: boolean }
): string {
  if (!isNumber(value)) {
    return '—';
  }

  if (format === 'billion') {
    const formatted = formatBillion(value);
    return options?.hideUnit ? formatted : `${formatted} tỷ`;
  }

  if (format === 'ratio') {
    return value.toFixed(2);
  }

  const percentValue = value * 100;

  if (format === 'percent_signed') {
    if (percentValue > 0) {
      return `↑ +${percentValue.toFixed(1)}%`;
    }

    if (percentValue < 0) {
      return `↓ ${percentValue.toFixed(1)}%`;
    }

    return '0.0%';
  }

  return `${percentValue.toFixed(1)}%`;
}

function normalizeMetricValue(value: number | null | undefined, hideZero: boolean): number | null {
  if (!isNumber(value)) {
    return null;
  }

  if (hideZero && value === 0) {
    return null;
  }

  return value;
}

function getMetricTone(
  value: number | null | undefined,
  format: MetricFormat
): 'default' | 'positive' | 'negative' {
  if (!isNumber(value) || (format !== 'percent' && format !== 'percent_signed')) {
    return 'default';
  }

  if (value > 0) {
    return 'positive';
  }

  if (value < 0) {
    return 'negative';
  }

  return 'default';
}

function getPeriodLabel(row: FinancialReportTableRow): string {
  if (row.period === FinancialPeriodType.YearToDate) {
    return `Năm ${row.year}`;
  }

  return `Q${row.period}/${row.year}`;
}

export function FinancialReportModule() {
  const moduleRef = useRef<HTMLDivElement>(null);
  const [moduleWidth, setModuleWidth] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const selectedSymbol = useSelectedSymbolStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useSelectedSymbolStore((s) => s.setSelectedSymbol);

  const [isLinked, setIsLinked] = useLinkedState();
  const [frozenSymbol, setFrozenSymbol] = useLocalSymbol(isLinked);

  const effectiveSymbol = isLinked ? selectedSymbol : frozenSymbol;

  const handleToggleLink = useCallback(() => {
    setIsLinked(v => {
      setFrozenSymbol(selectedSymbol); // freeze/sync at toggle moment
      return !v;
    });
  }, [selectedSymbol, setFrozenSymbol, setIsLinked]);

  // Search states
  const [inputValue, setInputValue] = useState(effectiveSymbol || '');
  const [searchResults, setSearchResults] = useState<SymbolSearchResultDto[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setInputValue(value);
    setShowDropdown(true);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!value.trim()) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      try {
        const result = await searchSymbols({ query: value.trim(), isTickerOnly: false, pageIndex: 1, pageSize: 8 });
        setSearchResults(result.items || []);
      } catch { setSearchResults([]); }
    }, 300);
  }, []);

  const selectSymbol = useCallback((t: string) => {
    const upper = t.toUpperCase();
    setInputValue(upper);
    setShowDropdown(false);
    setSearchResults([]);
    if (isLinked) {
      setSelectedSymbol(upper);
    } else {
      setFrozenSymbol(upper);
    }
  }, [isLinked, setSelectedSymbol, setFrozenSymbol]);

  // Sync input from global store when linked
  useEffect(() => {
    if (isLinked && selectedSymbol) {
      setInputValue(selectedSymbol);
    }
  }, [isLinked, selectedSymbol]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [activePeriodTab, setActivePeriodTab] = useState<PeriodTab>('annual');
  const [activeGroupKey, setActiveGroupKey] = useState<IndicatorGroupKey>('balanceSheet');
  const [allData, setAllData] = useState<FinancialReportTableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);

  useEffect(() => {
    if (!effectiveSymbol) {
      setAllData([]);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setAllData([]);

    fetchFinancialReportsByTicker(effectiveSymbol)
      .then(({ items }) => {
        if (cancelled) {
          return;
        }

        setAllData(items);
        setPageOffset(0);
      })
      .catch(() => {
        if (!cancelled) {
          setAllData([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveSymbol]);

  useEffect(() => {
    setPageOffset(0);
  }, [activePeriodTab, activeGroupKey]);

  useEffect(() => {
    const element = moduleRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width;
      if (typeof nextWidth === 'number') {
        setModuleWidth(Math.round(nextWidth));
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const filteredData = useMemo(() => {
    return allData
      .filter((row) =>
        activePeriodTab === 'annual'
          ? row.period === FinancialPeriodType.YearToDate
          : row.period !== FinancialPeriodType.YearToDate
      )
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.period - b.period);
  }, [allData, activePeriodTab]);

  const totalPeriods = filteredData.length;
  const visibleColumnCount = moduleWidth > 0 && moduleWidth <= 340
    ? 2
    : moduleWidth > 0 && moduleWidth <= 430
      ? 3
      : 4;

  const isCompact = moduleWidth > 0 && moduleWidth <= 430;
  const maxOffset = Math.max(0, totalPeriods - visibleColumnCount);
  const startIndex = maxOffset - pageOffset;
  const visibleData = filteredData.slice(
    Math.max(0, startIndex),
    Math.max(0, startIndex) + visibleColumnCount
  );

  const canGoPrev = pageOffset < maxOffset;
  const canGoNext = pageOffset > 0;

  const activeGroup = useMemo(() => {
    return INDICATOR_GROUPS.find((group) => group.key === activeGroupKey) ?? INDICATOR_GROUPS[0];
  }, [activeGroupKey]);

  const showBillionUnitNote = activeGroupKey !== 'indicators';

  const chartData = useMemo(() => {
    return visibleData.map((row) => {
      const point: FinancialIndicatorChartDataPoint = {
        label: getPeriodLabel(row),
      };

      activeGroup.chartSeries.forEach((series) => {
        point[series.key] = toChartValue(series.getValue(row), series.format);
      });

      return point;
    });
  }, [visibleData, activeGroup]);

  const metricRows = useMemo<FinancialIndicatorMetricDisplayRow[]>(() => {
    return activeGroup.metrics
      .map((metric) => {
        const cells = visibleData.map((row) => {
          const raw = normalizeMetricValue(metric.getValue(row), showBillionUnitNote);

          return {
            key: row.id,
            text: formatMetricValue(raw, metric.format, { hideUnit: showBillionUnitNote }),
            tone: getMetricTone(raw, metric.format),
          };
        });

        return {
          key: metric.key,
          label: metric.label,
          cells,
        };
        })
        .filter((row) => row.cells.some((cell) => cell.text !== '—'));
      }, [activeGroup, showBillionUnitNote, visibleData]);

  const periodLabels = useMemo(() => visibleData.map((row) => getPeriodLabel(row)), [visibleData]);

  return (
    <div
      ref={moduleRef}
      className={`dashboard-module w-full h-full rounded-md sm:rounded-lg flex flex-col overflow-hidden text-xs sm:text-sm bg-cardBackground text-white`}
    >
      <div className="flex-none flex flex-col">
        <div className="flex items-center justify-center pt-1.5 pb-1 sm:pt-2">
          <div className="flex items-center gap-1.5">
            <div className="relative flex items-center justify-center">
              <svg width="220" height="30" viewBox="0 0 260 30" className="block sm:w-[260px]">
                <path d="M258 0C288 0 -28 0 3 0C34 0 49 30 84 30H180C215 30 226 0 258 0Z" fill="#4ADE80"/>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] sm:text-[12px] font-semibold text-black tracking-wide">
                Báo cáo tài chính
              </span>
            </div>
          </div>
        </div>

        {/* Symbol search + link toggle */}
        <div className="flex-none px-2 sm:px-3 pb-2" ref={searchRef}>
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <div className={`flex items-center gap-1 rounded border ${isDark ? 'border-gray-700 bg-cardBackground' : 'border-gray-200 bg-white'} focus-within:border-green-500 px-2 py-1 sm:py-1.5`}>
                <Search size={12} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                <input
                  value={inputValue}
                  onChange={e => handleSearchChange(e.target.value)}
                  onFocus={() => inputValue && setShowDropdown(true)}
                  onKeyDown={e => { if (e.key === 'Enter') selectSymbol(inputValue); }}
                  placeholder="Nhập mã CK..."
                  className={`flex-1 bg-transparent text-xs sm:text-sm outline-none ${isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'}`}
                />
                {inputValue && (
                  <button onClick={() => { setInputValue(''); setSearchResults([]); setShowDropdown(false); }}>
                    <X size={11} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                  </button>
                )}
              </div>
              {showDropdown && searchResults.length > 0 && (
                <div className={`absolute z-50 left-0 right-0 top-full mt-1 rounded border ${isDark ? 'border-gray-700 bg-[#252938]' : 'border-gray-200 bg-white'} shadow-lg max-h-[180px] sm:max-h-[220px] overflow-y-auto`}>
                  {searchResults.map(s => (
                    <button
                      key={s.ticker}
                      onMouseDown={() => selectSymbol(s.ticker)}
                      className={`w-full text-left px-2.5 sm:px-3 py-2 text-xs sm:text-sm flex gap-2 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                    >
                      <span className="font-bold text-[#22c55e] w-12 sm:w-14">{s.ticker}</span>
                      <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`}>{s.viCompanyName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Link toggle */}
            <button
              type="button"
              onClick={handleToggleLink}
              title={isLinked ? 'Đang đồng bộ mã — nhấn để tách biệt' : 'Đang tách biệt — nhấn để đồng bộ'}
              className={`flex-shrink-0 rounded p-1 transition-colors ${
                isLinked
                  ? 'text-green-400 hover:bg-green-500/15'
                  : `${isDark ? 'text-gray-500' : 'text-gray-400'} hover:bg-white/8`
              }`}
            >
              {isLinked ? <Link2 size={13} /> : <Link2Off size={13} />}
            </button>
          </div>
        </div>

        <FinancialIndicatorGroupTabs
          tabs={GROUP_TAB_ITEMS}
          activeTab={activeGroupKey}
          onSelectTab={(tab: string) => {
            const selectedGroup = INDICATOR_GROUPS.find((group) => group.key === tab);
            if (selectedGroup) {
              setActiveGroupKey(selectedGroup.key);
            }
          }}
          isDark={isDark}
          compact={isCompact}
        />
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {!effectiveSymbol ? (
          <div className={`flex h-full items-center justify-center text-[11px] sm:text-xs px-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Chọn một cổ phiếu để xem báo cáo tài chính
          </div>
        ) : loading ? (
          <div className={`flex h-full items-center justify-center text-[11px] sm:text-xs px-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Đang tải dữ liệu...
          </div>
        ) : filteredData.length === 0 ? (
          <div className={`flex h-full items-center justify-center text-[11px] sm:text-xs px-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Không có dữ liệu báo cáo tài chính
          </div>
        ) : (
          <>
            <div className="px-1.5 sm:px-2 pt-1.5 sm:pt-2 pb-1">
              <FinancialIndicatorChart
                chartType={activeGroup.chartType}
                data={chartData}
                series={activeGroup.chartSeries}
                isDark={isDark}
              />
            </div>

            {showBillionUnitNote && (
              <div className={`px-4 sm:px-6 pb-1 text-[11px] sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Đơn vị: tỷ đồng
              </div>
            )}

            <FinancialIndicatorPeriodNavigator
              activePeriodTab={activePeriodTab}
              onChangePeriodTab={setActivePeriodTab}
              periodLabels={periodLabels}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              onPrev={() => setPageOffset((prev) => Math.min(prev + 1, maxOffset))}
              onNext={() => setPageOffset((prev) => Math.max(prev - 1, 0))}
              isDark={isDark}
              compact={isCompact}
            />

            {metricRows.length > 0 ? (
              <FinancialIndicatorMetricsTable rows={metricRows} isDark={isDark} compact={isCompact} />
            ) : (
              <div className={`px-4 sm:px-6 pb-4 text-[11px] sm:text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Nhóm chỉ số này chưa có dữ liệu trong kỳ đã chọn.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
