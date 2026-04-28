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

const formatDateTime = (value: string): string => {
    if (!value) {
        return '---';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(date);
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

function getPaymentStatusLabel(status: number, fallback?: string) {
    const labels: Record<number, string> = {
        0: 'Chờ xử lý',
        1: 'Hoàn thành',
        2: 'Đã hủy',
        3: 'Hết hạn',
    };

    return labels[status] ?? fallback ?? `Trạng thái ${status}`;
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

                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Gói VIP hiện tại</h4>
                                {user.currentVipPackage ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <p><span className="font-medium">Tên gói:</span> {user.currentVipPackage.subscriptionName || '---'}</p>
                                        <p><span className="font-medium">Mức VIP:</span> {user.currentVipPackage.vipLevelName || '---'}</p>
                                        <p><span className="font-medium">Bắt đầu:</span> {formatDateTime(user.currentVipPackage.startDate)}</p>
                                        <p><span className="font-medium">Kết thúc:</span> {formatDateTime(user.currentVipPackage.endDate)}</p>
                                        <p className="md:col-span-2">
                                            <span className="font-medium">Modules:</span>{' '}
                                            {user.currentVipPackage.allowedModules.length > 0
                                                ? user.currentVipPackage.allowedModules.join(', ')
                                                : '---'}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Người dùng chưa có gói VIP đang hoạt động</p>
                                )}
                            </div>

                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Lịch sử giao dịch</h4>
                                {user.transactions.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có giao dịch nào</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                                    <th className="py-2 pr-3">Mã đơn</th>
                                                    <th className="py-2 pr-3">Gói</th>
                                                    <th className="py-2 pr-3">Số tiền</th>
                                                    <th className="py-2 pr-3">Trạng thái</th>
                                                    <th className="py-2 pr-3">Thời gian</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {user.transactions.map(transaction => (
                                                    <tr key={transaction.id} className="border-b last:border-b-0 border-gray-100 dark:border-gray-700/50 text-gray-700 dark:text-gray-300">
                                                        <td className="py-2 pr-3">#{transaction.orderCode}</td>
                                                        <td className="py-2 pr-3">{transaction.subscriptionName || '---'}</td>
                                                        <td className="py-2 pr-3">{formatCurrency(transaction.amount)}</td>
                                                        <td className="py-2 pr-3">{getPaymentStatusLabel(transaction.status, transaction.statusName)}</td>
                                                        <td className="py-2 pr-3">{formatDateTime(transaction.createdAt)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
