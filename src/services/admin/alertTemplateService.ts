import { API_ENDPOINTS } from '@/constants';
import { get, patch, post, put } from '@/services/api';
import type {
  AlertTemplateDto,
  AlertTemplatePlaceholdersDto,
  AlertTemplateUpsertRequest,
} from '@/types/alertTemplate';
import type { PaginatedData } from '@/types';

function requireData<T>(data: T | null | undefined, message: string): T {
  if (data === null || data === undefined) {
    throw new Error(message);
  }

  return data;
}

export interface AlertTemplateFilters {
  type?: string | null;
  condition?: string | null;
  isActive?: boolean | null;
  isDefault?: boolean | null;
  pageIndex?: number;
  pageSize?: number;
}

export async function getAlertTemplates(filters?: AlertTemplateFilters): Promise<PaginatedData<AlertTemplateDto>> {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.pageIndex) {
      params.append('pageIndex', filters.pageIndex.toString());
    }
    if (filters.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }
    if (filters.type !== null && filters.type !== undefined && filters.type !== '') {
      params.append('type', filters.type);
    }
    if (filters.condition !== null && filters.condition !== undefined && filters.condition !== '') {
      params.append('condition', filters.condition);
    }
    if (filters.isActive !== null && filters.isActive !== undefined) {
      params.append('isActive', String(filters.isActive));
    }
    if (filters.isDefault !== null && filters.isDefault !== undefined) {
      params.append('isDefault', String(filters.isDefault));
    }
  }

  const queryString = params.toString();
  const url = queryString ? `${API_ENDPOINTS.ALERTS.TEMPLATES}?${queryString}` : API_ENDPOINTS.ALERTS.TEMPLATES;
  const response = await get<unknown>(url);

  if (!response.isSuccess) {
    throw new Error(response.message || 'Không thể tải danh sách mẫu thông báo');
  }

  const data = requireData(response.data, 'Không thể tải danh sách mẫu thông báo');

  if (Array.isArray(data)) {
    return {
      items: data,
      pageIndex: filters?.pageIndex ?? 1,
      totalPages: 1,
      totalCount: data.length,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }

  if (typeof data === 'object' && data !== null) {
    const record = data as Partial<PaginatedData<AlertTemplateDto>>;
    if (Array.isArray(record.items)) {
      return {
        items: record.items,
        pageIndex: record.pageIndex ?? filters?.pageIndex ?? 1,
        totalPages: record.totalPages ?? 1,
        totalCount: record.totalCount ?? record.items.length,
        hasPreviousPage: record.hasPreviousPage ?? false,
        hasNextPage: record.hasNextPage ?? false,
      };
    }
  }

  throw new Error('Không thể tải danh sách mẫu thông báo');
}

export async function getAlertTemplateById(id: number): Promise<AlertTemplateDto> {
  const response = await get<AlertTemplateDto>(API_ENDPOINTS.ALERTS.TEMPLATE_BY_ID(id));

  return requireData(response.data, 'Không thể tải chi tiết mẫu thông báo');
}

export async function createAlertTemplate(
  payload: AlertTemplateUpsertRequest,
): Promise<AlertTemplateDto> {
  const response = await post<AlertTemplateDto>(API_ENDPOINTS.ALERTS.TEMPLATES, payload);

  return requireData(response.data, 'Không thể tạo mẫu thông báo');
}

export async function updateAlertTemplate(
  id: number,
  payload: AlertTemplateUpsertRequest,
): Promise<AlertTemplateDto> {
  const response = await put<AlertTemplateDto>(API_ENDPOINTS.ALERTS.TEMPLATE_BY_ID(id), payload);

  return requireData(response.data, 'Không thể cập nhật mẫu thông báo');
}

export async function toggleAlertTemplateStatus(id: number): Promise<AlertTemplateDto> {
  const response = await patch<AlertTemplateDto>(API_ENDPOINTS.ALERTS.TEMPLATE_STATUS(id), {});

  return requireData(response.data, 'Không thể đổi trạng thái mẫu thông báo');
}

export async function getAlertTemplatePlaceholders(): Promise<AlertTemplatePlaceholdersDto> {
  const response = await get<AlertTemplatePlaceholdersDto>(API_ENDPOINTS.ALERTS.PLACEHOLDERS);

  return requireData(response.data, 'Không thể tải danh sách placeholder');
}

const alertTemplateService = {
  getAlertTemplates,
  getAlertTemplateById,
  createAlertTemplate,
  updateAlertTemplate,
  toggleAlertTemplateStatus,
  getAlertTemplatePlaceholders,
};

export default alertTemplateService;