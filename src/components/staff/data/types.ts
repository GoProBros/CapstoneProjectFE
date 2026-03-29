import type { ReactNode } from 'react';
import type { DataFetchTaskType } from '@/services/systemDataService';

export type TaskStatus = 'idle' | 'loading' | 'success' | 'failed';

export interface DataTask {
  id: DataFetchTaskType;
  title: string;
  description: string;
  icon: ReactNode;
  actionText: string;
  iconBgClass: string;
  iconTextClass: string;
}

export interface FetchLogsArgs {
  nextPageIndex: number;
  nextDate?: string;
  nextLevel?: string;
  nextSearchTerm?: string;
}
