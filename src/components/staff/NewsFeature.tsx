'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import NewsFiltersPanel from '@/components/staff/news/NewsFiltersPanel';
import NewsHeader from '@/components/staff/news/NewsHeader';
import NewsImportStatus, { type NewsImportStatusType } from '@/components/staff/news/NewsImportStatus';
import NewsPaginationFooter from '@/components/staff/news/NewsPaginationFooter';
import NewsTable from '@/components/staff/news/NewsTable';
import newsService from '@/services/newsService';
import { fetchSymbolsPaginated, searchSymbols } from '@/services/symbolService';
import type { NewsArticle } from '@/types/news';

const NEWS_PAGE_SIZE = 10;
const SYMBOL_SEARCH_PAGE_SIZE = 20;

const formatDateTime = (value: string): string => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return '--';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(parsedDate);
};

const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value);
};

export default function NewsFeature() {
    const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [activePage, setActivePage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPreviousPage, setHasPreviousPage] = useState(false);
    const [isLoadingNews, setIsLoadingNews] = useState(false);
    const [newsError, setNewsError] = useState<string | null>(null);

    const [searchKeywordInput, setSearchKeywordInput] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [tickerInput, setTickerInput] = useState('');
    const [tickerFilter, setTickerFilter] = useState('');
    const [tickerLookupKeyword, setTickerLookupKeyword] = useState('');
    const [tickerOptions, setTickerOptions] = useState<string[]>([]);
    const [tickerOptionsPageIndex, setTickerOptionsPageIndex] = useState(1);
    const [tickerOptionsHasNextPage, setTickerOptionsHasNextPage] = useState(false);
    const [isLoadingTickerOptions, setIsLoadingTickerOptions] = useState(false);
    const [tickerOptionsError, setTickerOptionsError] = useState<string | null>(null);

    const [isImportingNews, setIsImportingNews] = useState(false);
    const [importStatus, setImportStatus] = useState<string | null>(null);
    const [importStatusType, setImportStatusType] = useState<NewsImportStatusType>('info');

    const loadNews = useCallback(async (pageIndex: number) => {
        try {
            setIsLoadingNews(true);
            setNewsError(null);

            const response = await newsService.getNews({
                pageIndex,
                pageSize: NEWS_PAGE_SIZE,
                search: searchKeyword || undefined,
                ticker: tickerFilter || undefined,
            });

            setNewsItems(response.items);
            setTotalCount(response.totalCount);
            setTotalPages(response.totalPages);
            setHasNextPage(response.hasNextPage);
            setHasPreviousPage(response.hasPreviousPage);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể tải danh sách tin tức.';
            setNewsError(message);
            setNewsItems([]);
            setTotalCount(0);
            setTotalPages(1);
            setHasNextPage(false);
            setHasPreviousPage(false);
        } finally {
            setIsLoadingNews(false);
        }
    }, [searchKeyword, tickerFilter]);

    useEffect(() => {
        void loadNews(activePage);
    }, [activePage, loadNews]);

    const loadTickerOptions = useCallback(async (
        keyword: string,
        pageIndex: number,
        append: boolean,
    ) => {
        try {
            setIsLoadingTickerOptions(true);
            setTickerOptionsError(null);

            const normalizedKeyword = keyword.trim();

            if (normalizedKeyword) {
                const response = await searchSymbols({
                    query: normalizedKeyword,
                    isTickerOnly: true,
                    pageIndex,
                    pageSize: SYMBOL_SEARCH_PAGE_SIZE,
                });

                const symbols = response.items
                    .map((item) => item.ticker?.trim().toUpperCase())
                    .filter((ticker): ticker is string => Boolean(ticker));

                setTickerOptions((previous) => {
                    if (!append) {
                        return Array.from(new Set(symbols));
                    }

                    return Array.from(new Set([...previous, ...symbols]));
                });
                setTickerOptionsPageIndex(response.pageIndex);
                setTickerOptionsHasNextPage(response.hasNextPage);
                return;
            }

            const response = await fetchSymbolsPaginated({
                PageIndex: pageIndex,
                PageSize: SYMBOL_SEARCH_PAGE_SIZE,
            });

            const symbols = response.items
                .map((item) => item.ticker?.trim().toUpperCase())
                .filter((ticker): ticker is string => Boolean(ticker));

            setTickerOptions((previous) => {
                if (!append) {
                    return Array.from(new Set(symbols));
                }

                return Array.from(new Set([...previous, ...symbols]));
            });
            setTickerOptionsPageIndex(response.pageIndex);
            setTickerOptionsHasNextPage(response.hasNextPage);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể tải danh sách mã cổ phiếu.';
            setTickerOptionsError(message);
            setTickerOptions([]);
            setTickerOptionsPageIndex(1);
            setTickerOptionsHasNextPage(false);
        } finally {
            setIsLoadingTickerOptions(false);
        }
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadTickerOptions(tickerLookupKeyword, 1, false);
        }, 300);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [loadTickerOptions, tickerLookupKeyword]);

    const tickerSelectOptions = useMemo(() => {
        const normalizedCurrentTicker = tickerInput.trim().toUpperCase();

        if (!normalizedCurrentTicker) {
            return tickerOptions;
        }

        if (tickerOptions.includes(normalizedCurrentTicker)) {
            return tickerOptions;
        }

        return [normalizedCurrentTicker, ...tickerOptions];
    }, [tickerInput, tickerOptions]);

    const applyFilters = useCallback((tickerOverride?: string) => {
        const normalizedSearch = searchKeywordInput.trim();
        const normalizedTicker = (tickerOverride ?? tickerInput).trim().toUpperCase();

        setSearchKeyword(normalizedSearch);
        setTickerFilter(normalizedTicker);
        setTickerInput(normalizedTicker);
        setActivePage(1);
    }, [searchKeywordInput, tickerInput]);

    const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilters();
    };

    const handleResetFilters = () => {
        setSearchKeywordInput('');
        setSearchKeyword('');
        setTickerInput('');
        setTickerFilter('');
        setTickerLookupKeyword('');
        setActivePage(1);
    };

    const handleLoadMoreTickerOptions = () => {
        if (isLoadingTickerOptions || !tickerOptionsHasNextPage) {
            return;
        }

        void loadTickerOptions(tickerLookupKeyword, tickerOptionsPageIndex + 1, true);
    };

    const handleImportNewsFromRss = async () => {
        try {
            setIsImportingNews(true);
            setImportStatus('Đang thu thập tin tức từ RSS...');
            setImportStatusType('info');

            const result = await newsService.importNewsFromRss();
            setImportStatus(
                `${result.message} (Lấy về: ${formatNumber(result.fetchedCount)}, thêm mới: ${formatNumber(result.insertedCount)}, trùng lặp: ${formatNumber(result.duplicatedCount)})`
            );
            setImportStatusType('success');

            await loadNews(activePage);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Thu thập tin tức thất bại.';
            setImportStatus(message);
            setImportStatusType('error');
        } finally {
            setIsImportingNews(false);
        }
    };

    const handlePreviousPage = () => {
        if (!hasPreviousPage || isLoadingNews) {
            return;
        }

        setActivePage((previous) => Math.max(1, previous - 1));
    };

    const handleNextPage = () => {
        if (!hasNextPage || isLoadingNews) {
            return;
        }

        setActivePage((previous) => previous + 1);
    };

    const displayFrom = totalCount === 0 ? 0 : (activePage - 1) * NEWS_PAGE_SIZE + 1;
    const displayTo = Math.min(activePage * NEWS_PAGE_SIZE, totalCount);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <NewsHeader
                isImportingNews={isImportingNews}
                onImportNews={() => {
                    void handleImportNewsFromRss();
                }}
            />

            <NewsImportStatus status={importStatus} statusType={importStatusType} />

            <NewsFiltersPanel
                searchKeywordInput={searchKeywordInput}
                appliedSearchKeyword={searchKeyword}
                tickerLookupKeyword={tickerLookupKeyword}
                tickerInput={tickerInput}
                appliedTickerFilter={tickerFilter}
                tickerSelectOptions={tickerSelectOptions}
                isLoadingTickerOptions={isLoadingTickerOptions}
                tickerOptionsError={tickerOptionsError}
                hasMoreTickerOptions={tickerOptionsHasNextPage}
                onSearchKeywordInputChange={setSearchKeywordInput}
                onTickerLookupKeywordChange={setTickerLookupKeyword}
                onTickerInputChange={(value) => {
                    setTickerInput(value.trim().toUpperCase());
                }}
                onLoadMoreTickerOptions={handleLoadMoreTickerOptions}
                onAutoSubmit={applyFilters}
                onSubmit={handleApplyFilters}
                onReset={handleResetFilters}
            />

            {/* News List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                        Danh sách tin tức
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Tổng {formatNumber(totalCount)} tin
                    </p>
                </div>

                <NewsTable
                    newsItems={newsItems}
                    isLoadingNews={isLoadingNews}
                    newsError={newsError}
                    skeletonRows={NEWS_PAGE_SIZE}
                    onRetry={() => {
                        void loadNews(activePage);
                    }}
                    formatDateTime={formatDateTime}
                />

                <NewsPaginationFooter
                    hasError={Boolean(newsError)}
                    displayFrom={displayFrom}
                    displayTo={displayTo}
                    totalCount={totalCount}
                    activePage={activePage}
                    totalPages={totalPages}
                    isLoadingNews={isLoadingNews}
                    hasPreviousPage={hasPreviousPage}
                    hasNextPage={hasNextPage}
                    onPreviousPage={handlePreviousPage}
                    onNextPage={handleNextPage}
                    formatNumber={formatNumber}
                />
            </div>
        </div>
    );
}
