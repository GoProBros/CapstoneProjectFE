"use client";

/**
 * FinancialReportTable Component
 * Visibility is controlled imperatively via gridApi.setColumnsVisible()
 * rather than rebuilding columnDefs — avoids AG Grid reconciliation bugs.
 */

import React, { useCallback, useEffect, useMemo, memo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  GridApi,
  type ColumnVisibleEvent,
} from "ag-grid-community";
import "./ag-grid-custom.css";

import { useTheme } from "@/contexts/ThemeContext";
import type { FinancialReportTableRow } from "@/types/financialReport";
import { getColumnDefs, defaultColDef } from "./columnDefs";
import {
  useFinancialReportColumnStore,
  FINANCIAL_COLUMN_STRUCTURE,
} from "@/stores/financialReportColumnStore";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface FinancialReportTableProps {
  data: FinancialReportTableRow[];
  loading?: boolean;
  totalCount?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: compute expected visibility for every named field
// Takes into account top-group → sub-group → field cascade
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Some sub-groups have a dedicated "summary" field that shows when the group is
 * collapsed (columnGroupShow: 'closed'). That field shares the same name as
 * the sub-group's groupId. We need to hide/show it together with the sub-group.
 */
const SUB_GROUP_SUMMARY_FIELDS: Record<
  string,
  { colId: string; controlField?: string }
> = {
  shortTermAssets: { colId: "shortTermAssets" },
  longTermAssets: { colId: "longTermAssets" },
  grossProfit: { colId: "grossProfit_summary", controlField: "grossProfit" },
  profitBeforeTax: {
    colId: "profitBeforeTax_summary",
    controlField: "profitBeforeTax",
  },
};

const SUMMARY_COLID_TO_FIELD: Record<string, string> = {
  grossProfit_summary: "grossProfit",
  profitBeforeTax_summary: "profitBeforeTax",
};

function buildGroupVisibilityFromFields(
  currentGroups: Record<string, boolean>,
  nextFields: Record<string, boolean>
): Record<string, boolean> {
  const nextGroups = { ...currentGroups };

  for (const topGroup of FINANCIAL_COLUMN_STRUCTURE) {
    if (topGroup.locked) {
      nextGroups[topGroup.groupId] = true;
      continue;
    }

    let topGroupHasVisibleField = false;

    const topFields = topGroup.fields ?? [];
    if (topFields.length > 0) {
      const hasVisibleTopField = topFields.some(
        (field) => nextFields[field.field] !== false
      );
      topGroupHasVisibleField ||= hasVisibleTopField;
    }

    for (const subGroup of topGroup.subGroups ?? []) {
      const subGroupVisible = subGroup.fields.some(
        (field) => nextFields[field.field] !== false
      );
      nextGroups[subGroup.groupId] = subGroupVisible;
      topGroupHasVisibleField ||= subGroupVisible;
    }

    nextGroups[topGroup.groupId] = topGroupHasVisibleField;
  }

  return nextGroups;
}

function buildExpectedVisibility(
  groups: Record<string, boolean>,
  fields: Record<string, boolean>
): Map<string, boolean> {
  const expected = new Map<string, boolean>();

  for (const topGroup of FINANCIAL_COLUMN_STRUCTURE) {
    // Locked groups (Kỳ báo cáo) are always visible — never touch them
    if (topGroup.locked) continue;

    const topVisible = groups[topGroup.groupId] !== false;

    // Direct fields (Cash Flow, Documents, etc.)
    for (const f of topGroup.fields ?? []) {
      expected.set(f.field, topVisible && fields[f.field] !== false);
    }

    // Sub-groups and their fields
    for (const sub of topGroup.subGroups ?? []) {
      const subVisible = topVisible && groups[sub.groupId] !== false;

      // Hide / show sub-group summary field if it exists
      const summaryConfig = SUB_GROUP_SUMMARY_FIELDS[sub.groupId];
      if (summaryConfig) {
        const summaryFieldVisible = summaryConfig.controlField
          ? fields[summaryConfig.controlField] !== false
          : true;
        expected.set(summaryConfig.colId, subVisible && summaryFieldVisible);
      }

      for (const f of sub.fields) {
        expected.set(f.field, subVisible && fields[f.field] !== false);
      }
    }
  }

  return expected;
}

// ─────────────────────────────────────────────────────────────────────────────
// Overlays
// ─────────────────────────────────────────────────────────────────────────────

const LoadingOverlay = memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="text-lg">Đang tải dữ liệu...</div>
  </div>
));
LoadingOverlay.displayName = "LoadingOverlay";

const NoRowsOverlay = memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="text-lg">Không có dữ liệu</div>
  </div>
));
NoRowsOverlay.displayName = "NoRowsOverlay";

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const FinancialReportTable = memo(function FinancialReportTable({
  data,
  loading,
  totalCount = 0,
}: FinancialReportTableProps) {
  const { theme } = useTheme();
  const { groups, fields } = useFinancialReportColumnStore();
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const isApplyingStoreVisibilityRef = useRef(false);

  // columnDefs rebuilds when `groups` changes so that hidden column groups
  // (including their headers) are removed from the AG Grid defs entirely.
  // Field-level visibility is handled separately via gridApi in the effect below.
  const columnDefs = useMemo(() => getColumnDefs(groups), [groups]);

  // ── Imperatively sync visibility to AG Grid ──────────────────────────────
  useEffect(() => {
    if (!gridApi) return;

    const expected = buildExpectedVisibility(groups, fields);
    const availableColIds = new Set(
      gridApi.getColumns()?.map((c) => c.getColId()) ?? []
    );

    isApplyingStoreVisibilityRef.current = true;
    try {
      for (const [field, visible] of expected.entries()) {
        if (availableColIds.has(field)) {
          gridApi.setColumnsVisible([field], visible);
        }
      }
    } finally {
      isApplyingStoreVisibilityRef.current = false;
    }
  }, [gridApi, groups, fields]);

  const handleColumnVisible = useCallback((event: ColumnVisibleEvent) => {
    if (isApplyingStoreVisibilityRef.current) {
      return;
    }

    const changedColumns = event.columns ?? (event.column ? [event.column] : []);
    if (changedColumns.length === 0) {
      return;
    }

    useFinancialReportColumnStore.setState((state) => {
      const nextFields = { ...state.fields };
      let hasFieldChange = false;

      for (const column of changedColumns) {
        const colId = column.getColId();
        const fieldKey = SUMMARY_COLID_TO_FIELD[colId] ?? colId;

        if (!(fieldKey in nextFields)) {
          continue;
        }

        const isVisible = column.isVisible();
        if (nextFields[fieldKey] !== isVisible) {
          nextFields[fieldKey] = isVisible;
          hasFieldChange = true;
        }
      }

      if (!hasFieldChange) {
        return state;
      }

      return {
        ...state,
        fields: nextFields,
        groups: buildGroupVisibilityFromFields(state.groups, nextFields),
      };
    });
  }, []);

  // ── Group data by ticker ──────────────────────────────────────────────────
  const groupedData = useMemo(() => {
    if (!data.length) return [];

    const sorted = [...data].sort((a, b) => {
      if (a.ticker !== b.ticker) return a.ticker.localeCompare(b.ticker);
      return b.year - a.year;
    });

    const result: any[] = [];
    let currentTicker = "";

    sorted.forEach((row) => {
      if (row.ticker !== currentTicker) {
        result.push({
          isTickerHeader: true,
          ticker: row.ticker,
          id: `header-${row.ticker}`,
        });
        currentTicker = row.ticker;
      }
      result.push(row);
    });

    return result;
  }, [data]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 text-md text-gray-400">Đơn vị: tỷ đồng</div>

      <div
        id="bctcTable"
        className={`flex-1 w-full ${
          theme === "dark" ? "ag-theme-alpine-dark" : "ag-theme-alpine"
        }`}
        style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}
      >
        <AgGridReact
          theme="legacy"
          rowData={groupedData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={false}
          suppressRowTransform={true}
          suppressColumnVirtualisation={false}
          rowBuffer={20}
          loading={loading}
          loadingOverlayComponent={LoadingOverlay}
          noRowsOverlayComponent={NoRowsOverlay}
          onGridReady={(params) => setGridApi(params.api)}
          onColumnVisible={handleColumnVisible}
          getRowStyle={(params) => {
            if (params.data?.isTickerHeader) {
              return {
                fontWeight: "bold",
                backgroundColor:
                  theme === "dark" ? "#1f2937" : "#f3f4f6",
              };
            }
            return undefined;
          }}
        />
      </div>
    </div>
  );
});

export default FinancialReportTable;
