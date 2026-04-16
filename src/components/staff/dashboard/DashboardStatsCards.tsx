import { Users, Award, CreditCard } from "lucide-react";

interface TrendDisplay {
  icon: string;
  className: string;
  text: string;
}

interface DashboardStatsCardsProps {
  totalUsers: number;
  paidCustomers: number;
  totalRevenue: number;
  userTrend: TrendDisplay;
  paidTrend: TrendDisplay;
  revenueTrend: TrendDisplay;
  shouldShowStatisticsValue: boolean;
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

export default function DashboardStatsCards({
  totalUsers,
  paidCustomers,
  totalRevenue,
  userTrend,
  paidTrend,
  revenueTrend,
  shouldShowStatisticsValue,
}: DashboardStatsCardsProps) {
  const paidRatio =
    shouldShowStatisticsValue && totalUsers > 0
      ? ((paidCustomers * 100) / totalUsers).toFixed(1)
      : "--";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex justify-between items-start">
          <div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-700">
            <Users className="w-5 h-5 text-slate-900 dark:text-slate-100" />
          </div>
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${userTrend.className} bg-slate-100 dark:bg-slate-700/60`}
          >
            <span>{userTrend.icon}</span>
            <span>{userTrend.text}</span>
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-bold uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
            Tổng số người dùng
          </p>
          <h3 className="font-headline text-[40px] font-black leading-none tracking-tight text-slate-900 dark:text-slate-100">
            {shouldShowStatisticsValue ? formatInteger(totalUsers) : "--"}
          </h3>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex justify-between items-start">
          <div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-700">
            <Award className="w-5 h-5 text-slate-900 dark:text-slate-100" />
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
            {paidRatio !== "--" ? `${paidRatio}% tổng user` : "--"}
          </span>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-bold uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
            Khách hàng đang trả phí
          </p>
          <h3 className="font-headline text-[40px] font-black leading-none tracking-tight text-slate-900 dark:text-slate-100">
            {shouldShowStatisticsValue ? formatInteger(paidCustomers) : "--"}
          </h3>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex justify-between items-start">
          <div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-700">
            <CreditCard className="w-5 h-5 text-slate-900 dark:text-slate-100" />
          </div>
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${revenueTrend.className} bg-slate-100 dark:bg-slate-700/60`}
          >
            <span>{revenueTrend.icon}</span>
            <span>{revenueTrend.text}</span>
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-bold uppercase tracking-[1px] text-slate-500 dark:text-slate-400">
            Tổng doanh thu
          </p>
          <h3 className="font-headline text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-slate-100">
            {shouldShowStatisticsValue ? formatCurrency(totalRevenue) : "--"}
          </h3>
        </div>
      </div>
    </div>
  );
}
