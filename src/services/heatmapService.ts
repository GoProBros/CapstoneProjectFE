/**
 * Heatmap Service
 * REST API service for fetching heatmap data
 */

import { HeatmapData, HeatmapFilters } from '@/types/heatmap';

class HeatmapService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7148';
  }

  /**
   * Get heatmap data from REST API
   * @param filters - Optional filters (exchange, sector)
   * @returns Promise with heatmap data
   */
  async getHeatmapData(filters?: HeatmapFilters): Promise<HeatmapData> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.exchange) {
        params.append('exchange', filters.exchange);
      }
      
      if (filters?.sector) {
        params.append('sector', filters.sector);
      }

      const queryString = params.toString();
      const url = `${this.baseUrl}/api/heatmap${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Note: Add authorization header if needed
        // headers: {
        //   'Authorization': `Bearer ${token}`,
        // },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch heatmap data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Backend returns ApiResponse<HeatmapData>
      if (!result.isSuccess || !result.data) {
        throw new Error(result.message || 'Failed to fetch heatmap data');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      throw error;
    }
  }

  /**
   * Get heatmap color CSS class based on change percent
   * @param changePercent - Change percent value
   * @returns CSS class name
   */
  getColorClass(changePercent: number): string {
    if (changePercent >= 6.5) return 'heatmap-ceiling';
    if (changePercent >= 3.0) return 'heatmap-strong-up';
    if (changePercent >= 1.0) return 'heatmap-up';
    if (changePercent >= -1.0) return 'heatmap-neutral';
    if (changePercent >= -3.0) return 'heatmap-down';
    if (changePercent >= -6.5) return 'heatmap-strong-down';
    return 'heatmap-floor';
  }

  /**
   * Get color hex value based on change percent
   * @param changePercent - Change percent value
   * @returns Hex color string
   */
  getColorHex(changePercent: number): string {
    if (changePercent >= 6.5) return '#9333ea';  // Purple (ceiling)
    if (changePercent >= 3.0) return '#16a34a';  // Dark Green
    if (changePercent >= 1.0) return '#86efac';  // Light Green
    if (changePercent >= -1.0) return '#fef08a'; // Yellow
    if (changePercent >= -3.0) return '#fca5a5'; // Light Red
    if (changePercent >= -6.5) return '#dc2626'; // Dark Red
    return '#06b6d4';                             // Cyan (floor)
  }

  /**
   * Format number with thousand separators
   * @param value - Number to format
   * @returns Formatted string
   */
  formatNumber(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value);
  }

  /**
   * Format volume (abbreviate large numbers)
   * @param volume - Volume value
   * @returns Formatted string (e.g., "1.2M", "345K")
   */
  formatVolume(volume: number): string {
    if (volume >= 1_000_000_000) {
      return `${(volume / 1_000_000_000).toFixed(1)}B`;
    }
    if (volume >= 1_000_000) {
      return `${(volume / 1_000_000).toFixed(1)}M`;
    }
    if (volume >= 1_000) {
      return `${(volume / 1_000).toFixed(0)}K`;
    }
    return volume.toString();
  }

  /**
   * Format market cap
   * @param marketCap - Market cap value
   * @returns Formatted string
   */
  formatMarketCap(marketCap?: number): string {
    if (!marketCap) return 'N/A';
    
    if (marketCap >= 1_000_000_000_000) {
      return `${(marketCap / 1_000_000_000_000).toFixed(1)}T`;
    }
    if (marketCap >= 1_000_000_000) {
      return `${(marketCap / 1_000_000_000).toFixed(1)}B`;
    }
    if (marketCap >= 1_000_000) {
      return `${(marketCap / 1_000_000).toFixed(0)}M`;
    }
    return marketCap.toString();
  }
}

// Export singleton instance
export const heatmapService = new HeatmapService();
