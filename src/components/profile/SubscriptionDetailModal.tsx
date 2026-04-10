"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { SubscriptionDto } from '@/types/subscription';
import { formatPrice, levelOrderLabel, MODULE_LABELS } from './helpers';
import { useProfileTheme } from './useProfileTheme';

interface SubscriptionDetailModalProps {
    sub: SubscriptionDto;
    onClose: () => void;
    onUpgrade?: (sub: SubscriptionDto) => void;
}

interface ModuleItem {
    key: string;
    label: string;
    preview: string | null;
}

const MODULE_PREVIEW_MAP: Record<string, string> = {
    'smart-board': '/assets/Dashboard/ModulePreviews/smart-stock-screener.png',
    index: '/assets/Dashboard/ModulePreviews/market-index.png',
    'vn-stock-chart': '/assets/Dashboard/ModulePreviews/vn-stock-chart.png',
    'global-stock-chart': '/assets/Dashboard/ModulePreviews/global-stock-chart.png',
    'financial-report': '/assets/Dashboard/ModulePreviews/financial-report.png',
    financialReport: '/assets/Dashboard/ModulePreviews/financial-report.png',
    'financial-report-pro': '/assets/Dashboard/ModulePreviews/financial-report-pro.png',
    news: '/assets/Dashboard/ModulePreviews/news.png',
    'session-info': '/assets/Dashboard/ModulePreviews/session-info.png',
    'order-matching': '/assets/Dashboard/ModulePreviews/order-matching.png',
    orderBook: '/assets/Dashboard/ModulePreviews/order-matching.png',
    canslim: '/assets/Dashboard/ModulePreviews/canslim.png',
    'stock-screener': '/assets/Dashboard/ModulePreviews/stock-screener.png',
    screener: '/assets/Dashboard/ModulePreviews/stock-screener.png',
    heatmap: '/assets/Dashboard/ModulePreviews/heatmap.png',
    'analysis-report': '/assets/Dashboard/ModulePreviews/analysis-report.png',
    analysisReport: '/assets/Dashboard/ModulePreviews/analysis-report.png',
    'ai-chat': '/assets/Dashboard/ModulePreviews/AIAssistantModule.jpg',
    chart: '/assets/Dashboard/ModulePreviews/vn-stock-chart.png',
    watchList: '/assets/Dashboard/ModulePreviews/smart-stock-screener.png',
};

function normalizeAllowedModules(raw: unknown): ModuleItem[] {
    if (!raw) return [];

    const arr = Array.isArray(raw)
        ? raw
        : typeof raw === 'object' && raw !== null && Array.isArray((raw as Record<string, unknown>).modules)
            ? ((raw as Record<string, unknown>).modules as unknown[])
            : null;

    if (!arr) return [];

    const items = arr.map(item => {
        if (typeof item === 'string') {
            return {
                key: item,
                label: MODULE_LABELS[item] ?? item,
                preview: MODULE_PREVIEW_MAP[item] ?? null,
            };
        }

        if (typeof item === 'object' && item !== null) {
            const obj = item as Record<string, unknown>;
            const key = String(obj.id ?? obj.moduleId ?? obj.name ?? '').trim();
            const label = (MODULE_LABELS[key] ?? key) || 'Không xác định';
            return {
                key,
                label,
                preview: MODULE_PREVIEW_MAP[key] ?? null,
            };
        }

        const fallback = String(item);
        return {
            key: fallback,
            label: MODULE_LABELS[fallback] ?? fallback,
            preview: MODULE_PREVIEW_MAP[fallback] ?? null,
        };
    });

    const deduped = new Map<string, ModuleItem>();
    items.forEach(m => {
        const dedupeKey = `${m.key}::${m.label}`;
        if (!deduped.has(dedupeKey)) {
            deduped.set(dedupeKey, m);
        }
    });

    return Array.from(deduped.values());
}

export function SubscriptionDetailModal({ sub, onClose, onUpgrade }: SubscriptionDetailModalProps) {
    const { bgCard, bgSub, borderCls, textPrimary, textSecondary, textMuted, hoverBg } = useProfileTheme();

    const modules = useMemo(() => normalizeAllowedModules(sub.allowedModules), [sub.allowedModules]);
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    useEffect(() => {
        setHoveredKey(modules[0]?.key ?? null);
    }, [modules, sub.id]);

    const hoveredModule = useMemo(() => {
        if (modules.length === 0) return null;
        const found = modules.find(m => m.key === hoveredKey);
        return found ?? modules[0];
    }, [modules, hoveredKey]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-5xl rounded-2xl border ${bgCard} ${borderCls} p-6 space-y-5 max-h-[90vh] overflow-y-auto`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${textPrimary}`}>Detail Subscription</h3>
                    <button onClick={onClose} className={`p-1.5 rounded-lg ${hoverBg} ${textSecondary}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-7 space-y-4">
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

                        <div className={`rounded-xl border ${borderCls} p-4 ${bgSub}`}>
                            <p className={`text-sm font-semibold mb-3 ${textPrimary}`}>Allowed module</p>
                            {modules.length === 0 ? (
                                <p className={`text-sm ${textSecondary}`}>Tất cả module</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {modules.map(module => {
                                        const isActive = hoveredModule?.key === module.key;
                                        return (
                                            <button
                                                key={`${module.key}-${module.label}`}
                                                type="button"
                                                onMouseEnter={() => setHoveredKey(module.key)}
                                                onFocus={() => setHoveredKey(module.key)}
                                                onClick={() => setHoveredKey(module.key)}
                                                className={`rounded-md border px-2 py-1.5 text-xs font-medium text-left truncate transition-colors ${
                                                    isActive
                                                        ? 'border-green-500 text-green-500 bg-green-500/10'
                                                        : `${borderCls} ${textSecondary} ${hoverBg}`
                                                }`}
                                                title={module.label}
                                            >
                                                {module.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className={`rounded-xl border ${borderCls} p-4 ${bgSub}`}>
                            <p className={`text-sm font-semibold mb-3 ${textPrimary}`}>
                                {hoveredModule ? hoveredModule.label : 'Module previews'}
                            </p>

                            <div className={`aspect-[4/3] rounded-lg border ${borderCls} overflow-hidden bg-white dark:bg-cardPreview`}>
                                {hoveredModule?.preview ? (
                                    <Image
                                        src={hoveredModule.preview}
                                        alt={hoveredModule.label}
                                        width={800}
                                        height={600}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center text-sm ${textMuted} px-4 text-center`}>
                                        Chưa có ảnh preview cho module này.
                                    </div>
                                )}
                            </div>

                            <p className={`mt-2 text-xs ${textMuted}`}>
                                Di chuột vào từng module để xem preview.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className={`flex-1 py-2.5 rounded-lg border ${borderCls} ${textSecondary} ${hoverBg} text-sm font-medium transition-colors`}
                    >
                        Đóng
                    </button>
                    <button
                        onClick={() => {
                            if (onUpgrade) {
                                onUpgrade(sub);
                                return;
                            }
                            onClose();
                        }}
                        className="flex-1 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
                    >
                        Nâng cấp
                    </button>
                </div>
            </div>
        </div>
    );
}
