'use client';

import { useMemo } from 'react';
import type { NewsArticle } from '@/types/news';

interface NewsDetailModalProps {
    article: NewsArticle | null;
    onClose: () => void;
}

const sortTickerScores = (article: NewsArticle) => {
    return [...article.tickerScores].sort((left, right) => {
        const leftRelevance = left.relevanceScore ?? Number.NEGATIVE_INFINITY;
        const rightRelevance = right.relevanceScore ?? Number.NEGATIVE_INFINITY;

        if (rightRelevance !== leftRelevance) {
            return rightRelevance - leftRelevance;
        }

        const leftSentiment = left.sentimentScore ?? Number.NEGATIVE_INFINITY;
        const rightSentiment = right.sentimentScore ?? Number.NEGATIVE_INFINITY;

        return rightSentiment - leftSentiment;
    });
};

const formatScore = (value: number | null): string => {
    if (value === null || Number.isNaN(value)) {
        return '--';
    }

    return value.toFixed(2);
};

const formatSentimentScore = (value: number | null): string => {
    if (value === null || Number.isNaN(value)) {
        return '--';
    }

    if (value > 0) {
        return `+${value.toFixed(2)}`;
    }

    return value.toFixed(2);
};

const getSentimentClassName = (value: number | null): string => {
    if (value === null || Number.isNaN(value) || value === 0) {
        return 'text-gray-500 dark:text-gray-400';
    }

    if (value > 0) {
        return 'text-green-600 dark:text-green-300';
    }

    return 'text-red-600 dark:text-red-300';
};

export default function NewsDetailModal({ article, onClose }: NewsDetailModalProps) {
    const selectedTickerScores = useMemo(() => {
        if (!article) {
            return [];
        }

        return sortTickerScores(article);
    }, [article]);

    if (!article) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-6">
                        Chi tiết tin tức
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-red-600 transition-colors"
                    >
                        X
                    </button>
                </div>

                <div className="space-y-4 overflow-y-auto px-5 py-4 max-h-[calc(85vh-72px)]">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-6">
                        {article.title}
                    </h3>
                    <div>
                        <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Tóm tắt
                        </p>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-200 leading-6 whitespace-pre-line">
                            {article.summary || 'Chưa có tóm tắt.'}
                        </p>
                    </div>

                    <div>
                        <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            tickerScores
                        </p>

                        <div className="mt-2 max-h-[144px] overflow-y-auto space-y-1.5 pr-1">
                            {selectedTickerScores.length > 0 ? selectedTickerScores.map((score) => (
                                <div
                                    key={`${article.id}-${score.ticker}`}
                                    className="rounded-md border border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 px-2.5 py-1.5"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{score.ticker}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Độ liên quan: {formatScore(score.relevanceScore)}
                                        </span>
                                    </div>

                                    <p className={`text-xs mt-0.5 ${getSentimentClassName(score.sentimentScore)}`}>
                                        Đánh giá: {formatSentimentScore(score.sentimentScore)}
                                    </p>
                                </div>
                            )) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">Chưa có tickerScores.</p>
                            )}
                        </div>
                    </div>

                    {article.link && (
                        <div>
                            <a
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex px-3 py-1.5 text-xs border border-blue-300 text-blue-700 dark:text-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                                Mở bài gốc
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}