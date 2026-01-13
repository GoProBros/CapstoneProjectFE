/**
 * Workspace Service
 * Handles workspace CRUD operations with API
 */

import { get, post, put, del } from './api';
import type { 
  ApiResponse, 
  Workspace, 
  CreateWorkspaceRequest, 
  UpdateWorkspaceRequest 
} from '@/types';

/**
 * Get all workspaces for the logged-in user
 * Requires authentication
 */
export async function getMyWorkspaces(): Promise<ApiResponse<Workspace[]>> {
  return get<Workspace[]>('/api/v1/workspace/my-workspaces');
}

/**
 * Create a new workspace
 * Requires authentication
 */
export async function createWorkspace(
  data: CreateWorkspaceRequest
): Promise<ApiResponse<Workspace>> {
  return post<Workspace>('/api/v1/workspace', data);
}

/**
 * Update a workspace
 * Requires authentication
 */
export async function updateWorkspace(
  id: number,
  data: UpdateWorkspaceRequest
): Promise<ApiResponse<Workspace>> {
  return put<Workspace>(`/api/v1/workspace/${id}`, data);
}

/**
 * Delete a workspace
 * Requires authentication
 */
export async function deleteWorkspace(id: number): Promise<ApiResponse<void>> {
  return del<void>(`/api/v1/workspace/${id}`);
}
