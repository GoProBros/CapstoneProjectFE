export type SubscriptionActiveFlag = 0 | 1 | boolean;

export interface SubscriptionDto {
  id: number;
  name: string;
  levelOrder: number;
  maxWorkspaces: number;
  price: number;
  durationInDays: number;
  allowedModules: unknown;
  isActive?: SubscriptionActiveFlag;
}

export interface UserSubscriptionDto {
  subscriptionId: number | null;
  subscriptionName: string;
  levelOrder: number;
  maxWorkspaces: number;
  price: number;
  durationInDays: number;
  allowedModules: unknown;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  isActive: SubscriptionActiveFlag;
}

export interface VipCurrentUserCountDto {
  subscriptionId: number;
  subscriptionName: string;
  levelOrder: number;
  levelDisplayName: string;
  userCount: number;
}

export interface VipPackageUsageDto {
  subscriptionId: number;
  subscriptionName: string;
  levelOrder: number;
  levelDisplayName: string;
  registrationCount: number;
  uniqueUserCount: number;
  totalRevenue: number;
}

export interface SubscriptionStatisticsDto {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRevenue: number;
  monthLabels: string[];
  newUsersByMonth: number[];
  revenueByMonth: number[];
  revenueGrowthPercentageByMonth: number[];
  revenuePercentageOfTotalByMonth: number[];
  newUsersGrowthPercentageByMonth: number[];
  currentUsersByVipLevel: VipCurrentUserCountDto[];
  vipPackageUsages: VipPackageUsageDto[];
}
