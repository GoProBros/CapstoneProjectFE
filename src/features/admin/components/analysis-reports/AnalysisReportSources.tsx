'use client';

import { useState, useEffect, useCallback } from 'react';
import analysisReportService from '@/services/reports/analysisReportService';
import type {
    AnalysisReportSource,
    CreateAnalysisReportSourceRequest,
    UpdateAnalysisReportSourceRequest,
    GetAnalysisReportSourcesParams,
} from '@/types/analysisReport';
import { CommonStatus } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
type ModalMode = 'add' | 'edit' | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CommonStatus }) {
    return status === CommonStatus.Active ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Hoạt động
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
            Không hoạt động
        </span>
    );
}

function Spinner() {
    return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    );
}

/** Returns a validated absolute URL (http/https) or undefined for bare/invalid strings */
function ensureAbsoluteUrl(url: string): string | undefined {
    if (!url.trim()) return undefined;
    return /^https?:\/\//i.test(url) ? url : undefined;
}

// ─── Status Toggle ────────────────────────────────────────────────────────────

interface StatusToggleProps {
    source: AnalysisReportSource;
    onToggled: (updated: AnalysisReportSource) => void;
}

function StatusToggle({ source, onToggled }: StatusToggleProps) {
    const [loading, setLoading] = useState(false);
    const isActive = source.status === CommonStatus.Active;

    const handleToggle = async () => {
        setLoading(true);
        try {
            const newStatus = isActive ? CommonStatus.Inactive : CommonStatus.Active;
            const updated = await analysisReportService.updateSource(source.code, {
                name: source.name,
                description: source.description,
                website: source.website,
                logoUrl: source.logoUrl,
                status: newStatus,
            });
            onToggled(updated);
        } catch (err) {
            console.error('[StatusToggle] Failed to toggle status:', err);
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
                ${ isActive
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

// ─── Source Form Modal ────────────────────────────────────────────────────────

interface SourceFormModalProps {
    mode: ModalMode;
    source?: AnalysisReportSource;
    onClose: () => void;
    onSaved: () => void;
}

function SourceFormModal({ mode, source, onClose, onSaved }: SourceFormModalProps) {
    const isEdit = mode === 'edit';

    const [form, setForm] = useState({
        code: source?.code ?? '',
        name: source?.name ?? '',
        description: source?.description ?? '',
        website: source?.website ?? '',
        logoUrl: source?.logoUrl ?? '',
        status: source?.status ?? CommonStatus.Active,
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const set = (field: string, value: string | number) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!form.name.trim()) { setFormError('Tên nguồn không được để trống'); return; }
        if (!isEdit && !form.code.trim()) { setFormError('Mã nguồn không được để trống'); return; }

        setSaving(true);
        setFormError(null);
        try {
            if (isEdit && source) {
                const req: UpdateAnalysisReportSourceRequest = {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    website: form.website.trim() || undefined,
                    logoUrl: form.logoUrl.trim() || undefined,
                    status: form.status,
                };
                await analysisReportService.updateSource(source.code, req);
            } else {
                const req: CreateAnalysisReportSourceRequest = {
                    code: form.code.trim().toUpperCase(),
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    website: form.website.trim() || undefined,
                    logoUrl: form.logoUrl.trim() || undefined,
                };
                await analysisReportService.createSource(req);
            }
            onSaved();
            onClose();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {isEdit ? 'Chỉnh sửa nguồn báo cáo' : 'Thêm nguồn báo cáo mới'}
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

                    {/* Code — create only */}
                    {!isEdit && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Mã nguồn <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.code}
                                onChange={e => set('code', e.target.value)}
                                placeholder="VD: SSI, VCBS, MBS..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 uppercase tracking-widest"
                            />
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tên nguồn <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            placeholder="Tên công ty / tổ chức"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                        <textarea
                            rows={2}
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder="Mô tả ngắn về nguồn báo cáo"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                        />
                    </div>

                    {/* Website */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                        <input
                            type="url"
                            value={form.website}
                            onChange={e => set('website', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>

                    {/* Logo URL with preview */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Logo</label>
                        <div className="flex gap-2 items-center">
                            {form.logoUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={form.logoUrl}
                                    alt="logo preview"
                                    className="w-9 h-9 rounded object-contain bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shrink-0"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            )}
                            <input
                                type="url"
                                value={form.logoUrl}
                                onChange={e => set('logoUrl', e.target.value)}
                                placeholder="https://..."
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                            />
                        </div>
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
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        {saving && <Spinner />}
                        {isEdit ? 'Lưu thay đổi' : 'Thêm nguồn'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

interface DeleteDialogProps {
    source: AnalysisReportSource;
    onClose: () => void;
    onDeleted: () => void;
}

function DeleteDialog({ source, onClose, onDeleted }: DeleteDialogProps) {
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleDelete = async () => {
        setDeleting(true);
        setDeleteError(null);
        try {
            await analysisReportService.deleteSource(source.code);
            onDeleted();
            onClose();
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Không thể xóa nguồn');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Xóa nguồn báo cáo</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Hành động này không thể hoàn tác</p>
                    </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Bạn có chắc muốn xóa nguồn{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">{source.name}</span>{' '}
                    <span className="font-mono text-xs text-gray-500">({source.code})</span>?
                </p>

                {deleteError && (
                    <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                        {deleteError}
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        {deleting && <Spinner />}
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalysisReportSources() {
    const [sources, setSources] = useState<AnalysisReportSource[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageIndex, setPageIndex] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editingSource, setEditingSource] = useState<AnalysisReportSource | undefined>();
    const [deletingSource, setDeletingSource] = useState<AnalysisReportSource | undefined>();

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const fetchSources = useCallback(async (page: number, status: string) => {
        setLoading(true);
        setFetchError(null);
        try {
            const params: GetAnalysisReportSourcesParams = { pageIndex: page, pageSize: PAGE_SIZE };
            if (status !== '') params.status = Number(status) as CommonStatus;
            const result = await analysisReportService.getSources(params);
            setSources(result.items ?? []);
            setTotalCount(result.totalCount ?? 0);
        } catch (err) {
            setFetchError(err instanceof Error ? err.message : 'Không thể tải danh sách nguồn báo cáo');
            setSources([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSources(pageIndex, statusFilter);
    }, [fetchSources, pageIndex, statusFilter]);

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value);
        setPageIndex(1);
    };

    const openEdit = (source: AnalysisReportSource) => {
        setEditingSource(source);
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setEditingSource(undefined);
    };

    // Client-side search — API does not expose searchTerm for sources
    const filteredSources = sources.filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                        Quản lí nguồn báo cáo
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Các công ty chứng khoán và tổ chức cung cấp báo cáo phân tích
                        {!loading && (
                            <span className="ml-1.5 text-gray-400 dark:text-gray-500">• {totalCount} nguồn</span>
                        )}
                    </p>
                </div>
                <button
                    onClick={() => setModalMode('add')}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm nguồn
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo mã hoặc tên nguồn..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => handleStatusFilterChange(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value={String(CommonStatus.Active)}>Đang hoạt động</option>
                    <option value={String(CommonStatus.Inactive)}>Không hoạt động</option>
                </select>
            </div>

            {/* Fetch Error */}
            {fetchError && (
                <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
                    <span>{fetchError}</span>
                    <button onClick={() => fetchSources(pageIndex, statusFilter)} className="ml-4 underline text-sm shrink-0">
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
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Logo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mã</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên nguồn</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Website</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ngày tạo</th>
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
                            ) : filteredSources.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <div className="text-gray-400 dark:text-gray-500">
                                            <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <p className="text-sm">
                                                {searchQuery ? 'Không tìm thấy nguồn phù hợp' : 'Chưa có nguồn báo cáo nào'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSources.map(source => (
                                    <tr key={source.code} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        {/* Logo */}
                                        <td className="px-4 py-3">
                                            {source.logoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={source.logoUrl}
                                                    alt={source.name}
                                                    className="w-8 h-8 rounded object-contain bg-gray-100 dark:bg-gray-700"
                                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                                                    {source.code.charAt(0)}
                                                </div>
                                            )}
                                        </td>
                                        {/* Code */}
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white tracking-wide">
                                                {source.code}
                                            </span>
                                        </td>
                                        {/* Name + Description */}
                                        <td className="px-4 py-3 max-w-[220px]">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{source.name}</p>
                                            {source.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{source.description}</p>
                                            )}
                                        </td>
                                        {/* Website */}
                                        <td className="px-4 py-3 max-w-[160px]">
                                            {source.website ? (() => {
                                                const href = ensureAbsoluteUrl(source.website);
                                                return href ? (
                                                    <a
                                                        href={href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-500 hover:underline truncate block"
                                                        title={source.website}
                                                    >
                                                        {source.website.replace(/^https?:\/\//, '')}
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate block" title="URL không hợp lệ">
                                                        {source.website}
                                                    </span>
                                                );
                                            })() : (
                                                <span className="text-sm text-gray-400">—</span>
                                            )}
                                        </td>
                                        {/* Created At */}
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(source.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <StatusToggle
                                                source={source}
                                                onToggled={updated =>
                                                    setSources(prev => prev.map(s => s.code === updated.code ? updated : s))
                                                }
                                            />
                                        </td>
                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEdit(source)}
                                                    title="Chỉnh sửa"
                                                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeletingSource(source)}
                                                    title="Xóa"
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                            Trang {pageIndex} / {totalPages} &nbsp;·&nbsp; {totalCount} nguồn
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPageIndex(p => Math.max(1, p - 1))}
                                disabled={pageIndex <= 1}
                                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                ‹ Trước
                            </button>
                            <button
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

            {/* Modals */}
            {modalMode && (
                <SourceFormModal
                    mode={modalMode}
                    source={modalMode === 'edit' ? editingSource : undefined}
                    onClose={closeModal}
                    onSaved={() => fetchSources(pageIndex, statusFilter)}
                />
            )}
            {deletingSource && (
                <DeleteDialog
                    source={deletingSource}
                    onClose={() => setDeletingSource(undefined)}
                    onDeleted={() => {
                        const newPage = filteredSources.length === 1 && pageIndex > 1 ? pageIndex - 1 : pageIndex;
                        setPageIndex(newPage);
                        fetchSources(newPage, statusFilter);
                    }}
                />
            )}
        </div>
    );
}
