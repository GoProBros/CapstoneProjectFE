"use client";

import React, { useRef, useState } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { normalizeAllowedModulesWithPreview } from "@/features/profile/components/modulePreviewUtils";

interface ModuleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModuleCardProps {
  title: string;
  preview: React.ReactNode;
  onAdd: () => void;
  isLocked: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  preview,
  onAdd,
  isLocked,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: -dy * 8, y: dx * 8 });
  };

  const handleMouseEnter = () => setHovered(true);

  const handleMouseLeave = () => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      style={{ perspective: "800px" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        style={{
          transform: hovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04)`
            : "rotateX(0deg) rotateY(0deg) scale(1)",
          transition: hovered ? "transform 0.1s ease-out" : "transform 0.35s ease-out",
          boxShadow: hovered
            ? "0 0 0 1.5px #4ADE80, 0 0 24px 4px rgba(74,222,128,0.25), 0 0 48px 8px rgba(96,165,250,0.15)"
            : undefined,
        }}
        className="group relative bg-white dark:bg-cardBackground rounded-lg overflow-hidden border border-gray-200 dark:border-borderDark cursor-pointer"
      >
        <div className="p-3 border-b border-gray-200 dark:border-borderDark flex items-center justify-between bg-white dark:bg-componentBackground transition-colors duration-200">
          <h3 className="text-gray-900 dark:text-white text-sm font-medium">
            {title}
          </h3>
          <button
            onClick={onAdd}
            disabled={isLocked}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              isLocked
                ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-300"
                : "bg-buttonGreen hover:bg-buttonGreen/80 text-black"
            }`}
          >
            <span className="text-lg leading-none">+</span>
            <span>Thêm</span>
          </button>
        </div>
        <div className="aspect-[4/3] bg-white dark:bg-cardPreview flex items-center justify-center transition-colors duration-300 p-2">
          {preview}
        </div>

        {isLocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/50 px-4 text-white">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
              <path d="M8 11V8a4 4 0 1 1 8 0v3" />
            </svg>
            <p className="text-center text-xs font-medium leading-5">
              Vui lòng nâng cấp gói đăng ký để sử dụng module
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ModuleSelectorModal({
  isOpen,
  onClose,
}: ModuleSelectorModalProps) {
  const { addModule } = useDashboard();
  const { user } = useAuth();
  const mySubscription = useSubscriptionStore((s) => s.mySubscription);
  console.log("Modal render - isOpen:", isOpen);

  const normalizedRole = user?.role?.trim().toLowerCase() ?? "";
  const isAdminOrStaffRole =
    normalizedRole === "admin" ||
    normalizedRole === "administrator" ||
    normalizedRole === "staff" ||
    normalizedRole === "quản trị viên" ||
    normalizedRole === "nhân viên";

  const normalizedAllowedModules = React.useMemo(() => {
    const aliases: Record<string, string> = {
      financialReport: "financial-report",
      orderBook: "order-matching",
      screener: "stock-screener",
      analysisReport: "analysis-report",
      chart: "vn-stock-chart",
      watchList: "smart-board",
    };

    const moduleItems = normalizeAllowedModulesWithPreview(
      mySubscription?.allowedModules,
    );
    return new Set(
      moduleItems
        .map((item) => aliases[item.key] ?? item.key)
        .filter((item) => item.length > 0),
    );
  }, [mySubscription?.allowedModules]);

  const shouldRestrictBySubscription =
    mySubscription !== null && !isAdminOrStaffRole;

  const isModuleLocked = React.useCallback(
    (moduleId: string) =>
      shouldRestrictBySubscription && !normalizedAllowedModules.has(moduleId),
    [normalizedAllowedModules, shouldRestrictBySubscription],
  );

  if (!isOpen) return null;

  const modules = [
    {
      id: "index",
      title: "Chỉ số thị trường",
      preview: "/assets/Dashboard/ModulePreviews/market-index.png",
    },
    {
      id: "smart-board",
      title: "Bảng Điện Thông Minh",
      preview: "/assets/Dashboard/ModulePreviews/smart-stock-screener.png",
    },

    {
      id: "vn-stock-chart",
      title: "Biểu đồ chứng khoán việt nam",
      preview: "/assets/Dashboard/ModulePreviews/vn-stock-chart.png",
    },
    {
      id: "stock-screener",
      title: "Bảng điện chứng khoán",
      preview: "/assets/Dashboard/ModulePreviews/stock-screener.png",
    },
    {
      id: "heatmap",
      title: "Heatmap - Bản đồ nhiệt",
      preview: "/assets/Dashboard/ModulePreviews/heatmap.png",
    },
    {
      id: "ai-chat",
      title: "Trợ lý AI",
      preview: "/assets/Dashboard/ModulePreviews/AIAssistantModule.jpg",
    },
    {
      id: "session-info",
      title: "Thông tin phiên giao dịch",
      preview: "/assets/Dashboard/ModulePreviews/session-info.png",
    },
    {
      id: "order-matching",
      title: "Khớp lệnh",
      preview: "/assets/Dashboard/ModulePreviews/order-matching.png",
    },

    {
      id: "financial-report",
      title: "Báo cáo tài chính",
      preview: "/assets/Dashboard/ModulePreviews/financial-report.png",
    },
    {
      id: "news",
      title: "Tin tức",
      preview: "/assets/Dashboard/ModulePreviews/news.png",
    },
    {
      id: "global-stock-chart",
      title: "Biểu đồ chứng khoán thế giới",
      preview: "/assets/Dashboard/ModulePreviews/global-stock-chart.png",
    },
    {
      id: "financial-report-pro",
      title: "Báo cáo tài chính - Pro",
      preview: "/assets/Dashboard/ModulePreviews/financial-report-pro.png",
    },
    // {
    //   id: 'fa-advisor',
    //   title: 'Tư trụ F A',
    //   preview: '/assets/Dashboard/ModulePreviews/fa-advisor.png'
    // },
    // {
    //   id: 'ta-advisor',
    //   title: 'Tư trụ T A',
    //   preview: '/assets/Dashboard/ModulePreviews/ta-advisor.png'
    // },
    // {
    //   id: 'canslim',
    //   title: 'Canslim',
    //   preview: '/assets/Dashboard/ModulePreviews/canslim.png'
    // },
    {
      id: "analysis-report",
      title: "Báo cáo phân tích",
      preview: "/assets/Dashboard/ModulePreviews/analysis-report.png",
    },
  ];

  const handleAddModule = (moduleId: string, moduleTitle: string) => {
    if (isModuleLocked(moduleId)) {
      return;
    }

    addModule(moduleId, moduleTitle);
    // Keep modal open so user can add multiple modules
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#E0E3EB] dark:bg-modalBackground transition-colors duration-300">
      {/* Header */}
      <div className="h-16 border-b border-gray-300 dark:border-borderGray flex items-center justify-between px-6 bg-white dark:bg-modalBackground transition-colors duration-300">
        <div className="flex items-center gap-4">
          <h3 className="text-l font-semibold bg-gradient-to-r from-[#4ADE80] to-blue-400 bg-clip-text text-transparent">
            Modules
          </h3>
          {/* <button className="flex items-center gap-2 bg-white dark:bg-cardBackground border-2 border-buttonGreen text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-buttonGreen/10 dark:hover:bg-buttonGreen/10 transition-colors">
            <span>All Modules</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button> */}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Module Grid */}
      <div className="h-[calc(100vh-4rem)] overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 max-w-[1920px] mx-auto">
          {modules.map((module) => {
            const locked = isModuleLocked(module.id);

            return (
              <ModuleCard
                key={module.id}
                title={module.title}
                isLocked={locked}
                preview={
                  <img
                    src={module.preview}
                    alt={module.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback nếu ảnh không load được
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement!.innerHTML = `<div class="text-gray-500 text-sm p-4">${module.title}</div>`;
                    }}
                  />
                }
                onAdd={() => handleAddModule(module.id, module.title)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
