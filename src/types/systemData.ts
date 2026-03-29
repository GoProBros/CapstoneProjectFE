export type DataFetchTaskType =
  | 'import-sectors'
  | 'import-symbols'
  | 'map-symbols-sectors'
  | 'import-index-constituents';

export interface SystemLogItem {
  timestamp?: string;
  level?: string;
  message?: string;
  exception?: string;
  source?: string;
  [key: string]: unknown;
}

export interface GetSystemLogsParams {
  date?: string;
  pageIndex?: number;
  pageSize?: number;
  searchTerm?: string;
  level?: string;
}