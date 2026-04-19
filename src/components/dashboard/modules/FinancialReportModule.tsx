"use client";

import React, { useEffect, useMemo, useState } from 'react';
import FinancialIndicatorChart, {
  type FinancialIndicatorChartDataPoint,
} from '@/components/dashboard/modules/FinancialReport/FinancialIndicatorChart';
import FinancialIndicatorGroupTabs, {
  type FinancialIndicatorGroupTabItem,
} from '@/components/dashboard/modules/FinancialReport/FinancialIndicatorGroupTabs';
import FinancialIndicatorMetricsTable, {
  type FinancialIndicatorMetricDisplayRow,
} from '@/components/dashboard/modules/FinancialReport/FinancialIndicatorMetricsTable';
import FinancialIndicatorPeriodNavigator from '@/components/dashboard/modules/FinancialReport/FinancialIndicatorPeriodNavigator';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchFinancialReportIndicatorsByTicker } from '@/services/financial/financialReportService';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';
import {
  FinancialPeriodType,
  type FinancialReportIndicatorListItem,
} from '@/types/financialReport';

type PeriodTab = 'annual' | 'quarterly';
type IndicatorGroupKey = 'profitability' | 'growth' | 'financialHealth' | 'efficiencyCashflow';
type MetricFormat = 'percent' | 'ratio' | 'percent_signed';
type ChartType = 'line' | 'bar';

interface IndicatorMetricDefinition {
  key: string;
  label: string;
  format: MetricFormat;
  getValue: (row: FinancialReportIndicatorListItem) => number | null | undefined;
  showComparisonType?: boolean;
}

interface IndicatorChartSeriesDefinition {
  key: string;
  label: string;
  color: string;
  format: MetricFormat;
  getValue: (row: FinancialReportIndicatorListItem) => number | null | undefined;
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

const INDICATOR_GROUPS: IndicatorGroupDefinition[] = [
  {
    key: 'profitability',
    label: 'Sinh lời',
    description: 'Công ty kiếm tiền tốt không?',
    chartType: 'line',
    chartSeries: [
      { key: 'roe', label: 'ROE', color: '#84cc16', format: 'percent', getValue: (row) => row.indicatorData?.profitability?.roe },
      { key: 'netMargin', label: 'Biên LN ròng', color: '#22c55e', format: 'percent', getValue: (row) => row.indicatorData?.profitability?.netMargin },
      { key: 'grossMargin', label: 'Biên LN gộp', color: '#10b981', format: 'percent', getValue: (row) => row.indicatorData?.profitability?.grossMargin },
    ],
    metrics: [
      { key: 'roe', label: 'ROE', format: 'percent', getValue: (row) => row.indicatorData?.profitability?.roe },
      { key: 'roa', label: 'ROA', format: 'percent', getValue: (row) => row.indicatorData?.profitability?.roa },
      { key: 'grossMargin', label: 'Biên LN gộp', format: 'percent', getValue: (row) => row.indicatorData?.profitability?.grossMargin },
      { key: 'operatingProfitMargin', label: 'Biên LN hoạt động', format: 'percent', getValue: (row) => row.indicatorData?.profitability?.operatingProfitMargin },
      { key: 'netMargin', label: 'Biên LN ròng', format: 'percent', getValue: (row) => row.indicatorData?.profitability?.netMargin },
      { key: 'returnOnFixedAssets', label: 'LN trên TSCĐ', format: 'percent', getValue: (row) => row.indicatorData?.profitability?.returnOnFixedAssets },
    ],
  },
  {
    key: 'growth',
    label: 'Tăng trưởng',
    description: 'Công ty có đang phát triển không?',
    accent: 'growth',
    chartType: 'bar',
    chartSeries: [
      { key: 'revenueGrowth', label: 'Tăng trưởng doanh thu', color: '#10b981', format: 'percent_signed', getValue: (row) => row.indicatorData?.growth?.revenueGrowth },
      { key: 'grossProfitGrowth', label: 'Tăng trưởng LN gộp', color: '#22c55e', format: 'percent_signed', getValue: (row) => row.indicatorData?.growth?.grossProfitGrowth },
    ],
    metrics: [
      {
        key: 'revenueGrowth',
        label: 'Tăng trưởng doanh thu',
        format: 'percent_signed',
        getValue: (row) => row.indicatorData?.growth?.revenueGrowth,
        showComparisonType: true,
      },
      {
        key: 'grossProfitGrowth',
        label: 'Tăng trưởng LN gộp',
        format: 'percent_signed',
        getValue: (row) => row.indicatorData?.growth?.grossProfitGrowth,
        showComparisonType: true,
      },
    ],
  },
  {
    key: 'financialHealth',
    label: 'Sức khỏe tài chính',
    description: 'Có rủi ro tài chính không?',
    accent: 'risk',
    chartType: 'line',
    chartSeries: [
      { key: 'debtToEquity', label: 'Nợ/Vốn chủ (D/E)', color: '#f59e0b', format: 'ratio', getValue: (row) => row.indicatorData?.liquidityAndSolvency?.debtToEquity },
      { key: 'currentRatio', label: 'Thanh toán hiện hành', color: '#f97316', format: 'ratio', getValue: (row) => row.indicatorData?.liquidityAndSolvency?.currentRatio },
    ],
    metrics: [
      { key: 'debtToEquity', label: 'Nợ/Vốn chủ (D/E)', format: 'ratio', getValue: (row) => row.indicatorData?.liquidityAndSolvency?.debtToEquity },
      { key: 'debtRatio', label: 'Nợ/Tổng tài sản', format: 'percent', getValue: (row) => row.indicatorData?.liquidityAndSolvency?.debtRatio },
      { key: 'longTermDebtRatio', label: 'Nợ dài hạn/Tài sản', format: 'percent', getValue: (row) => row.indicatorData?.liquidityAndSolvency?.longTermDebtRatio },
      { key: 'currentRatio', label: 'Thanh toán hiện hành', format: 'ratio', getValue: (row) => row.indicatorData?.liquidityAndSolvency?.currentRatio },
      { key: 'quickRatio', label: 'Thanh toán nhanh', format: 'ratio', getValue: (row) => row.indicatorData?.liquidityAndSolvency?.quickRatio },
      { key: 'cashRatio', label: 'Hệ số tiền mặt', format: 'ratio', getValue: (row) => row.indicatorData?.liquidityAndSolvency?.cashRatio },
      { key: 'interestCoverageRatio', label: 'Khả năng trả lãi', format: 'ratio', getValue: (row) => row.indicatorData?.liquidityAndSolvency?.interestCoverageRatio },
    ],
  },
  {
    key: 'efficiencyCashflow',
    label: 'Hiệu quả & Dòng tiền',
    description: 'Vận hành hiệu quả và tiền có thật không?',
    chartType: 'line',
    chartSeries: [
      { key: 'totalAssetTurnover', label: 'Vòng quay tài sản', color: '#14b8a6', format: 'ratio', getValue: (row) => row.indicatorData?.efficiency?.totalAssetTurnover },
      { key: 'operatingCashFlowToNetProfit', label: 'Dòng tiền/LN ròng', color: '#06b6d4', format: 'ratio', getValue: (row) => row.indicatorData?.cashFlow?.operatingCashFlowToNetProfit },
    ],
    metrics: [
      { key: 'totalAssetTurnover', label: 'Vòng quay tài sản', format: 'ratio', getValue: (row) => row.indicatorData?.efficiency?.totalAssetTurnover },
      { key: 'inventoryTurnover', label: 'Vòng quay tồn kho', format: 'ratio', getValue: (row) => row.indicatorData?.efficiency?.inventoryTurnover },
      { key: 'operatingCashFlowToNetProfit', label: 'Dòng tiền/LN ròng', format: 'ratio', getValue: (row) => row.indicatorData?.cashFlow?.operatingCashFlowToNetProfit },
    ],
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

  if (format === 'ratio') {
    return Number(value.toFixed(3));
  }

  return Number((value * 100).toFixed(2));
}

function formatMetricValue(value: number | null | undefined, format: MetricFormat): string {
  if (!isNumber(value)) {
    return '—';
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

function getMetricTone(
  value: number | null | undefined,
  format: MetricFormat
): 'default' | 'positive' | 'negative' {
  if (!isNumber(value) || format !== 'percent_signed') {
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

function getPeriodLabel(row: FinancialReportIndicatorListItem): string {
  if (row.period === FinancialPeriodType.YearToDate) {
    return `Năm ${row.year}`;
  }

  return `Q${row.period}/${row.year}`;
}

export default function FinancialReportModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const selectedSymbol = useSelectedSymbolStore((s) => s.selectedSymbol);

  const [activePeriodTab, setActivePeriodTab] = useState<PeriodTab>('annual');
  const [activeGroupKey, setActiveGroupKey] = useState<IndicatorGroupKey>('profitability');
  const [allData, setAllData] = useState<FinancialReportIndicatorListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);

  useEffect(() => {
    if (!selectedSymbol) {
      setAllData([]);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setAllData([]);

    fetchFinancialReportIndicatorsByTicker(selectedSymbol)
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
  }, [selectedSymbol]);

  useEffect(() => {
    setPageOffset(0);
  }, [activePeriodTab, activeGroupKey]);

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
  const maxOffset = Math.max(0, totalPeriods - 4);
  const startIndex = maxOffset - pageOffset;
  const visibleData = filteredData.slice(Math.max(0, startIndex), Math.max(0, startIndex) + 4);

  const canGoPrev = pageOffset < maxOffset;
  const canGoNext = pageOffset > 0;

  const activeGroup = useMemo(() => {
    return INDICATOR_GROUPS.find((group) => group.key === activeGroupKey) ?? INDICATOR_GROUPS[0];
  }, [activeGroupKey]);

  const growthComparisonType = useMemo(() => {
    const comparisonType = visibleData.find((row) => row.indicatorData?.growth?.comparisonType)
      ?.indicatorData?.growth?.comparisonType;

    if (comparisonType) {
      return comparisonType;
    }

    return activePeriodTab === 'annual' ? 'YoY' : 'QoQ';
  }, [visibleData, activePeriodTab]);

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
        const label = metric.showComparisonType
          ? `${metric.label} (${growthComparisonType})`
          : metric.label;

        const cells = visibleData.map((row) => {
          const raw = metric.getValue(row);

          return {
            key: row.id,
            text: formatMetricValue(raw, metric.format),
            tone: getMetricTone(raw, metric.format),
          };
        });

        return {
          key: metric.key,
          label,
          cells,
        };
      })
      .filter((row) => row.cells.some((cell) => cell.text !== '—'));
  }, [activeGroup, visibleData, growthComparisonType]);

  const periodLabels = useMemo(() => visibleData.map((row) => getPeriodLabel(row)), [visibleData]);

  return (
    <div className={`dashboard-module w-full h-full rounded-lg flex flex-col overflow-hidden text-sm bg-moduleBackground text-white `}>
      <div className="flex-none flex flex-col">
        <div className="flex items-center justify-center pt-1.5 pb-1">
          <div className="relative flex items-center justify-center">
            <svg width="260" height="30" viewBox="0 0 260 30" className="block">
              <path d="M258 0C288 0 -28 0 3 0C34 0 49 30 84 30H180C215 30 226 0 258 0Z" fill="#4ADE80"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-black tracking-wide">
              Báo cáo tài chính
            </span>
          </div>
        </div>

        <FinancialIndicatorGroupTabs
          tabs={GROUP_TAB_ITEMS}
          activeTab={activeGroupKey}
          onSelectTab={(tab) => {
            const selectedGroup = INDICATOR_GROUPS.find((group) => group.key === tab);
            if (selectedGroup) {
              setActiveGroupKey(selectedGroup.key);
            }
          }}
          isDark={isDark}
        />
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {!selectedSymbol ? (
          <div className={`flex h-full items-center justify-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Chọn một cổ phiếu để xem báo cáo tài chính
          </div>
        ) : loading ? (
          <div className={`flex h-full items-center justify-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Đang tải dữ liệu...
          </div>
        ) : filteredData.length === 0 ? (
          <div className={`flex h-full items-center justify-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Không có dữ liệu chỉ số tài chính
          </div>
        ) : (
          <>
            <div className="px-2 pt-2 pb-1">
              <FinancialIndicatorChart
                chartType={activeGroup.chartType}
                data={chartData}
                series={activeGroup.chartSeries}
                isDark={isDark}
              />
            </div>

            <FinancialIndicatorPeriodNavigator
              activePeriodTab={activePeriodTab}
              onChangePeriodTab={setActivePeriodTab}
              periodLabels={periodLabels}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              onPrev={() => setPageOffset((prev) => Math.min(prev + 1, maxOffset))}
              onNext={() => setPageOffset((prev) => Math.max(prev - 1, 0))}
              isDark={isDark}
            />

            {metricRows.length > 0 ? (
              <FinancialIndicatorMetricsTable rows={metricRows} isDark={isDark} />
            ) : (
              <div className={`px-6 pb-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Nhóm chỉ số này chưa có dữ liệu trong kỳ đã chọn.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
