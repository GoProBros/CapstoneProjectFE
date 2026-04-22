"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import statisticService from "@/services/admin/statisticService";
import {
  createSubscription as createSubscriptionRequest,
  getSubscriptions,
  toggleSubscriptionStatus,
  updateSubscriptionById,
} from "@/services/admin/subscriptionService";
import type {
  SubscriptionDto,
  SubscriptionStatisticsDto,
  VipCurrentUserCountDto,
  VipPackageUsageDto,
} from "@/types/subscription";
import AddModuleModal, {
  type ModuleLibraryItem,
} from "@/features/admin/components/revenue/AddModuleModal";
import SubscriptionCardsGrid from "@/features/admin/components/revenue/SubscriptionCardsGrid";
import SubscriptionEditorSection from "@/features/admin/components/revenue/SubscriptionEditorSection";
import CreateSubscriptionModal from "@/features/admin/components/revenue/CreateSubscriptionModal";
import type {
  CreateSubscriptionDraft,
  SubscriptionDraft,
  SubscriptionWithStatus,
} from "@/features/admin/components/revenue/subscriptionManagementModels";

interface SubscriptionManagementProps {
  isLoading: boolean;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDuration(value: number) {
  if (value <= 0) {
    return "Không giới hạn";
  }

  if (value % 30 === 0) {
    const monthValue = value / 30;
    return `${monthValue} tháng`;
  }

  return `${value} ngày`;
}

function normalizeIsActive(value: unknown): boolean {
  if (value === 1 || value === true || value === "1") {
    return true;
  }

  if (value === 0 || value === false || value === "0") {
    return false;
  }

  return true;
}

function parseAllowedModuleIds(raw: unknown): string[] {
  if (!raw) {
    return [];
  }

  const normalizedArray =
    Array.isArray(raw) && raw.length > 0
      ? raw
      : typeof raw === "object" &&
          raw !== null &&
          Array.isArray((raw as { modules?: unknown[] }).modules)
        ? (raw as { modules: unknown[] }).modules
        : [];

  return normalizedArray
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (typeof item === "object" && item !== null) {
        const value = item as Record<string, unknown>;
        const candidate = value.id ?? value.moduleId ?? value.name;
        if (typeof candidate === "string" || typeof candidate === "number") {
          return String(candidate);
        }
      }

      return "";
    })
    .filter((item): item is string => item.length > 0);
}

function createDraftFromSubscription(
  subscription: SubscriptionWithStatus,
): SubscriptionDraft {
  return {
    id: subscription.id,
    name: subscription.name,
    levelOrder: subscription.levelOrder,
    maxWorkspaces: subscription.maxWorkspaces,
    price: subscription.price,
    durationInDays: subscription.durationInDays,
    allowedModules: parseAllowedModuleIds(subscription.allowedModules),
    isActive: subscription.isActive,
  };
}

function createDefaultCreateDraft(): CreateSubscriptionDraft {
  return {
    name: "",
    levelOrder: 0,
    maxWorkspaces: 1,
    price: 0,
    durationInDays: 30,
    allowedModules: [],
    isActive: true,
  };
}

const MODULE_LIBRARY: ModuleLibraryItem[] = [
  {
    id: "smart-board",
    title: "Bảng Điện Thông Minh",
    preview: "/assets/Dashboard/ModulePreviews/heatmap.png",
  },
  {
    id: "index",
    title: "Chỉ Số Thị Trường",
    preview: "/assets/Dashboard/ModulePreviews/overview-chart.png",
  },
  {
    id: "vn-stock-chart",
    title: "Biểu Đồ Chứng Khoán Việt Nam",
    preview: "/assets/Dashboard/ModulePreviews/vn-stock-chart.png",
  },
  {
    id: "global-stock-chart",
    title: "Biểu Đồ Chứng Khoán Thế Giới",
    preview: "/assets/Dashboard/ModulePreviews/global-stock-chart.png",
  },
  {
    id: "financial-report",
    title: "Báo Cáo Tài Chính",
    preview: "/assets/Dashboard/ModulePreviews/financial-report.png",
  },
  {
    id: "financial-report-pro",
    title: "Báo Cáo Tài Chính Pro",
    preview: "/assets/Dashboard/ModulePreviews/financial-report-pro.png",
  },
  {
    id: "news",
    title: "Tin Tức",
    preview: "/assets/Dashboard/ModulePreviews/news.png",
  },
  {
    id: "session-info",
    title: "Thông Tin Phiên Giao Dịch",
    preview: "/assets/Dashboard/ModulePreviews/session-info.png",
  },
  {
    id: "order-matching",
    title: "Khớp Lệnh",
    preview: "/assets/Dashboard/ModulePreviews/order-matching.png",
  },
  {
    id: "canslim",
    title: "Canslim",
    preview: "/assets/Dashboard/ModulePreviews/canslim.png",
  },
  {
    id: "stock-screener",
    title: "Bảng Điện Chứng Khoán",
    preview: "/assets/Dashboard/ModulePreviews/stock-screener.png",
  },
  {
    id: "heatmap",
    title: "Heatmap",
    preview: "/assets/Dashboard/ModulePreviews/heatmap.png",
  },
  {
    id: "analysis-report",
    title: "Báo Cáo Phân Tích",
    preview: "/assets/Dashboard/ModulePreviews/analysis-report.png",
  },
  {
    id: "ai-chat",
    title: "Trò chuyện",
    preview: "/assets/Dashboard/ModulePreviews/AIAssistantModule.jpg",
  },
];

const MODULE_TITLES = MODULE_LIBRARY.reduce<Record<string, string>>(
  (result, item) => ({
    ...result,
    [item.id]: item.title,
  }),
  {},
);

export default function SubscriptionManagement({
  isLoading,
}: SubscriptionManagementProps) {
  const { user } = useAuth();

  const [subscriptions, setSubscriptions] = useState<SubscriptionWithStatus[]>(
    [],
  );
  const [statistics, setStatistics] =
    useState<SubscriptionStatisticsDto | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(
    null,
  );
  const [isSubscriptionsLoading, setIsSubscriptionsLoading] = useState(true);
  const [isStatisticsLoading, setIsStatisticsLoading] = useState(true);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
    number | null
  >(null);
  const [draftMap, setDraftMap] = useState<Record<number, SubscriptionDraft>>(
    {},
  );
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
  const [moduleModalTarget, setModuleModalTarget] = useState<"edit" | "create">(
    "edit",
  );
  const [createDraft, setCreateDraft] = useState<CreateSubscriptionDraft>(
    createDefaultCreateDraft(),
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const normalizedRole = (user?.role ?? "").trim().toLowerCase();
  const isAdmin =
    normalizedRole === "admin" || normalizedRole === "quản trị viên";

  const fetchManagementData = useCallback(async () => {
    try {
      setSubscriptionError(null);
      setIsSubscriptionsLoading(true);
      setIsStatisticsLoading(true);

      const [subscriptionData, statisticsData] = await Promise.all([
        getSubscriptions(),
        statisticService.getSubscriptionStatistics(),
      ]);

      const normalizedSubscriptions = subscriptionData
        .map((item) => ({
          ...item,
          isActive: normalizeIsActive(item.isActive),
        }))
        .sort((left, right) => left.levelOrder - right.levelOrder);

      const nextDraftMap = normalizedSubscriptions.reduce<
        Record<number, SubscriptionDraft>
      >((result, item) => {
        result[item.id] = createDraftFromSubscription(item);
        return result;
      }, {});

      setSubscriptions(normalizedSubscriptions);
      setDraftMap(nextDraftMap);
      setStatistics(statisticsData);
      setSelectedSubscriptionId((prev) => {
        if (prev && normalizedSubscriptions.some((item) => item.id === prev)) {
          return prev;
        }

        return null;
      });
    } catch {
      setSubscriptionError("Không thể tải dữ liệu quản lý subscription");
      setSubscriptions([]);
      setDraftMap({});
      setStatistics(null);
      setSelectedSubscriptionId(null);
    } finally {
      setIsSubscriptionsLoading(false);
      setIsStatisticsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchManagementData();
  }, [fetchManagementData]);

  const selectedDraft =
    selectedSubscriptionId !== null
      ? draftMap[selectedSubscriptionId]
      : undefined;

  const selectedUsage = useMemo<VipPackageUsageDto | undefined>(
    () =>
      statistics?.vipPackageUsages.find(
        (item) => item.subscriptionId === selectedSubscriptionId,
      ),
    [selectedSubscriptionId, statistics],
  );

  const selectedCurrentUsers = useMemo<VipCurrentUserCountDto | undefined>(
    () =>
      statistics?.currentUsersByVipLevel.find(
        (item) => item.subscriptionId === selectedSubscriptionId,
      ),
    [selectedSubscriptionId, statistics],
  );

  const isLoadingData =
    isLoading || isSubscriptionsLoading || isStatisticsLoading;

  const modalSelectedModules =
    moduleModalTarget === "edit"
      ? (selectedDraft?.allowedModules ?? [])
      : createDraft.allowedModules;

  const updateSelectedDraftField = <K extends keyof SubscriptionDraft>(
    key: K,
    value: SubscriptionDraft[K],
  ) => {
    if (selectedSubscriptionId === null) {
      return;
    }

    setDraftMap((prev) => {
      const draft = prev[selectedSubscriptionId];
      if (!draft) {
        return prev;
      }

      return {
        ...prev,
        [selectedSubscriptionId]: {
          ...draft,
          [key]: value,
        },
      };
    });
  };

  const openModuleModal = (target: "edit" | "create") => {
    setModuleModalTarget(target);
    setIsAddModuleModalOpen(true);
  };

  const applyModuleSelection = (selectedIds: string[]) => {
    const uniqueModuleIds = Array.from(new Set(selectedIds));

    if (moduleModalTarget === "edit") {
      updateSelectedDraftField("allowedModules", uniqueModuleIds);
      return;
    }

    setCreateDraft((prev) => ({
      ...prev,
      allowedModules: uniqueModuleIds,
    }));
  };

  const removeModuleFromDraft = (
    target: "edit" | "create",
    moduleId: string,
  ) => {
    if (target === "edit") {
      if (!selectedDraft) {
        return;
      }

      updateSelectedDraftField(
        "allowedModules",
        selectedDraft.allowedModules.filter((item) => item !== moduleId),
      );
      return;
    }

    setCreateDraft((prev) => ({
      ...prev,
      allowedModules: prev.allowedModules.filter((item) => item !== moduleId),
    }));
  };

  const toggleSelectedSubscriptionStatus = async () => {
    if (!selectedDraft) {
      return;
    }

    setActionMessage(null);
    setIsTogglingStatus(true);

    const nextIsActive = !selectedDraft.isActive;

    try {
      const updatedSubscriptionResponse = await toggleSubscriptionStatus(
        selectedDraft.id,
      );

      const nextIsActiveFromResponse = normalizeIsActive(
        updatedSubscriptionResponse.isActive,
      );

      const normalizedUpdatedSubscription: SubscriptionWithStatus = {
        ...updatedSubscriptionResponse,
        isActive: nextIsActiveFromResponse,
      };

      updateSelectedDraftField("isActive", nextIsActiveFromResponse);
      setSubscriptions((prev) =>
        prev.map((item) =>
          item.id === selectedDraft.id
            ? { ...item, ...normalizedUpdatedSubscription }
            : item,
        ),
      );

      setDraftMap((prev) => ({
        ...prev,
        [selectedDraft.id]: createDraftFromSubscription(normalizedUpdatedSubscription),
      }));

      setActionMessage(
        nextIsActiveFromResponse
          ? "Đã kích hoạt nhanh gói subscription"
          : "Đã tạm ngưng nhanh gói subscription",
      );
    } catch {
      setActionMessage("Cập nhật trạng thái nhanh thất bại, vui lòng thử lại");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const saveSelectedSubscription = async () => {
    if (!selectedDraft) {
      return;
    }

    setActionMessage(null);

    const payload: { price: number; allowedModules?: string[] } = {
      price: selectedDraft.price,
    };

    if (selectedDraft.allowedModules.length > 0) {
      payload.allowedModules = selectedDraft.allowedModules;
    }

    try {
      const updatedSubscriptionResponse = await updateSubscriptionById(
        selectedDraft.id,
        payload,
      );

      const updatedSubscription: SubscriptionWithStatus = {
        ...updatedSubscriptionResponse,
        isActive: normalizeIsActive(updatedSubscriptionResponse.isActive),
      };

      setSubscriptions((prev) =>
        prev.map((item) =>
          item.id === selectedDraft.id ? { ...item, ...updatedSubscription } : item,
        ),
      );

      setDraftMap((prev) => ({
        ...prev,
        [selectedDraft.id]: createDraftFromSubscription(updatedSubscription),
      }));

      setActionMessage("Đã lưu thay đổi Giá và Allowed module thành công.");
    } catch {
      setActionMessage("Lưu thay đổi thất bại. Vui lòng thử lại.");
    }
  };

  const cancelSelectedSubscriptionChanges = () => {
    if (selectedSubscriptionId === null) {
      return;
    }

    const selectedSubscription = subscriptions.find(
      (item) => item.id === selectedSubscriptionId,
    );

    if (!selectedSubscription) {
      return;
    }

    setDraftMap((prev) => ({
      ...prev,
      [selectedSubscriptionId]: createDraftFromSubscription(selectedSubscription),
    }));
    setActionMessage("Đã hủy thay đổi tạm thời cho gói đang chọn");
  };

  const createSubscription = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const trimmedName = createDraft.name.trim();
    if (!trimmedName) {
      setActionMessage("Vui lòng nhập tên gói trước khi tạo mới");
      return;
    }

    setActionMessage(null);
    setIsCreatingSubscription(true);

    try {
      await createSubscriptionRequest({
        name: trimmedName,
        levelOrder: createDraft.levelOrder,
        maxWorkspaces: createDraft.maxWorkspaces,
        price: createDraft.price,
        durationInDays: createDraft.durationInDays,
        allowedModules: createDraft.allowedModules,
        isActive: createDraft.isActive ? 1 : 0,
      });

      setActionMessage("Tạo gói đăng ký mới thành công");
      setCreateDraft(createDefaultCreateDraft());
      setIsCreateModalOpen(false);
      await fetchManagementData();
    } catch {
      setActionMessage("Không thể tạo gói đăng ký mới");
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-8">
      <div className="flex items-center justify-end gap-4">
        {isAdmin ? (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            Tạo gói đăng ký mới
          </button>
        ) : null}
      </div>

      {subscriptionError ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {subscriptionError}
        </div>
      ) : isLoadingData ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Đang tải dữ liệu subscription...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Chưa có subscription nào trong hệ thống
        </div>
      ) : (
        <div className="space-y-8">
          {selectedDraft ? (
            <SubscriptionEditorSection
              selectedDraft={selectedDraft}
              currentUsers={selectedCurrentUsers?.userCount ?? 0}
              registrationCount={selectedUsage?.registrationCount ?? 0}
              uniqueUserCount={selectedUsage?.uniqueUserCount ?? 0}
              totalRevenue={selectedUsage?.totalRevenue ?? 0}
              moduleTitles={MODULE_TITLES}
              isTogglingStatus={isTogglingStatus}
              onToggleStatus={toggleSelectedSubscriptionStatus}
              onCancel={cancelSelectedSubscriptionChanges}
              onSave={saveSelectedSubscription}
              onNameChange={(value) => updateSelectedDraftField("name", value)}
              onPriceChange={(value) =>
                updateSelectedDraftField("price", value)
              }
              onDurationChange={(value) =>
                updateSelectedDraftField("durationInDays", value)
              }
              onMaxWorkspacesChange={(value) =>
                updateSelectedDraftField("maxWorkspaces", value)
              }
              onOpenAddModuleModal={() => openModuleModal("edit")}
              onRemoveModule={(moduleId) =>
                removeModuleFromDraft("edit", moduleId)
              }
              formatInteger={formatInteger}
              formatCurrency={formatCurrency}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Chọn một subscription trong danh sách để hiển thị &quot;Chi tiết
              gói&quot; và &quot;Cập nhật cấu hình gói&quot;.
            </div>
          )}

          <SubscriptionCardsGrid
            subscriptions={subscriptions}
            selectedSubscriptionId={selectedSubscriptionId}
            onSelectSubscription={setSelectedSubscriptionId}
            formatCurrency={formatCurrency}
            formatDuration={formatDuration}
          />
        </div>
      )}

      {/* {actionMessage ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {actionMessage}
        </p>
      ) : null} */}

      <CreateSubscriptionModal
        isOpen={isAdmin && isCreateModalOpen}
        draft={createDraft}
        moduleTitles={MODULE_TITLES}
        isCreatingSubscription={isCreatingSubscription}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createSubscription}
        onNameChange={(value) =>
          setCreateDraft((prev) => ({
            ...prev,
            name: value,
          }))
        }
        onPriceChange={(value) =>
          setCreateDraft((prev) => ({
            ...prev,
            price: value,
          }))
        }
        onLevelOrderChange={(value) =>
          setCreateDraft((prev) => ({
            ...prev,
            levelOrder: value,
          }))
        }
        onDurationChange={(value) =>
          setCreateDraft((prev) => ({
            ...prev,
            durationInDays: value,
          }))
        }
        onMaxWorkspacesChange={(value) =>
          setCreateDraft((prev) => ({
            ...prev,
            maxWorkspaces: value,
          }))
        }
        onToggleStatus={() =>
          setCreateDraft((prev) => ({
            ...prev,
            isActive: !prev.isActive,
          }))
        }
        onOpenAddModuleModal={() => openModuleModal("create")}
        onRemoveModule={(moduleId) => removeModuleFromDraft("create", moduleId)}
      />

      <AddModuleModal
        isOpen={isAddModuleModalOpen}
        modules={MODULE_LIBRARY}
        selectedModuleIds={modalSelectedModules}
        onApply={applyModuleSelection}
        onClose={() => setIsAddModuleModalOpen(false)}
      />
    </section>
  );
}
