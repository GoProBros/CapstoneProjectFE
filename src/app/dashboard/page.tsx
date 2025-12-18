"use client";

import { useDashboard } from "@/contexts/DashboardContext";
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
  const [cols, setCols] = useState(96);
  const [rowHeight, setRowHeight] = useState(20);
  const [margin, setMargin] = useState<[number, number]>([16, 16]);
  const [padding, setPadding] = useState(24);

  useEffect(() => {
    const updateResponsive = () => {
      if (containerRef.current) {
        const width = window.innerWidth;
        
        // Breakpoints
        if (width < 640) {
          // Mobile: sm
          setCols(12);
          setRowHeight(15);
          setMargin([8, 8]);
          setPadding(16);
        } else if (width < 768) {
          // Small tablet: md
          setCols(24);
          setRowHeight(18);
          setMargin([12, 12]);
          setPadding(20);
        } else if (width < 1024) {
          // Tablet: lg
          setCols(48);
          setRowHeight(20);
          setMargin([14, 14]);
          setPadding(20);
        } else if (width < 1280) {
          // Small desktop: xl
          setCols(72);
          setRowHeight(20);
          setMargin([16, 16]);
          setPadding(24);
        } else {
          // Large desktop: 2xl
          setCols(96);
          setRowHeight(20);
          setMargin([16, 16]);
          setPadding(24);
        }
        
        // Update container width
        const paddingTotal = padding * 2;
        setContainerWidth(containerRef.current.offsetWidth - paddingTotal);
      }
    };

    updateResponsive();
    window.addEventListener('resize', updateResponsive);
    return () => window.removeEventListener('resize', updateResponsive);
  }, [padding]);

  return (
    <div className="p-4 sm:p-5 md:p-6" ref={containerRef}>
      {modules.length === 0 ? (
        <div className="">
        </div>
      ) : (
        <GridLayout
          className="layout"
          layout={layout}
          cols={cols}
          rowHeight={rowHeight}
          width={containerWidth}
          onLayoutChange={updateLayout}
          draggableHandle=".drag-handle"
          isResizable={true}
          isDraggable={true}
          margin={margin}
          compactType="vertical"
          preventCollision={false}
          resizeHandles={['se']}
          allowOverlap={false}
        >
          {modules.map((module) => {
            const ModuleComponent = moduleComponents[module.type];
            return (
              <div key={module.id} className="group/module relative bg-white dark:bg-cardBackground rounded-lg border border-gray-200 dark:border-borderDark overflow-hidden transition-colors duration-300 flex flex-col">
                {/* Drag handle bar - top invisible bar for dragging */}
                <div className="drag-handle absolute top-0 left-0 right-0 h-8 cursor-move z-10 pointer-events-auto" />
                
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
                  className="absolute top-2 right-2 z-20 opacity-0 group-hover/module:opacity-100 transition-opacity duration-200 flex items-center gap-2 text-gray-400 hover:text-red-500 cursor-pointer pointer-events-auto"
                >
                  <span className="hidden group-hover:inline-block text-xs font-medium bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg">Remove</span>
                  <div className="w-7 h-7 rounded-full border-2 border-current hover:bg-red-500 hover:border-red-500 flex items-center justify-center transition-all bg-white dark:bg-gray-800 shadow-lg">
                    <X className="w-4 h-4 hover:text-white" />
                  </div>
                </button>

                {/* Module Content - scrollable */}
                <div className="flex-1 overflow-auto relative z-0 pointer-events-auto">
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
