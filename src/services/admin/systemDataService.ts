import { get, post } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type { PaginatedData } from '@/types';
import type { DataFetchTaskType, GetSystemLogsParams, SystemLogItem } from '@/types/systemData';

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
  // Build query string using encodeURIComponent and align to Swagger style: use 'search' param
  const parts: string[] = [];
  if (params.date) parts.push(`date=${encodeURIComponent(params.date)}`);
  if (params.pageIndex) parts.push(`pageIndex=${params.pageIndex.toString()}`);
  if (params.pageSize) parts.push(`pageSize=${params.pageSize.toString()}`);
  if (params.searchTerm) parts.push(`search=${encodeURIComponent(params.searchTerm)}`);
  if (params.level) parts.push(`level=${encodeURIComponent(params.level ?? '')}`);

  const queryString = parts.filter(Boolean).join('&');
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
