"use client";

import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

interface MonthlyChartData {
  label: string;
  newUsers: number;
  revenue: number;
}

interface RevenueChartProps {
  data: MonthlyChartData[];
  showDetailsAction?: boolean;
}

function formatMonthLabel(label: string) {
  return label;
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

function buildRevenueLinePath(values: number[]) {
  if (values.length === 0) {
    return {
      linePath: "",
      points: [] as Array<{ x: number; y: number }>,
      width: 1000,
      height: 256,
    };
  }

  const width = 1000;
  const height = 256;
  const topPadding = 16;
  const bottomPadding = 12;
  const maxValue = Math.max(...values, 1);

  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y =
      height -
      bottomPadding -
      (value / maxValue) * (height - topPadding - bottomPadding);

    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  return { linePath, points, width, height };
}

export default function RevenueChart({
  data,
  showDetailsAction = true,
}: RevenueChartProps) {
  const router = useRouter();
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 0);
  const { linePath, points, width, height } = buildRevenueLinePath(
    data.map((item) => item.revenue)
  );

  const maxRevenueIndex =
    data.length > 0
      ? data.reduce(
          (maxIndex, item, index, arr) =>
            item.revenue > arr[maxIndex].revenue ? index : maxIndex,
          0
        )
      : -1;

  const highestRevenueMonth = maxRevenueIndex >= 0 ? data[maxRevenueIndex] : null;

  const yAxisTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) =>
    Math.round(maxRevenue * ratio)
  );

  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-slate-100">
          Biểu đồ doanh thu theo tháng
        </h3>
        <MoreHorizontal className="text-slate-400 dark:text-slate-500 w-5 h-5" />
      </div>

      <div className="flex gap-3">
        <div className="h-64 w-16 flex flex-col justify-between py-2 text-[10px] text-slate-500 dark:text-slate-400 text-right">
          {yAxisTicks.map((tick, index) => (
            <span key={`revenue-y-${index}`}>{formatCompactCurrency(tick)}</span>
          ))}
        </div>

        <div className="h-64 flex-1 flex items-end justify-between gap-3 pt-4 relative">
          <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
            <div className="border-b border-slate-200 dark:border-slate-700 w-full"></div>
            <div className="border-b border-slate-200 dark:border-slate-700 w-full"></div>
            <div className="border-b border-slate-200 dark:border-slate-700 w-full"></div>
            <div className="border-b border-slate-200 dark:border-slate-700 w-full"></div>
          </div>

          {linePath && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-30"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
            >
              <path
                d={linePath}
                fill="none"
                stroke="#047857"
                strokeLinecap="round"
                strokeWidth="2.5"
              ></path>
            </svg>
          )}

          {points.map((point, index) => {
            const item = data[index];
            if (!item) return null;

            return (
              <div
                key={`revenue-point-trigger-${index}`}
                className="absolute z-40 group"
                style={{
                  left: `${(point.x / width) * 100}%`,
                  top: `${(point.y / height) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="w-3 h-3 rounded-full bg-emerald-700 border-2 border-white shadow cursor-pointer"></div>
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-28 p-2 bg-slate-900 text-white text-[10px] rounded text-center whitespace-nowrap z-50">
                  <b>{formatMonthLabel(item.label)}</b>: {formatCurrency(item.revenue)}
                </div>
              </div>
            );
          })}

          {data.length > 0 ? (
            data.map((item, index) => {
              const barHeightPercent =
                maxRevenue > 0
                  ? Math.max(12, Math.round((item.revenue / maxRevenue) * 100))
                  : 12;
              const isTopMonth = index === maxRevenueIndex;

              return (
                <div
                  key={`revenue-${item.label}`}
                  className="w-full flex flex-col items-center gap-2 group relative z-20"
                >
                  <div
                    className={`w-full rounded-t-sm transition-colors ${
                      isTopMonth
                        ? "bg-slate-900 group-hover:bg-slate-900"
                        : "bg-slate-200 group-hover:bg-slate-900"
                    }`}
                    style={{ height: `${barHeightPercent}%` }}
                  ></div>
                  <span className="text-[9px] opacity-0 select-none">.</span>
                </div>
              );
            })
          ) : (
            <div className="w-full text-center text-xs text-slate-500 dark:text-slate-400">
              Chưa có dữ liệu doanh thu theo tháng
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 ml-[76px]">
        <div className="relative h-4 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter">
          {points.length > 0 ? (
            points.map((point, index) => {
              const item = data[index];
              if (!item) return null;

              return (
                <span
                  key={`revenue-label-${item.label}`}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${(point.x / width) * 100}%` }}
                >
                  {formatMonthLabel(item.label)}
                </span>
              );
            })
          ) : (
            <span>--</span>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
            ✓
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            {highestRevenueMonth
              ? `Tháng có doanh thu cao nhất là ${formatMonthLabel(
                  highestRevenueMonth.label
                )} (${formatCurrency(highestRevenueMonth.revenue)}).`
              : "Chưa có dữ liệu doanh thu theo tháng."}
          </p>
        </div>
        {showDetailsAction && (
          <button
            type="button"
            onClick={() => router.push("/SystemManager/revenue")}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline whitespace-nowrap"
          >
            Chi tiết →
          </button>
        )}
      </div>
    </div>
  );
}
