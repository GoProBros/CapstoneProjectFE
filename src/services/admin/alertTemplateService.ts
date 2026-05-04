import { API_ENDPOINTS } from '@/constants';
import { get, patch, post, put } from '@/services/api';
import type {
  AlertTemplateDto,
  AlertTemplatePlaceholdersDto,
  AlertTemplateUpsertRequest,
} from '@/types/alertTemplate';

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
}

export async function getAlertTemplates(filters?: AlertTemplateFilters): Promise<AlertTemplateDto[]> {
  const params = new URLSearchParams();
  
  if (filters) {
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
  const response = await get<AlertTemplateDto[]>(url);

  return requireData(response.data, 'Không thể tải danh sách alert template');
}

export async function getAlertTemplateById(id: number): Promise<AlertTemplateDto> {
  const response = await get<AlertTemplateDto>(API_ENDPOINTS.ALERTS.TEMPLATE_BY_ID(id));

  return requireData(response.data, 'Không thể tải chi tiết alert template');
}

export async function createAlertTemplate(
  payload: AlertTemplateUpsertRequest,
): Promise<AlertTemplateDto> {
  const response = await post<AlertTemplateDto>(API_ENDPOINTS.ALERTS.TEMPLATES, payload);

  return requireData(response.data, 'Không thể tạo alert template');
}

export async function updateAlertTemplate(
  id: number,
  payload: AlertTemplateUpsertRequest,
): Promise<AlertTemplateDto> {
  const response = await put<AlertTemplateDto>(API_ENDPOINTS.ALERTS.TEMPLATE_BY_ID(id), payload);

  return requireData(response.data, 'Không thể cập nhật alert template');
}

export async function toggleAlertTemplateStatus(id: number): Promise<AlertTemplateDto> {
  const response = await patch<AlertTemplateDto>(API_ENDPOINTS.ALERTS.TEMPLATE_STATUS(id), {});

  return requireData(response.data, 'Không thể đổi trạng thái alert template');
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