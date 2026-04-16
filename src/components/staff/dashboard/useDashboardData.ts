"use client";

import { useEffect, useState } from "react";
import analysisReportService from "@/services/analysisReportService";
import { fetchRecentFinancialReports } from "@/services/financialReportService";
import statisticService from "@/services/statisticService";
import type { AnalysisReport, AnalysisReportCategory } from "@/types/analysisReport";
import type { FinancialReport } from "@/types/financialReport";
import type {
  SubscriptionStatisticsDto,
  VipCurrentUserCountDto,
  VipPackageUsageDto,
} from "@/types/subscription";

export interface TrendDisplay {
  icon: string;
  className: string;
  text: string;
}

export interface MonthlyChartData {
  label: string;
  newUsers: number;
  revenue: number;
}

function formatTrend(value: number): TrendDisplay {
  const safeValue = Number.isFinite(value) ? value : 0;

  if (safeValue > 0) {
    return {
      icon: "↗",
      className: "text-emerald-600",
      text: `+${safeValue.toFixed(2)}%`,
    };
  }

  if (safeValue < 0) {
    return {
      icon: "↘",
      className: "text-red-600",
      text: `${safeValue.toFixed(2)}%`,
    };
  }

  return {
    icon: "→",
    className: "text-slate-500 dark:text-slate-400",
    text: "0.00%",
  };
}

export function useDashboardData() {
  const [statistics, setStatistics] = useState<SubscriptionStatisticsDto | null>(
    null
  );
  const [isLoadingStatistics, setIsLoadingStatistics] = useState(true);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);

  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(true);
  const [financialError, setFinancialError] = useState<string | null>(null);

  const [analysisReports, setAnalysisReports] = useState<AnalysisReport[]>([]);
  const [analysisCategories, setAnalysisCategories] = useState<
    Record<string, string>
  >({});
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const totalUsers = statistics?.totalUsers ?? 0;
  const totalRevenue = statistics?.totalRevenue ?? 0;
  const paidCustomers = (statistics?.currentUsersByVipLevel ?? []).reduce(
    (total, current) => total + current.userCount,
    0
  );

  const latestNewUserGrowth =
    statistics?.newUsersGrowthPercentageByMonth.at(-1) ?? 0;
  const latestRevenueGrowth =
    statistics?.revenueGrowthPercentageByMonth.at(-1) ?? 0;
  const paidUserRatioGrowth =
    totalUsers > 0 ? (paidCustomers * 100) / totalUsers : 0;

  const userTrend = formatTrend(latestNewUserGrowth);
  const paidTrend = formatTrend(paidUserRatioGrowth);
  const revenueTrend = formatTrend(latestRevenueGrowth);

  const shouldShowStatisticsValue = !isLoadingStatistics && !statisticsError;

  const monthLabels = statistics?.monthLabels ?? [];
  const newUsersByMonth = statistics?.newUsersByMonth ?? [];
  const revenueByMonth = statistics?.revenueByMonth ?? [];
  const vipPackageUsages: VipPackageUsageDto[] =
    statistics?.vipPackageUsages ?? [];
  const currentUsersByVipLevel: VipCurrentUserCountDto[] =
    statistics?.currentUsersByVipLevel ?? [];

  const chartDataLength = Math.max(
    monthLabels.length,
    newUsersByMonth.length,
    revenueByMonth.length
  );

  const monthlyChartData: MonthlyChartData[] = Array.from(
    { length: chartDataLength },
    (_, index) => ({
      label: monthLabels[index] ?? `${String(index + 1).padStart(2, "0")}/--`,
      newUsers: newUsersByMonth[index] ?? 0,
      revenue: revenueByMonth[index] ?? 0,
    })
  );

  useEffect(() => {
    let isDisposed = false;

    const fetchStatistics = async () => {
      try {
        setIsLoadingStatistics(true);
        setStatisticsError(null);

        const data = await statisticService.getSubscriptionStatistics();
        if (isDisposed) return;

        setStatistics(data);
      } catch {
        if (isDisposed) return;

        setStatisticsError("Không thể tải dữ liệu thống kê");
        setStatistics(null);
      } finally {
        if (isDisposed) return;
        setIsLoadingStatistics(false);
      }
    };

    const fetchFinancialTable = async () => {
      try {
        setIsLoadingFinancial(true);
        setFinancialError(null);

        const paginated = await fetchRecentFinancialReports(1, 5);
        if (isDisposed) return;

        setFinancialReports(paginated.items ?? []);
      } catch {
        if (isDisposed) return;

        setFinancialError("Không thể tải dữ liệu báo cáo tài chính");
        setFinancialReports([]);
      } finally {
        if (isDisposed) return;
        setIsLoadingFinancial(false);
      }
    };

    const fetchAnalysisReports = async () => {
      try {
        setIsLoadingAnalysis(true);
        setAnalysisError(null);

        const [reportsPaginated, categoriesPaginated] = await Promise.all([
          analysisReportService.getReports({
            pageIndex: 1,
            pageSize: 5,
          }),
          analysisReportService.getCategories({
            pageIndex: 1,
            pageSize: 100,
          }),
        ]);

        if (isDisposed) return;

        const categoryMap = (categoriesPaginated.items ?? []).reduce<
          Record<string, string>
        >((accumulator, category: AnalysisReportCategory) => {
          accumulator[category.code] = category.name;
          return accumulator;
        }, {});

        setAnalysisCategories(categoryMap);
        setAnalysisReports(reportsPaginated.items ?? []);
      } catch {
        if (isDisposed) return;

        setAnalysisError("Không thể tải dữ liệu báo cáo phân tích");
        setAnalysisReports([]);
        setAnalysisCategories({});
      } finally {
        if (isDisposed) return;
        setIsLoadingAnalysis(false);
      }
    };

    fetchStatistics();
    fetchFinancialTable();
    fetchAnalysisReports();

    return () => {
      isDisposed = true;
    };
  }, []);

  return {
    totalUsers,
    totalRevenue,
    paidCustomers,
    userTrend,
    paidTrend,
    revenueTrend,
    shouldShowStatisticsValue,
    statisticsError,
    userChartData: monthlyChartData,
    revenueChartData: monthlyChartData,
    vipPackageUsages,
    currentUsersByVipLevel,
    financialReports,
    isLoadingFinancial,
    financialError,
    analysisReports,
    analysisCategories,
    isLoadingAnalysis,
    analysisError,
  };
}
