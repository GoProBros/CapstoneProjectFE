"use client";

import React, { useState } from 'react';
import type { SubscriptionDto } from '@/types/subscription';
import { PaymentProviderType } from '@/types/payment';
import type { PaymentProviderValue } from '@/types/payment';
import { createPaymentLink } from '@/services/admin/paymentService';
import { formatPrice } from './helpers';
import { Spinner } from './Spinner';
import { useProfileTheme } from './useProfileTheme';

interface SubscriptionPaymentModalProps {
    sub: SubscriptionDto;
    onClose: () => void;
}

export function SubscriptionPaymentModal({ sub, onClose }: SubscriptionPaymentModalProps) {
    const { bgCard, bgSub, borderCls, textPrimary, textSecondary, textMuted, hoverBg } = useProfileTheme();

    const [paymentProvider, setPaymentProvider] = useState<PaymentProviderValue>(PaymentProviderType.PayOS);
    const [creatingPayment, setCreatingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const handleCreatePayment = async () => {
        setCreatingPayment(true);
        setPaymentError(null);
        try {
            const result = await createPaymentLink(sub.id, paymentProvider);
            // Store pending payment so the profile page can sync after redirect returns
            sessionStorage.setItem('pendingPayment', JSON.stringify({
                orderCode: result.orderCode,
                provider: paymentProvider,
            }));
            window.location.href = result.checkoutUrl;
        } catch (err: unknown) {
            setPaymentError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tạo liên kết thanh toán');
        } finally {
            setCreatingPayment(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => !creatingPayment && onClose()}
        >
            <div
                className={`w-full max-w-sm rounded-2xl border ${bgCard} ${borderCls} p-6 space-y-5`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${textPrimary}`}>Đăng ký gói</h3>
                    {!creatingPayment && (
                        <button onClick={onClose} className={`p-1.5 rounded-lg ${hoverBg} ${textSecondary}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Package summary */}
                <div className={`rounded-xl border ${borderCls} p-4 ${bgSub}`}>
                    <p className={`font-bold ${textPrimary}`}>{sub.name}</p>
                    <p className="text-2xl font-bold text-green-500 mt-1">{formatPrice(sub.price)}</p>
                    <p className={`text-xs mt-1 ${textMuted}`}>{sub.durationInDays} ngày</p>
                </div>

                {/* Provider selection */}
                <div>
                    <p className={`text-sm font-medium mb-3 ${textPrimary}`}>Chọn phương thức thanh toán</p>
                    <div className="space-y-2">
                        {(
                            [
                                [PaymentProviderType.PayOS, 'PayOS', 'Thanh toán qua PayOS'],
                                [PaymentProviderType.Momo, 'MoMo', 'Thanh toán qua Ví MoMo (sandbox)'],
                            ] as [PaymentProviderValue, string, string][]
                        ).map(([val, name, desc]) => (
                            <label
                                key={val}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    paymentProvider === val
                                        ? 'border-green-500 bg-green-500/10'
                                        : `${borderCls} ${hoverBg}`
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="provider"
                                    value={val}
                                    checked={paymentProvider === val}
                                    onChange={() => setPaymentProvider(val)}
                                    className="hidden"
                                />
                                <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        paymentProvider === val ? 'border-green-500' : borderCls
                                    }`}
                                >
                                    {paymentProvider === val && (
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                    )}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${textPrimary}`}>{name}</p>
                                    <p className={`text-xs ${textSecondary}`}>{desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {paymentError && <p className="text-xs text-red-500">{paymentError}</p>}

                <button
                    onClick={handleCreatePayment}
                    disabled={creatingPayment}
                    className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {creatingPayment ? (
                        <><Spinner className="w-4 h-4" /> Đang xử lý...</>
                    ) : (
                        'Xác nhận thanh toán'
                    )}
                </button>
            </div>
        </div>
    );
}
