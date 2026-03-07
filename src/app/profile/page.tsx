"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fileService } from '@/services/fileService';
import { getMe } from '@/services/authService';
import { FileCategory } from '@/types/file';
import type { User } from '@/types/auth';
import { Spinner } from '@/components/profile/Spinner';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { ProfileInfoTab } from '@/components/profile/ProfileInfoTab';
import { ProfileSubscriptionTab } from '@/components/profile/ProfileSubscriptionTab';
import { useProfileTheme } from '@/components/profile/useProfileTheme';

type ProfileTab = 'info' | 'subscription';

export default function ProfilePage() {
    const router = useRouter();
    const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
    const { bgPage, bgCard, borderCls, textPrimary, textSecondary, hoverBg } = useProfileTheme();

    const blobUrlRef = useRef<string | null>(null);

    const [activeTab, setActiveTab] = useState<ProfileTab>('info');
    const [user, setUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [avatarBlobUrl, setAvatarBlobUrl] = useState<string | null>(null);
    const [loadingAvatar, setLoadingAvatar] = useState(false);

    // Auth guard
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace('/forbidden');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (!isAuthenticated) return;
        setLoadingUser(true);
        getMe()
            .then(data => setUser(data))
            .catch(err => console.error('[Profile] getMe error:', err))
            .finally(() => setLoadingUser(false));
    }, [isAuthenticated]);

    // ─── Avatar ───────────────────────────────────────────────────────────────

    const loadAvatar = useCallback(async (userId: string) => {
        setLoadingAvatar(true);
        try {
            const blob = await fileService.downloadFile({
                category: FileCategory.Avatar,
                entityId: userId,
            });
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
            const url = URL.createObjectURL(blob);
            blobUrlRef.current = url;
            setAvatarBlobUrl(url);
        } catch {
            setAvatarBlobUrl(null);
        } finally {
            setLoadingAvatar(false);
        }
    }, []);

    useEffect(() => {
        if (user?.id) loadAvatar(user.id);
    }, [user?.id, loadAvatar]);

    useEffect(() => {
        return () => {
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        };
    }, []);

    // Called by ProfileInfoTab after a new avatar is uploaded
    const handleAvatarUpdated = useCallback((newBlobUrl: string) => {
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = newBlobUrl;
        setAvatarBlobUrl(newBlobUrl);
    }, []);

    if (authLoading || loadingUser) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${bgPage}`}>
                <Spinner className="w-8 h-8 text-green-500" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    const displayUser = user || authUser;

    return (
        <div className={`h-screen flex flex-col overflow-hidden ${bgPage}`}>
            {/* Top bar */}
            <header className={`flex items-center gap-4 px-6 py-4 border-b flex-shrink-0 ${bgCard} ${borderCls}`}>
                <button
                    onClick={() => router.push('/dashboard')}
                    className={`p-2 rounded-lg transition-colors ${hoverBg} ${textSecondary}`}
                    title="Quay lại Dashboard"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className={`text-xl font-bold ${textPrimary}`}>Quản lý tài khoản</h1>
            </header>

            {/* Body: sidebar always on left + scrollable content */}
            <div className="flex flex-1 overflow-hidden">

                <ProfileSidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    avatarBlobUrl={avatarBlobUrl}
                    loadingAvatar={loadingAvatar}
                    displayUser={displayUser}
                />
                <main className="flex-1 overflow-y-auto">
                    {activeTab === 'info' && (
                        <ProfileInfoTab
                            user={user}
                            avatarBlobUrl={avatarBlobUrl}
                            loadingAvatar={loadingAvatar}
                            onAvatarUpdated={handleAvatarUpdated}
                        />
                    )}
                    {activeTab === 'subscription' && <ProfileSubscriptionTab />}
                </main>
            </div>
        </div>
    );
}

