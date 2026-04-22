'use client';

import { RefreshCw } from 'lucide-react';
import { FinancialPeriodType } from '@/types/financialReport';
import { QuarterOption } from './types';

interface CreateFinancialReportFiltersPanelProps {
  ticker: string;
  selectedYear: number;
  selectedQuarter: FinancialPeriodType;
  yearOptions: number[];
  quarterOptions: QuarterOption[];
  fetching: boolean;
  creating: boolean;
  fetchError: string | null;
  createError: string | null;
  createSuccessMessage: string | null;
  onTickerChange: (value: string) => void;
  onYearChange: (value: number) => void;
  onQuarterChange: (value: FinancialPeriodType) => void;
  onFetchData: () => void;
  onClose: () => void;
}

export default function CreateFinancialReportFiltersPanel({
  ticker,
  selectedYear,
  selectedQuarter,
  yearOptions,
  quarterOptions,
  fetching,
  creating,
  fetchError,
  createError,
  createSuccessMessage,
  onTickerChange,
  onYearChange,
  onQuarterChange,
  onFetchData,
  onClose,
}: CreateFinancialReportFiltersPanelProps) {
  return (
    <div className="w-full md:w-[32%] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-6 md:p-8 flex flex-col justify-between gap-8">
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-[0.6875rem] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">
            Mã chứng khoán
          </label>
          <input
            value={ticker}
            onChange={(event) => onTickerChange(event.target.value.toUpperCase())}
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium outline-none uppercase"
            placeholder="VD: VNM, HPG..."
            type="text"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[0.6875rem] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">
            Năm báo cáo
          </label>
          <select
            value={selectedYear}
            onChange={(event) => onYearChange(Number(event.target.value))}
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 transition-all font-medium appearance-none outline-none"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[0.6875rem] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">
            Kỳ báo cáo
          </label>
          <select
            value={selectedQuarter}
            onChange={(event) => onQuarterChange(Number(event.target.value) as FinancialPeriodType)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 transition-all font-medium appearance-none outline-none"
          >
            {quarterOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={onFetchData}
          disabled={fetching || creating}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-5 h-5 ${fetching ? 'animate-spin' : ''}`} />
          <span>{fetching ? 'Đang lấy dữ liệu...' : 'Lấy dữ liệu'}</span>
        </button>

        <div className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2">
          Giá trị hiển thị ở bảng theo đơn vị <span className="font-bold">tỷ đồng</span>. Khi tạo báo cáo, hệ thống sẽ tự đổi về <span className="font-bold">đồng</span> để gửi API.
        </div>

        {fetchError && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {fetchError}
          </div>
        )}

        {createError && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {createError}
          </div>
        )}

        {createSuccessMessage && (
          <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-400">
            {createSuccessMessage}
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        disabled={creating}
        className="w-full py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
      >
        <span>Hủy bỏ</span>
      </button>
    </div>
  );
}
