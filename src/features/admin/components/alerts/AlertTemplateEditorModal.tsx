'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AlertTemplatePlaceholderDto } from '@/types/alertTemplate';
import { getConditionLabel, getTypeLabel } from './alertTemplateUtils';
import type { TemplateFormState, TemplateMode } from './types';

interface AlertTemplateEditorModalProps {
  isOpen: boolean;
  mode: TemplateMode;
  selectedTemplateId: number | null;
  isSaving: boolean;
  isLoadingDetail: boolean;
  error: string | null;
  message: string | null;
  form: TemplateFormState;
  placeholders: AlertTemplatePlaceholderDto[];
  placeholdersLoading: boolean;
  placeholdersError: string | null;
  onClose: () => void;
  onCreateAgain: () => void;
  onSave: () => void;
  onFieldChange: <K extends keyof TemplateFormState>(field: K, value: TemplateFormState[K]) => void;
}

function groupPlaceholders(placeholders: AlertTemplatePlaceholderDto[]): Array<{ category: string; items: AlertTemplatePlaceholderDto[] }> {
  const groups = new Map<string, AlertTemplatePlaceholderDto[]>();

  for (const placeholder of placeholders) {
    const category = placeholder.category.trim() || 'Khác';
    const items = groups.get(category) ?? [];
    items.push(placeholder);
    groups.set(category, items);
  }

  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    items: items.sort((left, right) => left.key.localeCompare(right.key)),
  }));
}

export default function AlertTemplateEditorModal({
  isOpen,
  mode,
  selectedTemplateId,
  isSaving,
  isLoadingDetail,
  error,
  message,
  form,
  placeholders,
  placeholdersLoading,
  placeholdersError,
  onClose,
  onCreateAgain,
  onSave,
  onFieldChange,
}: AlertTemplateEditorModalProps) {
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // reset nothing specific when closed
  }, [isOpen]);

  const groupedPlaceholders = useMemo(() => groupPlaceholders(placeholders), [placeholders]);

  const insertPlaceholder = (placeholderKey: string) => {
    const placeholder = placeholders.find((p) => p.key === placeholderKey);
    if (!placeholder) return;

    const textarea = bodyTextareaRef.current;
    const token = placeholder.token;

    if (!textarea) {
      onFieldChange('bodyTemplate', `${form.bodyTemplate}${token}`);
      return;
    }

    const selectionStart = textarea.selectionStart ?? form.bodyTemplate.length;
    const selectionEnd = textarea.selectionEnd ?? form.bodyTemplate.length;
    const nextBodyTemplate = `${form.bodyTemplate.slice(0, selectionStart)}${token}${form.bodyTemplate.slice(selectionEnd)}`;

    onFieldChange('bodyTemplate', nextBodyTemplate);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = selectionStart + token.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const editorTitle = mode === 'update' ? 'Cập nhật mẫu cảnh báo' : 'Tạo mẫu cảnh báo mới';
  const modeLabel = mode === 'update' ? `Mẫu #${selectedTemplateId ?? ''}` : 'Tạo mới';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-0 dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <DialogHeader className="text-left">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  {editorTitle}
                </DialogTitle>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-red-700 dark:hover:text-white"
                aria-label="Đóng form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>
        </div>

        <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="space-y-4">
            {isLoadingDetail && (
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải chi tiết...
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400">
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loại cảnh báo</span>
                <select
                  value={form.type}
                  onChange={(event) => onFieldChange('type', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Chọn loại cảnh báo</option>
                  <option value="1">Giá</option>
                  <option value="2">Khối lượng</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Điều kiện kích hoạt</span>
                <select
                  value={form.condition}
                  onChange={(event) => onFieldChange('condition', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Chọn điều kiện kích hoạt</option>
                  <option value="1">Trên ngưỡng</option>
                  <option value="2">Dưới ngưỡng</option>
                  <option value="3">Tăng %</option>
                  <option value="4">Giảm %</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tên mẫu</span>
              <input
                value={form.titleTemplate}
                onChange={(event) => onFieldChange('titleTemplate', event.target.value)}
                placeholder="Nhập tên mẫu cảnh báo"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nội dung mẫu</span>
              <textarea
                ref={bodyTextareaRef}
                value={form.bodyTemplate}
                onChange={(event) => onFieldChange('bodyTemplate', event.target.value)}
                rows={12}
                placeholder="Viết nội dung ở đây, sau đó chọn placeholder để chèn vào đúng vị trí con trỏ"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm leading-6 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
              />
            </label>

            <div className="flex items-center gap-4">
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-700/40">
                <button
                  type="button"
                  onClick={() => onFieldChange('isDefault', !form.isDefault)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                    form.isDefault ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  role="switch"
                  aria-checked={form.isDefault}
                  aria-label="Đặt làm mặc định"
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      form.isDefault ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Mặc định</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Áp dụng cho hệ thống</p>
                </div>
              </div>

              <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-700/40">
                <button
                  type="button"
                  onClick={() => onFieldChange('isActive', !form.isActive)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  role="switch"
                  aria-checked={form.isActive}
                  aria-label="Kích hoạt thông báo"
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-8' : 'translate-x-1'}`}
                  />
                </button>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Kích hoạt</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bật để sử dụng</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/40">
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">Thư viện placeholder</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Click vào placeholder để chèn vào vị trí con trỏ.</p>
            </div>

            {placeholdersError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-900/30 dark:text-amber-300">
                {placeholdersError}
              </div>
            )}

            <div className="space-y-2">
              {groupedPlaceholders.map((group) => (
                <div key={group.category} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{group.category}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.items.map((placeholder) => (
                      <button
                        key={placeholder.key}
                        type="button"
                        title={placeholder.description}
                        onClick={() => insertPlaceholder(placeholder.key)}
                        disabled={placeholdersLoading}
                        className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-blue-900/20"
                      >
                        {placeholder.key}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
        <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || isLoadingDetail}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'update' ? 'Cập nhật mẫu' : 'Tạo mẫu mới'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}