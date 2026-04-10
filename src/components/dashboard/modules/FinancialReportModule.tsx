"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';
import { fetchFinancialReportsByTicker } from '@/services/financialReportService';
import type { FinancialReportTableRow } from '@/types/financialReport';

const BILLION = 1_000_000_000;

type ReportType = 'income' | 'balance' | 'cashflow';

interface MetricRow {
  key: string;
  label: string;
  getValue: (r: FinancialReportTableRow) => number;
}

const incomeMetrics: MetricRow[] = [
  { key: 'netRevenue', label: 'Doanh thu thuần', getValue: r => r.netRevenue ?? 0 },
  { key: 'grossProfit', label: 'Lợi nhuận gộp', getValue: r => r.grossProfit ?? 0 },
  { key: 'operatingProfit', label: 'Lợi nhuận hoạt động', getValue: r => r.operatingProfit ?? 0 },
  { key: 'profitBeforeTax', label: 'Lợi nhuận trước thuế', getValue: r => r.profitBeforeTax },
  { key: 'netProfit', label: 'Lợi nhuận sau thuế', getValue: r => r.netProfit },
  { key: 'netInterestIncome', label: 'Thu nhập lãi thuần', getValue: r => r.netInterestIncome ?? 0 },
  { key: 'serviceFeeIncome', label: 'Lợi nhuận từ dịch vụ', getValue: r => r.serviceFeeIncome ?? 0 },
  { key: 'tradingIncome', label: 'Thu nhập từ kinh doanh', getValue: r => r.tradingIncome ?? 0 },
];

const balanceMetrics: MetricRow[] = [
  { key: 'totalAssets', label: 'Tổng tài sản', getValue: r => r.totalAssets },
  { key: 'shortTermAssets', label: 'Tài sản ngắn hạn', getValue: r => r.shortTermAssets },
  { key: 'longTermAssets', label: 'Tài sản dài hạn', getValue: r => r.longTermAssets },
  { key: 'totalLiabilities', label: 'Nợ phải trả', getValue: r => r.totalLiabilities },
  { key: 'totalEquity', label: 'Vốn chủ sở hữu', getValue: r => r.totalEquity },
  { key: 'contributedCapital', label: 'Vốn điều lệ', getValue: r => r.contributedCapital ?? 0 },
  { key: 'retainedEarnings', label: 'Lợi nhuận chưa phân phối', getValue: r => r.retainedEarnings ?? 0 },
];

const cashflowMetrics: MetricRow[] = [
  { key: 'operatingCashFlow', label: 'Dòng tiền hoạt động kinh doanh', getValue: r => r.operatingCashFlow },
  { key: 'investingCashFlow', label: 'Dòng tiền hoạt động đầu tư', getValue: r => r.investingCashFlow },
  { key: 'financingCashFlow', label: 'Dòng tiền hoạt động tài chính', getValue: r => r.financingCashFlow },
  { key: 'netCashFlow', label: 'Dòng tiền thuần', getValue: r => r.netCashFlow },
  { key: 'freeCashFlow', label: 'Dòng tiền tự do', getValue: r => r.operatingCashFlow + r.investingCashFlow },
];

export default function FinancialReportModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const selectedSymbol = useSelectedSymbolStore((s) => s.selectedSymbol);

  const [activeTab, setActiveTab] = useState<'annual' | 'quarterly'>('annual');
  const [reportType, setReportType] = useState<ReportType>('income');
  const [allData, setAllData] = useState<FinancialReportTableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);

  useEffect(() => {
    if (!selectedSymbol) return;
    setLoading(true);
    setAllData([]);
    fetchFinancialReportsByTicker(selectedSymbol)
      .then(({ items }) => {
        setAllData(items);
        setPageOffset(0);
      })
      .catch(() => setAllData([]))
      .finally(() => setLoading(false));
  }, [selectedSymbol]);

  useEffect(() => {
    setPageOffset(0);
  }, [activeTab, reportType]);

  const filteredData = useMemo(() => {
    return allData
      .filter(r => (activeTab === 'annual' ? r.period === 5 : r.period !== 5))
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.period - b.period);
  }, [allData, activeTab]);

  const totalPeriods = filteredData.length;
  const maxOffset = Math.max(0, totalPeriods - 4);
  const startIndex = maxOffset - pageOffset;
  const visibleData = filteredData.slice(Math.max(0, startIndex), Math.max(0, startIndex) + 4);

  const canGoPrev = pageOffset < maxOffset;
  const canGoNext = pageOffset > 0;

  const chartData = useMemo(() => {
    if (reportType === 'income') {
      return visibleData.map(r => ({
        label: r.periodLabel,
        'Doanh thu thuần': parseFloat(((r.netRevenue ?? 0) / BILLION).toFixed(2)),
        'Lợi nhuận gộp': parseFloat(((r.grossProfit ?? 0) / BILLION).toFixed(2)),
        'Lợi nhuận sau thuế': parseFloat((r.netProfit / BILLION).toFixed(2)),
      }));
    }
    if (reportType === 'balance') {
      return visibleData.map(r => ({
        label: r.periodLabel,
        'Tổng tài sản': parseFloat((r.totalAssets / BILLION).toFixed(2)),
        'Vốn điều lệ': parseFloat(((r.contributedCapital ?? 0) / BILLION).toFixed(2)),
        'Vốn chủ sở hữu': parseFloat((r.totalEquity / BILLION).toFixed(2)),
      }));
    }
    return visibleData.map(r => ({
      label: r.periodLabel,
      'Dòng tiền KD': parseFloat((r.operatingCashFlow / BILLION).toFixed(2)),
      'Dòng tiền ĐT': parseFloat((r.investingCashFlow / BILLION).toFixed(2)),
      'Dòng tiền tự do': parseFloat(((r.operatingCashFlow + r.investingCashFlow) / BILLION).toFixed(2)),
    }));
  }, [visibleData, reportType]);

  const currentMetrics = reportType === 'income' ? incomeMetrics
    : reportType === 'balance' ? balanceMetrics
    : cashflowMetrics;

  const activeMetrics = currentMetrics.filter(metric =>
    visibleData.some(r => metric.getValue(r) !== 0)
  );

  const btnBase = 'rounded-md px-3 py-1 border border-transparent text-sm';
  const btnActive = 'bg-accentGreen text-black';
  const btnInactive = isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600';

  const navBtnBase = 'rounded-full text-xs p-[0.175rem] shadow-sm ring-1 ring-inset inline-flex items-center';
  const navBtnEnabled = isDark
    ? 'text-gray-200 bg-gray-800 ring-gray-700 hover:bg-gray-700 cursor-pointer'
    : 'text-gray-700 bg-white ring-gray-300 hover:bg-gray-50 cursor-pointer';
  const navBtnDisabled = isDark
    ? 'text-gray-500 bg-gray-800 ring-gray-700 cursor-not-allowed opacity-50'
    : 'text-gray-400 bg-gray-100 ring-gray-300 cursor-not-allowed opacity-50';

  return (
    <div className={`dashboard-module w-full h-full rounded-2xl flex flex-col overflow-hidden text-sm ${
      isDark ? 'bg-moduleBackground text-white' : 'bg-white text-gray-900'
    }`}>
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

        <div className="flex items-center justify-center gap-2 px-4 pb-2 mt-[6px] overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 whitespace-nowrap">
            <button onClick={() => setReportType('income')} className={`${btnBase} ${reportType === 'income' ? btnActive : btnInactive}`}>
              Kết quả kinh doanh
            </button>
            <button onClick={() => setReportType('balance')} className={`${btnBase} ${reportType === 'balance' ? btnActive : btnInactive}`}>
              Bảng cân đối kế toán
            </button>
            <button onClick={() => setReportType('cashflow')} className={`${btnBase} ${reportType === 'cashflow' ? btnActive : btnInactive}`}>
              Bảng dòng tiền
            </button>
          </div>
        </div>
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
            Không có dữ liệu báo cáo
          </div>
        ) : (
          <>
            <div className="px-2 pt-2 pb-1">
              <ResponsiveContainer width="100%" height={185}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <XAxis dataKey="label" stroke="#e0e0e0" tick={{ fill: isDark ? '#ccc' : '#555', fontSize: 10 }} />
                  <YAxis stroke="#e0e0e0" tick={{ fill: isDark ? '#ccc' : '#555', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isDark ? '#424242' : '#fff', border: 'none', borderRadius: '4px' }}
                    labelStyle={{ color: isDark ? '#fff' : '#000' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '4px', color: isDark ? '#fff' : '#333' }} iconType="square" />
                  {reportType === 'income' ? (
                    <>
                      <Bar dataKey="Doanh thu thuần" fill="#84cc16" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Lợi nhuận gộp" fill="#22c55e" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Lợi nhuận sau thuế" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </>
                  ) : reportType === 'balance' ? (
                    <>
                      <Bar dataKey="Tổng tài sản" fill="#84cc16" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Vốn điều lệ" fill="#22c55e" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Vốn chủ sở hữu" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </>
                  ) : (
                    <>
                      <Bar dataKey="Dòng tiền KD" fill="#84cc16" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Dòng tiền ĐT" fill="#22c55e" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Dòng tiền tự do" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="px-6 pt-1">
              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab('annual')}
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'annual' ? 'bg-accentGreen text-black' : isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Hàng Năm
                  </button>
                  <button
                    onClick={() => setActiveTab('quarterly')}
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'quarterly' ? 'bg-accentGreen text-black' : isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Hàng Quý
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 -left-4 flex items-center">
                    <button
                      type="button"
                      onClick={() => setPageOffset(p => Math.min(p + 1, maxOffset))}
                      disabled={!canGoPrev}
                      className={`${navBtnBase} ${canGoPrev ? navBtnEnabled : navBtnDisabled}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-2 text-center">
                    {visibleData.map(r => (
                      <div key={r.id} className={`font-semibold text-xs w-14 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {r.periodLabel}
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-y-0 -right-4 flex items-center">
                    <button
                      type="button"
                      onClick={() => setPageOffset(p => Math.max(p - 1, 0))}
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

            <div className="px-6 pb-4">
              {activeMetrics.map(metric => (
                <div key={metric.key} className="flex justify-between items-center py-0.5">
                  <div className={`flex-shrink-0 w-36 text-sm leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {metric.label}
                  </div>
                  <div className="flex gap-2 text-center">
                    {visibleData.map(r => {
                      const raw = metric.getValue(r);
                      const display = raw === 0 ? '—' : (raw / BILLION).toFixed(1);
                      return (
                        <div
                          key={r.id}
                          className={`w-14 text-sm ${raw < 0 ? 'text-red-400' : isDark ? 'text-white' : 'text-gray-900'}`}
                        >
                          {display}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
