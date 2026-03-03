/**
 * Analysis Report types
 */

import { CommonStatus } from './file';

/**
 * Analysis Report Source
 */
export interface AnalysisReportSource {
  code: string;
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  status: CommonStatus;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Create Analysis Report Source request
 */
export interface CreateAnalysisReportSourceRequest {
  code: string;
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
}

/**
 * Update Analysis Report Source request
 */
export interface UpdateAnalysisReportSourceRequest {
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  status: CommonStatus;
}

/**
 * Analysis Report Category
 */
export interface AnalysisReportCategory {
  code: string;
  name: string;
  description?: string;
  level: number;
  parentId?: string;
  status: CommonStatus;
  createdAt: string;
  updatedAt?: string;
  parentCategory?: AnalysisReportCategory;
  childCategories: AnalysisReportCategory[];
}

/**
 * Create Analysis Report Category request
 */
export interface CreateAnalysisReportCategoryRequest {
  code: string;
  name: string;
  description?: string;
  level: number;
  parentId?: string;
}

/**
 * Analysis Report
 */
export interface AnalysisReport {
  id: string;
  sourceId: string;
  categoryId: string;
  title: string;
  description?: string;
  tickers?: string[];
  sectorId?: string;
  publishDate?: string;
  filePath?: string;
  originalFileName?: string;
  fileExtension?: string;
  mimeType?: string;
  fileSize?: number;
  uploadedBy?: string;
  status: CommonStatus;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Create Analysis Report request
 */
export interface CreateAnalysisReportRequest {
  sourceId: string;
  categoryId: string;
  title: string;
  description?: string;
  tickers?: string[];
  sectorId?: string;
  publishDate?: string;
}

/**
 * Update Analysis Report request
 */
export interface UpdateAnalysisReportRequest {
  sourceId: string;
  categoryId: string;
  title: string;
  description?: string;
  tickers?: string[];
  sectorId?: string;
  publishDate?: string;
  status: CommonStatus;
}

/**
 * Get Analysis Reports query params
 */
export interface GetAnalysisReportsParams {
  sourceId?: string;
  categoryId?: string;
  ticker?: string;
  sectorId?: string;
  searchTerm?: string;
  status?: CommonStatus;
  pageIndex?: number;
  pageSize?: number;
}

/**
 * Get Analysis Report Sources query params
 */
export interface GetAnalysisReportSourcesParams {
  pageIndex?: number;
  pageSize?: number;
  status?: CommonStatus;
}

/**
 * Get Analysis Report Categories query params
 */
export interface GetAnalysisReportCategoriesParams {
  pageIndex?: number;
  pageSize?: number;
  status?: CommonStatus;
  level?: number;
}
