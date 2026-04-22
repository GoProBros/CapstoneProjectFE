"use client";

import React from 'react';
import type { TransactionSideValue } from '@/types/portfolio';

interface AddTransactionModalProps {
  isOpen: boolean;
  isSaving: boolean;
  error: string | null;
  ticker: string;
  form: {
    side: TransactionSideValue;
    quantity: string;
    price: string;
    transactionDate: string;
    note: string;
  };
  onClose: () => void;
  onSubmit: () => Promise<void>;
  onFormChange: (field: string, value: string | number) => void;
  borderCls: string;
  bgCard: string;
  fieldBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  hoverBg: string;
}

export function AddTransactionModal({
  isOpen,
  isSaving,
  error,
  ticker,
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
}: AddTransactionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => !isSaving && onClose()}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl border ${borderCls} ${bgCard} p-5`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className={`text-lg font-bold ${textPrimary}`}>Thêm giao dịch</h3>
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
          <div className="flex flex-col gap-3 md:flex-row">
            <label className={`block rounded-xl border ${borderCls} ${fieldBg} p-3 md:w-36 md:flex-shrink-0`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Ticker</span>
              <p className={`mt-2 text-sm font-semibold ${textPrimary}`}>{ticker || '—'}</p>
            </label>

            <label className={`relative block rounded-xl border ${borderCls} ${fieldBg} p-3 md:flex-1`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Loại giao dịch</span>
              <select
                value={form.side}
                onChange={(event) => onFormChange('side', Number(event.target.value))}
                className={`mt-2 w-full appearance-none bg-inherit pr-8 text-sm outline-none transition-all pl-2 ${textPrimary}`}
              >
                <option value={1}>Mua</option>
                <option value={2}>Bán</option>
              </select>
              <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${textMuted}`}>▾</span>
            </label>

            <label className={`block rounded-xl border ${borderCls} ${fieldBg} p-3 md:flex-1`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Ngày giao dịch</span>
              <input
                type="datetime-local"
                value={form.transactionDate}
                onChange={(event) => onFormChange('transactionDate', event.target.value)}
                className={`mt-2 w-full bg-transparent text-sm ${textPrimary} outline-none`}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className={`block rounded-xl border ${borderCls} ${fieldBg} p-3`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Khối lượng</span>
            <input
              value={form.quantity}
              onChange={(event) => onFormChange('quantity', event.target.value)}
              inputMode="decimal"
              className={`mt-2 w-full bg-transparent text-sm ${textPrimary} outline-none`}
              placeholder="0"
            />
          </label>

          <label className={`block rounded-xl border ${borderCls} ${fieldBg} p-3`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Giá</span>
            <input
              value={form.price}
              onChange={(event) => onFormChange('price', event.target.value)}
              inputMode="decimal"
              className={`mt-2 w-full bg-transparent text-sm ${textPrimary} outline-none`}
              placeholder="0"
            />
          </label>

          </div>
        </div>

        <label className={`mt-4 block rounded-xl border ${borderCls} ${fieldBg} p-3`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Ghi chú</span>
          <textarea
            value={form.note}
            onChange={(event) => onFormChange('note', event.target.value)}
            className={`mt-2 min-h-24 w-full resize-none bg-transparent text-sm ${textPrimary} outline-none`}
            placeholder="Ghi chú giao dịch"
          />
        </label>

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
            {isSaving ? 'Đang lưu...' : 'Thêm giao dịch'}
          </button>
        </div>
      </div>
    </div>
  );
}
