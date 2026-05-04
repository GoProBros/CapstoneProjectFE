"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import type { AnalysisReport } from '@/types/analysisReport';
import { useAnalysisReport } from './useAnalysisReport';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
    return (
        <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    );
}

// ─── Module ───────────────────────────────────────────────────────────────────

export function AnalysisReportModule() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const {
        reports,
        allSources,
        allCategories,
        loading,
        loadingMore,
        pageIndex,
        hasMore,
        searchInput,
        setSearchInput,
        searchTerm,
        sourceFilter,
        setSourceFilter,
        categoryFilter,
        setCategoryFilter,
        selectedReport,
        selectedSource,
        selectedCategory,
        loadingDetail,
        pdfBlobUrl,
        loadingPdf,
        downloading,
        isPdfFullscreen,
        setIsPdfFullscreen,
        fetchPage,
        handleSelectReport,
        handleBack,
        handleDownload,
    } = useAnalysisReport();

    // ─── Theme helpers ────────────────────────────────────────────────────────

    const borderCls = isDark ? 'border-gray-700' : 'border-gray-200';
    const textMutedCls = isDark ? 'text-gray-400' : 'text-gray-500';
    const bgCls = isDark ? 'bg-cardBackground' : 'bg-white';
    const hoverRowCls = isDark ? 'hover:bg-[#2a2a35]' : 'hover:bg-gray-50';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-300' : 'text-gray-700';

    // ─── Detail View ──────────────────────────────────────────────────────────

    if (loadingDetail) {
        return (
            <div className={`w-full h-full flex items-center justify-center rounded-lg border ${bgCls} ${borderCls}`}>
                <Spinner className="w-6 h-6 text-purple-500" />
            </div>
        );
    }

    if (selectedReport) {
        const hasFile = (selectedReport.fileSize ?? 0) > 0;
        const sourceLabel = selectedSource
            ? `${selectedSource.code} - ${selectedSource.name}`
            : selectedReport.sourceId;
        const categoryLabel = selectedCategory
            ? `${selectedCategory.code} - ${selectedCategory.name}`
            : selectedReport.categoryId;
        return (
            <div className={`w-full h-full flex flex-col rounded-lg border ${bgCls} ${borderCls} overflow-hidden`}>
                {/* Detail header */}
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${borderCls} flex-shrink-0`}>
                    <button
                        type="button"
                        onClick={handleBack}
                        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                        title="Quay lại"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <span className={`text-sm font-medium truncate ${textPrimary}`}>{selectedReport.title}</span>
                </div>

                {/* Scrollable detail body */}
                <div className="flex-1 overflow-auto">
                    <div className="p-4 space-y-4">
                        {/* Meta grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${textMutedCls}`}>Nguồn</p>
                                <p className={`text-sm ${textSecondary}`}>{sourceLabel}</p>
                            </div>
                            <div>
                                <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${textMutedCls}`}>Ngày xuất bản</p>
                                <p className={`text-sm ${textSecondary}`}>
                                    {selectedReport.publishDate
                                        ? new Date(selectedReport.publishDate).toLocaleDateString('vi-VN')
                                        : '—'}
                                </p>
                            </div>
                            <div>
                                <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${textMutedCls}`}>Ngày cập nhật</p>
                                <p className={`text-sm ${textSecondary}`}>
                                    {selectedReport.updatedAt
                                        ? new Date(selectedReport.updatedAt).toLocaleDateString('vi-VN')
                                        : '—'}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        {selectedReport.description && (
                            <div>
                                <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${textMutedCls}`}>Mô tả</p>
                                <p className={`text-sm leading-relaxed ${textSecondary}`}>{selectedReport.description}</p>
                            </div>
                        )}

                        {/* Tickers */}
                        {selectedReport.tickers && selectedReport.tickers.length > 0 && (
                            <div>
                                <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${textMutedCls}`}>Mã chứng khoán</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedReport.tickers.map(t => (
                                        <span key={t} className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* File download */}
                        {hasFile && (
                            <div>
                                <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${textMutedCls}`}>Tài liệu đính kèm</p>
                                <button
                                    type="button"
                                    onClick={() => handleDownload(selectedReport)}
                                    disabled={downloading}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${borderCls} transition-colors text-sm disabled:opacity-50 w-full text-left ${
                                        isDark ? 'text-purple-400 hover:bg-gray-700/50' : 'text-purple-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span className="flex-1 truncate font-medium">
                                        {selectedReport.originalFileName ?? 'Tải tài liệu'}
                                    </span>
                                    {downloading ? (
                                        <Spinner />
                                    ) : (
                                        <svg className={`w-4 h-4 shrink-0 ${textMutedCls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* PDF Reader */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className={`text-xs font-medium uppercase tracking-wider ${textMutedCls}`}>Xem tài liệu</p>
                                {pdfBlobUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setIsPdfFullscreen(true)}
                                        title="Xem toàn màn hình"
                                        className={`p-1.5 rounded-lg transition-colors ${
                                            isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <div
                                className={`w-full rounded-lg border ${borderCls} overflow-hidden`}
                                style={{ height: '480px' }}
                            >
                                {loadingPdf ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Spinner className="w-6 h-6 text-purple-500" />
                                    </div>
                                ) : pdfBlobUrl ? (
                                    <iframe
                                        src={pdfBlobUrl}
                                        className="w-full h-full"
                                        title="Báo cáo PDF"
                                    />
                                ) : (
                                    <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${textMutedCls}`}>
                                        <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-sm">Chưa có tài liệu đính kèm</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fullscreen PDF Modal */}
                        {isPdfFullscreen && pdfBlobUrl && (
                            <div
                                className="fixed inset-0 z-[9999] flex flex-col"
                                style={{ background: 'rgba(0,0,0,0.92)' }}
                            >
                                {/* Modal toolbar */}
                                <div className={`flex items-center justify-between px-4 py-2 flex-shrink-0 ${isDark ? 'bg-[#1e1e26]' : 'bg-white'} border-b ${borderCls}`}>
                                    <span className={`text-sm font-medium truncate ${textPrimary}`}>{selectedReport.title}</span>
                                    <button
                                        type="button"
                                        onClick={() => setIsPdfFullscreen(false)}
                                        title="Đóng (Esc)"
                                        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ml-3 ${
                                            isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                {/* PDF iframe fills remaining space */}
                                <iframe
                                    src={pdfBlobUrl}
                                    className="flex-1 w-full"
                                    title="Báo cáo PDF - Toàn màn hình"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ─── List View ────────────────────────────────────────────────────────────

    return (
        <div className={`w-full h-full flex flex-col rounded-lg overflow-hidden border ${bgCls} ${borderCls}`}>
            {/* Badge title (drag zone) */}
            <div className="module-header flex-none flex items-center justify-center pt-1.5 pb-1">
                <div className="drag-handle relative flex items-center justify-center cursor-move select-none">
                    <svg width="180" height="30" viewBox="0 0 136 22" className="block">
                        <path d="M134 0C151 0 -15 0 2 0C19 0 27 22 46 22H92C113 22 119 0 134 0Z" fill="#4ADE80"/>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-black tracking-wide">
                        Báo cáo phân tích
                    </span>
                </div>
            </div>

            {/* Search & Filter toolbar */}
            <div className={`flex flex-wrap gap-2 px-3 py-2.5 border-b ${borderCls} flex-shrink-0`}>
                {/* Search */}
                <div className="relative flex-1 min-w-[140px]">
                    <svg className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${textMutedCls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Tìm báo cáo..."
                        className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border ${borderCls} ${bgCls} ${textPrimary} placeholder:${textMutedCls} focus:outline-none focus:ring-1 focus:ring-green-500`}
                    />
                </div>
                {/* Source filter */}
                <select
                    value={sourceFilter}
                    onChange={e => { setSourceFilter(e.target.value); }}
                    className={`px-2 py-1.5 text-xs rounded-lg border ${borderCls} ${bgCls} ${textPrimary} focus:outline-none focus:ring-1 focus:ring-green-500`}
                >
                    <option value="">Tất cả nguồn</option>
                    {allSources.map(s => (
                        <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                    ))}
                </select>
                {/* Category filter */}
                <select
                    value={categoryFilter}
                    onChange={e => { setCategoryFilter(e.target.value); }}
                    className={`px-2 py-1.5 text-xs rounded-lg border max-w-[130px] ${borderCls} ${bgCls} ${textPrimary} focus:outline-none focus:ring-1 focus:ring-green-500`}
                >
                    <option value="">Tất cả phân loại</option>
                    {allCategories.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Table + load more (all scrollable together) */}
            <div className="flex-1 overflow-auto min-h-0">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <Spinner className="w-6 h-6 text-purple-500" />
                    </div>
                ) : (
                    <>
                        <table className="w-full text-sm">
                            <thead className={`sticky top-0 ${isDark ? 'bg-[#1e1e26] text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                                <tr>
                                    <th className={`px-4 py-3 text-left text-xs font-medium border-b w-20 ${borderCls}`}>Mã CK</th>
                                    <th className={`px-4 py-3 text-left text-xs font-medium border-b w-28 ${borderCls}`}>Ngày xuất bản</th>
                                    <th className={`px-4 py-3 text-left text-xs font-medium border-b ${borderCls}`}>Tiêu đề</th>
                                </tr>
                            </thead>
                            <tbody className={textMutedCls}>
                                {reports.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-sm">
                                            {searchTerm || sourceFilter ? 'Không tìm thấy báo cáo phù hợp' : 'Không có báo cáo nào'}
                                        </td>
                                    </tr>
                                ) : (
                                    reports.map(r => (
                                        <tr
                                            key={r.id}
                                            className={`cursor-pointer transition-colors ${hoverRowCls}`}
                                            onClick={() => handleSelectReport(r)}
                                        >
                                            <td className={`px-4 py-3 border-b ${borderCls} max-w-[80px] font-medium ${textPrimary}`}>
                                                <p className="truncate">{r.tickers && r.tickers.length > 0 ? r.tickers.join(', ') : '—'}</p>
                                            </td>
                                            <td className={`px-4 py-3 border-b ${borderCls} max-w-[110px] whitespace-nowrap`}>
                                                {r.publishDate
                                                    ? new Date(r.publishDate).toLocaleDateString('vi-VN')
                                                    : '—'}
                                            </td>
                                            <td className={`px-4 py-3 border-b ${borderCls} max-w-[200px]`}>
                                                <p className="truncate">{r.title}</p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Load more — sits right after table rows inside the scroll area */}
                        {hasMore && (
                            <div className={`px-4 py-3 border-t ${borderCls}`}>
                                <button
                                    type="button"
                                    onClick={() => fetchPage(pageIndex + 1, true, searchTerm, sourceFilter, categoryFilter)}
                                    disabled={loadingMore}
                                    className={`w-full py-2 text-xs rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                                        isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {loadingMore && <Spinner />}
                                    {loadingMore ? 'Đang tải...' : 'Tải thêm...'}
                                </button>
                            </div>
                        )}
                        {reports.length > 0 && !hasMore && (
                            <div className={`px-4 py-2 text-center text-xs ${textMutedCls}`}>
                                Đã hiển thị tất cả {reports.length} báo cáo
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}


