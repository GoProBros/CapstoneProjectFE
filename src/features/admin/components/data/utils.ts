import type { SystemLogItem } from '@/types/systemData';
import type { TaskStatus } from './types';

export function getStatusLabel(status: TaskStatus) {
  if (status === 'loading') return 'Đang chạy';
  if (status === 'success') return 'Thành công';
  if (status === 'failed') return 'Thất bại';
  return 'Sẵn sàng';
}

export function getStatusClass(status: TaskStatus) {
  if (status === 'loading') {
    return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300';
  }

  if (status === 'success') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  }

  if (status === 'failed') {
    return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  }

  return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
}

export function readLogValue(log: SystemLogItem, keys: string[]) {
  for (const key of keys) {
    const value = log[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return '--';
}

export function formatUtcToSystemTime(value: string) {
  if (!value || value === '--') {
    return '--';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(parsed);
}
