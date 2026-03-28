'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FilePlus, RefreshCw, Upload, X } from 'lucide-react';
import {
  createFinancialReport,
  deleteFinancialReport,
  fetchSpecificFinancialReportData,
  updateFinancialReport,
} from '@/services/financialReportService';
import fileService from '@/services/fileService';
import { FileCategory, type FileResponse } from '@/types/file';
import { FinancialPeriodType } from '@/types/financialReport';
import { DEFAULT_FINANCIAL_REPORT_DATA_TEMPLATE, QUARTER_OPTIONS } from './create-modal/constants';
import {
  buildEditableRows,
  cloneDeep,
  parseBillionToDong,
  setNestedValue,
} from './create-modal/utils';
import { type CreateFinancialReportModalProps, type EditableMetricRow, type JsonRecord } from './create-modal/types';

function normalizeKey(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');

  return normalized || 'field';
}

function hasMeaningfulUserValue(row: EditableMetricRow): boolean {
  return row.inputValueInBillion.trim() !== '';
}

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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<'init' | 'editor'>('init');
  const [ticker, setTicker] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<FinancialPeriodType>(FinancialPeriodType.FirstQuarter);

  const [tempReportId, setTempReportId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<FileResponse | null>(null);
  const [downloadedPreviewUrl, setDownloadedPreviewUrl] = useState<string | null>(null);

  const [baseReportData, setBaseReportData] = useState<JsonRecord>({});
  const [rows, setRows] = useState<EditableMetricRow[]>([]);

  const [manualGroup, setManualGroup] = useState('');
  const [manualSubGroup, setManualSubGroup] = useState('');
  const [manualMetric, setManualMetric] = useState('');
  const [manualValue, setManualValue] = useState('');

  const [initializing, setInitializing] = useState(false);
  const [fetchingOnline, setFetchingOnline] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const groupedRows = useMemo(() => {
    const groups = new Map<string, Map<string, EditableMetricRow[]>>();

    rows.forEach((row) => {
      if (!groups.has(row.groupLabel)) {
        groups.set(row.groupLabel, new Map<string, EditableMetricRow[]>());
      }

      const subGroups = groups.get(row.groupLabel)!;
      if (!subGroups.has(row.subGroupLabel)) {
        subGroups.set(row.subGroupLabel, []);
      }

      subGroups.get(row.subGroupLabel)!.push(row);
    });

    return Array.from(groups.entries()).map(([groupLabel, subGroups]) => ({
      groupLabel,
      subGroups: Array.from(subGroups.entries()).map(([subGroupLabel, metrics]) => ({
        subGroupLabel,
        metrics,
      })),
    }));
  }, [rows]);

  const hasData = rows.length > 0;

  useEffect(() => {
    return () => {
      if (downloadedPreviewUrl) {
        window.URL.revokeObjectURL(downloadedPreviewUrl);
      }
    };
  }, [downloadedPreviewUrl]);

  const replacePreviewUrl = useCallback((nextUrl: string | null) => {
    setDownloadedPreviewUrl((prevUrl) => {
      if (prevUrl) {
        window.URL.revokeObjectURL(prevUrl);
      }

      return nextUrl;
    });
  }, []);

  const loadUploadedFilePreview = useCallback(async (entityId: string) => {
    setLoadingPreview(true);
    setError(null);

    try {
      const blob = await fileService.downloadFile({
        category: FileCategory.FinancialReport,
        entityId,
      });

      const objectUrl = window.URL.createObjectURL(blob);
      replacePreviewUrl(objectUrl);
    } catch (err) {
      replacePreviewUrl(null);
      setError(err instanceof Error ? err.message : 'Không thể tải file đã upload để xem preview.');
    } finally {
      setLoadingPreview(false);
    }
  }, [replacePreviewUrl]);

  const resetAll = useCallback(() => {
    setStep('init');
    setTicker('');
    setSelectedYear(currentYear);
    setSelectedQuarter(FinancialPeriodType.FirstQuarter);
    setTempReportId(null);
    setUploadedFile(null);
    replacePreviewUrl(null);
    setBaseReportData({});
    setRows([]);
    setManualGroup('');
    setManualSubGroup('');
    setManualMetric('');
    setManualValue('');
    setError(null);
    setSuccessMessage(null);
  }, [currentYear, replacePreviewUrl]);

  const onRequestClose = useCallback(async () => {
    if (step === 'editor' && tempReportId) {
      const shouldCancel = window.confirm('Hủy quy trình sẽ xóa báo cáo tạm. Bạn có chắc chắn muốn hủy?');
      if (!shouldCancel) {
        return;
      }

      setCanceling(true);
      setError(null);

      try {
        await deleteFinancialReport(tempReportId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể hủy báo cáo tạm thời.');
        setCanceling(false);
        return;
      }

      setCanceling(false);
    }

    resetAll();
    onClose();
  }, [onClose, resetAll, step, tempReportId]);

  const onContinueInit = useCallback(async () => {
    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) {
      setError('Vui lòng nhập mã chứng khoán.');
      return;
    }

    setInitializing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const created = await createFinancialReport({
        ticker: normalizedTicker,
        year: selectedYear,
        period: selectedQuarter,
        reportData: {},
      });

      const defaultTemplate = cloneDeep(DEFAULT_FINANCIAL_REPORT_DATA_TEMPLATE);
      const templateRows = buildEditableRows(defaultTemplate);

      setTicker(normalizedTicker);
      setTempReportId(created.id);
      setBaseReportData(defaultTemplate);
      setRows(templateRows);
      setStep('editor');
      setSuccessMessage('Đã tạo báo cáo tạm thời. Bạn có thể lấy dữ liệu online hoặc upload file để tiếp tục.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể khởi tạo báo cáo tài chính.');
    } finally {
      setInitializing(false);
    }
  }, [selectedQuarter, selectedYear, ticker]);

  const onFetchOnlineData = useCallback(async () => {
    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) {
      setError('Vui lòng nhập mã chứng khoán.');
      return;
    }

    if (!tempReportId) {
      setError('Không tìm thấy báo cáo tạm thời để cập nhật.');
      return;
    }

    setFetchingOnline(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await fetchSpecificFinancialReportData({
        ticker: normalizedTicker,
        year: selectedYear,
        quarter: selectedQuarter,
      });

      const onlineRows = buildEditableRows(data as JsonRecord);
      if (onlineRows.length === 0) {
        setError('Không có dữ liệu số để điền tự động từ nguồn online.');
        return;
      }

      setBaseReportData((prev) => {
        const mergedBase = cloneDeep(prev);
        onlineRows.forEach((row) => {
          setNestedValue(mergedBase, row.path, row.valueInDong);
        });
        return mergedBase;
      });

      setRows((prevRows) => {
        if (prevRows.length === 0) {
          return onlineRows;
        }

        const currentRowsBackup = rows;
        const currentMap = currentRowsBackup.length > 0 ? currentRowsBackup : prevRows;
        const existingMap = new Map(currentMap.map((row) => [row.id, row]));

        const mergedRows = onlineRows.map((onlineRow) => {
          const existing = existingMap.get(onlineRow.id);
          if (!existing) {
            return onlineRow;
          }

          if (hasMeaningfulUserValue(existing)) {
            return existing;
          }

          return onlineRow;
        });

        const onlineIds = new Set(onlineRows.map((row) => row.id));
        const customRows = currentMap.filter((row) => !onlineIds.has(row.id));

        return [...mergedRows, ...customRows];
      });

      setSuccessMessage('Đã lấy dữ liệu online và điền vào bảng. Các ô đã có dữ liệu trước đó được giữ nguyên.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lấy dữ liệu online.');
    } finally {
      setFetchingOnline(false);
    }
  }, [rows, selectedQuarter, selectedYear, tempReportId, ticker]);

  const onUploadFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onUploadFile = useCallback(async (file: File) => {
    if (!tempReportId) {
      setError('Không tìm thấy báo cáo tạm thời để gắn file.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fileService.uploadFile({
        file,
        category: FileCategory.FinancialReport,
        relatedEntityId: tempReportId,
        description: `Financial report source file for ${ticker}`,
      });

      setUploadedFile(response);
      await loadUploadedFilePreview(tempReportId);
      setSuccessMessage('Upload file thành công. Bạn có thể nhập thủ công chỉ số đọc được từ file hoặc lấy dữ liệu online.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể upload file.');
    } finally {
      setUploading(false);
    }
  }, [loadUploadedFilePreview, tempReportId, ticker]);

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

  const onAddManualMetric = useCallback(() => {
    if (!manualGroup.trim() || !manualMetric.trim()) {
      setError('Vui lòng nhập ít nhất Nhóm và Chỉ số để thêm thủ công.');
      return;
    }

    const groupLabel = manualGroup.trim();
    const subGroupLabel = manualSubGroup.trim() || '-';
    const metricLabel = manualMetric.trim();
    const parsedInDong = parseBillionToDong(manualValue);

    if (manualValue.trim() && parsedInDong === null) {
      setError('Giá trị thủ công không hợp lệ.');
      return;
    }

    const path = [normalizeKey(groupLabel)];
    if (subGroupLabel !== '-') {
      path.push(normalizeKey(subGroupLabel));
    }
    path.push(normalizeKey(metricLabel));

    const uniqueId = `${path.join('.')}__${Date.now()}`;

    const newRow: EditableMetricRow = {
      id: uniqueId,
      path,
      groupLabel,
      subGroupLabel,
      metricLabel,
      valueInDong: parsedInDong ?? 0,
      inputValueInBillion: manualValue.trim() ? manualValue : '',
    };

    setRows((prev) => [...prev, newRow]);
    setManualMetric('');
    setManualValue('');
    setError(null);
    setSuccessMessage('Đã thêm chỉ số thủ công vào bảng chỉnh sửa.');
  }, [manualGroup, manualMetric, manualSubGroup, manualValue]);

  const onFinalizeCreate = useCallback(async () => {
    if (!tempReportId) {
      setError('Không tìm thấy báo cáo tạm thời.');
      return;
    }

    const payloadReportData = cloneDeep(baseReportData);

    for (const row of rows) {
      if (!row.inputValueInBillion.trim()) {
        setNestedValue(payloadReportData, row.path, null);
        continue;
      }

      const parsedInDong = parseBillionToDong(row.inputValueInBillion);
      if (parsedInDong === null) {
        setError(`Giá trị không hợp lệ tại chỉ số: ${row.metricLabel}`);
        return;
      }

      setNestedValue(payloadReportData, row.path, parsedInDong);
    }

    setSubmitting(true);
    setError(null);

    try {
      await updateFinancialReport(tempReportId, {
        reportData: payloadReportData,
      });

      onCreated?.();
      resetAll();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể hoàn tất tạo báo cáo tài chính.');
    } finally {
      setSubmitting(false);
    }
  }, [baseReportData, onClose, onCreated, resetAll, rows, tempReportId]);

  const onCancelProcess = useCallback(async () => {
    if (!tempReportId) {
      resetAll();
      onClose();
      return;
    }

    setCanceling(true);
    setError(null);

    try {
      await deleteFinancialReport(tempReportId);
      resetAll();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể hủy báo cáo tạm thời.');
    } finally {
      setCanceling(false);
    }
  }, [onClose, resetAll, tempReportId]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="absolute inset-0" onClick={onRequestClose} />

      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
          <div>
            <h3 className="text-xl font-extrabold font-headline tracking-tight text-gray-900 dark:text-gray-100">
              {step === 'init' ? 'Tạo báo cáo tài chính mới' : 'Chi tiết báo cáo và chỉnh sửa'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {step === 'init'
                ? 'Khởi tạo quy trình nhập liệu báo cáo tài chính cho cổ phiếu.'
                : `Report ID: ${tempReportId ?? '--'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onRequestClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {successMessage}
          </div>
        )}

        {step === 'init' && (
          <>
            <div className="px-6 py-6 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Mã cổ phiếu
                </label>
                <input
                  value={ticker}
                  onChange={(event) => setTicker(event.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold outline-none focus:border-emerald-500"
                  placeholder="Nhập mã (VD: VCB, FPT...)"
                  type="text"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Năm báo cáo
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(Number(event.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold outline-none focus:border-emerald-500"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Kỳ báo cáo
                  </label>
                  <select
                    value={selectedQuarter}
                    onChange={(event) => setSelectedQuarter(Number(event.target.value) as FinancialPeriodType)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold outline-none focus:border-emerald-500"
                  >
                    {QUARTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/80 dark:bg-blue-900/20 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
                Khi nhấn Tiếp tục, hệ thống sẽ tạo một báo cáo tạm với reportData rỗng để bạn tiếp tục quy trình lấy dữ liệu online/upload file và chỉnh sửa.
              </div>
            </div>

            <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 bg-white dark:bg-gray-800 shrink-0">
              <button
                type="button"
                onClick={onRequestClose}
                className="px-6 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={onContinueInit}
                disabled={initializing}
                className="px-8 py-2.5 rounded-lg bg-[linear-gradient(135deg,#000000_0%,#0d1c32_100%)] text-white text-sm font-bold disabled:opacity-60 inline-flex items-center gap-2"
              >
                {initializing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />}
                {initializing ? 'Đang khởi tạo...' : 'Tiếp tục'}
              </button>
            </div>
          </>
        )}

        {step === 'editor' && (
          <>
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              <div className="w-full lg:w-1/2 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nguồn dữ liệu</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">PDF Live View / Upload file</p>
                  </div>
                  <button
                    type="button"
                    onClick={onUploadFileClick}
                    disabled={uploading}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2"
                  >
                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Đang upload...' : 'Upload file'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.xlsx,.xls,.csv"
                    className="hidden"
                    onChange={onFileInputChange}
                  />
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                  {!uploadedFile && (
                    <div className="h-full border border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center text-center px-6">
                      <Upload className="w-8 h-8 text-gray-400 mb-3" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Chưa có file nguồn</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload PDF hoặc bảng dữ liệu để xem live view tài liệu.</p>
                    </div>
                  )}

                  {uploadedFile && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400">File đã upload</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1 break-words">
                          {uploadedFile.originalFileName}
                        </p>
                      </div>

                      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-[420px]">
                        {loadingPreview && (
                          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                            Đang tải file preview...
                          </div>
                        )}

                        {!loadingPreview && downloadedPreviewUrl && (
                          <iframe
                            src={downloadedPreviewUrl}
                            className="w-full h-full"
                            title="PDF live view"
                          />
                        )}

                        {!loadingPreview && !downloadedPreviewUrl && (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Chưa tải được bản xem trước từ server.
                            </p>
                            <button
                              type="button"
                              onClick={() => tempReportId && loadUploadedFilePreview(tempReportId)}
                              disabled={!tempReportId}
                              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
                            >
                              Tải lại preview
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Table Live Editor</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Đơn vị nhập liệu: tỷ đồng</p>
                  </div>
                  <button
                    type="button"
                    onClick={onFetchOnlineData}
                    disabled={fetchingOnline}
                    className="px-4 py-2 rounded-lg bg-[linear-gradient(135deg,#000000_0%,#0d1c32_100%)] text-white text-sm font-bold disabled:opacity-60 inline-flex items-center gap-2"
                  >
                    {fetchingOnline ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {fetchingOnline ? 'Đang lấy...' : 'Lấy dữ liệu online'}
                  </button>
                </div>

                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    value={manualGroup}
                    onChange={(event) => setManualGroup(event.target.value)}
                    placeholder="Nhóm"
                    className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  />
                  <input
                    value={manualSubGroup}
                    onChange={(event) => setManualSubGroup(event.target.value)}
                    placeholder="Nhóm con"
                    className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  />
                  <input
                    value={manualMetric}
                    onChange={(event) => setManualMetric(event.target.value)}
                    placeholder="Chỉ số"
                    className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      value={manualValue}
                      onChange={(event) => setManualValue(event.target.value)}
                      placeholder="Giá trị"
                      className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                    />
                    <button
                      type="button"
                      onClick={onAddManualMetric}
                      className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {!hasData && (
                    <div className="h-full min-h-[340px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 px-6 text-center">
                      Chưa có dữ liệu bảng. Bạn có thể lấy dữ liệu online hoặc thêm chỉ số thủ công.
                    </div>
                  )}

                  {hasData && (
                    <table className="w-full table-fixed border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                          <th className="w-[20%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Nhóm</th>
                          <th className="w-[24%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Nhóm con</th>
                          <th className="w-[34%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Chỉ số</th>
                          <th className="w-[22%] px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Giá trị</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedRows.map((group) => (
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
                                        className="w-full px-3 py-1.5 text-sm font-mono text-right text-gray-900 dark:text-gray-100 bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-500 focus:border-blue-500 rounded outline-none"
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
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 bg-white dark:bg-gray-800 shrink-0">
              <button
                type="button"
                onClick={onCancelProcess}
                disabled={canceling || submitting}
                className="px-6 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-60"
              >
                {canceling ? 'Đang hủy...' : 'Hủy bỏ'}
              </button>
              <button
                type="button"
                onClick={onFinalizeCreate}
                disabled={submitting || canceling}
                className="px-8 py-2.5 rounded-lg bg-[linear-gradient(135deg,#000000_0%,#0d1c32_100%)] text-white text-sm font-extrabold disabled:opacity-60 inline-flex items-center gap-2"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {submitting ? 'Đang tạo...' : 'Tạo báo cáo'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
