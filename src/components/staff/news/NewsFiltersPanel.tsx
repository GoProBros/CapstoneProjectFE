'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

interface NewsFiltersPanelProps {
    searchKeywordInput: string;
    appliedSearchKeyword: string;
    tickerLookupKeyword: string;
    tickerInput: string;
    appliedTickerFilter: string;
    tickerSelectOptions: string[];
    isLoadingTickerOptions: boolean;
    tickerOptionsError: string | null;
    hasMoreTickerOptions: boolean;
    onSearchKeywordInputChange: (value: string) => void;
    onTickerLookupKeywordChange: (value: string) => void;
    onTickerInputChange: (value: string) => void;
    onLoadMoreTickerOptions: () => void;
    onAutoSubmit: (tickerOverride?: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onReset: () => void;
}

export default function NewsFiltersPanel({
    searchKeywordInput,
    appliedSearchKeyword,
    tickerLookupKeyword,
    tickerInput,
    appliedTickerFilter,
    tickerSelectOptions,
    isLoadingTickerOptions,
    tickerOptionsError,
    hasMoreTickerOptions,
    onSearchKeywordInputChange,
    onTickerLookupKeywordChange,
    onTickerInputChange,
    onLoadMoreTickerOptions,
    onAutoSubmit,
    onSubmit,
    onReset,
}: NewsFiltersPanelProps) {
    const [isTickerDropdownOpen, setIsTickerDropdownOpen] = useState(false);
    const tickerFilterRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isTickerDropdownOpen) {
            return;
        }

        const handleOutsideClick = (event: MouseEvent) => {
            if (!tickerFilterRef.current) {
                return;
            }

            if (!tickerFilterRef.current.contains(event.target as Node)) {
                setIsTickerDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isTickerDropdownOpen]);

    const selectedTickerLabel = tickerInput || 'Tất cả mã cổ phiếu';

    const applyTickerSelection = (ticker: string) => {
        onTickerInputChange(ticker);
        setIsTickerDropdownOpen(false);
        onAutoSubmit(ticker);
    };

    const handleTickerLookupKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        const normalizedTicker = tickerLookupKeyword.trim().toUpperCase();
        applyTickerSelection(normalizedTicker);
    };

    return (
        <form
            onSubmit={onSubmit}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
        >
            <div className="grid grid-cols-3 md:grid-cols-3 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-8 space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Tìm kiếm tin tức
                    </label>
                    <input
                        type="text"
                        value={searchKeywordInput}
                        onChange={(event) => onSearchKeywordInputChange(event.target.value)}
                        placeholder="Nhập tiêu đề hoặc nội dung..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>

                <div className="xl:col-span-3 space-y-2" ref={tickerFilterRef}>
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Lọc theo mã cổ phiếu
                    </label>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsTickerDropdownOpen((previous) => !previous)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-between"
                        >
                            <span>{selectedTickerLabel}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">▾</span>
                        </button>

                        {isTickerDropdownOpen && (
                            <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg p-3 space-y-2">
                                <input
                                    type="text"
                                    value={tickerLookupKeyword}
                                    onChange={(event) => onTickerLookupKeywordChange(event.target.value)}
                                    onKeyDown={handleTickerLookupKeyDown}
                                    placeholder="Tìm mã cổ phiếu..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />

                                <div className="max-h-56 overflow-y-auto rounded-md border border-gray-100 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => applyTickerSelection('')}
                                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                            !tickerInput
                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        Tất cả mã cổ phiếu
                                    </button>

                                    {tickerSelectOptions.map((ticker) => (
                                        <button
                                            key={ticker}
                                            type="button"
                                            onClick={() => applyTickerSelection(ticker)}
                                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                                tickerInput === ticker
                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {ticker}
                                        </button>
                                    ))}

                                    {tickerSelectOptions.length === 0 && !isLoadingTickerOptions && (
                                        <p className="px-3 py-3 text-xs text-center text-gray-500 dark:text-gray-400">
                                            Không có mã phù hợp
                                        </p>
                                    )}
                                </div>

                                {tickerOptionsError && (
                                    <p className="text-xs text-red-500">{tickerOptionsError}</p>
                                )}

                                {isLoadingTickerOptions && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Đang tải danh sách mã...</p>
                                )}

                                {hasMoreTickerOptions && (
                                    <button
                                        type="button"
                                        onClick={onLoadMoreTickerOptions}
                                        disabled={isLoadingTickerOptions}
                                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoadingTickerOptions ? 'Đang tải...' : 'Tải thêm'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onReset}
                    className="xl:col-span-1 h-10 self-end px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-500 dark:text-slate-100 rounded-lg transition-colors text-xs"
                >
                    Xóa bộ lọc
                </button>
            </div>
        </form>
    );
}
