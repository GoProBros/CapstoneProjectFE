"use client";

import React from 'react';
import type { SubscriptionDto } from '@/types/subscription';
import { formatPrice, levelOrderLabel, parseAllowedModules } from './helpers';
import { useProfileTheme } from './useProfileTheme';

interface SubscriptionDetailModalProps {
    sub: SubscriptionDto;
    onClose: () => void;
}

export function SubscriptionDetailModal({ sub, onClose }: SubscriptionDetailModalProps) {
    const { bgCard, bgSub, borderCls, textPrimary, textSecondary, textMuted, hoverBg } = useProfileTheme();

    const modules = parseAllowedModules(sub.allowedModules);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-md rounded-2xl border ${bgCard} ${borderCls} p-6 space-y-4 max-h-[90vh] overflow-y-auto`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${textPrimary}`}>Chi tiết gói</h3>
                    <button onClick={onClose} className={`p-1.5 rounded-lg ${hoverBg} ${textSecondary}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className={`space-y-3 rounded-xl border ${borderCls} p-4 ${bgSub}`}>
                    {(
                        [
                            ['Tên gói', sub.name],
                            ['Cấp độ', levelOrderLabel(sub.levelOrder)],
                            ['Workspace tối đa', sub.maxWorkspaces.toString()],
                            ['Giá', formatPrice(sub.price)],
                            ['Thời hạn', `${sub.durationInDays} ngày`],
                        ] as [string, string][]
                    ).map(([label, value]) => (
                        <div key={label} className="flex justify-between items-center">
                            <span className={`text-sm ${textSecondary}`}>{label}</span>
                            <span className={`text-sm font-medium ${textPrimary}`}>{value}</span>
                        </div>
                    ))}
                </div>

                {/* Allowed Modules */}
                <div>
                    <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${textMuted}`}>
                        Module được sử dụng
                    </p>
                    {modules.length === 0 ? (
                        <p className={`text-sm ${textSecondary}`}>Tất cả module</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {modules.map(m => (
                                <span
                                    key={m}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${borderCls} ${textSecondary} ${bgSub}`}
                                >
                                    {m}
                                </span>
                            ))}
                        </div>
                    )}
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
