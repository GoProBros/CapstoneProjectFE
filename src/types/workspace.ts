/**
 * Workspace types and interfaces
 */

export interface Workspace {
  id: number;
  workspaceName: string;
  layoutJson: string;
  isDefault: boolean;
  shareCode?: string;
}

export interface CreateWorkspaceRequest {
  workspaceName: string;
  layoutJson: string;
  isDefault: boolean;
}

export interface UpdateWorkspaceRequest {
  workspaceId: string;
  workspaceName: string;
  layoutJson: string;
  isDefault: boolean;
}
