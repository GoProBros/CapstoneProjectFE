"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import analysisReportService from "@/services/analysisReportService";
import { fetchRecentFinancialReports } from "@/services/financialReportService";
import statisticService from "@/services/statisticService";
import DashboardStatsCards from "@/components/staff/dashboard/DashboardStatsCards";
import NewUsersChart from "@/components/staff/dashboard/NewUsersChart";
import RevenueChart from "@/components/staff/dashboard/RevenueChart";
import type {
  AnalysisReport,
  AnalysisReportCategory,
} from "@/types/analysisReport";
import { CommonStatus } from "@/types/file";
import { FinancialReportStatus, type FinancialReport } from "@/types/financialReport";
import type { SubscriptionStatisticsDto } from "@/types/subscription";

function formatDate(date?: string) {
  if (!date) return "--";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "--";

  return parsed.toLocaleDateString("vi-VN");
}

function getStatusLabel(status: CommonStatus) {
  return status === CommonStatus.Active ? "Đã xuất bản" : "Bản nháp";
}

function getStatusClass(status: CommonStatus) {
  if (status === CommonStatus.Active) {
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
}

function getFinancialPeriodLabel(year: number, period: number) {
  if (period >= 1 && period <= 4) {
    return `BCTC Quý ${period}/${year}`;
  }

  return `BCTC Năm ${year}`;
}

function getFinancialStatusLabel(status: FinancialReportStatus) {
  switch (status) {
    case FinancialReportStatus.Published:
      return "Đã xuất bản";
    case FinancialReportStatus.Archived:
      return "Lưu trữ";
    default:
      return "Bản nháp";
  }
}

function getFinancialStatusClass(status: FinancialReportStatus) {
  switch (status) {
    case FinancialReportStatus.Published:
      return "bg-emerald-100 text-emerald-800";
    case FinancialReportStatus.Archived:
      return "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function formatTrend(value: number) {
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

export default function DashboardFeature() {
  const router = useRouter();
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

  const chartDataLength = Math.max(
    monthLabels.length,
    newUsersByMonth.length,
    revenueByMonth.length
  );

  const monthlyChartData = Array.from({ length: chartDataLength }, (_, index) => ({
    label: monthLabels[index] ?? `${String(index + 1).padStart(2, "0")}/--`,
    newUsers: newUsersByMonth[index] ?? 0,
    revenue: revenueByMonth[index] ?? 0,
  }));

  const userChartData = monthlyChartData;
  const revenueChartData = monthlyChartData;

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoadingStatistics(true);
        setStatisticsError(null);

        const data = await statisticService.getSubscriptionStatistics();
        setStatistics(data);
      } catch {
        setStatisticsError("Không thể tải dữ liệu thống kê");
        setStatistics(null);
      } finally {
        setIsLoadingStatistics(false);
      }
    };

    const fetchFinancialTable = async () => {
      try {
        setIsLoadingFinancial(true);
        setFinancialError(null);

        const paginated = await fetchRecentFinancialReports(1, 5);
        setFinancialReports(paginated.items ?? []);
      } catch {
        setFinancialError("Không thể tải dữ liệu báo cáo tài chính");
        setFinancialReports([]);
      } finally {
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

        const categoryMap = (categoriesPaginated.items ?? []).reduce<
          Record<string, string>
        >((accumulator, category: AnalysisReportCategory) => {
          accumulator[category.code] = category.name;
          return accumulator;
        }, {});

        setAnalysisCategories(categoryMap);
        setAnalysisReports(reportsPaginated.items ?? []);
      } catch {
        setAnalysisError("Không thể tải dữ liệu báo cáo phân tích");
        setAnalysisReports([]);
        setAnalysisCategories({});
      } finally {
        setIsLoadingAnalysis(false);
      }
    };

    fetchStatistics();
    fetchFinancialTable();
    fetchAnalysisReports();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-headline mb-2">
            Tổng quan hệ thống
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Theo dõi nhanh các chỉ số chính, xu hướng người dùng và doanh thu hệ thống.
          </p>
        </div>
      </div>

      <DashboardStatsCards
        totalUsers={totalUsers}
        paidCustomers={paidCustomers}
        totalRevenue={totalRevenue}
        userTrend={userTrend}
        paidTrend={paidTrend}
        revenueTrend={revenueTrend}
        shouldShowStatisticsValue={shouldShowStatisticsValue}
      />
      {statisticsError && (
        <p className="text-sm text-red-600 dark:text-red-400">{statisticsError}</p>
      )}
      {/* Charts */}
      <div className="space-y-8">
        <div>
          <NewUsersChart data={userChartData} />
        </div>
        <div>
          <RevenueChart data={revenueChartData} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Financial Reports Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center gap-3">
            <h3 className="text-base font-bold font-headline text-slate-900 dark:text-slate-100">
              Quản lý báo cáo tài chính gần đây
            </h3>
            <button
              onClick={() => router.push("/SystemManager/financial-reports")}
              className="text-slate-900 dark:text-slate-100 text-[11px] font-bold whitespace-nowrap"
            >
              Xem tất cả báo cáo
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-700/40">
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Tên báo cáo
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Mã cổ phiếu
                  </th>
                  <th className="w-[130px] px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Ngày cập nhật
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {isLoadingFinancial && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-5 text-sm text-slate-500 dark:text-slate-400 text-center"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}

                {!isLoadingFinancial && financialError && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-5 text-sm text-red-600 dark:text-red-400 text-center"
                    >
                      {financialError}
                    </td>
                  </tr>
                )}

                {!isLoadingFinancial &&
                  !financialError &&
                  financialReports.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-5 text-sm text-slate-500 dark:text-slate-400 text-center"
                      >
                        Chưa có dữ liệu báo cáo tài chính
                      </td>
                    </tr>
                  )}

                {!isLoadingFinancial &&
                  !financialError &&
                  financialReports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-sm text-slate-900 dark:text-slate-100">
                        {getFinancialPeriodLabel(report.year, report.period)}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-700 dark:text-slate-300">
                        {report.ticker || "--"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex min-w-[92px] justify-center px-2 py-1 text-[10px] font-bold rounded-full ${getFinancialStatusClass(
                            report.status
                          )}`}
                        >
                          {getFinancialStatusLabel(report.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs font-body text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(report.updatedAt || report.createdAt)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Recent Analysis Reports Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center gap-3">
            <h3 className="text-base font-bold font-headline text-slate-900 dark:text-slate-100">
              Báo cáo phân tích gần đây
            </h3>
            <button
              onClick={() => router.push("/SystemManager/analysis-reports")}
              className="text-slate-900 dark:text-slate-100 text-[11px] font-bold whitespace-nowrap"
            >
              Xem tất cả phân tích
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-700/40">
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Tiêu đề báo cáo
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Phân loại
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {isLoadingAnalysis && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-5 text-sm text-slate-500 dark:text-slate-400 text-center"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}

                {!isLoadingAnalysis && analysisError && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-5 text-sm text-red-600 dark:text-red-400 text-center"
                    >
                      {analysisError}
                    </td>
                  </tr>
                )}

                {!isLoadingAnalysis &&
                  !analysisError &&
                  analysisReports.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-5 text-sm text-slate-500 dark:text-slate-400 text-center"
                      >
                        Chưa có dữ liệu báo cáo phân tích
                      </td>
                    </tr>
                  )}

                {!isLoadingAnalysis &&
                  !analysisError &&
                  analysisReports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-sm text-slate-900 dark:text-slate-100">
                        {report.title}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-700 dark:text-slate-300">
                        {analysisCategories[report.categoryId] ||
                          report.categoryId ||
                          "--"}
                      </td>
                      <td className="w-[130px] px-5 py-3">
                        <span
                          className={`inline-flex min-w-[92px] justify-center px-2 py-1 text-[10px] font-bold rounded-full ${getStatusClass(report.status)}`}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
