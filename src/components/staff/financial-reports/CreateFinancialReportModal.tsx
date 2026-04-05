'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  createFinancialReport,
  fetchSpecificFinancialReportData,
} from '@/services/financialReportService';
import fileService from '@/services/fileService';
import { FileCategory } from '@/types/file';
import { FinancialPeriodType } from '@/types/financialReport';
import { DEFAULT_FINANCIAL_REPORT_DATA_TEMPLATE, QUARTER_OPTIONS } from './create-modal/constants';
import CreateFinancialReportEditorStep from './create-modal/CreateFinancialReportEditorStep';
import CreateFinancialReportInitStep from './create-modal/CreateFinancialReportInitStep';
import {
  buildEditableRows,
  cloneDeep,
  parseBillionToDong,
  setNestedValue,
} from './create-modal/utils';
import {
  type CreateFinancialReportModalProps,
  type EditableMetricRow,
  type GroupedMetricGroup,
  type JsonRecord,
} from './create-modal/types';

function hasMeaningfulUserValue(row: EditableMetricRow): boolean {
  return row.inputValueInBillion.trim() !== '';
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'init' | 'editor'>('init');
  const [ticker, setTicker] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<FinancialPeriodType>(FinancialPeriodType.FirstQuarter);

  const [uploadedLocalFile, setUploadedLocalFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isPreviewPdf, setIsPreviewPdf] = useState(false);

  const [baseReportData, setBaseReportData] = useState<JsonRecord>({});
  const [rows, setRows] = useState<EditableMetricRow[]>([]);

  const [initializing, setInitializing] = useState(false);
  const [fetchingOnline, setFetchingOnline] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const groupedRows = useMemo<GroupedMetricGroup[]>(() => {
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
      if (localPreviewUrl) {
        window.URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const replacePreviewUrl = useCallback((nextUrl: string | null) => {
    setLocalPreviewUrl((prevUrl) => {
      if (prevUrl) {
        window.URL.revokeObjectURL(prevUrl);
      }

      return nextUrl;
    });
  }, []);

  const resetAll = useCallback(() => {
    setStep('init');
    setTicker('');
    setSelectedYear(currentYear);
    setSelectedQuarter(FinancialPeriodType.FirstQuarter);
    setUploadedLocalFile(null);
    replacePreviewUrl(null);
    setIsPreviewPdf(false);
    setBaseReportData({});
    setRows([]);
    setError(null);
    setSuccessMessage(null);
  }, [currentYear, replacePreviewUrl]);

  const onRequestClose = useCallback(() => {
    if (submitting) {
      return;
    }

    if (step === 'editor') {
      const shouldCancel = window.confirm('Hủy quy trình sẽ xóa toàn bộ dữ liệu bạn vừa nhập. Bạn có chắc chắn muốn hủy?');
      if (!shouldCancel) {
        return;
      }
    }

    resetAll();
    onClose();
  }, [onClose, resetAll, step, submitting]);

  const onContinueInit = useCallback(() => {
    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) {
      setError('Vui lòng nhập mã chứng khoán.');
      return;
    }

    setInitializing(true);
    setError(null);
    setSuccessMessage(null);

    const defaultTemplate = cloneDeep(DEFAULT_FINANCIAL_REPORT_DATA_TEMPLATE);
    const templateRows = buildEditableRows(defaultTemplate);

    setTicker(normalizedTicker);
    setBaseReportData(defaultTemplate);
    setRows(templateRows);
    setStep('editor');
    setInitializing(false);
    setSuccessMessage('Đã mở bước nhập dữ liệu. Bạn có thể lấy dữ liệu online hoặc upload file từ máy để đối chiếu và nhập tay.');
  }, [ticker]);

  const onFetchOnlineData = useCallback(async () => {
    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) {
      setError('Vui lòng nhập mã chứng khoán.');
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

        const existingMap = new Map(prevRows.map((row) => [row.id, row]));

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
        const customRows = prevRows.filter((row) => !onlineIds.has(row.id));

        return [...mergedRows, ...customRows];
      });

      setSuccessMessage('Đã lấy dữ liệu online và điền vào bảng. Các ô đã có dữ liệu trước đó được giữ nguyên.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lấy dữ liệu online.');
    } finally {
      setFetchingOnline(false);
    }
  }, [selectedQuarter, selectedYear, ticker]);

  const onUploadFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    const previewUrl = window.URL.createObjectURL(selectedFile);

    replacePreviewUrl(previewUrl);
    setUploadedLocalFile(selectedFile);
    setIsPreviewPdf(isPdfFile(selectedFile));
    setSuccessMessage('Đã nạp file từ máy cục bộ để xem live view. File sẽ được upload lên server sau khi tạo báo cáo thành công.');

    if (event.target) {
      event.target.value = '';
    }
  }, [replacePreviewUrl]);

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

  const onFinalizeCreate = useCallback(async () => {
    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) {
      setError('Vui lòng nhập mã chứng khoán.');
      return;
    }

    if (rows.length === 0) {
      setError('Chưa có dữ liệu để tạo báo cáo.');
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
      const createdReport = await createFinancialReport({
        ticker: normalizedTicker,
        year: selectedYear,
        period: selectedQuarter,
        reportData: payloadReportData,
      });

      if (uploadedLocalFile) {
        await fileService.uploadFile({
          file: uploadedLocalFile,
          category: FileCategory.FinancialReport,
          relatedEntityId: createdReport.id,
          description: `Financial report source file for ${normalizedTicker}`,
        });
      }

      onCreated?.();
      resetAll();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể hoàn tất tạo báo cáo tài chính.');
    } finally {
      setSubmitting(false);
    }
  }, [
    baseReportData,
    onClose,
    onCreated,
    resetAll,
    rows,
    selectedQuarter,
    selectedYear,
    ticker,
    uploadedLocalFile,
  ]);

  const onCancelProcess = useCallback(() => {
    if (submitting) {
      return;
    }

    const shouldCancel = window.confirm('Hủy quy trình sẽ xóa toàn bộ dữ liệu bạn vừa nhập. Bạn có chắc chắn muốn hủy?');
    if (!shouldCancel) {
      return;
    }

    resetAll();
    onClose();
  }, [onClose, resetAll, submitting]);

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
                ? 'Nhập thông tin cơ bản trước khi vào bước nhập dữ liệu.'
                : `${ticker} • ${selectedYear} • ${QUARTER_OPTIONS.find((option) => option.value === selectedQuarter)?.label ?? ''}`}
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
          <CreateFinancialReportInitStep
            ticker={ticker}
            selectedYear={selectedYear}
            selectedQuarter={selectedQuarter}
            yearOptions={yearOptions}
            quarterOptions={QUARTER_OPTIONS}
            initializing={initializing}
            onTickerChange={setTicker}
            onYearChange={setSelectedYear}
            onQuarterChange={setSelectedQuarter}
            onCancel={onRequestClose}
            onContinue={onContinueInit}
          />
        )}

        {step === 'editor' && (
          <CreateFinancialReportEditorStep
            uploadedLocalFile={uploadedLocalFile}
            localPreviewUrl={localPreviewUrl}
            isPreviewPdf={isPreviewPdf}
            groupedRows={groupedRows}
            hasData={hasData}
            fetchingOnline={fetchingOnline}
            submitting={submitting}
            fileInputRef={fileInputRef}
            onUploadFileClick={onUploadFileClick}
            onFileInputChange={onFileInputChange}
            onFetchOnlineData={onFetchOnlineData}
            onRowValueChange={onRowValueChange}
            onCancelProcess={onCancelProcess}
            onFinalizeCreate={onFinalizeCreate}
          />
        )}
      </div>
    </div>
  );
}
