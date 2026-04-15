"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSymbolsPaginated, searchSymbols } from '@/services/symbolService';
import {
  createAlert,
  getAlertById,
  getMyAlerts,
  toggleAlertStatus,
} from '@/services/alertService';
import type { AlertDto, AlertQueryParams, AlertTypeValue, AlertConditionValue } from '@/types/alert';
import type { SymbolData } from '@/types/symbol';
import { canViewProfileTransactions } from './helpers';
import { useProfileTheme } from './useProfileTheme';
import { AlertFilters, AlertTable, AlertDetailModal, AlertCreateModal } from './alert';

type AlertSortKey = 'id' | 'ticker' | 'type' | 'condition' | 'isTriggered' | 'isActive' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

interface AlertFormState {
  ticker: string;
  type: string;
  condition: string;
  changePercentage: string;
  thresholdValue: string;
  name: string;
}

interface TickerOption extends Pick<SymbolData, 'ticker' | 'viCompanyName' | 'enCompanyName'> {}

const PAGE_SIZE = 10;
const SYMBOL_PAGE_SIZE = 50;

const initialAlertFormState: AlertFormState = {
  ticker: '',
  type: '1',
  condition: '1',
  changePercentage: '',
  thresholdValue: '',
  name: '',
};

function isNumericInput(value: string): boolean {
  if (value.trim() === '') return false;
  return Number.isFinite(Number(value));
}

function isPercentCondition(condition: string): boolean {
  return condition === '3' || condition === '4';
}

function isThresholdCondition(condition: string): boolean {
  return condition === '1' || condition === '2';
}

function compareValues(left: AlertDto, right: AlertDto, key: AlertSortKey): number {
  switch (key) {
    case 'id':
      return left.id - right.id;
    case 'ticker':
      return left.ticker.localeCompare(right.ticker, 'vi');
    case 'type':
      return left.type - right.type;
    case 'condition':
      return left.condition - right.condition;
    case 'isTriggered':
      return Number(left.isTriggered) - Number(right.isTriggered);
    case 'isActive':
      return Number(left.isActive) - Number(right.isActive);
    case 'updatedAt':
      return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
    default:
      return 0;
  }
}

export function ProfileAlertTab() {
  const { user } = useAuth();
  const { borderCls, bgCard, bgSub, fieldBg, textPrimary, textSecondary, textMuted, hoverBg } = useProfileTheme();

  const canViewAlerts = canViewProfileTransactions(user?.role);

  // Alert list & filters
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [conditionFilter, setConditionFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<AlertSortKey>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Detail modal
  const [detailAlert, setDetailAlert] = useState<AlertDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [alertForm, setAlertForm] = useState<AlertFormState>(initialAlertFormState);

  // Ticker selector
  const [symbols, setSymbols] = useState<TickerOption[]>([]);
  const [symbolPageIndex, setSymbolPageIndex] = useState(1);
  const [symbolHasNextPage, setSymbolHasNextPage] = useState(true);
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [symbolError, setSymbolError] = useState<string | null>(null);
  const [tickerDropdownOpen, setTickerDropdownOpen] = useState(false);
  const [tickerSearch, setTickerSearch] = useState('');
  const [debouncedTickerSearch, setDebouncedTickerSearch] = useState('');

  const activeQuery = useMemo<AlertQueryParams>(
    () => ({
      pageIndex,
      pageSize: PAGE_SIZE,
      type: typeFilter === '' ? undefined : Number(typeFilter),
      condition: conditionFilter === '' ? undefined : Number(conditionFilter),
    }),
    [conditionFilter, pageIndex, typeFilter],
  );

  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((left, right) => {
      const leftValue = compareValues(left, right, sortKey);
      if (leftValue === 0) return left.id - right.id;
      return sortDirection === 'asc' ? leftValue : -leftValue;
    });
  }, [alerts, sortDirection, sortKey]);

  const filteredSymbols = useMemo(() => symbols, [symbols]);

  const selectedTickerLabel = useMemo(() => {
    const found = symbols.find((symbol) => symbol.ticker === alertForm.ticker);
    return found ? `${found.ticker}${found.viCompanyName ? ` - ${found.viCompanyName}` : ''}` : alertForm.ticker;
  }, [alertForm.ticker, symbols]);

  const applyAlertsPageData = (data: Awaited<ReturnType<typeof getMyAlerts>>) => {
    setAlerts(data.items);
    setPageIndex(data.pageIndex);
    setTotalPages(data.totalPages);
    setTotalCount(data.totalCount);
  };

  // Load alerts
  useEffect(() => {
    if (!canViewAlerts) {
      return;
    }

    let isMounted = true;

    const loadAlerts = async () => {
      setLoadingAlerts(true);
      setAlertsError(null);

      try {
        const data = await getMyAlerts(activeQuery);
        if (!isMounted) return;

        applyAlertsPageData(data);
      } catch (error) {
        if (!isMounted) return;
        setAlertsError(error instanceof Error ? error.message : 'Không thể tải danh sách cảnh báo');
      } finally {
        if (isMounted) {
          setLoadingAlerts(false);
        }
      }
    };

    loadAlerts();

    return () => {
      isMounted = false;
    };
  }, [activeQuery, canViewAlerts]);

  // Reset page on filter change
  useEffect(() => {
    setPageIndex(1);
  }, [typeFilter, conditionFilter]);

  // Init symbols on create modal open
  useEffect(() => {
    if (!createOpen) {
      setTickerDropdownOpen(false);
      return;
    }

    if (symbols.length === 0) {
      setSymbolPageIndex(1);
      setSymbolHasNextPage(true);
      setTickerSearch('');
    }
  }, [createOpen, symbols.length]);

  // Debounce ticker search for API calls
  useEffect(() => {
    if (!createOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedTickerSearch(tickerSearch.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [createOpen, tickerSearch]);

  // Reset symbol pagination when search query changes
  useEffect(() => {
    if (!createOpen) {
      return;
    }

    setSymbolPageIndex(1);
    setSymbolHasNextPage(true);
  }, [createOpen, tickerSearch]);

  // Load symbols paginated
  useEffect(() => {
    if (!createOpen) return;

    let isMounted = true;

    const loadSymbols = async () => {
      setSymbolLoading(true);
      setSymbolError(null);

      try {
        const hasSearchQuery = debouncedTickerSearch.length > 0;
        const data = hasSearchQuery
          ? await searchSymbols({
              query: debouncedTickerSearch,
              isTickerOnly: true,
              pageIndex: symbolPageIndex,
              pageSize: SYMBOL_PAGE_SIZE,
            })
          : await fetchSymbolsPaginated({
              PageIndex: symbolPageIndex,
              PageSize: SYMBOL_PAGE_SIZE,
            });

        if (!isMounted) return;

        setSymbols((current) => {
          const merged = symbolPageIndex === 1 ? data.items : [...current, ...data.items];
          const unique = new Map<string, TickerOption>();
          merged.forEach((item) => unique.set(item.ticker, item));
          return Array.from(unique.values());
        });
        setSymbolHasNextPage(data.hasNextPage);
      } catch (error) {
        if (!isMounted) return;
        setSymbolError(error instanceof Error ? error.message : 'Không thể tải danh sách ticker');
      } finally {
        if (isMounted) {
          setSymbolLoading(false);
        }
      }
    };

    void loadSymbols();

    return () => {
      isMounted = false;
    };
  }, [createOpen, symbolPageIndex, debouncedTickerSearch]);

  // Modal handlers
  const openDetail = async (alertOrId: AlertDto | number) => {
    const alertId = typeof alertOrId === 'number' ? alertOrId : alertOrId.id;

    setDetailLoading(true);
    setDetailError(null);
    setDetailOpen(true);

    try {
      const alert = await getAlertById(alertId);
      setDetailAlert(alert);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'Không thể tải chi tiết cảnh báo');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateAlertInState = (updatedAlert: AlertDto) => {
    setDetailAlert(updatedAlert);
    setAlerts((current) => current.map((item) => (item.id === updatedAlert.id ? updatedAlert : item)));
  };

  const handleToggleAlertStatus = async () => {
    if (!detailAlert || statusChanging) return;

    setStatusChanging(true);
    setDetailError(null);

    try {
      const updated = await toggleAlertStatus(detailAlert.id);
      updateAlertInState(updated);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'Không thể đổi trạng thái cảnh báo');
    } finally {
      setStatusChanging(false);
    }
  };

  const handleOpenCreate = () => {
    setCreateError(null);
    setAlertForm(initialAlertFormState);
    setTickerSearch('');
    setDebouncedTickerSearch('');
    setCreateOpen(true);
    if (symbols.length === 0) {
      setSymbolPageIndex(1);
    }
  };

  const handleLoadMoreSymbols = () => {
    if (!symbolHasNextPage || symbolLoading) return;
    setSymbolPageIndex((current) => current + 1);
  };

  const handleCreateAlert = async () => {
    const selectedCondition = Number(alertForm.condition) as AlertConditionValue;
    const selectedType = Number(alertForm.type) as AlertTypeValue;

    if (!alertForm.ticker.trim()) {
      setCreateError('Vui lòng chọn ticker');
      return;
    }

    if (!alertForm.name.trim()) {
      setCreateError('Vui lòng nhập tên cảnh báo');
      return;
    }

    if (isThresholdCondition(alertForm.condition) && !isNumericInput(alertForm.thresholdValue)) {
      setCreateError('Vui lòng nhập thresholdValue hợp lệ');
      return;
    }

    if (isPercentCondition(alertForm.condition) && !isNumericInput(alertForm.changePercentage)) {
      setCreateError('Vui lòng nhập changePercentage hợp lệ');
      return;
    }

    setCreateSaving(true);
    setCreateError(null);

    try {
      const payload = {
        ticker: alertForm.ticker.trim().toUpperCase(),
        type: selectedType,
        condition: selectedCondition,
        name: alertForm.name.trim(),
        thresholdValue: isThresholdCondition(alertForm.condition) ? Number(alertForm.thresholdValue) : null,
        changePercentage: isPercentCondition(alertForm.condition) ? Number(alertForm.changePercentage) : null,
      };

      await createAlert(payload);

      const refreshed = await getMyAlerts({
        ...activeQuery,
        pageIndex: 1,
      });

      applyAlertsPageData(refreshed);
      setCreateOpen(false);
      setAlertForm(initialAlertFormState);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Không thể tạo cảnh báo');
    } finally {
      setCreateSaving(false);
    }
  };

  const toggleSort = (key: AlertSortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection(key === 'updatedAt' ? 'desc' : 'asc');
  };

  if (!canViewAlerts) {
    return (
      <div className={`rounded-2xl border ${borderCls} ${bgCard} p-6 shadow-sm`}>
        <h3 className="text-2xl font-extrabold">Cảnh báo</h3>
        <p className={`mt-2 text-sm ${textSecondary}`}>Tài khoản Staff/Admin không có quyền xem tab này.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border ${borderCls} ${bgCard} p-6 shadow-sm`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-2xl font-extrabold">Cảnh báo</h3>
          <p className={`mt-2 text-sm ${textSecondary}`}>Quản lý cảnh báo giá/khối lượng theo ticker, bộ lọc và trạng thái.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={loadingAlerts}
            className="rounded-xl border border-black px-4 py-3 text-sm font-bold text-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-500 dark:text-white"
          >
            Tạo cảnh báo
          </button>
          <div className={`rounded-xl border ${borderCls} ${bgSub} px-4 py-3 text-sm ${textSecondary}`}>
            Tổng số cảnh báo: <span className={`font-semibold ${textPrimary}`}>{totalCount}</span>
          </div>
        </div>
      </div>

      <AlertFilters
        typeFilter={typeFilter}
        conditionFilter={conditionFilter}
        onTypeChange={setTypeFilter}
        onConditionChange={setConditionFilter}
        borderCls={borderCls}
        fieldBg={fieldBg}
        textMuted={textMuted}
        textPrimary={textPrimary}
        isLoading={loadingAlerts}
      />

      {alertsError && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{alertsError}</div>
      )}

      <AlertTable
        alerts={sortedAlerts}
        loading={loadingAlerts}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={toggleSort}
        onRowClick={openDetail}
        bgSub={bgSub}
        bgCard={bgCard}
        borderCls={borderCls}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        textMuted={textMuted}
        hoverBg={hoverBg}
      />

      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <p className={textSecondary}>
          Trang <span className={`font-semibold ${textPrimary}`}>{pageIndex}</span> / <span className={`font-semibold ${textPrimary}`}>{totalPages}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPageIndex((currentPage) => Math.max(1, currentPage - 1))}
            disabled={pageIndex <= 1 || loadingAlerts}
            className={`rounded-lg border px-3 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${borderCls} ${textSecondary} ${hoverBg}`}
          >
            Trước
          </button>
          <button
            type="button"
            onClick={() => setPageIndex((currentPage) => Math.min(totalPages, currentPage + 1))}
            disabled={pageIndex >= totalPages || loadingAlerts}
            className={`rounded-lg border px-3 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${borderCls} ${textSecondary} ${hoverBg}`}
          >
            Sau
          </button>
        </div>
      </div>

      <AlertDetailModal
        isOpen={detailOpen}
        alert={detailAlert}
        loading={detailLoading}
        error={detailError}
        isChangingStatus={statusChanging}
        onClose={() => setDetailOpen(false)}
        onToggleStatus={handleToggleAlertStatus}
        borderCls={borderCls}
        bgCard={bgCard}
        fieldBg={fieldBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        textMuted={textMuted}
        hoverBg={hoverBg}
      />

      <AlertCreateModal
        isOpen={createOpen}
        isSaving={createSaving}
        error={createError}
        alertForm={alertForm}
        symbols={symbols}
        filteredSymbols={filteredSymbols}
        tickerSearch={tickerSearch}
        tickerDropdownOpen={tickerDropdownOpen}
        symbolLoading={symbolLoading}
        symbolError={symbolError}
        symbolHasNextPage={symbolHasNextPage}
        selectedTickerLabel={selectedTickerLabel}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateAlert}
        onFormChange={(field, value) => setAlertForm((current) => ({ ...current, [field]: value }))}
        onTickerChange={(ticker) => setAlertForm((current) => ({ ...current, ticker }))}
        onTickerSearchChange={setTickerSearch}
        onTickerDropdownToggle={setTickerDropdownOpen}
        onLoadMoreSymbols={handleLoadMoreSymbols}
        borderCls={borderCls}
        bgCard={bgCard}
        fieldBg={fieldBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        textMuted={textMuted}
        hoverBg={hoverBg}
      />
    </div>
  );
}
