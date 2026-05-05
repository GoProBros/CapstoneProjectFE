"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, TrendingUp } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { getMarketIndices } from "@/services/market/marketIndexService";
import type { MarketIndex } from "@/types/marketIndex";

export type { MarketIndex };

interface IndexFilterProps {
  onIndexChange: (index: MarketIndex | null) => void;
  isLoading?: boolean;
  selectedIndex?: MarketIndex | null;
  compact?: boolean;
}

export default function IndexFilter({
  onIndexChange,
  isLoading = false,
  selectedIndex = null,
  compact = false,
}: IndexFilterProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loadingIndices, setLoadingIndices] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const loadIndices = async () => {
      setLoadingIndices(true);
      try {
        const response = await getMarketIndices({ status: 1, pageSize: 50 });
        if (response.isSuccess && response.data?.items?.length) {
          setIndices(response.data.items);
        }
      } catch (error) {
        console.error("[IndexFilter] Error loading indices:", error);
      } finally {
        setLoadingIndices(false);
      }
    };

    loadIndices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectIndex = (index: MarketIndex) => {
    setIsOpen(false);
    onIndexChange(index);
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIndexChange(null);
    setIsOpen(false);
  };

  const isButtonLoading = isLoading || loadingIndices;

  return (
    <div className={`relative ${compact ? 'w-[128px]' : ''}`}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isButtonLoading}
        className={`flex items-center gap-2 ${compact ? 'w-[128px] justify-between px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-lg border font-semibold transition-colors ${
          isDark
            ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
        } ${isButtonLoading ? "opacity-50 cursor-not-allowed" : ""} ${
          selectedIndex
            ? isDark
              ? "ring-2 ring-blue-500"
              : "ring-2 ring-blue-400"
            : ""
        }`}
      >
        <TrendingUp size={14} />
        <span>{selectedIndex?.code ?? indices[0]?.code ?? "Chỉ số"}</span>
        {isButtonLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        ) : (
          <ChevronDown
            size={14}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
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
            className={`absolute left-0 top-full mt-2 ${compact ? 'w-72' : 'w-80'} rounded-lg border shadow-lg z-20 overflow-hidden ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Options */}
            <div className="max-h-96 overflow-y-auto">
              {loadingIndices ? (
                <div
                  className={`px-4 py-6 text-center text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                  Đang tải danh sách chỉ số...
                </div>
              ) : indices.length === 0 ? (
                <div
                  className={`px-4 py-6 text-center text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  Không có dữ liệu
                </div>
              ) : (
                indices.map((index) => (
                  <button
                    key={index.code}
                    onClick={() => handleSelectIndex(index)}
                    className={`w-full ${compact ? 'px-3 py-2.5' : 'px-4 py-3'} text-left transition-colors border-b last:border-b-0 ${
                      selectedIndex?.code === index.code
                        ? isDark
                          ? "bg-blue-900/30 border-blue-700"
                          : "bg-blue-50 border-blue-200"
                        : isDark
                          ? "hover:bg-gray-700 border-gray-700"
                          : "hover:bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-semibold text-sm mb-1 ${
                            selectedIndex?.code === index.code
                              ? isDark
                                ? "text-blue-400"
                                : "text-blue-600"
                              : ""
                          }`}
                        >
                          {index.code}
                        </div>
                        <div
                          className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {index.name}
                        </div>
                      </div>
                      {selectedIndex?.code === index.code && (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
