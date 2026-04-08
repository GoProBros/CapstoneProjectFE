/**
 * Workspace types and interfaces
 */

export enum WorkspaceType {
  Web = 1,
  Mobile = 2,
}

export interface Workspace {
  id: number;
  workspaceName: string;
  layoutJson: Record<string, unknown> | null;
  type: WorkspaceType;
  isDefault: boolean;
  shareCode?: string;
}

export interface CreateWorkspaceRequest {
  workspaceName: string;
  layoutJson: Record<string, unknown>;
  type: WorkspaceType;
  isDefault: boolean;
}

export interface UpdateWorkspaceRequest {
  workspaceId: number;
  workspaceName?: string;
  layoutJson?: Record<string, unknown>;
  isDefault?: boolean;
}
