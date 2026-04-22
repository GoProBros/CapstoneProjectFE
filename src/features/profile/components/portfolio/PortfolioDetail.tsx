"use client";

import React from 'react';
import type { PortfolioDto } from '@/types/portfolio';
import { formatDateTime, formatCurrencyVnd } from '../helpers';
import { Spinner } from '../Spinner';

interface PortfolioDetailProps {
  portfolio: PortfolioDto | null;
  loading: boolean;
  onClose: () => void;
  onAddTransaction: () => void;
  onEditPortfolio: () => void;
  bgSub: string;
  bgCard: string;
  borderCls: string;
  fieldBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  hoverBg: string;
}

export function PortfolioDetail({
  portfolio,
  loading,
  onClose,
  onAddTransaction,
  onEditPortfolio,
  bgSub,
  bgCard,
  borderCls,
  fieldBg,
  textPrimary,
  textSecondary,
  textMuted,
  hoverBg,
}: PortfolioDetailProps) {
  const formatQuantity = (value: number): string =>
    new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);

  const getPnlClass = (value: number): string => {
    if (value > 0) return 'text-emerald-500';
    if (value < 0) return 'text-red-500';
    return textPrimary;
  };

  return (
    <div className={`rounded-2xl border ${borderCls} ${bgCard} p-4 md:p-5 shadow-sm`}>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg border ${borderCls} px-3 py-2 text-sm font-medium ${textSecondary} ${hoverBg}`}
          >
            ←
          </button>
          <div>
            <h3 className={`text-xl font-extrabold ${textPrimary}`}>Chi tiết danh mục đầu tư</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEditPortfolio}
            className={`rounded-lg border ${borderCls} px-3 py-2 text-sm font-medium ${textSecondary} ${hoverBg}`}
          >
            Chỉnh sửa
          </button>

          <button
            type="button"
            onClick={onAddTransaction}
            className="rounded-xl border-2 border-black px-4 py-2 text-sm font-bold text-black transition-transform hover:-translate-y-0.5 dark:border-white dark:text-white"
          >
            + Thêm giao dịch
          </button>
        </div>
      </div>

      {portfolio ? (
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className={`rounded-lg border ${borderCls} ${fieldBg} p-3`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Tên danh mục</p>
                <p className={`mt-1 text-sm font-medium ${textPrimary}`}>{portfolio.name?.trim() || `Danh mục #${portfolio.id}`}</p>
              </div>

              <div className={`rounded-lg border ${borderCls} ${fieldBg} p-3`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Mã chứng khoán</p>
                <p className={`mt-1 text-sm font-medium ${textPrimary}`}>{portfolio.ticker || '—'}</p>
              </div>

              <div className={`rounded-lg border ${borderCls} ${fieldBg} p-3`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Tổng lợi nhuận</p>
                <p className={`mt-1 text-sm font-semibold ${getPnlClass(portfolio.overall.totalPnL)}`}>
                  {formatCurrencyVnd(portfolio.overall.totalPnL)}
                </p>
              </div>

              <div className={`rounded-lg border ${borderCls} ${fieldBg} p-3`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Ngày tạo</p>
                <p className={`mt-1 text-sm font-medium ${textPrimary}`}>{formatDateTime(portfolio.createdAt)}</p>
              </div>
            </div>

            <div className={`rounded-xl border ${borderCls} ${fieldBg} p-4`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Mô tả</p>
              <p className={`mt-1 text-sm font-medium ${textPrimary}`}>{portfolio.description || '—'}</p>
            </div>
          </div>

          <section className={`rounded-xl border ${borderCls} ${fieldBg} p-4`}>
            <h4 className={`text-sm font-bold uppercase tracking-wider ${textMuted}`}>Tóm tắt</h4>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {[
                ['Giá mua trung bình', formatCurrencyVnd(portfolio.summary.averagePrice)],
                ['Giá hiện tại', formatCurrencyVnd(portfolio.summary.currentPrice)],
                ['Giá trị nắm giữ', formatCurrencyVnd(portfolio.summary.holdingValue)],
                ['Số lượng còn lại', formatQuantity(portfolio.summary.remainingQuantity)],
                [
                  'Lợi nhuận dự kiến',
                  
                  `${formatCurrencyVnd(portfolio.summary.unrealizedPnL)} (${portfolio.summary.unrealizedPnLPercent.toFixed(2)}%)`,
                ],
              ].map(([label, value]) => (
                <div key={label} className={`rounded-lg border ${borderCls} ${bgCard} p-3`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>{label}</p>
                  <p className={`mt-1 text-sm font-semibold ${label === 'Lợi nhuận dự kiến' ? getPnlClass(portfolio.summary.unrealizedPnL) : textPrimary}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className={`rounded-xl border ${borderCls} ${fieldBg} p-4`}>
            <h4 className={`text-sm font-bold uppercase tracking-wider ${textMuted}`}>Thống kê giao dịch</h4>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                ['Tổng số lượng mua', formatQuantity(portfolio.historyPerformance.totalBuyQuantity)],
                ['Tổng số lượng bán', formatQuantity(portfolio.historyPerformance.totalSellQuantity)],
                ['Lợi nhuận thực tế', formatCurrencyVnd(portfolio.historyPerformance.realizedPnL)],
              ].map(([label, value]) => (
                <div key={label} className={`rounded-lg border ${borderCls} ${bgCard} p-3`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>{label}</p>
                  <p className={`mt-1 text-sm font-semibold ${label === 'Lợi nhuận thực tế' ? getPnlClass(portfolio.historyPerformance.realizedPnL) : textPrimary}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className={`overflow-hidden rounded-xl border ${borderCls}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-700">
                <thead className={`${bgSub} text-xs uppercase tracking-wider ${textMuted}`}>
                  <tr>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Lệnh</th>
                    <th className="px-4 py-3">Khối lượng</th>
                    <th className="px-4 py-3">Giá</th>
                    <th className="px-4 py-3">Tổng giá trị</th>
                    <th className="px-4 py-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className={`${bgCard} divide-y divide-gray-100 dark:divide-gray-800`}>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-8" colSpan={6}>
                        <div className="flex items-center justify-center gap-2 text-sm text-green-500">
                          <Spinner className="h-5 w-5" />
                          Đang tải giao dịch...
                        </div>
                      </td>
                    </tr>
                  ) : portfolio.transactionHistory.length === 0 ? (
                    <tr>
                      <td className={`px-4 py-8 text-center text-sm ${textSecondary}`} colSpan={6}>
                        Chưa có giao dịch nào.
                      </td>
                    </tr>
                  ) : (
                    portfolio.transactionHistory.map((history, index) => (
                      <tr key={`${history.transactionDate}-${index}`} className={`transition-colors ${hoverBg}`}>
                        <td className={`px-4 py-3 ${textSecondary}`}>{formatDateTime(history.transactionDate)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              history.side === 1
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-red-500/15 text-red-500'
                            }`}
                          >
                            {history.side === 1 ? 'MUA' : 'BÁN'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-medium ${textPrimary}`}>{formatQuantity(history.quantity)}</td>
                        <td className={`px-4 py-3 ${textPrimary}`}>{formatCurrencyVnd(history.price)}</td>
                        <td className={`px-4 py-3 font-semibold ${textPrimary}`}>{formatCurrencyVnd(history.totalValue)}</td>
                        <td className={`px-4 py-3 ${textSecondary}`}>{history.note?.trim() || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className={`rounded-xl border ${borderCls} ${fieldBg} p-4 text-sm ${textSecondary}`}>
          Không thể tải chi tiết danh mục.
        </div>
      )}
    </div>
  );
}
