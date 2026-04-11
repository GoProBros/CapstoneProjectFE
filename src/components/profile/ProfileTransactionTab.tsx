"use client";

import React from 'react';
import { useProfileTheme } from './useProfileTheme';

export function ProfileTransactionTab() {
    const { borderCls, bgCard, fieldBg, textSecondary } = useProfileTheme();

    return (
        <div className={`rounded-2xl border ${borderCls} ${bgCard} p-8 shadow-sm`}>
            <h3 className="text-2xl font-extrabold">Lịch sử giao dịch</h3>
            <p className={`mt-2 text-sm ${textSecondary}`}>
                Tính năng đang được hoàn thiện. Dữ liệu giao dịch gần nhất sẽ sớm hiển thị tại đây.
            </p>

            <div className={`mt-6 rounded-lg border ${borderCls} ${fieldBg} p-4 text-sm ${textSecondary}`}>
                Chưa có giao dịch gần đây để hiển thị.
            </div>
        </div>
    );
}
