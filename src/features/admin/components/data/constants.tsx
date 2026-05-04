import { Database, Layers, ListTree, RotateCw } from 'lucide-react';
import type { DataTask } from './types';

export const DEFAULT_PAGE_SIZE = 10;

export const dataTasks: DataTask[] = [
  {
    id: 'import-sectors',
    title: 'Lấy danh sách ngành từ SSI',
    description: 'Gọi API lấy danh sách ngành từ SSI vào hệ thống.',
    icon: <Layers className="w-6 h-6" />,
    actionText: 'Lấy dữ liệu',
    iconBgClass: 'bg-blue-100 dark:bg-blue-900/40',
    iconTextClass: 'text-blue-700 dark:text-blue-300',
  },
  {
    id: 'import-symbols',
    title: 'Lấy mã chứng khoán từ SSI',
    description: 'Gọi API lấy danh sách mã chứng khoán từ SSI (phiên bản v2).',
    icon: <Database className="w-6 h-6" />,
    actionText: 'Lấy dữ liệu',
    iconBgClass: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconTextClass: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'map-symbols-sectors',
    title: 'Nối mã chứng khoán vào ngành',
    description: 'Nối các mã chứng khoán trong hệ thống vào ngành theo dữ liệu SSI.',
    icon: <RotateCw className="w-6 h-6" />,
    actionText: 'Lấy dữ liệu',
    iconBgClass: 'bg-purple-100 dark:bg-purple-900/40',
    iconTextClass: 'text-purple-700 dark:text-purple-300',
  },
  {
    id: 'import-index-constituents',
    title: 'Lấy chỉ số index và thành phần',
    description: 'Lấy danh sách index từ SSI và nối mã chứng khoán vào từng nhóm index.',
    icon: <ListTree className="w-6 h-6" />,
    actionText: 'Lấy dữ liệu',
    iconBgClass: 'bg-rose-100 dark:bg-rose-900/40',
    iconTextClass: 'text-rose-700 dark:text-rose-300',
  },
];
