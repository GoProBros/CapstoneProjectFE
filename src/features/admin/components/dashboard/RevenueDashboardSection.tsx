"use client";

import {
  Cell,
  Pie,
  PieChart,
  Bar,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  VipCurrentUserCountDto,
  VipPackageUsageDto,
} from "@/types/subscription";

interface TrendDisplay {
  icon: string;
  className: string;
  text: string;
}

interface MonthlyChartData {
  label: string;
  revenue: number;
  growthPercentage: number;
}

interface RevenueDashboardSectionProps {
  totalRevenue: number;
  revenuePerUser: number;
  revenueTrend: TrendDisplay;
  topPackageName: string;
  topPackageRevenue: number;
  monthlyRevenueData: MonthlyChartData[];
  packageRevenueData: {
    name: string;
    revenue: number;
    percentage: number;
  }[];
  vipPackageUsages: VipPackageUsageDto[];
  currentUsersByVipLevel: VipCurrentUserCountDto[];
  statisticsError: string | null;
}

const pieColors = [
  "#0ea5e9",
  "#2563eb",
  "#14b8a6",
  "#22c55e",
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#8b5cf6",
];

const tooltipContentStyle = {
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
};

const tooltipLabelStyle = {
  color: "#0f172a",
  fontSize: "12px",
  fontWeight: 700,
};

const tooltipItemStyle = {
  color: "#334155",
  fontSize: "12px",
  fontWeight: 600,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RevenueDashboardSection({
  totalRevenue,
  revenuePerUser,
  revenueTrend,
  topPackageName,
  topPackageRevenue,
  monthlyRevenueData,
  packageRevenueData,
  vipPackageUsages,
  currentUsersByVipLevel,
  statisticsError,
}: RevenueDashboardSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="h-6 w-1 rounded-full bg-blue-500"></span>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Thống kê doanh thu
        </h2>
      </div>

      {statisticsError && (
        <p className="px-2 text-sm text-red-600 dark:text-red-400">
          {statisticsError}
        </p>
      )}

      <div className="p-0">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12 xl:auto-rows-[minmax(100px,auto)]">
          {/* Tổng doanh thu */}
          <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-1 xl:col-span-3 xl:row-start-1 xl:row-span-1">
            <p className="text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Tổng doanh thu
            </p>
            <p className="mt-3 text-center font-headline text-2xl font-black leading-tight text-slate-900 dark:text-slate-100">
              {formatCurrency(totalRevenue)}
            </p>
   
          </div>
          {/* Doanh thu / người dùng */}
          <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-1 xl:col-span-3 xl:row-start-2 xl:row-span-1">
            <p className="text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Doanh thu / người dùng
            </p>
            <p className="mt-5 text-center font-headline text-2xl font-black leading-none text-slate-900 dark:text-slate-100">
              {revenuePerUser > 0 ? formatCurrency(revenuePerUser) : "--"}
            </p>
          </div>
          {/* Gói có doanh thu cao nhất */}
          <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-1 xl:col-span-3 xl:row-start-3 xl:row-span-1">
            <p className="text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Gói có doanh thu cao nhất
            </p>
            <p className="mt-4 text-center text-xl font-bold text-slate-900 dark:text-slate-100">
              {topPackageName || "--"}
            </p>
            <p className="mt-2 text-center text-md font-semibold text-blue-600 dark:text-blue-300">
              {topPackageRevenue > 0 ? formatCurrency(topPackageRevenue) : "--"}
            </p>
          </div>
          {/* Biểu đồ doanh thu trong 12 tháng */}
          <div className="min-w-0 rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-4 xl:col-span-9 xl:row-start-1 xl:row-span-3 xl:flex xl:flex-col">
            <p className="mb-3 text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Biểu đồ doanh thu trong 12 tháng
            </p>
            <div className="h-[260px] w-full md:h-[300px] xl:h-full xl:min-h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyRevenueData}
                  margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
                >
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={16}
                  />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value: number) =>
                      `${Math.round(value / 1_000)}k VND`
                    }
                    tick={{ fontSize: 11 }}
                    width={54}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value: number) => `${value}%`}
                    tick={{ fontSize: 11 }}
                     width={44}
                  />
                  <Bar
                    yAxisId="left"
                    name="Doanh thu"
                    dataKey="revenue"
                    fill="#2563eb"
                    barSize={16}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    name="Tỷ lệ tăng trưởng"
                    type="monotone"
                    dataKey="growthPercentage"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                  />
                  <Tooltip
                    formatter={(
                      value: number,
                      _name: string,
                      item: {
                        dataKey?:
                          | string
                          | number
                          | ((payload: unknown) => unknown);
                      },
                    ) => {
                      if (item.dataKey === "growthPercentage") {
                        return [`${value.toFixed(2)}%`, "Tỷ lệ tăng trưởng"];
                      }

                      return [formatCurrency(value), "Doanh thu"];
                    }}
                    labelFormatter={(label: string) => `Tháng ${label}`}
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Thống kê hiệu suất gói đăng ký */}
          <div className="min-w-0 rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-1 xl:col-span-6 xl:row-start-4 xl:row-span-2 xl:flex xl:flex-col">
            <p className="mb-3 text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Thống kê hiệu suất gói đăng ký
            </p>
            <div className="overflow-x-auto xl:flex-1 xl:overflow-y-auto">
              <table className="w-full min-w-[360px] text-center lg:min-w-[360px]">
                <thead>
                  <tr className="border-b border-slate-300 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    <th className="px-2 py-2">Gói</th>
                    <th className="px-2 py-2">Lượt đăng ký</th>
                    <th className="px-2 py-2">Người dùng</th>
                    <th className="px-2 py-2 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {vipPackageUsages.length === 0 && (
                    <tr className="border-b border-slate-200 text-sm dark:border-slate-700">
                      <td
                        colSpan={4}
                        className="px-2 py-3 text-center text-slate-500 dark:text-slate-400"
                      >
                        Chưa có dữ liệu gói đăng ký
                      </td>
                    </tr>
                  )}

                  {vipPackageUsages.map((item) => (
                    <tr
                      key={`usage-${item.subscriptionId}`}
                      className="border-b border-slate-200 text-center text-sm dark:border-slate-700"
                    >
                      <td className="px-2 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        {item.levelDisplayName}
                      </td>
                      <td className="px-2 py-2.5 text-slate-700 dark:text-slate-300">
                        {new Intl.NumberFormat("vi-VN").format(
                          item.registrationCount,
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-slate-700 dark:text-slate-300">
                        {new Intl.NumberFormat("vi-VN").format(
                          item.uniqueUserCount,
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Doanh thu theo gói đăng ký */}
          <div className="min-w-0 rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-7 xl:col-span-3 xl:row-start-4 xl:row-span-2 xl:flex xl:flex-col">
            <p className="mb-3 text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Doanh thu theo gói đăng ký
            </p>

            <div className="flex h-[360px] w-full items-center justify-center md:h-[300px] xl:h-auto xl:min-h-[240px]">
              <PieChart width={220} height={240}>
                <Pie
                  data={packageRevenueData}
                  dataKey="revenue"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={86}
                  stroke="none"
                  labelLine={false}
                  label={({ value }) => {
                    const found = packageRevenueData.find(
                      (item) => item.revenue === value,
                    );
                    return found ? `${found.percentage.toFixed(1)}%` : "";
                  }}
                >
                  {packageRevenueData.map((item, index) => (
                    <Cell
                      key={`pie-${item.name}`}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(
                    value: number,
                    _name: string,
                    item: { payload?: { name?: string; percentage?: number } },
                  ) => {
                    const packageName = item.payload?.name ?? "Gói";
                    const percent = item.payload?.percentage ?? 0;
                    return [
                      `${formatCurrency(value)} (${percent.toFixed(1)}%)`,
                      packageName,
                    ];
                  }}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
              </PieChart>
            </div>
          </div>
          {/* Người dùng trả phí hiện tại của từng gói */}
          <div className="min-w-0 rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-10 xl:col-span-3 xl:row-start-4 xl:row-span-2 xl:flex xl:flex-col">
            <p className="mb-3 text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Người dùng trả phí hiện tại của từng gói
            </p>

            <div className="overflow-x-auto xl:flex-1 xl:overflow-y-auto">
              <table className="w-full min-w-[160px] text-center">
                <thead>
                  <tr className="border-b border-slate-300 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    <th className="px-2 py-2">Gói</th>
                    <th className="px-2 py-2 text-right">Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsersByVipLevel.length === 0 && (
                    <tr className="border-b border-slate-200 text-sm dark:border-slate-700">
                      <td
                        colSpan={2}
                        className="px-2 py-3 text-center text-slate-500 dark:text-slate-400"
                      >
                        Chưa có dữ liệu user theo gói
                      </td>
                    </tr>
                  )}

                  {currentUsersByVipLevel.map((item) => (
                    <tr
                      key={`current-${item.subscriptionId}`}
                      className="border-b border-slate-200 text-sm dark:border-slate-700"
                    >
                      <td className="px-2 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        {item.levelDisplayName}
                      </td>
                      <td className="px-2 py-2.5 text-right pr-4 font-semibold text-blue-700 dark:text-blue-300">
                        {new Intl.NumberFormat("vi-VN").format(item.userCount)}
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
