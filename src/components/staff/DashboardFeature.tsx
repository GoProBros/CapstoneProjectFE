"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Award, CreditCard, MoreHorizontal } from "lucide-react";
import analysisReportService from "@/services/analysisReportService";
import { fetchRecentFinancialReports } from "@/services/financialReportService";
import type {
  AnalysisReport,
  AnalysisReportCategory,
} from "@/types/analysisReport";
import { CommonStatus } from "@/types/file";
import { FinancialReportStatus, type FinancialReport } from "@/types/financialReport";

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

export default function DashboardFeature() {
  const router = useRouter();
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(true);
  const [financialError, setFinancialError] = useState<string | null>(null);
  const [analysisReports, setAnalysisReports] = useState<AnalysisReport[]>([]);
  const [analysisCategories, setAnalysisCategories] = useState<
    Record<string, string>
  >({});
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchFinancialTable();
    fetchAnalysisReports();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <Users className="w-5 h-5 text-slate-900 dark:text-slate-100" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
              <span className="text-sm">↗</span>
              <span>+12.5%</span>
            </div>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Tổng số User
            </p>
            <h3 className="text-3xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
              1,284,502
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <Award className="w-5 h-5 text-slate-900 dark:text-slate-100" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
              <span className="text-sm">↗</span>
              <span>+4.2%</span>
            </div>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Customer trả phí
            </p>
            <h3 className="text-3xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
              84,210
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <CreditCard className="w-5 h-5 text-slate-900 dark:text-slate-100" />
            </div>
            <div className="flex items-center gap-1 text-red-600 font-bold text-sm">
              <span className="text-sm">↘</span>
              <span>-1.8%</span>
            </div>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Doanh thu
            </p>
            <h3 className="text-3xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
              $4.2M
            </h3>
          </div>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* User Signups Chart */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-slate-100">
              Biểu đồ người dùng mới theo tháng
            </h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="w-3 h-3 rounded-full bg-emerald-700"></span>{" "}
              Người dùng mới
            </div>
          </div>

          <div className="relative h-64 w-full flex items-end justify-between px-2">
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
              <div className="border-b border-slate-200 dark:border-slate-700 w-full"></div>
              <div className="border-b border-slate-200 dark:border-slate-700 w-full"></div>
              <div className="border-b border-slate-200 dark:border-slate-700 w-full"></div>
              <div className="border-b border-slate-200 dark:border-slate-700 w-full"></div>
            </div>

            <svg
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0,200 Q100,180 200,120 T400,140 T600,60 T800,90"
                fill="none"
                stroke="#047857"
                strokeLinecap="round"
                strokeWidth="3"
              ></path>
              <path
                d="M0,200 Q100,180 200,120 T400,140 T600,60 T800,90 L800,256 L0,256 Z"
                fill="url(#gradient-green)"
                opacity="0.1"
              ></path>
              <defs>
                <linearGradient id="gradient-green" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#047857"></stop>
                  <stop offset="100%" stopColor="transparent"></stop>
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute left-[60%] top-[25%] group cursor-pointer">
              <div className="w-4 h-4 bg-emerald-700 border-2 border-white rounded-full shadow-lg"></div>
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-24 p-2 bg-slate-900 text-white text-[10px] rounded backdrop-blur-md z-10 text-center">
                <b>+14,203</b> người dùng trong T6
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-4 px-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter">
            <span>T1</span>
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span>T8</span>
          </div>
        </div>
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-slate-100">
              Biểu đồ doanh thu theo tháng
            </h3>
            <MoreHorizontal className="text-slate-400 dark:text-slate-500 w-5 h-5" />
          </div>

          <div className="h-64 flex items-end justify-between gap-3 pt-4">
            <div className="w-full flex flex-col items-center gap-2 group">
              <div className="w-full bg-slate-200 rounded-t-sm h-[40%] group-hover:bg-slate-900 transition-colors"></div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                T4
              </span>
            </div>
            <div className="w-full flex flex-col items-center gap-2 group">
              <div className="w-full bg-slate-200 rounded-t-sm h-[65%] group-hover:bg-slate-900 transition-colors"></div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                T5
              </span>
            </div>
            <div className="w-full flex flex-col items-center gap-2 group">
              <div className="w-full bg-slate-900 rounded-t-sm h-[90%] group-hover:bg-slate-900 transition-colors"></div>
              <span className="text-[9px] text-slate-900 dark:text-slate-100 font-bold">
                T6
              </span>
            </div>
            <div className="w-full flex flex-col items-center gap-2 group">
              <div className="w-full bg-slate-200 rounded-t-sm h-[55%] group-hover:bg-slate-900 transition-colors"></div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                T7
              </span>
            </div>
            <div className="w-full flex flex-col items-center gap-2 group">
              <div className="w-full bg-slate-200 rounded-t-sm h-[75%] group-hover:bg-slate-900 transition-colors"></div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                T8
              </span>
            </div>
            <div className="w-full flex flex-col items-center gap-2 group">
              <div className="w-full bg-slate-200 rounded-t-sm h-[82%] group-hover:bg-slate-900 transition-colors"></div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                T9
              </span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                ✓
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                Tháng có doanh thu cao nhất là tháng 6/2024.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              Chi tiết →
            </span>
          </div>
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
              onClick={() => router.push("/staff/financial-reports")}
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
              onClick={() => router.push("/staff/analysis-reports")}
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
