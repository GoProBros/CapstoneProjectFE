"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { fileService } from '@/services/fileService';
import { getMe } from '@/services/authService';
import { FileCategory } from '@/types/file';
import type { User } from '@/types/auth';

type ProfileTab = 'info' | 'subscription';

function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
    return (
        <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    );
}

function AvatarDisplay({
    blobUrl,
    loading,
    size = 80,
}: {
    blobUrl: string | null;
    loading: boolean;
    size?: number;
}) {
    return (
        <div
            className="rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ width: size, height: size }}
        >
            {loading ? (
                <Spinner className="w-5 h-5 text-green-500" />
            ) : blobUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={blobUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
                <svg
                    className="text-gray-400"
                    style={{ width: size * 0.45, height: size * 0.45 }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                </svg>
            )}
        </div>
    );
}

export default function ProfilePage() {
    const router = useRouter();
    const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const fileInputRef = useRef<HTMLInputElement>(null);
    const blobUrlRef = useRef<string | null>(null);

    const [activeTab, setActiveTab] = useState<ProfileTab>('info');
    const [user, setUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [avatarBlobUrl, setAvatarBlobUrl] = useState<string | null>(null);
    const [loadingAvatar, setLoadingAvatar] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Redirect to forbidden if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace('/forbidden');
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch fresh user data from API
    useEffect(() => {
        if (!isAuthenticated) return;
        setLoadingUser(true);
        getMe()
            .then(data => setUser(data))
            .catch(err => console.error('[ProfilePage] Failed to get user:', err))
            .finally(() => setLoadingUser(false));
    }, [isAuthenticated]);

    // Load avatar blob
    const loadAvatar = useCallback(async (userId: string) => {
        setLoadingAvatar(true);
        try {
            const blob = await fileService.downloadFile({
                category: FileCategory.Avatar,
                entityId: userId,
            });
            // Revoke previous blob URL to prevent memory leaks
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
            const url = URL.createObjectURL(blob);
            blobUrlRef.current = url;
            setAvatarBlobUrl(url);
        } catch {
            // No avatar yet — clear display
            setAvatarBlobUrl(null);
        } finally {
            setLoadingAvatar(false);
        }
    }, []);

    useEffect(() => {
        if (user?.id) loadAvatar(user.id);
    }, [user?.id, loadAvatar]);

    // Cleanup blob URL on unmount
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
            await loadAvatar(user.id);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (err) {
            console.error('[ProfilePage] Avatar upload failed:', err);
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Theme classes
    const bgPage = isDark ? 'bg-[#0e0d15]' : 'bg-gray-100';
    const bgCard = isDark ? 'bg-[#282832]' : 'bg-white';
    const borderCls = isDark ? 'border-gray-700' : 'border-gray-200';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const textMuted = isDark ? 'text-gray-500' : 'text-gray-400';
    const hoverBg = isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100';
    const fieldBg = isDark ? 'bg-[#1e1e26]' : 'bg-gray-50';

    // Loading state
    if (authLoading || loadingUser) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${bgPage}`}>
                <Spinner className="w-8 h-8 text-green-500" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    const displayUser = user || authUser;

    const infoFields: { label: string; value: string }[] = displayUser
        ? [
              { label: 'ID', value: displayUser.id },
              { label: 'Email', value: displayUser.email },
              { label: 'Họ và tên', value: displayUser.fullName },
              { label: 'Số điện thoại', value: (displayUser as User).phoneNumber || '—' },
              { label: 'Vai trò', value: displayUser.role },
              {
                  label: 'Xác thực email',
                  value: (displayUser as User).isEmailVerified ? 'Đã xác thực ✓' : 'Chưa xác thực',
              },
              { label: 'Gói thành viên', value: (displayUser as User).subscriptionLevel || '—' },
          ]
        : [];

    return (
        <div className={`min-h-screen ${bgPage}`}>
            {/* Top bar */}
            <header className={`flex items-center gap-4 px-6 py-4 border-b ${bgCard} ${borderCls}`}>
                <button
                    onClick={() => router.push('/dashboard')}
                    className={`p-2 rounded-lg transition-colors ${hoverBg} ${textSecondary}`}
                    title="Quay lại Dashboard"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                </button>
                <h1 className={`text-xl font-bold ${textPrimary}`}>Quản lý tài khoản</h1>
            </header>

            {/* Body */}
            <div className="flex max-w-5xl mx-auto p-6 gap-6">
                {/* ── Sidebar ── */}
                <aside
                    className={`w-64 flex-shrink-0 rounded-xl border ${bgCard} ${borderCls} flex flex-col overflow-hidden self-start`}
                >
                    {/* Avatar + name section */}
                    <div className="flex flex-col items-center px-6 py-8 gap-3">
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

                    {/* Separator */}
                    <div className={`border-t ${borderCls}`} />

                    {/* Tab list */}
                    <nav className="p-3 flex flex-col gap-1">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                                activeTab === 'info'
                                    ? 'bg-green-500/10 text-green-500'
                                    : `${textSecondary} ${hoverBg}`
                            }`}
                        >
                            <svg
                                className="w-4 h-4 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                            Thông tin người dùng
                        </button>

                        {/* Separator between tabs */}
                        <div className={`border-t ${borderCls} my-1`} />

                        <button
                            onClick={() => setActiveTab('subscription')}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                                activeTab === 'subscription'
                                    ? 'bg-green-500/10 text-green-500'
                                    : `${textSecondary} ${hoverBg}`
                            }`}
                        >
                            <svg
                                className="w-4 h-4 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                />
                            </svg>
                            Quản lý gói thành viên
                        </button>
                    </nav>
                </aside>

                {/* ── Main content ── */}
                <main
                    className={`flex-1 rounded-xl border ${bgCard} ${borderCls} overflow-hidden min-h-[480px]`}
                >
                    {/* Tab: Thông tin người dùng */}
                    {activeTab === 'info' && (
                        <div className="p-6 space-y-8">
                            {/* Avatar section */}
                            <section>
                                <h2 className={`text-base font-semibold mb-4 ${textPrimary}`}>
                                    Ảnh đại diện
                                </h2>
                                <div className="flex items-center gap-5">
                                    <AvatarDisplay
                                        blobUrl={avatarBlobUrl}
                                        loading={loadingAvatar}
                                        size={96}
                                    />
                                    <div className="flex flex-col gap-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarChange}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingAvatar}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
                                        >
                                            {uploadingAvatar ? (
                                                <>
                                                    <Spinner className="w-4 h-4" />
                                                    Đang tải lên...
                                                </>
                                            ) : (
                                                <>
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                    </svg>
                                                    Thay đổi ảnh
                                                </>
                                            )}
                                        </button>

                                        {uploadSuccess && (
                                            <p className="text-xs text-green-500 flex items-center gap-1">
                                                <svg
                                                    className="w-3.5 h-3.5"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                Cập nhật thành công
                                            </p>
                                        )}
                                        <p className={`text-xs ${textMuted}`}>
                                            Định dạng hỗ trợ: JPG, PNG, GIF
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Divider */}
                            <div className={`border-t ${borderCls}`} />

                            {/* User info fields */}
                            <section>
                                <h2 className={`text-base font-semibold mb-4 ${textPrimary}`}>
                                    Thông tin tài khoản
                                </h2>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {infoFields.map(({ label, value }) => (
                                        <div key={label}>
                                            <p
                                                className={`text-xs font-medium uppercase tracking-wide mb-1 ${textMuted}`}
                                            >
                                                {label}
                                            </p>
                                            <div
                                                className={`px-3 py-2 rounded-lg text-sm ${textPrimary} ${fieldBg} border ${borderCls} break-all`}
                                            >
                                                {value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Tab: Quản lý gói thành viên */}
                    {activeTab === 'subscription' && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[360px] gap-4 p-8">
                            <div
                                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                                }`}
                            >
                                <svg
                                    className={`w-8 h-8 ${textMuted}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    />
                                </svg>
                            </div>
                            <div className="text-center">
                                <p className={`text-lg font-semibold ${textPrimary}`}>Coming Soon</p>
                                <p className={`text-sm mt-1 ${textSecondary}`}>
                                    Tính năng quản lý gói thành viên đang được phát triển
                                </p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
