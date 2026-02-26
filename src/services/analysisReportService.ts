/**
 * Analysis Report Service
 * Handles all API operations for managing analysis reports, sources, and categories
 */

import { get, post, put, del } from './api';
import { API_ENDPOINTS } from '@/constants';
import type {
  AnalysisReport,
  AnalysisReportSource,
  AnalysisReportCategory,
  CreateAnalysisReportRequest,
  CreateAnalysisReportSourceRequest,
  UpdateAnalysisReportSourceRequest,
  CreateAnalysisReportCategoryRequest,
  GetAnalysisReportsParams,
  GetAnalysisReportSourcesParams,
  GetAnalysisReportCategoriesParams,
} from '@/types/analysisReport';
import type { PaginatedData } from '@/types';

/**
 * Analysis Report Service
 * Provides methods for managing analysis reports, sources, and categories
 */
export const analysisReportService = {
  // ============== Reports ==============

  /**
   * Get analysis reports with filters and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<PaginatedData<AnalysisReport>> Paginated list of analysis reports
   */
  async getReports(params: GetAnalysisReportsParams = {}): Promise<PaginatedData<AnalysisReport>> {
    try {
      const {
        sourceId,
        categoryId,
        ticker,
        sectorId,
        searchTerm,
        pageIndex = 1,
        pageSize = 20,
      } = params;

      // Build query string
      const queryParams = new URLSearchParams();
      if (sourceId) queryParams.append('sourceId', sourceId);
      if (categoryId) queryParams.append('categoryId', categoryId);
      if (ticker) queryParams.append('ticker', ticker);
      if (sectorId) queryParams.append('sectorId', sectorId);
      if (searchTerm) queryParams.append('searchTerm', searchTerm);
      queryParams.append('pageIndex', pageIndex.toString());
      queryParams.append('pageSize', pageSize.toString());

      const url = `${API_ENDPOINTS.ANALYSIS_REPORTS.BASE}?${queryParams.toString()}`;
      const response = await get<PaginatedData<AnalysisReport>>(url);

      if (response.isSuccess && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Không thể tải danh sách báo cáo phân tích');
    } catch (error) {
      console.error('[AnalysisReportService] Error fetching reports:', error);
      throw error;
    }
  },

  /**
   * Create a new analysis report (without file)
   * After creating, use fileService.uploadFile with category=2 to upload the file
   * @param request - Create analysis report request
   * @returns Promise<AnalysisReport> Created analysis report
   */
  async createReport(request: CreateAnalysisReportRequest): Promise<AnalysisReport> {
    try {
      const response = await post<AnalysisReport>(
        API_ENDPOINTS.ANALYSIS_REPORTS.BASE,
        request
      );

      if (response.isSuccess && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Không thể tạo báo cáo phân tích');
    } catch (error) {
      console.error('[AnalysisReportService] Error creating report:', error);
      throw error;
    }
  },

  // ============== Sources ==============

  /**
   * Get analysis report sources with pagination
   * @param params - Query parameters for pagination and filtering
   * @returns Promise<PaginatedData<AnalysisReportSource>> Paginated list of sources
   */
  async getSources(params: GetAnalysisReportSourcesParams = {}): Promise<PaginatedData<AnalysisReportSource>> {
    try {
      const {
        pageIndex = 1,
        pageSize = 10,
        status,
      } = params;

      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.append('pageIndex', pageIndex.toString());
      queryParams.append('pageSize', pageSize.toString());
      if (status !== undefined) queryParams.append('status', status.toString());

      const url = `${API_ENDPOINTS.ANALYSIS_REPORTS.SOURCES}?${queryParams.toString()}`;
      const response = await get<PaginatedData<AnalysisReportSource>>(url);

      if (response.isSuccess && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Không thể tải danh sách nguồn báo cáo');
    } catch (error) {
      console.error('[AnalysisReportService] Error fetching sources:', error);
      throw error;
    }
  },

  /**
   * Get analysis report source by ID
   * @param id - Source ID
   * @returns Promise<AnalysisReportSource> Source details
   */
  async getSourceById(id: string): Promise<AnalysisReportSource> {
    try {
      const response = await get<AnalysisReportSource>(
        API_ENDPOINTS.ANALYSIS_REPORTS.SOURCE_BY_ID(id)
      );

      if (response.isSuccess && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Không thể tải thông tin nguồn báo cáo');
    } catch (error) {
      console.error('[AnalysisReportService] Error fetching source:', error);
      throw error;
    }
  },

  /**
   * Create a new analysis report source
   * Requires Admin role
   * @param request - Create source request
   * @returns Promise<AnalysisReportSource> Created source
   */
  async createSource(request: CreateAnalysisReportSourceRequest): Promise<AnalysisReportSource> {
    try {
      const response = await post<AnalysisReportSource>(
        API_ENDPOINTS.ANALYSIS_REPORTS.SOURCES,
        request
      );

      if (response.isSuccess && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Không thể tạo nguồn báo cáo');
    } catch (error) {
      console.error('[AnalysisReportService] Error creating source:', error);
      throw error;
    }
  },

  /**
   * Update an existing analysis report source
   * Requires Admin role
   * @param id - Source ID
   * @param request - Update source request
   * @returns Promise<AnalysisReportSource> Updated source
   */
  async updateSource(id: string, request: UpdateAnalysisReportSourceRequest): Promise<AnalysisReportSource> {
    try {
      const response = await put<AnalysisReportSource>(
        API_ENDPOINTS.ANALYSIS_REPORTS.SOURCE_BY_ID(id),
        request
      );

      if (response.isSuccess && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Không thể cập nhật nguồn báo cáo');
    } catch (error) {
      console.error('[AnalysisReportService] Error updating source:', error);
      throw error;
    }
  },

  /**
   * Delete an analysis report source
   * Requires Admin role
   * @param id - Source ID
   * @returns Promise<void>
   */
  async deleteSource(id: string): Promise<void> {
    try {
      const response = await del<void>(
        API_ENDPOINTS.ANALYSIS_REPORTS.SOURCE_BY_ID(id)
      );

      if (!response.isSuccess) {
        throw new Error(response.message || 'Không thể xóa nguồn báo cáo');
      }
    } catch (error) {
      console.error('[AnalysisReportService] Error deleting source:', error);
      throw error;
    }
  },

  // ============== Categories ==============

  /**
   * Get analysis report categories (hierarchical) with pagination
   * @param params - Query parameters for pagination and filtering
   * @returns Promise<PaginatedData<AnalysisReportCategory>> Paginated list of categories
   */
  async getCategories(params: GetAnalysisReportCategoriesParams = {}): Promise<PaginatedData<AnalysisReportCategory>> {
    try {
      const {
        pageIndex = 1,
        pageSize = 10,
        status,
        level,
      } = params;

      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.append('pageIndex', pageIndex.toString());
      queryParams.append('pageSize', pageSize.toString());
      if (status !== undefined) queryParams.append('status', status.toString());
      if (level !== undefined) queryParams.append('level', level.toString());

      const url = `${API_ENDPOINTS.ANALYSIS_REPORTS.CATEGORIES}?${queryParams.toString()}`;
      const response = await get<PaginatedData<AnalysisReportCategory>>(url);

      if (response.isSuccess && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Không thể tải danh sách danh mục báo cáo');
    } catch (error) {
      console.error('[AnalysisReportService] Error fetching categories:', error);
      throw error;
    }
  },

  /**
   * Create a new analysis report category
   * Requires Admin role
   * @param request - Create category request
   * @returns Promise<AnalysisReportCategory> Created category
   */
  async createCategory(request: CreateAnalysisReportCategoryRequest): Promise<AnalysisReportCategory> {
    try {
      const response = await post<AnalysisReportCategory>(
        API_ENDPOINTS.ANALYSIS_REPORTS.CATEGORIES,
        request
      );

      if (response.isSuccess && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Không thể tạo danh mục báo cáo');
    } catch (error) {
      console.error('[AnalysisReportService] Error creating category:', error);
      throw error;
    }
  },
};

export default analysisReportService;
