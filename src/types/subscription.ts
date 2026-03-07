export interface SubscriptionDto {
  id: number;
  name: string;
  levelOrder: number;
  maxWorkspaces: number;
  price: number;
  durationInDays: number;
  allowedModules: unknown;
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
  isActive: boolean;
}
