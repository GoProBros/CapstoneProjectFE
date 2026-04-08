import StatsSubscription from "@/components/staff/revenue/StatsSubscription";
import SubscriptionManagement from "./SubscriptionManagement";
import type {
  VipCurrentUserCountDto,
  VipPackageUsageDto,
} from "@/types/subscription";

interface SubscriptionProps {
  activeUsers: number;
  currentUsersByVipLevel: VipCurrentUserCountDto[];
  vipPackageUsages: VipPackageUsageDto[];
  isLoading: boolean;
}

export default function Subscription({
  activeUsers,
  currentUsersByVipLevel,
  vipPackageUsages,
  isLoading,
}: SubscriptionProps) {
  return (
    <section className="space-y-8">
      <StatsSubscription
        activeUsers={activeUsers}
        currentUsersByVipLevel={currentUsersByVipLevel}
        vipPackageUsages={vipPackageUsages}
        isLoading={isLoading}
      />

      <SubscriptionManagement
        isLoading={isLoading}
      />
    </section>
  );
}
