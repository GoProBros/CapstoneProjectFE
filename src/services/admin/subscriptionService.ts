import { get, patch, post } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type { SubscriptionDto, UserSubscriptionDto } from '@/types/subscription';

interface UpdateSubscriptionPayload {
  price: number;
  allowedModules?: string[];
}

interface CreateSubscriptionPayload {
  name: string;
  levelOrder: number;
  maxWorkspaces: number;
  price: number;
  durationInDays: number;
  allowedModules: string[];
  isActive: 0 | 1;
}

/**
 * Get all available subscription packages
 */
export async function getSubscriptions(): Promise<SubscriptionDto[]> {
  const result = await get<SubscriptionDto[]>(API_ENDPOINTS.SUBSCRIPTIONS.BASE);
  return result.isSuccess ? (result.data ?? []) : [];
}

/**
 * Get current user's active subscription
 */
export async function getMySubscription(): Promise<UserSubscriptionDto | null> {
  try {
    const result = await get<UserSubscriptionDto>(API_ENDPOINTS.SUBSCRIPTIONS.ME);
    return result.isSuccess ? (result.data ?? null) : null;
  } catch {
    return null;
  }
}

/**
 * Toggle active/inactive status for a subscription package.
 */
export async function toggleSubscriptionStatus(id: number): Promise<SubscriptionDto> {
  const result = await patch<SubscriptionDto>(API_ENDPOINTS.SUBSCRIPTIONS.UPDATE_STATUS(id), {});
  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không thể cập nhật trạng thái gói đăng ký');
  }
  return result.data;
}

/**
 * Update editable fields of a subscription package.
 */
export async function updateSubscriptionById(
  id: number,
  payload: UpdateSubscriptionPayload,
): Promise<SubscriptionDto> {
  const result = await patch<SubscriptionDto>(API_ENDPOINTS.SUBSCRIPTIONS.UPDATE_BY_ID(id), payload);
  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không thể cập nhật gói đăng ký');
  }
  return result.data;
}

/**
 * Create a new subscription package.
 */
export async function createSubscription(
  payload: CreateSubscriptionPayload,
): Promise<SubscriptionDto> {
  const result = await post<SubscriptionDto>(API_ENDPOINTS.SUBSCRIPTIONS.BASE, payload);
  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không thể tạo gói đăng ký mới');
  }
  return result.data;
}
