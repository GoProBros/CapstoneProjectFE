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
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <Users className="w-5 h-5 text-slate-900 dark:text-slate-100" />
          </div>
          <div className={`flex items-center gap-1 font-bold text-sm ${userTrend.className}`}>
            <span className="text-sm">{userTrend.icon}</span>
            <span>{userTrend.text}</span>
          </div>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Tổng số người dùng
          </p>
          <h3 className="text-3xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
            {shouldShowStatisticsValue ? formatInteger(totalUsers) : "--"}
          </h3>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <Award className="w-5 h-5 text-slate-900 dark:text-slate-100" />
          </div>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Khách hàng đang trả phí
          </p>
          <h3 className="text-3xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
            {shouldShowStatisticsValue ? formatInteger(paidCustomers) : "--"}
          </h3>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <CreditCard className="w-5 h-5 text-slate-900 dark:text-slate-100" />
          </div>
          <div className={`flex items-center gap-1 font-bold text-sm ${revenueTrend.className}`}>
            <span className="text-sm">{revenueTrend.icon}</span>
            <span>{revenueTrend.text}</span>
          </div>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Tổng doanh thu
          </p>
          <h3 className="text-3xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
            {shouldShowStatisticsValue ? formatCurrency(totalRevenue) : "--"}
          </h3>
        </div>
      </div>
    </div>
  );
}
