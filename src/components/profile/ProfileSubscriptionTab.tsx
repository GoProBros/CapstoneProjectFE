"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSubscriptions, getMySubscription } from '@/services/subscriptionService';
import type { SubscriptionDto, UserSubscriptionDto } from '@/types/subscription';
import { formatPrice, levelOrderLabel } from './helpers';
import { Spinner } from './Spinner';
import { SubscriptionDetailModal } from './SubscriptionDetailModal';
import { SubscriptionPaymentModal } from './SubscriptionPaymentModal';
import { useProfileTheme } from './useProfileTheme';

export function ProfileSubscriptionTab() {
    const { isAuthenticated } = useAuth();
    const { borderCls, textPrimary, textSecondary, textMuted, hoverBg, fieldBg, bgSub } = useProfileTheme();

    const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
    const [mySubscription, setMySubscription] = useState<UserSubscriptionDto | null>(null);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
    const [loadingMySubscription, setLoadingMySubscription] = useState(false);
    const [detailSub, setDetailSub] = useState<SubscriptionDto | null>(null);
    const [paymentSub, setPaymentSub] = useState<SubscriptionDto | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        setLoadingSubscriptions(true);
        setLoadingMySubscription(true);

        getSubscriptions()
            .then(data => setSubscriptions(data))
            .catch(err => console.error('[ProfileSubscriptionTab] getSubscriptions error:', err))
            .finally(() => setLoadingSubscriptions(false));

        getMySubscription()
            .then(data => setMySubscription(data))
            .catch(err => console.error('[ProfileSubscriptionTab] getMySubscription error:', err))
            .finally(() => setLoadingMySubscription(false));
    }, [isAuthenticated]);

    return (
        <>
            <div className="p-6 space-y-8">

                {/* Section 1: Current subscription */}
                <section>
                    <h2 className={`text-base font-semibold mb-4 ${textPrimary}`}>Gói thành viên hiện tại</h2>
                    {loadingMySubscription ? (
                        <div className="flex items-center gap-2 py-4">
                            <Spinner className="w-5 h-5 text-green-500" />
                            <span className={`text-sm ${textSecondary}`}>Đang tải...</span>
                        </div>
                    ) : mySubscription ? (
                        <div className={`rounded-xl border ${borderCls} p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`}>
                            {(
                                [
                                    ['Gói', mySubscription.subscriptionName || '—'],
                                    ['Cấp độ', levelOrderLabel(mySubscription.levelOrder)],
                                    ['Workspace tối đa', mySubscription.maxWorkspaces != null ? mySubscription.maxWorkspaces.toString() : '—'],
                                    ['Giá', mySubscription.price != null ? formatPrice(mySubscription.price) : '—'],
                                    ['Thời hạn', mySubscription.durationInDays != null ? `${mySubscription.durationInDays} ngày` : '—'],
                                    ['Ngày bắt đầu', mySubscription.startDate ? new Date(mySubscription.startDate).toLocaleDateString('vi-VN') : '—'],
                                    ['Ngày kết thúc', mySubscription.endDate ? new Date(mySubscription.endDate).toLocaleDateString('vi-VN') : '—'],
                                    ['Trạng thái', mySubscription.status || '—'],
                                    ['Còn hiệu lực', mySubscription.isActive ? 'Có ✓' : 'Không'],
                                ] as [string, string][]
                            ).map(([label, value]) => (
                                <div key={label}>
                                    <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${textMuted}`}>{label}</p>
                                    <div className={`px-3 py-2 rounded-lg text-sm ${textPrimary} ${fieldBg} border ${borderCls}`}>{value}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`rounded-xl border ${borderCls} p-6 text-center text-sm ${textSecondary}`}>
                            Bạn chưa đăng ký gói thành viên nào
                        </div>
                    )}
                </section>

                <div className={`border-t ${borderCls}`} />

                {/* Section 2: Available packages (4-col grid) */}
                <section>
                    <h2 className={`text-base font-semibold mb-4 ${textPrimary}`}>Các gói thành viên</h2>
                    {loadingSubscriptions ? (
                        <div className="flex items-center gap-2 py-4">
                            <Spinner className="w-5 h-5 text-green-500" />
                            <span className={`text-sm ${textSecondary}`}>Đang tải...</span>
                        </div>
                    ) : subscriptions.length === 0 ? (
                        <p className={`text-sm ${textSecondary}`}>Không có gói thành viên nào</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {subscriptions.map(sub => (
                                <div
                                    key={sub.id}
                                    className={`rounded-xl border ${borderCls} p-5 flex flex-col gap-3 ${bgSub}`}
                                >
                                    <div>
                                        <p className={`font-bold text-base ${textPrimary}`}>{sub.name}</p>
                                        <p className={`text-xs mt-0.5 ${textMuted}`}>{levelOrderLabel(sub.levelOrder)}</p>
                                    </div>
                                    <div className={`flex-1 space-y-1 text-xs ${textSecondary}`}>
                                        <p>Workspace tối đa: <span className={`font-medium ${textPrimary}`}>{sub.maxWorkspaces}</span></p>
                                        <p className="text-xl font-bold text-green-500 pt-1">{formatPrice(sub.price)}</p>
                                        <p className={textMuted}>{sub.durationInDays} ngày</p>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => setDetailSub(sub)}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${borderCls} ${textSecondary} ${hoverBg}`}
                                        >
                                            Chi tiết
                                        </button>
                                        <button
                                            onClick={() => setPaymentSub(sub)}
                                            className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
                                        >
                                            Đăng ký
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {detailSub && (
                <SubscriptionDetailModal sub={detailSub} onClose={() => setDetailSub(null)} />
            )}
            {paymentSub && (
                <SubscriptionPaymentModal sub={paymentSub} onClose={() => setPaymentSub(null)} />
            )}
        </>
    );
}
