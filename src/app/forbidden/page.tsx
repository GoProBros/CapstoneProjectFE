"use client";

import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function ForbiddenPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div
            className={`min-h-screen flex items-center justify-center ${
                isDark ? 'bg-[#0e0d15]' : 'bg-gray-100'
            }`}
        >
            <div className="flex flex-col items-center gap-6 text-center px-6">
                {/* Error icon */}
                <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center ${
                        isDark ? 'bg-red-500/10' : 'bg-red-50'
                    }`}
                >
                    <svg
                        className="w-12 h-12 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        />
                    </svg>
                </div>

                {/* Message */}
                <div className="space-y-2">
                    <h1
                        className={`text-2xl font-bold ${
                            isDark ? 'text-white' : 'text-gray-900'
                        }`}
                    >
                        Đã xảy ra lỗi
                    </h1>
                    <p
                        className={`text-base ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}
                    >
                        vui lòng thử lại sau
                    </p>
                </div>

                {/* Back to dashboard button */}
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                >
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
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                    </svg>
                    Quay lại Dashboard
                </button>
            </div>
        </div>
    );
}
