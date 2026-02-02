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
import type { FinancialReportTableRow } from '@/types/financialReport';
import { getColumnDefs, defaultColDef } from './columnDefs';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface FinancialReportTableProps {
  data: FinancialReportTableRow[];
  loading?: boolean;
  totalCount?: number;
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

const FinancialReportTable = memo(function FinancialReportTable({ 
  data, 
  loading, 
  totalCount = 0 
}: FinancialReportTableProps) {
  const { theme } = useTheme();

  const columnDefs = useMemo(() => getColumnDefs(), []);

  // Group data by ticker and add header rows
  const groupedData = useMemo(() => {
    if (!data.length) return [];
    
    // Sort by ticker (A-Z) then by year (descending)
    const sorted = [...data].sort((a, b) => {
      if (a.ticker !== b.ticker) {
        return a.ticker.localeCompare(b.ticker);
      }
      return b.year - a.year;
    });

    // Group by ticker and insert header rows
    const result: any[] = [];
    let currentTicker = '';

    sorted.forEach((row) => {
      if (row.ticker !== currentTicker) {
        // Add ticker header row
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
      {/* Status bar */}
      {totalCount > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500">
          Hiển thị {data.length} / {totalCount} báo cáo
        </div>
      )}
      
      {/* AG Grid table */}
      <div
        id="bctcTable"
        className={`flex-1 w-full ${
          theme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'
        }`}
        style={{ 
          height: 'calc(100vh - 280px)',
          minHeight: '400px'
        }}
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
          getRowStyle={(params) => {
            if (params.data?.isTickerHeader) {
              return {
                fontWeight: 'bold',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
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
