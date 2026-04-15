"use client";

import React from 'react';

interface PortfolioEditModalProps {
  isOpen: boolean;
  isSaving: boolean;
  error: string | null;
  form: {
    name: string;
    description: string;
    status: "1" | "0";
  };
  onClose: () => void;
  onSubmit: () => Promise<void>;
  onFormChange: (field: string, value: string) => void;
  borderCls: string;
  bgCard: string;
  fieldBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  hoverBg: string;
}

export function PortfolioEditModal({
  isOpen,
  isSaving,
  error,
  form,
  onClose,
  onSubmit,
  onFormChange,
  borderCls,
  bgCard,
  fieldBg,
  textPrimary,
  textSecondary,
  textMuted,
  hoverBg,
}: PortfolioEditModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => !isSaving && onClose()}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border ${borderCls} ${bgCard} p-5`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className={`text-lg font-bold ${textPrimary}`}>Chỉnh sửa danh mục</h3>
          <button
            type="button"
            onClick={() => !isSaving && onClose()}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold ${hoverBg} ${textSecondary}`}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <label className={`block rounded-xl border ${borderCls} ${fieldBg} p-3`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Tên danh mục</span>
            <input
              value={form.name}
              onChange={(event) => onFormChange('name', event.target.value)}
              className={`mt-2 w-full bg-transparent text-sm ${textPrimary} outline-none`}
            />
          </label>

          <label className={`block rounded-xl border ${borderCls} ${fieldBg} p-3`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Mô tả</span>
            <textarea
              value={form.description}
              onChange={(event) => onFormChange('description', event.target.value)}
              className={`mt-2 min-h-28 w-full resize-none bg-transparent text-sm ${textPrimary} outline-none`}
            />
          </label>

          <label className={`flex items-center justify-between rounded-xl border ${borderCls} ${fieldBg} px-4 py-3`}>
            <span className={`text-sm font-medium ${textPrimary}`}>Trạng thái hoạt động</span>
            <button
              type="button"
              onClick={() => onFormChange('status', form.status === '1' ? '0' : '1')}
              role="switch"
              aria-checked={form.status === '1'}
              className={`relative inline-flex h-8 w-20 items-center rounded-full border px-1 transition-colors ${
                form.status === '1'
                  ? 'border-green-500/40 bg-green-500/20'
                  : 'border-gray-400/40 bg-gray-400/20'
              }`}
            >
              <span
                className={`absolute h-7 w-7 rounded-full bg-white shadow-sm transition-transform ${
                  form.status === '1' ? 'translate-x-11' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onClose()}
            className={`rounded-lg border ${borderCls} px-4 py-2 text-sm ${textSecondary} ${hoverBg}`}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={isSaving}
            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
