'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export type StaffFeature = 
    | 'dashboard'
    | 'revenue'
    | 'users'
    | 'financial-reports'
    | 'analysis-reports'
    | 'news'
    | 'data'
    | 'macroeconomic-simulation';

const menuItems: {
    id: StaffFeature;
    label: string;
    href: string;
    icon: JSX.Element;
    requiresAdmin?: boolean;
}[] = [
    {
        id: 'dashboard',
        label: 'Tổng quan Hệ Thống',
        href: '/system-manager',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        id: 'revenue',
        label: 'Theo dõi Doanh Thu',
        href: '/system-manager/revenue',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" />
            </svg>
        ),
    },
    {
        id: 'users',
        label: 'Quản Lý Người Dùng',
        href: '/system-manager/users',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
    },
    {
        id: 'financial-reports',
        label: 'Quản Lý  Báo Cáo Tài Chính',
        href: '/system-manager/financial-reports',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        id: 'analysis-reports',
        label: 'Quản Lý Báo Cáo Phân Tích',
        href: '/system-manager/analysis-reports',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
    {
        id: 'news',
        label: 'Theo dõi Tin Tức',
        href: '/system-manager/news',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
        ),
    },
    {
        id: 'data',
        label: 'Quản Lý Dữ Liệu',
        href: '/system-manager/data',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
        ),
    },
    {
        id: 'macroeconomic-simulation',
        label: 'Mô Phỏng Vĩ Mô (DEMO)',
        href: '/system-manager/macroeconomic-simulation',
        requiresAdmin: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 18l6-6 4 4 8-8M15 6h6v6" />
            </svg>
        ),
    },
];

export default function StaffSidebar() {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [activeFeature, setActiveFeature] = useState<StaffFeature>('dashboard');
    const normalizedRole = user?.role?.trim().toLowerCase() ?? '';
    const isAdmin =
        normalizedRole === 'admin' ||
        normalizedRole === 'administrator' ||
        normalizedRole === 'quản trị viên';

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
            router.push('/login');
        }
    };

    useEffect(() => {
        if (pathname === '/system-manager') {
            setActiveFeature('dashboard');
            return;
        }

        if (pathname.startsWith('/system-manager/users')) {
            setActiveFeature('users');
            return;
        }

        if (pathname.startsWith('/system-manager/revenue')) {
            setActiveFeature('revenue');
            return;
        }

        if (pathname.startsWith('/system-manager/financial-reports')) {
            setActiveFeature('financial-reports');
            return;
        }

        if (pathname.startsWith('/system-manager/analysis-reports')) {
            setActiveFeature('analysis-reports');
            return;
        }

        if (pathname.startsWith('/system-manager/news')) {
            setActiveFeature('news');
            return;
        }

        if (pathname.startsWith('/system-manager/data')) {
            setActiveFeature('data');
            return;
        }

        if (pathname.startsWith('/system-manager/macroeconomic-simulation')) {
            setActiveFeature('macroeconomic-simulation');
            return;
        }
    }, [pathname]);

    const visibleMenuItems = menuItems.filter((item) => {
        if (!item.requiresAdmin) {
            return true;
        }

        return isAdmin;
    });

    return (
        <aside className="w-64 min-w-64 max-w-64 shrink-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            aria-label="Quay lại Dashboard"
                        >
                            <svg
                                className="w-4 h-4 text-gray-700 dark:text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                        </button>
                        <div className="absolute left-0 top-full mt-2 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            Quay lại Dashboard
                        </div>
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
                            Quản lý hệ thống
                        </h1>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            Chào mừng, {user?.fullName}
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {visibleMenuItems.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                            activeFeature === item.id
                                ? 'bg-green-300 text-gray-900'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        {item.icon}
                        <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="px-4 pb-3">
                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg border border-gray-200 dark:border-gray-700"
                >
                    Đăng xuất
                </button>
            </div>
            
            {/* Dark Mode Toggle */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {theme === 'dark' ? 'Chế độ tối' : 'Chế độ sáng'}
                    </span>
                    <button
                        onClick={toggleTheme}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                            theme === 'dark' ? 'bg-gray-900' : 'bg-gray-300'
                        }`}
                        aria-label="Toggle dark mode"
                    >
                        <span
                            className={`inline-flex h-6 w-6 items-center justify-center transform rounded-full bg-white transition-transform ${
                                theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                            }`}
                        >
                            {theme === 'dark' ? (
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                        </span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
