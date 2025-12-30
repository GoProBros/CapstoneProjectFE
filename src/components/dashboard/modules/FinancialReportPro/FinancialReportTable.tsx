"use client";

/**
 * FinancialReportTable Component
 * AG Grid Community table với grouping, sticky columns, virtual scroll
 */

import React, { useMemo } from 'react';
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

export default function FinancialReportTable({ data, loading }: FinancialReportTableProps) {
  const { theme } = useTheme();

  const columnDefs = useMemo(() => getColumnDefs(), []);

  // Sort data by ticker (Community version - no grouping)
  const sortedData = useMemo(() => {
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
      <AgGridReact<FinancialData>
        rowData={sortedData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={false}
        suppressRowTransform={true}
        suppressColumnVirtualisation={false}
        loading={loading}
        loadingOverlayComponent={() => (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">Đang tải dữ liệu...</div>
          </div>
        )}
        noRowsOverlayComponent={() => (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">Không có dữ liệu</div>
          </div>
        )}
      />
    </div>
  );
}
