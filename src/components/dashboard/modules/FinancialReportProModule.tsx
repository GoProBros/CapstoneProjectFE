"use client";

/**
 * FinancialReportProModule
 * Main component integrating all subcomponents with TanStack Query + Zustand
 */

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFinancialReportQuery } from '@/hooks/useFinancialReportQuery';
import { useModule } from '@/contexts/ModuleContext';
import { useDashboard } from '@/contexts/DashboardContext';
import HeaderSection from './FinancialReportPro/HeaderSection';
import FinancialReportTable from './FinancialReportPro/FinancialReportTable';

// Module type constant for Financial Report Pro
const MODULE_TYPE_FINANCIAL_REPORT_PRO = 2;

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function FinancialReportContent() {
  // Get module context (moduleId and moduleType)
  const moduleContext = useModule();
  const moduleId = moduleContext?.moduleId;
  
  // Get dashboard context to access workspace data
  const { getModuleById, updateModuleLayoutId, currentPageId } = useDashboard();
  
  // Get workspace layoutId if this module has one saved
  const [workspaceLayoutId, setWorkspaceLayoutId] = useState<number | null>(null);
  const [isWorkspaceLayoutIdLoaded, setIsWorkspaceLayoutIdLoaded] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false); // Track if layout is fully loaded
  
  // Load workspace layoutId on mount AND when page changes
  useEffect(() => {
    if (moduleId) {
      const moduleData = getModuleById(moduleId);
      const newLayoutId = moduleData?.layoutId || null;
      
      console.log('[FinancialReportPro] Loading workspace layoutId:', newLayoutId, 'for module:', moduleId);
      
      // CRITICAL: Reset layout ready state when page changes
      setIsLayoutReady(false);
      
      // Always update, even if same value (to ensure flag is set)
      setWorkspaceLayoutId(newLayoutId);
      setIsWorkspaceLayoutIdLoaded(true);
    } else {
      // FIX: If no moduleId yet (newly added module), set ready immediately
      // This prevents infinite loading overlay on new module addition
      console.log('[FinancialReportPro] No moduleId yet, skipping layout load');
      setIsWorkspaceLayoutIdLoaded(true);
      setIsLayoutReady(true);
    }
  }, [moduleId, currentPageId, getModuleById]); // Re-run when page changes
  
  // TODO: Implement full layout system with API fetch and apply
  // For now, mark as ready after workspaceLayoutId is loaded (placeholder)
  useEffect(() => {
    if (!isWorkspaceLayoutIdLoaded) {
      console.log('[FinancialReportPro] Waiting for workspaceLayoutId to load...');
      return;
    }
    
    console.log('[FinancialReportPro] Layout ready (placeholder):', workspaceLayoutId);
    // Simulate small delay for smooth transition
    const timer = setTimeout(() => {
      setIsLayoutReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isWorkspaceLayoutIdLoaded, workspaceLayoutId]);
  
  const { data, isLoading, isError, error } = useFinancialReportQuery();

  if (isError) {
    return (
      <div className="rounded-finsc overflow-hidden h-full w-full text-base bg-base-300 flex flex-col justify-center items-center p-8">
        <div className="text-red-500 text-xl mb-4">Lỗi tải dữ liệu</div>
        <div className="text-gray-400">{error?.message || 'Vui lòng thử lại sau'}</div>
      </div>
    );
  }

  return (
    <div className="rounded-finsc overflow-hidden h-full w-full text-base bg-base-300 flex flex-col justify-between relative">
      {/* Loading Overlay - Hide content until layout is ready */}
      {!isLayoutReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-base-300/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-400 border-t-transparent"></div>
            <span className="text-sm font-medium text-gray-300">
              Đang tải cấu hình workspace...
            </span>
          </div>
        </div>
      )}
      
      <HeaderSection />
      <FinancialReportTable data={data || []} loading={isLoading} />
    </div>
  );
}

export default function FinancialReportProModule() {
  return (
    <QueryClientProvider client={queryClient}>
      <FinancialReportContent />
    </QueryClientProvider>
  );
}
