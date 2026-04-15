"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  createPortfolio,
  createTradingTransaction,
  deletePortfolio,
  getPortfolioById,
  getPortfolios,
  updatePortfolio,
} from '@/services/portfolioService';
import type { PortfolioDto, TradingTransactionDto, TransactionSideValue } from '@/types/portfolio';
import { formatDateTime, getStatusLabel, sortActiveFirst } from './helpers';
import { useProfileTheme } from './useProfileTheme';
import {
  PortfolioList,
  PortfolioCreateModal,
  PortfolioEditModal,
  PortfolioActionMenu,
  PortfolioDetail,
  AddTransactionModal,
} from './portfolio';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface PortfolioFormState {
  name: string;
  description: string;
  status: '1' | '0';
}

interface TransactionFormState {
  ticker: string;
  side: TransactionSideValue;
  quantity: string;
  price: string;
  fee: string;
  tax: string;
  note: string;
}

const initialPortfolioFormState: PortfolioFormState = {
  name: '',
  description: '',
  status: '1',
};

const initialTransactionFormState: TransactionFormState = {
  ticker: '',
  side: 1,
  quantity: '',
  price: '',
  fee: '',
  tax: '',
  note: '',
};

function isValidNumber(value: string): boolean {
  if (value.trim() === '') return false;
  const parsed = Number(value);
  return Number.isFinite(parsed);
}

function parseNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function ProfilePortfolioTab() {
  const { user } = useAuth();
  const { borderCls, bgCard, bgSub, fieldBg, textPrimary, textSecondary, textMuted, hoverBg } = useProfileTheme();

  // Portfolio list state
  const [portfolios, setPortfolios] = useState<PortfolioDto[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  // View state
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list');
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioDto | null>(null);

  // Transactions
  const [portfolioTransactions, setPortfolioTransactions] = useState<Record<number, TradingTransactionDto[]>>({});

  // Action menu
  const [menuOpenPortfolioId, setMenuOpenPortfolioId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioDto | null>(null);

  // Form states
  const [portfolioForm, setPortfolioForm] = useState<PortfolioFormState>(initialPortfolioFormState);
  const [transactionForm, setTransactionForm] = useState<TransactionFormState>(initialTransactionFormState);

  // Save states
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);

  // Memoized data
  const sortedPortfolios = useMemo(() => sortActiveFirst(portfolios), [portfolios]);
  const selectedPortfolioId = selectedPortfolio?.id ?? null;
  const selectedPortfolioTransactions = selectedPortfolioId ? portfolioTransactions[selectedPortfolioId] ?? [] : [];
  const openMenuPortfolio = menuOpenPortfolioId
    ? portfolios.find((portfolio) => portfolio.id === menuOpenPortfolioId) ?? null
    : null;

  // Load portfolios
  const loadPortfolios = async () => {
    setLoadingPortfolios(true);
    setPortfolioError(null);

    try {
      const data = await getPortfolios();
      setPortfolios(sortActiveFirst(data));
    } catch (error) {
      setPortfolioError(error instanceof Error ? error.message : 'Không thể tải danh mục đầu tư');
    } finally {
      setLoadingPortfolios(false);
    }
  };

  useEffect(() => {
    void loadPortfolios();
  }, []);

  // Menu close handler
  useEffect(() => {
    if (menuOpenPortfolioId == null) return undefined;

    const closeMenu = () => {
      setMenuOpenPortfolioId(null);
      setMenuPosition(null);
    };

    const handleDocumentClick = () => closeMenu();
    const handleWindowChange = () => closeMenu();

    document.addEventListener('click', handleDocumentClick);
    window.addEventListener('scroll', handleWindowChange, true);
    window.addEventListener('resize', handleWindowChange);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      window.removeEventListener('scroll', handleWindowChange, true);
      window.removeEventListener('resize', handleWindowChange);
    };
  }, [menuOpenPortfolioId]);

  // Modal handlers
  const openCreateModal = () => {
    setPortfolioForm(initialPortfolioFormState);
    setSavingError(null);
    setCreateModalOpen(true);
  };

  const openPortfolioMenu = (portfolio: PortfolioDto, buttonElement: HTMLButtonElement) => {
    const rect = buttonElement.getBoundingClientRect();
    setMenuPosition({
      top: Math.min(window.innerHeight - 200, rect.bottom + 8),
      left: Math.max(12, Math.min(window.innerWidth - 196, rect.right - 176)),
    });
    setMenuOpenPortfolioId((current) => (current === portfolio.id ? null : portfolio.id));
  };

  const openEditModal = (portfolio: PortfolioDto) => {
    setPortfolioForm({
      name: portfolio.name ?? '',
      description: portfolio.description ?? '',
      status: portfolio.status === 1 ? '1' : '0',
    });
    setSelectedPortfolio(portfolio);
    setSavingError(null);
    setEditModalOpen(true);
  };

  const openPortfolioDetail = async (portfolioOrId: PortfolioDto | number) => {
    const portfolioId = typeof portfolioOrId === 'number' ? portfolioOrId : portfolioOrId.id;

    setSavingError(null);

    try {
      const portfolio = await getPortfolioById(portfolioId);
      setSelectedPortfolio(portfolio);
      setActiveView('detail');
      setMenuOpenPortfolioId(null);
    } catch (error) {
      setSavingError(error instanceof Error ? error.message : 'Không thể tải chi tiết danh mục');
    }
  };

  // CRUD handlers
  const handleCreatePortfolio = async () => {
    if (portfolioForm.name.trim().length === 0) {
      setSavingError('Vui lòng nhập tên danh mục');
      return;
    }

    setSaving(true);
    setSavingError(null);

    try {
      const created = await createPortfolio({
        name: portfolioForm.name.trim(),
        description: parseNullableText(portfolioForm.description),
        status: 1,
      });

      await loadPortfolios();
      setSelectedPortfolio(created);
      setActiveView('detail');
      setCreateModalOpen(false);
    } catch (error) {
      setSavingError(error instanceof Error ? error.message : 'Không thể tạo danh mục');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePortfolio = async () => {
    if (!selectedPortfolio) return;
    if (portfolioForm.name.trim().length === 0) {
      setSavingError('Vui lòng nhập tên danh mục');
      return;
    }

    setSaving(true);
    setSavingError(null);

    try {
      const updated = await updatePortfolio({
        id: selectedPortfolio.id,
        name: portfolioForm.name.trim(),
        description: parseNullableText(portfolioForm.description),
        status: portfolioForm.status === '1' ? 1 : 0,
      });

      setSelectedPortfolio(updated);
      await loadPortfolios();
      setEditModalOpen(false);
      setActiveView('detail');
    } catch (error) {
      setSavingError(error instanceof Error ? error.message : 'Không thể cập nhật danh mục');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePortfolio = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    setSavingError(null);

    try {
      await deletePortfolio(deleteTarget.id);
      setPortfolioTransactions((current) => {
        const nextState = { ...current };
        delete nextState[deleteTarget.id];
        return nextState;
      });
      if (selectedPortfolio?.id === deleteTarget.id) {
        setSelectedPortfolio(null);
        setActiveView('list');
      }
      await loadPortfolios();
      setDeleteTarget(null);
    } catch (error) {
      setSavingError(error instanceof Error ? error.message : 'Không thể xóa danh mục');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTransaction = async () => {
    if (!selectedPortfolio) return;

    const requiredNumberFields = [transactionForm.quantity, transactionForm.price, transactionForm.fee, transactionForm.tax];
    if (transactionForm.ticker.trim().length === 0 || requiredNumberFields.some((value) => !isValidNumber(value))) {
      setSavingError('Vui lòng nhập đầy đủ ticker, khối lượng, giá, phí và thuế');
      return;
    }

    setSaving(true);
    setSavingError(null);

    try {
      const createdTransaction = await createTradingTransaction(selectedPortfolio.id, {
        ticker: transactionForm.ticker.trim().toUpperCase(),
        side: transactionForm.side,
        quantity: Number(transactionForm.quantity),
        price: Number(transactionForm.price),
        fee: Number(transactionForm.fee),
        tax: Number(transactionForm.tax),
        note: parseNullableText(transactionForm.note),
        transactionDate: new Date().toISOString(),
      });

      setPortfolioTransactions((current) => ({
        ...current,
        [selectedPortfolio.id]: [createdTransaction, ...(current[selectedPortfolio.id] ?? [])],
      }));
      setTransactionForm(initialTransactionFormState);
      setTransactionModalOpen(false);
    } catch (error) {
      setSavingError(error instanceof Error ? error.message : 'Không thể tạo giao dịch');
    } finally {
      setSaving(false);
    }
  };

  const closeDetail = () => {
    setActiveView('list');
    setSavingError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={`text-base font-semibold ${textPrimary}`}>Danh mục đầu tư</h2>
          <p className={`mt-1 text-sm ${textSecondary}`}>Quản lý danh mục, chi tiết giao dịch và lịch sử giao dịch.</p>
        </div>
        {activeView === 'list' && (
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl border-2 border-black px-4 py-2 text-sm font-bold text-black transition-transform hover:-translate-y-0.5 dark:border-white dark:text-white"
          >
            Danh mục mới
          </button>
        )}
      </div>

      {portfolioError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{portfolioError}</div>
      )}

      {savingError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">{savingError}</div>
      )}

      {activeView === 'list' ? (
        <PortfolioList
          portfolios={sortedPortfolios}
          loading={loadingPortfolios}
          onPortfolioClick={openPortfolioDetail}
          onMenuClick={(portfolio, button) => openPortfolioMenu(portfolio, button)}
          bgSub={bgSub}
          bgCard={bgCard}
          borderCls={borderCls}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          textMuted={textMuted}
          hoverBg={hoverBg}
        />
      ) : (
        <PortfolioDetail
          portfolio={selectedPortfolio}
          transactions={selectedPortfolioTransactions}
          loading={loadingPortfolios}
          onClose={closeDetail}
          onAddTransaction={() => {
            setTransactionForm(initialTransactionFormState);
            setSavingError(null);
            setTransactionModalOpen(true);
          }}
          onEditPortfolio={() => selectedPortfolio && openEditModal(selectedPortfolio)}
          bgSub={bgSub}
          bgCard={bgCard}
          borderCls={borderCls}
          fieldBg={fieldBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          textMuted={textMuted}
          hoverBg={hoverBg}
        />
      )}

      <PortfolioActionMenu
        isOpen={!!openMenuPortfolio}
        portfolio={openMenuPortfolio}
        position={menuPosition}
        onClose={() => setMenuOpenPortfolioId(null)}
        onEdit={openEditModal}
        onDetail={openPortfolioDetail}
        onDelete={(portfolio) => {
          setMenuOpenPortfolioId(null);
          setDeleteTarget(portfolio);
        }}
        borderCls={borderCls}
        textPrimary={textPrimary}
        hoverBg={hoverBg}
      />

      <PortfolioCreateModal
        isOpen={createModalOpen}
        isSaving={saving}
        error={savingError}
        form={portfolioForm}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreatePortfolio}
        onFormChange={(field, value) => setPortfolioForm((current) => ({ ...current, [field]: value }))}
        borderCls={borderCls}
        bgCard={bgCard}
        fieldBg={fieldBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        textMuted={textMuted}
        hoverBg={hoverBg}
      />

      <PortfolioEditModal
        isOpen={editModalOpen}
        isSaving={saving}
        error={savingError}
        form={portfolioForm}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdatePortfolio}
        onFormChange={(field, value) => setPortfolioForm((current) => ({ ...current, [field]: value }))}
        borderCls={borderCls}
        bgCard={bgCard}
        fieldBg={fieldBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        textMuted={textMuted}
        hoverBg={hoverBg}
      />

      <AddTransactionModal
        isOpen={transactionModalOpen}
        isSaving={saving}
        error={savingError}
        form={transactionForm}
        onClose={() => setTransactionModalOpen(false)}
        onSubmit={handleCreateTransaction}
        onFormChange={(field, value) => setTransactionForm((current) => ({ ...current, [field]: value }))}
        borderCls={borderCls}
        bgCard={bgCard}
        fieldBg={fieldBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        textMuted={textMuted}
        hoverBg={hoverBg}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Xóa danh mục"
        message={`Bạn có chắc muốn xóa danh mục ${deleteTarget?.name ?? `#${deleteTarget?.id ?? ''}`}? Hành động này không thể hoàn tác.`}
        confirmText={saving ? 'Đang xóa...' : 'Xóa'}
        cancelText="Hủy"
        onConfirm={() => {
          void handleDeletePortfolio();
        }}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  );
}
