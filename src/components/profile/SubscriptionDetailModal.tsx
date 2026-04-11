"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { SubscriptionDto } from "@/types/subscription";
import { formatPrice, levelOrderLabel } from "./helpers";
import { ModulePreviewPanel } from "./ModulePreviewPanel";
import { normalizeAllowedModulesWithPreview } from "./modulePreviewUtils";
import { useProfileTheme } from "./useProfileTheme";

interface SubscriptionDetailModalProps {
  sub: SubscriptionDto;
  onClose: () => void;
  onUpgrade?: (sub: SubscriptionDto) => void;
}

export function SubscriptionDetailModal({
  sub,
  onClose,
  onUpgrade,
}: SubscriptionDetailModalProps) {
  const {
    bgCard,
    bgSub,
    borderCls,
    textPrimary,
    textSecondary,
    textMuted,
    hoverBg,
  } = useProfileTheme();

  const modules = useMemo(
    () => normalizeAllowedModulesWithPreview(sub.allowedModules),
    [sub.allowedModules],
  );
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  useEffect(() => {
    setHoveredKey(modules[0]?.key ?? null);
  }, [modules, sub.id]);

  const hoveredModule = useMemo(() => {
    if (modules.length === 0) return null;
    const found = modules.find((m) => m.key === hoveredKey);
    return found ?? modules[0];
  }, [modules, hoveredKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-5xl rounded-2xl border ${bgCard} ${borderCls} p-6 space-y-5 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-bold ${textPrimary}`}>
            Detail Subscription
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${hoverBg} ${textSecondary}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-4">
            <div
              className={`space-y-3 rounded-xl border ${borderCls} p-4 ${bgSub}`}
            >
              {(
                [
                  ["Tên gói", sub.name],
                  ["Cấp độ", levelOrderLabel(sub.levelOrder)],
                  ["Workspace tối đa", sub.maxWorkspaces.toString()],
                  ["Giá", formatPrice(sub.price)],
                  ["Thời hạn", `${sub.durationInDays} ngày`],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className={`text-sm ${textSecondary}`}>{label}</span>
                  <span className={`text-sm font-medium ${textPrimary}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className={`rounded-xl border ${borderCls} p-4 ${bgSub}`}>
              <p className={`text-sm font-semibold mb-3 ${textPrimary}`}>
                Allowed module
              </p>
              {modules.length === 0 ? (
                <p className={`text-sm ${textSecondary}`}>Tất cả module</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {modules.map((module) => {
                    const isActive = hoveredModule?.key === module.key;
                    return (
                      <button
                        key={`${module.key}-${module.label}`}
                        type="button"
                        onMouseEnter={() => setHoveredKey(module.key)}
                        onFocus={() => setHoveredKey(module.key)}
                        onClick={() => setHoveredKey(module.key)}
                        className={`rounded-md border px-2 py-1.5 text-xs font-medium text-left truncate transition-colors ${
                          isActive
                            ? "border-green-500 text-green-500 bg-green-500/10"
                            : `${borderCls} ${textSecondary} ${hoverBg}`
                        }`}
                        title={module.label}
                      >
                        {module.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <ModulePreviewPanel
              moduleItem={hoveredModule}
              borderCls={borderCls}
              bgSub={bgSub}
              textPrimary={textPrimary}
              textMuted={textMuted}
              emptyTitle="Module previews"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-lg border ${borderCls} ${textSecondary} ${hoverBg} text-sm font-medium transition-colors`}
          >
            Đóng
          </button>
          <button
            onClick={() => {
              if (onUpgrade) {
                onUpgrade(sub);
                return;
              }
              onClose();
            }}
            className="flex-1 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
          >
            Nâng cấp
          </button>
        </div>
      </div>
    </div>
  );
}
