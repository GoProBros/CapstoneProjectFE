'use client';

import { useState, useEffect, useCallback } from 'react';
import analysisReportService from '@/services/reports/analysisReportService';
import type {
    AnalysisReportCategory,
    CreateAnalysisReportCategoryRequest,
    GetAnalysisReportCategoriesParams,
} from '@/types/analysisReport';
import { CommonStatus } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const MAX_LEVEL = 3;

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

function LevelBadge({ level }: { level: number }) {
    const colors: Record<number, string> = {
        1: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
        2: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        3: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[level] ?? 'bg-gray-100 text-gray-600'}`}>
            Cấp {level}
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

// ─── Create Category Modal ────────────────────────────────────────────────────

interface CreateCategoryModalProps {
    allCategories: AnalysisReportCategory[];
    onClose: () => void;
    onSaved: () => void;
}

const EMPTY_FORM = {
    code: '',
    name: '',
    description: '',
    level: 1,
    parentId: '',
};

function CreateCategoryModal({ allCategories, onClose, onSaved }: CreateCategoryModalProps) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const set = (field: string, value: string | number) =>
        setForm(prev => ({ ...prev, [field]: value }));

    // When level changes, reset parentId if no longer valid
    const handleLevelChange = (val: number) => {
        setForm(prev => ({ ...prev, level: val, parentId: '' }));
    };

    // Parent candidates: categories whose level === selected level - 1
    const parentCandidates = allCategories.filter(c => c.level === form.level - 1);

    const handleSubmit = async () => {
        if (!form.code.trim()) { setFormError('Mã phân loại không được để trống'); return; }
        if (!form.name.trim()) { setFormError('Tên phân loại không được để trống'); return; }
        if (form.level > 1 && !form.parentId) {
            setFormError(`Phân loại cấp ${form.level} phải có phân loại cha`);
            return;
        }

        setSaving(true);
        setFormError(null);
        try {
            const req: CreateAnalysisReportCategoryRequest = {
                code: form.code.trim().toUpperCase(),
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                level: form.level,
                parentId: form.level > 1 ? form.parentId : undefined,
            };
            await analysisReportService.createCategory(req);
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
                        Thêm phân loại mới
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

                    {/* Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cấp bậc <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map(lvl => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => handleLevelChange(lvl)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                        form.level === lvl
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                                    }`}
                                >
                                    Cấp {lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Parent — only when level > 1 */}
                    {form.level > 1 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Phân loại cha (Cấp {form.level - 1}) <span className="text-red-500">*</span>
                            </label>
                            {parentCandidates.length === 0 ? (
                                <p className="text-sm text-orange-500 dark:text-orange-400 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    Chưa có phân loại cấp {form.level - 1}. Hãy tạo trước.
                                </p>
                            ) : (
                                <select
                                    value={form.parentId}
                                    onChange={e => set('parentId', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">-- Chọn phân loại cha --</option>
                                    {parentCandidates.map(c => (
                                        <option key={c.code} value={c.code}>
                                            [{c.code}] {c.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mã phân loại <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.code}
                            onChange={e => set('code', e.target.value)}
                            placeholder="VD: TECH_ANALYSIS, MACRO..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 uppercase tracking-widest"
                        />
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tên phân loại <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            placeholder="Tên phân loại báo cáo"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mô tả
                        </label>
                        <textarea
                            rows={2}
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder="Mô tả ngắn về phân loại này"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                        />
                    </div>
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
                        disabled={saving || (form.level > 1 && parentCandidates.length === 0)}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        {saving && <Spinner />}
                        Thêm phân loại
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalysisReportCategories() {
    const [categories, setCategories] = useState<AnalysisReportCategory[]>([]);
    // All categories (large fetch) used to populate parent dropdown in modal
    const [allCategories, setAllCategories] = useState<AnalysisReportCategory[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageIndex, setPageIndex] = useState(1);
    const [levelFilter, setLevelFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const fetchCategories = useCallback(async (page: number, level: string, status: string) => {
        setLoading(true);
        setFetchError(null);
        try {
            const params: GetAnalysisReportCategoriesParams = { pageIndex: page, pageSize: PAGE_SIZE };
            if (level !== '') params.level = Number(level);
            if (status !== '') params.status = Number(status) as CommonStatus;

            const result = await analysisReportService.getCategories(params);
            const sorted = (result.items ?? []).slice().sort((a, b) => {
                // Primary: level ASC (1 → 2 → 3)
                if (a.level !== b.level) return a.level - b.level;
                // Secondary: code ASC
                const codeComp = a.code.localeCompare(b.code);
                if (codeComp !== 0) return codeComp;
                // Tertiary: createdAt DESC (newest first)
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            setCategories(sorted);
            setTotalCount(result.totalCount ?? 0);
        } catch (err) {
            setFetchError(err instanceof Error ? err.message : 'Không thể tải danh sách phân loại');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch all categories (for parent dropdown) once on mount
    const fetchAllCategories = useCallback(async () => {
        try {
            const result = await analysisReportService.getCategories({ pageIndex: 1, pageSize: 100 });
            setAllCategories(result.items ?? []);
        } catch {
            // Non-critical, modal will show warning if empty
        }
    }, []);

    useEffect(() => {
        fetchCategories(pageIndex, levelFilter, statusFilter);
    }, [fetchCategories, pageIndex, levelFilter, statusFilter]);

    useEffect(() => {
        fetchAllCategories();
    }, [fetchAllCategories]);

    const handleLevelFilterChange = (val: string) => { setLevelFilter(val); setPageIndex(1); };
    const handleStatusFilterChange = (val: string) => { setStatusFilter(val); setPageIndex(1); };

    const handleSaved = () => {
        fetchCategories(pageIndex, levelFilter, statusFilter);
        fetchAllCategories();
    };

    // Client-side search (API doesn't expose searchTerm for categories)
    const filtered = categories.filter(c => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                        Quản lí phân loại báo cáo
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Danh mục phân loại báo cáo phân tích theo cấp bậc
                        {!loading && (
                            <span className="ml-1.5 text-gray-400 dark:text-gray-500">• {totalCount} phân loại</span>
                        )}
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-800 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm phân loại
                </button>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo mã hoặc tên phân loại..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>
                <select
                    value={levelFilter}
                    onChange={e => handleLevelFilterChange(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="">Tất cả cấp</option>
                    {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map(lvl => (
                        <option key={lvl} value={String(lvl)}>Cấp {lvl}</option>
                    ))}
                </select>
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
                    <button
                        onClick={() => fetchCategories(pageIndex, levelFilter, statusFilter)}
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
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mã</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên phân loại</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cấp</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phân loại cha</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <div className="text-gray-400 dark:text-gray-500 space-y-1">
                                            <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            <p className="text-sm">
                                                {searchQuery ? 'Không tìm thấy phân loại phù hợp' : 'Chưa có phân loại nào'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(cat => (
                                    <tr key={cat.code} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        {/* Code */}
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white tracking-wide">
                                                {cat.code}
                                            </span>
                                        </td>
                                        {/* Name + Description */}
                                        <td className="px-4 py-3 max-w-[240px]">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{cat.name}</p>
                                            {cat.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{cat.description}</p>
                                            )}
                                        </td>
                                        {/* Level */}
                                        <td className="px-4 py-3">
                                            <LevelBadge level={cat.level} />
                                        </td>
                                        {/* Parent Category */}
                                        <td className="px-4 py-3">
                                            {cat.parentCategory ? (
                                                <div>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{cat.parentCategory.name}</p>
                                                    <p className="text-xs font-mono text-gray-400 mt-0.5">{cat.parentCategory.code}</p>
                                                </div>
                                            ) : cat.parentId ? (
                                                <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{cat.parentId}</span>
                                            ) : (
                                                <span className="text-sm text-gray-400">—</span>
                                            )}
                                        </td>
                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <StatusBadge status={cat.status} />
                                        </td>
                                        {/* Created At */}
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(cat.createdAt).toLocaleDateString('vi-VN')}
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
                            Trang {pageIndex} / {totalPages} &nbsp;·&nbsp; {totalCount} phân loại
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

            {/* Create Modal */}
            {showModal && (
                <CreateCategoryModal
                    allCategories={allCategories}
                    onClose={() => setShowModal(false)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
