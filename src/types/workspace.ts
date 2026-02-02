/**
 * Workspace types and interfaces
 */

export interface Workspace {
  id: number;
  workspaceName: string;
  layoutJson: Record<string, any>;
  isDefault: boolean;
  shareCode?: string;
}

export interface CreateWorkspaceRequest {
  workspaceName: string;
  layoutJson: Record<string, any>;
  isDefault: boolean;
}

export interface UpdateWorkspaceRequest {
  workspaceId: string;
  workspaceName: string;
  layoutJson: Record<string, any>;
  isDefault: boolean;
}
