"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface MonthlyChartData {
  label: string;
  newUsers: number;
  revenue: number;
}

interface RevenueChartProps {
  data: MonthlyChartData[];
  showDetailsAction?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function RevenueChart({
  data,
  showDetailsAction = true,
}: RevenueChartProps) {
  const router = useRouter();

  const totalRevenue = useMemo(
    () => data.reduce((total, item) => total + item.revenue, 0),
    [data]
  );

  const averageRevenue =
    data.length > 0 ? Math.round(totalRevenue / data.length) : 0;

  const topMonth = useMemo(() => {
    if (data.length === 0) {
      return null;
    }

    return data.reduce((currentMax, item) =>
      item.revenue > currentMax.revenue ? item : currentMax
    );
  }, [data]);

  const performanceRows = useMemo(() => {
    if (data.length === 0) {
      return [] as Array<{
        name: string;
        subscriptions: string;
        revenue: number;
        growth: number;
      }>;
    }

    return data
      .map((item, index) => {
        const previous = data[index - 1]?.revenue ?? item.revenue;
        const growth = previous > 0 ? (item.revenue * 100) / previous - 100 : 0;

        return {
          name: `Gói ${item.label}`,
          subscriptions: new Intl.NumberFormat("vi-VN").format(
            Math.max(120, Math.round(item.revenue / 1_800_000))
          ),
          revenue: item.revenue,
          growth,
        };
      })
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 3);
  }, [data]);

  const revenueRatioData = useMemo(() => {
    if (data.length === 0) {
      return [
        { name: "Q1", value: 1, fill: "#0f172a" },
        { name: "Q2", value: 0, fill: "#3b82f6" },
        { name: "Khác", value: 0, fill: "#e2e8f0" },
      ];
    }

    const groups = [0, 0, 0];
    data.forEach((item, index) => {
      groups[Math.min(2, Math.floor(index / 3))] += item.revenue;
    });

    return [
      { name: "Q1", value: Math.max(groups[0], 1), fill: "#0f172a" },
      { name: "Q2", value: Math.max(groups[1], 1), fill: "#3b82f6" },
      { name: "Khác", value: Math.max(groups[2], 1), fill: "#e2e8f0" },
    ];
  }, [data]);

  const maxRevenue = Math.max(...data.map((item) => item.revenue), 0);

  return (
    <section>
      <div className="mb-6 flex items-center gap-2">
        <span className="h-6 w-1 rounded-full bg-blue-500"></span>
        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Thống kê doanh thu
        </h3>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 grid grid-cols-1 gap-4 lg:col-span-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 text-[12px] uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
              Tổng doanh thu
            </p>
            <div className="flex items-end justify-between gap-3">
              <span className="font-headline text-[34px] font-black leading-none tracking-tight text-slate-900 dark:text-slate-100">
                {formatCompactCurrency(totalRevenue)}
              </span>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 text-[12px] uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
              Trung bình / tháng
            </p>
            <div className="flex items-end justify-between gap-3">
              <span className="font-headline text-[30px] font-black leading-none tracking-tight text-slate-900 dark:text-slate-100">
                {formatCompactCurrency(averageRevenue)}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {data.length} tháng
              </span>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 text-[12px] uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
              Mốc cao nhất
            </p>
            <div className="flex items-end justify-between gap-3">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {topMonth ? topMonth.label : "--"}
              </span>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                {topMonth ? formatCompactCurrency(topMonth.revenue) : "--"}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-12 rounded-[24px] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 lg:col-span-8">
          <h4 className="mb-6 text-[12px] font-bold uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
            Hiệu suất gói đăng ký
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-2 pb-3">Tên gói</th>
                  <th className="px-2 pb-3">Lượt đăng ký</th>
                  <th className="px-2 pb-3 text-right">Doanh thu</th>
                  <th className="px-2 pb-3 text-right">Tăng trưởng</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {performanceRows.length > 0 ? (
                  performanceRows.map((row) => (
                    <tr key={row.name} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="px-2 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        {row.name}
                      </td>
                      <td className="px-2 py-4 text-slate-700 dark:text-slate-300">{row.subscriptions}</td>
                      <td className="px-2 py-4 text-right font-medium text-slate-900 dark:text-slate-100">
                        {formatCompactCurrency(row.revenue)}
                      </td>
                      <td
                        className={`px-2 py-4 text-right font-bold ${
                          row.growth >= 0
                            ? "text-emerald-600 dark:text-emerald-300"
                            : "text-red-600 dark:text-red-300"
                        }`}
                      >
                        {row.growth >= 0 ? "+" : ""}
                        {row.growth.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-2 py-4 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      Chưa có dữ liệu doanh thu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-12 rounded-[24px] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 lg:col-span-8">
          <h4 className="mb-6 text-[12px] font-bold uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
            Biểu đồ doanh thu
          </h4>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <Bar
                  dataKey="revenue"
                  fill="#e2e8f0"
                  radius={[4, 4, 0, 0]}
                  activeBar={<Rectangle fill="#2563eb" />}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`${entry.label}-${index}`}
                      fill={entry.revenue === maxRevenue ? "#2563eb" : "#e2e8f0"}
                    />
                  ))}
                </Bar>
                <Tooltip
                  formatter={(value: number) => [formatCompactCurrency(value), "Doanh thu"]}
                  labelFormatter={(label: string) => `Tháng ${label}`}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {data.length > 0 ? (
              data.map((item) => <span key={item.label}>{item.label}</span>)
            ) : (
              <span>--</span>
            )}
          </div>
        </div>

        <div className="col-span-12 rounded-[24px] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 lg:col-span-4">
          <h4 className="mb-6 text-[12px] font-bold uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
            Doanh thu theo nhóm
          </h4>

          <div className="mx-auto mb-6 flex h-[200px] w-[200px] items-center justify-center">
            <PieChart width={200} height={200}>
              <Pie
                data={revenueRatioData}
                dataKey="value"
                innerRadius={50}
                outerRadius={70}
                stroke="none"
              >
                {revenueRatioData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [formatCompactCurrency(value), "Doanh thu"]} />
            </PieChart>
          </div>

          <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {revenueRatioData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  ></span>
                  {item.name}
                </span>
                <span>{formatCompactCurrency(item.value)}</span>
              </div>
            ))}
          </div>

          {showDetailsAction && (
            <button
              type="button"
              onClick={() => router.push("/SystemManager/revenue")}
              className="mt-6 text-xs font-bold text-blue-600 hover:underline dark:text-blue-300"
            >
              Xem chi tiết doanh thu →
            </button>
          )}
        </div>
      </div>

      {topMonth && (
        <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          Tháng có doanh thu cao nhất là {topMonth.label} ({formatCurrency(topMonth.revenue)}).
        </div>
      )}
    </section>
  );
}
