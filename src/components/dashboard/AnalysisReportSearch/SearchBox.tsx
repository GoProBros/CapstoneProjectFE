"use client";

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, X } from 'lucide-react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBox({ 
  onSearch, 
  placeholder = "Tìm kiếm báo cáo...",
  className = ""
}: SearchBoxProps) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const isDark = theme === 'dark';

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // TODO: Call API when implemented
    onSearch(value);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(searchQuery);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`relative flex items-center rounded-lg border transition-colors ${
        isDark 
          ? 'bg-[#1e1e26] border-gray-700 focus-within:border-cyan-400' 
          : 'bg-white border-gray-300 focus-within:border-cyan-500'
      }`}>
        <Search 
          className={`absolute left-3 w-5 h-5 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`} 
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2.5 rounded-lg outline-none transition-colors ${
            isDark 
              ? 'bg-transparent text-gray-200 placeholder-gray-500' 
              : 'bg-transparent text-gray-900 placeholder-gray-400'
          }`}
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className={`absolute right-3 p-1 rounded-full transition-colors ${
              isDark 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
            }`}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
