"use client";

/**
 * FinancialReportProModule
 * Main component integrating all subcomponents with TanStack Query + Zustand
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFinancialReportQuery } from '@/hooks/useFinancialReportQuery';
import HeaderSection from './FinancialReportPro/HeaderSection';
import FinancialReportTable from './FinancialReportPro/FinancialReportTable';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function FinancialReportContent() {
  const { data, isLoading, isError, error } = useFinancialReportQuery();

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
}

export default function FinancialReportProModule() {
  return (
    <QueryClientProvider client={queryClient}>
      <FinancialReportContent />
    </QueryClientProvider>
  );
}
