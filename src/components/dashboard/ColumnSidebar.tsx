"use client";

import React, { useState } from "react";
import { useColumnStore } from "@/stores/columnStore";
import { useTheme } from "@/contexts/ThemeContext";
import { X, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Column groups & labels — same data as before
// ─────────────────────────────────────────────────────────────────────────────

const columnGroups = [
  {
    title: "THÔNG TIN GIAO DỊCH",
    fields: [
      "ticker",
      "ceilingPrice",
      "floorPrice",
      "referencePrice",
      "bidPrice3",
      "bidVol3",
      "bidPrice2",
      "bidVol2",
      "bidPrice1",
      "bidVol1",
      "lastPrice",
      "lastVol",
      "change",
      "ratioChange",
      "askPrice1",
      "askVol1",
      "askPrice2",
      "askVol2",
      "askPrice3",
      "askVol3",
      "totalVol",
      "highest",
      "lowest",
      "avgPrice",
      "totalVal",
      "side",
      "tradingSession",
      "tradingStatus",
      "totalBuyVol",
      "totalSellVol",
    ],
  },
  {
    title: "ĐẦU TƯ NƯỚC NGOÀI",
    fields: ["fBuyVol", "fSellVol", "fBuyVal", "fSellVal", "totalRoom", "currentRoom"],
  },
];

const columnLabels: Record<string, string> = {
  ticker: "Mã CK",
  ceilingPrice: "Giá trần",
  floorPrice: "Giá sàn",
  referencePrice: "Tham chiếu",
  bidPrice3: "Giá mua 3",
  bidVol3: "KL mua 3",
  bidPrice2: "Giá mua 2",
  bidVol2: "KL mua 2",
  bidPrice1: "Giá mua 1",
  bidVol1: "KL mua 1",
  lastPrice: "Giá khớp",
  lastVol: "KL khớp",
  change: "+/-",
  ratioChange: "+/- (%)",
  askPrice1: "Giá bán 1",
  askVol1: "KL bán 1",
  askPrice2: "Giá bán 2",
  askVol2: "KL bán 2",
  askPrice3: "Giá bán 3",
  askVol3: "KL bán 3",
  totalVol: "Tổng KL",
  highest: "Cao nhất",
  lowest: "Thấp nhất",
  avgPrice: "Giá TB",
  totalVal: "Tổng GT",
  side: "Chiều",
  tradingSession: "Phiên",
  tradingStatus: "Trạng thái",
  totalBuyVol: "Tổng KL mua",
  totalSellVol: "Tổng KL bán",
  fBuyVol: "KL mua NN",
  fSellVol: "KL bán NN",
  fBuyVal: "GT mua NN",
  fSellVal: "GT bán NN",
  totalRoom: "Tổng room NN",
  currentRoom: "Room NN còn lại",
};

// ─────────────────────────────────────────────────────────────────────────────
// ColumnSidebar — visual matches FinancialReportColumnSidebar
// ─────────────────────────────────────────────────────────────────────────────

export function ColumnSidebar() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { columns, isSidebarOpen, setSidebarOpen, toggleColumnVisibility, setGroupVisibility, resetColumns } =
    useColumnStore();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "THÔNG TIN GIAO DỊCH": true,
    "ĐẦU TƯ NƯỚC NGOÀI": false,
  });

  const toggleGroup = (title: string) =>
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar panel — same width & style as FinancialReportColumnSidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 z-50 shadow-2xl flex flex-col ${
          isDark
            ? "bg-[#282832] border-l border-gray-800"
            : "bg-white border-l border-gray-200"
        }`}
      >
        {/* Header — X button + title + Mặc định button in same row */}
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
            onClick={resetColumns}
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
          {columnGroups.map((group) => {
            const isExpanded = expandedGroups[group.title];
            const visibleCount = group.fields.filter(
              (field) => columns[field]?.visible,
            ).length;
            const allVisible = visibleCount === group.fields.length;
            const someVisible =
              visibleCount > 0 && visibleCount < group.fields.length;

            return (
              <div
                key={group.title}
                className={`rounded-xl border mb-3 ${
                  isDark
                    ? "border-gray-700 bg-gray-800/30"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* Group header */}
                <div
                  className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none rounded-xl ${
                    isDark ? "hover:bg-gray-700/30" : "hover:bg-gray-50"
                  }`}
                  onClick={() => toggleGroup(group.title)}
                >
                  <input
                    type="checkbox"
                    checked={allVisible}
                    ref={(el) => {
                      if (el) el.indeterminate = someVisible;
                    }}
                    onChange={(e) => {
                      e.stopPropagation();
                      setGroupVisibility(group.fields, !allVisible);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <span
                    className={`flex-1 text-sm font-semibold ${
                      isDark ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {group.title}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full mr-1 ${
                      isDark
                        ? "bg-gray-700 text-gray-400"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {visibleCount}/{group.fields.length}
                  </span>
                  {isExpanded ? (
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

                {/* Column list */}
                {isExpanded && (
                  <div
                    className={`border-t px-2 py-2 ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    {group.fields.map((field) => (
                      <label
                        key={field}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded cursor-pointer transition-colors ${
                          isDark ? "hover:bg-gray-700/40" : "hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={columns[field]?.visible || false}
                          onChange={() => toggleColumnVisibility(field)}
                          className="w-3.5 h-3.5 rounded cursor-pointer"
                        />
                        <span
                          className={`text-xs ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {columnLabels[field] || field}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
