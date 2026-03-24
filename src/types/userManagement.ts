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

export interface UserManagementDetail {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  avatar?: string | null;
  status: string;
}

export interface GetUserManagementListParams {
  pageIndex?: number;
  pageSize?: number;
}

export interface CreateStaffUserRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl?: string;
  requireEmailVerification?: boolean;
}