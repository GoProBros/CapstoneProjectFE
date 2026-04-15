"use client";

import React from 'react';
import type { PortfolioDto } from '@/types/portfolio';
import { getStatusLabel, formatDateTime } from '../helpers';

interface PortfolioListProps {
  portfolios: PortfolioDto[];
  loading: boolean;
  onPortfolioClick: (portfolio: PortfolioDto) => void;
  onMenuClick: (portfolio: PortfolioDto, button: HTMLButtonElement) => void;
  bgSub: string;
  bgCard: string;
  borderCls: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  hoverBg: string;
}

export function PortfolioList({
  portfolios,
  loading,
  onPortfolioClick,
  onMenuClick,
  bgSub,
  bgCard,
  borderCls,
  textPrimary,
  textSecondary,
  textMuted,
  hoverBg,
}: PortfolioListProps) {
  return (
    <div className={`rounded-2xl border ${borderCls} ${bgCard} p-4 md:p-5 shadow-sm`}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h3 className={`text-xl font-extrabold ${textPrimary}`}>Danh mục đầu tư</h3>
      </div>

      <div className={`overflow-hidden rounded-xl border ${borderCls}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-700">
            <thead className={`${bgSub} text-xs uppercase tracking-wider ${textMuted}`}>
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Tên danh mục</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className={`${bgCard} divide-y divide-gray-100 dark:divide-gray-800`}>
              {loading ? (
                <tr>
                  <td className={`px-4 py-8 text-center text-sm ${textSecondary}`} colSpan={5}>
                    Đang tải danh mục...
                  </td>
                </tr>
              ) : portfolios.length === 0 ? (
                <tr>
                  <td className={`px-4 py-8 text-center text-sm ${textSecondary}`} colSpan={5}>
                    Không có danh mục nào.
                  </td>
                </tr>
              ) : (
                portfolios.map((portfolio) => (
                  <tr key={portfolio.id} className={`transition-colors ${hoverBg}`}>
                    <td className={`px-4 py-3 font-semibold ${textPrimary}`}>{portfolio.id}</td>
                    <td className={`px-4 py-3 ${textPrimary}`}>{portfolio.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          portfolio.status === 1 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'
                        }`}
                      >
                        {getStatusLabel(portfolio.status)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${textSecondary}`}>{formatDateTime(portfolio.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(event) => onMenuClick(portfolio, event.currentTarget as HTMLButtonElement)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xl font-bold ${hoverBg} ${textSecondary}`}
                      >
                        ⋮
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
