'use client';

import { PencilLine } from 'lucide-react';
import type { AlertTemplateDto } from '@/types/alertTemplate';
import { formatDateTime, getConditionLabel, getTypeLabel, sortTemplates } from './alertTemplateUtils';

interface AlertTemplatesTableProps {
  templates: AlertTemplateDto[];
  loading: boolean;
  error: string | null;
  statusLoadingMap: Record<number, boolean>;
  filterType: string;
  filterCondition: string;
  filterIsActive: string;
  filterIsDefault: string;
  onFilterChange: (filterName: string, value: string) => void;
  onClearFilters: () => void;
  onEdit: (templateId: number) => void;
  onToggleStatus: (templateId: number) => void;
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

export default function AlertTemplatesTable({
  templates,
  loading,
  error,
  statusLoadingMap,
  filterType,
  filterCondition,
  filterIsActive,
  filterIsDefault,
  onFilterChange,
  onClearFilters,
  onEdit,
  onToggleStatus,
}: AlertTemplatesTableProps) {
  const sortedTemplates = sortTemplates(templates);

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Danh sách mẫu cảnh báo </h3>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {templates.length} mẫu
          </span>
        </div>

        {/* Filter Section */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-3">
          <select
            value={filterType}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Tất cả loại</option>
            <option value="1">Giá</option>
            <option value="2">Khối lượng</option>
          </select>

          <select
            value={filterCondition}
            onChange={(e) => onFilterChange('condition', e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Tất cả điều kiện</option>
            <option value="1">Trên ngưỡng</option>
            <option value="2">Dưới ngưỡng</option>
            <option value="3">Tăng %</option>
            <option value="4">Giảm %</option>
          </select>

          <select
            value={filterIsActive}
            onChange={(e) => onFilterChange('isActive', e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Bật</option>
            <option value="false">Tắt</option>
          </select>

          <select
            value={filterIsDefault}
            onChange={(e) => onFilterChange('isDefault', e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Tất cả template</option>
            <option value="true">Mặc định</option>
            <option value="false">Không mặc định</option>
          </select>
        </div>

        {(filterType || filterCondition || filterIsActive || filterIsDefault) && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="px-5 py-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tiêu đề</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Loại / Điều kiện</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trạng thái</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mặc định</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cập nhật</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500 dark:text-gray-400" colSpan={7}>
                  Đang tải danh sách alert template...
                </td>
              </tr>
            ) : sortedTemplates.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500 dark:text-gray-400" colSpan={7}>
                  Chưa có alert template nào.
                </td>
              </tr>
            ) : (
              sortedTemplates.map((template) => {
                const isStatusLoading = Boolean(statusLoadingMap[template.id]);

                return (
                  <tr
                    key={template.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    onClick={() => onEdit(template.id)}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{template.id}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      <div className="space-y-1">
                        <p className="font-medium">{template.titleTemplate}</p>
                        <p className="max-w-[420px] text-xs text-gray-500 dark:text-gray-400">
                          {truncateText(template.bodyTemplate, 40)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      <div className="space-y-1 text-xs">
                        <p>
                          <span className="font-semibold text-gray-900 dark:text-white">Loại:</span> {getTypeLabel(template.type)}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900 dark:text-white">Điều kiện:</span> {getConditionLabel(template.condition)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleStatus(template.id);
                        }}
                        disabled={isStatusLoading}
                        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          template.isActive
                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {isStatusLoading ? 'Đang cập nhật...' : template.isActive ? 'Đang bật' : 'Đang tắt'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        template.isDefault
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700/40 dark:text-gray-300'
                      }`}>
                        {template.isDefault ? 'Mặc định' : 'Không'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(template.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(template.id);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <PencilLine className="h-3.5 w-3.5" />
                        Sửa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}