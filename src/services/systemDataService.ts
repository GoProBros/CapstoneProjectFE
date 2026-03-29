import { get, post } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type { PaginatedData } from '@/types';

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

const endpointByTask: Record<DataFetchTaskType, string> = {
  'import-sectors': API_ENDPOINTS.DATA_FETCHING.IMPORT_SECTORS_FROM_SSI,
  'import-symbols': API_ENDPOINTS.DATA_FETCHING.IMPORT_SYMBOLS_FROM_SSI,
  'map-symbols-sectors': API_ENDPOINTS.DATA_FETCHING.MAP_SYMBOLS_SECTORS_FROM_SSI,
  'import-index-constituents': API_ENDPOINTS.DATA_FETCHING.IMPORT_INDEX_CONSTITUENTS_FROM_SSI,
};

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item : String(item ?? '')))
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLogDatesData(data: unknown): string[] {
  if (Array.isArray(data)) {
    return ensureStringArray(data);
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    return ensureStringArray(record.items ?? record.dates ?? record.data);
  }

  return [];
}

function ensureNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function normalizePaginatedLogs(data: unknown): PaginatedData<SystemLogItem> {
  const base: PaginatedData<SystemLogItem> = {
    items: [],
    pageIndex: 1,
    totalPages: 1,
    totalCount: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  if (!data || typeof data !== 'object') {
    return base;
  }

  const record = data as Record<string, unknown>;
  const items = Array.isArray(record.items)
    ? (record.items.filter((item): item is SystemLogItem => !!item && typeof item === 'object'))
    : [];

  const pageIndex = ensureNumber(record.pageIndex, base.pageIndex);
  const totalPages = Math.max(1, ensureNumber(record.totalPages, base.totalPages));
  const totalCount = ensureNumber(record.totalCount, items.length);

  return {
    items,
    pageIndex,
    totalPages,
    totalCount,
    hasPreviousPage: pageIndex > 1,
    hasNextPage: pageIndex < totalPages,
  };
}

export async function runDataFetchTask(taskType: DataFetchTaskType): Promise<string> {
  const endpoint = endpointByTask[taskType];
  const response = await post<unknown>(endpoint, {});

  if (!response.isSuccess) {
    throw new Error(response.message || 'Thao tác fetch dữ liệu thất bại');
  }

  return response.message || 'Thao tác hoàn tất thành công';
}

export async function getLogDates(): Promise<string[]> {
  const response = await get<unknown>(API_ENDPOINTS.LOGS.DATES);

  if (!response.isSuccess) {
    throw new Error(response.message || 'Không thể tải danh sách ngày log');
  }

  return parseLogDatesData(response.data);
}

export async function getSystemLogs(
  params: GetSystemLogsParams = {}
): Promise<PaginatedData<SystemLogItem>> {
  const queryParams = new URLSearchParams();

  if (params.date) queryParams.append('date', params.date);
  if (params.pageIndex) queryParams.append('pageIndex', params.pageIndex.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
  if (params.level) queryParams.append('level', params.level);

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `${API_ENDPOINTS.LOGS.BASE}?${queryString}`
    : API_ENDPOINTS.LOGS.BASE;

  const response = await get<unknown>(endpoint);

  if (!response.isSuccess) {
    throw new Error(response.message || 'Không thể tải danh sách log');
  }

  return normalizePaginatedLogs(response.data);
}

const systemDataService = {
  runDataFetchTask,
  getLogDates,
  getSystemLogs,
};

export default systemDataService;
