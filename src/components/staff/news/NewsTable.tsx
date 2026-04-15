'use client';

import { useState } from 'react';
import type { NewsArticle } from '@/types/news';
import NewsDetailModal from './NewsDetailModal';

interface NewsTableProps {
    newsItems: NewsArticle[];
    isLoadingNews: boolean;
    newsError: string | null;
    skeletonRows: number;
    onRetry: () => void;
    formatDateTime: (value: string) => string;
}

export default function NewsTable({
    newsItems,
    isLoadingNews,
    newsError,
    skeletonRows,
    onRetry,
    formatDateTime,
}: NewsTableProps) {
    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-700/50">
                    <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 w-[63%]">
                            tiêu đề
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 w-[12%]">
                            nguồn
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 w-[15%]">
                            thời gian đăng
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 w-[10%]">
                            xem chi tiết
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {isLoadingNews && Array.from({ length: skeletonRows }).map((_, index) => (
                        <tr key={`skeleton-${index}`} className="animate-pulse">
                            <td className="px-4 py-3 border border-gray-200 dark:border-gray-700">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-2" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            </td>
                            <td className="px-4 py-3 border border-gray-200 dark:border-gray-700"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" /></td>
                            <td className="px-4 py-3 border border-gray-200 dark:border-gray-700"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" /></td>
                            <td className="px-4 py-3 border border-gray-200 dark:border-gray-700"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                        </tr>
                    ))}

                    {!isLoadingNews && newsError && (
                        <tr>
                            <td colSpan={4} className="px-5 py-10 text-center border border-gray-200 dark:border-gray-700">
                                <p className="text-red-500 mb-3">{newsError}</p>
                                <button
                                    type="button"
                                    onClick={onRetry}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                >
                                    Thử lại
                                </button>
                            </td>
                        </tr>
                    )}

                    {!isLoadingNews && !newsError && newsItems.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                Không có tin tức phù hợp với bộ lọc hiện tại.
                            </td>
                        </tr>
                    )}

                    {!isLoadingNews && !newsError && newsItems.length > 0 && newsItems.map((article) => (
                        <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                            <td className="px-4 py-3 align-top border border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-6 whitespace-nowrap overflow-hidden mb-2">
                                    {article.title}
                                </p>

                                <div className="flex flex-wrap gap-1.5">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Mã liên quan</span>
                                    {article.tickers.length > 0 ? article.tickers.slice(0, 3).map((ticker) => (
                                        <span
                                            key={`${article.id}-${ticker}`}
                                            className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 text-xs font-medium"
                                        >
                                            {ticker}
                                        </span>
                                    )) : (
                                        <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                                    )}
                                    {article.tickers.length > 3 && (
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-xs font-medium">
                                            +{article.tickers.length - 3}
                                        </span>
                                    )}
                                </div>
                            </td>

                            <td className="px-4 py-3 align-top text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                {article.source || 'Không rõ nguồn'}
                            </td>

                            <td className="px-4 py-3 align-top text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap border border-gray-200 dark:border-gray-700">
                                {formatDateTime(article.publishedAt)}
                            </td>

                            <td className="px-4 py-3 align-top border border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedArticle(article);
                                    }}
                                    className="inline-flex px-3 py-1.5 text-xs border border-blue-300 text-blue-700 dark:text-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    Xem chi tiết
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <NewsDetailModal
                article={selectedArticle}
                onClose={() => {
                    setSelectedArticle(null);
                }}
            />
        </div>
    );
}
