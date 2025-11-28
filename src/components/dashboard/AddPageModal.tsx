'use client';

import React, { useState } from 'react';
import { ChevronDown, LayoutGrid, Save } from 'lucide-react';

interface AddPageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (pageName: string) => void;
}

export default function AddPageModal({ isOpen, onClose, onSave }: AddPageModalProps) {
    const [pageName, setPageName] = useState('');
    const [selectedLayout, setSelectedLayout] = useState('Giao diện nâng cao');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const layoutOptions = ['Giao diện mặc định', 'Giao diện nâng cao', 'Giao diện đơn giản'];

    if (!isOpen) return null;

    const handleSave = () => {
        if (pageName.trim()) {
            onSave(pageName.trim());
            setPageName('');
            onClose();
        }
    };

    const handleClose = () => {
        setPageName('');
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-start justify-center items-center z-50"
            onClick={handleClose}
        >
            <div 
                className="max-w-[700px] h-[85vh] bg-[#0a0a0a] rounded-2xl border-2 border-accentGreen shadow-2xl shadow-accentGreen/20 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
                    <div className="flex items-center gap-4">
                        {/* Dropdown Button */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="px-5 py-2.5 bg-transparent hover:bg-gray-900 text-white text-sm font-medium rounded-lg border border-gray-700 transition-colors flex items-center gap-2"
                            >
                                {selectedLayout}
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute top-full mt-2 left-0 w-48 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-10">
                                    {layoutOptions.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => {
                                                setSelectedLayout(option);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-gray-800 transition-colors flex items-center justify-between"
                                        >
                                            {option}
                                            {selectedLayout === option && (
                                                <svg className="w-4 h-4 text-accentGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-transparent rounded-lg border border-accentGreen">
                            <LayoutGrid className="w-4 h-4 text-accentGreen" />
                            <input
                                type="text"
                                value={pageName}
                                onChange={(e) => setPageName(e.target.value)}
                                placeholder="Nhập tên menu"
                                className="bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm w-64"
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
                        className="ml-4 p-3 bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed text-black rounded-lg transition-colors"
                    >
                        <Save className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Grid Layout */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-3 gap-6">
                        {/* Top Row - 3 Equal Modules */}
                        {[...Array(3)].map((_, idx) => (
                            <div key={`top-${idx}`} className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-3 bg-gray-800 rounded mb-2"></div>
                                ))}
                            </div>
                        ))}

                        {/* Large Module - Wide */}
                        <div className="col-span-3 bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
                            <div className="flex gap-4 mb-4">
                                <div className="w-20 h-20 bg-gray-800 rounded-lg"></div>
                                <div className="flex-1">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="h-3 bg-gray-800 rounded mb-2"></div>
                                    ))}
                                </div>
                            </div>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-3 bg-gray-800 rounded mb-2"></div>
                            ))}
                        </div>

                        {/* Bottom Row - 3 Equal Modules */}
                        {[...Array(3)].map((_, idx) => (
                            <div key={`bottom-${idx}`} className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-3 bg-gray-800 rounded mb-2"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
