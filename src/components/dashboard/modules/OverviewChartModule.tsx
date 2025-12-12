"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function OverviewChartModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={`dashboard-module w-full h-full rounded-lg p-4 border ${
      isDark ? 'bg-[#282832] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <h3 className="text-white text-lg font-semibold mb-4">Biểu đồ tổng quan</h3>
    </div>
  );
}
