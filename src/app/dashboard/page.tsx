"use client";

import { useDashboard } from "./layout";
import * as Modules from "@/components/dashboard/modules";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./dashboard.css";
import { X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const moduleComponents: Record<string, React.ComponentType> = {
  'overview-chart': Modules.OverviewChartModule,
  'vn-stock-chart': Modules.VNStockChartModule,
  'global-stock-chart': Modules.GlobalStockChartModule,
  'financial-report': Modules.FinancialReportModule,
  'financial-report-pro': Modules.FinancialReportProModule,
  'news': Modules.NewsModule,
  'session-info': Modules.SessionInfoModule,
  'order-matching': Modules.OrderMatchingModule,
  'fa-advisor': Modules.FAAdvisorModule,
  'ta-advisor': Modules.TAAdvisorModule,
  'canslim': Modules.CanslimModule,
  'stock-screener': Modules.StockScreenerModule,
  'trading-map': Modules.TradingMapModule,
  'analysis-report': Modules.AnalysisReportModule,
};

export default function DashboardPage() {
  const { modules, layout, updateLayout, removeModule } = useDashboard();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Subtract padding (24px on each side = 48px total) to match margin
        setContainerWidth(containerRef.current.offsetWidth - 48);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div className="p-6" ref={containerRef}>
      {modules.length === 0 ? (
        <div className="">
        </div>
      ) : (
        <GridLayout
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={100}
          width={containerWidth}
          onLayoutChange={updateLayout}
          draggableHandle=".drag-handle"
          isResizable={true}
          isDraggable={true}
          margin={[16, 16]}
        >
          {modules.map((module) => {
            const ModuleComponent = moduleComponents[module.type];
            return (
              <div key={module.id} className="bg-white dark:bg-cardBackground rounded-lg border border-gray-200 dark:border-borderDark overflow-hidden transition-colors duration-300">
                {/* Module Header with drag handle and close button */}
                <div className="drag-handle bg-white dark:bg-componentBackground px-4 py-2 flex items-center justify-between cursor-move border-b border-gray-200 dark:border-borderDark transition-colors duration-300">
                  <h3 className="text-gray-900 dark:text-white text-sm font-medium">{module.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      removeModule(module.id);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    className="group flex items-center gap-2 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                  >
                    <span className="hidden group-hover:inline-block text-xs font-medium">Remove</span>
                    <div className="w-6 h-6 rounded-full border-2 border-current group-hover:bg-red-500 group-hover:border-red-500 flex items-center justify-center transition-all">
                      <X className="w-3.5 h-3.5 group-hover:text-white" />
                    </div>
                  </button>
                </div>
                {/* Module Content */}
                <div className="h-[calc(100%-40px)] overflow-auto">
                  {ModuleComponent ? <ModuleComponent /> : <div>Unknown module type</div>}
                </div>
              </div>
            );
          })}
        </GridLayout>
      )}
    </div>
  );
}
