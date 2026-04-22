/**
 * Smart Market Board Service
 * Reuses heatmap data flow + provides avg-volume endpoint for volume filtering.
 */

import { API_ENDPOINTS } from '@/constants/endpoints';
import { HeatmapData, HeatmapFilters } from '@/types/heatmap';
import { heatmapService } from '@/services/market/heatmapService';
import type { TickerAvgVolumeDto, VolumePeriod } from '@/types/smartBoard';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7148';

const PERIOD_DAYS: Record<VolumePeriod, number> = {
  '1d':  1,
  '7d':  7,
  '30d': 30,
};

class SmartBoardService {
  /**
   * Load initial symbol + sector data for the Smart Market Board.
   * Delegates directly to heatmapService so we share the same caching/filtering logic.
   */
  async getMarketData(filters?: HeatmapFilters): Promise<HeatmapData> {
    return heatmapService.getHeatmapData(filters);
  }

  /**
   * Fetch average daily volume for all tickers over the selected period.
   * Returns a Map<ticker, avgDailyVolume> for O(1) lookups during client-side filtering.
   */
  async getAvgVolume(period: VolumePeriod): Promise<Map<string, number>> {
    const days = PERIOD_DAYS[period];
    const url = `${BASE_URL}${API_ENDPOINTS.MARKET.AVG_VOLUME}?days=${days}`;

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch avg volume: ${response.status}`);
    }

    const result = await response.json();

    if (!result.isSuccess || !result.data) {
      throw new Error(result.message || 'Failed to fetch avg volume data');
    }

    const map = new Map<string, number>();
    (result.data as TickerAvgVolumeDto[]).forEach((item) => {
      map.set(item.ticker.toUpperCase(), item.avgDailyVolume);
    });

    return map;
  }
}

export const smartBoardService = new SmartBoardService();
