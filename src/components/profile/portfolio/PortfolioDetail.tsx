"use client";

import React from 'react';
import type { PortfolioDto } from '@/types/portfolio';
import type { TradingTransactionDto } from '@/types/portfolio';
import { getStatusLabel, formatDateTime, formatCurrencyVnd } from '../helpers';
import { Spinner } from '../Spinner';

interface PortfolioDetailProps {
  portfolio: PortfolioDto | null;
  transactions: TradingTransactionDto[];
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
  transactions,
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

        <button
          type="button"
          onClick={onAddTransaction}
          className="rounded-xl border-2 border-black px-4 py-2 text-sm font-bold text-black transition-transform hover:-translate-y-0.5 dark:border-white dark:text-white"
        >
          + Thêm giao dịch
        </button>
      </div>

      {portfolio ? (
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                ['Tên danh mục', portfolio.name ?? '—'],
                ['Trạng thái', getStatusLabel(portfolio.status)],
                ['Ngày tạo', formatDateTime(portfolio.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className={`rounded-lg border ${borderCls} ${fieldBg} p-3`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>{label}</p>
                  <p className={`mt-1 text-sm font-medium ${textPrimary}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className={`rounded-xl border ${borderCls} ${fieldBg} p-4`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Mô tả</p>
              <p className={`mt-1 text-sm font-medium ${textPrimary}`}>{portfolio.description || '—'}</p>
            </div>
          </div>

          <div className={`overflow-hidden rounded-xl border ${borderCls}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-700">
                <thead className={`${bgSub} text-xs uppercase tracking-wider ${textMuted}`}>
                  <tr>
                    <th className="px-4 py-3">Ticker</th>
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Khối lượng</th>
                    <th className="px-4 py-3">Giá</th>
                    <th className="px-4 py-3">Phí + Thuế</th>
                    <th className="px-4 py-3">Ngày giao dịch</th>
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
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td className={`px-4 py-8 text-center text-sm ${textSecondary}`} colSpan={6}>
                        Chưa có giao dịch nào.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className={`transition-colors ${hoverBg}`}>
                        <td className={`px-4 py-3 font-semibold ${textPrimary}`}>{tx.ticker}</td>
                        <td className={`px-4 py-3 ${textPrimary}`}>{tx.side === 1 ? 'Mua' : 'Bán'}</td>
                        <td className={`px-4 py-3 ${textPrimary}`}>{tx.quantity}</td>
                        <td className={`px-4 py-3 ${textPrimary}`}>{formatCurrencyVnd(tx.price)}</td>
                        <td className={`px-4 py-3 ${textPrimary}`}>{formatCurrencyVnd((tx.fee ?? 0) + (tx.tax ?? 0))}</td>
                        <td className={`px-4 py-3 ${textSecondary}`}>{formatDateTime(tx.transactionDate)}</td>
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
