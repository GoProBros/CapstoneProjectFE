/**
 * User Management Types
 * Mirrors backend contracts from /api/v1/users
 */

export interface UserManagementListItem {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  avatar?: string | null;
  status: string;
}

export interface CurrentVipPackage {
  subscriptionId: number;
  subscriptionName: string;
  vipLevelName: string;
  allowedModules: string[];
  startDate: string;
  endDate: string;
}

export interface UserTransactionDetail {
  id: string;
  orderCode: number;
  subscriptionId: number;
  subscriptionName: string;
  amount: number;
  status: number;
  statusName: string;
  type: number;
  typeName: string;
  paymentProvider: number;
  paymentProviderName: string;
  providerTransactionId: string;
  checkoutUrl: string;
  description: string;
  createdAt: string;
}

export interface UserManagementDetail {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  avatar?: string | null;
  status: string;
  currentVipPackage: CurrentVipPackage | null;
  transactions: UserTransactionDetail[];
}

export type UserManagementRoleFilter = 1 | 2 | 3;
export type UserManagementStatusValue = 0 | 1;

export interface GetUserManagementListParams {
  pageIndex?: number;
  pageSize?: number;
  role?: UserManagementRoleFilter;
  search?: string;
}

export interface CreateStaffUserRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl?: string;
  requireEmailVerification?: boolean;
}

export interface UpdateUserStatusRequest {
  status: UserManagementStatusValue;
}