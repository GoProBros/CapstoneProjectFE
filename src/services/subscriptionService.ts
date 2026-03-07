import { get } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type { SubscriptionDto, UserSubscriptionDto } from '@/types/subscription';

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
