"use client";

import React from 'react';

interface AlertFiltersProps {
  typeFilter: string;
  conditionFilter: string;
  onTypeChange: (value: string) => void;
  onConditionChange: (value: string) => void;
  borderCls: string;
  fieldBg: string;
  textMuted: string;
  textPrimary: string;
  isLoading?: boolean;
}

export function AlertFilters({
  typeFilter,
  conditionFilter,
  onTypeChange,
  onConditionChange,
  borderCls,
  fieldBg,
  textMuted,
  textPrimary,
  isLoading = false,
}: AlertFiltersProps) {
  return (
    <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end">
      <label className={`relative flex-1 rounded-xl border ${borderCls} ${fieldBg} p-3 transition-colors`}>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Loại cảnh báo</span>
        <select
          value={typeFilter}
          onChange={(event) => onTypeChange(event.target.value)}
          disabled={isLoading}
          className={`mt-2 w-full appearance-none bg-inherit pr-8 pl-2 text-sm outline-none transition-all focus:outline-none focus:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${textPrimary}`}
        >
          <option value="">Tất cả loại</option>
          <option value="1">Giá</option>
          <option value="2">Khối lượng</option>
        </select>
        <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors ${textMuted}`}>▾</span>
      </label>

      <label className={`relative flex-1 rounded-xl border ${borderCls} ${fieldBg} p-3 transition-colors`}>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Loại điều kiện</span>
        <select
          value={conditionFilter}
          onChange={(event) => onConditionChange(event.target.value)}
          disabled={isLoading}
          className={`mt-2 w-full appearance-none bg-inherit pr-8 pl-2 text-sm outline-none transition-all focus:outline-none focus:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${textPrimary}`}
        >
          <option value="">Tất cả điều kiện</option>
          <option value="1">Trên ngưỡng</option>
          <option value="2">Dưới ngưỡng</option>
          <option value="3">Tăng %</option>
          <option value="4">Giảm %</option>
        </select>
        <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors ${textMuted}`}>▾</span>
      </label>
    </div>
  );
}
