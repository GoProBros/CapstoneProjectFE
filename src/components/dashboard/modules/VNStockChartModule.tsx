"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function VNStockChartModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={`dashboard-module w-full h-full rounded-lg p-4 border ${
      isDark ? 'bg-[#282832] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>Biểu đồ cổ phiếu VN</h3>
    </div>
  );
}
