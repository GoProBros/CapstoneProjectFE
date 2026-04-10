"use client";

/**
 * FinancialReportProModule
 * Optimized non-realtime module with extended caching and memoization
 */

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Toast, { ToastType } from '@/components/ui/Toast';
import { SaveLayoutModal } from '@/components/dashboard/layout';
import { useDashboard } from '@/contexts/DashboardContext';
import { useModule } from '@/contexts/ModuleContext';
import { useFinancialReportQuery } from '@/hooks/useFinancialReportQuery';
import * as layoutService from '@/services/layoutService';
import {
  FINANCIAL_COLUMN_STRUCTURE,
  useFinancialReportColumnStore,
} from '@/stores/financialReportColumnStore';
import { ModuleType } from '@/types/layout';
import type { ColumnConfig, ModuleLayoutDetail, ModuleLayoutSummary } from '@/types/layout';
import HeaderSection from './FinancialReportPro/HeaderSection';
import FinancialReportTable from './FinancialReportPro/FinancialReportTable';
import { FinancialReportColumnSidebar } from './FinancialReportPro/FinancialReportColumnSidebar';

const MODULE_TYPE_FINANCIAL_REPORT_PRO = ModuleType.FinancialReportPro;
const GROUP_PREFIX = 'group:';
const FIELD_PREFIX = 'field:';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
}

interface ToastState {
  isOpen: boolean;
  message: string;
  type: ToastType;
}

function buildDefaultGroups(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {};
  for (const topGroup of FINANCIAL_COLUMN_STRUCTURE) {
    defaults[topGroup.groupId] = true;
    for (const subGroup of topGroup.subGroups ?? []) {
      defaults[subGroup.groupId] = true;
    }
  }
  return defaults;
}

function buildDefaultFields(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {};
  for (const topGroup of FINANCIAL_COLUMN_STRUCTURE) {
    const allFields = [
      ...(topGroup.fields ?? []),
      ...(topGroup.subGroups?.flatMap((sub) => sub.fields) ?? []),
    ];

    for (const field of allFields) {
      defaults[field.field] = true;
    }
  }
  return defaults;
}

function mapStoreStateToColumns(
  groups: Record<string, boolean>,
  fields: Record<string, boolean>
): Record<string, ColumnConfig> {
  const columns: Record<string, ColumnConfig> = {};
  let order = 0;

  for (const [groupId, visible] of Object.entries(groups)) {
    const key = `${GROUP_PREFIX}${groupId}`;
    columns[key] = {
      field: key,
      visible,
      order,
    };
    order += 1;
  }

  for (const [fieldName, visible] of Object.entries(fields)) {
    const key = `${FIELD_PREFIX}${fieldName}`;
    columns[key] = {
      field: key,
      visible,
      order,
    };
    order += 1;
  }

  return columns;
}

function serializeColumns(columns: Record<string, ColumnConfig>): string {
  const normalized: Record<string, ColumnConfig> = {};
  for (const key of Object.keys(columns).sort()) {
    normalized[key] = columns[key];
  }
  return JSON.stringify(normalized);
}

function applyColumnsToStore(columns: Record<string, ColumnConfig>): {
  groups: Record<string, boolean>;
  fields: Record<string, boolean>;
} {
  const nextGroups = buildDefaultGroups();
  const nextFields = buildDefaultFields();

  for (const [key, config] of Object.entries(columns)) {
    if (key.startsWith(GROUP_PREFIX)) {
      const groupId = key.slice(GROUP_PREFIX.length);
      if (groupId in nextGroups) {
        nextGroups[groupId] = config.visible !== false;
      }
      continue;
    }

    if (key.startsWith(FIELD_PREFIX)) {
      const fieldName = key.slice(FIELD_PREFIX.length);
      if (fieldName in nextFields) {
        nextFields[fieldName] = config.visible !== false;
      }
      continue;
    }

    // Backward compatibility for layouts that only stored field names.
    if (key in nextFields) {
      nextFields[key] = config.visible !== false;
    }
  }

  useFinancialReportColumnStore.setState({
    groups: nextGroups,
    fields: nextFields,
  });

  return {
    groups: nextGroups,
    fields: nextFields,
  };
}

// Optimized QueryClient for non-realtime data with extended caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
      gcTime: 30 * 60 * 1000, // 30 minutes - garbage collection time (keep in cache longer)
    },
  },
});

// Memoized content component to prevent unnecessary re-renders
const FinancialReportContent = memo(function FinancialReportContent() {
  const moduleContext = useModule();
  const moduleId = moduleContext?.moduleId;
  const { getModuleById, updateModuleLayoutId, currentPageId } = useDashboard();

  const groups = useFinancialReportColumnStore((state) => state.groups);
  const fields = useFinancialReportColumnStore((state) => state.fields);

  const [layouts, setLayouts] = useState<ModuleLayoutSummary[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<number | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<string>('Layout mặc định');
  const [currentLayoutIsSystemDefault, setCurrentLayoutIsSystemDefault] =
    useState<boolean>(false);
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [workspaceLayoutId, setWorkspaceLayoutId] = useState<number | null>(null);
  const [isWorkspaceLayoutIdLoaded, setIsWorkspaceLayoutIdLoaded] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const lastSyncedLayoutSnapshotRef = useRef<string | null>(null);

  const { data, isLoading, isError, error } = useFinancialReportQuery();

  useEffect(() => {
    if (moduleId) {
      const moduleData = getModuleById(moduleId);
      setIsLayoutReady(false);
      setWorkspaceLayoutId(moduleData?.layoutId ?? null);
      setIsWorkspaceLayoutIdLoaded(true);
      return;
    }

    setIsWorkspaceLayoutIdLoaded(true);
    setIsLayoutReady(true);
  }, [moduleId, currentPageId, getModuleById]);

  const fetchLayouts = useCallback(async (): Promise<ModuleLayoutSummary[]> => {
    setIsLoadingLayouts(true);
    try {
      const fetchedLayouts = await layoutService.getLayouts(MODULE_TYPE_FINANCIAL_REPORT_PRO);
      setLayouts(fetchedLayouts);
      return fetchedLayouts;
    } catch (fetchError) {
      console.error('[FinancialReportPro] Error fetching layouts:', fetchError);
      return [];
    } finally {
      setIsLoadingLayouts(false);
    }
  }, []);

  const loadLayoutById = useCallback(async (layoutId: number) => {
    try {
      const layoutDetail: ModuleLayoutDetail = await layoutService.getLayoutById(layoutId);
      const layoutColumns = layoutDetail.configJson?.state?.columns ?? {};
      const appliedState = applyColumnsToStore(layoutColumns);
      lastSyncedLayoutSnapshotRef.current = serializeColumns(
        mapStoreStateToColumns(appliedState.groups, appliedState.fields)
      );

      setCurrentLayoutId(layoutDetail.id);
      setCurrentLayoutName(layoutDetail.layoutName);
      setCurrentLayoutIsSystemDefault(layoutDetail.isSystemDefault);
    } catch (loadError) {
      console.error('[FinancialReportPro] Error loading layout:', loadError);
      throw loadError;
    }
  }, []);

  useEffect(() => {
    if (!isWorkspaceLayoutIdLoaded || isLayoutReady) {
      return;
    }

    let isMounted = true;

    const initializeLayout = async () => {
      try {
        const fetchedLayouts = await fetchLayouts();
        if (!isMounted) return;

        let layoutToLoad: ModuleLayoutSummary | undefined;

        if (workspaceLayoutId) {
          layoutToLoad = fetchedLayouts.find((layout) => layout.id === workspaceLayoutId);
        }

        if (!layoutToLoad) {
          layoutToLoad = fetchedLayouts.find((layout) => layout.isSystemDefault) ?? fetchedLayouts[0];
        }

        if (layoutToLoad) {
          await loadLayoutById(layoutToLoad.id);
        } else {
          const appliedState = applyColumnsToStore({});
          lastSyncedLayoutSnapshotRef.current = serializeColumns(
            mapStoreStateToColumns(appliedState.groups, appliedState.fields)
          );
          setCurrentLayoutId(null);
          setCurrentLayoutName('Layout mặc định');
          setCurrentLayoutIsSystemDefault(false);
        }
      } catch (initializeError) {
        console.error('[FinancialReportPro] Error initializing layout:', initializeError);
      } finally {
        if (isMounted) {
          setIsLayoutReady(true);
        }
      }
    };

    void initializeLayout();

    return () => {
      isMounted = false;
    };
  }, [fetchLayouts, isLayoutReady, isWorkspaceLayoutIdLoaded, loadLayoutById, workspaceLayoutId]);

  const handleCreateNewLayout = useCallback(() => {
    setIsSaveModalOpen(true);
  }, []);

  const handleSaveLayoutSubmit = useCallback(async (layoutName: string) => {
    setIsSaving(true);

    try {
      const currentColumns = mapStoreStateToColumns(groups, fields);
      const newLayout = await layoutService.saveUserLayout(
        MODULE_TYPE_FINANCIAL_REPORT_PRO,
        layoutName,
        currentColumns
      );

      lastSyncedLayoutSnapshotRef.current = serializeColumns(currentColumns);

      await fetchLayouts();

      setCurrentLayoutId(newLayout.id);
      setCurrentLayoutName(newLayout.layoutName);
      setCurrentLayoutIsSystemDefault(false);

      if (moduleId) {
        await updateModuleLayoutId(moduleId, newLayout.id);
        setWorkspaceLayoutId(newLayout.id);
      }

      setIsSaveModalOpen(false);
    } catch (saveError) {
      console.error('[FinancialReportPro] Error creating layout:', saveError);

      throw saveError instanceof Error
        ? saveError
        : new Error('Lỗi khi tạo layout. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  }, [fields, fetchLayouts, groups, moduleId, updateModuleLayoutId]);

  const handleSelectLayout = useCallback(async (layout: ModuleLayoutSummary) => {
    try {
      await loadLayoutById(layout.id);

      if (moduleId) {
        await updateModuleLayoutId(moduleId, layout.id);
        setWorkspaceLayoutId(layout.id);
      }
    } catch (selectError) {
      console.error('[FinancialReportPro] Error selecting layout:', selectError);
    }
  }, [loadLayoutById, moduleId, updateModuleLayoutId]);

  const handleDeleteLayout = useCallback((layout: ModuleLayoutSummary) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xóa layout',
      message: `Bạn có chắc muốn xóa layout "${layout.layoutName}"?\n\nHành động này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          await layoutService.deleteLayout(layout.id);

          const refreshedLayouts = await fetchLayouts();

          if (currentLayoutId === layout.id) {
            const fallbackLayout =
              refreshedLayouts.find((item) => item.isSystemDefault) ?? refreshedLayouts[0];

            if (fallbackLayout) {
              await loadLayoutById(fallbackLayout.id);
              if (moduleId) {
                await updateModuleLayoutId(moduleId, fallbackLayout.id);
                setWorkspaceLayoutId(fallbackLayout.id);
              }
            } else {
              const appliedState = applyColumnsToStore({});
              lastSyncedLayoutSnapshotRef.current = serializeColumns(
                mapStoreStateToColumns(appliedState.groups, appliedState.fields)
              );
              setCurrentLayoutId(null);
              setCurrentLayoutName('Layout mặc định');
              setCurrentLayoutIsSystemDefault(false);
              if (moduleId) {
                await updateModuleLayoutId(moduleId, null);
                setWorkspaceLayoutId(null);
              }
            }
          }

          setToast({
            isOpen: true,
            message: `Đã xóa layout "${layout.layoutName}"`,
            type: 'success',
          });
        } catch (deleteError) {
          console.error('[FinancialReportPro] Error deleting layout:', deleteError);
          setToast({
            isOpen: true,
            message: 'Lỗi khi xóa layout. Vui lòng thử lại.',
            type: 'error',
          });
        }
      },
    });
  }, [currentLayoutId, fetchLayouts, loadLayoutById, moduleId, updateModuleLayoutId]);

  useEffect(() => {
    if (!isLayoutReady || !currentLayoutId || currentLayoutIsSystemDefault) {
      return;
    }

    const currentColumns = mapStoreStateToColumns(groups, fields);
    const currentSnapshot = serializeColumns(currentColumns);

    if (lastSyncedLayoutSnapshotRef.current === currentSnapshot) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        await layoutService.updateUserLayout(
          currentLayoutId,
          currentLayoutName,
          currentColumns
        );
        lastSyncedLayoutSnapshotRef.current = currentSnapshot;
      } catch (updateError) {
        console.error('[FinancialReportPro] Error auto-saving layout:', updateError);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [
    currentLayoutId,
    currentLayoutIsSystemDefault,
    currentLayoutName,
    fields,
    groups,
    isLayoutReady,
  ]);

  // Error state
  if (isError) {
    return (
      <div className="rounded-finsc overflow-hidden h-full w-full text-base bg-base-300 flex flex-col justify-center items-center p-8">
        <div className="text-red-500 text-xl mb-4">Lỗi tải dữ liệu</div>
        <div className="text-gray-400">{error?.message || 'Vui lòng thử lại sau'}</div>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Xác nhận"
        cancelText="Hủy"
        variant="danger"
        onConfirm={() => {
          void Promise.resolve(confirmDialog.onConfirm()).finally(() => {
            setConfirmDialog((previous) => ({ ...previous, isOpen: false }));
          });
        }}
        onCancel={() =>
          setConfirmDialog((previous) => ({
            ...previous,
            isOpen: false,
          }))
        }
      />

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        duration={3000}
        onClose={() => setToast((previous) => ({ ...previous, isOpen: false }))}
      />

      <div className="relative rounded-finsc overflow-hidden h-full w-full text-base bg-base-300 flex flex-col justify-between">
        <SaveLayoutModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveLayoutSubmit}
          isLoading={isSaving}
        />

        <FinancialReportColumnSidebar />

        <HeaderSection
          layouts={layouts}
          currentLayoutId={currentLayoutId}
          currentLayoutName={currentLayoutName}
          isLoadingLayouts={isLoadingLayouts}
          isWorkspaceLayoutIdLoaded={isWorkspaceLayoutIdLoaded}
          onSelectLayout={handleSelectLayout}
          onDeleteLayout={handleDeleteLayout}
          onRefreshLayouts={() => {
            void fetchLayouts();
          }}
          onCreateLayout={handleCreateNewLayout}
        />

        {!isLayoutReady && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-[#282832]/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-buttonGreen border-t-transparent" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Đang tải cấu hình giao diện...
              </span>
            </div>
          </div>
        )}

        <FinancialReportTable
          data={data?.items || []}
          loading={isLoading}
          totalCount={data?.totalCount || 0}
        />
      </div>
    </>
  );
});

export default function FinancialReportProModule() {
  return (
    <QueryClientProvider client={queryClient}>
      <FinancialReportContent />
    </QueryClientProvider>
  );
}
