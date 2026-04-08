'use client';

import { FilePlus, RefreshCw } from 'lucide-react';
import { FinancialPeriodType } from '@/types/financialReport';
import { QuarterOption } from './types';

interface CreateFinancialReportInitStepProps {
  ticker: string;
  selectedYear: number;
  selectedQuarter: FinancialPeriodType;
  yearOptions: number[];
  quarterOptions: QuarterOption[];
  initializing: boolean;
  onTickerChange: (value: string) => void;
  onYearChange: (value: number) => void;
  onQuarterChange: (value: FinancialPeriodType) => void;
  onCancel: () => void;
  onContinue: () => void;
}

export default function CreateFinancialReportInitStep({
  ticker,
  selectedYear,
  selectedQuarter,
  yearOptions,
  quarterOptions,
  initializing,
  onTickerChange,
  onYearChange,
  onQuarterChange,
  onCancel,
  onContinue,
}: CreateFinancialReportInitStepProps) {
  return (
    <>
      <div className="px-6 py-6 space-y-6 overflow-y-auto">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Mã cổ phiếu
          </label>
          <input
            value={ticker}
            onChange={(event) => onTickerChange(event.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold outline-none focus:border-emerald-500"
            placeholder="Nhập mã (VD: VCB, FPT...)"
            type="text"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Năm báo cáo
            </label>
            <select
              value={selectedYear}
              onChange={(event) => onYearChange(Number(event.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold outline-none focus:border-emerald-500"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Kỳ báo cáo
            </label>
            <select
              value={selectedQuarter}
              onChange={(event) => onQuarterChange(Number(event.target.value) as FinancialPeriodType)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold outline-none focus:border-emerald-500"
            >
              {quarterOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/80 dark:bg-blue-900/20 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
          Khi nhấn Tiếp tục, hệ thống mở bước nhập dữ liệu để bạn chọn lấy dữ liệu online hoặc upload file local và nhập thủ công trước khi tạo báo cáo.
        </div>
      </div>

      <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 bg-white dark:bg-gray-800 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={initializing}
          className="px-8 py-2.5 rounded-lg bg-[linear-gradient(135deg,#000000_0%,#0d1c32_100%)] text-white text-sm font-bold disabled:opacity-60 inline-flex items-center gap-2"
        >
          {initializing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />}
          {initializing ? 'Đang khởi tạo...' : 'Tiếp tục'}
        </button>
      </div>
    </>
  );
}
