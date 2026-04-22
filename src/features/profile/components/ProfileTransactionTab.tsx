"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMyTransactions } from '@/services/admin/paymentService';
import {
    PaymentProviderType,
    PaymentTransactionStatus,
} from '@/types/payment';
import type { PaymentTransactionDto } from '@/types/payment';
import {
    formatCurrencyVnd,
    formatDateTime,
    canViewProfileTransactions,
    getPaymentProviderLabel,
    getPaymentStatusLabel,
} from './helpers';
import { Spinner } from './Spinner';
import { useProfileTheme } from './useProfileTheme';

const PAGE_SIZE = 10;

export function ProfileTransactionTab() {
    const { user } = useAuth();
    const { isDark, borderCls, bgCard, bgSub, fieldBg, textPrimary, textSecondary, textMuted, hoverBg } = useProfileTheme();

    const [transactions, setTransactions] = useState<PaymentTransactionDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageIndex, setPageIndex] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [providerFilter, setProviderFilter] = useState<string>('');

    const canViewTransactions = canViewProfileTransactions(user?.role);

    const activeFilters = useMemo(() => ({
        status: statusFilter === '' ? undefined : Number(statusFilter),
        paymentProvider: providerFilter === '' ? undefined : Number(providerFilter),
    }), [providerFilter, statusFilter]);

    useEffect(() => {
        if (!canViewTransactions) {
            return;
        }

        let isMounted = true;

        const loadTransactions = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await getMyTransactions({
                    pageIndex,
                    pageSize: PAGE_SIZE,
                    status: activeFilters.status,
                    paymentProvider: activeFilters.paymentProvider,
                });

                if (!isMounted) return;

                setTransactions(data.items);
                setPageIndex(data.pageIndex);
                setTotalPages(data.totalPages);
                setTotalCount(data.totalCount);
            } catch (loadError) {
                if (!isMounted) return;
                setError(loadError instanceof Error ? loadError.message : 'Không thể tải lịch sử giao dịch');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadTransactions();

        return () => {
            isMounted = false;
        };
    }, [activeFilters.paymentProvider, activeFilters.status, canViewTransactions, pageIndex]);

    useEffect(() => {
        setPageIndex(1);
    }, [statusFilter, providerFilter]);

    if (!canViewTransactions) {
        return (
            <div className={`rounded-2xl border ${borderCls} ${bgCard} p-6 shadow-sm`}>
                <h3 className="text-2xl font-extrabold">Lịch sử giao dịch</h3>
                <p className={`mt-2 text-sm ${textSecondary}`}>
                    Tài khoản Staff/Admin không có quyền xem tab này.
                </p>
            </div>
        );
    }

    return (
        <>
            <style>{`
                .profile-transaction-select {
                    color-scheme: ${isDark ? 'dark' : 'light'};
                }
                .profile-transaction-select option {
                    background-color: ${isDark ? '#282832' : '#ffffff'};
                    color: ${isDark ? '#ffffff' : '#000000'};
                }
            `}</style>
        <div className={`rounded-2xl border ${borderCls} ${bgCard} p-6 shadow-sm`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h3 className="text-2xl font-extrabold">Lịch sử giao dịch</h3>
                    <p className={`mt-2 text-sm ${textSecondary}`}>
                        Theo dõi các giao dịch thanh toán gần nhất với bộ lọc trạng thái và nhà cung cấp.
                    </p>
                </div>
                <div className={`rounded-xl border ${borderCls} ${bgSub} px-4 py-3 text-sm ${textSecondary}`}>
                    Tổng số giao dịch: <span className={`font-semibold ${textPrimary}`}>{totalCount}</span>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className={`relative rounded-xl border ${borderCls} ${fieldBg} p-3`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Kênh thanh toán</span>
                    <select
                        value={providerFilter}
                        onChange={(event) => setProviderFilter(event.target.value)}
                        className={`profile-transaction-select mt-2 w-full appearance-none bg-inherit pr-8 text-sm ${textPrimary} outline-none transition-all pl-2`}
                    >       
                        <option value="">Tất cả</option>
                        <option value={String(PaymentProviderType.PayOS)}>PayOS</option>
                        <option value={String(PaymentProviderType.Momo)}>MoMo</option>
                    </select>
                    <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${textMuted}`}>▾</span>
                </label>

                <label className={`relative rounded-xl border ${borderCls} ${fieldBg} p-3`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Trạng thái</span>
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className={`profile-transaction-select mt-2 w-full appearance-none bg-inherit pr-8 text-sm ${textPrimary} outline-none transition-all pl-2`}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value={String(PaymentTransactionStatus.Pending)}>{getPaymentStatusLabel(PaymentTransactionStatus.Pending)}</option>
                        <option value={String(PaymentTransactionStatus.Completed)}>{getPaymentStatusLabel(PaymentTransactionStatus.Completed)}</option>
                        <option value={String(PaymentTransactionStatus.Cancelled)}>{getPaymentStatusLabel(PaymentTransactionStatus.Cancelled)}</option>
                        <option value={String(PaymentTransactionStatus.Expired)}>{getPaymentStatusLabel(PaymentTransactionStatus.Expired)}</option>
                    </select>
                    <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${textMuted}`}>▾</span>
                </label>
            </div>

            <div className={`mt-5 overflow-hidden rounded-xl border ${borderCls}`}>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-700">
                        <thead className={`${bgSub} text-xs uppercase tracking-wider ${textMuted}`}>
                            <tr>
                                <th className="px-4 py-3">Mã giao dịch</th>
                                <th className="px-4 py-3">Gói</th>
                                <th className="px-4 py-3">Số tiền</th>
                                <th className="px-4 py-3">Nhà cung cấp</th>
                                <th className="px-4 py-3">Trạng thái</th>
                                <th className="px-4 py-3">Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody className={`${bgCard} divide-y divide-gray-100 dark:divide-gray-800`}>
                            {loading ? (
                                <tr>
                                    <td className="px-4 py-8" colSpan={6}>
                                        <div className="flex items-center justify-center gap-2 text-sm text-green-500">
                                            <Spinner className="h-5 w-5" />
                                            Đang tải lịch sử giao dịch...
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td className="px-4 py-8 text-center text-sm text-red-500" colSpan={6}>
                                        {error}
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td className={`px-4 py-10 text-center text-sm ${textSecondary}`} colSpan={6}>
                                        Không có giao dịch nào phù hợp với bộ lọc hiện tại.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((transaction) => (
                                    <tr key={transaction.id} className={`transition-colors ${hoverBg}`}>
                                        <td className={`px-4 py-3 font-semibold ${textPrimary}`}>{transaction.orderCode}</td>
                                        <td className={`px-4 py-3 ${textPrimary}`}>{transaction.subscriptionName}</td>
                                        <td className={`px-4 py-3 ${textPrimary}`}>{formatCurrencyVnd(transaction.amount)}</td>
                                        <td className={`px-4 py-3 ${textPrimary}`}>{getPaymentProviderLabel(transaction.paymentProvider)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                transaction.status === PaymentTransactionStatus.Completed
                                                    ? 'bg-emerald-500/15 text-emerald-500'
                                                    : transaction.status === PaymentTransactionStatus.Pending
                                                        ? 'bg-amber-500/15 text-amber-500'
                                                        : 'bg-red-500/15 text-red-500'
                                            }`}>
                                                {getPaymentStatusLabel(transaction.status)}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 ${textSecondary}`}>{formatDateTime(transaction.createdAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <p className={textSecondary}>
                    Trang <span className={`font-semibold ${textPrimary}`}>{pageIndex}</span> /{' '}
                    <span className={`font-semibold ${textPrimary}`}>{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setPageIndex((currentPage) => Math.max(1, currentPage - 1))}
                        disabled={pageIndex <= 1 || loading}
                        className={`rounded-lg border px-3 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${borderCls} ${textSecondary} ${hoverBg}`}
                    >
                        Trước
                    </button>
                    <button
                        type="button"
                        onClick={() => setPageIndex((currentPage) => Math.min(totalPages, currentPage + 1))}
                        disabled={pageIndex >= totalPages || loading}
                        className={`rounded-lg border px-3 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${borderCls} ${textSecondary} ${hoverBg}`}
                    >
                        Sau
                    </button>
                </div>
            </div>
        </div>
        </>
    );
}
