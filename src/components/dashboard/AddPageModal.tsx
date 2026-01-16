'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, LayoutGrid, Save, Copy, Check, AlertTriangle } from 'lucide-react';
import * as workspaceService from '@/services/workspaceService';
import type { Workspace } from '@/types';

interface AddPageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (pageName: string, layoutType: string) => void;
    onSwitchPage: (pageId: string) => void;
    workspaceCount: number;
}

export default function AddPageModal({ isOpen, onClose, onSave, onSwitchPage, workspaceCount }: AddPageModalProps) {
    const [pageName, setPageName] = useState('');
    const [selectedLayout, setSelectedLayout] = useState('Giao diện mặc định');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
    const [copiedShareCode, setCopiedShareCode] = useState<string | null>(null);
    const [shareCode, setShareCode] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [showConfirmPopup, setShowConfirmPopup] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const layoutOptions = ['Giao diện mặc định', 'Giao diện nâng cao', 'Giao diện đơn giản'];

    // Load workspaces when modal opens
    useEffect(() => {
        if (isOpen) {
            loadWorkspaces();
        }
    }, [isOpen]);

    const loadWorkspaces = async () => {
        try {
            const response = await workspaceService.getMyWorkspaces();
            if (response.isSuccess && response.data) {
                setWorkspaces(response.data);
            }
        } catch (error) {
            console.error('Error loading workspaces:', error);
        }
    };

    const handleCopyShareCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedShareCode(code);
            setTimeout(() => setCopiedShareCode(null), 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    const handleApplyWorkspace = async () => {
        // Check workspace limit
        if (workspaceCount >= 6) {
            setError('Bạn đã đạt giới hạn 6 workspace. Vui lòng xóa workspace cũ trước khi apply workspace mới.');
            return;
        }

        setIsApplying(true);
        setError(null);

        try {
            const response = await workspaceService.applySharedWorkspace(shareCode);
            if (response.isSuccess) {
                setShareCode('');
                setShowConfirmPopup(false);
                onClose();
                // Reload page to show new workspace
                window.location.reload();
            } else {
                setError(response.message || 'Có lỗi khi apply workspace');
            }
        } catch (error: any) {
            setError(error?.message || 'Có lỗi khi apply workspace');
        } finally {
            setIsApplying(false);
        }
    };

    const handleApplyClick = () => {
        if (!shareCode.trim()) {
            setError('Vui lòng nhập share code');
            return;
        }

        // Check workspace limit before showing confirm popup
        if (workspaceCount >= 6) {
            setError('Bạn đã đạt giới hạn 6 workspace. Vui lòng xóa workspace cũ trước khi apply workspace mới.');
            return;
        }

        setShowConfirmPopup(true);
    };

    if (!isOpen) return null;

    const handleSave = () => {
        if (pageName.trim()) {
            onSave(pageName.trim(), selectedLayout);
            setPageName('');
            setSelectedLayout('Giao diện mặc định');
            onClose();
        }
    };

    const handleSelectWorkspace = (workspaceId: number) => {
        setSelectedWorkspaceId(workspaceId);
        
        // Load workspace from localStorage and apply it
        try {
            const savedPages = localStorage.getItem('dashboard-pages');
            if (savedPages) {
                const pages = JSON.parse(savedPages);
                const workspace = pages.find((p: any) => p.workspaceId === workspaceId);
                if (workspace) {
                    // Switch to the selected workspace using the parent's handler
                    onSwitchPage(workspace.id);
                    
                    // Close modal
                    onClose();
                }
            }
        } catch (error) {
            console.error('Error loading workspace:', error);
            setError('Có lỗi khi tải workspace');
        }
    };

    const handleClose = () => {
        setPageName('');
        setShareCode('');
        setError(null);
        setShowConfirmPopup(false);
        setSelectedWorkspaceId(null);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-[black/70] flex items-center justify-center z-50"
            onClick={handleClose}
        >
            <div 
                className="w-full max-w-[1200px] h-[85vh] bg-[#0a0a0a] rounded-3xl border border-accentGreen shadow-2xl shadow-accentGreen/20 flex overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Content - Two Column Layout */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Column - Workspace Management */}
                    <div className="w-[400px] bg-moduleBackground border-r border-gray-800 overflow-y-auto p-6 space-y-6">
                        {/* ShareCode Apply Section */}
                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Copy className="w-4 h-4 text-accentGreen" />
                                Apply Workspace từ Share Code
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={shareCode}
                                    onChange={(e) => setShareCode(e.target.value)}
                                    placeholder="Nhập share code..."
                                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accentGreen"
                                />
                                <button
                                    onClick={handleApplyClick}
                                    disabled={isApplying || !shareCode.trim() || workspaceCount >= 6}
                                    className="px-4 py-2 bg-accentGreen hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    {isApplying ? 'Đang xử lý...' : 'Apply'}
                                </button>
                            </div>
                            {error && (
                                <div className="mt-2 text-red-400 text-xs flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Workspace List Section */}
                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                            <div className="flex items-center gap-2 text-white font-medium mb-3">
                                <LayoutGrid className="w-4 h-4 text-accentGreen" />
                                <span>Danh sách Workspace ({workspaces.length}/6)</span>
                            </div>
                            
                            <div className="space-y-2 max-h-[calc(85vh-300px)] overflow-y-auto pr-2">
                                {workspaces.length === 0 ? (
                                    <div className="text-gray-500 text-sm text-center py-4">
                                        Không có workspace nào
                                    </div>
                                ) : (
                                    workspaces.map((ws) => (
                                        <div
                                            key={ws.id}
                                            onClick={() => handleSelectWorkspace(ws.id)}
                                            className={`bg-gray-800 rounded-lg p-3 border transition-colors cursor-pointer ${
                                                selectedWorkspaceId === ws.id 
                                                    ? 'border-accentGreen bg-gray-700' 
                                                    : 'border-gray-700 hover:border-gray-600'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-gray-400 text-xs">ID:</span>
                                                        <span className="text-white text-sm font-medium">{ws.id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-gray-400 text-xs">Tên:</span>
                                                        <span className="text-white text-sm truncate">{ws.workspaceName}</span>
                                                    </div>
                                                    {ws.shareCode && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-400 text-xs">Code:</span>
                                                            <span className="text-accentGreen text-xs font-mono">{ws.shareCode}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {ws.shareCode && (
                                                    <button
                                                        onClick={() => handleCopyShareCode(ws.shareCode!)}
                                                        className="flex-shrink-0 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                                        title="Copy share code"
                                                    >
                                                        {copiedShareCode === ws.shareCode ? (
                                                            <Check className="w-4 h-4 text-accentGreen" />
                                                        ) : (
                                                            <Copy className="w-4 h-4 text-gray-300" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Layout Preview */}
                    <div className="flex-1 bg-moduleBackground overflow-y-auto p-8">
                        {/* Controls Section */}
                        <div className="mb-6 flex items-center justify-between gap-4 pb-4 border-b border-gray-700">
                            <div className="flex items-center gap-4 flex-1">
                                {/* Dropdown Button */}
                                <div className="relative flex-shrink-0">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="px-5 py-2.5 bg-transparent hover:bg-gray-900 text-white text-sm font-medium rounded-lg border border-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {selectedLayout}
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                    
                                    {/* Dropdown Menu */}
                                    {isDropdownOpen && (
                                        <div className="absolute top-full mt-2 left-0 min-w-max bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-10">
                                            {layoutOptions.map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={() => {
                                                        setSelectedLayout(option);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-gray-800 transition-colors flex items-center justify-between whitespace-nowrap"
                                                >
                                                    {option}
                                                    {selectedLayout === option && (
                                                        <svg className="w-4 h-4 text-accentGreen ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Name Input */}
                                <div className="flex items-center gap-2 px-4 py-2 bg-transparent rounded-lg border border-accentGreen flex-shrink-0">
                                    <LayoutGrid className="w-4 h-4 text-accentGreen flex-shrink-0" />
                                    <input
                                        type="text"
                                        value={pageName}
                                        onChange={(e) => setPageName(e.target.value)}
                                        placeholder="Nhập tên menu"
                                        className="bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm w-52"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSave();
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                disabled={!pageName.trim()}
                                className="p-3 bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed text-black rounded-lg transition-colors flex-shrink-0"
                            >
                                <Save className="w-5 h-5" />
                            </button>
                        </div>

                        <h3 className="text-white font-medium mb-4">Preview Layout</h3>
                    {selectedLayout === 'Giao diện mặc định' && (
                        <div className="grid grid-cols-12 gap-4">
                            {/* Row 1: Large module (8 cols) + Small module (4 cols) */}
                            <div className="col-span-8 bg-moduleBackground rounded-2xl border-2 border-gray-700/40 p-4 h-65">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-16 h-16 bg-skeletonLine rounded-lg"></div>
                                    <div className="flex-1">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-3 bg-skeletonLine rounded mb-2"></div>
                                        ))}
                                    </div>
                                </div>
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="h-3 bg-skeletonLine rounded mb-2"></div>
                                ))}
                            </div>
                            <div className="col-span-4 bg-moduleBackground rounded-2xl border-2 border-gray-700/40 p-4 h-65">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="h-3 bg-skeletonLine rounded mb-2"></div>
                                ))}
                            </div>

                            {/* Row 2: 3 equal modules */}
                            {[...Array(3)].map((_, idx) => (
                                <div key={`row2-${idx}`} className="col-span-4 bg-moduleBackground rounded-2xl border-2 border-gray-700/40 p-4 h-32">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-3 bg-skeletonLine rounded mb-2"></div>
                                    ))}
                                </div>
                            ))}

                            {/* Row 3: 3 equal modules */}
                            {[...Array(3)].map((_, idx) => (
                                <div key={`row3-${idx}`} className="col-span-4 bg-moduleBackground rounded-2xl border-2 border-gray-700/40 p-4 h-32">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-3 bg-skeletonLine rounded mb-2"></div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedLayout === 'Giao diện nâng cao' && (
                        <div className="grid grid-cols-3 gap-6">
                            {/* Original advanced layout */}
                            {[...Array(3)].map((_, idx) => (
                                <div key={`top-${idx}`} className="bg-moduleBackground rounded-2xl border-2 border-gray-700/40 p-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-3 bg-skeletonLine rounded mb-2"></div>
                                    ))}
                                </div>
                            ))}

                            <div className="col-span-3 bg-moduleBackground rounded-2xl border-2 border-gray-700/40 p-3">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-20 h-20 bg-skeletonLine rounded-lg"></div>
                                    <div className="flex-1">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="h-3 bg-skeletonLine rounded mb-2"></div>
                                        ))}
                                    </div>
                                </div>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-3 bg-skeletonLine rounded mb-2"></div>
                                ))}
                            </div>

                            {[...Array(3)].map((_, idx) => (
                                <div key={`bottom-${idx}`} className="bg-moduleBackground rounded-2xl border-2 border-gray-700/40 p-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-3 bg-skeletonLine rounded mb-2"></div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedLayout === 'Giao diện đơn giản' && (
                        <div className="grid grid-cols-12 gap-4">
                            {/* Row 1: Full width large module */}
                            <div className="col-span-12 bg-moduleBackground rounded-2xl border-2 border-gray-700/40 p-4 h-65">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-16 h-16 bg-skeletonLine rounded-lg"></div>
                                    <div className="flex-1">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-3 bg-skeletonLine rounded mb-2"></div>
                                        ))}
                                    </div>
                                </div>
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="h-3 bg-skeletonLine rounded mb-2"></div>
                                ))}
                            </div>

                            {/* Row 2: 3 equal modules */}
                            {[...Array(3)].map((_, idx) => (
                                <div key={`simple-row2-${idx}`} className="col-span-4 bg-moduleBackground rounded-2xl border-2 border-gray-700/40 p-4 h-32">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-3 bg-skeletonLine rounded mb-2"></div>
                                    ))}
                                </div>
                            ))}

                            {/* Row 3: 3 equal modules */}
                            {[...Array(3)].map((_, idx) => (
                                <div key={`simple-row3-${idx}`} className="col-span-4 bg-moduleBackground rounded-2xl border-2 border-gray-700/40 p-4 h-32">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-3 bg-skeletonLine rounded mb-2"></div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                    </div>
                </div>
            </div>

            {/* Confirmation Popup for Apply Workspace */}
            {showConfirmPopup && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
                    <div className="bg-gray-900 rounded-2xl border border-yellow-500 p-6 max-w-md mx-4">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-white font-semibold mb-2">Xác nhận Apply Workspace</h3>
                                <p className="text-gray-300 text-sm">
                                    Việc apply workspace được share này tương đương với việc bạn tạo 1 workspace mới. 
                                    Vui lòng đảm bảo rằng số workspace không vượt quá cho phép (tối đa 6 workspace).
                                </p>
                                <p className="text-gray-400 text-xs mt-2">
                                    Hiện tại: {workspaceCount}/6 workspaces
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirmPopup(false)}
                                disabled={isApplying}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleApplyWorkspace}
                                disabled={isApplying}
                                className="px-4 py-2 bg-accentGreen hover:bg-green-600 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                {isApplying ? 'Đang xử lý...' : 'Chấp nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
