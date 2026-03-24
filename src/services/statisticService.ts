import { get } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type { SubscriptionStatisticsDto } from '@/types/subscription';

/**
 * Get subscription statistics for admin/staff dashboard
 */
export async function getSubscriptionStatistics(): Promise<SubscriptionStatisticsDto> {
  const response = await get<SubscriptionStatisticsDto>(API_ENDPOINTS.SUBSCRIPTIONS.STATISTICS);

  if (!response.isSuccess || !response.data) {
    throw new Error(response.message || 'Không thể tải dữ liệu thống kê');
  }

  return response.data;
}

const statisticService = {
  getSubscriptionStatistics,
};

export default statisticService;
