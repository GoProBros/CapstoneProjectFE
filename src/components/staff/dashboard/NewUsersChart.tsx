import { useMemo } from "react";
import { useRouter } from "next/navigation";

interface MonthlyChartData {
  label: string;
  newUsers: number;
  revenue: number;
}

interface NewUsersChartProps {
  data: MonthlyChartData[];
}

function formatMonthLabel(label: string) {
  return label;
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

function buildLineChartPath(values: number[]) {
  if (values.length === 0) {
    return {
      linePath: "",
      areaPath: "",
      points: [] as Array<{ x: number; y: number; value: number; index: number }>,
      width: 800,
      height: 256,
      maxValue: 0,
    };
  }

  const width = 800;
  const height = 256;
  const topPadding = 24;
  const bottomPadding = 32;
  const maxValue = Math.max(...values, 1);

  const points = values.map((value, index) => {
    const x =
      values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y =
      height -
      bottomPadding -
      (value / maxValue) * (height - topPadding - bottomPadding);

    return { x, y, value, index };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return { linePath, areaPath, points, width, height, maxValue };
}

export default function NewUsersChart({ data }: NewUsersChartProps) {
  const router = useRouter();
  const { linePath, areaPath, points, width, height, maxValue } = useMemo(
    () => buildLineChartPath(data.map((item) => item.newUsers)),
    [data]
  );

  const yAxisTicks = useMemo(() => {
    const safeMax = Math.max(maxValue, 1);

    return [1, 0.75, 0.5, 0.25, 0].map((ratio) =>
      Math.round(safeMax * ratio)
    );
  }, [maxValue]);

  return (
    <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-slate-100">
          Biểu đồ người dùng mới theo tháng
        </h3>
        <button
          type="button"
          onClick={() => router.push("/SystemManager/users")}
          className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
        >
          Chi tiết →
        </button>
      </div>

      <div className="flex gap-3">
        <div className="h-64 w-12 flex flex-col justify-between py-2 text-[10px] text-slate-500 dark:text-slate-400 text-right">
          {yAxisTicks.map((tick, index) => (
            <span key={`new-users-y-${index}`}>{formatCompactNumber(tick)}</span>
          ))}
        </div>

        <div className="relative h-64 flex-1">
          <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
            <div className="border-b border-slate-200 dark:border-slate-700 w-full"></div>
            <div className="border-b border-slate-200 dark:border-slate-700 w-full"></div>
            <div className="border-b border-slate-200 dark:border-slate-700 w-full"></div>
            <div className="border-b border-slate-200 dark:border-slate-700 w-full"></div>
          </div>

          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            {linePath && (
              <>
                <path
                  d={linePath}
                  fill="none"
                  stroke="#047857"
                  strokeLinecap="round"
                  strokeWidth="3"
                ></path>
                <path d={areaPath} fill="url(#gradient-green-new-users)" opacity="0.1"></path>
              </>
            )}
            <defs>
              <linearGradient
                id="gradient-green-new-users"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#047857"></stop>
                <stop offset="100%" stopColor="transparent"></stop>
              </linearGradient>
            </defs>
          </svg>

          {points.map((point) => {
            const item = data[point.index];

            return (
              <div
                key={`user-point-${item.label}-${point.index}`}
                className="absolute group cursor-pointer"
                style={{
                  left: `${(point.x / width) * 100}%`,
                  top: `${(point.y / height) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="w-3 h-3 bg-emerald-700 border-2 border-white rounded-full shadow-lg"></div>
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-28 p-2 bg-slate-900 text-white text-[10px] rounded backdrop-blur-md z-10 text-center whitespace-nowrap">
                  <b>+{formatInteger(point.value)}</b> người dùng trong {formatMonthLabel(item.label)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 ml-[60px]">
        <div className="relative h-4 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter">
          {points.length > 0 ? (
            points.map((point, index) => {
              const item = data[index];
              if (!item) return null;

              return (
                <span
                  key={`new-user-${item.label}`}
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
    </div>
  );
}
