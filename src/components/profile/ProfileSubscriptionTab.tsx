"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSubscriptions, getMySubscription } from '@/services/subscriptionService';
import type { SubscriptionDto, UserSubscriptionDto } from '@/types/subscription';
import { formatPrice } from './helpers';
import { Spinner } from './Spinner';
import { SubscriptionDetailModal } from './SubscriptionDetailModal';
import { SubscriptionPaymentModal } from './SubscriptionPaymentModal';
import { useProfileTheme } from './useProfileTheme';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

function TransactionHistoryModal({ onClose }: { onClose: () => void }) {
    const { bgCard, borderCls, textPrimary, textSecondary, textMuted, hoverBg, isDark } = useProfileTheme();
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-md rounded-2xl border ${bgCard} ${borderCls} p-6 space-y-4`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${textPrimary}`}>Lịch sử giao dịch</h3>
                    <button onClick={onClose} className={`p-1.5 rounded-lg ${hoverBg} ${textSecondary}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex flex-col items-center gap-3 py-8">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <svg className={`w-7 h-7 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p className={`font-medium text-sm ${textPrimary}`}>Coming Soon</p>
                    <p className={`text-xs text-center ${textSecondary}`}>
                        Lịch sử giao dịch đang được phát triển. Sẽ hiển thị 10 giao dịch gần nhất.
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
                >
                    Đóng
                </button>
            </div>
        </div>
    );
}

export function ProfileSubscriptionTab() {
    const { isAuthenticated } = useAuth();
    const { borderCls, textPrimary, textSecondary, textMuted, hoverBg, fieldBg, bgSub } = useProfileTheme();
    const setMySubscriptionStore = useSubscriptionStore(s => s.setMySubscription);

    const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
    const [mySubscription, setMySubscription] = useState<UserSubscriptionDto | null>(null);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
    const [loadingMySubscription, setLoadingMySubscription] = useState(false);
    const [detailSub, setDetailSub] = useState<SubscriptionDto | null>(null);
    const [paymentSub, setPaymentSub] = useState<SubscriptionDto | null>(null);
    const [showTransactionHistory, setShowTransactionHistory] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;

        setLoadingSubscriptions(true);
        setLoadingMySubscription(true);

        getSubscriptions()
            .then(data => setSubscriptions(data))
            .catch(err => console.error('[ProfileSubscriptionTab] getSubscriptions error:', err))
            .finally(() => setLoadingSubscriptions(false));

        getMySubscription()
            .then(data => {
                setMySubscription(data);
                setMySubscriptionStore(data);
            })
            .catch(err => console.error('[ProfileSubscriptionTab] getMySubscription error:', err))
            .finally(() => setLoadingMySubscription(false));
    }, [isAuthenticated]);

    return (
        <>
            <div className="space-y-6">

                {/* Section header: title + transaction history button inline */}
                <div className="flex items-center justify-between">
                    <h2 className={`text-base font-semibold ${textPrimary}`}>Quản lý gói thành viên</h2>
                    <button
                        onClick={() => setShowTransactionHistory(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${borderCls} ${textSecondary} ${hoverBg}`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Lịch sử giao dịch
                    </button>
                </div>

                {/* Current subscription — 3 columns */}
                <div>
                    <h3 className={`text-sm font-medium mb-3 ${textSecondary}`}>Gói hiện tại</h3>
                    {loadingMySubscription ? (
                        <div className="flex items-center gap-2 py-4">
                            <Spinner className="w-5 h-5 text-green-500" />
                            <span className={`text-sm ${textSecondary}`}>Đang tải...</span>
                        </div>
                    ) : mySubscription ? (
                        <div className={`rounded-xl border ${borderCls} p-4 grid grid-cols-3 gap-4`}>
                            {(
                                [
                                    ['Tên gói', mySubscription.subscriptionName || '—'],
                                    ['Workspace tối đa', mySubscription.maxWorkspaces != null ? mySubscription.maxWorkspaces.toString() : '—'],
                                    ['Ngày kết thúc', mySubscription.endDate ? new Date(mySubscription.endDate).toLocaleDateString('vi-VN') : '—'],
                                ] as [string, string][]
                            ).map(([label, value]) => (
                                <div key={label}>
                                    <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${textMuted}`}>{label}</p>
                                    <div className={`px-3 py-2 rounded-lg text-sm ${textPrimary} ${fieldBg} border ${borderCls}`}>{value}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`rounded-xl border ${borderCls} p-4 text-center text-sm ${textSecondary}`}>
                            Bạn chưa đăng ký gói thành viên nào
                        </div>
                    )}
                </div>

                {/* Available packages — 3-column portrait cards */}
                <div>
                    <h3 className={`text-sm font-medium mb-3 ${textSecondary}`}>Các gói thành viên</h3>
                    {loadingSubscriptions ? (
                        <div className="flex items-center gap-2 py-4">
                            <Spinner className="w-5 h-5 text-green-500" />
                            <span className={`text-sm ${textSecondary}`}>Đang tải...</span>
                        </div>
                    ) : subscriptions.length === 0 ? (
                        <p className={`text-sm ${textSecondary}`}>Không có gói thành viên nào</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-4">
                            {subscriptions.map(sub => (
                                <div
                                    key={sub.id}
                                    className={`rounded-xl border ${borderCls} p-4 flex flex-col gap-3 ${bgSub}`}
                                >
                                    <p className={`font-bold text-sm ${textPrimary} truncate`}>{sub.name}</p>
                                    <div className="flex-1 space-y-1.5">
                                        <p className={`text-xs ${textSecondary}`}>
                                            Workspace: <span className={`font-semibold ${textPrimary}`}>{sub.maxWorkspaces}</span>
                                        </p>
                                        <p className="text-base font-bold text-green-500">{formatPrice(sub.price)}</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => setDetailSub(sub)}
                                            className={`w-full py-1.5 rounded-lg text-xs font-medium border transition-colors ${borderCls} ${textSecondary} ${hoverBg}`}
                                        >
                                            Chi tiết
                                        </button>
                                        <button
                                            onClick={() => setPaymentSub(sub)}
                                            className="w-full py-1.5 rounded-lg text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
                                        >
                                            Đăng ký
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showTransactionHistory && (
                <TransactionHistoryModal onClose={() => setShowTransactionHistory(false)} />
            )}
            {detailSub && (
                <SubscriptionDetailModal sub={detailSub} onClose={() => setDetailSub(null)} />
            )}
            {paymentSub && (
                <SubscriptionPaymentModal sub={paymentSub} onClose={() => setPaymentSub(null)} />
            )}
        </>
    );
}
