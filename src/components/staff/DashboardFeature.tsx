"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SystemNotificationModal from "@/components/staff/dashboard/SystemNotificationModal";
import UserDashboardSection from "@/components/staff/dashboard/UserDashboardSection";
import RevenueDashboardSection from "@/components/staff/dashboard/RevenueDashboardSection";
import SystemDashboardSection from "@/components/staff/dashboard/SystemDashboardSection";
import analysisReportService from "@/services/analysisReportService";
import { fetchRecentFinancialReports } from "@/services/financialReportService";
import systemDataService from "@/services/systemDataService";
import { fetchSymbolsPaginated } from "@/services/symbolService";
import statisticService from "@/services/statisticService";
import type { DataFetchTaskType, SystemLogItem } from "@/types/systemData";
import type {
  AnalysisReport,
  AnalysisReportCategory,
} from "@/types/analysisReport";
import type { FinancialReport } from "@/types/financialReport";
import type {
  CustomerRetentionStatisticsDto,
  InterestedSymbolCountDto,
  SubscriptionStatisticsDto,
} from "@/types/subscription";

interface TrendDisplay {
  icon: string;
  className: string;
  text: string;
}

interface UserGrowthPoint {
  label: string;
  users: number;
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

interface RetentionDisplayRow {
  key: string;
  label: string;
  users: number;
  rate: number;
}

interface UserDistributionPoint {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

type TaskStatus = "idle" | "loading" | "success" | "failed";

function formatTrend(value: number, mode: "percent" | "number"): TrendDisplay {
  const safeValue = Number.isFinite(value) ? value : 0;

  if (safeValue > 0) {
    return {
      icon: "↗",
      className: "text-emerald-600",
      text:
        mode === "percent"
          ? `+${safeValue.toFixed(2)}%`
          : `+${new Intl.NumberFormat("vi-VN").format(safeValue)}`,
    };
  }

  if (safeValue < 0) {
    return {
      icon: "↘",
      className: "text-red-600",
      text:
        mode === "percent"
          ? `${safeValue.toFixed(2)}%`
          : new Intl.NumberFormat("vi-VN").format(safeValue),
    };
  }

  return {
    icon: "→",
    className: "text-slate-500 dark:text-slate-400",
    text: mode === "percent" ? "0.00%" : "0",
  };
}

function formatDateTime(date?: string): string {
  if (!date) return "--";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "--";

  return parsed.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatSystemLogMessage(log: SystemLogItem): string {
  const timestamp = formatDateTime(
    typeof log.timestamp === "string" ? log.timestamp : undefined
  );
  const level =
    typeof log.level === "string" && log.level.trim().length > 0
      ? log.level.toUpperCase()
      : "INFO";
  const source =
    typeof log.source === "string" && log.source.trim().length > 0
      ? `${log.source.trim()}: `
      : "";
  const message =
    typeof log.message === "string" && log.message.trim().length > 0
      ? log.message.trim()
      : "Không có nội dung log";

  return `[${timestamp}] [${level}] ${source}${message}`;
}

export default function DashboardFeature() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSystemNotificationModalOpen, setIsSystemNotificationModalOpen] =
    useState(false);

  const [statistics, setStatistics] = useState<SubscriptionStatisticsDto | null>(
    null
  );
  const [customerRetention, setCustomerRetention] =
    useState<CustomerRetentionStatisticsDto | null>(null);
  const [topInterestedSymbols, setTopInterestedSymbols] = useState<
    InterestedSymbolCountDto[]
  >([]);
  const [totalStocks, setTotalStocks] = useState(0);
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
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [isLoadingSystemLogs, setIsLoadingSystemLogs] = useState(true);
  const [systemLogsError, setSystemLogsError] = useState<string | null>(null);
  const [dataFetchTaskStatusMap, setDataFetchTaskStatusMap] = useState<
    Record<DataFetchTaskType, TaskStatus>
  >({
    "import-sectors": "idle",
    "import-symbols": "idle",
    "map-symbols-sectors": "idle",
    "import-index-constituents": "idle",
  });

  const normalizedRole = user?.role?.trim().toLowerCase() ?? "";
  const isAdmin =
    normalizedRole === "admin" ||
    normalizedRole === "administrator" ||
    normalizedRole === "quản trị viên";

  useEffect(() => {
    let isDisposed = false;

    const fetchDashboardStatistics = async () => {
      try {
        setIsLoadingStatistics(true);
        setStatisticsError(null);

        const [statisticsData, retentionData, watchlistData, symbolPage] =
          await Promise.all([
            statisticService.getSubscriptionStatistics(),
            statisticService.getCustomerRetentionStatistics(),
            statisticService.getWatchListTopInterestedSymbols(),
            fetchSymbolsPaginated({
              PageIndex: 1,
              PageSize: 10,
            }),
          ]);

        if (isDisposed) return;

        setStatistics(statisticsData);
        setCustomerRetention(retentionData);
        setTopInterestedSymbols(watchlistData.top5Symbols ?? []);
        setTotalStocks(symbolPage.totalCount ?? 0);
      } catch {
        if (isDisposed) return;

        setStatisticsError("Không thể tải dữ liệu thống kê dashboard");
        setStatistics(null);
        setCustomerRetention(null);
        setTopInterestedSymbols([]);
        setTotalStocks(0);
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

    const fetchAnalysisTable = async () => {
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

    const fetchSystemLogs = async () => {
      try {
        setIsLoadingSystemLogs(true);
        setSystemLogsError(null);

        const paginatedLogs = await systemDataService.getSystemLogs({
          pageIndex: 1,
          pageSize: 10,
        });

        if (isDisposed) return;

        const formattedLogs = (paginatedLogs.items ?? []).map((log) =>
          formatSystemLogMessage(log)
        );
        setSystemLogs(formattedLogs);
      } catch (error) {
        if (isDisposed) return;

        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu nhật ký hệ thống";
        setSystemLogsError(message);
        setSystemLogs([]);
      } finally {
        if (isDisposed) return;
        setIsLoadingSystemLogs(false);
      }
    };

    fetchDashboardStatistics();
    fetchFinancialTable();
    fetchAnalysisTable();
    fetchSystemLogs();

    return () => {
      isDisposed = true;
    };
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

  const paidCustomers = sortedCurrentUsersByVipLevel.reduce(
    (sum, item) => sum + item.userCount,
    0
  );
  const freeUsers = Math.max(activeUsers - paidCustomers, 0);
  const paidRatio =
    activeUsers > 0 ? Number(((paidCustomers * 100) / activeUsers).toFixed(1)) : 0;

  const latestNewUsersByMonth = statistics?.newUsersByMonth.at(-1) ?? 0;
  const latestNewUsersGrowthPercentage =
    statistics?.newUsersGrowthPercentageByMonth.at(-1) ?? 0;
  const latestRevenueGrowth =
    statistics?.revenueGrowthPercentageByMonth.at(-1) ?? 0;

  const userTrend = formatTrend(latestNewUsersByMonth, "number");
  const userGrowthPercentTrend = formatTrend(
    latestNewUsersGrowthPercentage,
    "percent"
  );
  const revenueTrend = formatTrend(latestRevenueGrowth, "percent");

  const userGrowthData = useMemo<UserGrowthPoint[]>(() => {
    const monthLabels = statistics?.monthLabels ?? [];
    const newUsersByMonth = statistics?.newUsersByMonth ?? [];

    const length = Math.max(monthLabels.length, newUsersByMonth.length);

    return Array.from({ length }, (_, index) => ({
      label: monthLabels[index] ?? `T${String(index + 1).padStart(2, "0")}`,
      users: newUsersByMonth[index] ?? 0,
    }));
  }, [statistics?.monthLabels, statistics?.newUsersByMonth]);

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

  const packageRevenueChartData = useMemo<PackageRevenuePoint[]>(() => {
    return sortedVipPackageUsages.map((item) => ({
      name: item.levelDisplayName,
      revenue: item.totalRevenue,
      percentage:
        totalRevenue > 0
          ? Number(((item.totalRevenue * 100) / totalRevenue).toFixed(2))
          : 0,
    }));
  }, [sortedVipPackageUsages, totalRevenue]);

  const revenuePerUser = activeUsers > 0 ? Math.round(totalRevenue / activeUsers) : 0;
  const topRevenuePackage = sortedVipPackageUsages[0];

  const retentionRows = useMemo<RetentionDisplayRow[]>(() => {
    if (!customerRetention) {
      return [];
    }

    return [
      {
        key: "at-least-1",
        label: "Ít nhất 1 lần",
        users: customerRetention.customersRegisteredAtLeast1Time,
        rate: customerRetention.customersRegisteredAtLeast1TimeRate,
      },
      {
        key: "at-least-3",
        label: "Ít nhất 3 lần",
        users: customerRetention.customersRegisteredAtLeast3Times,
        rate: customerRetention.customersRegisteredAtLeast3TimesRate,
      },
      {
        key: "at-least-6",
        label: "Ít nhất 6 lần",
        users: customerRetention.customersRegisteredAtLeast6Times,
        rate: customerRetention.customersRegisteredAtLeast6TimesRate,
      },
    ];
  }, [customerRetention]);

  const sortedTopInterestedSymbols = useMemo(() => {
    return [...topInterestedSymbols].sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.symbol.localeCompare(right.symbol);
    });
  }, [topInterestedSymbols]);

  const userDistributionData: UserDistributionPoint[] = [
    {
      name: "Người dùng miễn phí",
      value: freeUsers,
      color: "#94a3b8",
    },
    {
      name: "Người dùng trả phí",
      value: paidCustomers,
      color: "#2563eb",
    },
  ];

  const handleRunDataFetchTask = async (taskId: DataFetchTaskType) => {
    try {
      setDataFetchTaskStatusMap((previous) => ({
        ...previous,
        [taskId]: "loading",
      }));

      await systemDataService.runDataFetchTask(taskId);

      setDataFetchTaskStatusMap((previous) => ({
        ...previous,
        [taskId]: "success",
      }));
    } catch {
      setDataFetchTaskStatusMap((previous) => ({
        ...previous,
        [taskId]: "failed",
      }));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-headline mb-2">
            Tổng quan hệ thống
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Theo dõi nhanh các chỉ số chính, xu hướng người dùng và doanh thu hệ thống.
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/SystemManager/macroeconomic-simulation")}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
            >
              Mô phỏng vĩ mô (DEMO)
            </button>
            <button
              type="button"
              onClick={() => setIsSystemNotificationModalOpen(true)}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
            >
              Tạo thông báo
            </button>
          </div>
        )}
      </div>
      
      <SystemNotificationModal
        isOpen={isSystemNotificationModalOpen}
        onOpenChange={setIsSystemNotificationModalOpen}
      />

      <UserDashboardSection
        totalUsers={activeUsers}
        paidCustomers={paidCustomers}
        freeUsers={freeUsers}
        paidRatio={paidRatio}
        userTrend={userTrend}
        userGrowthPercentTrend={userGrowthPercentTrend}
        userGrowthData={userGrowthData}
        userDistributionData={userDistributionData}
        retentionRows={retentionRows}
        retentionTotalCustomers={customerRetention?.totalActiveCustomers ?? 0}
        isLoadingRetention={isLoadingStatistics}
        statisticsError={statisticsError}
      />

      <RevenueDashboardSection
        totalRevenue={totalRevenue}
        revenuePerUser={revenuePerUser}
        revenueTrend={revenueTrend}
        topPackageName={topRevenuePackage?.levelDisplayName ?? "--"}
        topPackageRevenue={topRevenuePackage?.totalRevenue ?? 0}
        monthlyRevenueData={monthlyRevenueData}
        packageRevenueData={packageRevenueChartData}
        vipPackageUsages={sortedVipPackageUsages}
        currentUsersByVipLevel={sortedCurrentUsersByVipLevel}
        statisticsError={statisticsError}
      />

      <SystemDashboardSection
        isAdmin={isAdmin}
        onRunDataFetchTask={handleRunDataFetchTask}
        dataFetchTaskStatusMap={dataFetchTaskStatusMap}
        onNavigateDataLogs={() => router.push("/SystemManager/data")}
        onNavigateFinancialReports={() => router.push("/SystemManager/financial-reports")}
        onNavigateAnalysisReports={() => router.push("/SystemManager/analysis-reports")}
        totalStocks={totalStocks}
        topInterestedSymbols={sortedTopInterestedSymbols}
        isLoadingSystemStatistics={isLoadingStatistics}
        systemStatisticsError={statisticsError}
        systemLogs={systemLogs}
        isLoadingSystemLogs={isLoadingSystemLogs}
        systemLogsError={systemLogsError}
        financialReports={financialReports}
        isLoadingFinancial={isLoadingFinancial}
        financialError={financialError}
        analysisReports={analysisReports}
        analysisCategories={analysisCategories}
        isLoadingAnalysis={isLoadingAnalysis}
        analysisError={analysisError}
      />
    </div>
  );
}
