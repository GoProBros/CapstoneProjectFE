'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Download, RefreshCw, Upload, X } from 'lucide-react';
import {
  fetchFinancialReportById,
  updateFinancialReport,
} from '@/services/financial/financialReportService';
import fileService from '@/services/files/fileService';
import { FileCategory } from '@/types/file';
import { FinancialReport } from '@/types/financialReport';
import { formatDateTime, getPeriodLabel, getStatusClass, getStatusLabel } from './reportPresentation';
import {
  buildEditableRows,
  cloneDeep,
  parseBillionToDong,
  setNestedValue,
} from './create-modal/utils';
import { EditableMetricRow, JsonRecord } from './create-modal/types';

interface FinancialReportDetailModalProps {
  reportId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function FinancialReportDetailModal({
  reportId,
  isOpen,
  onClose,
  onUpdated,
}: FinancialReportDetailModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [rows, setRows] = useState<EditableMetricRow[]>([]);
  const [originalRows, setOriginalRows] = useState<EditableMetricRow[]>([]);
  const [metricKeyword, setMetricKeyword] = useState('');

  const hasData = rows.length > 0;

  const cloneRows = useCallback((source: EditableMetricRow[]): EditableMetricRow[] => {
    return source.map((row) => ({
      ...row,
      path: [...row.path],
    }));
  }, []);

  const groupedRows = useMemo(() => {
    const groups = new Map<string, Map<string, EditableMetricRow[]>>();

    rows.forEach((row) => {
      if (!groups.has(row.groupLabel)) {
        groups.set(row.groupLabel, new Map<string, EditableMetricRow[]>());
      }

      const subGroupMap = groups.get(row.groupLabel)!;
      if (!subGroupMap.has(row.subGroupLabel)) {
        subGroupMap.set(row.subGroupLabel, []);
      }

      subGroupMap.get(row.subGroupLabel)!.push(row);
    });

    return Array.from(groups.entries()).map(([groupLabel, subGroupMap]) => ({
      groupLabel,
      subGroups: Array.from(subGroupMap.entries()).map(([subGroupLabel, metrics]) => ({
        subGroupLabel,
        metrics,
      })),
    }));
  }, [rows]);

  const normalizedMetricKeyword = metricKeyword.trim().toLowerCase();

  const filteredGroupedRows = useMemo(() => {
    if (!normalizedMetricKeyword) {
      return groupedRows;
    }

    return groupedRows
      .map((group) => {
        const filteredSubGroups = group.subGroups
          .map((subGroup) => ({
            ...subGroup,
            metrics: subGroup.metrics.filter((metric) => {
              const haystack = `${group.groupLabel} ${subGroup.subGroupLabel} ${metric.metricLabel}`.toLowerCase();
              return haystack.includes(normalizedMetricKeyword);
            }),
          }))
          .filter((subGroup) => subGroup.metrics.length > 0);

        return {
          ...group,
          subGroups: filteredSubGroups,
        };
      })
      .filter((group) => group.subGroups.length > 0);
  }, [groupedRows, normalizedMetricKeyword]);

  const invalidRowIds = useMemo(() => {
    const invalidIds = new Set<string>();

    rows.forEach((row) => {
      if (!row.inputValueInBillion.trim()) {
        return;
      }

      if (parseBillionToDong(row.inputValueInBillion) === null) {
        invalidIds.add(row.id);
      }
    });

    return invalidIds;
  }, [rows]);

  const hasInvalidInputs = invalidRowIds.size > 0;

  const hasUnsavedChanges = useMemo(() => {
    if (rows.length !== originalRows.length) {
      return true;
    }

    const originalMap = new Map(originalRows.map((row) => [row.id, row.inputValueInBillion]));
    return rows.some((row) => originalMap.get(row.id) !== row.inputValueInBillion);
  }, [originalRows, rows]);

  const onRowValueChange = useCallback((id: string, newValue: string) => {
    setUpdateError(null);
    setUpdateSuccess(null);

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

  const onUpdateReport = useCallback(async () => {
    if (!reportId || !report) {
      setUpdateError('Không tìm thấy báo cáo để cập nhật.');
      return;
    }

    const payloadReportData = cloneDeep(report.reportData) as unknown as JsonRecord;

    for (const row of rows) {
      if (!row.inputValueInBillion.trim()) {
        setNestedValue(payloadReportData, row.path, null);
        continue;
      }

      const parsedInDong = parseBillionToDong(row.inputValueInBillion);

      if (parsedInDong === null) {
        setUpdateError(`Giá trị không hợp lệ tại chỉ số: ${row.metricLabel}`);
        return;
      }

      setNestedValue(payloadReportData, row.path, parsedInDong);
    }

    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      const updated = await updateFinancialReport(reportId, {
        reportData: payloadReportData,
      });

      const nextRows = buildEditableRows(updated.reportData as unknown as JsonRecord);
      setReport(updated);
      setRows(nextRows);
      setOriginalRows(cloneRows(nextRows));
      setUpdateSuccess('Cập nhật báo cáo tài chính thành công.');
      onUpdated?.();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Không thể cập nhật báo cáo tài chính.');
    } finally {
      setUpdating(false);
    }
  }, [cloneRows, onUpdated, report, reportId, rows]);

  const onResetChanges = useCallback(() => {
    setRows(cloneRows(originalRows));
    setUpdateError(null);
    setUpdateSuccess(null);
  }, [cloneRows, originalRows]);

  const onRequestClose = useCallback(() => {
    if (updating) {
      return;
    }

    if (hasUnsavedChanges) {
      const shouldClose = window.confirm('Bạn có thay đổi chưa lưu. Đóng modal và bỏ thay đổi?');
      if (!shouldClose) {
        return;
      }
    }

    onClose();
  }, [hasUnsavedChanges, onClose, updating]);

  const onUploadFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onUploadFile = useCallback(async (file: File) => {
    if (!reportId) {
      setUpdateError('Không tìm thấy báo cáo để upload file.');
      return;
    }

    setUploadingFile(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      await fileService.uploadFile({
        file,
        category: FileCategory.FinancialReport,
        relatedEntityId: reportId,
        description: `Financial report source file for ${report?.ticker ?? reportId}`,
      });

      setUpdateSuccess('Upload file thành công.');
      onUpdated?.();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Không thể upload file.');
    } finally {
      setUploadingFile(false);
    }
  }, [onUpdated, report?.ticker, reportId]);

  const onFileInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    await onUploadFile(selectedFile);

    if (event.target) {
      event.target.value = '';
    }
  }, [onUploadFile]);

  const onDownloadFile = useCallback(async () => {
    if (!reportId) {
      setUpdateError('Không tìm thấy báo cáo để download file.');
      return;
    }

    setDownloadingFile(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      const fileName = `${report?.ticker ?? 'financial-report'}-${report?.year ?? 'report'}`;

      await fileService.downloadFileToDevice(
        {
          category: FileCategory.FinancialReport,
          entityId: reportId,
        },
        fileName
      );

      setUpdateSuccess('Đã tải file về máy.');
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Không thể download file.');
    } finally {
      setDownloadingFile(false);
    }
  }, [report?.ticker, report?.year, reportId]);

  useEffect(() => {
    if (!isOpen || !reportId) {
      return;
    }

    const loadDetail = async () => {
      setLoading(true);
      setError(null);
      setUpdateError(null);
      setUpdateSuccess(null);

      try {
        const response = await fetchFinancialReportById(reportId);
        const editableRows = buildEditableRows(response.reportData as unknown as JsonRecord);

        setReport(response);
        setRows(editableRows);
        setOriginalRows(cloneRows(editableRows));
        setMetricKeyword('');
      } catch (err) {
        setReport(null);
        setRows([]);
        setOriginalRows([]);
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết báo cáo tài chính.');
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [cloneRows, isOpen, reportId]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-5xl max-h-[92vh] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Chi tiết báo cáo tài chính</h3>
            {report && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {report.ticker} - {getPeriodLabel(report.year, report.period)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onUploadFileClick}
              disabled={!reportId || uploadingFile || downloadingFile || updating}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {uploadingFile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadingFile ? 'Đang upload...' : 'Upload file'}
            </button>

            <button
              type="button"
              onClick={onDownloadFile}
              disabled={!reportId || downloadingFile || uploadingFile || updating}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {downloadingFile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloadingFile ? 'Đang tải...' : 'Download file'}
            </button>

            <button
              type="button"
              onClick={onRequestClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xlsx,.xls,.csv"
            className="hidden"
            onChange={onFileInputChange}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="min-h-[240px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              Đang tải chi tiết báo cáo...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && report && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Mã CK</p>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">{report.ticker}</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Kỳ báo cáo</p>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">{getPeriodLabel(report.year, report.period)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Trạng thái</p>
                  <div className="mt-1">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(report.status)}`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Cập nhật</p>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">{formatDateTime(report.updatedAt)}</p>
                </div>
              </div>

              {updateError && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-red-600 dark:text-red-400">
                  {updateError}
                </div>
              )}

              {updateSuccess && (
                <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-green-700 dark:text-green-400">
                  {updateSuccess}
                </div>
              )}

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/40 border-b border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dữ liệu báo cáo (Live Editor - tỷ đồng)</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{rows.length} chỉ số</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <input
                      value={metricKeyword}
                      onChange={(event) => setMetricKeyword(event.target.value)}
                      placeholder="Tìm nhanh theo nhóm / chỉ số..."
                      className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end">
                      {hasUnsavedChanges ? 'Có thay đổi chưa lưu' : 'Đã đồng bộ với dữ liệu mới nhất'}
                    </div>
                  </div>
                </div>

                {!hasData && (
                  <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Không có dữ liệu số để chỉnh sửa.
                  </div>
                )}

                {hasData && (
                  <div className="overflow-hidden">
                    <table className="w-full table-fixed">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                          <th className="w-[20%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Nhóm</th>
                          <th className="w-[24%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Nhóm con</th>
                          <th className="w-[34%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Chỉ số</th>
                          <th className="w-[22%] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Giá trị (tỷ đồng)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGroupedRows.map((group) => (
                          <Fragment key={`group-block-${group.groupLabel}`}>
                            <tr key={`group-${group.groupLabel}`} className="bg-gray-50/80 dark:bg-gray-700/40 border-b border-gray-100 dark:border-gray-700/60">
                              <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-gray-100 break-words">{group.groupLabel}</td>
                              <td className="px-4 py-3" />
                              <td className="px-4 py-3" />
                              <td className="px-4 py-3" />
                            </tr>

                            {group.subGroups.map((subGroup) => (
                              <Fragment key={`subgroup-block-${group.groupLabel}-${subGroup.subGroupLabel}`}>
                                <tr key={`subgroup-${group.groupLabel}-${subGroup.subGroupLabel}`} className="bg-gray-50/40 dark:bg-gray-700/20 border-b border-gray-100 dark:border-gray-700/60">
                                  <td className="px-4 py-3" />
                                  <td className="px-4 py-3 text-xs font-semibold text-gray-800 dark:text-gray-200 break-words">{subGroup.subGroupLabel}</td>
                                  <td className="px-4 py-3" />
                                  <td className="px-4 py-3" />
                                </tr>

                                {subGroup.metrics.map((metric) => (
                                  <tr key={metric.id} className="border-b border-gray-100 dark:border-gray-700/60">
                                    <td className="px-4 py-3" />
                                    <td className="px-4 py-3" />
                                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-100 break-words">{metric.metricLabel}</td>
                                    <td className="px-4 py-2">
                                      <input
                                        value={metric.inputValueInBillion}
                                        onChange={(event) => onRowValueChange(metric.id, event.target.value)}
                                        className={`w-full px-3 py-1.5 text-sm font-mono text-right text-gray-900 dark:text-gray-100 bg-transparent border rounded outline-none ${invalidRowIds.has(metric.id)
                                          ? 'border-red-300 dark:border-red-700 focus:border-red-500'
                                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-500 focus:border-blue-500'}`}
                                        type="text"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </Fragment>
                            ))}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {hasInvalidInputs
              ? 'Có ô nhập không hợp lệ. Vui lòng kiểm tra các ô viền đỏ.'
              : hasUnsavedChanges
                ? 'Bạn có thay đổi chưa lưu.'
                : 'Không có thay đổi mới.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetChanges}
              disabled={!hasUnsavedChanges || updating}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Hoàn tác
            </button>
            <button
              type="button"
              onClick={onUpdateReport}
              disabled={!hasData || !hasUnsavedChanges || hasInvalidInputs || updating}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {updating ? 'Đang cập nhật...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
