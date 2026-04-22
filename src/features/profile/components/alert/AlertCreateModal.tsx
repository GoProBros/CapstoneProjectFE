"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import type { SymbolData } from '@/types/symbol';
import { AlertTickerSelector } from './AlertTickerSelector';

interface TickerOption extends Pick<SymbolData, 'ticker' | 'viCompanyName' | 'enCompanyName'> {}

interface AlertCreateModalProps {
  isOpen: boolean;
  isSaving: boolean;
  error: string | null;
  alertForm: {
    ticker: string;
    type: string;
    condition: string;
    changePercentage: string;
    thresholdValue: string;
    name: string;
  };
  symbols: TickerOption[];
  filteredSymbols: TickerOption[];
  tickerSearch: string;
  tickerDropdownOpen: boolean;
  symbolLoading: boolean;
  symbolError: string | null;
  symbolHasNextPage: boolean;
  selectedTickerLabel: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  onFormChange: (field: string, value: string) => void;
  onTickerChange: (ticker: string) => void;
  onTickerSearchChange: (search: string) => void;
  onTickerDropdownToggle: (open: boolean) => void;
  onLoadMoreSymbols: () => void;
  borderCls: string;
  bgCard: string;
  fieldBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  hoverBg: string;
}

function isThresholdCondition(condition: string): boolean {
  return condition === '1' || condition === '2';
}

function isPercentCondition(condition: string): boolean {
  return condition === '3' || condition === '4';
}

export function AlertCreateModal({
  isOpen,
  isSaving,
  error,
  alertForm,
  symbols,
  filteredSymbols,
  tickerSearch,
  tickerDropdownOpen,
  symbolLoading,
  symbolError,
  symbolHasNextPage,
  selectedTickerLabel,
  onClose,
  onSubmit,
  onFormChange,
  onTickerChange,
  onTickerSearchChange,
  onTickerDropdownToggle,
  onLoadMoreSymbols,
  borderCls,
  bgCard,
  fieldBg,
  textPrimary,
  textSecondary,
  textMuted,
  hoverBg,
}: AlertCreateModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4"
      onClick={() => !isSaving && onClose()}
    >
      <div
        className={`w-full max-w-4xl rounded-2xl border ${borderCls} ${bgCard} p-5`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-bold ${textPrimary}`}>Tạo cảnh báo</h3>
            <p className={`text-sm ${textSecondary}`}>Ticker chọn từ danh sách có tìm kiếm nhỏ và nút tải thêm.</p>
          </div>
          <button
            type="button"
            onClick={() => !isSaving && onClose()}
            className={`h-9 w-9 rounded-full text-lg font-bold ${hoverBg} ${textSecondary}`}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AlertTickerSelector
            selectedTicker={alertForm.ticker}
            symbols={symbols}
            filteredSymbols={filteredSymbols}
            tickerSearch={tickerSearch}
            dropdownOpen={tickerDropdownOpen}
            symbolLoading={symbolLoading}
            symbolError={symbolError}
            symbolHasNextPage={symbolHasNextPage}
            selectedTickerLabel={selectedTickerLabel}
            onTickerChange={onTickerChange}
            onSearchChange={onTickerSearchChange}
            onDropdownToggle={onTickerDropdownToggle}
            onLoadMore={onLoadMoreSymbols}
            borderCls={borderCls}
            fieldBg={fieldBg}
            textPrimary={textPrimary}
            textMuted={textMuted}
            textSecondary={textSecondary}
          />

          <label className={`rounded-xl border ${borderCls} ${fieldBg} p-3`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Tên cảnh báo</span>
            <input
              value={alertForm.name}
              onChange={(event) => onFormChange('name', event.target.value)}
              className={`mt-2 w-full bg-transparent text-sm ${textPrimary} outline-none`}
              placeholder="Tên cảnh báo"
            />
          </label>

          <label className={`relative rounded-xl border ${borderCls} ${fieldBg} p-3`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Loại cảnh báo</span>
            <select
              value={alertForm.type}
              onChange={(event) => onFormChange('type', event.target.value)}
              className={`mt-2 w-full appearance-none bg-inherit pr-8 text-sm outline-none transition-all focus:outline-none focus:ring-0 focus-visible:outline-none ${textPrimary}`}
            >
              <option value="1">Giá</option>
              <option value="2">Khối lượng</option>
            </select>
            <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${textMuted}`}>▾</span>
          </label>

          <label className={`relative rounded-xl border ${borderCls} ${fieldBg} p-3`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Điều kiện</span>
            <select
              value={alertForm.condition}
              onChange={(event) => {
                const nextCondition = event.target.value;
                onFormChange('condition', nextCondition);
                if (!isThresholdCondition(nextCondition)) {
                  onFormChange('thresholdValue', '');
                }
                if (!isPercentCondition(nextCondition)) {
                  onFormChange('changePercentage', '');
                }
              }}
              className={`mt-2 w-full appearance-none bg-inherit pr-8 text-sm outline-none transition-all focus:outline-none focus:ring-0 focus-visible:outline-none ${textPrimary}`}
            >
              <option value="1">Trên ngưỡng</option>
              <option value="2">Dưới ngưỡng</option>
              <option value="3">Tăng %</option>
              <option value="4">Giảm %</option>
            </select>
            <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${textMuted}`}>▾</span>
          </label>

          <label className={`rounded-xl border ${borderCls} ${fieldBg} p-3 ${isThresholdCondition(alertForm.condition) ? '' : 'opacity-60'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Giá trị ngưỡng</span>
            <input
              value={alertForm.thresholdValue}
              onChange={(event) => onFormChange('thresholdValue', event.target.value)}
              disabled={!isThresholdCondition(alertForm.condition)}
              inputMode="decimal"
              className={`mt-2 w-full bg-transparent text-sm ${textPrimary} outline-none disabled:cursor-not-allowed`}
              placeholder="0"
            />
          </label>

          <label className={`rounded-xl border ${borderCls} ${fieldBg} p-3 ${isPercentCondition(alertForm.condition) ? '' : 'opacity-60'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Biến động (%)</span>
            <input
              value={alertForm.changePercentage}
              onChange={(event) => onFormChange('changePercentage', event.target.value)}
              disabled={!isPercentCondition(alertForm.condition)}
              inputMode="decimal"
              className={`mt-2 w-full bg-transparent text-sm ${textPrimary} outline-none disabled:cursor-not-allowed`}
              placeholder="0"
            />
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
            {isSaving ? 'Đang lưu...' : 'Tạo cảnh báo'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
