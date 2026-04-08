/**
 * Workspace Service
 * Handles workspace CRUD operations with API
 */

import { get, post, put, del } from './api';
import { API_ENDPOINTS } from '@/constants';
import type { 
  ApiResponse, 
  PaginatedData,
  Workspace, 
  CreateWorkspaceRequest, 
  UpdateWorkspaceRequest 
} from '@/types';

interface MyWorkspacesPayload {
  webWorkspaces?: Workspace[];
  mobileWorkspaces?: Workspace[];
  WebWorkspaces?: Workspace[];
  MobileWorkspaces?: Workspace[];
  workspaces?: Workspace[];
}

function isWorkspaceArray(data: unknown): data is Workspace[] {
  return Array.isArray(data);
}

function isWorkspacePaginatedData(data: unknown): data is PaginatedData<Workspace> {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const maybePaginated = data as Partial<PaginatedData<Workspace>>;
  return Array.isArray(maybePaginated.items);
}

function isMyWorkspacesPayload(data: unknown): data is MyWorkspacesPayload {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const payload = data as MyWorkspacesPayload;
  return (
    Array.isArray(payload.webWorkspaces) ||
    Array.isArray(payload.WebWorkspaces) ||
    Array.isArray(payload.workspaces) ||
    Array.isArray(payload.mobileWorkspaces) ||
    Array.isArray(payload.MobileWorkspaces)
  );
}

function normalizeWorkspaceList(data: unknown): Workspace[] {
  if (isWorkspaceArray(data)) {
    return data;
  }

  if (isWorkspacePaginatedData(data)) {
    return data.items;
  }

  if (isMyWorkspacesPayload(data)) {
    if (Array.isArray(data.webWorkspaces)) {
      return data.webWorkspaces;
    }

    if (Array.isArray(data.WebWorkspaces)) {
      return data.WebWorkspaces;
    }

    if (Array.isArray(data.workspaces)) {
      return data.workspaces;
    }

    // Fallback for unexpected payloads that only expose mobile data.
    if (Array.isArray(data.mobileWorkspaces)) {
      return data.mobileWorkspaces;
    }

    if (Array.isArray(data.MobileWorkspaces)) {
      return data.MobileWorkspaces;
    }
  }

  return [];
}

/**
 * Get all workspaces for the logged-in user
 * Requires authentication
 */
export async function getMyWorkspaces(): Promise<ApiResponse<Workspace[]>> {
  const response = await get<Workspace[] | PaginatedData<Workspace> | MyWorkspacesPayload>(
    API_ENDPOINTS.WORKSPACE.MY_WORKSPACES
  );

  return {
    ...response,
    data: normalizeWorkspaceList(response.data),
  };
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

/**
 * Apply a shared workspace via shareCode
 * Creates a new workspace based on the shared workspace
 * Requires authentication
 */
export async function applySharedWorkspace(
  shareCode: string
): Promise<ApiResponse<Workspace>> {
  return post<Workspace>(API_ENDPOINTS.WORKSPACE.APPLY(shareCode), {});
}
