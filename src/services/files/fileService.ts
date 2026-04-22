/**
 * File Service
 * Handles file upload, download, and delete operations
 */

import { apiRequest, downloadBlob } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type {
  FileUploadRequest,
  FileResponse,
  FileDownloadParams,
  FileDeleteParams,
} from '@/types/file';
import type { ApiResponse } from '@/types';

/**
 * File Service
 * Provides methods for file management operations
 */
export const fileService = {
  /**
   * Upload a file
   * @param request - File upload request containing file and metadata
   * @returns Promise<FileResponse> Uploaded file information
   */
  async uploadFile(request: FileUploadRequest): Promise<FileResponse> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('category', request.category.toString());
      
      if (request.description) {
        formData.append('description', request.description);
      }
      
      if (request.relatedEntityId) {
        formData.append('relatedEntityId', request.relatedEntityId);
      }

      // Use apiRequest with custom headers for multipart/form-data
      const response = await apiRequest<FileResponse>(
        API_ENDPOINTS.FILES.UPLOAD,
        {
          method: 'POST',
          body: formData,
          headers: {
            // Don't set Content-Type - let browser set it with boundary
          } as any,
        }
      );

      if (response.isSuccess && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Không thể upload file');
    } catch (error) {
      console.error('[FileService] Error uploading file:', error);
      throw error;
    }
  },

  /**
   * Download a file
   * @param params - File download parameters (category and entityId)
   * @returns Promise<Blob> File blob
   */
  async downloadFile(params: FileDownloadParams): Promise<Blob> {
    try {
      const url = `${API_ENDPOINTS.FILES.DOWNLOAD}?category=${params.category}&entityId=${encodeURIComponent(params.entityId)}`;
      
      const blob = await downloadBlob(url);
      return blob;
    } catch (error) {
      console.error('[FileService] Error downloading file:', error);
      throw error;
    }
  },

  /**
   * Download file and trigger browser download
   * @param params - File download parameters
   * @param filename - Optional filename for download
   */
  async downloadFileToDevice(params: FileDownloadParams, filename?: string): Promise<void> {
    try {
      const blob = await this.downloadFile(params);
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('[FileService] Error downloading file to device:', error);
      throw error;
    }
  },

  /**
   * Delete a file
   * @param params - File delete parameters (category and entityId)
   * @returns Promise<void>
   */
  async deleteFile(params: FileDeleteParams): Promise<void> {
    try {
      const url = `${API_ENDPOINTS.FILES.DELETE}?category=${params.category}&entityId=${encodeURIComponent(params.entityId)}`;
      
      const response = await apiRequest<void>(url, {
        method: 'DELETE',
      });

      if (!response.isSuccess) {
        throw new Error(response.message || 'Không thể xóa file');
      }
    } catch (error) {
      console.error('[FileService] Error deleting file:', error);
      throw error;
    }
  },
};

export default fileService;
