'use client';

import { Fragment, RefObject } from 'react';
import { CheckCircle2, RefreshCw, Upload } from 'lucide-react';
import { GroupedMetricGroup } from './types';

interface CreateFinancialReportEditorStepProps {
  uploadedLocalFile: File | null;
  localPreviewUrl: string | null;
  isPreviewPdf: boolean;
  groupedRows: GroupedMetricGroup[];
  hasData: boolean;
  fetchingOnline: boolean;
  submitting: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onUploadFileClick: () => void;
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFetchOnlineData: () => void;
  onRowValueChange: (id: string, value: string) => void;
  onCancelProcess: () => void;
  onFinalizeCreate: () => void;
}

export default function CreateFinancialReportEditorStep({
  uploadedLocalFile,
  localPreviewUrl,
  isPreviewPdf,
  groupedRows,
  hasData,
  fetchingOnline,
  submitting,
  fileInputRef,
  onUploadFileClick,
  onFileInputChange,
  onFetchOnlineData,
  onRowValueChange,
  onCancelProcess,
  onFinalizeCreate,
}: CreateFinancialReportEditorStepProps) {
  return (
    <>
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-1/2 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nguồn dữ liệu</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">PDF Live View / Upload file local</p>
            </div>
            <button
              type="button"
              onClick={onUploadFileClick}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Chọn file
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
            {!uploadedLocalFile && (
              <div className="h-full border border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center text-center px-6">
                <Upload className="w-8 h-8 text-gray-400 mb-3" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Chưa có file nguồn</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chọn file từ máy để xem live view cục bộ (không upload ngay).</p>
              </div>
            )}

            {uploadedLocalFile && (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">File đã chọn</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1 break-words">
                    {uploadedLocalFile.name}
                  </p>
                </div>

                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-[420px]">
                  {isPreviewPdf && localPreviewUrl && (
                    <iframe
                      src={localPreviewUrl}
                      className="w-full h-full"
                      title="PDF live view"
                    />
                  )}

                  {!isPreviewPdf && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Đã nạp file thành công</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        File hiện tại không hỗ trợ xem PDF trực tiếp trong khung này. Bạn vẫn có thể nhập tay dữ liệu từ file và tạo báo cáo.
                      </p>
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

          <div className="flex-1 overflow-y-auto">
            {!hasData && (
              <div className="h-full min-h-[340px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 px-6 text-center">
                Chưa có dữ liệu bảng. Bạn có thể lấy dữ liệu online để bắt đầu chỉnh sửa.
              </div>
            )}

            {hasData && (
              <table className="w-full table-fixed border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                    <th className="w-[30%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Nhóm / Nhóm con</th>
                    <th className="w-[34%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Chỉ số</th>
                    <th className="w-[36%] px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Giá trị</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRows.map((group) => (
                    <Fragment key={`group-block-${group.groupLabel}`}>
                      <tr key={`group-${group.groupLabel}`} className="bg-gray-50/80 dark:bg-gray-700/40 border-b border-gray-100 dark:border-gray-700/60">
                        <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-gray-100 break-words">{group.groupLabel}</td>
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3" />
                      </tr>

                      {group.subGroups.map((subGroup) => (
                        <Fragment key={`subgroup-block-${group.groupLabel}-${subGroup.subGroupLabel}`}>
                          <tr key={`subgroup-${group.groupLabel}-${subGroup.subGroupLabel}`} className="bg-gray-50/40 dark:bg-gray-700/20 border-b border-gray-100 dark:border-gray-700/60">
                            <td className="px-4 py-3 text-xs font-semibold text-gray-800 dark:text-gray-200 break-words pl-8">{subGroup.subGroupLabel}</td>
                            <td className="px-4 py-3" />
                            <td className="px-4 py-3" />
                          </tr>

                          {subGroup.metrics.map((metric) => (
                            <tr key={metric.id} className="border-b border-gray-100 dark:border-gray-700/60">
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
          disabled={submitting}
          className="px-6 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-60"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          onClick={onFinalizeCreate}
          disabled={submitting || fetchingOnline}
          className="px-8 py-2.5 rounded-lg bg-[linear-gradient(135deg,#000000_0%,#0d1c32_100%)] text-white text-sm font-extrabold disabled:opacity-60 inline-flex items-center gap-2"
        >
          {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {submitting ? 'Đang tạo...' : 'Tạo báo cáo'}
        </button>
      </div>
    </>
  );
}
