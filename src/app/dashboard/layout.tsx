"use client";

import { useState, createContext, useContext, useEffect } from "react";
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

interface PageData {
  id: string;
  name: string;
  initial: string;
  modules: Module[];
  layout: LayoutItem[];
}

interface DashboardContextType {
  modules: Module[];
  addModule: (moduleType: string, moduleTitle: string) => void;
  layout: LayoutItem[];
  updateLayout: (newLayout: LayoutItem[]) => void;
  removeModule: (moduleId: string) => void;
  currentPageId: string;
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
  const [notification, setNotification] = useState<string | null>(null);
  
  // Initialize with default page
  const [pages, setPages] = useState<PageData[]>([
    {
      id: 'default',
      name: 'Giao diện mặc định',
      initial: 'D',
      modules: [],
      layout: []
    }
  ]);
  const [currentPageId, setCurrentPageId] = useState('default');

  // Load pages from localStorage on mount
  useEffect(() => {
    const savedPages = localStorage.getItem('dashboard-pages');
    const savedCurrentPageId = localStorage.getItem('dashboard-current-page');
    
    if (savedPages) {
      try {
        const parsedPages = JSON.parse(savedPages);
        setPages(parsedPages);
      } catch (error) {
        console.error('Error loading pages from localStorage:', error);
      }
    }
    
    if (savedCurrentPageId) {
      setCurrentPageId(savedCurrentPageId);
    }
  }, []);

  // Save pages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dashboard-pages', JSON.stringify(pages));
  }, [pages]);

  // Save current page ID to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-current-page', currentPageId);
  }, [currentPageId]);

  // Get current page data
  const currentPage = pages.find(p => p.id === currentPageId) || pages[0];
  const modules = currentPage.modules;
  const layout = currentPage.layout;

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

  const handleAddPage = (pageName: string, layoutType: string) => {
    console.log('handleAddPage called with:', { pageName, layoutType });
    
    const timestamp = Date.now();
    const newPage: PageData = {
      id: `page-${timestamp}`,
      name: pageName,
      initial: pageName.charAt(0).toUpperCase(),
      modules: [],
      layout: []
    };

    // If "Giao diện mặc định" is selected, pre-populate with default modules
    console.log('Checking layout type:', layoutType, 'equals "Giao diện mặc định":', layoutType === 'Giao diện mặc định');
    
    if (layoutType === 'Giao diện mặc định') {
      console.log('Creating default layout modules...');
      
      const defaultModules: Module[] = [
        // Row 1: Large module on left, small on right
        { id: `chart-main-${timestamp}`, type: 'chart', title: 'Biểu đồ chính' },
        { id: `market-watch-${timestamp}`, type: 'watchlist', title: 'Theo dõi thị trường' },
        
        // Row 2: 3 equal modules
        { id: `technical-${timestamp}`, type: 'analysis', title: 'Phân tích kỹ thuật' },
        { id: `fundamental-${timestamp}`, type: 'analysis', title: 'Phân tích cơ bản' },
        { id: `news-${timestamp}`, type: 'news', title: 'Tin tức' },
        
        // Row 3: 3 equal modules
        { id: `filter-${timestamp}`, type: 'filter', title: 'Bộ lọc cổ phiếu' },
        { id: `watchlist-${timestamp}`, type: 'watchlist', title: 'Danh sách theo dõi' },
        { id: `orders-${timestamp}`, type: 'orders', title: 'Lệnh giao dịch' },
      ];

      const defaultLayout: LayoutItem[] = [
        // Row 1: Large chart (8 cols) + Market watch (4 cols)
        { i: defaultModules[0].id, x: 0, y: 0, w: 8, h: 4 },
        { i: defaultModules[1].id, x: 8, y: 0, w: 4, h: 4 },
        
        // Row 2: 3 equal modules (4 cols each)
        { i: defaultModules[2].id, x: 0, y: 4, w: 4, h: 3 },
        { i: defaultModules[3].id, x: 4, y: 4, w: 4, h: 3 },
        { i: defaultModules[4].id, x: 8, y: 4, w: 4, h: 3 },
        
        // Row 3: 3 equal modules (4 cols each)
        { i: defaultModules[5].id, x: 0, y: 7, w: 4, h: 3 },
        { i: defaultModules[6].id, x: 4, y: 7, w: 4, h: 3 },
        { i: defaultModules[7].id, x: 8, y: 7, w: 4, h: 3 },
      ];

      newPage.modules = defaultModules;
      newPage.layout = defaultLayout;
      
      console.log('Created page with modules:', defaultModules);
      console.log('Created page with layout:', defaultLayout);
    } else if (layoutType === 'Giao diện nâng cao') {
      console.log('Creating advanced layout modules...');
      
      const advancedModules: Module[] = [
        // Row 1: 3 equal modules
        { id: `watchlist-1-${timestamp}`, type: 'watchlist', title: 'Danh sách theo dõi 1' },
        { id: `watchlist-2-${timestamp}`, type: 'watchlist', title: 'Danh sách theo dõi 2' },
        { id: `watchlist-3-${timestamp}`, type: 'watchlist', title: 'Danh sách theo dõi 3' },
        
        // Row 2: 1 large module
        { id: `chart-main-${timestamp}`, type: 'chart', title: 'Biểu đồ chính' },
        
        // Row 3: 3 equal modules
        { id: `orders-${timestamp}`, type: 'orders', title: 'Lệnh giao dịch' },
        { id: `portfolio-${timestamp}`, type: 'portfolio', title: 'Danh mục' },
        { id: `news-${timestamp}`, type: 'news', title: 'Tin tức' },
      ];

      const advancedLayout: LayoutItem[] = [
        // Row 1: 3 equal modules (4 cols each)
        { i: advancedModules[0].id, x: 0, y: 0, w: 4, h: 2 },
        { i: advancedModules[1].id, x: 4, y: 0, w: 4, h: 2 },
        { i: advancedModules[2].id, x: 8, y: 0, w: 4, h: 2 },
        
        // Row 2: Full width chart (12 cols)
        { i: advancedModules[3].id, x: 0, y: 2, w: 12, h: 5 },
        
        // Row 3: 3 equal modules (4 cols each)
        { i: advancedModules[4].id, x: 0, y: 7, w: 4, h: 2 },
        { i: advancedModules[5].id, x: 4, y: 7, w: 4, h: 2 },
        { i: advancedModules[6].id, x: 8, y: 7, w: 4, h: 2 },
      ];

      newPage.modules = advancedModules;
      newPage.layout = advancedLayout;
      
      console.log('Created page with modules:', advancedModules);
      console.log('Created page with layout:', advancedLayout);
    } else {
      console.log('Not default layout, creating empty page');
    }

    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    setCurrentPageId(newPage.id); // Auto switch to new page
    
    console.log('Total pages after add:', updatedPages.length);
    console.log('New page:', newPage);
    
    setNotification(`Đã tạo page "${pageName}" thành công!`);
    
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSwitchPage = (pageId: string) => {
    setCurrentPageId(pageId);
    setNotification(`Đã chuyển sang "${pages.find(p => p.id === pageId)?.name}"`);
    
    setTimeout(() => {
      setNotification(null);
    }, 2000);
  };

  const handleDeletePage = (pageId: string) => {
    // Prevent deleting default page
    if (pageId === 'default') {
      setNotification('Không thể xóa trang mặc định!');
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      return;
    }

    const pageToDelete = pages.find(p => p.id === pageId);
    setPages(pages.filter(p => p.id !== pageId));
    
    // If current page is deleted, switch to default
    if (currentPageId === pageId) {
      setCurrentPageId('default');
    }
    
    setNotification(`Đã xóa page "${pageToDelete?.name}" thành công!`);
    
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
    
    // Update current page's modules and layout
    setPages(pages.map(page => {
      if (page.id === currentPageId) {
        return {
          ...page,
          modules: [...page.modules, newModule],
          layout: [...page.layout, newLayoutItem]
        };
      }
      return page;
    }));
    
    setNotification(`Đã thêm "${moduleTitle}" thành công!`);
    handleCloseModal();
    
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const updateLayout = (newLayout: LayoutItem[]) => {
    setPages(pages.map(page => {
      if (page.id === currentPageId) {
        return {
          ...page,
          layout: newLayout
        };
      }
      return page;
    }));
  };

  const removeModule = (moduleId: string) => {
    setPages(pages.map(page => {
      if (page.id === currentPageId) {
        return {
          ...page,
          modules: page.modules.filter(m => m.id !== moduleId),
          layout: page.layout.filter(l => l.i !== moduleId)
        };
      }
      return page;
    }));
  };

  console.log('Modal state:', isModalOpen);

  return (
    <ThemeProvider>
      <DashboardContext.Provider value={{ modules, addModule, layout, updateLayout, removeModule, currentPageId }}>
        <div className="flex h-screen bg-[#E0E3EB] dark:bg-pageBackground transition-colors duration-300">
          <Sidebar 
            onAddModule={handleOpenModal} 
            onAddPage={handleOpenAddPageModal} 
            pages={pages}
            currentPageId={currentPageId}
            onSwitchPage={handleSwitchPage}
            onDeletePage={handleDeletePage}
          />
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
