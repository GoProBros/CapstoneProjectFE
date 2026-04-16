'use client';

export type NewsImportStatusType = 'info' | 'success' | 'error';

interface NewsImportStatusProps {
    status: string | null;
    statusType: NewsImportStatusType;
}

export default function NewsImportStatus({ status, statusType }: NewsImportStatusProps) {
    if (!status) {
        return null;
    }

    const className =
        statusType === 'error'
            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300'
            : statusType === 'success'
                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/70 dark:bg-green-950/40 dark:text-green-300'
                : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/70 dark:bg-orange-950/40 dark:text-orange-300';

    return <div className={`px-4 py-3 rounded-lg border text-sm ${className}`}>{status}</div>;
}
