/**
 * Custom hook for Financial Report data fetching
 * Integrates TanStack Query with Zustand store
 */

import { useQuery } from '@tanstack/react-query';
import { useFinancialReportStore } from '@/stores/financialReportStore';
import { fetchFinancialReports } from '@/services/financialReportService';
import type { FinancialReportTableRow } from '@/types/financialReport';

/**
 * Hook for fetching financial report data
 * Auto-refetch when filters change
 */
export function useFinancialReportQuery() {
  const filters = useFinancialReportStore((state) => state.filters);

  return useQuery<{ items: FinancialReportTableRow[]; totalCount: number }, Error>({
    queryKey: ['financial-reports', filters],
    queryFn: () => fetchFinancialReports(filters),
    staleTime: 60 * 60 * 1000, // 60 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    select: (data) => ({
      items: data.items || [],
      totalCount: data.totalCount || 0,
    }),
  });
}
