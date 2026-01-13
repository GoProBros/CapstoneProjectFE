/**
 * Watch List Service
 * Handles all API operations for managing custom symbol watch lists
 * All endpoints require authentication
 */

import { get, post, put, del } from './api';
import { API_ENDPOINTS } from '@/constants';
import type {
  WatchListSummary,
  WatchListDetail,
  CreateWatchListRequest,
  UpdateWatchListRequest,
} from '@/types/watchList';

/**
 * Watch List Service
 * Provides methods for CRUD operations on watch lists
 */
export const watchListService = {
  /**
   * Get all watch lists for current user
   * Requires authentication
   * @returns Promise<WatchListSummary[]> List of watch list summaries
   */
  async getWatchLists(): Promise<WatchListSummary[]> {
    try {
      const response = await get<WatchListSummary[]>(API_ENDPOINTS.WATCH_LIST.BASE);
      
      if (response.isSuccess && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Không thể tải danh sách watch list');
    } catch (error) {
      console.error('[WatchListService] Error fetching watch lists:', error);
      throw error;
    }
  },

  /**
   * Create a new watch list
   * Requires authentication
   * @param name - Name of the watch list
   * @param tickers - Comma-separated ticker symbols (e.g., "VNM-VCB-HPG")
   * @returns Promise<WatchListDetail> Created watch list detail
   */
  async createWatchList(name: string, tickers: string): Promise<WatchListDetail> {
    try {
      const requestBody: CreateWatchListRequest = {
        name,
        tickers,
      };
      
      const response = await post<WatchListDetail>(API_ENDPOINTS.WATCH_LIST.BASE, requestBody);
      
      if (response.isSuccess && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Không thể tạo watch list');
    } catch (error) {
      console.error('[WatchListService] Error creating watch list:', error);
      throw error;
    }
  },

  /**
   * Get watch list detail by ID
   * Requires authentication
   * @param id - Watch list ID
   * @returns Promise<WatchListDetail> Watch list detail with tickers
   */
  async getWatchListById(id: number): Promise<WatchListDetail> {
    try {
      const response = await get<WatchListDetail>(API_ENDPOINTS.WATCH_LIST.BY_ID(id));
      
      if (response.isSuccess && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || `Không thể tải watch list ${id}`);
    } catch (error) {
      console.error(`[WatchListService] Error fetching watch list ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update an existing watch list
   * Requires authentication
   * @param id - Watch list ID
   * @param name - Updated name
   * @param tickers - Updated comma-separated ticker symbols
   * @returns Promise<WatchListDetail> Updated watch list detail
   */
  async updateWatchList(id: number, name: string, tickers: string): Promise<WatchListDetail> {
    try {
      const requestBody: UpdateWatchListRequest = {
        id,
        name,
        tickers,
      };
      
      const response = await put<WatchListDetail>(API_ENDPOINTS.WATCH_LIST.BY_ID(id), requestBody);
      
      if (response.isSuccess && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || `Không thể cập nhật watch list ${id}`);
    } catch (error) {
      console.error(`[WatchListService] Error updating watch list ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a watch list
   * Requires authentication
   * @param id - Watch list ID to delete
   * @returns Promise<void>
   */
  async deleteWatchList(id: number): Promise<void> {
    try {
      const response = await del<null>(API_ENDPOINTS.WATCH_LIST.BY_ID(id));
      
      if (!response.isSuccess) {
        throw new Error(response.message || `Không thể xóa watch list ${id}`);
      }
    } catch (error) {
      console.error(`[WatchListService] Error deleting watch list ${id}:`, error);
      throw error;
    }
  },

  /**
   * Helper: Convert ticker array to API format string
   * @param tickers - Array of ticker symbols
   * @returns Comma-separated string (e.g., "VNM-VCB-HPG")
   */
  tickersToString(tickers: string[]): string {
    return tickers.join('-');
  },

  /**
   * Helper: Parse API format string to ticker array
   * @param tickersString - Comma-separated string (e.g., "VNM-VCB-HPG")
   * @returns Array of ticker symbols
   */
  tickersFromString(tickersString: string): string[] {
    if (!tickersString || tickersString.trim() === '') {
      return [];
    }
    return tickersString.split('-').map(ticker => ticker.trim()).filter(Boolean);
  },
};

export default watchListService;
