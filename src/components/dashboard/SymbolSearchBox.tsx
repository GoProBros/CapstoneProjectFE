"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { searchSymbols } from '@/services/symbolService';
import { SymbolSearchResultDto } from '@/types/symbol';

interface SymbolSearchBoxProps {
  isConnected: boolean;
  onSymbolSelect: (ticker: string) => void;
}

export default function SymbolSearchBox({ isConnected, onSymbolSelect }: SymbolSearchBoxProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // State
  const [searchInput, setSearchInput] = useState<string>('');
  const [isTickerOnly, setIsTickerOnly] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SymbolSearchResultDto[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  
  // Refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const PAGE_SIZE = 20;
  
  /**
   * Perform search with current params
   */
  const performSearch = useCallback(async (query: string, page: number, append: boolean = false) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const response = await searchSymbols({
        query: query.trim(),
        isTickerOnly,
        pageIndex: page,
        pageSize: PAGE_SIZE,
      });
      
      // Append or replace results
      if (append) {
        setSearchResults(prev => [...prev, ...response.items]);
      } else {
        setSearchResults(response.items);
      }
      
      setPageIndex(response.pageIndex);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
      setHasNextPage(response.hasNextPage);
      setShowDropdown(true);
    } catch (error) {
      console.error('[SymbolSearchBox] Search error:', error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, [isTickerOnly]);
  
  /**
   * Debounced search on input change
   */
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Reset to page 1 on new input
    if (searchInput.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchInput, 1, false);
      }, 500); // 500ms debounce
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput, performSearch]);
  
  /**
   * Re-search when isTickerOnly changes
   */
  useEffect(() => {
    if (searchInput.trim()) {
      performSearch(searchInput, 1, false);
    }
  }, [isTickerOnly, performSearch, searchInput]);
  
  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  /**
   * Handle symbol selection
   */
  const handleSelectSymbol = (ticker: string) => {
    onSymbolSelect(ticker);
    setSearchInput('');
    setSearchResults([]);
    setShowDropdown(false);
  };
  
  /**
   * Load more results (pagination)
   */
  const handleLoadMore = () => {
    if (hasNextPage && !isSearching) {
      performSearch(searchInput, pageIndex + 1, true); // Append results
    }
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input Container */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Tìm mã CK..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={!isConnected}
            className={`pl-9 pr-4 py-1.5 rounded-lg text-sm border transition-colors w-64 ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 disabled:opacity-50' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 disabled:opacity-50'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          {isSearching && (
            <div className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <span className="animate-spin">⏳</span>
            </div>
          )}
          {searchInput && !isSearching && (
            <button
              onClick={() => {
                setSearchInput('');
                setSearchResults([]);
                setShowDropdown(false);
              }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs hover:text-red-500 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {/* Toggle IsTickerOnly */}
        <button
          onClick={() => setIsTickerOnly(prev => !prev)}
          disabled={!isConnected}
          title={isTickerOnly ? 'Chỉ tìm mã CK' : 'Tìm cả tên công ty'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isTickerOnly
              ? isDark 
                ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50' 
                : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
              : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
          }`}
        >
          {isTickerOnly ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          <span>{isTickerOnly ? 'Chỉ mã' : 'Tất cả'}</span>
        </button>
      </div>
      
      {/* Dropdown Results */}
      {showDropdown && searchResults.length > 0 && (
        <div className={`absolute top-full mt-2 w-96 max-h-96 overflow-y-auto rounded-lg shadow-lg border z-50 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Results List */}
          <div className="py-1">
            {searchResults.map((item, index) => (
              <button
                key={`${item.ticker}-${index}`}
                onClick={() => handleSelectSymbol(item.ticker)}
                className={`w-full px-4 py-2.5 text-left hover:bg-opacity-80 transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-700' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className={`font-bold text-sm ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {item.ticker}
                    </div>
                    <div className={`text-xs mt-0.5 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {item.viCompanyName}
                    </div>
                    {item.enCompanyName && (
                      <div className={`text-xs mt-0.5 italic ${
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {item.enCompanyName}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Load More Button */}
          {hasNextPage && (
            <div className={`border-t px-4 py-2 ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={handleLoadMore}
                disabled={isSearching}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50'
                }`}
              >
                {isSearching ? 'Đang tải...' : `Tải thêm (${searchResults.length}/${totalCount})`}
              </button>
            </div>
          )}
          
          {/* Summary */}
          <div className={`border-t px-4 py-2 text-xs ${
            isDark 
              ? 'border-gray-700 text-gray-400' 
              : 'border-gray-200 text-gray-600'
          }`}>
            {totalCount} kết quả • Trang {pageIndex}/{totalPages}
          </div>
        </div>
      )}
      
      {/* No Results */}
      {showDropdown && searchResults.length === 0 && !isSearching && searchInput.trim() && (
        <div className={`absolute top-full mt-2 w-96 rounded-lg shadow-lg border z-50 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className={`px-4 py-3 text-sm text-center ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Không tìm thấy kết quả cho &quot;{searchInput}&quot;
          </div>
        </div>
      )}
    </div>
  );
}
