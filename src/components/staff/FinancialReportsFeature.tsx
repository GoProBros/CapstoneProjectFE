'use client';

import { useCallback, useEffect, useState } from 'react';
import { FilePlus } from 'lucide-react';
import { fetchFinancialReportsList } from '@/services/financialReportService';
import { FinancialPeriodType, FinancialReport, FinancialReportStatus } from '@/types/financialReport';
import {
    CreateFinancialReportModal,
    FinancialReportDetailModal,
    FinancialReportsList,
} from './financial-reports';

export default function FinancialReportsFeature() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [detailReportId, setDetailReportId] = useState<string | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [reports, setReports] = useState<FinancialReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageIndex, setPageIndex] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasPreviousPage, setHasPreviousPage] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<FinancialPeriodType | ''>('');
    const [selectedStatus, setSelectedStatus] = useState<FinancialReportStatus | ''>('');
    const [selectedYear, setSelectedYear] = useState<number | ''>('');

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 11 }, (_, index) => currentYear - index);

    const handlePreviousPage = useCallback(() => {
        setPageIndex((prev) => Math.max(prev - 1, 1));
    }, []);

    const handleNextPage = useCallback(() => {
        setPageIndex((prev) => prev + 1);
    }, []);

    const handleOpenDetail = useCallback((reportId: string) => {
        setDetailReportId(reportId);
        setIsDetailOpen(true);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setIsDetailOpen(false);
        setDetailReportId(null);
    }, []);

    const loadReports = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetchFinancialReportsList({
                pageIndex,
                pageSize: 10,
                period: selectedPeriod === '' ? undefined : selectedPeriod,
                status: selectedStatus === '' ? undefined : selectedStatus,
                year: selectedYear === '' ? undefined : selectedYear,
            });

            // Keep API order as-is; do not sort on frontend.
            setReports(response.items ?? []);
            setTotalPages(response.totalPages || 1);
            setHasPreviousPage(response.hasPreviousPage);
            setHasNextPage(response.hasNextPage);
        } catch (err) {
            setReports([]);
            setTotalPages(1);
            setHasPreviousPage(false);
            setHasNextPage(false);
            setError(err instanceof Error ? err.message : 'Không thể tải danh sách báo cáo tài chính.');
        } finally {
            setLoading(false);
        }
    }, [pageIndex, selectedPeriod, selectedStatus, selectedYear]);

    const handleCreatedReport = useCallback(async () => {
        setPageIndex(1);

        setLoading(true);
        setError(null);

        try {
            const response = await fetchFinancialReportsList({
                pageIndex: 1,
                pageSize: 10,
                period: selectedPeriod === '' ? undefined : selectedPeriod,
                status: selectedStatus === '' ? undefined : selectedStatus,
                year: selectedYear === '' ? undefined : selectedYear,
            });

            setReports(response.items ?? []);
            setTotalPages(response.totalPages || 1);
            setHasPreviousPage(response.hasPreviousPage);
            setHasNextPage(response.hasNextPage);
        } catch (err) {
            setReports([]);
            setTotalPages(1);
            setHasPreviousPage(false);
            setHasNextPage(false);
            setError(err instanceof Error ? err.message : 'Không thể tải danh sách báo cáo tài chính.');
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, selectedStatus, selectedYear]);

    useEffect(() => {
        setPageIndex(1);
    }, [selectedPeriod, selectedStatus, selectedYear]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-headline mb-2">
                        Quản lý Báo Cáo Tài Chính
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                        Quản lý và kiểm duyệt các báo cáo tài chính doanh nghiệp
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-8 py-2.5 rounded-lg bg-[linear-gradient(135deg,#000011_0%,#0d1c32_100%)] text-white text-sm font-bold inline-flex items-center gap-2"
                >
                    <FilePlus className="w-4 h-4" />
                    Thêm báo cáo
                </button>
            </div>

            {/* Stats */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số báo cáo</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">---</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Đang chờ duyệt</p>
                    <p className="text-2xl font-bold text-orange-500 mt-1">---</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Đã xuất bản</p>
                    <p className="text-2xl font-bold text-green-500 mt-1">---</p>
                </div>
            </div> */}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                        value={selectedPeriod}
                        onChange={(event) => {
                            const value = event.target.value;
                            setSelectedPeriod(value === '' ? '' : Number(value) as FinancialPeriodType);
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Kỳ báo cáo (Period)</option>
                        <option value={FinancialPeriodType.FirstQuarter}>Quý 1</option>
                        <option value={FinancialPeriodType.SecondQuarter}>Quý 2</option>
                        <option value={FinancialPeriodType.ThirdQuarter}>Quý 3</option>
                        <option value={FinancialPeriodType.FourthQuarter}>Quý 4</option>
                        <option value={FinancialPeriodType.YearToDate}>Cả năm</option>
                    </select>
                    <select
                        value={selectedStatus}
                        onChange={(event) => {
                            const value = event.target.value;
                            setSelectedStatus(value === '' ? '' : Number(value) as FinancialReportStatus);
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Trạng thái (Status)</option>
                        <option value={FinancialReportStatus.Pending}>Chờ xử lý</option>
                        <option value={FinancialReportStatus.Processing}>Đang xử lý</option>
                        <option value={FinancialReportStatus.Completed}>Hoàn thành</option>
                        <option value={FinancialReportStatus.Failed}>Thất bại</option>
                        <option value={FinancialReportStatus.Archived}>Lưu trữ</option>
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(event) => {
                            const value = event.target.value;
                            setSelectedYear(value === '' ? '' : Number(value));
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Năm (Year)</option>
                        {yearOptions.map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            <FinancialReportsList
                reports={reports}
                loading={loading}
                error={error}
                pageIndex={pageIndex}
                totalPages={totalPages}
                hasPreviousPage={hasPreviousPage}
                hasNextPage={hasNextPage}
                onPreviousPage={handlePreviousPage}
                onNextPage={handleNextPage}
                onViewDetail={handleOpenDetail}
            />

            <CreateFinancialReportModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={handleCreatedReport}
            />

            <FinancialReportDetailModal
                reportId={detailReportId}
                isOpen={isDetailOpen}
                onClose={handleCloseDetail}
                onUpdated={loadReports}
            />
        </div>
    );
}
