'use client';

interface NewsPaginationFooterProps {
    hasError: boolean;
    displayFrom: number;
    displayTo: number;
    totalCount: number;
    activePage: number;
    totalPages: number;
    isLoadingNews: boolean;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    onPreviousPage: () => void;
    onNextPage: () => void;
    formatNumber: (value: number) => string;
}

export default function NewsPaginationFooter({
    hasError,
    displayFrom,
    displayTo,
    totalCount,
    activePage,
    totalPages,
    isLoadingNews,
    hasPreviousPage,
    hasNextPage,
    onPreviousPage,
    onNextPage,
    formatNumber,
}: NewsPaginationFooterProps) {
    if (hasError) {
        return null;
    }

    return (
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Hiển thị {formatNumber(displayFrom)}-{formatNumber(displayTo)} / {formatNumber(totalCount)} tin • Trang {formatNumber(activePage)} / {formatNumber(totalPages)}
            </p>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onPreviousPage}
                    disabled={isLoadingNews || !hasPreviousPage}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Trang trước
                </button>
                <button
                    type="button"
                    onClick={onNextPage}
                    disabled={isLoadingNews || !hasNextPage}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Trang sau
                </button>
            </div>
        </div>
    );
}
