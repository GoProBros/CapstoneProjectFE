'use client';

import UserAvatar from './UserAvatar';
import type { UserManagementDetail } from '@/types/userManagement';

interface UserDetailModalProps {
    isOpen: boolean;
    loading: boolean;
    error: string | null;
    user: UserManagementDetail | null;
    onClose: () => void;
}

export default function UserDetailModal({
    isOpen,
    loading,
    error,
    user,
    onClose,
}: UserDetailModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4"
                onClick={event => event.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Chi tiết người dùng</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-4">
                    {loading && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải chi tiết...</p>
                    )}

                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}

                    {!loading && !error && user && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <UserAvatar userId={user.id} size={64} enabled={isOpen && !loading && !error} />
                                <div>
                                    <p className="text-base font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Số điện thoại:</span> {user.phone}</p>
                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Vai trò:</span> {user.role}</p>
                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Trạng thái:</span> {user.status}</p>
                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">ID:</span> {user.id}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
