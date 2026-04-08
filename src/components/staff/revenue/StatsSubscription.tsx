import { Crown, DollarSign, Users } from "lucide-react";
import type {
  VipCurrentUserCountDto,
  VipPackageUsageDto,
} from "@/types/subscription";

interface StatsSubscriptionProps {
  activeUsers: number;
  currentUsersByVipLevel: VipCurrentUserCountDto[];
  vipPackageUsages: VipPackageUsageDto[];
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

export default function StatsSubscription({
  activeUsers,
  currentUsersByVipLevel,
  vipPackageUsages,
  isLoading,
}: StatsSubscriptionProps) {
  const sortedCurrentUsers = [...currentUsersByVipLevel].sort((left, right) => {
    if (right.userCount !== left.userCount) {
      return right.userCount - left.userCount;
    }

    return left.levelOrder - right.levelOrder;
  });

  const sortedVipUsage = [...vipPackageUsages].sort(
    (left, right) => right.totalRevenue - left.totalRevenue
  );

  const totalCurrentVipUsers = sortedCurrentUsers.reduce(
    (sum, item) => sum + item.userCount,
    0
  );

  const vipAdoptionRate =
    activeUsers > 0 ? (totalCurrentVipUsers * 100) / activeUsers : 0;

  const totalVipRevenue = sortedVipUsage.reduce(
    (sum, item) => sum + item.totalRevenue,
    0
  );

  const topVipPackage = sortedVipUsage[0];

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg w-fit">
            <Users className="w-5 h-5 text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Người dùng VIP hiện tại
            </p>
            <h3 className="text-2xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
              {isLoading ? "--" : formatInteger(totalCurrentVipUsers)}
            </h3>
            {!isLoading && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {`Chiếm ${vipAdoptionRate.toFixed(2)}% người dùng hoạt động`}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg w-fit">
            <DollarSign className="w-5 h-5 text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Doanh thu từ các gói đăng ký
            </p>
            <h3 className="text-2xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
              {isLoading ? "--" : formatCurrency(totalVipRevenue)}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg w-fit">
            <Crown className="w-5 h-5 text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Gói tạo doanh thu cao nhất
            </p>
            <h3 className="text-2xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
              {isLoading
                ? "--"
                : (topVipPackage?.levelDisplayName ??
                  topVipPackage?.subscriptionName ??
                  "--")}
            </h3>
            {!isLoading && topVipPackage && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {formatCurrency(topVipPackage.totalRevenue)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 bg-slate-100 dark:bg-slate-700 p-6 rounded-xl h-[300px] flex flex-col">
          <h5 className="font-bold font-headline mb-4 text-slate-900 dark:text-slate-100">
            Người dùng trả phí hiện tại
          </h5>

          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="h-full flex items-center text-sm text-slate-500 dark:text-slate-400">
                Đang tải dữ liệu người dùng VIP...
              </div>
            ) : sortedCurrentUsers.length === 0 ? (
              <div className="h-full flex items-center text-sm text-slate-500 dark:text-slate-400">
                Chưa có dữ liệu phân bổ người dùng theo hạng VIP
              </div>
            ) : (
              <div className="space-y-3 h-full overflow-y-auto pr-1">
                {sortedCurrentUsers.map((item) => {
                  const widthPercentage =
                    totalCurrentVipUsers > 0
                      ? Math.max((item.userCount / totalCurrentVipUsers) * 100, 0)
                      : 0;

                  return (
                    <div
                      key={item.subscriptionId}
                      className="bg-white dark:bg-slate-800 p-4 rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                          {item.levelDisplayName || item.subscriptionName}
                        </p>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {formatInteger(item.userCount)}
                        </p>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-900 dark:bg-green-500"
                          style={{ width: `${widthPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-[300px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h5 className="text-xl font-bold font-headline text-slate-900 dark:text-slate-100">
              Hiệu suất gói đăng ký
            </h5>
          </div>

          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="h-full flex items-center text-sm text-slate-500 dark:text-slate-400">
                Đang tải dữ liệu sử dụng gói VIP...
              </div>
            ) : sortedVipUsage.length === 0 ? (
              <div className="h-full flex items-center text-sm text-slate-500 dark:text-slate-400">
                Chưa có dữ liệu sử dụng gói VIP
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-700/40">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        Gói
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        Lượt đăng ký
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        Doanh thu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {sortedVipUsage.map((item) => (
                      <tr
                        key={item.subscriptionId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.levelDisplayName || item.subscriptionName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                          {formatInteger(item.registrationCount)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
