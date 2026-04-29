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
  tickerHasMore?: Record<string, boolean>;
  canShowLoadMore?: boolean;
  onLoadMore?: (ticker: string) => void;
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
  profitability: {
    colId: "profitability_summary",
    controlField: "profitability_roe",
  },
  liquidityAndSolvency: {
    colId: "liquidityAndSolvency_summary",
    controlField: "liquidityAndSolvency_currentRatio",
  },
  efficiency: {
    colId: "efficiency_summary",
    controlField: "efficiency_totalAssetTurnover",
  },
  growth: {
    colId: "growth_summary",
    controlField: "growth_revenueGrowth",
  },
  bankSpecific: {
    colId: "bankSpecific_summary",
    controlField: "bankSpecific_nim",
  },
  cashFlow: {
    colId: "cashFlow_summary",
    controlField: "cashFlow_operatingCashFlowToNetProfit",
  },
};

const SUMMARY_COLID_TO_FIELD: Record<string, string> = {
  grossProfit_summary: "grossProfit",
  profitBeforeTax_summary: "profitBeforeTax",
  profitability_summary: "profitability_roe",
  liquidityAndSolvency_summary: "liquidityAndSolvency_currentRatio",
  efficiency_summary: "efficiency_totalAssetTurnover",
  growth_summary: "growth_revenueGrowth",
  bankSpecific_summary: "bankSpecific_nim",
  cashFlow_summary: "cashFlow_operatingCashFlowToNetProfit",
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
  tickerHasMore = {},
  canShowLoadMore = false,
  onLoadMore,
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
    const tickerSet = [...new Set(sorted.map((row) => row.ticker))];

    tickerSet.forEach((ticker) => {
      result.push({
        isTickerHeader: true,
        ticker,
        id: `header-${ticker}`,
      });

      sorted
        .filter((row) => row.ticker === ticker)
        .forEach((row) => result.push(row));

      if (canShowLoadMore && tickerHasMore[ticker]) {
        result.push({
          isLoadMore: true,
          ticker,
          id: `load-more-${ticker}`,
        });
      }
    });

    return result;
  }, [data, tickerHasMore, canShowLoadMore]);

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
          isFullWidthRow={(params) => Boolean(params.rowNode?.data?.isLoadMore)}
          fullWidthCellRenderer={(params: any) => {
            const ticker = params.data?.ticker as string | undefined;
            return (
              <div className="flex items-center justify-center py-2">
                <button
                  type="button"
                  onClick={() => {
                    if (ticker) {
                      onLoadMore?.(ticker);
                    }
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 border border-blue-400/40 hover:border-blue-300/60 rounded-lg px-4 py-1.5 transition-colors"
                >
                  Xem thêm {ticker}...
                </button>
              </div>
            );
          }}
          getRowStyle={(params) => {
            if (params.data?.isLoadMore) {
              return {
                backgroundColor: 'transparent',
                fontWeight: 400,
              };
            }
            if (params.data?.isTickerHeader) {
              return {
                fontWeight: 700,
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
