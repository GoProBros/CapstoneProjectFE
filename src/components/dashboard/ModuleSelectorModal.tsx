"use client";

import React from 'react';
import { useDashboard } from '@/app/dashboard/layout';

interface ModuleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModuleCardProps {
  title: string;
  preview: React.ReactNode;
  onAdd: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, preview, onAdd }) => {
  return (
    <div className="bg-white dark:bg-cardBackground rounded-lg overflow-hidden border border-gray-200 dark:border-borderDark hover:border-buttonGreen transition-all">
      <div className="p-3 border-b border-gray-200 dark:border-borderDark flex items-center justify-between bg-white dark:bg-componentBackground transition-colors duration-300">
        <h3 className="text-gray-900 dark:text-white text-sm font-medium">{title}</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 bg-buttonGreen hover:bg-buttonGreen/80 text-black px-3 py-1 rounded-full text-xs font-medium transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          <span>Thêm</span>
        </button>
      </div>
      <div className="aspect-[4/3] bg-white dark:bg-cardPreview flex items-center justify-center transition-colors duration-300 p-2">
        {preview}
      </div>
    </div>
  );
};

export default function ModuleSelectorModal({ isOpen, onClose }: ModuleSelectorModalProps) {
  const { addModule } = useDashboard();
  console.log('Modal render - isOpen:', isOpen);
  
  if (!isOpen) return null;

  const modules = [
    { 
      id: 'overview-chart', 
      title: 'Biểu đồ tổng quan',
      preview: '/assets/Dashboard/ModulePreviews/overview-chart.png'
    },
    { 
      id: 'vn-stock-chart', 
      title: 'Biểu đồ chứng khoán việt nam',
      preview: '/assets/Dashboard/ModulePreviews/vn-stock-chart.png'
    },
    { 
      id: 'global-stock-chart', 
      title: 'Biểu đồ chứng khoán thế giới',
      preview: '/assets/Dashboard/ModulePreviews/global-stock-chart.png'
    },
    { 
      id: 'financial-report', 
      title: 'Báo cáo tài chính',
      preview: '/assets/Dashboard/ModulePreviews/financial-report.png'
    },
    { 
      id: 'financial-report-pro', 
      title: 'Báo cáo tài chính - Pro',
      preview: '/assets/Dashboard/ModulePreviews/financial-report-pro.png'
    },
    { 
      id: 'news', 
      title: 'Tin tức',
      preview: '/assets/Dashboard/ModulePreviews/news.png'
    },
    { 
      id: 'session-info', 
      title: 'Thông tin phiên giao dịch',
      preview: '/assets/Dashboard/ModulePreviews/session-info.png'
    },
    { 
      id: 'order-matching', 
      title: 'Khớp lệnh',
      preview: '/assets/Dashboard/ModulePreviews/order-matching.png'
    },
    { 
      id: 'fa-advisor', 
      title: 'Tư trụ F A',
      preview: '/assets/Dashboard/ModulePreviews/fa-advisor.png'
    },
    { 
      id: 'ta-advisor', 
      title: 'Tư trụ T A',
      preview: '/assets/Dashboard/ModulePreviews/ta-advisor.png'
    },
    { 
      id: 'canslim', 
      title: 'Canslim',
      preview: '/assets/Dashboard/ModulePreviews/canslim.png'
    },
    { 
      id: 'stock-screener', 
      title: 'Bộ lọc cổ phiếu',
      preview: '/assets/Dashboard/ModulePreviews/stock-screener.png'
    },
    { 
      id: 'trading-map', 
      title: 'Trading Map',
      preview: '/assets/Dashboard/ModulePreviews/trading-map.png'
    },
    { 
      id: 'analysis-report', 
      title: 'Báo cáo phân tích',
      preview: '/assets/Dashboard/ModulePreviews/analysis-report.png'
    },
  ];

  const handleAddModule = (moduleId: string, moduleTitle: string) => {
    addModule(moduleId, moduleTitle);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#E0E3EB] dark:bg-modalBackground transition-colors duration-300">
      {/* Header */}
      <div className="h-16 border-b border-gray-300 dark:border-borderGray flex items-center justify-between px-6 bg-white dark:bg-modalBackground transition-colors duration-300">
        <div className="flex items-center gap-4">
          <h3 className="text-gray-900 dark:text-white text-l font-semibold">Modules</h3>
          <button className="flex items-center gap-2 bg-white dark:bg-cardBackground border-2 border-buttonGreen text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-buttonGreen/10 dark:hover:bg-buttonGreen/10 transition-colors">
            <span>All Modules</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Module Grid */}
      <div className="h-[calc(100vh-4rem)] overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 max-w-[1920px] mx-auto">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              title={module.title}
              preview={
                <img 
                  src={module.preview} 
                  alt={module.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback nếu ảnh không load được
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<div class="text-gray-500 text-sm p-4">${module.title}</div>`;
                  }}
                />
              }
              onAdd={() => handleAddModule(module.id, module.title)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
