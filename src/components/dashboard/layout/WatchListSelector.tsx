"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ListOrdered, ChevronDown, Check, Trash2, Loader2, Plus, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { WatchListSummary } from '@/types/watchList';

interface WatchListSelectorProps {
  watchLists: WatchListSummary[];
  currentWatchListId: number | null;
  currentWatchListName: string;
  isLoading: boolean;
  onSelect: (watchList: WatchListSummary) => void;
  onDelete?: (watchList: WatchListSummary) => void;
  onRefresh: () => void;
  onCreateNew?: (name: string) => void;
}

export default function WatchListSelector({
  watchLists,
  currentWatchListId,
  currentWatchListName,
  isLoading,
  onSelect,
  onDelete,
  onRefresh,
  onCreateNew,
}: WatchListSelectorProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWatchListName, setNewWatchListName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewWatchListName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load watch lists when dropdown opens
  const handleToggle = () => {
    if (!isOpen) {
      onRefresh();
    }
    setIsOpen(!isOpen);
    setIsCreating(false);
    setNewWatchListName('');
  };

  const handleSelect = (watchList: WatchListSummary) => {
    onSelect(watchList);
    setIsOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, watchList: WatchListSummary) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(watchList);
    }
  };

  const handleCreateNew = async () => {
    if (!onCreateNew || !newWatchListName.trim()) return;
    
    onCreateNew(newWatchListName.trim());
    setIsCreating(false);
    setNewWatchListName('');
    setIsOpen(false);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewWatchListName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreateNew();
    } else if (e.key === 'Escape') {
      handleCancelCreate();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
          currentWatchListId !== null
            ? isDark 
              ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800 disabled:opacity-50' 
              : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-300'
            : isDark 
              ? 'bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-700 disabled:opacity-50' 
              : 'bg-gray-400 hover:bg-gray-500 text-white disabled:bg-gray-300'
        }`}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <ListOrdered size={18} />
        )}
        <span className="text-sm max-w-[150px] truncate">{currentWatchListName}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute top-full left-0 mt-2 w-80 rounded-lg shadow-lg border z-50 overflow-hidden ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          {/* Header */}
          <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <span className={`text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Chọn watch list
            </span>
          </div>

          {/* Create New Watch List Section */}
          {onCreateNew && (
            <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {!isCreating ? (
                <button
                  onClick={() => setIsCreating(true)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    isDark 
                      ? 'hover:bg-blue-900/30 text-blue-400' 
                      : 'hover:bg-blue-50 text-blue-600'
                  }`}
                >
                  <Plus size={16} />
                  <span>Tạo watch list mới</span>
                </button>
              ) : (
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newWatchListName}
                      onChange={(e) => setNewWatchListName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Tên watch list..."
                      autoFocus
                      className={`flex-1 px-2 py-1.5 text-sm rounded border ${
                        isDark 
                          ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <button
                      onClick={handleCreateNew}
                      disabled={!newWatchListName.trim()}
                      className={`p-1.5 rounded transition-colors ${
                        newWatchListName.trim()
                          ? isDark 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                          : isDark 
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={handleCancelCreate}
                      className={`p-1.5 rounded transition-colors ${
                        isDark 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                      }`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Watch list mới sẽ không chứa mã nào. Bạn có thể thêm mã sau khi tạo.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Watch List List */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="animate-spin text-gray-400" />
                <span className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Đang tải...
                </span>
              </div>
            ) : watchLists.length === 0 ? (
              <div className={`px-3 py-4 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Không có watch list nào
              </div>
            ) : (
              // Sort watch lists by id ascending
              [...watchLists].sort((a, b) => a.id - b.id).map((watchList) => (
                <div
                  key={watchList.id}
                  onClick={() => handleSelect(watchList)}
                  className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${
                    currentWatchListId === watchList.id
                      ? isDark 
                        ? 'bg-blue-900/30 text-blue-400' 
                        : 'bg-blue-50 text-blue-600'
                      : isDark 
                        ? 'hover:bg-gray-700 text-gray-200' 
                        : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {currentWatchListId === watchList.id && (
                      <Check size={16} className="flex-shrink-0 text-blue-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {watchList.name}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {watchList.tickerCount} mã
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete button */}
                  {onDelete && (
                    <button
                      onClick={(e) => handleDelete(e, watchList)}
                      className={`p-1 rounded transition-colors flex-shrink-0 ${
                        isDark 
                          ? 'hover:bg-red-900/50 text-gray-500 hover:text-red-400' 
                          : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                      }`}
                      title="Xóa watch list"
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
