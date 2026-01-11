"use client";

/**
 * FinancialReportTable Component
 * Optimized AG Grid table with memoization for non-realtime data
 */

import React, { useMemo, memo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import './ag-grid-custom.css';

import { useTheme } from '@/contexts/ThemeContext';
import type { FinancialData } from '@/types/financialReport';
import { getColumnDefs, defaultColDef } from './columnDefs';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface FinancialReportTableProps {
  data: FinancialData[];
  loading?: boolean;
}

// Memoize loading and empty overlays
const LoadingOverlay = memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="text-lg">Đang tải dữ liệu...</div>
  </div>
));
LoadingOverlay.displayName = 'LoadingOverlay';

const NoRowsOverlay = memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="text-lg">Không có dữ liệu</div>
  </div>
));
NoRowsOverlay.displayName = 'NoRowsOverlay';

const FinancialReportTable = memo(function FinancialReportTable({ data, loading }: FinancialReportTableProps) {
  const { theme } = useTheme();

  const columnDefs = useMemo(() => getColumnDefs(), []);

  // Sort data by ticker (Community version - no grouping)
  const sortedData = useMemo(() => {
    if (!data.length) return [];
    return [...data].sort((a, b) => {
      if (a.ticker !== b.ticker) {
        return a.ticker.localeCompare(b.ticker);
      }
      return b.year - a.year; // Descending by year
    });
  }, [data]);

  return (
    <div
      id="bctcTable"
      className={`flex-1 w-full ${
        theme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'
      }`}
      style={{ 
        height: 'calc(100vh - 240px)',
        minHeight: '400px'
      }}
    >
      <AgGridReact
        theme="legacy"
        rowData={sortedData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={false} // Disable animation for better performance
        suppressRowTransform={true} // Improve performance
        suppressColumnVirtualisation={false}
        rowBuffer={20} // Render 20 extra rows for smooth scrolling
        loading={loading}
        loadingOverlayComponent={LoadingOverlay}
        noRowsOverlayComponent={NoRowsOverlay}
      />
    </div>
  );
});

export default FinancialReportTable;
