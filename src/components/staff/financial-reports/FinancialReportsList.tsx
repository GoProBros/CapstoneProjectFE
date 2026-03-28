'use client';

import { FinancialReport } from '@/types/financialReport';
import { formatDateTime, getPeriodLabel, getStatusClass, getStatusLabel } from './reportPresentation';

interface FinancialReportsListProps {
  reports: FinancialReport[];
  loading: boolean;
  error: string | null;
  pageIndex: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onViewDetail: (reportId: string) => void;
}

export default function FinancialReportsList({
  reports,
  loading,
  error,
  pageIndex,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPreviousPage,
  onNextPage,
  onViewDetail,
}: FinancialReportsListProps) {
  const showEmpty = !loading && !error && reports.length === 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="relative min-h-[420px]">
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {showEmpty && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-gray-500 dark:text-gray-400">
            Chưa có báo cáo tài chính.
          </div>
        )}

        {!error && reports.length > 0 && (
          <div className="overflow-hidden">
            <table className="w-full table-fixed">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
                  <th className="w-[11%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Mã CK</th>
                  <th className="w-[17%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Kỳ báo cáo</th>
                  <th className="w-[16%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Trạng thái</th>
                  <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Cập nhật</th>
                  <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">File</th>
                  <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 dark:border-gray-700/60 last:border-0">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white break-words">{report.ticker}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 break-words">
                      {getPeriodLabel(report.year, report.period)}
                    </td>
                    <td className="px-4 py-3 text-sm break-words">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(report.status)}`}>
                        {getStatusLabel(report.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 break-words">
                      {formatDateTime(report.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm break-words">
                      {report.fileUrl ? (
                        <a
                          href={report.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          Xem file
                        </a>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Không có</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm break-words">
                      <button
                        type="button"
                        onClick={() => onViewDetail(report.id)}
                        className="px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-[1px]">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Đang tải danh sách báo cáo...</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Trang {pageIndex} / {Math.max(totalPages, 1)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={loading || !hasPreviousPage}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={loading || !hasNextPage}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
