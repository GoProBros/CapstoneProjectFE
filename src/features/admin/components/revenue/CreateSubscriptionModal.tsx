import { Layers, Plus, Power, Users, X } from "lucide-react";
import type { CreateSubscriptionDraft } from "@/features/admin/components/revenue/subscriptionManagementModels";

interface CreateSubscriptionModalProps {
  isOpen: boolean;
  draft: CreateSubscriptionDraft;
  moduleTitles: Record<string, string>;
  isCreatingSubscription: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNameChange: (value: string) => void;
  onPriceChange: (value: number) => void;
  onLevelOrderChange: (value: number) => void;
  onDurationChange: (value: number) => void;
  onMaxWorkspacesChange: (value: number) => void;
  onToggleStatus: () => void;
  onOpenAddModuleModal: () => void;
  onRemoveModule: (moduleId: string) => void;
}

export default function CreateSubscriptionModal({
  isOpen,
  draft,
  moduleTitles,
  isCreatingSubscription,
  onClose,
  onSubmit,
  onNameChange,
  onPriceChange,
  onLevelOrderChange,
  onDurationChange,
  onMaxWorkspacesChange,
  onToggleStatus,
  onOpenAddModuleModal,
  onRemoveModule,
}: CreateSubscriptionModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-slate-950/70" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h5 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Tạo gói đăng ký mới
            </h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Chỉ tài khoản Admin mới có thể tạo gói mới.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Đóng popup"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Tên gói
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(event) => onNameChange(event.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 px-4 py-2.5 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Giá (VND)
              </label>
              <input
                type="number"
                min={0}
                value={draft.price}
                onChange={(event) => onPriceChange(Number(event.target.value) || 0)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 px-4 py-2.5 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Thứ tự cấp gói
              </label>
              <input
                type="number"
                min={0}
                value={draft.levelOrder}
                onChange={(event) =>
                  onLevelOrderChange(Number(event.target.value) || 0)
                }
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 px-4 py-2.5 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Thời hạn (ngày)
              </label>
              <input
                type="number"
                min={1}
                value={draft.durationInDays}
                onChange={(event) => onDurationChange(Number(event.target.value) || 1)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 px-4 py-2.5 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Workspace tối đa
              </label>
              <input
                type="number"
                min={1}
                value={draft.maxWorkspaces}
                onChange={(event) =>
                  onMaxWorkspacesChange(Number(event.target.value) || 1)
                }
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 px-4 py-2.5 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200 pr-2">
                Trạng thái khởi tạo
              </label>
              <button
                type="button"
                onClick={onToggleStatus}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${
                  draft.isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                <Power className="w-4 h-4" />
                {draft.isActive ? "Đang hoạt động" : "Tạm ngưng"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Allowed module
            </label>

            <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
              {draft.allowedModules.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chưa có module nào được thêm
                </p>
              ) : (
                draft.allowedModules.map((moduleId) => (
                  <span
                    key={moduleId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-md"
                  >
                    {moduleTitles[moduleId] ?? moduleId}
                    <button
                      type="button"
                      onClick={() => onRemoveModule(moduleId)}
                      className="hover:opacity-70"
                      aria-label={`Xóa module ${moduleId}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}

              <button
                type="button"
                onClick={onOpenAddModuleModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-md border border-dashed border-slate-400 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm module
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isCreatingSubscription}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 ${
                isCreatingSubscription ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <Plus className="w-4 h-4" />
              {isCreatingSubscription ? "Đang tạo..." : "Tạo gói đăng ký"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
