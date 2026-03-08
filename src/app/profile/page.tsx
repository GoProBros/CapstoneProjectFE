"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fileService } from '@/services/fileService';
import { getMe } from '@/services/authService';
import { FileCategory } from '@/types/file';
import type { User } from '@/types/auth';
import { Spinner } from '@/components/profile/Spinner';
import { AvatarDisplay } from '@/components/profile/AvatarDisplay';
import { ProfileInfoTab } from '@/components/profile/ProfileInfoTab';
import { ProfileSubscriptionTab } from '@/components/profile/ProfileSubscriptionTab';
import { useProfileTheme } from '@/components/profile/useProfileTheme';

export default function ProfilePage() {
    const router = useRouter();
    const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
    const { bgPage, bgCard, borderCls, textPrimary, textSecondary, textMuted, hoverBg } = useProfileTheme();

    const blobUrlRef = useRef<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [avatarBlobUrl, setAvatarBlobUrl] = useState<string | null>(null);
    const [loadingAvatar, setLoadingAvatar] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

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

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setUploadingAvatar(true);
        setUploadSuccess(false);
        try {
            await fileService.uploadFile({
                file,
                category: FileCategory.Avatar,
                relatedEntityId: user.id,
            });
            const blob = await fileService.downloadFile({
                category: FileCategory.Avatar,
                entityId: user.id,
            });
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
            const url = URL.createObjectURL(blob);
            blobUrlRef.current = url;
            setAvatarBlobUrl(url);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (err) {
            console.error('[Profile] Avatar upload failed:', err);
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (authLoading || loadingUser) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${bgPage}`}>
                <Spinner className="w-8 h-8 text-green-500" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className={`min-h-screen ${bgPage} flex items-start justify-center p-4 py-8`}>
            <div className={`w-full max-w-2xl rounded-2xl border ${bgCard} ${borderCls} shadow-2xl`}>

                {/* Modal header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${borderCls}`}>
                    <h1 className={`text-lg font-bold ${textPrimary}`}>Quản lý tài khoản</h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className={`p-2 rounded-lg transition-colors ${hoverBg} ${textSecondary}`}
                        title="Quay lại Dashboard"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* Section 1: Avatar */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                            <AvatarDisplay blobUrl={avatarBlobUrl} loading={loadingAvatar} size={96} />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors disabled:opacity-60 shadow"
                                title="Thay đổi ảnh"
                            >
                                {uploadingAvatar ? (
                                    <Spinner className="w-3.5 h-3.5" />
                                ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                        {uploadSuccess && (
                            <p className="text-xs text-green-500 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Cập nhật ảnh thành công
                            </p>
                        )}
                        <p className={`text-xs ${textMuted}`}>Định dạng hỗ trợ: JPG, PNG, GIF</p>
                    </div>

                    <div className={`border-t ${borderCls}`} />

                    {/* Section 2: Profile info */}
                    <ProfileInfoTab user={user} />

                    <div className={`border-t ${borderCls}`} />

                    {/* Section 3: Subscription */}
                    <ProfileSubscriptionTab />

                </div>
            </div>
        </div>
    );
}

