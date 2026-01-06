"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FolderOpen, ChevronDown, Check, Trash2, Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { ModuleLayoutSummary } from '@/types/layout';

interface LayoutSelectorProps {
  layouts: ModuleLayoutSummary[];
  currentLayoutId: number | null;
  currentLayoutName: string;
  isLoading: boolean;
  onSelect: (layout: ModuleLayoutSummary) => void;
  onDelete?: (layout: ModuleLayoutSummary) => void;
  onRefresh: () => void;
}

export default function LayoutSelector({
  layouts,
  currentLayoutId,
  currentLayoutName,
  isLoading,
  onSelect,
  onDelete,
  onRefresh,
}: LayoutSelectorProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load layouts when dropdown opens
  const handleToggle = () => {
    if (!isOpen) {
      onRefresh();
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (layout: ModuleLayoutSummary) => {
    onSelect(layout);
    setIsOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, layout: ModuleLayoutSummary) => {
    e.stopPropagation();
    if (onDelete && !layout.isSystemDefault) {
      onDelete(layout);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
          isDark 
            ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-800 disabled:opacity-50' 
            : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-green-300'
        }`}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <FolderOpen size={18} />
        )}
        <span className="text-sm max-w-[150px] truncate">{currentLayoutName}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute top-full right-0 mt-2 w-64 rounded-lg shadow-lg border z-50 overflow-hidden ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          {/* Header */}
          <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <span className={`text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Chọn layout
            </span>
          </div>

          {/* Layout List */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="animate-spin text-gray-400" />
                <span className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Đang tải...
                </span>
              </div>
            ) : layouts.length === 0 ? (
              <div className={`px-3 py-4 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Không có layout nào
              </div>
            ) : (
              layouts.map((layout) => (
                <div
                  key={layout.id}
                  onClick={() => handleSelect(layout)}
                  className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${
                    currentLayoutId === layout.id
                      ? isDark 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-green-50 text-green-600'
                      : isDark 
                        ? 'hover:bg-gray-700 text-gray-200' 
                        : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {currentLayoutId === layout.id && (
                      <Check size={16} className="flex-shrink-0 text-green-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {layout.layoutName}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {layout.isSystemDefault ? 'Mặc định hệ thống' : 
                         layout.isPersonal ? 'Cá nhân' : 'Chia sẻ'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete button - only for non-system layouts */}
                  {onDelete && !layout.isSystemDefault && (
                    <button
                      onClick={(e) => handleDelete(e, layout)}
                      className={`p-1 rounded transition-colors flex-shrink-0 ${
                        isDark 
                          ? 'hover:bg-red-900/50 text-gray-500 hover:text-red-400' 
                          : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                      }`}
                      title="Xóa layout"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
