/**
 * Layout Types - Interface definitions for module layout management
 * 
 * API Endpoints:
 * - GET /api/module-layouts?type={moduleType}
 * - POST /api/module-layouts
 * - GET /api/module-layouts/{id}
 * - PUT /api/module-layouts/{id}
 * - DELETE /api/module-layouts/{id}
 */

/**
 * Module Type enum - Backend uses numeric values
 */
export enum ModuleType {
  StockScreener = 1,
  // Add more module types as needed
  // Chart = 2,
  // OrderBook = 3,
}

/**
 * Column state for storing column configuration
 */
export interface ColumnConfig {
  field: string;
  visible: boolean;
  width?: number;
  order: number;
}

/**
 * Layout config JSON structure stored in backend
 */
export interface LayoutConfigJson {
  state: {
    columns: Record<string, ColumnConfig>;
  };
}

/**
 * Module Layout - Summary response (from GET /api/module-layouts?type=)
 * Used for listing available layouts
 */
export interface ModuleLayoutSummary {
  id: number;
  layoutName: string;
  moduleType: number;
  moduleTypeName: string;
  isSystemDefault: boolean;
  isPersonal: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Module Layout - Detail response (from GET /api/module-layouts/{id})
 * Includes full configJson
 */
export interface ModuleLayoutDetail {
  id: number;
  layoutName: string;
  moduleType: number;
  moduleTypeName: string;
  configJson: string; // JSON string from API, needs to be parsed
  isSystemDefault: boolean;
  isPersonal: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parsed Module Layout Detail (after JSON parsing)
 */
export interface ParsedModuleLayoutDetail extends Omit<ModuleLayoutDetail, 'configJson'> {
  configJson: LayoutConfigJson; // Parsed object
}

/**
 * Create Layout Request body
 * POST /api/module-layouts
 */
export interface CreateLayoutRequest {
  layoutName: string;
  moduleType: number;
  configJson: string; // JSON stringified LayoutConfigJson
  isSystemDefault: boolean;
}

/**
 * Create Layout Response
 */
export interface CreateLayoutResponse {
  id: number;
  layoutName: string;
  moduleType: number;
  moduleTypeName: string;
  configJson: string;
  isSystemDefault: boolean;
  isPersonal: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update Layout Request body
 * PUT /api/module-layouts/{id}
 */
export interface UpdateLayoutRequest {
  id: number;
  layoutName: string;
  configJson: string; // JSON stringified LayoutConfigJson
  isSystemDefault: boolean;
}

// ============================================
// Legacy interfaces - kept for backward compatibility
// TODO: Remove after migration complete
// ============================================

export interface ColumnState {
  colId: string;
  width?: number;
  hide?: boolean;
  pinned?: 'left' | 'right' | null;
  sort?: 'asc' | 'desc' | null;
  sortIndex?: number;
}

export interface FilterState {
  exchange?: string;
  symbolType?: string;
  symbols?: string[];
}

