"use client";

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fileService } from '@/services/fileService';
import { FileCategory } from '@/types/file';
import type { User } from '@/types/auth';
import { AvatarDisplay } from './AvatarDisplay';
import { ResetPasswordSection } from './ResetPasswordSection';
import { Spinner } from './Spinner';
import { useProfileTheme } from './useProfileTheme';

interface ProfileInfoTabProps {
    user: User | null;
    avatarBlobUrl: string | null;
    loadingAvatar: boolean;
    onAvatarUpdated: (newBlobUrl: string) => void;
}

export function ProfileInfoTab({ user, avatarBlobUrl, loadingAvatar, onAvatarUpdated }: ProfileInfoTabProps) {
    const { user: authUser } = useAuth();
    const { isDark, borderCls, textPrimary, textSecondary, textMuted, hoverBg, fieldBg } = useProfileTheme();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

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
            onAvatarUpdated(URL.createObjectURL(blob));
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (err) {
            console.error('[ProfileInfoTab] Avatar upload failed:', err);
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const displayUser = user || authUser;
    const email = displayUser?.email || '';

    const infoFields: { label: string; value: string }[] = displayUser
        ? [
              { label: 'Email', value: displayUser.email },
              { label: 'Họ và tên', value: (displayUser as User).fullName },
              { label: 'Số điện thoại', value: (displayUser as User).phoneNumber || '—' },
              { label: 'Vai trò', value: displayUser.role },
          ]
        : [];

    return (
        <div className="p-6 space-y-8">

            {/* Avatar upload */}
            <section>
                <h2 className={`text-base font-semibold mb-4 ${textPrimary}`}>Ảnh đại diện</h2>
                <div className="flex items-center gap-5">
                    <AvatarDisplay blobUrl={avatarBlobUrl} loading={loadingAvatar} size={96} />
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
                                <><Spinner className="w-4 h-4" /> Đang tải lên...</>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Thay đổi ảnh
                                </>
                            )}
                        </button>
                        {uploadSuccess && (
                            <p className="text-xs text-green-500 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Cập nhật thành công
                            </p>
                        )}
                        <p className={`text-xs ${textMuted}`}>Định dạng hỗ trợ: JPG, PNG, GIF</p>
                    </div>
                </div>
            </section>

            <div className={`border-t ${borderCls}`} />

            {/* Two-column layout: account info + transaction history */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left column: Account info */}
                <section>
                    <h2 className={`text-base font-semibold mb-4 ${textPrimary}`}>Thông tin tài khoản</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {infoFields.map(({ label, value }) => (
                            <div key={label}>
                                <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${textMuted}`}>{label}</p>
                                <div className={`px-3 py-2 rounded-lg text-sm ${textPrimary} ${fieldBg} border ${borderCls} break-all`}>
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Reset Password */}
                    <div className="mt-6">
                        <ResetPasswordSection email={email} />
                    </div>
                </section>

                {/* Right column: Transaction history */}
                <section>
                    <h2 className={`text-base font-semibold mb-4 ${textPrimary}`}>Lịch sử giao dịch</h2>
                    <div className={`rounded-xl border ${borderCls} p-8 flex flex-col items-center justify-center gap-3`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <svg className={`w-6 h-6 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className={`font-medium text-sm ${textPrimary}`}>Coming Soon</p>
                            <p className={`text-xs mt-1 ${textSecondary}`}>
                                Lịch sử giao dịch đang được phát triển. Sẽ hiển thị 10 giao dịch gần nhất với tùy chọn tải thêm.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
