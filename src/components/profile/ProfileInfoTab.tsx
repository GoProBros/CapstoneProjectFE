"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/auth';
import { ResetPasswordSection } from './ResetPasswordSection';
import { useProfileTheme } from './useProfileTheme';

interface ProfileInfoTabProps {
    user: User | null;
}

export function ProfileInfoTab({ user }: ProfileInfoTabProps) {
    const { user: authUser } = useAuth();
    const { borderCls, textPrimary, textSecondary, textMuted, fieldBg } = useProfileTheme();
    const [confirmDeactivate, setConfirmDeactivate] = useState(false);

    const displayUser = user || authUser;

    const leftFields: { label: string; value: string }[] = [
        { label: 'Họ và tên', value: displayUser?.fullName || '—' },
        { label: 'Vai trò', value: displayUser?.role || '—' },
    ];

    const rightFields: { label: string; value: string }[] = [
        { label: 'Email', value: displayUser?.email || '—' },
        { label: 'Số điện thoại', value: displayUser?.phoneNumber || '—' },
    ];

    const email = displayUser?.email || '';

    return (
        <div className="space-y-5">
            {/* Social Accounts */}
            <section className={`rounded-xl border ${borderCls} ${fieldBg} p-4 md:p-5`}>
                <h3 className={`text-base font-semibold mb-4 ${textPrimary}`}>Tài khoản liên kết</h3>
                <div className={`rounded-lg border ${borderCls} bg-transparent p-4 flex items-center justify-between gap-4`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/15 text-green-500 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <div>
                            <p className={`text-sm font-semibold ${textPrimary}`}>Telegram</p>
                            <p className={`text-xs ${textSecondary}`}>Nhận thông báo giao dịch thời gian thực</p>
                        </div>
                    </div>

                    <button className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors">
                        Đã kết nối
                    </button>
                </div>
            </section>
            {/* Change password */}
            <section className={`rounded-xl border ${borderCls} ${fieldBg} p-4 md:p-5`}>
                <h3 className={`text-base font-semibold mb-4 ${textPrimary}`}>Đổi mật khẩu</h3>
                <ResetPasswordSection email={email} />
            </section>
            {/* Deactive account */}
            <section className={`rounded-xl border border-red-500/30 ${fieldBg} p-4 md:p-5`}>
                <h3 className="text-base font-semibold mb-3 text-red-500">Vùng nguy hiểm</h3>
                <p className={`text-xs mb-4 ${textPrimary}`}>
                    Vô hiệu hóa tài khoản sẽ mất quyền truy cập. Tất cả dữ liệu cá nhân sẽ bị ẩn và không thể truy cập được. Hãy chắc chắn rằng bạn muốn thực hiện hành động này.
                </p>

                <label className={`flex items-center gap-2 text-sm mb-4 ${textPrimary}`}>
                    <input
                        type="checkbox"
                        checked={confirmDeactivate}
                        onChange={e => setConfirmDeactivate(e.target.checked)}
                        className="w-4 h-4 accent-red-500"
                    />
                    Tôi xác nhận muốn vô hiệu hóa tài khoản
                </label>

                <button
                    type="button"
                    disabled={!confirmDeactivate}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
                >
                    Vô hiệu hóa tài khoản
                </button>
                <p className={`text-[11px] mt-2 ${textMuted}`}>Chức năng này đang được phát triển.</p>
            </section>
        </div>
    );
}

