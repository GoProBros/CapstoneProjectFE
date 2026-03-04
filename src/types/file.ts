/**
 * File management types
 */

/**
 * File category enum
 * 1 = FinancialReport
 * 2 = AnalysisReport  
 * 3 = Avatar
 * 4 = CompanyLogo
 */
export enum FileCategory {
  FinancialReport = 1,
  AnalysisReport = 2,
  Avatar = 3,
  CompanyLogo = 4,
}

/**
 * File type enum
 */
export enum FileType {
  Document = 1,
  Image = 2,
  Video = 3,
  Audio = 4,
  Other = 5,
}

/**
 * Common status enum
 */
export enum CommonStatus {
  Inactive = 0,
  Active = 1,
}

/**
 * File upload request
 */
export interface FileUploadRequest {
  file: File;
  category: FileCategory;
  description?: string;
  relatedEntityId?: string;
}

/**
 * File upload response
 */
export interface FileResponse {
  id: string;
  originalFileName: string;
  category: FileCategory;
  fileType: FileType;
  fileExtension: string;
  mimeType: string;
  fileSize: number;
  description?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  uploadedBy?: string;
  uploaderName?: string;
  status: CommonStatus;
  createdAt: string;
  updatedAt?: string;
  downloadUrl: string;
}

/**
 * File download params
 */
export interface FileDownloadParams {
  category: FileCategory;
  entityId: string;
}

/**
 * File delete params
 */
export interface FileDeleteParams {
  category: FileCategory;
  entityId: string;
}
