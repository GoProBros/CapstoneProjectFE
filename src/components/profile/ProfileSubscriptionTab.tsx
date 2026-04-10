"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSubscriptions, getMySubscription } from '@/services/subscriptionService';
import { syncMomoPayment, getPaymentStatus } from '@/services/paymentService';
import { PaymentProviderType } from '@/types/payment';
import type { SubscriptionDto, UserSubscriptionDto } from '@/types/subscription';
import { formatPrice, levelOrderLabel, parseAllowedModules } from './helpers';
import { Spinner } from './Spinner';
import { SubscriptionDetailModal } from './SubscriptionDetailModal';
import { SubscriptionPaymentModal } from './SubscriptionPaymentModal';
import { useProfileTheme } from './useProfileTheme';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

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

    const currentModules = useMemo(() => {
        return parseAllowedModules(mySubscription?.allowedModules);
    }, [mySubscription?.allowedModules]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const initialize = async () => {
            setLoadingSubscriptions(true);
            setLoadingMySubscription(true);

            // If returning from a payment gateway, sync the payment status first
            const pendingRaw = sessionStorage.getItem('pendingPayment');
            if (pendingRaw) {
                sessionStorage.removeItem('pendingPayment');
                try {
                    const pending: { orderCode: number; provider: number } = JSON.parse(pendingRaw);
                    if (pending.provider === PaymentProviderType.Momo) {
                        await syncMomoPayment(pending.orderCode).catch(err =>
                            console.error('[ProfileSubscriptionTab] MoMo sync error:', err),
                        );
                    } else {
                        // PayOS: check payment status (webhook handled server-side but verify here)
                        await getPaymentStatus(pending.orderCode).catch(err =>
                            console.error('[ProfileSubscriptionTab] PayOS status check error:', err),
                        );
                    }
                } catch {
                    // ignore malformed data
                }
            }

            await Promise.allSettled([
                getSubscriptions()
                    .then(data => setSubscriptions(data))
                    .catch(err => console.error('[ProfileSubscriptionTab] getSubscriptions error:', err))
                    .finally(() => setLoadingSubscriptions(false)),
                getMySubscription()
                    .then(data => {
                        setMySubscription(data);
                        setMySubscriptionStore(data);
                    })
                    .catch(err => console.error('[ProfileSubscriptionTab] getMySubscription error:', err))
                    .finally(() => setLoadingMySubscription(false)),
            ]);
        };

        initialize();
    }, [isAuthenticated, setMySubscriptionStore]);

    return (
        <>
            <div className="space-y-6">

                <div className="flex items-center justify-between">
                    <h2 className={`text-base font-semibold ${textPrimary}`}>Quản lý gói thành viên</h2>
                </div>

                <section className={`rounded-xl border ${borderCls} p-4 md:p-5 ${bgSub}`}>
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <h3 className={`text-sm md:text-base font-semibold ${textPrimary}`}>Gói đăng ký hiện tại</h3>
                        {mySubscription && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-500/20 text-green-500">
                                {levelOrderLabel(mySubscription.levelOrder)}
                            </span>
                        )}
                    </div>

                    {loadingMySubscription ? (
                        <div className="flex items-center gap-2 py-6">
                            <Spinner className="w-5 h-5 text-green-500" />
                            <span className={`text-sm ${textSecondary}`}>Đang tải thông tin gói hiện tại...</span>
                        </div>
                    ) : mySubscription ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-7 space-y-2">
                                {(
                                    [
                                        ['Tên gói', mySubscription.subscriptionName || '—'],
                                        ['Workspace tối đa', mySubscription.maxWorkspaces != null ? mySubscription.maxWorkspaces.toString() : '—'],
                                        ['Ngày bắt đầu', mySubscription.startDate ? new Date(mySubscription.startDate).toLocaleDateString('vi-VN') : '—'],
                                        ['Ngày kết thúc', mySubscription.endDate ? new Date(mySubscription.endDate).toLocaleDateString('vi-VN') : '—'],
                                    ] as [string, string][]
                                ).map(([label, value]) => (
                                    <div key={label} className={`rounded-lg border ${borderCls} ${fieldBg} px-3 py-2`}>
                                        <p className={`text-[10px] uppercase tracking-wider font-medium ${textMuted}`}>{label}</p>
                                        <p className={`text-sm font-semibold ${textPrimary}`}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className={`lg:col-span-5 rounded-lg border ${borderCls} ${fieldBg} p-3`}>
                                <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${textMuted}`}>Modules được phép</p>
                                {currentModules.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {currentModules.map(moduleName => (
                                            <div
                                                key={moduleName}
                                                className={`rounded-md border ${borderCls} px-2.5 py-1.5 text-xs ${textPrimary} truncate`}
                                                title={moduleName}
                                            >
                                                {moduleName}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={`text-xs ${textSecondary}`}>Chưa có cấu hình module cho gói hiện tại.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={`rounded-lg border ${borderCls} p-4 text-sm ${textSecondary}`}>
                            Bạn chưa đăng ký gói thành viên nào.
                        </div>
                    )}
                </section>

                <section className={`rounded-xl border ${borderCls} p-4 md:p-5 ${bgSub}`}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className={`text-sm md:text-base font-semibold ${textPrimary}`}>Các gói có thể nâng cấp</h3>
                        <span className={`text-xs ${textMuted}`}>Vuốt ngang để xem thêm (nếu có)</span>
                    </div>

                    {loadingSubscriptions ? (
                        <div className="flex items-center gap-2 py-6">
                            <Spinner className="w-5 h-5 text-green-500" />
                            <span className={`text-sm ${textSecondary}`}>Đang tải danh sách gói...</span>
                        </div>
                    ) : subscriptions.length === 0 ? (
                        <p className={`text-sm ${textSecondary}`}>Không có gói thành viên nào.</p>
                    ) : (
                        <div className="overflow-x-auto pb-2">
                            <div className="flex gap-4 min-w-max">
                                {subscriptions.map(sub => (
                                    <div
                                        key={sub.id}
                                        className={`w-[230px] rounded-xl border ${borderCls} ${fieldBg} p-4 flex flex-col justify-between gap-4`}
                                    >
                                        <div className="space-y-2">
                                            <p className={`font-bold text-base ${textPrimary}`}>{sub.name}</p>
                                            <p className={`text-sm ${textSecondary}`}>
                                                Workspace tối đa: <span className={`font-semibold ${textPrimary}`}>{sub.maxWorkspaces}</span>
                                            </p>
                                            <p className={`text-sm ${textSecondary}`}>
                                                Thời hạn: <span className={`font-semibold ${textPrimary}`}>{sub.durationInDays} ngày</span>
                                            </p>
                                            <p className="text-lg font-bold text-green-500">{formatPrice(sub.price)}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <button
                                                onClick={() => setDetailSub(sub)}
                                                className={`w-full py-2 rounded-lg text-sm font-medium border transition-colors ${borderCls} ${textSecondary} ${hoverBg}`}
                                            >
                                                Chi tiết
                                            </button>
                                            <button
                                                onClick={() => setPaymentSub(sub)}
                                                className="w-full py-2 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
                                            >
                                                Nâng cấp
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {detailSub && (
                <SubscriptionDetailModal
                    sub={detailSub}
                    onClose={() => setDetailSub(null)}
                    onUpgrade={selectedSub => {
                        setDetailSub(null);
                        setPaymentSub(selectedSub);
                    }}
                />
            )}
            {paymentSub && (
                <SubscriptionPaymentModal sub={paymentSub} onClose={() => setPaymentSub(null)} />
            )}
        </>
    );
}
