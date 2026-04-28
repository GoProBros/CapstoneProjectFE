"use client";

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendDisplay {
  icon: string;
  className: string;
  text: string;
}

interface MonthlyChartData {
  label: string;
  users: number;
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

interface UserDashboardSectionProps {
  totalUsers: number;
  paidCustomers: number;
  freeUsers: number;
  paidRatio: number;
  userTrend: TrendDisplay;
  userGrowthPercentTrend: TrendDisplay;
  userGrowthData: MonthlyChartData[];
  userDistributionData: UserDistributionPoint[];
  retentionRows: RetentionDisplayRow[];
  retentionTotalCustomers: number;
  isLoadingRetention: boolean;
  statisticsError: string | null;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

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
  fontSize: "12px",
  fontWeight: 600,
};

export default function UserDashboardSection({
  totalUsers,
  paidCustomers,
  freeUsers,
  paidRatio,
  userTrend,
  userGrowthPercentTrend,
  userGrowthData,
  userDistributionData,
  retentionRows,
  retentionTotalCustomers,
  isLoadingRetention,
  statisticsError,
}: UserDashboardSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="h-6 w-1 rounded-full bg-blue-500"></span>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Thống kê người dùng
        </h2>
      </div>

      {statisticsError && (
        <p className="px-2 text-sm text-red-600 dark:text-red-400">
          {statisticsError}
        </p>
      )}

      <div className="p-0">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12 xl:auto-rows-[minmax(120px,auto)]">
          <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-1 xl:col-span-3 xl:row-start-1 xl:row-span-1">
            <p className="text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Tổng người dùng
            </p>
            <p className="mt-3 text-center font-headline text-4xl font-black leading-none text-slate-900 dark:text-slate-100">
              {formatInteger(totalUsers)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-4 xl:col-span-3 xl:row-start-1 xl:row-span-1">
            <p className="text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Tỷ lệ người dùng mới theo tháng
            </p>
            <div
              className={`mt-4 text-center font-headline text-3xl font-black leading-none ${userTrend.className}`}
            >
              {userTrend.text}
            </div>
            <p className="mt-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
              So với tổng người dùng hiện tại:
              <span className={`ml-1 ${userGrowthPercentTrend.className}`}>
                {userGrowthPercentTrend.icon} {userGrowthPercentTrend.text}
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-7 xl:col-span-3 xl:row-start-1 xl:row-span-1">
            <p className="text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Số người dùng trả phí hiện tại
            </p>
            <p className="mt-3 text-center font-headline text-4xl font-black leading-none text-slate-900 dark:text-slate-100">
              {formatInteger(paidCustomers)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-1 xl:col-span-6 xl:row-start-2 xl:row-span-2 xl:flex xl:flex-col">
            <p className="mb-3 text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Biểu đồ người dùng mới trong 12 tháng gần nhất
            </p>
            <div className="h-64 w-full xl:h-full xl:min-h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={userGrowthData}
                  margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
                >
                  <XAxis
                    dataKey="label"
                    axisLine
                    tickLine
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine
                    tickLine
                    width={48}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(value: number) =>
                      formatCompactNumber(value)
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#2563eb"
                    color="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#2563eb" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatInteger(value),
                      "Người dùng mới",
                    ]}
                    labelFormatter={(label: string) => `Tháng ${label}`}
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-7 xl:col-span-3 xl:row-start-2 xl:row-span-2 xl:flex xl:flex-col">
            <p className="mb-3 text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Tỷ lệ người dùng
            </p>

            <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center">
              <PieChart width={220} height={220}>
                <Pie
                  data={userDistributionData}
                  dataKey="value"
                  innerRadius={52}
                  outerRadius={78}
                  stroke="none"
                >
                  {userDistributionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(
                    value: number,
                    _name: string,
                    item: { payload?: { name?: string } },
                  ) => {
                    const hoveredName = item.payload?.name?.toLowerCase() ?? "";
                    const userType = hoveredName.includes("miễn phí")
                      ? "Miễn phí"
                      : hoveredName.includes("trả phí")
                        ? "Trả phí"
                        : "Người dùng";

                    return [formatInteger(value), userType];
                  }}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
              </PieChart>
            </div>

            <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400"></span>
                  Người dùng miễn phí
                </span>
                <span>
                  {formatInteger(freeUsers)} ({(100 - paidRatio).toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                  Người dùng trả phí
                </span>
                <span>
                  {formatInteger(paidCustomers)} ({paidRatio.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 xl:col-start-10 xl:col-span-3 xl:row-start-1 xl:row-span-3 xl:flex xl:flex-col">
            <p className="mb-3 text-center text-[13px] font-bold text-slate-700 dark:text-slate-200">
              Mức độ giữ chân người dùng
            </p>

            <div className="overflow-y-auto xl:flex-1">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-300 text-[11px] uppercase tracking-wide text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    <th className="px-2 py-2">Số lần đăng ký</th>
                    <th className="px-2 py-2">Số lượng</th>
                    <th className="px-2 py-2">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingRetention && (
                    <tr className="border-b border-slate-200 text-sm dark:border-slate-700">
                      <td
                        colSpan={3}
                        className="px-2 py-3 text-center text-slate-500 dark:text-slate-400"
                      >
                        Đang tải dữ liệu giữ chân...
                      </td>
                    </tr>
                  )}

                  {!isLoadingRetention && retentionRows.length === 0 && (
                    <tr className="border-b border-slate-200 text-sm dark:border-slate-700">
                      <td
                        colSpan={3}
                        className="px-2 py-3 text-center text-slate-500 dark:text-slate-400"
                      >
                        Chưa có dữ liệu giữ chân người dùng
                      </td>
                    </tr>
                  )}

                  {!isLoadingRetention &&
                    retentionRows.map((row) => (
                      <tr
                        key={row.key}
                        className="border-b border-slate-200 text-sm dark:border-slate-700"
                      >
                        <td className="px-2 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          {row.label}
                        </td>
                        <td className="px-2 py-2.5 text-center text-slate-700 dark:text-slate-300">
                          {formatInteger(row.users)}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <span className="inline-flex rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {row.rate.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <p className="mb-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
              Tổng khách hàng: {formatInteger(retentionTotalCustomers)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
