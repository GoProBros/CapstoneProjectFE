'use client';

interface NewsHeaderProps {
    isImportingNews: boolean;
    onImportNews: () => void;
}

export default function NewsHeader({ isImportingNews, onImportNews }: NewsHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-headline mb-2">
                    Quản lý Tin Tức
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                    Quản lý tin tức tài chính và thị trường chứng khoán
                </p>
            </div>
            <button
                type="button"
                onClick={onImportNews}
                disabled={isImportingNews}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 text-white rounded-lg transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m14.836 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0A8.003 8.003 0 015.164 13m14.255 2H15" />
                </svg>
                {isImportingNews ? 'Đang thu thập...' : 'Thu thập tin tức'}
            </button>
        </div>
    );
}
