import { Layers, Plus, Power, X } from "lucide-react";
import type { SubscriptionDraft } from "@/features/admin/components/revenue/subscriptionManagementModels";

interface SubscriptionEditorSectionProps {
  selectedDraft: SubscriptionDraft;
  currentUsers: number;
  registrationCount: number;
  uniqueUserCount: number;
  totalRevenue: number;
  moduleTitles: Record<string, string>;
  isTogglingStatus: boolean;
  onToggleStatus: () => void;
  onCancel: () => void;
  onSave: () => void;
  onNameChange: (value: string) => void;
  onPriceChange: (value: number) => void;
  onDurationChange: (value: number) => void;
  onMaxWorkspacesChange: (value: number) => void;
  onOpenAddModuleModal: () => void;
  onRemoveModule: (moduleId: string) => void;
  formatInteger: (value: number) => string;
  formatCurrency: (value: number) => string;
}

export default function SubscriptionEditorSection({
  selectedDraft,
  currentUsers,
  registrationCount,
  uniqueUserCount,
  totalRevenue,
  moduleTitles,
  isTogglingStatus,
  onToggleStatus,
  onCancel,
  onSave,
  onNameChange,
  onPriceChange,
  onDurationChange,
  onMaxWorkspacesChange,
  onOpenAddModuleModal,
  onRemoveModule,
  formatInteger,
  formatCurrency,
}: SubscriptionEditorSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-slate-200/70 dark:border-slate-700 space-y-4">
        <h5 className="font-bold font-headline text-slate-900 dark:text-slate-100">
          Chi tiết gói: <span className="underline">{selectedDraft.name}</span>
        </h5>

        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Người dùng hiện tại
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100">
              {formatInteger(currentUsers)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Lượt đăng ký
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100">
              {formatInteger(registrationCount)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Người dùng duy nhất
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100">
              {formatInteger(uniqueUserCount)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Tổng doanh thu
            </p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200/70 dark:border-slate-700 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h5 className="text-xl font-bold font-headline text-slate-900 dark:text-slate-100">
            Cập nhật cấu hình gói
          </h5>

          <button
            type="button"
            onClick={onToggleStatus}
            disabled={isTogglingStatus}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              selectedDraft.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
            } ${isTogglingStatus ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <Power className="w-4 h-4" />
            {selectedDraft.isActive ? "Đang hoạt động" : "Đang tạm ngưng"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Tên gói đăng ký
            </label>
            <input
              type="text"
              value={selectedDraft.name}
              onChange={(event) => onNameChange(event.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Giá niêm yết (VND)
            </label>
            <input
              type="number"
              min={0}
              value={selectedDraft.price}
              onChange={(event) => onPriceChange(Number(event.target.value) || 0)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Thời hạn sử dụng (ngày)
            </label>
            <input
              type="number"
              min={1}
              value={selectedDraft.durationInDays}
              onChange={(event) => onDurationChange(Number(event.target.value) || 1)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Số workspace tối đa
            </label>
            <input
              type="number"
              min={1}
              value={selectedDraft.maxWorkspaces}
              onChange={(event) => onMaxWorkspacesChange(Number(event.target.value) || 1)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Allowed module
          </label>

          <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900">
            {selectedDraft.allowedModules.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chưa có module nào được thêm
              </p>
            ) : (
              selectedDraft.allowedModules.map((moduleId) => (
                <span
                  key={moduleId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-400 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-md"
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
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold"
          >
            Hủy thay đổi
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-6 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
