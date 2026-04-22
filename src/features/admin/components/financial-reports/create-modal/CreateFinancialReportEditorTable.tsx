'use client';

import { Fragment } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { GroupNode } from './types';

interface CreateFinancialReportEditorTableProps {
  hasData: boolean;
  fetching: boolean;
  creating: boolean;
  rowsCount: number;
  groupedRows: GroupNode[];
  expandedGroups: Record<string, boolean>;
  expandedSubGroups: Record<string, boolean>;
  onToggleGroup: (groupKey: string) => void;
  onToggleSubGroup: (subGroupKey: string) => void;
  onRowValueChange: (id: string, newValue: string) => void;
  onCreateReport: () => void;
}

export default function CreateFinancialReportEditorTable({
  hasData,
  fetching,
  creating,
  rowsCount,
  groupedRows,
  expandedGroups,
  expandedSubGroups,
  onToggleGroup,
  onToggleSubGroup,
  onRowValueChange,
  onCreateReport,
}: CreateFinancialReportEditorTableProps) {
  return (
    <div className="w-full md:w-[68%] p-6 md:p-8 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-6 shrink-0 gap-3">
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Dữ liệu báo cáo tài chính</h4>
        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[0.625rem] font-bold rounded-full uppercase tracking-tighter">
          Live Editor
        </span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden border border-gray-200 dark:border-gray-700 rounded-lg custom-scrollbar">
        {!hasData && !fetching && (
          <div className="h-full min-h-64 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 px-6 text-center">
            Nhập mã chứng khoán, chọn năm và kỳ báo cáo, sau đó nhấn &quot;Lấy dữ liệu&quot; để hiển thị bảng chỉnh sửa.
          </div>
        )}

        {fetching && (
          <div className="h-full min-h-64 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Đang tải dữ liệu báo cáo...
          </div>
        )}

        {hasData && (
          <table className="w-full table-fixed text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="w-[20%] px-4 py-3 text-[0.6875rem] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Nhóm</th>
                <th className="w-[24%] px-4 py-3 text-[0.6875rem] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Nhóm con</th>
                <th className="w-[34%] px-4 py-3 text-[0.6875rem] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">Chỉ số</th>
                <th className="w-[22%] px-4 py-3 text-[0.6875rem] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700 text-right">Giá trị (tỷ đồng)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {groupedRows.map((group) => {
                const isGroupExpanded = expandedGroups[group.key] ?? true;

                return (
                  <Fragment key={`fragment-group-${group.key}`}>
                    <tr className="bg-gray-50/90 dark:bg-gray-700/40">
                      <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-gray-100 break-words align-top">
                        <button
                          type="button"
                          onClick={() => onToggleGroup(group.key)}
                          className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {isGroupExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          {group.groupLabel}
                        </button>
                      </td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                    </tr>

                    {isGroupExpanded && group.subGroups.map((subGroup) => {
                      const isSubGroupExpanded = expandedSubGroups[subGroup.key] ?? true;

                      return (
                        <Fragment key={`fragment-subgroup-${subGroup.key}`}>
                          <tr className="bg-gray-50/40 dark:bg-gray-700/20">
                            <td className="px-4 py-3" />
                            <td className="px-4 py-3 text-xs font-semibold text-gray-800 dark:text-gray-200 break-words align-top">
                              <button
                                type="button"
                                onClick={() => onToggleSubGroup(subGroup.key)}
                                className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {isSubGroupExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                {subGroup.subGroupLabel}
                              </button>
                            </td>
                            <td className="px-4 py-3" />
                            <td className="px-4 py-3" />
                          </tr>

                          {isSubGroupExpanded && subGroup.rows.map((row) => (
                            <tr key={row.id}>
                              <td className="px-4 py-3" />
                              <td className="px-4 py-3" />
                              <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-100 break-words align-top">{row.metricLabel}</td>
                              <td className="px-4 py-2">
                                <input
                                  value={row.inputValueInBillion}
                                  onChange={(event) => onRowValueChange(row.id, event.target.value)}
                                  className="w-full px-3 py-1.5 text-sm font-mono font-medium text-right text-gray-900 dark:text-gray-100 bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-500 focus:border-blue-500 focus:ring-0 rounded transition-all outline-none"
                                  type="text"
                                />
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-between items-center gap-3 shrink-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {hasData ? `Tổng cộng ${rowsCount} chỉ tiêu có thể chỉnh sửa` : 'Chưa có dữ liệu để tạo báo cáo'}
        </p>

        <button
          onClick={onCreateReport}
          disabled={!hasData || creating || fetching}
          className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{creating ? 'Đang tạo...' : 'Tạo báo cáo'}</span>
        </button>
      </div>
    </div>
  );
}
