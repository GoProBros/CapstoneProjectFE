"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/auth';
import { getTelegramStartLink } from '@/services/telegramService';
import { ResetPasswordSection } from './ResetPasswordSection';
import { useProfileTheme } from './useProfileTheme';

interface ProfileInfoTabProps {
    user: User | null;
}

export function ProfileInfoTab({ user }: ProfileInfoTabProps) {
    const { user: authUser } = useAuth();
    const { borderCls, textPrimary, textSecondary, textMuted, fieldBg, hoverBg } = useProfileTheme();
    const [confirmDeactivate, setConfirmDeactivate] = useState(false);
    const [connectingTelegram, setConnectingTelegram] = useState(false);
    const [telegramError, setTelegramError] = useState<string | null>(null);

    const displayUser = user || authUser;
    const isTelegramLinked = Boolean(displayUser?.isTelegramLinked && displayUser?.telegramChatId);

    const leftFields: { label: string; value: string }[] = [
        { label: 'Họ và tên', value: displayUser?.fullName || '—' },
        { label: 'Vai trò', value: displayUser?.role || '—' },
        { label: 'Trạng thái Telegram', value: isTelegramLinked ? 'Đã liên kết' : 'Chưa liên kết' },
    ];

    const rightFields: { label: string; value: string }[] = [
        { label: 'Email', value: displayUser?.email || '—' },
        { label: 'Số điện thoại', value: displayUser?.phoneNumber || '—' },
        { label: 'Mã chat Telegram', value: displayUser?.telegramChatId || '—' },
    ];

    const email = displayUser?.email || '';

    const handleConnectTelegram = async () => {
        setConnectingTelegram(true);
        setTelegramError(null);

        try {
            const result = await getTelegramStartLink();
            const targetUrl = result.deepLink || (result.botUsername ? `https://t.me/${result.botUsername}?start=${result.startToken}` : null);

            if (!targetUrl) {
                throw new Error('Không tìm thấy liên kết Telegram hợp lệ');
            }

            window.open(targetUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            setTelegramError(error instanceof Error ? error.message : 'Không thể mở liên kết Telegram');
        } finally {
            setConnectingTelegram(false);
        }
    };

    return (
        <div className="space-y-5">
            <section className={`rounded-xl border ${borderCls} ${fieldBg} p-4 md:p-5`}>
                <h3 className={`mb-4 text-base font-semibold ${textPrimary}`}>Tài khoản liên kết</h3>
                <div className={`flex flex-col gap-4 rounded-lg border ${borderCls} bg-transparent p-4 md:flex-row md:items-center md:justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/15 text-green-500">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <div>
                            <p className={`text-sm font-semibold ${textPrimary}`}>Telegram</p>
                            <p className={`text-xs ${textSecondary}`}>Nhận thông báo giao dịch thời gian thực</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 md:items-end">
                        <button
                            type="button"
                            className={`w-fit rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                isTelegramLinked
                                    ? 'bg-green-500 text-white'
                                    : `bg-amber-500/15 text-amber-500 ${hoverBg}`
                            }`}
                        >
                            {isTelegramLinked ? 'Đã kết nối' : 'Chưa kết nối'}
                        </button>

                        {!isTelegramLinked && (
                            <button
                                type="button"
                                onClick={handleConnectTelegram}
                                disabled={connectingTelegram}
                                className="w-fit rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {connectingTelegram ? 'Đang mở Telegram...' : 'Kết nối Telegram'}
                            </button>
                        )}
                    </div>
                </div>
                {telegramError && <p className="mt-2 text-xs text-red-500">{telegramError}</p>}
            </section>

            <section className={`rounded-xl border ${borderCls} ${fieldBg} p-4 md:p-5`}>
                <h3 className={`mb-4 text-base font-semibold ${textPrimary}`}>Thông tin tài khoản</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {[...leftFields, ...rightFields].map((field) => (
                        <div key={field.label} className={`rounded-lg border ${borderCls} bg-transparent p-3`}>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>{field.label}</p>
                            <p className={`mt-1 text-sm font-medium ${textPrimary}`}>{field.value}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className={`rounded-xl border ${borderCls} ${fieldBg} p-4 md:p-5`}>
                <h3 className={`mb-4 text-base font-semibold ${textPrimary}`}>Đổi mật khẩu</h3>
                <ResetPasswordSection email={email} />
            </section>

            <section className={`rounded-xl border border-red-500/30 ${fieldBg} p-4 md:p-5`}>
                <h3 className="mb-3 text-base font-semibold text-red-500">Vùng nguy hiểm</h3>
                <p className={`mb-4 text-xs ${textPrimary}`}>
                    Vô hiệu hóa tài khoản sẽ mất quyền truy cập. Tất cả dữ liệu cá nhân sẽ bị ẩn và không thể truy cập được. Hãy chắc chắn rằng bạn muốn thực hiện hành động này.
                </p>

                <label className={`mb-4 flex items-center gap-2 text-sm ${textPrimary}`}>
                    <input
                        type="checkbox"
                        checked={confirmDeactivate}
                        onChange={e => setConfirmDeactivate(e.target.checked)}
                        className="h-4 w-4 accent-red-500"
                    />
                    Tôi xác nhận muốn vô hiệu hóa tài khoản
                </label>

                <button
                    type="button"
                    disabled={!confirmDeactivate}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Vô hiệu hóa tài khoản
                </button>
                <p className={`mt-2 text-[11px] ${textMuted}`}>Chức năng này đang được phát triển.</p>
            </section>
        </div>
    );
}
