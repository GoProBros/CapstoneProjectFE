"use client";

import { useState, createContext, useContext } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import ModuleSelectorModal from "@/components/dashboard/ModuleSelectorModal";
import AddPageModal from "@/components/dashboard/AddPageModal";
import { ThemeProvider } from "@/contexts/ThemeContext";

interface Module {
  id: string;
  type: string;
  title: string;
}

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DashboardContextType {
  modules: Module[];
  addModule: (moduleType: string, moduleTitle: string) => void;
  layout: LayoutItem[];
  updateLayout: (newLayout: LayoutItem[]) => void;
  removeModule: (moduleId: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardLayout');
  }
  return context;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [customPages, setCustomPages] = useState<Array<{ id: string; name: string; initial: string }>>([]);

  const handleOpenModal = () => {
    console.log('Opening modal...');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('Closing modal...');
    setIsModalOpen(false);
  };

  const handleOpenAddPageModal = () => {
    setIsAddPageModalOpen(true);
  };

  const handleCloseAddPageModal = () => {
    setIsAddPageModalOpen(false);
  };

  const handleAddPage = (pageName: string) => {
    const newPage = {
      id: `page-${Date.now()}`,
      name: pageName,
      initial: pageName.charAt(0).toUpperCase(),
    };
    setCustomPages([...customPages, newPage]);
    setNotification(`Đã tạo page "${pageName}" thành công!`);
    
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const addModule = (moduleType: string, moduleTitle: string) => {
    const newModule: Module = {
      id: `${moduleType}-${Date.now()}`,
      type: moduleType,
      title: moduleTitle,
    };
    
    // Calculate position for new module
    const yPosition = layout.length > 0 
      ? Math.max(...layout.map(item => item.y + item.h))
      : 0;
    
    const newLayoutItem: LayoutItem = {
      i: newModule.id,
      x: 0,
      y: yPosition,
      w: 12,
      h: 4,
    };
    
    setModules([...modules, newModule]);
    setLayout([...layout, newLayoutItem]);
    setNotification(`Đã thêm "${moduleTitle}" thành công!`);
    handleCloseModal();
    
    // Auto hide notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const updateLayout = (newLayout: LayoutItem[]) => {
    setLayout(newLayout);
  };

  const removeModule = (moduleId: string) => {
    setModules(modules.filter(m => m.id !== moduleId));
    setLayout(layout.filter(l => l.i !== moduleId));
  };

  console.log('Modal state:', isModalOpen);

  return (
    <ThemeProvider>
      <DashboardContext.Provider value={{ modules, addModule, layout, updateLayout, removeModule }}>
        <div className="flex h-screen bg-[#E0E3EB] dark:bg-pageBackground transition-colors duration-300">
          <Sidebar onAddModule={handleOpenModal} onAddPage={handleOpenAddPageModal} customPages={customPages} />
          <main className="flex-1 overflow-y-auto relative">
            {children}
            
            {/* Success Notification */}
            {notification && (
              <div className="fixed top-4 right-4 z-[10000] animate-in slide-in-from-top">
                <div className="bg-buttonGreen text-black px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">{notification}</span>
                </div>
              </div>
            )}
          </main>
          <ModuleSelectorModal 
            isOpen={isModalOpen} 
            onClose={handleCloseModal}
          />
          <AddPageModal
            isOpen={isAddPageModalOpen}
            onClose={handleCloseAddPageModal}
            onSave={handleAddPage}
          />
        </div>
      </DashboardContext.Provider>
    </ThemeProvider>
  );
}
