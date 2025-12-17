"use client";

import { createContext, useContext } from "react";

export interface Module {
  id: string;
  type: string;
  title: string;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardContextType {
  modules: Module[];
  addModule: (moduleType: string, moduleTitle: string) => void;
  layout: LayoutItem[];
  updateLayout: (newLayout: LayoutItem[]) => void;
  removeModule: (moduleId: string) => void;
  currentPageId: string;
}

export const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardLayout');
  }
  return context;
};
