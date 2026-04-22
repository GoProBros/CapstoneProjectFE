import RevenueDashboardSection from "@/features/admin/components/dashboard/RevenueDashboardSection";
import type {
  VipCurrentUserCountDto,
  VipPackageUsageDto,
} from "@/types/subscription";

interface RevenueProps {
  totalRevenue: number;
  revenuePerUser: number;
  revenueTrend: {
    icon: string;
    className: string;
    text: string;
  };
  topPackageName: string;
  topPackageRevenue: number;
  monthlyRevenueData: {
    label: string;
    revenue: number;
    growthPercentage: number;
  }[];
  packageRevenueData: {
    name: string;
    revenue: number;
    percentage: number;
  }[];
  vipPackageUsages: VipPackageUsageDto[];
  currentUsersByVipLevel: VipCurrentUserCountDto[];
  statisticsError: string | null;
  isLoading: boolean;
}

export default function Revenue({
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
  isLoading,
}: RevenueProps) {
  if (isLoading) {
    return (
      <section className="space-y-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="h-72 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Đang tải dữ liệu doanh thu...
          </div>
        </div>
      </section>
    );
  }

  return (
    <RevenueDashboardSection
      totalRevenue={totalRevenue}
      revenuePerUser={revenuePerUser}
      revenueTrend={revenueTrend}
      topPackageName={topPackageName}
      topPackageRevenue={topPackageRevenue}
      monthlyRevenueData={monthlyRevenueData}
      packageRevenueData={packageRevenueData}
      vipPackageUsages={vipPackageUsages}
      currentUsersByVipLevel={currentUsersByVipLevel}
      statisticsError={statisticsError}
    />
  );
}
