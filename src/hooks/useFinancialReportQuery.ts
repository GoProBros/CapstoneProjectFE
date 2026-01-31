/**
 * Custom hook for Financial Report data fetching
 * Integrates TanStack Query with Zustand store
 */

import { useQuery } from '@tanstack/react-query';
import { useFinancialReportStore } from '@/stores/financialReportStore';
import { fetchFinancialReports, fetchIndustries } from '@/services/financialReportService';
import type { FinancialReportTableRow, IndustryOption } from '@/types/financialReport';

/**
 * Hook for fetching financial report data
 * Auto-refetch when filters change
 */
export function useFinancialReportQuery() {
  const filters = useFinancialReportStore((state) => state.filters);

  return useQuery<{ items: FinancialReportTableRow[]; totalCount: number }, Error>({
    queryKey: ['financial-reports', filters],
    queryFn: () => fetchFinancialReports(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    select: (data) => ({
      items: data.items || [],
      totalCount: data.totalCount || 0,
    }),
  });
}

/**
 * Hook for fetching industries
 */
export function useIndustriesQuery() {
  return useQuery<IndustryOption[], Error>({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}
