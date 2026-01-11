"use client";

/**
 * FinancialReportProModule
 * Optimized non-realtime module with extended caching and memoization
 */

import React, { useEffect, useState, memo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFinancialReportQuery } from '@/hooks/useFinancialReportQuery';
import { useModule } from '@/contexts/ModuleContext';
import { useDashboard } from '@/contexts/DashboardContext';
import HeaderSection from './FinancialReportPro/HeaderSection';
import FinancialReportTable from './FinancialReportPro/FinancialReportTable';

// Module type constant for Financial Report Pro
const MODULE_TYPE_FINANCIAL_REPORT_PRO = 2;

// Optimized QueryClient for non-realtime data with extended caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
      gcTime: 30 * 60 * 1000, // 30 minutes - garbage collection time (keep in cache longer)
    },
  },
});

// Memoized content component to prevent unnecessary re-renders
const FinancialReportContent = memo(function FinancialReportContent() {
  const { data, isLoading, isError, error } = useFinancialReportQuery();

  // Error state
  if (isError) {
    return (
      <div className="rounded-finsc overflow-hidden h-full w-full text-base bg-base-300 flex flex-col justify-center items-center p-8">
        <div className="text-red-500 text-xl mb-4">Lỗi tải dữ liệu</div>
        <div className="text-gray-400">{error?.message || 'Vui lòng thử lại sau'}</div>
      </div>
    );
  }

  return (
    <div className="rounded-finsc overflow-hidden h-full w-full text-base bg-base-300 flex flex-col justify-between">
      <HeaderSection />
      <FinancialReportTable data={data || []} loading={isLoading} />
    </div>
  );
});

export default function FinancialReportProModule() {
  return (
    <QueryClientProvider client={queryClient}>
      <FinancialReportContent />
    </QueryClientProvider>
  );
}
