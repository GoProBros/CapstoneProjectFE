'use client';

import { useCallback, useState } from 'react';
import fileService from '@/services/files/fileService';
import { FileCategory } from '@/types/file';
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
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [fileActionError, setFileActionError] = useState<string | null>(null);

  const handleViewFile = useCallback(async (report: FinancialReport) => {
    if (!report.filePath && !report.fileUrl) {
      return;
    }

    const previewWindow = window.open('about:blank', '_blank');
    if (!previewWindow) {
      setFileActionError('Trình duyệt đang chặn tab mới. Vui lòng cho phép popup để xem file ở tab riêng.');
      return;
    }

    previewWindow.document.title = 'Đang tải file...';
    previewWindow.document.body.innerHTML = '<p style="font-family: sans-serif; padding: 16px;">Đang tải file...</p>';

    setViewingReportId(report.id);
    setFileActionError(null);

    try {
      const blob = await fileService.downloadFile({
        category: FileCategory.FinancialReport,
        entityId: report.id,
      });

      const blobUrl = window.URL.createObjectURL(blob);
      if (previewWindow.closed) {
        window.URL.revokeObjectURL(blobUrl);
        setFileActionError('Tab xem file đã bị đóng trước khi tải xong. Vui lòng thử lại.');
        return;
      }

      previewWindow.location.href = blobUrl;

      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60_000);
    } catch (err) {
      if (!previewWindow.closed) {
        previewWindow.close();
      }
      setFileActionError(err instanceof Error ? err.message : 'Không thể mở file báo cáo.');
    } finally {
      setViewingReportId(null);
    }
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="relative min-h-[420px]">
        {fileActionError && !loading && (
          <div className="absolute top-0 left-0 right-0 z-30 px-4 py-3 text-sm text-red-600 dark:text-red-400 bg-red-50/95 dark:bg-red-900/30 border-b border-red-200 dark:border-red-900">
            {fileActionError}
          </div>
        )}

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
                  <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Ngày tạo</th>
                  <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">File</th>
                  <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const hasAttachedFile = Boolean(report.filePath || report.fileUrl);

                  return (
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
                        {formatDateTime(report.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm break-words">
                        {hasAttachedFile ? (
                          <button
                            type="button"
                            onClick={() => handleViewFile(report)}
                            disabled={viewingReportId === report.id}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            {viewingReportId === report.id ? 'Đang mở...' : 'Xem file'}
                          </button>
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
                  );
                })}
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
