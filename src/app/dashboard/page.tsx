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
          cols={96}
          rowHeight={20}
          width={containerWidth}
          onLayoutChange={updateLayout}
          draggableHandle=".drag-handle"
          isResizable={true}
          isDraggable={true}
          margin={[16, 16]}
          compactType="vertical"
          preventCollision={false}
          resizeHandles={['se']}
          allowOverlap={false}
        >
          {modules.map((module) => {
            const ModuleComponent = moduleComponents[module.type];
            return (
              <div key={module.id} className="group/module relative bg-white dark:bg-cardBackground rounded-lg border border-gray-200 dark:border-borderDark overflow-hidden transition-colors duration-300">
                {/* Drag handle - invisible overlay */}
                <div className="drag-handle absolute inset-0 cursor-move z-0" />
                
                {/* Remove button - shows on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    removeModule(module.id);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  className="absolute top-2 right-2 z-20 opacity-0 group-hover/module:opacity-100 transition-opacity duration-200 flex items-center gap-2 text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  <span className="hidden group-hover:inline-block text-xs font-medium bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg">Remove</span>
                  <div className="w-7 h-7 rounded-full border-2 border-current hover:bg-red-500 hover:border-red-500 flex items-center justify-center transition-all bg-white dark:bg-gray-800 shadow-lg">
                    <X className="w-4 h-4 hover:text-white" />
                  </div>
                </button>

                {/* Module Content */}
                <div className="h-full overflow-auto relative z-10">
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
