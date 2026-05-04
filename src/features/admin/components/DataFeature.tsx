'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { DataFetchTaskType, SystemLogItem } from '@/types/systemData';
import systemDataService from '@/services/admin/systemDataService';
import DataTaskCard from '@/features/admin/components/data/DataTaskCard';
import LogsPanel from '@/features/admin/components/data/LogsPanel';
import { dataTasks, DEFAULT_PAGE_SIZE } from '@/features/admin/components/data/constants';
import type { FetchLogsArgs, TaskStatus } from '@/features/admin/components/data/types';

export function DataFeature() {
    const [taskStatusMap, setTaskStatusMap] = useState<Record<DataFetchTaskType, TaskStatus>>({
        'import-sectors': 'idle',
        'import-symbols': 'idle',
        'map-symbols-sectors': 'idle',
        'import-index-constituents': 'idle',
    });
    const [taskResultMap, setTaskResultMap] = useState<Record<DataFetchTaskType, string | null>>({
        'import-sectors': null,
        'import-symbols': null,
        'map-symbols-sectors': null,
        'import-index-constituents': null,
    });

    const [logDates, setLogDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [level, setLevel] = useState('');

    const [logs, setLogs] = useState<SystemLogItem[]>([]);
    const [pageIndex, setPageIndex] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [isLoadingDates, setIsLoadingDates] = useState(false);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [datesError, setDatesError] = useState<string | null>(null);
    const [logsError, setLogsError] = useState<string | null>(null);
    const [hasRequestedLogs, setHasRequestedLogs] = useState(false);

    const fetchLogDates = useCallback(async () => {
        try {
            setIsLoadingDates(true);
            setDatesError(null);

            const dates = await systemDataService.getLogDates();
            setLogDates(dates);

            setSelectedDate((previous) => {
                if (previous || dates.length === 0) {
                    return previous;
                }

                return dates[0];
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể tải danh sách ngày log';
            setDatesError(message);
        } finally {
            setIsLoadingDates(false);
        }
    }, []);

    const fetchLogs = useCallback(async ({
        nextPageIndex,
        nextDate,
        nextLevel,
        nextSearchTerm,
    }: FetchLogsArgs) => {
        try {
            setHasRequestedLogs(true);
            setIsLoadingLogs(true);
            setLogsError(null);

            const logData = await systemDataService.getSystemLogs({
                date: nextDate || undefined,
                pageIndex: nextPageIndex,
                pageSize: DEFAULT_PAGE_SIZE,
                searchTerm: nextSearchTerm || undefined,
                level: nextLevel || undefined,
            });

            setLogs(logData.items ?? []);
            setPageIndex(logData.pageIndex || nextPageIndex);
            setTotalPages(logData.totalPages || 1);
            setTotalCount(logData.totalCount || 0);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể tải dữ liệu log';
            setLogsError(message);
            setLogs([]);
            setTotalCount(0);
            setTotalPages(1);
        } finally {
            setIsLoadingLogs(false);
        }
    }, []);

    useEffect(() => {
        fetchLogDates();
    }, [fetchLogDates]);

    const handleRunTask = async (taskId: DataFetchTaskType) => {
        try {
            setTaskStatusMap((previous) => ({ ...previous, [taskId]: 'loading' }));
            setTaskResultMap((previous) => ({ ...previous, [taskId]: 'Đang gọi API fetch dữ liệu...' }));

            const message = await systemDataService.runDataFetchTask(taskId);

            setTaskStatusMap((previous) => ({ ...previous, [taskId]: 'success' }));
            setTaskResultMap((previous) => ({ ...previous, [taskId]: message || 'Thao tác hoàn tất thành công.' }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Fetch dữ liệu thất bại';
            setTaskStatusMap((previous) => ({ ...previous, [taskId]: 'failed' }));
            setTaskResultMap((previous) => ({ ...previous, [taskId]: message }));
        }
    };

    const handleSearchLogs = () => {
        fetchLogs({
            nextPageIndex: 1,
            nextDate: selectedDate,
            nextLevel: level,
            nextSearchTerm: searchTerm,
        });
    };

    const handleRefreshLogs = async () => {
        await fetchLogDates();
        await fetchLogs({
            nextPageIndex: 1,
            nextDate: selectedDate,
            nextLevel: level,
            nextSearchTerm: searchTerm,
        });
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-headline mb-2">
                        Quản lý dữ liệu
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                        Thực thi fetching dữ liệu hệ thống, xem lịch sử log theo ngày.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleRefreshLogs}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 dark:bg-slate-700 text-slate-100 dark:text-slate-100 rounded-md font-medium text-sm hover:bg-gray-800 dark:hover:bg-slate-800 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Tải lại log
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {dataTasks.map((task) => (
                    <DataTaskCard
                        key={task.id}
                        {...task}
                        taskStatus={taskStatusMap[task.id]}
                        taskResult={taskResultMap[task.id]}
                        onRun={handleRunTask}
                    />
                ))}
            </div>

            <LogsPanel
                selectedDate={selectedDate}
                level={level}
                searchTerm={searchTerm}
                logDates={logDates}
                logs={logs}
                pageIndex={pageIndex}
                totalPages={totalPages}
                totalCount={totalCount}
                isLoadingDates={isLoadingDates}
                isLoadingLogs={isLoadingLogs}
                hasRequestedLogs={hasRequestedLogs}
                datesError={datesError}
                logsError={logsError}
                onDateChange={setSelectedDate}
                onLevelChange={setLevel}
                onSearchTermChange={setSearchTerm}
                onSearch={handleSearchLogs}
                onFetchLogs={fetchLogs}
            />
        </div>
    );
}
