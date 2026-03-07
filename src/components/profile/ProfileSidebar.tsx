"use client";

import React from 'react';
import { AvatarDisplay } from './AvatarDisplay';
import { useProfileTheme } from './useProfileTheme';

type ProfileTab = 'info' | 'subscription';

interface ProfileSidebarProps {
    activeTab: ProfileTab;
    onTabChange: (tab: ProfileTab) => void;
    avatarBlobUrl: string | null;
    loadingAvatar: boolean;
    displayUser: { fullName?: string; email?: string } | null;
}

export function ProfileSidebar({
    activeTab,
    onTabChange,
    avatarBlobUrl,
    loadingAvatar,
    displayUser,
}: ProfileSidebarProps) {
    const { bgCard, borderCls, textPrimary, textSecondary, hoverBg } = useProfileTheme();

    return (
        <aside className={`w-64 flex-shrink-0 border-r flex flex-col overflow-y-auto ${bgCard} ${borderCls}`}>
            {/* Avatar + name */}
            <div className="flex flex-col items-center px-6 py-8 gap-3 flex-shrink-0">
                <AvatarDisplay blobUrl={avatarBlobUrl} loading={loadingAvatar} size={80} />
                <div className="text-center">
                    <p className={`font-semibold text-sm ${textPrimary}`}>
                        {displayUser?.fullName || '—'}
                    </p>
                    <p className={`text-xs mt-1 ${textSecondary}`}>
                        {displayUser?.email || '—'}
                    </p>
                </div>
            </div>

            <div className={`border-t ${borderCls} flex-shrink-0`} />

            {/* Tab navigation */}
            <nav className="p-3 flex flex-col gap-1 flex-shrink-0">
                <button
                    onClick={() => onTabChange('info')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                        activeTab === 'info'
                            ? 'bg-green-500/10 text-green-500'
                            : `${textSecondary} ${hoverBg}`
                    }`}
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Thông tin người dùng
                </button>

                <div className={`border-t ${borderCls} my-1`} />

                <button
                    onClick={() => onTabChange('subscription')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                        activeTab === 'subscription'
                            ? 'bg-green-500/10 text-green-500'
                            : `${textSecondary} ${hoverBg}`
                    }`}
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Quản lý gói thành viên
                </button>
            </nav>
        </aside>
    );
}
