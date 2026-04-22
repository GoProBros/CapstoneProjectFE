"use client";

import React from "react";
import { createPortal } from "react-dom";
import type { AlertDto } from "@/types/alert";
import {
  getAlertTypeLabel,
  getAlertConditionLabel,
  getAlertStatusLabel,
  formatDateTime,
} from "../helpers";
import { Spinner } from "../Spinner";

interface AlertDetailModalProps {
  isOpen: boolean;
  alert: AlertDto | null;
  loading: boolean;
  error: string | null;
  isChangingStatus: boolean;
  onClose: () => void;
  onToggleStatus: () => Promise<void>;
  borderCls: string;
  bgCard: string;
  fieldBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  hoverBg: string;
}

export function AlertDetailModal({
  isOpen,
  alert,
  loading,
  error,
  isChangingStatus,
  onClose,
  onToggleStatus,
  borderCls,
  bgCard,
  fieldBg,
  textPrimary,
  textSecondary,
  textMuted,
  hoverBg,
}: AlertDetailModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
      onClick={() => !isChangingStatus && onClose()}
    >
      <div
        className={`w-full max-w-3xl rounded-2xl border ${borderCls} ${bgCard} p-5`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className={`text-lg font-bold ${textPrimary}`}>
              Chi tiết cảnh báo
            </h3>
            <p className={`text-sm ${textSecondary}`}>
              {alert ? `Cảnh báo #${alert.id}` : "Đang tải chi tiết..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onToggleStatus()}
              disabled={!alert || isChangingStatus}
              className={`rounded-xl px-4 py-2 mr-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                alert?.isActive
                  ? "bg-red-300 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {isChangingStatus ? "Đang đổi trạng thái..." : "Đổi trạng thái"}
            </button>
            <button
              type="button"
              onClick={() => !isChangingStatus && onClose()}
              disabled={isChangingStatus}
              aria-label="Đóng modal"
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 hover:bg-red-500 ${textSecondary}`}
            >
              X
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-green-500">
            <Spinner className="h-5 w-5" />
            <span className="ml-2">Đang tải chi tiết cảnh báo...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        ) : alert ? (
          <div className="space-y-4">
            <div className={`rounded-xl border ${borderCls} ${fieldBg} p-4`}>
              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}
              >
                Tên cảnh báo
              </p>
              <p className={`mt-1 text-sm font-medium ${textPrimary}`}>
                {alert.name}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[
                ["Ticker", alert.ticker],
                ["Loại", getAlertTypeLabel(alert.type)],
                ["Điều kiện", getAlertConditionLabel(alert.condition)],
                [
                  "Ngưỡng",
                  alert.thresholdValue != null
                    ? String(alert.thresholdValue)
                    : "—",
                ],
                [
                  "Biến động (%)",
                  alert.changePercentage != null
                    ? String(alert.changePercentage)
                    : "—",
                ],
                ["Trạng thái", getAlertStatusLabel(alert.isActive)],
                ["Đã kích hoạt", alert.isTriggered ? "Có" : "Không"],
                ["Ngày tạo", formatDateTime(alert.createdAt)],
                ["Cập nhật", formatDateTime(alert.updatedAt)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className={`rounded-lg border ${borderCls} ${fieldBg} p-3`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}
                  >
                    {label}
                  </p>
                  <p className={`mt-1 text-sm font-medium ${textPrimary}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
