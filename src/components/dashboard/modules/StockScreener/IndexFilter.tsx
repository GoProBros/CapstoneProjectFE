"use client";

import React, { useState } from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Index types for Vietnamese stock market indices
 */
export type IndexType = 'VN30' | 'VN50' | 'VN100' | 'VNMID' | 'VNSML' | 'VNALL' | 'VN30F1M' | 'VN30F2M';

interface IndexInfo {
  value: IndexType;
  label: string;
  description: string;
}

const INDICES: IndexInfo[] = [
  { value: 'VN30', label: 'VN30', description: '30 cổ phiếu vốn hóa lớn nhất' },
  { value: 'VN50', label: 'VN50', description: '50 cổ phiếu vốn hóa lớn nhất' },
  { value: 'VN100', label: 'VN100', description: '100 cổ phiếu vốn hóa lớn nhất' },
  { value: 'VNMID', label: 'VNMidCap', description: 'Cổ phiếu vốn hóa trung bình' },
  { value: 'VNSML', label: 'VNSmallCap', description: 'Cổ phiếu vốn hóa nhỏ' },
  { value: 'VNALL', label: 'VNAllShare', description: 'Tất cả cổ phiếu niêm yết' },
  { value: 'VN30F1M', label: 'VN30F1M', description: 'Hợp đồng tương lai VN30 (tháng gần nhất)' },
  { value: 'VN30F2M', label: 'VN30F2M', description: 'Hợp đồng tương lai VN30 (tháng tiếp theo)' },
];

interface IndexFilterProps {
  onIndexChange: (indexType: IndexType) => void;
  isLoading?: boolean;
  selectedIndex?: IndexType | null;
}

export default function IndexFilter({ onIndexChange, isLoading = false, selectedIndex = null }: IndexFilterProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectIndex = (indexType: IndexType) => {
    setIsOpen(false);
    onIndexChange(indexType);
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIndexChange(null as any); // Clear selection
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold text-sm transition-colors ${
          isDark
            ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${
          selectedIndex 
            ? isDark 
              ? 'ring-2 ring-blue-500' 
              : 'ring-2 ring-blue-400'
            : ''
        }`}
      >
        <TrendingUp size={16} />
        <span>{selectedIndex ? INDICES.find(i => i.value === selectedIndex)?.label : 'Chỉ số'}</span>
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        ) : (
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div 
            className={`absolute left-0 top-full mt-2 w-80 rounded-lg border shadow-lg z-20 overflow-hidden ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`px-4 py-2 border-b font-semibold text-sm ${
              isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <span>Chọn chỉ số thị trường</span>
                {selectedIndex && (
                  <button
                    onClick={handleClearSelection}
                    className={`text-xs px-2 py-1 rounded ${
                      isDark
                        ? 'text-blue-400 hover:bg-gray-700'
                        : 'text-blue-600 hover:bg-gray-100'
                    }`}
                  >
                    Xóa lựa chọn
                  </button>
                )}
              </div>
            </div>

            {/* TODO Badge */}
            <div className={`px-4 py-2 border-b ${
              isDark ? 'border-gray-700 bg-yellow-900/20' : 'border-gray-200 bg-yellow-50'
            }`}>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 bg-yellow-500 text-white rounded font-semibold">TODO</span>
                <span className={isDark ? 'text-yellow-400' : 'text-yellow-700'}>
                  API chưa sẵn sàng - Tính năng đang phát triển
                </span>
              </div>
            </div>

            {/* Options */}
            <div className="max-h-96 overflow-y-auto">
              {INDICES.map((index) => (
                <button
                  key={index.value}
                  onClick={() => handleSelectIndex(index.value)}
                  className={`w-full px-4 py-3 text-left transition-colors border-b last:border-b-0 ${
                    selectedIndex === index.value
                      ? isDark
                        ? 'bg-blue-900/30 border-blue-700'
                        : 'bg-blue-50 border-blue-200'
                      : isDark
                      ? 'hover:bg-gray-700 border-gray-700'
                      : 'hover:bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm mb-1 ${
                        selectedIndex === index.value
                          ? isDark ? 'text-blue-400' : 'text-blue-600'
                          : ''
                      }`}>
                        {index.label}
                      </div>
                      <div className={`text-xs ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {index.description}
                      </div>
                    </div>
                    {selectedIndex === index.value && (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer Note */}
            <div className={`px-4 py-2 border-t text-xs ${
              isDark 
                ? 'border-gray-700 bg-gray-750 text-gray-400' 
                : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}>
              💡 Chọn chỉ số để xem danh sách cổ phiếu thành phần
            </div>
          </div>
        </>
      )}
    </div>
  );
}
