"use client";

/**
 * FinancialReportColumnSidebar — 3-level tree column manager
 * Level 1: Top-group (Cân đối kế toán, Kết quả kinh doanh, …)
 * Level 2: Sub-group (Tài sản ngắn hạn, Tài sản dài hạn, …)
 * Level 3: Individual columns (Tiền mặt, Hàng tồn kho, …)
 */

import React, { useState } from "react";
import { X, RotateCcw, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useFinancialReportColumnStore,
  FINANCIAL_COLUMN_STRUCTURE,
} from "@/stores/financialReportColumnStore";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: count visible fields in a list
// ─────────────────────────────────────────────────────────────────────────────
function useFieldVisibleCount(fields: { field: string }[]) {
  const { fields: fieldState } = useFinancialReportColumnStore();
  const visible = fields.filter((f) => fieldState[f.field] !== false).length;
  return { visible, total: fields.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// Level-3: individual field row
// ─────────────────────────────────────────────────────────────────────────────
function FieldRow({
  field,
  label,
  isDark,
  locked = false,
}: {
  field: string;
  label: string;
  isDark: boolean;
  locked?: boolean;
}) {
  const { fields, toggleField } = useFinancialReportColumnStore();
  const isVisible = locked ? true : fields[field] !== false;

  return (
    <label
      className={`flex items-center gap-2 py-1.5 px-3 rounded transition-colors ${
        locked
          ? 'cursor-not-allowed opacity-60'
          : isDark ? 'cursor-pointer hover:bg-gray-700/40' : 'cursor-pointer hover:bg-gray-100'
      }`}
    >
      <input
        type="checkbox"
        checked={isVisible}
        disabled={locked}
        onChange={() => !locked && toggleField(field)}
        className="w-3.5 h-3.5 rounded cursor-pointer disabled:cursor-not-allowed"
      />
      <span className={`text-xs flex-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        {label}
      </span>
      {locked && (
        <Lock size={11} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
      )}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Level-2: sub-group accordion
// ─────────────────────────────────────────────────────────────────────────────
function SubGroupRow({
  groupId,
  label,
  fields,
  isDark,
}: {
  groupId: string;
  label: string;
  fields: { field: string; label: string }[];
  isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const {
    groups,
    fields: fieldState,
    toggleGroup,
    setSubGroupFieldsVisible,
  } = useFinancialReportColumnStore();

  const isGroupVisible = groups[groupId] !== false;
  const visibleFields = fields.filter(
    (f) => fieldState[f.field] !== false,
  ).length;
  const allFieldsVisible = visibleFields === fields.length;
  const someFieldsVisible = visibleFields > 0 && visibleFields < fields.length;

  const handleGroupCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    toggleGroup(groupId);
  };

  return (
    <div
      className={`rounded-lg border mb-1 ${
        isDark ? "border-gray-700 bg-gray-800/20" : "border-gray-200 bg-gray-50"
      } ${!isGroupVisible ? "opacity-50" : ""}`}
    >
      {/* Sub-group header */}
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer select-none ${
          isDark ? "hover:bg-gray-700/30" : "hover:bg-gray-100"
        }`}
        onClick={() => isGroupVisible && setExpanded((v) => !v)}
      >
        <input
          type="checkbox"
          checked={isGroupVisible}
          onChange={handleGroupCheck}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 rounded cursor-pointer"
        />
        <span
          className={`flex-1 text-xs font-medium ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {label}
        </span>
        {isGroupVisible && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full mr-1 ${
              isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500"
            }`}
          >
            {visibleFields}/{fields.length}
          </span>
        )}
        {isGroupVisible &&
          (expanded ? (
            <ChevronDown
              size={13}
              className={isDark ? "text-gray-500" : "text-gray-400"}
            />
          ) : (
            <ChevronRight
              size={13}
              className={isDark ? "text-gray-500" : "text-gray-400"}
            />
          ))}
      </div>

      {/* Column checkboxes (expanded) */}
      {isGroupVisible && expanded && (
        <div
          className={`border-t px-1 pb-1 ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          {/* Select all / deselect all row */}
          <label
            className={`flex items-center gap-2 py-1.5 px-3 rounded cursor-pointer transition-colors ${
              isDark ? "hover:bg-gray-700/40" : "hover:bg-gray-100"
            }`}
          >
            <input
              type="checkbox"
              checked={allFieldsVisible}
              ref={(el) => {
                if (el) el.indeterminate = someFieldsVisible;
              }}
              onChange={(e) =>
                setSubGroupFieldsVisible(groupId, e.target.checked)
              }
              className="w-3.5 h-3.5 rounded cursor-pointer"
            />
            <span
              className={`text-xs font-semibold ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Tất cả
            </span>
          </label>

          {fields.map((f) => (
            <FieldRow
              key={f.field}
              field={f.field}
              label={f.label}
              isDark={isDark}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Level-1: top-group accordion
// ─────────────────────────────────────────────────────────────────────────────
function TopGroupSection({
  groupDef,
  isDark,
}: {
  groupDef: (typeof FINANCIAL_COLUMN_STRUCTURE)[number];
  isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const {
    groups,
    fields: fieldState,
    toggleGroup,
  } = useFinancialReportColumnStore();
  const isGroupVisible = groupDef.locked
    ? true
    : groups[groupDef.groupId] !== false;

  // Count visible fields across all sub-groups and direct fields
  const allFields = [
    ...(groupDef.fields ?? []),
    ...(groupDef.subGroups?.flatMap((s) => s.fields) ?? []),
  ];
  const visibleCount = allFields.filter(
    (f) => fieldState[f.field] !== false,
  ).length;

  return (
    <div
      className={`rounded-xl border mb-3 ${
        isDark ? "border-gray-700 bg-gray-800/30" : "border-gray-200 bg-white"
      } ${!isGroupVisible ? "opacity-50" : ""}`}
    >
      {/* Top-group header */}
      <div
        className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none rounded-xl ${
          isDark ? "hover:bg-gray-700/30" : "hover:bg-gray-50"
        }`}
        onClick={() => !groupDef.locked && setExpanded((v) => !v)}
      >
        {!groupDef.locked && (
          <input
            type="checkbox"
            checked={isGroupVisible}
            onChange={(e) => {
              e.stopPropagation();
              toggleGroup(groupDef.groupId);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded cursor-pointer"
          />
        )}
        <span
          className={`flex-1 text-sm font-semibold ${
            isDark ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {groupDef.label}
        </span>
        {groupDef.locked && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              isDark ? "bg-gray-700 text-gray-500" : "bg-gray-200 text-gray-400"
            }`}
          >
            Cố định
          </span>
        )}
        {!groupDef.locked && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full mr-1 ${
              isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500"
            }`}
          >
            {visibleCount}/{allFields.length}
          </span>
        )}
        {expanded ? (
          <ChevronDown
            size={15}
            className={isDark ? "text-gray-500" : "text-gray-400"}
          />
        ) : (
          <ChevronRight
            size={15}
            className={isDark ? "text-gray-500" : "text-gray-400"}
          />
        )}
      </div>

      {/* Content */}
      {expanded && isGroupVisible && (
        <div
          className={`border-t px-2 py-2 ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          {/* Direct fields (e.g. Cash Flow, Tài liệu) */}
          {groupDef.fields?.map((f) => (
            <FieldRow
              key={f.field}
              field={f.field}
              label={f.label}
              isDark={isDark}
              locked={groupDef.locked}
            />
          ))}

          {/* Sub-groups */}
          {groupDef.subGroups?.map((sub) => (
            <SubGroupRow
              key={sub.groupId}
              groupId={sub.groupId}
              label={sub.label}
              fields={sub.fields}
              isDark={isDark}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Sidebar
// ─────────────────────────────────────────────────────────────────────────────
export function FinancialReportColumnSidebar({
  onResetToDefault,
}: {
  onResetToDefault?: () => void | Promise<void>;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isSidebarOpen, setSidebarOpen } =
    useFinancialReportColumnStore();

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar panel */}
      <div
        className={`fixed right-0 top-0 h-full w-80 z-50 shadow-2xl flex flex-col ${
          isDark
            ? "bg-[#282832] border-l border-gray-800"
            : "bg-white border-l border-gray-200"
        }`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 border-b flex items-center gap-3 ${
            isDark ? "border-gray-800" : "border-gray-200"
          }`}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <X size={18} />
          </button>
          <h3
            className={`text-base font-semibold flex-1 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Quản lý cột
          </h3>
          <button
            onClick={() => {
              void onResetToDefault?.();
            }}
            title="Đặt lại mặc định"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors mr-6 ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
          >
            <RotateCcw size={13} />
            Mặc định
          </button>
        </div>

        {/* Scrollable group list */}
        <div className="flex-1 overflow-y-auto p-3">
          {FINANCIAL_COLUMN_STRUCTURE.map((groupDef) => (
            <TopGroupSection
              key={groupDef.groupId}
              groupDef={groupDef}
              isDark={isDark}
            />
          ))}
        </div>
      </div>
    </>
  );
}
