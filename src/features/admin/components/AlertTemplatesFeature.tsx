'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import alertTemplateService, { type AlertTemplateFilters } from '@/services/admin/alertTemplateService';
import type { AlertTemplateDto, AlertTemplatePlaceholderDto } from '@/types/alertTemplate';
import AlertTemplatesTable from '@/features/admin/components/alerts/AlertTemplatesTable';
import AlertTemplateEditorModal from '@/features/admin/components/alerts/AlertTemplateEditorModal';
import SystemNotificationModal from '@/features/admin/components/alerts/SystemNotificationModal';
import { EMPTY_TEMPLATE_FORM, type TemplateFormState, type TemplateMode } from '@/features/admin/components/alerts/types';
import { mapTemplateToForm, sortTemplates } from '@/features/admin/components/alerts/alertTemplateUtils';

export function AlertTemplatesFeature() {
  const PAGE_SIZE = 10;
  const [templates, setTemplates] = useState<AlertTemplateDto[]>([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [placeholders, setPlaceholders] = useState<AlertTemplatePlaceholderDto[]>([]);
  const [form, setForm] = useState<TemplateFormState>(EMPTY_TEMPLATE_FORM);
  const [mode, setMode] = useState<TemplateMode>('create');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [placeholdersLoading, setPlaceholdersLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);
  const [statusLoadingMap, setStatusLoadingMap] = useState<Record<number, boolean>>({});
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [placeholdersError, setPlaceholdersError] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorMessage, setEditorMessage] = useState<string | null>(null);
  const [isSystemNotificationModalOpen, setIsSystemNotificationModalOpen] = useState(false);
  // Filter states
  const [filterType, setFilterType] = useState<string>('');
  const [filterCondition, setFilterCondition] = useState<string>('');
  const [filterIsActive, setFilterIsActive] = useState<string>('');
  const [filterIsDefault, setFilterIsDefault] = useState<string>('');

  const loadTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError(null);

      const filters: AlertTemplateFilters = {
        pageIndex,
        pageSize: PAGE_SIZE,
        type: filterType || null,
        condition: filterCondition || null,
        isActive: filterIsActive ? (filterIsActive === 'true' ? true : false) : null,
        isDefault: filterIsDefault ? (filterIsDefault === 'true' ? true : false) : null,
      };

      const data = await alertTemplateService.getAlertTemplates(filters);
      setTemplates(sortTemplates(data.items ?? []));
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
      setHasPreviousPage(Boolean(data.hasPreviousPage));
      setHasNextPage(Boolean(data.hasNextPage));
    } catch (error) {
      setTemplates([]);
      setTotalPages(1);
      setTotalCount(0);
      setHasPreviousPage(false);
      setHasNextPage(false);
      setTemplatesError(error instanceof Error ? error.message : 'Không thể tải danh sách alert template');
    } finally {
      setTemplatesLoading(false);
    }
  }, [filterType, filterCondition, filterIsActive, filterIsDefault, pageIndex]);

  const loadPlaceholders = useCallback(async () => {
    try {
      setPlaceholdersLoading(true);
      setPlaceholdersError(null);

      const data = await alertTemplateService.getAlertTemplatePlaceholders();
      setPlaceholders(data.placeholders ?? []);
    } catch (error) {
      setPlaceholders([]);
      setPlaceholdersError(error instanceof Error ? error.message : 'Không thể tải danh sách placeholder');
    } finally {
      setPlaceholdersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
    void loadPlaceholders();
  }, [loadPlaceholders, loadTemplates]);

  const openCreateModal = () => {
    setMode('create');
    setSelectedTemplateId(null);
    setForm(EMPTY_TEMPLATE_FORM);
    setEditorError(null);
    setEditorMessage(null);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditorError(null);
    setEditorMessage(null);
  };

  const openTemplateForEdit = useCallback(async (templateId: number) => {
    try {
      setDetailLoading(true);
      setEditorError(null);
      setEditorMessage(null);

      const detail = await alertTemplateService.getAlertTemplateById(templateId);
      setSelectedTemplateId(detail.id);
      setMode('update');
      setForm(mapTemplateToForm(detail));
      setIsEditorOpen(true);
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Không thể tải chi tiết alert template');
      setIsEditorOpen(true);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleTemplateChange = <K extends keyof TemplateFormState>(field: K, value: TemplateFormState[K]) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleToggleStatus = async (templateId: number) => {
    try {
      setStatusLoadingMap((previous) => ({ ...previous, [templateId]: true }));
      const updated = await alertTemplateService.toggleAlertTemplateStatus(templateId);

      setTemplates((previous) => sortTemplates(previous.map((item) => (item.id === updated.id ? updated : item))));

      if (selectedTemplateId === updated.id) {
        setForm(mapTemplateToForm(updated));
      }
    } catch (error) {
      setTemplatesError(error instanceof Error ? error.message : 'Không thể đổi trạng thái alert template');
    } finally {
      setStatusLoadingMap((previous) => ({ ...previous, [templateId]: false }));
    }
  };

  const handleSaveTemplate = async () => {
    setEditorError(null);
    setEditorMessage(null);

    if (!form.type || !form.condition || !form.titleTemplate.trim() || !form.bodyTemplate.trim()) {
      setEditorError('Vui lòng chọn type, condition và nhập đầy đủ nội dung template');
      return;
    }

    try {
      setSavingLoading(true);

      const request = {
        type: Number(form.type),
        condition: Number(form.condition),
        titleTemplate: form.titleTemplate.trim(),
        bodyTemplate: form.bodyTemplate.trim(),
        isActive: form.isActive,
        isDefault: form.isDefault,
      };

      const response = mode === 'update' && selectedTemplateId !== null
        ? await alertTemplateService.updateAlertTemplate(selectedTemplateId, request)
        : await alertTemplateService.createAlertTemplate(request);

      setTemplates((previous) => {
        const next = previous.some((item) => item.id === response.id)
          ? previous.map((item) => (item.id === response.id ? response : item))
          : [...previous, response];

        return sortTemplates(next);
      });

      setForm(mapTemplateToForm(response));
      setSelectedTemplateId(response.id);
      setMode('update');
      setEditorMessage(mode === 'update' ? 'Cập nhật alert template thành công' : 'Tạo alert template thành công');
      setIsEditorOpen(false);
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Không thể lưu alert template');
    } finally {
      setSavingLoading(false);
    }
  };

  const handleFilterChange = (filterName: string, value: string) => {
    switch (filterName) {
      case 'type':
        setFilterType(value);
        setPageIndex(1);
        break;
      case 'condition':
        setFilterCondition(value);
        setPageIndex(1);
        break;
      case 'isActive':
        setFilterIsActive(value);
        setPageIndex(1);
        break;
      case 'isDefault':
        setFilterIsDefault(value);
        setPageIndex(1);
        break;
      default:
        break;
    }
  };

  const handleClearFilters = () => {
    setFilterType('');
    setFilterCondition('');
    setFilterIsActive('');
    setFilterIsDefault('');
    setPageIndex(1);
  };

  const handleCreateAgain = () => {
    setMode('create');
    setSelectedTemplateId(null);
    setForm(EMPTY_TEMPLATE_FORM);
    setEditorError(null);
    setEditorMessage(null);
    setIsEditorOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-headline mb-2">
            Quản lý thông báo
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Quản lý thông báo và danh sách alert template của hệ thống.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadTemplates()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 dark:bg-slate-700 text-slate-100 dark:text-slate-100 rounded-md font-medium text-sm hover:bg-gray-800 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới danh sách
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tạo mẫu mới
          </button>
          <button
            type="button"
            onClick={() => setIsSystemNotificationModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tạo thông báo
          </button>
        </div>
      </div>

      <AlertTemplatesTable
        templates={templates}
        loading={templatesLoading}
        error={templatesError}
        statusLoadingMap={statusLoadingMap}
        pageIndex={pageIndex}
        totalPages={totalPages}
        totalCount={totalCount}
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        filterType={filterType}
        filterCondition={filterCondition}
        filterIsActive={filterIsActive}
        filterIsDefault={filterIsDefault}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onEdit={openTemplateForEdit}
        onToggleStatus={handleToggleStatus}
        onPrevPage={() => setPageIndex((prev) => Math.max(1, prev - 1))}
        onNextPage={() => setPageIndex((prev) => Math.min(totalPages, prev + 1))}
      />

      <AlertTemplateEditorModal
        isOpen={isEditorOpen}
        mode={mode}
        selectedTemplateId={selectedTemplateId}
        isSaving={savingLoading}
        isLoadingDetail={detailLoading}
        error={editorError}
        message={editorMessage}
        form={form}
        placeholders={placeholders}
        placeholdersLoading={placeholdersLoading}
        placeholdersError={placeholdersError}
        onClose={closeEditor}
        onCreateAgain={handleCreateAgain}
        onSave={handleSaveTemplate}
        onFieldChange={handleTemplateChange}
      />

      <SystemNotificationModal isOpen={isSystemNotificationModalOpen} onOpenChange={setIsSystemNotificationModalOpen} />
    </div>
  );
}