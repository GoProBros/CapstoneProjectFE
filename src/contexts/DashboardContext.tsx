import { createContext, useContext } from 'react';

interface Module {
  id: string;
  type: string;
  title: string;
  layoutId?: number; // Optional: Layout ID for modules with configurable layouts
}

interface LayoutItem {
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
  updateModuleLayoutId: (moduleId: string, layoutId: number | null) => void; // Update layoutId for a specific module
  getModuleById: (moduleId: string) => Module | undefined; // Get module data by ID
}

export const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardLayout');
  }
  return context;
};
