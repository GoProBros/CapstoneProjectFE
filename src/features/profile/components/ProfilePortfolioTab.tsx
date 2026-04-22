"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPortfolio,
  createTradingTransaction,
  deletePortfolio,
  getPortfolioById,
  getPortfolios,
  updateMyInvestmentCapital,
  updatePortfolio,
} from "@/services/admin/portfolioService";
import { PortfolioOverallFilterType } from "@/types/portfolio";
import type {
  PortfolioDto,
  PortfolioOverallFilterValue,
  TransactionSideValue,
} from "@/types/portfolio";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { formatCurrencyVnd } from "./helpers";
import {
  AddTransactionModal,
  PortfolioCreateModal,
  PortfolioDetail,
  PortfolioEditModal,
} from "./portfolio";
import { useProfileTheme } from "./useProfileTheme";

const PAGE_SIZE = 10;

type PortfolioFormState = {
  ticker: string;
  name: string;
  description: string;
  status: "1" | "0";
};

type TransactionFormState = {
  side: TransactionSideValue;
  quantity: string;
  price: string;
  transactionDate: string;
  note: string;
};

type OverallFilterOption = "all" | "profit" | "loss";

const initialPortfolioFormState: PortfolioFormState = {
  ticker: "",
  name: "",
  description: "",
  status: "1",
};

const initialTransactionFormState: TransactionFormState = {
  side: 1,
  quantity: "",
  price: "",
  transactionDate: "",
  note: "",
};

function isValidPositiveNumber(value: string): boolean {
  if (value.trim() === "") return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

function parseNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTicker(value: string): string {
  return value.trim().toUpperCase();
}

function parseNonNegativeCapitalInput(rawValue: string): number | null {
  const normalized = rawValue.replace(/[^\d.-]/g, "");
  if (normalized.trim().length === 0) return null;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function ProfilePortfolioTab() {
  const {
    borderCls,
    bgCard,
    bgSub,
    fieldBg,
    textPrimary,
    textSecondary,
    textMuted,
    hoverBg,
  } = useProfileTheme();

  const [portfolios, setPortfolios] = useState<PortfolioDto[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [capitalError, setCapitalError] = useState<string | null>(null);
  const [updatingCapital, setUpdatingCapital] = useState(false);

  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [tickerSearch, setTickerSearch] = useState("");
  const [overallFilter, setOverallFilter] =
    useState<OverallFilterOption>("all");
  const [capitalInput, setCapitalInput] = useState("");
  const [isEditingCapital, setIsEditingCapital] = useState(false);

  const [activeView, setActiveView] = useState<"list" | "detail">("list");
  const [selectedPortfolio, setSelectedPortfolio] =
    useState<PortfolioDto | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioDto | null>(null);

  const [portfolioForm, setPortfolioForm] = useState<PortfolioFormState>(
    initialPortfolioFormState,
  );
  const [transactionForm, setTransactionForm] = useState<TransactionFormState>(
    initialTransactionFormState,
  );

  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);

  const availableCapital =
    selectedPortfolio?.availableCapital ?? portfolios[0]?.availableCapital ?? 0;
  const normalizedTickerSearch = tickerSearch.trim();
  const selectedPortfolioTicker = selectedPortfolio?.ticker ?? "";

  const overallFilterValue = useMemo<
    PortfolioOverallFilterValue | undefined
  >(() => {
    if (overallFilter === "profit") return PortfolioOverallFilterType.Profit;
    if (overallFilter === "loss") return PortfolioOverallFilterType.Loss;
    return undefined;
  }, [overallFilter]);

  const totalPagesSafe = Math.max(1, totalPages);
  const currentPage = Math.min(pageIndex, totalPagesSafe);

  useEffect(() => {
    if (!isEditingCapital) {
      setCapitalInput(availableCapital.toString());
    }
  }, [availableCapital, isEditingCapital]);

  const loadPortfolios = useCallback(async () => {
    setLoadingPortfolios(true);
    setPortfolioError(null);

    try {
      const paginated = await getPortfolios({
        pageIndex,
        pageSize: PAGE_SIZE,
        ticker:
          normalizedTickerSearch.length > 0
            ? normalizedTickerSearch
            : undefined,
        overallFilter: overallFilterValue,
      });

      setPortfolios(paginated.items);
      setTotalPages(Math.max(1, paginated.totalPages));
      setTotalCount(paginated.totalCount);
      setPageIndex(paginated.pageIndex);
    } catch (error) {
      setPortfolioError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh mục đầu tư",
      );
    } finally {
      setLoadingPortfolios(false);
    }
  }, [overallFilterValue, pageIndex, normalizedTickerSearch]);

  const loadPortfolioDetail = async (portfolioId: number) => {
    setLoadingDetail(true);
    setSavingError(null);

    try {
      const portfolio = await getPortfolioById(portfolioId);
      setSelectedPortfolio(portfolio);
      setActiveView("detail");
    } catch (error) {
      setSavingError(
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết danh mục",
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    void loadPortfolios();
  }, [loadPortfolios]);

  useEffect(() => {
    setPageIndex(1);
  }, [overallFilter, normalizedTickerSearch]);

  const openCreateModal = () => {
    setPortfolioForm(initialPortfolioFormState);
    setSavingError(null);
    setCreateModalOpen(true);
  };

  const openEditModal = (portfolio: PortfolioDto) => {
    setPortfolioForm({
      ticker: portfolio.ticker,
      name: portfolio.name ?? "",
      description: portfolio.description ?? "",
      status: portfolio.status === 1 ? "1" : "0",
    });
    setSelectedPortfolio(portfolio);
    setSavingError(null);
    setEditModalOpen(true);
  };

  const openPortfolioDetail = async (portfolioOrId: PortfolioDto | number) => {
    const portfolioId =
      typeof portfolioOrId === "number" ? portfolioOrId : portfolioOrId.id;
    await loadPortfolioDetail(portfolioId);
  };

  const handleCreatePortfolio = async () => {
    const normalizedTicker = normalizeTicker(portfolioForm.ticker);
    if (normalizedTicker.length === 0) {
      setSavingError("Vui lòng nhập ticker cho danh mục");
      return;
    }

    setSaving(true);
    setSavingError(null);

    try {
      const created = await createPortfolio({
        ticker: normalizedTicker,
        name: parseNullableText(portfolioForm.name),
        description: parseNullableText(portfolioForm.description),
        status: 1,
      });

      setCreateModalOpen(false);
      setPageIndex(1);
      await loadPortfolios();
      await loadPortfolioDetail(created.id);
    } catch (error) {
      setSavingError(
        error instanceof Error ? error.message : "Không thể tạo danh mục",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePortfolio = async () => {
    if (!selectedPortfolio) return;

    const normalizedTicker = normalizeTicker(portfolioForm.ticker);
    if (normalizedTicker.length === 0) {
      setSavingError("Vui lòng nhập ticker cho danh mục");
      return;
    }

    const normalizedName = portfolioForm.name.trim();
    if (normalizedName.length === 0) {
      setSavingError("Vui lòng nhập tên danh mục");
      return;
    }

    const normalizedDescription = portfolioForm.description.trim();

    setSaving(true);
    setSavingError(null);

    try {
      const updated = await updatePortfolio({
        id: selectedPortfolio.id,
        ticker: normalizedTicker,
        name: normalizedName,
        description: normalizedDescription,
        status: portfolioForm.status === "1" ? 1 : 0,
      });

      await loadPortfolios();
      setEditModalOpen(false);
      setSelectedPortfolio(updated);
      await loadPortfolioDetail(updated.id);
    } catch (error) {
      setSavingError(
        error instanceof Error ? error.message : "Không thể cập nhật danh mục",
      );
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

      if (selectedPortfolio?.id === deleteTarget.id) {
        setSelectedPortfolio(null);
        setActiveView("list");
      }
      await loadPortfolios();
      setDeleteTarget(null);
    } catch (error) {
      setSavingError(
        error instanceof Error ? error.message : "Không thể xóa danh mục",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTransaction = async () => {
    if (!selectedPortfolio) return;

    if (
      !isValidPositiveNumber(transactionForm.quantity) ||
      !isValidPositiveNumber(transactionForm.price)
    ) {
      setSavingError("Vui lòng nhập khối lượng và giá hợp lệ");
      return;
    }

    setSaving(true);
    setSavingError(null);

    try {
      await createTradingTransaction(selectedPortfolio.id, {
        side: transactionForm.side,
        quantity: Number(transactionForm.quantity),
        price: Number(transactionForm.price),
        originalMessage: null,
        note: parseNullableText(transactionForm.note),
        transactionDate:
          transactionForm.transactionDate.trim().length > 0
            ? new Date(transactionForm.transactionDate).toISOString()
            : new Date().toISOString(),
      });

      await loadPortfolios();
      await loadPortfolioDetail(selectedPortfolio.id);
      setTransactionForm(initialTransactionFormState);
      setTransactionModalOpen(false);
    } catch (error) {
      setSavingError(
        error instanceof Error ? error.message : "Không thể tạo giao dịch",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAvailableCapital = async () => {
    const parsedCapital = parseNonNegativeCapitalInput(capitalInput);
    if (parsedCapital == null) {
      setCapitalError("Vui lòng nhập vốn khả dụng hợp lệ (>= 0)");
      return;
    }

    setUpdatingCapital(true);
    setCapitalError(null);

    try {
      const updated = await updateMyInvestmentCapital({
        investmentCapital: parsedCapital,
      });

      setPortfolios((current) =>
        current.map((portfolio) => ({
          ...portfolio,
          availableCapital: updated.availableCapital,
        })),
      );

      setSelectedPortfolio((current) =>
        current
          ? {
              ...current,
              availableCapital: updated.availableCapital,
            }
          : current,
      );

      setIsEditingCapital(false);
    } catch (error) {
      setCapitalError(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật vốn khả dụng",
      );
    } finally {
      setUpdatingCapital(false);
    }
  };

  const handleCapitalInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setCapitalInput(availableCapital.toString());
      setCapitalError(null);
      setIsEditingCapital(false);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      void handleUpdateAvailableCapital();
    }
  };

  const closeDetail = () => {
    setActiveView("list");
    setSavingError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={`text-base font-semibold ${textPrimary}`}>
            Danh mục đầu tư
          </h2>
          <p className={`mt-1 text-sm ${textSecondary}`}>
            Theo dõi hiệu suất danh mục, giao dịch và vốn đầu tư khả dụng.
          </p>
        </div>
        {activeView === "list" && (
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
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {portfolioError}
        </div>
      )}

      {savingError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          {savingError}
        </div>
      )}

      {capitalError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          {capitalError}
        </div>
      )}

      {activeView === "list" ? (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border ${borderCls} ${bgCard} p-3 md:p-4 shadow-sm`}
          >
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <label
                className={`flex md:h-[76px] flex-col justify-center rounded-lg border ${borderCls} ${fieldBg} px-3 py-2 lg:w-[300px]`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}
                >
                  Tìm theo ticker
                </span>
                <input
                  value={tickerSearch}
                  onChange={(event) => setTickerSearch(event.target.value)}
                  className={`mt-1 w-full bg-transparent text-sm ${textPrimary} outline-none`}
                  placeholder="VD: VCB"
                />
              </label>

              <div className="flex flex-col gap-2 md:flex-row md:items-start">
                <label
                  className={`relative flex md:h-[76px] flex-col justify-center rounded-lg border ${borderCls} ${fieldBg} px-3 py-2 md:min-w-[220px]`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}
                  >
                    Lọc lợi nhuận tổng
                  </span>
                  <select
                    value={overallFilter}
                    onChange={(event) =>
                      setOverallFilter(
                        event.target.value as OverallFilterOption,
                      )
                    }
                    className={`mt-1 w-full appearance-none bg-inherit pr-8 text-sm ${textPrimary} outline-none transition-all`}
                  >
                    <option value="all">Tất cả</option>
                    <option value="profit">Lãi</option>
                    <option value="loss">Lỗ</option>
                  </select>
                  <span
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${textMuted}`}
                  >
                    ▾
                  </span>
                </label>

                <div
                  className={`flex md:h-[76px] flex-col justify-center rounded-lg border ${borderCls} ${bgSub} px-3 py-2 md:min-w-[360px]`}
                >
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}
                  >
                    Vốn có sẵn
                  </p>
                  <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-center">
                    {!isEditingCapital ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCapitalInput(availableCapital.toString());
                          setCapitalError(null);
                          setIsEditingCapital(true);
                        }}
                        className={`text-sm font-bold ${textPrimary} transition-opacity hover:opacity-80`}
                      >
                        {formatCurrencyVnd(availableCapital)}
                      </button>
                    ) : (
                      <>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={capitalInput}
                          onChange={(event) =>
                            setCapitalInput(event.target.value)
                          }
                          onKeyDown={handleCapitalInputKeyDown}
                          className={`w-full rounded-lg border ${borderCls} ${fieldBg} px-3 py-2 text-sm ${textPrimary} outline-none md:w-44`}
                          placeholder="Nhập vốn"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            void handleUpdateAvailableCapital();
                          }}
                          disabled={updatingCapital}
                          className="rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingCapital ? "Đang cập nhật..." : "Lưu vốn"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingCapital(false);
                          }}
                          disabled={updatingCapital}
                          className="rounded-full bg-transparent px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          X
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl border ${borderCls} ${bgCard} p-4 md:p-5 shadow-sm`}
          >
            <div className={`overflow-hidden rounded-xl border ${borderCls}`}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-700">
                  <thead
                    className={`${bgSub} text-xs uppercase tracking-wider ${textMuted}`}
                  >
                    <tr>
                      <th className="px-4 py-3">Tên danh mục</th>
                      <th className="px-4 py-3">Mã chứng khoán</th>
                      <th className="px-4 py-3">SL còn lại</th>
                      <th className="px-4 py-3">Tổng lợi nhuận</th>
                      <th className="px-4 py-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`${bgCard} divide-y divide-gray-100 dark:divide-gray-800`}
                  >
                    {loadingPortfolios ? (
                      <tr>
                        <td
                          className={`px-4 py-8 text-center text-sm ${textSecondary}`}
                          colSpan={5}
                        >
                          Đang tải danh mục...
                        </td>
                      </tr>
                    ) : portfolios.length === 0 ? (
                      <tr>
                        <td
                          className={`px-4 py-8 text-center text-sm ${textSecondary}`}
                          colSpan={5}
                        >
                          Không có danh mục nào.
                        </td>
                      </tr>
                    ) : (
                      portfolios.map((portfolio) => (
                        <tr
                          key={portfolio.id}
                          className={`transition-colors ${hoverBg}`}
                        >
                          <td className={`px-4 py-3 ${textPrimary}`}>
                            <button
                              type="button"
                              onClick={() => {
                                void openPortfolioDetail(portfolio);
                              }}
                              className="font-semibold hover:underline"
                            >
                              {portfolio.name?.trim() ||
                                `Danh mục #${portfolio.id}`}
                            </button>
                          </td>
                          <td
                            className={`px-4 py-3 font-semibold ${textPrimary}`}
                          >
                            {portfolio.ticker || "—"}
                          </td>
                          <td className={`px-4 py-3 ${textPrimary}`}>
                            {formatQuantity(
                              portfolio.summary.remainingQuantity,
                            )}
                          </td>
                          <td
                            className={`px-4 py-3 font-semibold ${
                              portfolio.overall.totalPnL > 0
                                ? "text-emerald-500"
                                : portfolio.overall.totalPnL < 0
                                  ? "text-red-500"
                                  : textPrimary
                            }`}
                          >
                            {formatCurrencyVnd(portfolio.overall.totalPnL)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  void openPortfolioDetail(portfolio);
                                }}
                                className={`rounded-md border ${borderCls} p-1.5 ${textSecondary} ${hoverBg}`}
                                aria-label="Xem chi tiết"
                                title="Chi tiết"
                              >
                                <svg
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditModal(portfolio)}
                                className={`rounded-md border ${borderCls} p-1.5 ${textSecondary} ${hoverBg}`}
                                aria-label="Cấu hình danh mục"
                                title="Cấu hình"
                              >
                                <svg
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1v.17a2 2 0 1 1-4 0V21a1.65 1.65 0 0 0-.33-1 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.33H2.83a2 2 0 1 1 0-4H3a1.65 1.65 0 0 0 1-.33 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6c.39-.05.76-.25 1-.6.2-.28.31-.62.33-1V2.83a2 2 0 1 1 4 0V3a1.65 1.65 0 0 0 .33 1c.24.35.61.55 1 .6.64.1 1.29-.12 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.49.49-.65 1.2-.33 1.82.12.24.28.44.6.6.31.16.67.24 1 .24h.17a2 2 0 1 1 0 4H21c-.33 0-.69.08-1 .24-.32.16-.48.36-.6.6Z" />
                                </svg>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteTarget(portfolio)}
                                className="rounded-md border border-red-500/30 p-1.5 text-red-500 hover:bg-red-500/10"
                                aria-label="Xóa danh mục"
                                title="Xóa"
                              >
                                <svg
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4h8v2" />
                                  <path d="M19 6l-1 14H6L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <p className={textSecondary}>
              Trang{" "}
              <span className={`font-semibold ${textPrimary}`}>
                {currentPage}
              </span>{" "}
              /{" "}
              <span className={`font-semibold ${textPrimary}`}>
                {totalPagesSafe}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPageIndex((current) => Math.max(1, current - 1))
                }
                disabled={currentPage <= 1 || loadingPortfolios}
                className={`rounded-lg border px-3 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${borderCls} ${textSecondary} ${hoverBg}`}
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() =>
                  setPageIndex((current) =>
                    Math.min(totalPagesSafe, current + 1),
                  )
                }
                disabled={currentPage >= totalPagesSafe || loadingPortfolios}
                className={`rounded-lg border px-3 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${borderCls} ${textSecondary} ${hoverBg}`}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      ) : (
        <PortfolioDetail
          portfolio={selectedPortfolio}
          loading={loadingDetail}
          onClose={closeDetail}
          onAddTransaction={() => {
            const defaultPrice = selectedPortfolio?.summary.currentPrice;
            setTransactionForm({
              ...initialTransactionFormState,
              price:
                defaultPrice != null && Number.isFinite(defaultPrice)
                  ? String(defaultPrice)
                  : "",
            });
            setSavingError(null);
            setTransactionModalOpen(true);
          }}
          onEditPortfolio={() =>
            selectedPortfolio && openEditModal(selectedPortfolio)
          }
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

      <PortfolioCreateModal
        isOpen={createModalOpen}
        isSaving={saving}
        error={savingError}
        form={portfolioForm}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreatePortfolio}
        onFormChange={(field, value) =>
          setPortfolioForm((current) => ({ ...current, [field]: value }))
        }
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
        onFormChange={(field, value) =>
          setPortfolioForm((current) => ({ ...current, [field]: value }))
        }
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
        ticker={selectedPortfolioTicker}
        form={transactionForm}
        onClose={() => setTransactionModalOpen(false)}
        onSubmit={handleCreateTransaction}
        onFormChange={(field, value) =>
          setTransactionForm((current) => ({ ...current, [field]: value }))
        }
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
        message={`Bạn có chắc muốn xóa danh mục ${deleteTarget?.name ?? `#${deleteTarget?.id ?? ""}`}? Hành động này không thể hoàn tác.`}
        confirmText={saving ? "Đang xóa..." : "Xóa"}
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
