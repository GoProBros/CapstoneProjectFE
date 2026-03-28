'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FilePlus, X } from 'lucide-react';
import {
  createFinancialReport,
  fetchSpecificFinancialReportData,
} from '@/services/financialReportService';
import { FinancialPeriodType } from '@/types/financialReport';
import CreateFinancialReportEditorTable from './create-modal/CreateFinancialReportEditorTable';
import CreateFinancialReportFiltersPanel from './create-modal/CreateFinancialReportFiltersPanel';
import { QUARTER_OPTIONS } from './create-modal/constants';
import { buildEditableRows, cloneDeep, parseBillionToDong, setNestedValue } from './create-modal/utils';
import {
  CreateFinancialReportModalProps,
  EditableMetricRow,
  GroupNode,
  JsonRecord,
} from './create-modal/types';

export default function CreateFinancialReportModal({
  isOpen,
  onClose,
  onCreated,
}: CreateFinancialReportModalProps) {
  const currentYear = new Date().getFullYear();

  const yearOptions = useMemo(
    () => Array.from({ length: 11 }, (_, index) => currentYear - index),
    [currentYear]
  );

  const [ticker, setTicker] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<FinancialPeriodType>(FinancialPeriodType.FirstQuarter);

  const [reportData, setReportData] = useState<JsonRecord | null>(null);
  const [rows, setRows] = useState<EditableMetricRow[]>([]);

  const [fetching, setFetching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccessMessage, setCreateSuccessMessage] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedSubGroups, setExpandedSubGroups] = useState<Record<string, boolean>>({});

  const hasData = rows.length > 0;

  const groupedRows = useMemo<GroupNode[]>(() => {
    const groupMap = new Map<string, GroupNode>();

    rows.forEach((row) => {
      const groupKey = row.groupLabel;
      const subGroupKey = `${row.groupLabel}__${row.subGroupLabel}`;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          key: groupKey,
          groupLabel: row.groupLabel,
          subGroups: [],
        });
      }

      const groupNode = groupMap.get(groupKey);
      if (!groupNode) {
        return;
      }

      const foundSubGroup = groupNode.subGroups.find((subGroup) => subGroup.key === subGroupKey);

      if (foundSubGroup) {
        foundSubGroup.rows.push(row);
      } else {
        groupNode.subGroups.push({
          key: subGroupKey,
          subGroupLabel: row.subGroupLabel,
          rows: [row],
        });
      }
    });

    return Array.from(groupMap.values());
  }, [rows]);

  useEffect(() => {
    const nextExpandedGroups: Record<string, boolean> = {};
    const nextExpandedSubGroups: Record<string, boolean> = {};

    groupedRows.forEach((group) => {
      nextExpandedGroups[group.key] = true;
      group.subGroups.forEach((subGroup) => {
        nextExpandedSubGroups[subGroup.key] = true;
      });
    });

    setExpandedGroups(nextExpandedGroups);
    setExpandedSubGroups(nextExpandedSubGroups);
  }, [groupedRows]);

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }, []);

  const toggleSubGroup = useCallback((subGroupKey: string) => {
    setExpandedSubGroups((prev) => ({
      ...prev,
      [subGroupKey]: !prev[subGroupKey],
    }));
  }, []);

  const onFetchData = useCallback(async () => {
    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) {
      setFetchError('Vui lòng nhập mã chứng khoán.');
      return;
    }

    setFetching(true);
    setFetchError(null);
    setCreateError(null);
    setCreateSuccessMessage(null);

    try {
      const data = await fetchSpecificFinancialReportData({
        ticker: normalizedTicker,
        year: selectedYear,
        quarter: selectedQuarter,
      });

      const editableRows = buildEditableRows(data);

      if (editableRows.length === 0) {
        setReportData(data);
        setRows([]);
        setFetchError('Không có dữ liệu số để hiển thị cho kỳ đã chọn.');
        return;
      }

      setTicker(normalizedTicker);
      setReportData(data);
      setRows(editableRows);
    } catch (error) {
      setReportData(null);
      setRows([]);
      setFetchError(error instanceof Error ? error.message : 'Không thể lấy dữ liệu báo cáo tài chính.');
    } finally {
      setFetching(false);
    }
  }, [selectedQuarter, selectedYear, ticker]);

  const onRowValueChange = useCallback((id: string, newValue: string) => {
    setRows((prevRows) => prevRows.map((row) => {
      if (row.id !== id) {
        return row;
      }

      const parsedInDong = parseBillionToDong(newValue);

      return {
        ...row,
        inputValueInBillion: newValue,
        valueInDong: parsedInDong ?? row.valueInDong,
      };
    }));
  }, []);

  const onCreateReport = useCallback(async () => {
    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) {
      setCreateError('Vui lòng nhập mã chứng khoán.');
      return;
    }

    if (!reportData || rows.length === 0) {
      setCreateError('Vui lòng lấy dữ liệu trước khi tạo báo cáo.');
      return;
    }

    const payloadReportData = cloneDeep(reportData);

    for (const row of rows) {
      const parsedInDong = parseBillionToDong(row.inputValueInBillion);
      if (parsedInDong === null) {
        setCreateError(`Giá trị không hợp lệ tại chỉ tiêu: ${row.metricLabel}`);
        return;
      }

      setNestedValue(payloadReportData, row.path, parsedInDong);
    }

    setCreating(true);
    setCreateError(null);
    setCreateSuccessMessage(null);

    try {
      await createFinancialReport({
        ticker: normalizedTicker,
        year: selectedYear,
        quarter: selectedQuarter,
        period: selectedQuarter,
        reportData: payloadReportData,
      });

      setCreateSuccessMessage('Tạo báo cáo tài chính thành công.');
      onCreated?.();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Không thể tạo báo cáo tài chính.');
    } finally {
      setCreating(false);
    }
  }, [onCreated, reportData, rows, selectedQuarter, selectedYear, ticker]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[92vh]">
        <div className="px-6 md:px-8 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center rounded-full text-blue-600 dark:text-blue-400">
              <FilePlus className="w-5 h-5" />
            </div>
            <h3 className="text-lg md:text-xl font-extrabold font-headline text-gray-900 dark:text-gray-100">Tạo báo cáo tài chính mới</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500 transition-colors"
            aria-label="Đóng"
            disabled={creating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          <CreateFinancialReportFiltersPanel
            ticker={ticker}
            selectedYear={selectedYear}
            selectedQuarter={selectedQuarter}
            yearOptions={yearOptions}
            quarterOptions={QUARTER_OPTIONS}
            fetching={fetching}
            creating={creating}
            fetchError={fetchError}
            createError={createError}
            createSuccessMessage={createSuccessMessage}
            onTickerChange={setTicker}
            onYearChange={setSelectedYear}
            onQuarterChange={setSelectedQuarter}
            onFetchData={onFetchData}
            onClose={onClose}
          />

          <CreateFinancialReportEditorTable
            hasData={hasData}
            fetching={fetching}
            creating={creating}
            rowsCount={rows.length}
            groupedRows={groupedRows}
            expandedGroups={expandedGroups}
            expandedSubGroups={expandedSubGroups}
            onToggleGroup={toggleGroup}
            onToggleSubGroup={toggleSubGroup}
            onRowValueChange={onRowValueChange}
            onCreateReport={onCreateReport}
          />
        </div>
      </div>
    </div>
  );
}
