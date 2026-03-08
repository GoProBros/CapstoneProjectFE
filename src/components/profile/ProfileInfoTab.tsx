"use client";

import React from 'react';
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

    const displayUser = user || authUser;

    const leftFields: { label: string; value: string }[] = displayUser
        ? [
              { label: 'Họ và tên', value: (displayUser as User).fullName || '—' },
              { label: 'Vai trò', value: displayUser.role || '—' },
          ]
        : [];

    const rightFields: { label: string; value: string }[] = displayUser
        ? [
              { label: 'Email', value: displayUser.email || '—' },
              { label: 'Số điện thoại', value: (displayUser as User).phoneNumber || '—' },
          ]
        : [];

    const email = displayUser?.email || '';

    return (
        <div className="space-y-4">
            <h2 className={`text-base font-semibold ${textPrimary}`}>Thông tin tài khoản</h2>

            {/* 2-column grid: (Họ tên - Vai trò) | (Email - Số điện thoại) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left column */}
                <div className="space-y-4">
                    {leftFields.map(({ label, value }) => (
                        <div key={label}>
                            <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${textMuted}`}>{label}</p>
                            <div className={`px-3 py-2 rounded-lg text-sm ${textPrimary} ${fieldBg} border ${borderCls} break-all`}>
                                {value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right column */}
                <div className="space-y-4">
                    {rightFields.map(({ label, value }) => (
                        <div key={label}>
                            <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${textMuted}`}>{label}</p>
                            <div className={`px-3 py-2 rounded-lg text-sm ${textPrimary} ${fieldBg} border ${borderCls} break-all`}>
                                {value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reset Password */}
            <div className="pt-1">
                <ResetPasswordSection email={email} />
            </div>
        </div>
    );
}

