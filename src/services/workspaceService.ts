/**
 * Workspace Service
 * Handles workspace CRUD operations with API
 */

import { get, post, put, del } from './api';
import { API_ENDPOINTS } from '@/constants';
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
  return get<Workspace[]>(API_ENDPOINTS.WORKSPACE.MY_WORKSPACES);
}

/**
 * Create a new workspace
 * Requires authentication
 */
export async function createWorkspace(
  data: CreateWorkspaceRequest
): Promise<ApiResponse<Workspace>> {
  return post<Workspace>(API_ENDPOINTS.WORKSPACE.BASE, data);
}

/**
 * Update a workspace
 * Requires authentication
 */
export async function updateWorkspace(
  id: number,
  data: UpdateWorkspaceRequest
): Promise<ApiResponse<Workspace>> {
  return put<Workspace>(API_ENDPOINTS.WORKSPACE.BY_ID(id), data);
}

/**
 * Delete a workspace
 * Requires authentication
 */
export async function deleteWorkspace(id: number): Promise<ApiResponse<void>> {
  return del<void>(API_ENDPOINTS.WORKSPACE.BY_ID(id));
}
