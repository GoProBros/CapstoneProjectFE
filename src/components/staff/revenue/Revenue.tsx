import { TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import RevenueChart from "@/components/staff/dashboard/RevenueChart";

interface RevenueProps {
  activeUsers: number;
  totalRevenue: number;
  monthLabels: string[];
  revenueByMonth: number[];
  isLoading: boolean;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildMonthlyRevenueData(monthLabels: string[], revenueByMonth: number[]) {
  const chartDataLength = Math.max(monthLabels.length, revenueByMonth.length);

  return Array.from({ length: chartDataLength }, (_, index) => ({
    label: monthLabels[index] ?? `T${index + 1}`,
    newUsers: 0,
    revenue: revenueByMonth[index] ?? 0,
  }));
}

export default function Revenue({
  activeUsers,
  totalRevenue,
  monthLabels,
  revenueByMonth,
  isLoading,
}: RevenueProps) {
  const monthlyRevenueData = buildMonthlyRevenueData(monthLabels, revenueByMonth);

  const monthsWithRevenue = monthlyRevenueData.filter((item) => item.revenue > 0);
  const totalMonths = monthsWithRevenue.length;
  const averageRevenue =
    totalMonths > 0
      ? monthsWithRevenue.reduce((sum, item) => sum + item.revenue, 0) / totalMonths
      : 0;

  const latestRevenue = monthlyRevenueData.at(-1)?.revenue ?? 0;
  const previousRevenue = monthlyRevenueData.at(-2)?.revenue ?? 0;
  const revenueGrowth =
    previousRevenue > 0
      ? ((latestRevenue - previousRevenue) / previousRevenue) * 100
      : 0;
  const isRevenueGrowthPositive = revenueGrowth >= 0;

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg w-fit">
            <Wallet className="w-5 h-5 text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Tổng doanh thu
            </p>
            <h3 className="text-2xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
              {isLoading ? "--" : formatCurrency(totalRevenue)}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg w-fit">
            <Users className="w-5 h-5 text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Người dùng đang hoạt động
            </p>
            <h3 className="text-2xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
              {isLoading ? "--" : formatInteger(activeUsers)}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg w-fit">
              {isRevenueGrowthPositive ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            {!isLoading && (
              <span
                className={`text-sm font-bold ${
                  isRevenueGrowthPositive ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {`${isRevenueGrowthPositive ? "+" : ""}${revenueGrowth.toFixed(2)}%`}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Doanh thu trung bình / tháng
            </p>
            <h3 className="text-2xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
              {isLoading ? "--" : formatCurrency(averageRevenue)}
            </h3>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="h-72 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Đang tải dữ liệu doanh thu...
          </div>
        </div>
      ) : (
        <RevenueChart data={monthlyRevenueData} showDetailsAction={false} />
      )}
    </section>
  );
}
