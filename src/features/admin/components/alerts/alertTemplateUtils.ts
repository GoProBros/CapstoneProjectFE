import type { AlertTemplateDto } from '@/types/alertTemplate';
import type { TemplateFormState } from './types';

export function formatDateTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  return parsed.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTypeLabel(value: number | null): string {
  if (value === 1) return 'Giá';
  if (value === 2) return 'Khối lượng';
  return '—';
}

export function getConditionLabel(value: number | null): string {
  if (value === 1) return 'Trên ngưỡng';
  if (value === 2) return 'Dưới ngưỡng';
  if (value === 3) return 'Tăng %';
  if (value === 4) return 'Giảm %';
  return '—';
}

export function sortTemplates(templates: AlertTemplateDto[]): AlertTemplateDto[] {
  return [...templates].sort((left, right) => {
    if (left.isDefault !== right.isDefault) {
      return left.isDefault ? -1 : 1;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function mapTemplateToForm(template: AlertTemplateDto): TemplateFormState {
  return {
    type: template.type === null ? '' : String(template.type),
    condition: template.condition === null ? '' : String(template.condition),
    titleTemplate: template.titleTemplate,
    bodyTemplate: template.bodyTemplate,
    isActive: template.isActive,
    isDefault: template.isDefault,
  };
}