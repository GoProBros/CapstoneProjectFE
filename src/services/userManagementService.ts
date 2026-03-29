/**
 * User Management Service
 * Handles API calls for user management in System Manager
 */

import { get, patch, post } from './api';
import { API_ENDPOINTS } from '@/constants';
import type { PaginatedData } from '@/types';
import type {
  CurrentVipPackage,
  UserManagementListItem,
  UserManagementDetail,
  UserTransactionDetail,
  GetUserManagementListParams,
  CreateStaffUserRequest,
  UpdateUserStatusRequest,
} from '@/types/userManagement';

const normalizeText = (value: string | null | undefined): string => value ?? '';

const mapUserListItem = (item: Partial<UserManagementListItem>): UserManagementListItem => ({
  id: item.id ?? '',
  name: normalizeText(item.name),
  role: normalizeText(item.role),
  phone: normalizeText(item.phone),
  email: normalizeText(item.email),
  avatar: item.avatar ?? null,
  status: normalizeText(item.status),
});

const mapVipPackage = (pkg: Partial<CurrentVipPackage> | null | undefined): CurrentVipPackage | null => {
  if (!pkg) {
    return null;
  }

  return {
    subscriptionId: pkg.subscriptionId ?? 0,
    subscriptionName: normalizeText(pkg.subscriptionName),
    vipLevelName: normalizeText(pkg.vipLevelName),
    allowedModules: pkg.allowedModules ?? [],
    startDate: normalizeText(pkg.startDate),
    endDate: normalizeText(pkg.endDate),
  };
};

const mapTransaction = (item: Partial<UserTransactionDetail>): UserTransactionDetail => ({
  id: item.id ?? '',
  orderCode: item.orderCode ?? 0,
  subscriptionId: item.subscriptionId ?? 0,
  subscriptionName: normalizeText(item.subscriptionName),
  amount: item.amount ?? 0,
  status: item.status ?? 0,
  statusName: normalizeText(item.statusName),
  type: item.type ?? 0,
  typeName: normalizeText(item.typeName),
  paymentProvider: item.paymentProvider ?? 0,
  paymentProviderName: normalizeText(item.paymentProviderName),
  providerTransactionId: normalizeText(item.providerTransactionId),
  checkoutUrl: normalizeText(item.checkoutUrl),
  description: normalizeText(item.description),
  createdAt: normalizeText(item.createdAt),
});

const mapUserDetail = (detail: Partial<UserManagementDetail>): UserManagementDetail => ({
  id: detail.id ?? '',
  name: normalizeText(detail.name),
  role: normalizeText(detail.role),
  phone: normalizeText(detail.phone),
  email: normalizeText(detail.email),
  avatar: detail.avatar ?? null,
  status: normalizeText(detail.status),
  currentVipPackage: mapVipPackage(detail.currentVipPackage),
  transactions: (detail.transactions ?? []).map(mapTransaction),
});

export const userManagementService = {
  /**
   * Get paginated user list for management
   */
  async getUsers(
    params: GetUserManagementListParams = {}
  ): Promise<PaginatedData<UserManagementListItem>> {
    const { pageIndex = 1, pageSize = 10, role, search } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('pageIndex', pageIndex.toString());
    queryParams.append('pageSize', pageSize.toString());
    if (role !== undefined) {
      queryParams.append('role', role.toString());
    }
    if (search?.trim()) {
      queryParams.append('search', search.trim());
    }

    const url = `${API_ENDPOINTS.USER_MANAGEMENT.BASE}?${queryParams.toString()}`;
    const response = await get<PaginatedData<UserManagementListItem>>(url);

    if (response.isSuccess && response.data) {
      return {
        ...response.data,
        items: (response.data.items ?? []).map(mapUserListItem),
      };
    }

    throw new Error(response.message || 'Không thể tải danh sách người dùng');
  },

  /**
   * Get user detail by id
   */
  async getUserDetail(userId: string): Promise<UserManagementDetail> {
    const response = await get<UserManagementDetail>(
      API_ENDPOINTS.USER_MANAGEMENT.BY_ID(userId)
    );

    if (response.isSuccess && response.data) {
      return mapUserDetail(response.data);
    }

    throw new Error(response.message || 'Không thể tải chi tiết người dùng');
  },

  /**
   * Create new staff user (Admin only)
   */
  async createStaffUser(payload: CreateStaffUserRequest): Promise<void> {
    const requestBody = {
      ...payload,
      requireEmailVerification: payload.requireEmailVerification ?? false,
    };

    const response = await post<null>(
      API_ENDPOINTS.USER_MANAGEMENT.CREATE_STAFF,
      requestBody
    );

    if (!response.isSuccess) {
      throw new Error(response.message || 'Không thể tạo tài khoản nhân viên');
    }
  },

  /**
   * Update user status by id
   */
  async updateUserStatus(userId: string, payload: UpdateUserStatusRequest): Promise<void> {
    const response = await patch<null>(
      API_ENDPOINTS.USER_MANAGEMENT.UPDATE_STATUS(userId),
      payload
    );

    if (!response.isSuccess) {
      throw new Error(response.message || 'Không thể cập nhật trạng thái người dùng');
    }
  },
};
