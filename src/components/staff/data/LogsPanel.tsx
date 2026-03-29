import { useState } from 'react';
import { Search, TableProperties } from 'lucide-react';
import type { SystemLogItem } from '@/services/systemDataService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { FetchLogsArgs } from './types';
import { formatUtcToSystemTime, readLogValue } from './utils';

interface LogsPanelProps {
  selectedDate: string;
  level: string;
  searchTerm: string;
  logDates: string[];
  logs: SystemLogItem[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  isLoadingDates: boolean;
  isLoadingLogs: boolean;
  hasRequestedLogs: boolean;
  datesError: string | null;
  logsError: string | null;
  onDateChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onSearchTermChange: (value: string) => void;
  onSearch: () => void;
  onFetchLogs: (args: FetchLogsArgs) => void;
}

export default function LogsPanel({
  selectedDate,
  level,
  searchTerm,
  logDates,
  logs,
  pageIndex,
  totalPages,
  totalCount,
  isLoadingDates,
  isLoadingLogs,
  hasRequestedLogs,
  datesError,
  logsError,
  onDateChange,
  onLevelChange,
  onSearchTermChange,
  onSearch,
  onFetchLogs,
}: LogsPanelProps) {
  const safeLogDates = Array.isArray(logDates) ? logDates : [];
  const safeLogs = Array.isArray(logs) ? logs : [];
  const [selectedLog, setSelectedLog] = useState<SystemLogItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openLogDetail = (log: SystemLogItem) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const closeLogDetail = (isOpen: boolean) => {
    setIsDetailOpen(isOpen);
    if (!isOpen) {
      setSelectedLog(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <TableProperties className="w-5 h-5 text-slate-500 dark:text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Lịch sử log hệ thống</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Dữ liệu log được tải từ API theo bộ lọc, không hỗ trợ realtime streaming.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
            disabled={isLoadingDates}
          >
            <option value="">Tất cả ngày</option>
            {safeLogDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>

          <select
            value={level}
            onChange={(event) => onLevelChange(event.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
          >
            <option value="">Tất cả mức độ</option>
            <option value="Information">Information</option>
            <option value="Warning">Warning</option>
            <option value="Error">Error</option>
          </select>

          <div className="md:col-span-2 flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                placeholder="Tìm theo message..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              type="button"
              onClick={onSearch}
              className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90"
            >
              Tìm
            </button>
          </div>
        </div>

        {datesError && <p className="text-sm text-red-600 dark:text-red-300">{datesError}</p>}
      </div>

      <div className="p-6">
        {isLoadingLogs ? (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-300">
            Đang tải log hệ thống...
          </div>
        ) : !hasRequestedLogs ? (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-300">
            Chọn bộ lọc và bấm Tìm để tải danh sách log.
          </div>
        ) : logsError ? (
          <div className="py-8 text-center text-sm text-red-600 dark:text-red-300">{logsError}</div>
        ) : safeLogs.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-300">
            Không có dữ liệu log theo bộ lọc hiện tại.
          </div>
        ) : (
          <div className="space-y-3">
            {safeLogs.map((log, index) => {
              const rawTimestamp = readLogValue(log, ['timestamp', 'timeStamp', 'time', 'createdAt']);
              const timestamp = formatUtcToSystemTime(rawTimestamp);
              const logLevel = readLogValue(log, ['level', 'logLevel']);
              const message = readLogValue(log, ['message', 'renderedMessage']);

              return (
                <div
                  key={`${timestamp}-${index}`}
                  className="rounded-lg border border-slate-100 dark:border-slate-700 p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{timestamp}</p>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      {logLevel}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-100 mt-2">{message}</p>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => openLogDetail(log)}
                      className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="pt-2 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">Tổng bản ghi: {totalCount}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onFetchLogs({
                      nextPageIndex: pageIndex - 1,
                      nextDate: selectedDate,
                      nextLevel: level,
                      nextSearchTerm: searchTerm,
                    })
                  }
                  disabled={pageIndex <= 1 || isLoadingLogs}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200 disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Trang {pageIndex}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onFetchLogs({
                      nextPageIndex: pageIndex + 1,
                      nextDate: selectedDate,
                      nextLevel: level,
                      nextSearchTerm: searchTerm,
                    })
                  }
                  disabled={pageIndex >= totalPages || isLoadingLogs}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={closeLogDetail}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Chi tiết log hệ thống</DialogTitle>
          </DialogHeader>

          <div className="overflow-auto rounded-lg border border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900">
            <pre className="text-xs leading-5 whitespace-pre-wrap break-words text-slate-700 dark:text-slate-200">
              {selectedLog ? JSON.stringify(selectedLog, null, 2) : '--'}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
