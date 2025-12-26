/**
 * Column Layout Types
 * Type definitions for column layout data and API responses
 */

import { ColumnConfig } from '@/stores/columnStore';

export interface ColumnLayoutData {
  name: string;
  columns: Record<string, ColumnConfig>;
  columnWidths?: any[];
  symbols?: string[];
  savedAt: string;
}

export interface ColumnLayoutResponse {
  success: boolean;
  message: string;
  data?: ColumnLayoutData;
}
