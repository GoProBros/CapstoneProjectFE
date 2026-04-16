"use client";

import { useMemo } from "react";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface MonthlyChartData {
  label: string;
  newUsers: number;
  revenue: number;
}

interface NewUsersChartProps {
  data: MonthlyChartData[];
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

export default function NewUsersChart({ data }: NewUsersChartProps) {
  const router = useRouter();

  const totalNewUsers = useMemo(
    () => data.reduce((total, item) => total + item.newUsers, 0),
    [data]
  );

  const averageNewUsers =
    data.length > 0 ? Math.round(totalNewUsers / data.length) : 0;

  const latestMonth = data.at(-1);
  const previousMonth = data.at(-2);
  const latestGrowth =
    previousMonth && previousMonth.newUsers > 0
      ? ((latestMonth?.newUsers ?? 0) * 100) / previousMonth.newUsers - 100
      : 0;

  const peakMonth = useMemo(() => {
    if (data.length === 0) {
      return null;
    }

    return data.reduce((currentMax, item) =>
      item.newUsers > currentMax.newUsers ? item : currentMax
    );
  }, [data]);

  const distributionData = useMemo(() => {
    if (data.length <= 1) {
      return [
        { name: "Tăng", value: 1, fill: "#0f172a" },
        { name: "Giảm", value: 0, fill: "#3b82f6" },
        { name: "Ổn định", value: 0, fill: "#e2e8f0" },
      ];
    }

    let upCount = 0;
    let downCount = 0;
    let flatCount = 0;

    for (let index = 1; index < data.length; index += 1) {
      const diff = data[index].newUsers - data[index - 1].newUsers;
      if (diff > 0) {
        upCount += 1;
      } else if (diff < 0) {
        downCount += 1;
      } else {
        flatCount += 1;
      }
    }

    return [
      { name: "Tăng", value: Math.max(upCount, 1), fill: "#0f172a" },
      { name: "Giảm", value: Math.max(downCount, 1), fill: "#3b82f6" },
      { name: "Ổn định", value: Math.max(flatCount, 1), fill: "#e2e8f0" },
    ];
  }, [data]);

  const maxLineValue = Math.max(...data.map((item) => item.newUsers), 0);

  return (
    <section>
      <div className="mb-6 flex items-center gap-2">
        <span className="h-6 w-1 rounded-full bg-blue-500"></span>
        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Thống kê người dùng
        </h3>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 grid grid-cols-1 gap-4 lg:col-span-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 text-[12px] uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
              Tổng user mới
            </p>
            <div className="flex items-end justify-between gap-3">
              <span className="font-headline text-[40px] font-black leading-none tracking-tight text-slate-900 dark:text-slate-100">
                {formatInteger(totalNewUsers)}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-xs font-bold ${
                  latestGrowth >= 0
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                }`}
              >
                {latestGrowth >= 0 ? "+" : ""}
                {latestGrowth.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 text-[12px] uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
              Trung bình / tháng
            </p>
            <div className="flex items-end justify-between gap-3">
              <span className="font-headline text-[36px] font-black leading-none tracking-tight text-slate-900 dark:text-slate-100">
                {formatInteger(averageNewUsers)}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {data.length} tháng
              </span>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 text-[12px] uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
              Đỉnh tăng trưởng
            </p>
            <div className="flex items-end justify-between gap-3">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {peakMonth ? peakMonth.label : "--"}
              </span>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                {peakMonth ? formatInteger(peakMonth.newUsers) : "--"}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-12 rounded-[24px] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 lg:col-span-5">
          <div className="mb-4 flex items-start justify-between">
            <h4 className="text-[12px] font-bold uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
              Biểu đồ người dùng mới theo tháng
            </h4>
            <MoreHorizontal className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={false}
                />
                <Tooltip
                  formatter={(value: number) => [formatInteger(value), "Người dùng mới"]}
                  labelFormatter={(label: string) => `Tháng ${label}`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {data.length > 0 ? (
              data.map((item) => <span key={item.label}>{item.label}</span>)
            ) : (
              <span>--</span>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
            Đỉnh dữ liệu mới: {formatCompactNumber(maxLineValue)} người dùng trong 1 tháng.
          </div>
        </div>

        <div className="col-span-12 rounded-[24px] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 lg:col-span-3">
          <h4 className="mb-6 text-[12px] font-bold uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
            Tỉ lệ xu hướng
          </h4>

          <div className="mx-auto mb-6 flex h-[180px] w-[180px] items-center justify-center">
            <PieChart width={180} height={180}>
              <Pie
                data={distributionData}
                dataKey="value"
                innerRadius={42}
                outerRadius={62}
                stroke="none"
              >
                {distributionData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, "Số tháng"]} />
            </PieChart>
          </div>

          <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {distributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  ></span>
                  {item.name}
                </span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => router.push("/SystemManager/users")}
            className="mt-6 text-xs font-bold text-blue-600 hover:underline dark:text-blue-300"
          >
            Xem chi tiết người dùng →
          </button>
        </div>
      </div>
    </section>
  );
}
