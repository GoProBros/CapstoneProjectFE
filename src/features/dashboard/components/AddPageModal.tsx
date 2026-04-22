'use client';

import React, { useState } from 'react';
import { LayoutGrid, Save, AlertTriangle, X } from 'lucide-react';
import * as workspaceService from '@/services/workspace/workspaceService';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

interface AddPageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (pageName: string) => void;
    onSwitchPage: (pageId: string) => void;
    workspaceCount: number;
}

export default function AddPageModal({ isOpen, onClose, onSave, onSwitchPage, workspaceCount }: AddPageModalProps) {
    const [pageName, setPageName] = useState('');
    const [mode, setMode] = useState<'create' | 'apply'>('create');
    const maxWorkspaces = useSubscriptionStore(s => s.maxWorkspaces);
    const [shareCode, setShareCode] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [showConfirmPopup, setShowConfirmPopup] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleApplyWorkspace = async () => {
        if (workspaceCount >= maxWorkspaces) {
            setError(`Bạn đã đạt giới hạn ${maxWorkspaces} workspace. Vui lòng xóa workspace cũ trước khi apply workspace mới.`);
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

        if (workspaceCount >= maxWorkspaces) {
            setError(`Bạn đã đạt giới hạn ${maxWorkspaces} workspace. Vui lòng xóa workspace cũ trước khi apply workspace mới.`);
            return;
        }

        setShowConfirmPopup(true);
    };

    if (!isOpen) return null;

    const handleSave = () => {
        if (!pageName.trim()) return;
        if (workspaceCount >= maxWorkspaces) {
            setError(`Bạn đã đạt giới hạn ${maxWorkspaces} workspace. Vui lòng xóa workspace cũ trước khi tạo mới.`);
            return;
        }
        onSave(pageName.trim());
        setPageName('');
        onClose();
    };

    const handleClose = () => {
        setPageName('');
        setShareCode('');
        setError(null);
        setShowConfirmPopup(false);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={handleClose}
        >
            <div 
                className="w-full max-w-md bg-[#0a0a0a] rounded-2xl border border-accentGreen shadow-2xl shadow-accentGreen/20 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-gray-800 hover:bg-red-600 rounded-full transition-colors group"
                    title="Đóng"
                >
                    <X className="w-4 h-4 text-gray-300 group-hover:text-white" />
                </button>

                <div className="p-6 pt-5">
                    {/* Mode Toggle */}
                    <div className="inline-flex bg-gray-800 rounded-lg p-0.5 mb-5 border border-gray-700">
                        <button
                            onClick={() => { setMode('create'); setError(null); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                                mode === 'create' ? 'bg-accentGreen text-white' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Tạo mới
                        </button>
                        <button
                            onClick={() => { setMode('apply'); setError(null); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                                mode === 'apply' ? 'bg-accentGreen text-white' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Áp dụng Share Code
                        </button>
                    </div>

                    {mode === 'apply' && (
                        <div>
                            <p className="text-gray-400 text-xs mb-3">Nhập Share Code để áp dụng workspace từ người khác</p>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={shareCode}
                                    onChange={(e) => setShareCode(e.target.value)}
                                    placeholder="Nhập share code..."
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accentGreen"
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyClick(); }}
                                />
                                <button
                                    onClick={handleApplyClick}
                                    disabled={isApplying || !shareCode.trim()}
                                    className="w-full py-2 bg-accentGreen hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    {isApplying ? 'Đang xử lý...' : 'Áp dụng'}
                                </button>
                            </div>
                            {error && (
                                <div className="mt-2 text-red-400 text-xs flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'create' && (
                    <div>
                        <h3 className="text-white text-sm font-semibold mb-3">Tên giao diện mới</h3>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-accentGreen flex-1">
                                    <LayoutGrid className="w-4 h-4 text-accentGreen flex-shrink-0" />
                                    <input
                                        type="text"
                                        value={pageName}
                                        onChange={(e) => setPageName(e.target.value)}
                                        placeholder="Nhập tên giao diện mới"
                                        className="bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm flex-1 min-w-0"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSave();
                                        }}
                                    />
                                </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                disabled={!pageName.trim()}
                                className="p-2.5 bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed text-black rounded-lg transition-colors flex-shrink-0"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                        </div>
                        {error && (
                            <div className="mt-2 text-red-400 text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {error}
                            </div>
                        )}
                    </div>
                    )}
                </div>
            </div>

            {/* Confirmation Popup for Apply Workspace */}
            {showConfirmPopup && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
                    <div className="bg-gray-900 rounded-2xl border border-yellow-500 p-6 max-w-md mx-4">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-white font-semibold mb-2">Xác nhận Áp dụng Giao diện</h3>
                                <p className="text-gray-300 text-sm">
                                    Việc áp dụng giao diện được share này tương đương với việc bạn tạo 1 giao diện mới. 
                                    Vui lòng đảm bảo rằng số giao diện không vượt quá cho phép (tối đa {maxWorkspaces} giao diện).
                                </p>
                                <p className="text-gray-400 text-xs mt-2">
                                    Hiện tại: {workspaceCount}/{maxWorkspaces} giao diện
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
