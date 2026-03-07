"use client";

import React, { useState } from 'react';
import { forgotPassword, resetPassword } from '@/services/authService';
import { Spinner } from './Spinner';
import { useProfileTheme } from './useProfileTheme';

type ResetStep = 'idle' | 'sending' | 'form' | 'submitting' | 'done';

interface ResetPasswordSectionProps {
    email: string;
}

export function ResetPasswordSection({ email }: ResetPasswordSectionProps) {
    const { borderCls, textPrimary, textSecondary, textMuted, hoverBg, fieldBg } = useProfileTheme();

    const [resetStep, setResetStep] = useState<ResetStep>('idle');
    const [resetOtp, setResetOtp] = useState('');
    const [resetNewPwd, setResetNewPwd] = useState('');
    const [resetConfirmPwd, setResetConfirmPwd] = useState('');
    const [resetError, setResetError] = useState<string | null>(null);

    const handleSendOtp = async () => {
        if (!email) return;
        setResetStep('sending');
        setResetError(null);
        try {
            await forgotPassword(email);
            setResetOtp('');
            setResetNewPwd('');
            setResetConfirmPwd('');
            setResetStep('form');
        } catch (err: unknown) {
            setResetError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi gửi OTP');
            setResetStep('idle');
        }
    };

    const handleSubmitReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (resetNewPwd !== resetConfirmPwd) {
            setResetError('Mật khẩu xác nhận không khớp');
            return;
        }
        if (resetNewPwd.length < 6) {
            setResetError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        if (!email) return;
        setResetStep('submitting');
        setResetError(null);
        try {
            await resetPassword(email, resetOtp, resetNewPwd);
            setResetStep('done');
        } catch (err: unknown) {
            setResetError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
            setResetStep('form');
        }
    };

    if (resetStep === 'done') {
        return (
            <div className="flex items-center gap-2 text-sm text-green-500">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Mật khẩu đã được đặt lại thành công!
                <button
                    onClick={() => { setResetStep('idle'); setResetError(null); }}
                    className={`ml-2 text-xs underline ${textMuted}`}
                >
                    Đóng
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <button
                onClick={handleSendOtp}
                disabled={resetStep === 'sending' || resetStep === 'form' || resetStep === 'submitting'}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${borderCls} ${textSecondary} ${hoverBg}`}
            >
                {resetStep === 'sending' ? (
                    <><Spinner className="w-4 h-4" /> Đang gửi OTP...</>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        {resetStep === 'idle' ? 'Đặt lại mật khẩu' : 'Đã gửi OTP — Gửi lại'}
                    </>
                )}
            </button>

            {(resetStep === 'form' || resetStep === 'submitting') && (
                <form
                    onSubmit={handleSubmitReset}
                    className={`rounded-xl border ${borderCls} p-4 space-y-3 ${fieldBg}`}
                >
                    <p className={`text-xs ${textSecondary}`}>
                        Mã OTP đã gửi đến <span className="font-medium">{email}</span> (hiệu lực 15 phút)
                    </p>
                    <div>
                        <label className={`block text-xs font-medium uppercase tracking-wide mb-1 ${textMuted}`}>
                            Mã OTP
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={resetOtp}
                            onChange={e => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Nhập mã 6 chữ số"
                            required
                            className={`w-full px-3 py-2 rounded-lg border text-sm ${borderCls} ${textPrimary} bg-transparent focus:outline-none focus:border-green-500`}
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-medium uppercase tracking-wide mb-1 ${textMuted}`}>
                            Mật khẩu mới
                        </label>
                        <input
                            type="password"
                            value={resetNewPwd}
                            onChange={e => setResetNewPwd(e.target.value)}
                            placeholder="Tối thiểu 6 ký tự"
                            required
                            className={`w-full px-3 py-2 rounded-lg border text-sm ${borderCls} ${textPrimary} bg-transparent focus:outline-none focus:border-green-500`}
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-medium uppercase tracking-wide mb-1 ${textMuted}`}>
                            Xác nhận mật khẩu
                        </label>
                        <input
                            type="password"
                            value={resetConfirmPwd}
                            onChange={e => setResetConfirmPwd(e.target.value)}
                            placeholder="Nhập lại mật khẩu mới"
                            required
                            className={`w-full px-3 py-2 rounded-lg border text-sm ${borderCls} ${textPrimary} bg-transparent focus:outline-none focus:border-green-500`}
                        />
                    </div>
                    {resetError && <p className="text-xs text-red-500">{resetError}</p>}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="submit"
                            disabled={resetStep === 'submitting'}
                            className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {resetStep === 'submitting' ? (
                                <><Spinner className="w-4 h-4" /> Đang xử lý...</>
                            ) : (
                                'Xác nhận'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setResetStep('idle'); setResetError(null); }}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${borderCls} ${textSecondary} ${hoverBg}`}
                        >
                            Hủy
                        </button>
                    </div>
                </form>
            )}

            {resetStep === 'idle' && resetError && (
                <p className="text-xs text-red-500">{resetError}</p>
            )}
        </div>
    );
}
