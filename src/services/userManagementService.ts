/**
 * User Management Service
 * Handles API calls for user management in System Manager
 */

import { get, post } from './api';
import { API_ENDPOINTS } from '@/constants';
import type { PaginatedData } from '@/types';
import type {
  UserManagementListItem,
  UserManagementDetail,
  GetUserManagementListParams,
  CreateStaffUserRequest,
} from '@/types/userManagement';

export const userManagementService = {
  /**
   * Get paginated user list for management
   */
  async getUsers(
    params: GetUserManagementListParams = {}
  ): Promise<PaginatedData<UserManagementListItem>> {
    const { pageIndex = 1, pageSize = 10 } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('pageIndex', pageIndex.toString());
    queryParams.append('pageSize', pageSize.toString());

    const url = `${API_ENDPOINTS.USER_MANAGEMENT.BASE}?${queryParams.toString()}`;
    const response = await get<PaginatedData<UserManagementListItem>>(url);

    if (response.isSuccess && response.data) {
      return response.data;
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
      return response.data;
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
};
