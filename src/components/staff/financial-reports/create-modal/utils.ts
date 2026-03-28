import { DONG_PER_BILLION, FIELD_LABELS } from './constants';
import { EditableMetricRow, JsonRecord } from './types';

export function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function humanizeKey(key: string): string {
  if (FIELD_LABELS[key]) {
    return FIELD_LABELS[key];
  }

  const fallback = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();

  return fallback.charAt(0).toUpperCase() + fallback.slice(1);
}

export function formatBillionFromDong(valueInDong: number): string {
  const valueInBillion = valueInDong / DONG_PER_BILLION;

  return valueInBillion.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

export function parseBillionToDong(valueInBillion: string): number | null {
  const normalized = valueInBillion.trim().replace(/\s+/g, '').replace(/,/g, '');

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * DONG_PER_BILLION);
}

export function buildEditableRows(data: JsonRecord): EditableMetricRow[] {
  const rows: EditableMetricRow[] = [];

  const walk = (node: unknown, path: string[] = []) => {
    if (!isJsonRecord(node)) {
      return;
    }

    Object.entries(node).forEach(([key, value]) => {
      const nextPath = [...path, key];

      if (typeof value === 'number' || value === null) {
        const groupLabel = humanizeKey(nextPath[0] ?? key);
        const subGroupLabel = nextPath[1] ? humanizeKey(nextPath[1]) : '-';
        const detailPath = nextPath.slice(2);
        const metricLabel = detailPath.length > 0
          ? detailPath.map(humanizeKey).join(' / ')
          : humanizeKey(nextPath[nextPath.length - 1]);

        rows.push({
          id: nextPath.join('.'),
          path: nextPath,
          groupLabel,
          subGroupLabel,
          metricLabel,
          valueInDong: typeof value === 'number' ? value : 0,
          inputValueInBillion: typeof value === 'number' ? formatBillionFromDong(value) : '',
        });

        return;
      }

      walk(value, nextPath);
    });
  };

  walk(data);
  return rows;
}

export function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function setNestedValue(obj: JsonRecord, path: string[], value: unknown): void {
  let current: JsonRecord = obj;

  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    const next = current[key];

    if (!isJsonRecord(next)) {
      current[key] = {};
    }

    current = current[key] as JsonRecord;
  }

  current[path[path.length - 1]] = value;
}
