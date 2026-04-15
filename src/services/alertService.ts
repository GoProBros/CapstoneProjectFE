import { API_ENDPOINTS } from '@/constants';
import { get, patch, post } from '@/services/api';
import type { PaginatedData } from '@/types';
import type {
  AlertDto,
  AlertQueryParams,
  CreateAlertRequest,
} from '@/types/alert';

export async function getMyAlerts(
  query: AlertQueryParams,
): Promise<PaginatedData<AlertDto>> {
  const params = new URLSearchParams();

  params.set('PageIndex', String(query.pageIndex ?? 1));
  params.set('PageSize', String(query.pageSize ?? 10));

  if (query.type !== undefined) {
    params.set('Type', String(query.type));
  }

  if (query.condition !== undefined) {
    params.set('Condition', String(query.condition));
  }

  const result = await get<PaginatedData<AlertDto>>(
    `${API_ENDPOINTS.ALERTS.BASE}?${params.toString()}`,
  );

  if (!result.data) {
    throw new Error(result.message || 'Không lấy được danh sách cảnh báo');
  }

  return result.data;
}

export async function getAlertById(id: number): Promise<AlertDto> {
  const result = await get<AlertDto>(API_ENDPOINTS.ALERTS.BY_ID(id));

  if (!result.data) {
    throw new Error(result.message || 'Không lấy được chi tiết cảnh báo');
  }

  return result.data;
}

export async function createAlert(
  payload: CreateAlertRequest,
): Promise<AlertDto> {
  const result = await post<AlertDto>(API_ENDPOINTS.ALERTS.BASE, payload);

  if (!result.data) {
    throw new Error(result.message || 'Không thể tạo cảnh báo');
  }

  return result.data;
}

export async function toggleAlertStatus(id: number): Promise<AlertDto> {
  const result = await patch<AlertDto>(API_ENDPOINTS.ALERTS.STATUS(id), {});

  if (!result.data) {
    throw new Error(result.message || 'Không thể đổi trạng thái cảnh báo');
  }

  return result.data;
}