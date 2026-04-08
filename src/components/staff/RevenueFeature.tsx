"use client";

import { useEffect, useState } from "react";
import statisticService from "@/services/statisticService";
import type { SubscriptionStatisticsDto } from "@/types/subscription";
import Revenue from "@/components/staff/revenue/Revenue";
import Subscription from "@/components/staff/revenue/Subscription";

type RevenueTab = "revenue" | "subscription";

export default function RevenueFeature() {
  const [activeTab, setActiveTab] = useState<RevenueTab>("revenue");
  const [statistics, setStatistics] = useState<SubscriptionStatisticsDto | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        setStatisticsError(null);

        const data = await statisticService.getSubscriptionStatistics();
        setStatistics(data);
      } catch {
        setStatisticsError("Không thể tải dữ liệu thống kê gói đăng ký");
        setStatistics(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-headline mb-2">
            Quản lý doanh thu
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Theo dõi dòng tiền theo tháng, người dùng đang hoạt động và hiệu suất
            các gói VIP.
          </p>
        </div>

        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("revenue")}
            className={`px-6 py-2.5 font-semibold rounded-lg transition-all ${
              activeTab === "revenue"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Doanh thu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("subscription")}
            className={`px-6 py-2.5 font-semibold rounded-lg transition-all ${
              activeTab === "subscription"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Gói đăng ký
          </button>
        </div>
      </div>

      {statisticsError && (
        <p className="text-sm text-red-600 dark:text-red-400">{statisticsError}</p>
      )}

      {activeTab === "revenue" ? (
        <Revenue
          activeUsers={statistics?.activeUsers ?? 0}
          totalRevenue={statistics?.totalRevenue ?? 0}
          monthLabels={statistics?.monthLabels ?? []}
          revenueByMonth={statistics?.revenueByMonth ?? []}
          isLoading={isLoading}
        />
      ) : (
        <Subscription
          activeUsers={statistics?.activeUsers ?? 0}
          currentUsersByVipLevel={statistics?.currentUsersByVipLevel ?? []}
          vipPackageUsages={statistics?.vipPackageUsages ?? []}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
