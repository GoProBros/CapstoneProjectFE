"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Check, X } from "lucide-react";

export interface ModuleLibraryItem {
  id: string;
  title: string;
  preview: string;
}

interface AddModuleModalProps {
  isOpen: boolean;
  modules: ModuleLibraryItem[];
  selectedModuleIds: string[];
  onClose: () => void;
  onApply: (selectedIds: string[]) => void;
}

export default function AddModuleModal({
  isOpen,
  modules,
  selectedModuleIds,
  onClose,
  onApply,
}: AddModuleModalProps) {
  const [draftSelectedIds, setDraftSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDraftSelectedIds(selectedModuleIds);
    }
  }, [isOpen, selectedModuleIds]);

  const selectedIdSet = useMemo(
    () => new Set(draftSelectedIds),
    [draftSelectedIds]
  );

  if (!isOpen) {
    return null;
  }

  const toggleModuleSelection = (moduleId: string) => {
    setDraftSelectedIds((prev) => {
      if (prev.includes(moduleId)) {
        return prev.filter((item) => item !== moduleId);
      }

      return [...prev, moduleId];
    });
  };

  const handleApply = () => {
    onApply(draftSelectedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-slate-950/70" onClick={onClose} />

      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Thêm module
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Chọn nhiều module rồi nhấn cập nhật để áp dụng vào danh sách module
              được phép.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Đóng popup"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-136px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {modules.map((module) => {
              const isSelected = selectedIdSet.has(module.id);

              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => toggleModuleSelection(module.id)}
                  className={`relative text-left rounded-xl overflow-hidden border transition-all ${
                    isSelected
                      ? "border-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900/50"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                  }`}
                >
                  <span
                    className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      isSelected
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3" /> : null}
                    {isSelected ? "Đã chọn" : "Chưa chọn"}
                  </span>

                  <div className="h-36 w-full relative bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={module.preview}
                      alt={module.title}
                      fill
                      className="object-contain p-3"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  <div className="px-4 py-3 bg-white dark:bg-slate-900">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {module.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Đã chọn {draftSelectedIds.length} module
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold"
            >
              Cập nhật danh sách module
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
