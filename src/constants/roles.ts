/**
 * User role constants — matches GetDisplayName() values from backend UserRole enum
 * Backend: Admin = "Quản trị viên", Staff = "Nhân viên", User = "Người dùng"
 */
export const USER_ROLES = {
  ADMIN: 'Quản trị viên',
  STAFF: 'Nhân viên',
  USER: 'Người dùng',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Roles that can access the system management panel */
export const SYSTEM_MANAGER_ROLES: readonly string[] = [USER_ROLES.ADMIN, USER_ROLES.STAFF];
