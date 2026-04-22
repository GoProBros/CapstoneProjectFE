"use client";

import {
  Database,
  Layers,
  Link2,
  ListTree,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import type { AnalysisReport } from "@/types/analysisReport";
import { CommonStatus } from "@/types/file";
import {
  FinancialReportStatus,
  type FinancialReport,
} from "@/types/financialReport";
import type { DataFetchTaskType } from "@/types/systemData";
import type { InterestedSymbolCountDto } from "@/types/subscription";

type TaskStatus = "idle" | "loading" | "success" | "failed";

interface SystemDashboardSectionProps {
  isAdmin: boolean;
  onRunDataFetchTask: (taskId: DataFetchTaskType) => Promise<void>;
  dataFetchTaskStatusMap: Record<DataFetchTaskType, TaskStatus>;
  onNavigateDataLogs: () => void;
  onNavigateFinancialReports: () => void;
  onNavigateAnalysisReports: () => void;
  totalStocks: number;
  topInterestedSymbols: InterestedSymbolCountDto[];
  isLoadingSystemStatistics: boolean;
  systemStatisticsError: string | null;
  systemLogs: string[];
  isLoadingSystemLogs: boolean;
  systemLogsError: string | null;
  financialReports: FinancialReport[];
  isLoadingFinancial: boolean;
  financialError: string | null;
  analysisReports: AnalysisReport[];
  analysisCategories: Record<string, string>;
  isLoadingAnalysis: boolean;
  analysisError: string | null;
}

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
    case FinancialReportStatus.Pending:
      return "Chờ xử lý";
    case FinancialReportStatus.Processing:
      return "Đang xử lý";
    case FinancialReportStatus.Completed:
      return "Hoàn thành";
    case FinancialReportStatus.Failed:
      return "Thất bại";
    case FinancialReportStatus.Archived:
      return "Lưu trữ";
    default:
      return "Không xác định";
  }
}

function getFinancialStatusClass(status: FinancialReportStatus) {
  switch (status) {
    case FinancialReportStatus.Pending:
      return "bg-amber-100 text-amber-800";
    case FinancialReportStatus.Processing:
      return "bg-sky-100 text-sky-800";
    case FinancialReportStatus.Completed:
      return "bg-emerald-100 text-emerald-800";
    case FinancialReportStatus.Failed:
      return "bg-red-100 text-red-800";
    case FinancialReportStatus.Archived:
      return "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200";
    default:
      return "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

const dataFetchTaskButtons: {
  id: DataFetchTaskType;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "import-sectors", label: "Lấy danh sách ngành", icon: Layers },
  { id: "import-symbols", label: "Lấy mã chứng khoán", icon: Database },
  { id: "map-symbols-sectors", label: "Nối mã CK vào ngành", icon: Link2 },
  {
    id: "import-index-constituents",
    label: "Lấy index & constituents",
    icon: ListTree,
  },
];

function getDataTaskButtonClass(status: TaskStatus) {
  if (status === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
  }

  if (status === "failed") {
    return "border-red-200 bg-red-50 text-red-700 hover:bg-red-100";
  }

  if (status === "loading") {
    return "border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed";
  }

  return "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
}

export default function SystemDashboardSection({
  isAdmin,
  onRunDataFetchTask,
  dataFetchTaskStatusMap,
  onNavigateDataLogs,
  onNavigateFinancialReports,
  onNavigateAnalysisReports,
  totalStocks,
  topInterestedSymbols,
  isLoadingSystemStatistics,
  systemStatisticsError,
  systemLogs,
  isLoadingSystemLogs,
  systemLogsError,
  financialReports,
  isLoadingFinancial,
  financialError,
  analysisReports,
  analysisCategories,
  isLoadingAnalysis,
  analysisError,
}: SystemDashboardSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="h-6 w-1 rounded-full bg-blue-500"></span>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Thống kê hệ thống
        </h2>
      </div>

      <div className="p-0">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12 xl:auto-rows-[minmax(100px,auto)]">
          {/* Mã chứng khoán trong hệ thống */}
          <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-1 xl:col-span-4 xl:row-start-1 xl:row-span-3">
            <p className="text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Mã chứng khoán trong hệ thống
            </p>
            <div className="mt-3 rounded-lg border border-slate-300 bg-white p-4 text-center dark:border-slate-600 dark:bg-slate-800">
              <p className="font-headline text-4xl font-black text-blue-700 dark:text-blue-300">
                {isLoadingSystemStatistics ? "--" : formatNumber(totalStocks)}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Mã chứng khoán có dữ liệu
              </p>
            </div>

            {systemStatisticsError && (
              <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400">
                {systemStatisticsError}
              </p>
            )}

            {isAdmin && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {dataFetchTaskButtons.map((task) => {
                  const status = dataFetchTaskStatusMap[task.id];
                  const isLoading = status === "loading";
                  const TaskIcon = task.icon;

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => {
                        void onRunDataFetchTask(task.id);
                      }}
                      disabled={isLoading}
                      className={`h-11 rounded-lg border px-3 text-xs font-bold transition-colors ${getDataTaskButtonClass(
                        status,
                      )}`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {isLoading ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <TaskIcon className="h-3.5 w-3.5" />
                        )}
                        <span>{isLoading ? "Đang fetch..." : task.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {!isAdmin && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onNavigateFinancialReports}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                >
                  BCTC gần đây
                </button>
                <button
                  type="button"
                  onClick={onNavigateAnalysisReports}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                >
                  Báo cáo phân tích
                </button>
              </div>
            )}
          </div>
          {/* Top mã CK quan tâm */}
          <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-5 xl:col-span-3 xl:row-start-1 xl:row-span-3 xl:flex xl:flex-col">
            <p className="text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Top mã CK quan tâm
            </p>

            <div className="mt-3 overflow-x-auto xl:flex-1 xl:overflow-y-auto">
              <table className="w-full min-w-[260px] text-center">
                <thead>
                  <tr className="border-b border-slate-300 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    <th className="px-2 py-2">Mã CK</th>
                    <th className="px-2 py-2 text-right">Lượt quan tâm</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingSystemStatistics && (
                    <tr className="border-b border-slate-200 text-sm dark:border-slate-700">
                      <td
                        colSpan={2}
                        className="px-2 py-3 text-center text-slate-500 dark:text-slate-400"
                      >
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  )}

                  {!isLoadingSystemStatistics &&
                    topInterestedSymbols.length === 0 && (
                      <tr className="border-b border-slate-200 text-sm dark:border-slate-700">
                        <td
                          colSpan={2}
                          className="px-2 py-3 text-center text-slate-500 dark:text-slate-400"
                        >
                          Chưa có dữ liệu mã quan tâm
                        </td>
                      </tr>
                    )}

                  {!isLoadingSystemStatistics &&
                    topInterestedSymbols.map((item) => (
                      <tr
                        key={item.symbol}
                        className="border-b border-slate-200 text-sm dark:border-slate-700"
                      >
                        <td className="px-2 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                          {item.symbol}
                        </td>
                        <td className="px-2 py-2.5 text-right pr-4 font-semibold text-blue-700 dark:text-blue-300">
                          {formatNumber(item.count)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Nhật ký hệ thống */}
          <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-8 xl:col-span-5 xl:row-start-1 xl:row-span-3 xl:flex xl:flex-col">
            <p className="text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Nhật ký hệ thống
            </p>

            <div className="mt-3 h-[240px] rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-800 xl:h-auto xl:flex-1 xl:overflow-y-auto">
              {isLoadingSystemLogs && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Đang tải dữ liệu nhật ký...
                </p>
              )}

              {!isLoadingSystemLogs && systemLogsError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {systemLogsError}
                </p>
              )}

              {!isLoadingSystemLogs && !systemLogsError && systemLogs.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Chưa có dữ liệu nhật ký hệ thống.
                </p>
              )}

              {!isLoadingSystemLogs && !systemLogsError && systemLogs.length > 0 && (
                <>
                  <div className="space-y-2 h-[240px] overflow-y-auto rounded-lg ">
                    {systemLogs.map((log, index) => (
                      <p
                        key={`${log}-${index}`}
                        className="border-b border-slate-200 pb-2 text-sm text-slate-700 last:border-0 last:pb-0 dark:border-slate-700 dark:text-slate-300"
                      >
                        {log}
                      </p>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={onNavigateDataLogs}
                    className="mt-3 w-full rounded-lg border border-blue-200 bg-blue-600 px-3 py-2 text-xs font-bold text-slate-50 transition-colors hover:bg-blue-800"
                  >
                    Xem thêm nhật ký
                  </button>
                </>
              )}
            </div>
          </div>
          {/* Báo cáo tài chính gần đây */}
          <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-1 xl:col-span-6 xl:row-start-4 xl:row-span-3 xl:flex xl:flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                Báo cáo tài chính gần đây
              </h3>
              <button
                type="button"
                onClick={onNavigateFinancialReports}
                className="text-[11px] font-bold uppercase tracking-wide text-slate-900 dark:text-slate-100"
              >
                Xem tất cả
              </button>
            </div>

            <div className="overflow-x-auto xl:flex-1 xl:overflow-y-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-700/40">
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Tên báo cáo
                    </th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Mã CK
                    </th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Trạng thái
                    </th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Cập nhật
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {isLoadingFinancial && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400"
                      >
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  )}

                  {!isLoadingFinancial && financialError && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-4 text-center text-sm text-red-600 dark:text-red-400"
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
                          className="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400"
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
                        className="hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                      >
                        <td className="px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {getFinancialPeriodLabel(report.year, report.period)}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300">
                          {report.ticker || "--"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex min-w-[92px] justify-center rounded-full px-2 py-1 text-[10px] font-bold ${getFinancialStatusClass(
                              report.status,
                            )}`}
                          >
                            {getFinancialStatusLabel(report.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(report.updatedAt || report.createdAt)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Báo cáo phân tích gần đây */}
          <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-7 xl:col-span-6 xl:row-start-4 xl:row-span-3 xl:flex xl:flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                Báo cáo phân tích gần đây
              </h3>
              <button
                type="button"
                onClick={onNavigateAnalysisReports}
                className="text-[11px] font-bold uppercase tracking-wide text-slate-900 dark:text-slate-100"
              >
                Xem tất cả
              </button>
            </div>

            <div className="overflow-x-auto xl:flex-1 xl:overflow-y-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-700/40">
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Tiêu đề
                    </th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Phân loại
                    </th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {isLoadingAnalysis && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400"
                      >
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  )}

                  {!isLoadingAnalysis && analysisError && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-4 text-center text-sm text-red-600 dark:text-red-400"
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
                          colSpan={3}
                          className="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400"
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
                        className="hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                      >
                        <td className="px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {report.title}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300">
                          {analysisCategories[report.categoryId] ||
                            report.categoryId ||
                            "--"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex min-w-[92px] justify-center rounded-full px-2 py-1 text-[10px] font-bold ${getStatusClass(
                              report.status,
                            )}`}
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
    </section>
  );
}
