'use client';

import { useState } from 'react';
import AnalysisReportsList from './analysis-reports/AnalysisReportsList';
import AnalysisReportSources from './analysis-reports/AnalysisReportSources';
import AnalysisReportCategories from './analysis-reports/AnalysisReportCategories';

type AnalysisTab = 'reports' | 'sources' | 'categories';

const TABS: { id: AnalysisTab; label: string; icon: React.ReactNode }[] = [
    {
        id: 'reports',
        label: 'Báo cáo phân tích',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        id: 'sources',
        label: 'Nguồn',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
    {
        id: 'categories',
        label: 'Phân loại',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
        ),
    },
];

export default function AnalysisReportsFeature() {
    const [activeTab, setActiveTab] = useState<AnalysisTab>('reports');

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-headline mb-2">
                    Quản Lý Báo Cáo Phân Tích
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                    Quản lý báo cáo phân tích, nguồn cung cấp và phân loại
                </p>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex gap-1" aria-label="Tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                activeTab === tab.id
                                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'reports' && <AnalysisReportsList />}
                {activeTab === 'sources' && <AnalysisReportSources />}
                {activeTab === 'categories' && <AnalysisReportCategories />}
            </div>
        </div>
    );
}
