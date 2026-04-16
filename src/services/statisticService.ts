import { get } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type {
  CustomerRetentionStatisticsDto,
  SubscriptionStatisticsDto,
  WatchListTopInterestedSymbolsDto,
} from '@/types/subscription';

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

/**
 * Get customer retention statistics for dashboard
 */
export async function getCustomerRetentionStatistics(): Promise<CustomerRetentionStatisticsDto> {
  const response = await get<CustomerRetentionStatisticsDto>(
    API_ENDPOINTS.SUBSCRIPTIONS.CUSTOMER_RETENTION
  );

  if (!response.isSuccess || !response.data) {
    throw new Error(response.message || 'Không thể tải dữ liệu giữ chân khách hàng');
  }

  return response.data;
}

/**
 * Get watchlist top interested symbols statistics for dashboard
 */
export async function getWatchListTopInterestedSymbols(): Promise<WatchListTopInterestedSymbolsDto> {
  const response = await get<WatchListTopInterestedSymbolsDto>(
    API_ENDPOINTS.SUBSCRIPTIONS.WATCHLIST_TOP_SYMBOLS
  );

  if (!response.isSuccess || !response.data) {
    throw new Error(response.message || 'Không thể tải dữ liệu mã quan tâm');
  }

  return response.data;
}

const statisticService = {
  getSubscriptionStatistics,
  getCustomerRetentionStatistics,
  getWatchListTopInterestedSymbols,
};

export default statisticService;
