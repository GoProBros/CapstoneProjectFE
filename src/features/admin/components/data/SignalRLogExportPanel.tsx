'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Radio, RefreshCw } from 'lucide-react';
import frontendSystemLogService from '@/services/frontendSystemLogService';

const toDatetimeLocalValue = (date: Date): string => {
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 16);
};

const getDefaultStartRange = (): string => {
  const date = new Date();
  date.setHours(date.getHours() - 1);
  return toDatetimeLocalValue(date);
};

const getDefaultEndRange = (): string => toDatetimeLocalValue(new Date());

const parseToIso = (value: string): string | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
};

export default function SignalRLogExportPanel() {
  const [startTime, setStartTime] = useState<string>(getDefaultStartRange);
  const [endTime, setEndTime] = useState<string>(getDefaultEndRange);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'signalr' | 'console'>('signalr');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'info' | 'error'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  const startIso = parseToIso(startTime);
  const endIso = parseToIso(endTime);

  const isInvalidRange = Boolean(startIso && endIso && new Date(startIso) > new Date(endIso));

  const source = sourceFilter === 'all' ? undefined : sourceFilter;

  const refreshCounts = useCallback(async () => {
    if (isInvalidRange) {
      return;
    }

    setIsLoading(true);
    try {
      const [allLogs, filteredLogs] = await Promise.all([
        frontendSystemLogService.queryLogs({ source }),
        frontendSystemLogService.queryLogs({
          startIso,
          endIso,
          source,
        }),
      ]);

      setTotalCount(allLogs.count);
      setFilteredCount(filteredLogs.count);
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'Không thể tải thống kê log từ file hệ thống.');
    } finally {
      setIsLoading(false);
    }
  }, [endIso, isInvalidRange, source, startIso]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  const handleDownload = async () => {
    if (isInvalidRange) {
      setMessageType('error');
      setMessage('Khoảng thời gian không hợp lệ: thời điểm bắt đầu phải nhỏ hơn hoặc bằng thời điểm kết thúc.');
      return;
    }

    setIsLoading(true);
    try {
      const count = await frontendSystemLogService.downloadLogs({
        startIso,
        endIso,
        source,
      });
      setMessageType('info');
      setMessage(`Đã tải file log từ hệ thống (${count} bản ghi).`);
      setFilteredCount(count);
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'Không thể tải file log từ hệ thống.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="w-5 h-5 text-slate-500 dark:text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Frontend SignalR Hub Log</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Trích log theo khoảng thời gian từ file log hệ thống frontend lưu trong project theo ngày.
        </p>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Từ thời gian</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Đến thời gian</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nguồn log</label>
          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value as 'all' | 'signalr' | 'console')}
            className="w-full md:w-64 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
          >
            <option value="signalr">SignalR</option>
            <option value="console">Console</option>
            <option value="all">Tất cả</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
          <span>Tổng log trong file hệ thống: {totalCount}</span>
          <span>Số log theo khoảng thời gian: {filteredCount}</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90"
          >
            <Download className="w-4 h-4" />
            Tải file log JSON
          </button>
          <button
            type="button"
            onClick={() => void refreshCounts()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới thống kê
          </button>
        </div>

        {isInvalidRange && (
          <p className="text-sm text-red-600 dark:text-red-300">
            Khoảng thời gian không hợp lệ: thời điểm bắt đầu phải nhỏ hơn hoặc bằng thời điểm kết thúc.
          </p>
        )}

        {message && (
          <p className={`text-sm ${messageType === 'error' ? 'text-red-600 dark:text-red-300' : 'text-slate-600 dark:text-slate-300'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
