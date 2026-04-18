"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import statisticService from "@/services/statisticService";
import type { SubscriptionStatisticsDto } from "@/types/subscription";
import Revenue from "@/components/staff/revenue/Revenue";
import Subscription from "@/components/staff/revenue/Subscription";

interface TrendDisplay {
  icon: string;
  className: string;
  text: string;
}

interface RevenueMonthlyPoint {
  label: string;
  revenue: number;
  growthPercentage: number;
}

interface PackageRevenuePoint {
  name: string;
  revenue: number;
  percentage: number;
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

export default function RevenueFeature() {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<SubscriptionStatisticsDto | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        setStatisticsError(null);

        const data = await statisticService.getSubscriptionStatistics();
        setStatistics(data);
      } catch {
        setStatisticsError("Không thể tải dữ liệu thống kê gói đăng ký");
        setStatistics(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const activeUsers = statistics?.activeUsers ?? 0;
  const totalRevenue = statistics?.totalRevenue ?? 0;

  const sortedVipPackageUsages = useMemo(() => {
    return [...(statistics?.vipPackageUsages ?? [])].sort(
      (left, right) => right.totalRevenue - left.totalRevenue
    );
  }, [statistics?.vipPackageUsages]);

  const sortedCurrentUsersByVipLevel = useMemo(() => {
    return [...(statistics?.currentUsersByVipLevel ?? [])].sort((left, right) => {
      if (right.userCount !== left.userCount) {
        return right.userCount - left.userCount;
      }

      return left.levelOrder - right.levelOrder;
    });
  }, [statistics?.currentUsersByVipLevel]);

  const monthlyRevenueData = useMemo<RevenueMonthlyPoint[]>(() => {
    const monthLabels = statistics?.monthLabels ?? [];
    const revenueByMonth = statistics?.revenueByMonth ?? [];
    const revenueGrowth = statistics?.revenueGrowthPercentageByMonth ?? [];

    const length = Math.max(
      monthLabels.length,
      revenueByMonth.length,
      revenueGrowth.length
    );

    return Array.from({ length }, (_, index) => ({
      label: monthLabels[index] ?? `T${String(index + 1).padStart(2, "0")}`,
      revenue: revenueByMonth[index] ?? 0,
      growthPercentage: revenueGrowth[index] ?? 0,
    }));
  }, [
    statistics?.monthLabels,
    statistics?.revenueByMonth,
    statistics?.revenueGrowthPercentageByMonth,
  ]);

  const packageRevenueData = useMemo<PackageRevenuePoint[]>(() => {
    return sortedVipPackageUsages.map((item) => ({
      name: item.levelDisplayName,
      revenue: item.totalRevenue,
      percentage:
        totalRevenue > 0
          ? Number(((item.totalRevenue * 100) / totalRevenue).toFixed(2))
          : 0,
    }));
  }, [sortedVipPackageUsages, totalRevenue]);

  const latestRevenueGrowth =
    statistics?.revenueGrowthPercentageByMonth.at(-1) ?? 0;
  const revenueTrend = formatTrend(latestRevenueGrowth);
  const revenuePerUser = activeUsers > 0 ? Math.round(totalRevenue / activeUsers) : 0;
  const topRevenuePackage = sortedVipPackageUsages[0];
  const normalizedRole = user?.role?.trim().toLowerCase() ?? "";
  const isAdminRole =
    normalizedRole === "admin" ||
    normalizedRole === "administrator" ||
    normalizedRole === "quản trị viên";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-headline mb-2">
            Báo cáo doanh thu
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Theo dõi dòng tiền theo tháng và quản lý cấu hình các gói đăng ký.
          </p>
        </div>
      </div>

      {statisticsError && (
        <p className="text-sm text-red-600 dark:text-red-400">{statisticsError}</p>
      )}

      <Revenue
        totalRevenue={totalRevenue}
        revenuePerUser={revenuePerUser}
        revenueTrend={revenueTrend}
        topPackageName={topRevenuePackage?.levelDisplayName ?? "--"}
        topPackageRevenue={topRevenuePackage?.totalRevenue ?? 0}
        monthlyRevenueData={monthlyRevenueData}
        packageRevenueData={packageRevenueData}
        vipPackageUsages={sortedVipPackageUsages}
        currentUsersByVipLevel={sortedCurrentUsersByVipLevel}
        statisticsError={statisticsError}
        isLoading={isLoading}
      />

      {isAdminRole && <Subscription isLoading={isLoading} />}
    </div>
  );
}
