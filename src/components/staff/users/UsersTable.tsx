'use client';

import UserAvatar from './UserAvatar';
import type { UserManagementListItem } from '@/types/userManagement';

interface UsersTableProps {
    loading: boolean;
    users: UserManagementListItem[];
    searchQuery: string;
    roleFilter: string;
    pageIndex: number;
    totalPages: number;
    totalCount: number;
    onViewDetail: (userId: string) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
}

const getStatusBadgeClass = (status: string) => {
    if (status.toLowerCase() === 'active') {
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }

    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

export default function UsersTable({
    loading,
    users,
    searchQuery,
    roleFilter,
    pageIndex,
    totalPages,
    totalCount,
    onViewDetail,
    onPrevPage,
    onNextPage,
}: UsersTableProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Người dùng
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Vai trò
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Hành động
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, rowIndex) => (
                                <tr key={rowIndex} className="animate-pulse">
                                    {Array.from({ length: 5 }).map((__, colIndex) => (
                                        <td key={colIndex} className="px-6 py-4">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                    {searchQuery || roleFilter ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người dùng nào'}
                                </td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar userId={user.id} size={36} enabled />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.phone || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{user.role}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(user.status)}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => onViewDetail(user.id)}
                                            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Trang {pageIndex} / {totalPages} &nbsp;·&nbsp; {totalCount} người dùng
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onPrevPage}
                            disabled={pageIndex <= 1}
                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            ‹ Trước
                        </button>
                        <button
                            onClick={onNextPage}
                            disabled={pageIndex >= totalPages}
                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Sau ›
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
