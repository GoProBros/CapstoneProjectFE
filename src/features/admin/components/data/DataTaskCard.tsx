import { RefreshCw } from 'lucide-react';
import type { DataFetchTaskType } from '@/types/systemData';
import type { DataTask, TaskStatus } from './types';
import { getStatusClass, getStatusLabel } from './utils';

interface DataTaskCardProps extends DataTask {
  taskStatus: TaskStatus;
  taskResult: string | null;
  onRun: (taskId: DataFetchTaskType) => Promise<void>;
}

export default function DataTaskCard({
  id,
  title,
  description,
  icon,
  actionText,
  iconBgClass,
  iconTextClass,
  taskStatus,
  taskResult,
  onRun,
}: DataTaskCardProps) {
  const isLoading = taskStatus === 'loading';

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl flex flex-col justify-between shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:-translate-y-0.5">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-lg ${iconBgClass} ${iconTextClass}`}>{icon}</div>
        {taskStatus !== 'idle' && (
          <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${getStatusClass(taskStatus)}`}>
            {getStatusLabel(taskStatus)}
          </span>
        )}
      </div>

      <div>
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">{description}</p>

        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 min-h-[68px] text-xs text-slate-600 dark:text-slate-300">
          {taskResult ?? 'Chưa chạy tác vụ.'}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRun(id)}
        disabled={isLoading}
        className={`mt-6 w-full py-2 rounded text-xs font-bold transition-colors uppercase tracking-widest ${
          isLoading
            ? 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 cursor-not-allowed'
            : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90'
        }`}
      >
        <span className="inline-flex items-center gap-2">
          {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
          {isLoading ? 'Đang fetch...' : actionText}
        </span>
      </button>
    </div>
  );
}
