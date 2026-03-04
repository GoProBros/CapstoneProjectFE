'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import analysisReportService from '@/services/analysisReportService';
import UploadFileModal from '@/components/ui/UploadFileModal';
import { getSectors } from '@/services/sectorService';
import { fileService } from '@/services/fileService';
import type {
    AnalysisReport,
    AnalysisReportSource,
    AnalysisReportCategory,
    CreateAnalysisReportRequest,
    UpdateAnalysisReportRequest,
    GetAnalysisReportsParams,
} from '@/types/analysisReport';
import type { Sector } from '@/types';
import { CommonStatus } from '@/types';
import { FileCategory } from '@/types/file';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
type ModalMode = 'add' | 'edit' | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Spinner() {
    return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    );
}

/** Parse comma-separated tickers string into an array, filtering empty entries */
function parseTickers(raw: string): string[] {
    return raw.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
}

/** Format tickers array to comma-separated string for display in input */
function formatTickers(tickers?: string[]): string {
    return (tickers ?? []).join(', ');
}

// ─── Status Toggle ────────────────────────────────────────────────────────────

interface ReportStatusToggleProps {
    report: AnalysisReport;
    onToggled: (updated: AnalysisReport) => void;
}

function ReportStatusToggle({ report, onToggled }: ReportStatusToggleProps) {
    const [loading, setLoading] = useState(false);
    const isActive = report.status === CommonStatus.Active;

    const handleToggle = async () => {
        setLoading(true);
        try {
            const newStatus = isActive ? CommonStatus.Inactive : CommonStatus.Active;
            const req: UpdateAnalysisReportRequest = {
                sourceId: report.sourceId,
                categoryId: report.categoryId,
                title: report.title,
                description: report.description,
                tickers: report.tickers,
                publishDate: report.publishDate,
                status: newStatus,
            };
            const updated = await analysisReportService.updateReport(report.id, req);
            onToggled(updated);
        } catch (err) {
            console.error('[ReportStatusToggle] Failed to toggle status:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            disabled={loading}
            title={isActive ? 'Đang hoạt động — nhấn để tắt' : 'Không hoạt động — nhấn để bật'}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-1
                ${isActive
                    ? 'bg-green-500 focus:ring-green-400'
                    : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-400'
                }`}
        >
            {loading ? (
                <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-3 h-3 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                </span>
            ) : (
                <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        isActive ? 'translate-x-[18px]' : 'translate-x-0.5'
                    }`}
                />
            )}
        </button>
    );
}

// ─── Report Form Modal ────────────────────────────────────────────────────────

interface ReportFormModalProps {
    mode: ModalMode;
    report?: AnalysisReport;
    allSources: AnalysisReportSource[];
    allCategories: AnalysisReportCategory[];
    allSectors: Sector[];
    onClose: () => void;
    /** Called after a successful EDIT save */
    onSaved: () => void;
    /** Called after a successful CREATE, with the newly created report */
    onCreated: (report: AnalysisReport) => void;
}

function ReportFormModal({ mode, report, allSources, allCategories, allSectors, onClose, onSaved, onCreated }: ReportFormModalProps) {
    const isEdit = mode === 'edit';

    const [form, setForm] = useState({
        sourceId: report?.sourceId ?? '',
        categoryId: report?.categoryId ?? '',
        sectorId: report?.sectorId ?? '',
        title: report?.title ?? '',
        description: report?.description ?? '',
        tickers: formatTickers(report?.tickers),
        publishDate: report?.publishDate
            ? new Date(report.publishDate).toISOString().split('T')[0]
            : '',
        status: report?.status ?? CommonStatus.Active,
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const mouseDownOnBackdrop = useRef(false);

    const set = (field: string, value: string | number) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!form.sourceId) { setFormError('Vui lòng chọn nguồn báo cáo'); return; }
        if (!form.categoryId) { setFormError('Vui lòng chọn phân loại'); return; }
        if (!form.title.trim()) { setFormError('Tiêu đề không được để trống'); return; }

        setSaving(true);
        setFormError(null);
        try {
            const tickerArr = parseTickers(form.tickers);
            if (isEdit && report) {
                const req: UpdateAnalysisReportRequest = {
                    sourceId: form.sourceId,
                    categoryId: form.categoryId,
                    sectorId: form.sectorId || undefined,
                    title: form.title.trim(),
                    description: form.description.trim() || undefined,
                    tickers: tickerArr.length > 0 ? tickerArr : undefined,
                    publishDate: form.publishDate ? new Date(form.publishDate).toISOString() : undefined,
                    status: form.status,
                };
                await analysisReportService.updateReport(report.id, req);
                onSaved();
                onClose();
            } else {
                const req: CreateAnalysisReportRequest = {
                    sourceId: form.sourceId,
                    categoryId: form.categoryId,
                    sectorId: form.sectorId || undefined,
                    title: form.title.trim(),
                    description: form.description.trim() || undefined,
                    tickers: tickerArr.length > 0 ? tickerArr : undefined,
                    publishDate: form.publishDate ? new Date(form.publishDate).toISOString() : undefined,
                };
                const created = await analysisReportService.createReport(req);
                // Close form first, then parent opens upload modal
                onClose();
                onCreated(created);
            }
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onMouseDown={e => { mouseDownOnBackdrop.current = e.target === backdropRef.current; }}
            onMouseUp={e => { if (mouseDownOnBackdrop.current && e.target === backdropRef.current) onClose(); mouseDownOnBackdrop.current = false; }}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {isEdit ? 'Chỉnh sửa báo cáo phân tích' : 'Thêm báo cáo phân tích mới'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    {formError && (
                        <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                            {formError}
                        </div>
                    )}

                    {/* Source */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nguồn báo cáo <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.sourceId}
                            onChange={e => set('sourceId', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">-- Chọn nguồn --</option>
                            {allSources.map(s => (
                                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                            ))}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Phân loại <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.categoryId}
                            onChange={e => set('categoryId', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">-- Chọn phân loại --</option>
                            {allCategories.map(c => (
                                <option key={c.code} value={c.code}>{c.name} (Cấp {c.level})</option>
                            ))}
                        </select>
                    </div>

                    {/* Sector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngành</label>
                        <select
                            value={form.sectorId}
                            onChange={e => set('sectorId', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">-- Chọn ngành (không bắt buộc) --</option>
                            {allSectors.map(s => (
                                <option key={s.id} value={s.id}>{s.viName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tiêu đề <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                            placeholder="Tiêu đề báo cáo"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                        <textarea
                            rows={3}
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder="Tóm tắt nội dung báo cáo"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                        />
                    </div>

                    {/* Tickers */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mã chứng khoán
                            <span className="ml-1 font-normal text-gray-400 text-xs">(cách nhau bằng dấu phẩy)</span>
                        </label>
                        <input
                            type="text"
                            value={form.tickers}
                            onChange={e => set('tickers', e.target.value)}
                            placeholder="VD: VNM, HPG, VIC"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 uppercase"
                        />
                    </div>

                    {/* Publish Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày xuất bản</label>
                        <input
                            type="date"
                            value={form.publishDate}
                            onChange={e => set('publishDate', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Status — edit only */}
                    {isEdit && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
                            <select
                                value={form.status}
                                onChange={e => set('status', Number(e.target.value))}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value={CommonStatus.Active}>Đang hoạt động</option>
                                <option value={CommonStatus.Inactive}>Không hoạt động</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        {saving && <Spinner />}
                        {isEdit ? 'Lưu thay đổi' : 'Thêm báo cáo'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Report Detail Modal ──────────────────────────────────────────────────────

interface ReportDetailModalProps {
    report: AnalysisReport;
    sourceName: string;
    categoryName: string;
    sectorName?: string;
    onClose: () => void;
}

function ReportDetailModal({ report, sourceName, categoryName, sectorName, onClose }: ReportDetailModalProps) {
    const backdropRef = useRef<HTMLDivElement>(null);
    const mouseDownOnBackdrop = useRef(false);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await fileService.downloadFileToDevice(
                { category: FileCategory.AnalysisReport, entityId: report.id },
                report.originalFileName ?? 'report',
            );
        } catch (err) {
            console.error('[ReportDetailModal] Failed to download file:', err);
        } finally {
            setDownloading(false);
        }
    };

    // Use fileSize as the reliable indicator — filePath/originalFileName may be empty strings from API
    const hasFile = (report.fileSize ?? 0) > 0;

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onMouseDown={e => { mouseDownOnBackdrop.current = e.target === backdropRef.current; }}
            onMouseUp={e => { if (mouseDownOnBackdrop.current && e.target === backdropRef.current) onClose(); mouseDownOnBackdrop.current = false; }}
        >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Chi tiết báo cáo</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    {/* Title */}
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tiêu đề</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{report.title}</p>
                    </div>

                    {/* Description */}
                    {report.description && (
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Mô tả</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{report.description}</p>
                        </div>
                    )}

                    {/* Meta grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Nguồn</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{sourceName}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Phân loại</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{categoryName}</p>
                        </div>
                        {sectorName && (
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Ngành</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{sectorName}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Ngày xuất bản</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {report.publishDate ? new Date(report.publishDate).toLocaleDateString('vi-VN') : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Trạng thái</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                report.status === CommonStatus.Active
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                                {report.status === CommonStatus.Active ? 'Đang hoạt động' : 'Không hoạt động'}
                            </span>
                        </div>
                    </div>

                    {/* File info */}
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tài liệu đính kèm</p>
                        {hasFile ? (
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={downloading}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm text-purple-600 dark:text-purple-400 disabled:opacity-50 w-full text-left"
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="flex-1 truncate font-medium">
                                    {report.originalFileName || 'Tải tài liệu'}
                                </span>
                                {downloading ? (
                                    <Spinner />
                                ) : (
                                    <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                )}
                            </button>
                        ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">Chưa có tài liệu đính kèm</p>
                        )}
                    </div>

                    {/* Tickers */}
                    {report.tickers && report.tickers.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Mã chứng khoán</p>
                            <div className="flex flex-wrap gap-1.5">
                                {report.tickers.map(t => (
                                    <span key={t} className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}



                    {/* Timestamps */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Ngày tạo</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(report.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                        {report.updatedAt && (
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Cập nhật lần cuối</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(report.updatedAt).toLocaleString('vi-VN')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalysisReportsList() {
    const [reports, setReports] = useState<AnalysisReport[]>([]);
    const [allSources, setAllSources] = useState<AnalysisReportSource[]>([]);
    const [allCategories, setAllCategories] = useState<AnalysisReportCategory[]>([]);
    const [allSectors, setAllSectors] = useState<Sector[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageIndex, setPageIndex] = useState(1);

    // Filters (server-side)
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceIdFilter, setSourceIdFilter] = useState('');
    const [categoryIdFilter, setCategoryIdFilter] = useState('');

    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editingReport, setEditingReport] = useState<AnalysisReport | undefined>();
    const [viewingReport, setViewingReport] = useState<AnalysisReport | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    // Report awaiting file upload after creation
    const [pendingUploadReport, setPendingUploadReport] = useState<AnalysisReport | null>(null);
    const [publishingAfterUpload, setPublishingAfterUpload] = useState(false);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    // Lookup helpers
    const getSourceName = (id: string) => allSources.find(s => s.code === id)?.name ?? id;
    const getCategoryName = (id: string) => allCategories.find(c => c.code === id)?.name ?? id;

    const fetchReports = useCallback(async (
        page: number,
        term: string,
        sourceId: string,
        categoryId: string,
    ) => {
        setLoading(true);
        setFetchError(null);
        try {
            const params: GetAnalysisReportsParams = {
                pageIndex: page,
                pageSize: PAGE_SIZE,
            };
            if (term) params.searchTerm = term;
            if (sourceId) params.sourceId = sourceId;
            if (categoryId) params.categoryId = categoryId;

            const result = await analysisReportService.getReports(params);
            setReports(result.items ?? []);
            setTotalCount(result.totalCount ?? 0);
        } catch (err) {
            setFetchError(err instanceof Error ? err.message : 'Không thể tải danh sách báo cáo phân tích');
            setReports([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch all sources/categories/sectors once (for dropdown options)
    const fetchDropdownData = useCallback(async () => {
        const [sourcesResult, categoriesResult, sectorsResult] = await Promise.allSettled([
            analysisReportService.getSources({ pageIndex: 1, pageSize: 100 }),
            analysisReportService.getCategories({ pageIndex: 1, pageSize: 100 }),
            getSectors({ pageIndex: 1, pageSize: 100 }),
        ]);
        if (sourcesResult.status === 'fulfilled') {
            setAllSources(sourcesResult.value.items ?? []);
        } else {
            console.error('[AnalysisReportsList] Failed to load sources for filter:', sourcesResult.reason);
        }
        if (categoriesResult.status === 'fulfilled') {
            setAllCategories(categoriesResult.value.items ?? []);
        } else {
            console.error('[AnalysisReportsList] Failed to load categories for filter:', categoriesResult.reason);
        }
        if (sectorsResult.status === 'fulfilled' && sectorsResult.value.isSuccess) {
            setAllSectors(sectorsResult.value.data?.items ?? []);
        } else {
            console.error('[AnalysisReportsList] Failed to load sectors:', sectorsResult.status === 'rejected' ? sectorsResult.reason : 'API error');
        }
    }, []);

    useEffect(() => {
        fetchReports(pageIndex, searchTerm, sourceIdFilter, categoryIdFilter);
    }, [fetchReports, pageIndex, searchTerm, sourceIdFilter, categoryIdFilter]);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    // Auto-search with debounce when searchInput changes
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput);
            setPageIndex(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleSourceFilterChange = (val: string) => {
        setSourceIdFilter(val);
        setPageIndex(1);
    };

    const handleCategoryFilterChange = (val: string) => {
        setCategoryIdFilter(val);
        setPageIndex(1);
    };

    const openEdit = (report: AnalysisReport) => {
        setEditingReport(report);
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setEditingReport(undefined);
    };

    /**
     * Called after a new report is successfully created.
     * Opens the upload modal so staff can attach a file (optional),
     * and refreshes the report list immediately.
     */
    const handleReportCreated = (created: AnalysisReport) => {
        setPendingUploadReport(created);
        fetchReports(1, searchTerm, sourceIdFilter, categoryIdFilter);
        setPageIndex(1);
    };

    /**
     * Called after a file is successfully uploaded for the pending report.
     * Automatically publishes the report by setting status → Active.
     */
    const handleUploadDone = async () => {
        if (!pendingUploadReport) return;
        setPublishingAfterUpload(true);
        try {
            const req: UpdateAnalysisReportRequest = {
                sourceId: pendingUploadReport.sourceId,
                categoryId: pendingUploadReport.categoryId,
                title: pendingUploadReport.title,
                description: pendingUploadReport.description,
                tickers: pendingUploadReport.tickers,
                publishDate: pendingUploadReport.publishDate,
                status: CommonStatus.Active,
            };
            const updated = await analysisReportService.updateReport(pendingUploadReport.id, req);
            // Update the row already in the list
            setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
        } catch (err) {
            console.error('[AnalysisReportsList] Failed to publish after upload:', err);
        } finally {
            setPublishingAfterUpload(false);
            setPendingUploadReport(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                        Quản lí báo cáo phân tích
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Danh sách các báo cáo nghiên cứu và phân tích thị trường
                        {!loading && (
                            <span className="ml-1.5 text-gray-400 dark:text-gray-500">• {totalCount} báo cáo</span>
                        )}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setModalMode('add')}
                    className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm báo cáo
                </button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[220px]">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Tìm theo tiêu đề..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>

                {/* Source filter */}
                <select
                    value={sourceIdFilter}
                    onChange={e => handleSourceFilterChange(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="">Tất cả nguồn</option>
                    {allSources.map(s => (
                        <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                </select>

                {/* Category filter */}
                <select
                    value={categoryIdFilter}
                    onChange={e => handleCategoryFilterChange(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="">Tất cả phân loại</option>
                    {allCategories.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Fetch Error */}
            {fetchError && (
                <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
                    <span>{fetchError}</span>
                    <button
                        type="button"
                        onClick={() => fetchReports(pageIndex, searchTerm, sourceIdFilter, categoryIdFilter)}
                        className="ml-4 underline text-sm shrink-0"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tiêu đề</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nguồn</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phân loại</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mã CK</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ngày xuất bản</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <div className="text-gray-400 dark:text-gray-500">
                                            <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-sm">
                                                {searchTerm || sourceIdFilter || categoryIdFilter
                                                    ? 'Không tìm thấy báo cáo phù hợp'
                                                    : 'Chưa có báo cáo phân tích nào'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reports.map(report => (
                                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        {/* Title + Description */}
                                        <td className="px-4 py-3 max-w-[260px]">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug">
                                                {report.title}
                                            </p>
                                            {report.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                    {report.description}
                                                </p>
                                            )}
                                        </td>
                                        {/* Source */}
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                {getSourceName(report.sourceId)}
                                            </span>
                                        </td>
                                        {/* Category */}
                                        <td className="px-4 py-3 max-w-[160px]">
                                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">
                                                {getCategoryName(report.categoryId)}
                                            </span>
                                        </td>
                                        {/* Tickers */}
                                        <td className="px-4 py-3">
                                            {report.tickers && report.tickers.length > 0 ? (
                                                <div className="flex flex-wrap gap-1 max-w-[140px]">
                                                    {report.tickers.slice(0, 4).map(ticker => (
                                                        <span
                                                            key={ticker}
                                                            className="inline-block px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                                        >
                                                            {ticker}
                                                        </span>
                                                    ))}
                                                    {report.tickers.length > 4 && (
                                                        <span className="inline-block px-1.5 py-0.5 rounded text-xs text-gray-400">
                                                            +{report.tickers.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">—</span>
                                            )}
                                        </td>
                                        {/* Publish Date */}
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {report.publishDate
                                                ? new Date(report.publishDate).toLocaleDateString('vi-VN')
                                                : <span className="text-gray-400">—</span>}
                                        </td>
                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <ReportStatusToggle
                                                report={report}
                                                onToggled={updated =>
                                                    setReports(prev => prev.map(r => r.id === updated.id ? updated : r))
                                                }
                                            />
                                        </td>
                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        setLoadingDetail(true);
                                                        try {
                                                            const detail = await analysisReportService.getReportById(report.id);
                                                            setViewingReport(detail);
                                                        } catch (err) {
                                                            console.error('[AnalysisReportsList] Failed to load detail:', err);
                                                        } finally {
                                                            setLoadingDetail(false);
                                                        }
                                                    }}
                                                    disabled={loadingDetail}
                                                    title="Xem chi tiết"
                                                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingUploadReport(report)}
                                                    title="Upload tài liệu"
                                                    className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(report)}
                                                    title="Chỉnh sửa"
                                                    className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Trang {pageIndex} / {totalPages} &nbsp;·&nbsp; {totalCount} báo cáo
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPageIndex(p => Math.max(1, p - 1))}
                                disabled={pageIndex <= 1}
                                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                ‹ Trước
                            </button>
                            <button
                                type="button"
                                onClick={() => setPageIndex(p => Math.min(totalPages, p + 1))}
                                disabled={pageIndex >= totalPages}
                                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Sau ›
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Form Modal (create / edit) */}
            {modalMode && (
                <ReportFormModal
                    mode={modalMode}
                    report={modalMode === 'edit' ? editingReport : undefined}
                    allSources={allSources}
                    allCategories={allCategories}
                    allSectors={allSectors}
                    onClose={closeModal}
                    onSaved={() => fetchReports(pageIndex, searchTerm, sourceIdFilter, categoryIdFilter)}
                    onCreated={handleReportCreated}
                />
            )}

            {/* Detail modal */}
            {viewingReport && (
                <ReportDetailModal
                    report={viewingReport}
                    sourceName={getSourceName(viewingReport.sourceId)}
                    categoryName={getCategoryName(viewingReport.categoryId)}
                    sectorName={viewingReport.sectorId ? (allSectors.find(s => s.id === viewingReport.sectorId)?.viName ?? viewingReport.sectorId) : undefined}
                    onClose={() => setViewingReport(null)}
                />
            )}

            {/* Upload file modal — shown after a new report is created */}
            {pendingUploadReport && (
                <UploadFileModal
                    entityId={pendingUploadReport.id}
                    category={FileCategory.AnalysisReport}
                    entityLabel={pendingUploadReport.title}
                    onClose={() => setPendingUploadReport(null)}
                    onUploaded={handleUploadDone}
                />
            )}

            {/* Full-screen publishing overlay shown while auto-publishing after upload */}
            {publishingAfterUpload && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-5 flex items-center gap-3 shadow-xl">
                        <Spinner />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Đang xuất bản báo cáo...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
