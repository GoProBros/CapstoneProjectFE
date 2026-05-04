"use client";

import React from 'react';
import type { AlertDto } from '@/types/alert';
import { formatCurrencyVnd, getAlertTypeLabel, getAlertConditionLabel } from '../helpers';
import { Spinner } from '../Spinner';

type AlertSortKey = 'id' | 'ticker' | 'type' | 'condition' | 'isTriggered' | 'isActive' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

interface AlertTableProps {
  alerts: AlertDto[];
  loading: boolean;
  sortKey: AlertSortKey;
  sortDirection: SortDirection;
  onSort: (key: AlertSortKey) => void;
  onRowClick: (alert: AlertDto) => void;
  bgSub: string;
  bgCard: string;
  borderCls: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  hoverBg: string;
}

function getSortIndicator(activeKey: AlertSortKey, currentKey: AlertSortKey, direction: SortDirection): string {
  if (activeKey !== currentKey) return '↕';
  return direction === 'asc' ? '↑' : '↓';
}

function getTriggerValue(alert: AlertDto): string {
  if (alert.condition === 1 || alert.condition === 2) {
    return formatCurrencyVnd(alert.thresholdValue !== null ? alert.thresholdValue : null);
  }

  if (alert.condition === 3 || alert.condition === 4) {
    if (alert.changePercentage == null || Number.isNaN(alert.changePercentage)) {
      return '—';
    }

    const sign = alert.condition === 3 ? '+' : '-';
    const formatted = new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 2,
    }).format(Math.abs(alert.changePercentage));
    return `${sign}${formatted}%`;
  }

  return '—';
}

export function AlertTable({
  alerts,
  loading,
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  bgSub,
  bgCard,
  borderCls,
  textPrimary,
  textSecondary,
  textMuted,
  hoverBg,
}: AlertTableProps) {
  return (
    <div className={`mt-5 overflow-hidden rounded-xl border ${borderCls}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-700">
          <thead className={`${bgSub} text-xs uppercase tracking-wider ${textMuted}`}>
            <tr>
              <th className="px-4 py-3">
                <button type="button" onClick={() => onSort('id')} className="inline-flex items-center gap-1 font-semibold">
                  ID <span>{getSortIndicator(sortKey, 'id', sortDirection)}</span>
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => onSort('ticker')} className="inline-flex items-center gap-1 font-semibold">
                  Ticker <span>{getSortIndicator(sortKey, 'ticker', sortDirection)}</span>
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => onSort('type')} className="inline-flex items-center gap-1 font-semibold">
                  Loại <span>{getSortIndicator(sortKey, 'type', sortDirection)}</span>
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => onSort('condition')} className="inline-flex items-center gap-1 font-semibold">
                  Điều kiện <span>{getSortIndicator(sortKey, 'condition', sortDirection)}</span>
                </button>
              </th>
              <th className="px-4 py-3">Giá trị kích hoạt</th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => onSort('isTriggered')} className="inline-flex items-center gap-1 font-semibold">
                  Trạng thái <span>{getSortIndicator(sortKey, 'isTriggered', sortDirection)}</span>
                </button>
              </th>
              <th className="px-4 py-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className={`${bgCard} divide-y divide-gray-100 dark:divide-gray-800`}>
            {loading ? (
              <tr>
                <td className="px-4 py-8" colSpan={7}>
                  <div className="flex items-center justify-center gap-2 text-sm text-green-500">
                    <Spinner className="h-5 w-5" />
                    Đang tải danh sách cảnh báo...
                  </div>
                </td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td className={`px-4 py-10 text-center text-sm ${textSecondary}`} colSpan={7}>
                  Chưa có cảnh báo nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className={`transition-colors ${hoverBg} cursor-pointer`} onClick={() => onRowClick(alert)}>
                  <td className={`px-4 py-3 font-semibold ${textPrimary}`}>{alert.id}</td>
                  <td className={`px-4 py-3 ${textPrimary}`}>{alert.ticker}</td>
                  <td className={`px-4 py-3 ${textPrimary}`}>{getAlertTypeLabel(alert.type)}</td>
                  <td className={`px-4 py-3 ${textPrimary}`}>{getAlertConditionLabel(alert.condition)}</td>
                  <td className={`px-4 py-3 ${textPrimary}`}>{getTriggerValue(alert)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        alert.isTriggered ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-500'
                      }`}
                    >
                      {alert.isTriggered ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRowClick(alert);
                      }}
                      className={`text-xs border rounded-3xl px-6 py-1 font-semibold text-blue-500 hover:bg-gray-500 ${textPrimary}`}
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
