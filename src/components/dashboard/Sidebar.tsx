'use client';

import { Bell, LogIn, LayoutGrid, SquarePlus, X, Menu, Pencil, Share2, Copy, Check, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import type { SystemNotification } from '@/contexts/NotificationContext';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useFontSize } from '@/contexts/FontSizeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import * as workspaceService from '@/services/workspace/workspaceService';
import type { Workspace } from '@/types';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { getDashboardPagesStorage, setDashboardPagesStorage } from '@/lib/dashboardStorage';

// ─── Notification item with expand/collapse ─────────────────────────────────

const CLAMP_LINES = 4;

function NotificationItem({
    notif,
    isRealtime,
    theme,
    onDismiss,
}: {
    notif: SystemNotification;
    isRealtime: boolean;
    theme: string;
    onDismiss: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [isClamped, setIsClamped] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Measure once (in collapsed state) whether the content overflows
    useLayoutEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        // Temporarily force collapsed state to measure
        el.style.webkitLineClamp = String(CLAMP_LINES);
        el.style.display = '-webkit-box';
        el.style.webkitBoxOrient = 'vertical';
        el.style.overflow = 'hidden';
        const clamped = el.scrollHeight > el.clientHeight + 2;
        setIsClamped(clamped);
        // Restore display after measurement
        if (!expanded) {
            // keep clamped styles
        } else {
            el.style.webkitLineClamp = 'unset';
            el.style.display = 'block';
            el.style.overflow = 'visible';
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notif.content]);

    const sourceLabel =
        notif.source === 'alert' && notif.ticker
            ? `Cảnh báo · ${notif.ticker}`
            : 'Hệ thống';

    return (
        <div
            className={`relative px-4 py-3 border-b last:border-b-0 ${
                isRealtime
                    ? theme === 'dark'
                        ? 'border-white/[0.06] hover:bg-white/[0.03] bg-[#4ADE80]/[0.04]'
                        : 'border-gray-100 hover:bg-[#4ADE80]/5 bg-[#4ADE80]/5'
                    : theme === 'dark'
                        ? 'border-white/[0.06] hover:bg-white/[0.03]'
                        : 'border-gray-100 hover:bg-gray-50'
            } transition-colors`}
        >
            {/* Source + dismiss */}
            <div className="flex items-center justify-between mb-1">
                <span
                    className={`text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1 ${
                        isRealtime
                            ? 'text-accentGreen'
                            : notif.source === 'alert'
                              ? 'text-amber-500'
                              : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full bg-current ${isRealtime ? 'animate-pulse' : ''}`} />
                    {sourceLabel}
                </span>
                <button
                    onClick={() => onDismiss(notif.id)}
                    className={`p-0.5 rounded transition-colors ${
                        theme === 'dark' ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-200 text-gray-400'
                    }`}
                    aria-label="Đóng"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>

            {/* Content — clamped or expanded */}
            <div
                ref={contentRef}
                className={`text-xs leading-relaxed ${
                    theme === 'dark'
                        ? isRealtime ? 'text-gray-200' : 'text-gray-300'
                        : isRealtime ? 'text-gray-700' : 'text-gray-600'
                }`}
                style={{
                    display: expanded ? 'block' : '-webkit-box',
                    WebkitLineClamp: expanded ? 'unset' : CLAMP_LINES,
                    WebkitBoxOrient: 'vertical',
                    overflow: expanded ? 'visible' : 'hidden',
                }}
                dangerouslySetInnerHTML={{ __html: notif.content }}
            />

            {/* Expand / collapse toggle */}
            {isClamped && (
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className={`mt-1 flex items-center gap-0.5 text-[10px] font-medium transition-colors ${
                        theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${
                            expanded ? 'rotate-180' : ''
                        }`}
                    />
                    {expanded ? 'Thu gọn' : 'Xem thêm'}
                </button>
            )}

            {/* Timestamp */}
            <div className={`mt-1 text-[10px] ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                {!isRealtime &&
                    notif.createdAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' '}
                {notif.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: isRealtime ? '2-digit' : undefined })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

interface PageData {
    id: string;
    name: string;
    initial: string;
    modules: any[];
    layout: any[];
}

interface SidebarProps {
    onAddModule: () => void;
    onAddPage: () => void;
    pages: PageData[];
    currentPageId: string;
    onSwitchPage: (pageId: string) => void;
    onDeletePage: (pageId: string) => void;
    onRenamePage?: (pageId: string, newName: string) => void;
    workspaceCount?: number;
}

export default function Sidebar({ 
    onAddModule, 
    onAddPage, 
    pages, 
    currentPageId, 
    onSwitchPage, 
    onDeletePage,
    onRenamePage,
    workspaceCount = 0
}: SidebarProps) {
    const { fontSize, setFontSize, increaseFontSize, decreaseFontSize } = useFontSize();
    const { theme, toggleTheme } = useTheme();
    const { logout, isAuthenticated, user } = useAuth();
    const router = useRouter();
    const maxWorkspaces = useSubscriptionStore(s => s.maxWorkspaces);
    const [hoveredPage, setHoveredPage] = useState<string | null>(null);
    const [pageToDelete, setPageToDelete] = useState<string | null>(null);
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isShareCodeModalOpen, setIsShareCodeModalOpen] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [currentWsId, setCurrentWsId] = useState<number | null>(null);
    const [currentWsShareCode, setCurrentWsShareCode] = useState('');
    const [renameLoading, setRenameLoading] = useState(false);
    const [renameError, setRenameError] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const workspaceMenuRef = useRef<HTMLDivElement>(null);
    const role = user?.role?.trim();
    const canAccessSystemManagement = role === 'Nhân viên' || role === 'Admin' || role === 'Quản trị viên';
    const { notifications, historicalNotifications, isLoadingHistory, dismissNotification } = useNotifications();
    const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
    const notifPanelRef = useRef<HTMLDivElement>(null);
    const notifBtnRef = useRef<HTMLButtonElement>(null);
    // Badge shows only realtime (unread) count; history is always accessible
    const unreadCount = notifications.length;

    // Close notification panel on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                notifPanelRef.current &&
                !notifPanelRef.current.contains(e.target as Node) &&
                notifBtnRef.current &&
                !notifBtnRef.current.contains(e.target as Node)
            ) {
                setIsNotifPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleAddModuleClick = () => {
        console.log('Add module button clicked in Sidebar!');
        onAddModule();
    };

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFontSize(Number(e.target.value));
    };

    const handleLogout = async () => {
        try {
            await logout();
            // AuthContext will handle redirect to /login
        } catch (error) {
            console.error('Logout failed:', error);
            // Even if logout fails, redirect to login
            router.push('/login');
        }
    };

    const handleLogin = () => {
        router.push('/login');
    };

    const handleDeleteClick = (e: React.MouseEvent, pageId: string) => {
        e.stopPropagation();
        setPageToDelete(pageId);
    };

    const confirmDelete = () => {
        if (pageToDelete) {
            onDeletePage(pageToDelete);
            setPageToDelete(null);
        }
    };

    const cancelDelete = () => {
        setPageToDelete(null);
    };

    const loadCurrentWorkspaceInfo = async (): Promise<Workspace | null> => {
        try {
            const savedPages = getDashboardPagesStorage();
            if (!savedPages) return null;
            const pagesData = JSON.parse(savedPages);
            const currentPage = pagesData.find((p: any) => p.id === currentPageId);
            if (currentPage?.workspaceId == null) return null;
            const response = await workspaceService.getMyWorkspaces();
            if (response.isSuccess && response.data) {
                return response.data.find((w: Workspace) => w.id === currentPage.workspaceId) || null;
            }
            return null;
        } catch {
            return null;
        }
    };

    const handleOpenRenameModal = async () => {
        setIsWorkspaceMenuOpen(false);
        const ws = await loadCurrentWorkspaceInfo();
        if (ws) {
            setCurrentWsId(ws.id);
            setRenameValue(ws.workspaceName);
        } else {
            // fallback: find from pages list
            const savedPages = (() => {
                try { return JSON.parse(getDashboardPagesStorage() || '[]'); } catch { return []; }
            })();
            const p = savedPages.find((p: any) => p.id === currentPageId);
            if (p) { setRenameValue(p.name ?? ''); }
        }
        setRenameError(null);
        setIsRenameModalOpen(true);
    };

    const handleOpenShareCodeModal = async () => {
        setIsWorkspaceMenuOpen(false);
        const ws = await loadCurrentWorkspaceInfo();
        if (ws) {
            setCurrentWsShareCode(ws.shareCode || '');
        }
        setIsShareCodeModalOpen(true);
    };

    const handleSaveRename = async () => {
        if (!renameValue.trim() || currentWsId === null) return;
        setRenameLoading(true);
        setRenameError(null);
        try {
            // Fetch fresh workspace data to get latest layoutJson
            const freshResponse = await workspaceService.getMyWorkspaces();
            const ws = freshResponse.isSuccess && freshResponse.data
                ? freshResponse.data.find((w: Workspace) => w.id === currentWsId) || null
                : null;
            if (!ws) {
                setRenameError('Không tìm thấy workspace');
                return;
            }
            const response = await workspaceService.updateWorkspace(currentWsId, {
                workspaceId: currentWsId,
                workspaceName: renameValue.trim(),
                layoutJson: ws.layoutJson ?? undefined,
                isDefault: ws.isDefault,
            });
            if (response.isSuccess) {
                // Update parent state so UI list refreshes immediately
                onRenamePage?.(currentPageId, renameValue.trim());
                // Also update localStorage name
                try {
                    const raw = getDashboardPagesStorage();
                    if (raw) {
                        const ps = JSON.parse(raw);
                        const updated = ps.map((p: any) =>
                            p.workspaceId === currentWsId ? { ...p, name: renameValue.trim() } : p
                        );
                        setDashboardPagesStorage(JSON.stringify(updated));
                    }
                } catch {}
                setIsRenameModalOpen(false);
            } else {
                setRenameError(response.message || 'Có lỗi khi đổi tên');
            }
        } catch (err: any) {
            setRenameError(err?.message || 'Có lỗi khi đổi tên');
        } finally {
            setRenameLoading(false);
        }
    };

    const handleCopyShareCode = async () => {
        try {
            await navigator.clipboard.writeText(currentWsShareCode);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } catch {}
    };

    return (
        <>
            <aside className="mt-[5px] ml-[1px] w-[70px] bg-white dark:bg-componentBackground flex flex-col items-center py-6 border-r border-gray-300 dark:border-gray-700/50 rounded-r-full rounded-l-full overflow-visible relative transition-colors duration-300">
                {/* Top Icons */}
                <div className="flex flex-col items-center gap-6">
                    <div className="relative group">
                        <Link href="/" className="rounded-lg flex items-center justify-center transition-colors shadow-sm overflow-hidden hover:bg-gray-100 dark:hover:bg-transparent p-1">
                            <img 
                                src="/assets/Logo/KF Stock_Logo_Transparent.png" 
                                alt="KF Stock" 
                                className="w-[40px] h-[40px]" 
                            />
                        </Link>
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Trang chủ
                        </div>
                    </div>

                    {/*
                     * WORKSPACE LIST SCROLL CONTAINER
                     * --------------------------------
                     * - w-full          : fill the full aside width (70px) so the
                     *                     container doesn’t shrink to child width (45px).
                     *                     Prevents browsers from showing a horizontal
                     *                     scrollbar track on an under-sized element.
                     *
                     * - overflow-y      : 'auto' → vertical scrollbar appears only
                     *                     when children exceed maxHeight.
                     *
                     * - overflow-x      : 'hidden' → always hide horizontal scroll.
                     *                     Safe here because the delete button (-right-1)
                     *                     is -4px relative to the 45px item; since items
                     *                     are centered inside this 70px container the
                     *                     button still lands at ~61px — inside the 70px
                     *                     boundary — so nothing is visually clipped.
                     *
                     * - maxHeight       : each item is ~45px + 8px gap ≈ 53px.
                     *                     330px ≈ 6 items visible before scroll kicks in.
                     *                     Adjust this value to change how many workspaces
                     *                     are shown without scrolling:
                     *                       4 items ≈ 212px  |  5 items ≈ 265px
                     *                       6 items ≈ 318px  |  7 items ≈ 371px
                     *
                     * - scrollbarWidth  : 'thin' → narrow scrollbar on Firefox.
                     *                     Change to 'none' to always hide it on Firefox.
                     *
                     * - scrollbarColor  : set to 'transparent transparent' by default
                     *                     so the scrollbar is invisible at rest.
                     *                     onMouseEnter makes it visible (rgba gray).
                     *                     onMouseLeave hides it again.
                     *                     To always show it, remove the mouse events
                     *                     and set a fixed color here, e.g.
                     *                     'rgba(100,100,100,0.5) transparent'.
                     *
                     * Note: scrollbarColor / scrollbarWidth are Firefox-only CSS.
                     * Webkit (Chrome/Safari) uses ::-webkit-scrollbar pseudo-elements.
                     * Those are not applied here — add a global CSS rule in globals.css
                     * targeting this element’s class if webkit styling is needed.
                     */}
                    <div
                        className="flex flex-col items-center gap-2 overflow-y-auto w-full p-2 rounded-lg"
                        style={{
                            maxHeight: '330px',
                            overflowX: 'hidden',
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'transparent transparent',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.scrollbarColor = 'rgba(100,100,100,0.5) transparent';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.scrollbarColor = 'transparent transparent';
                        }}
                    >
                        {pages.map((page) => (
                            <div
                                key={page.id}
                                className={`w-[45px] h-[45px] flex-shrink-0 flex items-center justify-center rounded-[4px] relative group transition-colors ${
                                    page.id === currentPageId ? 'bg-[rgba(14,13,21,0.6)]' : 'hover:bg-[rgba(14,13,21,0.3)]'
                                }`}
                                onMouseEnter={() => setHoveredPage(page.id)}
                                onMouseLeave={() => setHoveredPage(null)}
                            >
                                <button
                                    onClick={() => onSwitchPage(page.id)}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        page.id === currentPageId
                                            ? 'border-accentGreen'
                                            : (theme === 'dark' ? 'border-gray-500 hover:border-gray-300' : 'border-gray-400 hover:border-gray-600')
                                    }`}
                                >
                                    <span className={`text-xl ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                                    }`}>{page.initial}</span>
                                </button>

                                {/* Delete button for non-default workspaces */}
                                {hoveredPage === page.id && page.id !== 'default' && (
                                    <button
                                        onClick={(e) => handleDeleteClick(e, page.id)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
                                        title="Xóa workspace"
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                )}

                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                    {page.name}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Grid Icon - Workspace management menu */}
                    <div className="relative" ref={workspaceMenuRef}>
                        <button
                            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                            title="Quản lý workspace"
                        >
                            <LayoutGrid className={`w-10 h-10 ${
                                theme === 'dark' ? 'text-white-400' : 'text-gray-700'
                            }`} strokeWidth={2} />
                        </button>

                        {isWorkspaceMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-[9990]" onClick={() => setIsWorkspaceMenuOpen(false)} />
                                <div className="absolute left-full ml-2 top-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[200px] z-[9991]">
                                    <button
                                        onClick={handleOpenRenameModal}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Đổi tên workspace
                                    </button>
                                    <button
                                        onClick={handleOpenShareCodeModal}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Lấy share code
                                    </button>
                                    <button
                                        onClick={() => { setIsWorkspaceMenuOpen(false); onAddPage(); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                        Tạo workspace mới
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

            
                {/* Spacer */}
                <div className="flex-1 " />

                {/* Bottom Icons - Outer container with translucent background */}
                <div className="bg-white/5 rounded-full p-1 mx-2">
                    <div className="flex flex-col items-center gap-4">
                        {/* Add Module Icon with green dot and ping animation */}
                        <div className="text-center hover:bg-gray-700/500 rounded-lg transition-colors cursor-pointer relative group">
                            <div className="relative">
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-5 w-5 animate-ping rounded-full bg-green-500 opacity-75"></div>
                                </span>
                                <button type="button" onClick={handleAddModuleClick} className="relative z-10 ani-pop font-medium rounded-full text-sm gap-x-1.5 p-1.5 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 inline-flex items-center">
                                    <SquarePlus className={`flex-shrink-0 h-6 w-6 ${
                                        theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                                    }`} strokeWidth={2} />
                                </button>
                            </div>
                            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                Thêm module vào page
                            </div>
                        </div>

                        {/* Sun/Moon Icon - Theme Toggle */}
                        {/* <div className="relative group">
                            <button 
                                onClick={toggleTheme}
                                className="w-10 h-10 flex items-center justify-center hover:bg-gray-700/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-6 h-6 text-yellow-400" strokeWidth={2} />
                                ) : (
                                    <Moon className="w-6 h-6 text-gray-700" strokeWidth={2} />
                                )}
                            </button>
                            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                {theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
                            </div>
                        </div> */}

                        {/* Font Size Control - Plus/Minus with Range Slider */}
                        {/* <div className="relative inline-flex group">
                            <div className="relative w-8 flex flex-col items-center">
                                <div className="absolute z-10 inset-0 flex flex-col justify-between items-center py-1">
                                    <button 
                                        onClick={increaseFontSize}
                                        type="button" 
                                        className={`ani-pop font-medium rounded-full text-xs gap-x-1 p-[0.4rem] inline-flex items-center ${
                                            theme === 'dark' ? 'text-white hover:bg-gray-900' : 'text-gray-800 hover:bg-gray-200'
                                        }`}
                                    >
                                        <Plus className="h-5 w-5" strokeWidth={2} />
                                    </button>
                                    <button 
                                        onClick={decreaseFontSize}
                                        type="button" 
                                        className={`ani-pop font-medium rounded-full text-xs gap-x-1 p-[0.4rem] inline-flex items-center ${
                                            theme === 'dark' ? 'text-white hover:bg-gray-900' : 'text-gray-800 hover:bg-gray-200'
                                        }`}
                                    >
                                        <Minus className="h-5 w-5" strokeWidth={2} />
                                    </button>
                                </div>
                                <input 
                                    className="w-9 h-20 appearance-none rounded-full cursor-pointer [writing-mode:vertical-lr]"
                                    style={{
                                        background: theme === 'dark' 
                                            ? `linear-gradient(to top, rgba(107, 114, 128, 0.4) ${fontSize * 10}%, #1a1a1a ${fontSize * 10}%)`
                                            : `linear-gradient(to top, rgba(156, 163, 175, 0.5) ${fontSize * 10}%, #e5e7eb ${fontSize * 10}%)`
                                    }}
                                    type="range" 
                                    min="0" 
                                    max="10" 
                                    step="1" 
                                    value={fontSize}
                                    onChange={handleFontSizeChange}
                                />
                            </div>
                            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                Phông chữ
                            </div>
                        </div> */}

                        {/* Bell — Notification panel */}
                        <div className="relative">
                            <button
                                ref={notifBtnRef}
                                onClick={() => setIsNotifPanelOpen(v => !v)}
                                className="w-10 h-10 rounded-full bg-accentGreen flex items-center justify-center hover:bg-green-600 transition-colors relative"
                                aria-label="Thông báo hệ thống"
                            >
                                <Bell className="w-5 h-5 text-white" strokeWidth={2} fill="transparent" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-gray-900">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification panel */}
                            {isNotifPanelOpen && (
                                <div
                                    ref={notifPanelRef}
                                    className="absolute left-full ml-3 bottom-0 w-80 max-h-[480px] z-[9999] flex flex-col rounded-xl shadow-2xl overflow-hidden"
                                    style={{ background: theme === 'dark' ? '#1a1d2e' : '#ffffff', border: '1px solid rgba(74,222,128,0.3)' }}
                                >
                                    {/* Header */}
                                    <div className={`flex items-center justify-between px-4 py-2.5 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                                        <div className="flex items-center gap-2">
                                            <Bell className="w-4 h-4 text-accentGreen" />
                                            <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Thông báo hệ thống</span>
                                            {unreadCount > 0 && (
                                                <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setIsNotifPanelOpen(false)}
                                            className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 overflow-y-auto">
                                        {notifications.length === 0 && historicalNotifications.length === 0 && !isLoadingHistory ? (
                                            <div className={`flex flex-col items-center justify-center py-10 gap-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                                <Bell className="w-8 h-8 opacity-30" />
                                                <span className="text-xs">Chưa có thông báo nào</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-0">
                                                {/* ── Realtime notifications ── */}
                                                {notifications.map((notif) => (
                                                    <NotificationItem
                                                        key={notif.id}
                                                        notif={notif}
                                                        isRealtime={true}
                                                        theme={theme}
                                                        onDismiss={dismissNotification}
                                                    />
                                                ))}

                                                {/* ── History section header ── */}
                                                {historicalNotifications.length > 0 && (
                                                    <div className={`px-4 py-1.5 flex items-center gap-2 sticky top-0 text-[10px] font-semibold uppercase tracking-wider ${
                                                        theme === 'dark' ? 'bg-[#1a1d2e] text-gray-500 border-b border-white/[0.05]' : 'bg-gray-50 text-gray-400 border-b border-gray-100'
                                                    }`}>
                                                        <span>Lịch sử</span>
                                                    </div>
                                                )}

                                                {/* ── Historical notifications ── */}
                                                {isLoadingHistory && historicalNotifications.length === 0 && (
                                                    <div className={`flex items-center justify-center py-4 gap-2 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        <span className="w-3 h-3 rounded-full border-2 border-accentGreen border-t-transparent animate-spin" />
                                                        Đang tải lịch sử...
                                                    </div>
                                                )}
                                                {historicalNotifications.map((notif) => (
                                                    <NotificationItem
                                                        key={notif.id}
                                                        notif={notif}
                                                        isRealtime={false}
                                                        theme={theme}
                                                        onDismiss={dismissNotification}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Options Menu Icon - Conditional based on authentication */}
                        {isAuthenticated ? (
                            <div className="relative group">
                                <button 
                                    onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-all duration-300"
                                    style={{
                                        transform: isOptionsMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                                    }}
                                >
                                    <Menu className="w-5 h-5 text-gray-800" strokeWidth={2} />
                                </button>
                                
                                {/* Options Dropdown Menu */}
                                {isOptionsMenuOpen && (
                                    <>
                                        {/* Backdrop to close menu */}
                                        <div 
                                            className="fixed inset-0 z-[9998]" 
                                            onClick={() => setIsOptionsMenuOpen(false)}
                                        />
                                        
                                        {/* Menu */}
                                        <div className="absolute left-full ml-4 bottom-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[200px] z-[9999]">
                                            {/* Username - Display only */}
                                            <div className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                                                {user?.fullName || 'User'}
                                            </div>
                                            
                                            {/* Account Management */}
                                            <button
                                                onClick={() => {
                                                    setIsOptionsMenuOpen(false);
                                                    router.push('/profile');
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                Quản lí tài khoản
                                            </button>
                                            
                                            {/* System Management - for Staff and Admin roles */}
                                            {canAccessSystemManagement && (
                                                <button
                                                    onClick={() => {
                                                        setIsOptionsMenuOpen(false);
                                                        router.push('/system-manager');
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    Quản lí hệ thống
                                                </button>
                                            )}
                                            
                                            {/* Logout */}
                                            <button
                                                onClick={() => {
                                                    setIsOptionsMenuOpen(false);
                                                    handleLogout();
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700"
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </>
                                )}
                                
                                {!isOptionsMenuOpen && (
                                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                        Tùy chọn
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative group">
                                <button 
                                    onClick={handleLogin}
                                    className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center hover:bg-blue-700 transition-colors"
                                >
                                    <LogIn className="w-5 h-5 text-white" strokeWidth={2} />
                                </button>
                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                    Đăng nhập
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Rename Workspace Modal */}
            {isRenameModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10001]">
                    <div className="bg-white dark:bg-[#1e1e2e] rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Đổi tên workspace</h3>
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); }}
                            className="w-full px-3 py-2 mb-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-accentGreen"
                            placeholder="Tên workspace..."
                            autoFocus
                        />
                        {renameError && (
                            <p className="text-red-400 text-xs mb-3">{renameError}</p>
                        )}
                        <div className="flex gap-3 justify-end mt-4">
                            <button
                                onClick={() => setIsRenameModalOpen(false)}
                                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveRename}
                                disabled={renameLoading || !renameValue.trim()}
                                className="px-4 py-2 rounded-lg bg-accentGreen text-white hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {renameLoading ? 'Đang lưu...' : 'Đổi tên'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Code Modal */}
            {isShareCodeModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10001]">
                    <div className="bg-white dark:bg-[#1e1e2e] rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Share Code workspace</h3>
                        {currentWsShareCode ? (
                            <>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">Chia sẻ code này để người khác áp dụng giao diện của bạn:</p>
                                <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                                    <span className="flex-1 font-mono text-sm text-accentGreen break-all select-all">{currentWsShareCode}</span>
                                    <button
                                        onClick={handleCopyShareCode}
                                        className="flex-shrink-0 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        title="Copy"
                                    >
                                        {copiedCode ? (
                                            <Check className="w-4 h-4 text-accentGreen" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Workspace này chưa có share code.</p>
                        )}
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setIsShareCodeModalOpen(false)}
                                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {pageToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10001]">
                    <div className="bg-white dark:bg-[#1e1e2e] rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                            Xác nhận xóa
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn xóa page &quot;{pages.find(p => p.id === pageToDelete)?.name}&quot; ? Tất cả modules trong page này sẽ bị xóa.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}