"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import ModuleSelectorModal from "@/components/dashboard/ModuleSelectorModal";
import AddPageModal from "@/components/dashboard/AddPageModal";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { DashboardContext, type Module, type LayoutItem } from "@/contexts/DashboardContext";

interface PageData {
  id: string;
  name: string;
  initial: string;
  modules: Module[];
  layout: LayoutItem[];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  
  // Initialize with default page using default layout
  const [pages, setPages] = useState<PageData[]>([
    {
      id: 'default',
      name: 'Giao diện mặc định',
      initial: 'D',
      modules: [
        { id: 'global-stock-chart-default', type: 'global-stock-chart', title: 'Biểu đồ chứng khoán thế giới' },
        { id: 'financial-report-default', type: 'financial-report', title: 'Báo cáo tài chính' },
        { id: 'news-default', type: 'news', title: 'Tin tức' },
        { id: 'canslim-default', type: 'canslim', title: 'Canslim' },
        { id: 'ta-advisor-default', type: 'ta-advisor', title: 'Tư trụ T A' },
        { id: 'fa-advisor-default', type: 'fa-advisor', title: 'Tư trụ F A' },
        { id: 'stock-screener-default', type: 'stock-screener', title: 'Bộ lọc cổ phiếu' },
      ],
      layout: [
        { i: 'global-stock-chart-default', x: 0, y: 0, w: 62, h: 25 },
        { i: 'financial-report-default', x: 62, y: 0, w: 34, h: 18 },
        { i: 'news-default', x: 62, y: 18, w: 34, h: 18 },
        { i: 'canslim-default', x: 0, y: 25, w: 21, h: 11 },
        { i: 'ta-advisor-default', x: 21, y: 25, w: 21, h: 11 },
        { i: 'fa-advisor-default', x: 42, y: 25, w: 20, h: 11 },
        { i: 'stock-screener-default', x: 0, y: 36, w: 96, h: 20 },
      ]
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
      const defaultModules: Module[] = [
        { id: `global-stock-chart-${timestamp}`, type: 'global-stock-chart', title: 'Biểu đồ chứng khoán thế giới' },
        { id: `financial-report-${timestamp}`, type: 'financial-report', title: 'Báo cáo tài chính' },
        { id: `news-${timestamp}`, type: 'news', title: 'Tin tức' },
        { id: `canslim-${timestamp}`, type: 'canslim', title: 'Canslim' },
        { id: `ta-advisor-${timestamp}`, type: 'ta-advisor', title: 'Tư trụ T A' },
        { id: `fa-advisor-${timestamp}`, type: 'fa-advisor', title: 'Tư trụ F A' },
        { id: `stock-screener-${timestamp}`, type: 'stock-screener', title: 'Bộ lọc cổ phiếu' },
      ];
      
      const defaultLayout: LayoutItem[] = [
        { i: defaultModules[0].id, x: 0, y: 0, w: 62, h: 25 },
        { i: defaultModules[1].id, x: 62, y: 0, w: 34, h: 18 },
        { i: defaultModules[2].id, x: 62, y: 18, w: 34, h: 18 },
        { i: defaultModules[3].id, x: 0, y: 25, w: 21, h: 11 },
        { i: defaultModules[4].id, x: 21, y: 25, w: 21, h: 11 },
        { i: defaultModules[5].id, x: 42, y: 25, w: 20, h: 11 },
        { i: defaultModules[6].id, x: 0, y: 36, w: 96, h: 20 },
      ];

      newPage.modules = defaultModules;
      newPage.layout = defaultLayout;
    } else if (layoutType === 'Giao diện nâng cao') {
      const advancedModules: Module[] = [
        { id: `session-info-${timestamp}`, type: 'session-info', title: 'Thông tin phiên giao dịch' },
        { id: `order-matching-${timestamp}`, type: 'order-matching', title: 'Khớp lệnh' },
        { id: `canslim-${timestamp}`, type: 'canslim', title: 'Canslim' },
        { id: `fa-advisor-${timestamp}`, type: 'fa-advisor', title: 'Tư trụ F A' },
        { id: `financial-report-${timestamp}`, type: 'financial-report', title: 'Báo cáo tài chính' },
        { id: `global-stock-chart-${timestamp}`, type: 'global-stock-chart', title: 'Biểu đồ chứng khoán thế giới' },
        { id: `news-${timestamp}`, type: 'news', title: 'Tin tức' },
      ];
      
      const advancedLayout: LayoutItem[] = [
        { i: advancedModules[0].id, x: 0, y: 0, w: 16, h: 8 },
        { i: advancedModules[1].id, x: 16, y: 0, w: 15, h: 8 },
        { i: advancedModules[2].id, x: 31, y: 0, w: 16, h: 8 },
        { i: advancedModules[3].id, x: 47, y: 0, w: 15, h: 8 },
        { i: advancedModules[4].id, x: 62, y: 0, w: 34, h: 19 },
        { i: advancedModules[5].id, x: 0, y: 8, w: 62, h: 26 },
        { i: advancedModules[6].id, x: 62, y: 19, w: 34, h: 15 },
      ];

      newPage.modules = advancedModules;
      newPage.layout = advancedLayout;
    } else if (layoutType === 'Giao diện đơn giản') {
      const simpleModules: Module[] = [
        { id: `global-stock-chart-${timestamp}`, type: 'global-stock-chart', title: 'Biểu đồ chứng khoán thế giới' },
        { id: `financial-report-${timestamp}`, type: 'financial-report', title: 'Báo cáo tài chính' },
        { id: `news-${timestamp}`, type: 'news', title: 'Tin tức' },
        { id: `canslim-${timestamp}`, type: 'canslim', title: 'Canslim' },
        { id: `ta-advisor-${timestamp}`, type: 'ta-advisor', title: 'Tư trụ T A' },
        { id: `fa-advisor-${timestamp}`, type: 'fa-advisor', title: 'Tư trụ F A' },
      ];
      
      const simpleLayout: LayoutItem[] = [
        { i: simpleModules[0].id, x: 0, y: 0, w: 96, h: 20 },
        { i: simpleModules[1].id, x: 0, y: 20, w: 31, h: 18 },
        { i: simpleModules[2].id, x: 31, y: 20, w: 31, h: 18 },
        { i: simpleModules[3].id, x: 62, y: 20, w: 34, h: 7 },
        { i: simpleModules[4].id, x: 62, y: 27, w: 17, h: 11 },
        { i: simpleModules[5].id, x: 79, y: 27, w: 17, h: 11 },
      ];

      newPage.modules = simpleModules;
      newPage.layout = simpleLayout;
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
    
    // Default sizes for different module types based on content
    let width = 48;  // Default: half width (48 columns = 50%)
    let height = 20;  // Default: 20 units (400px with rowHeight=20px)
    
    // Chart modules - larger, landscape orientation
    if (['overview-chart', 'vn-stock-chart', 'global-stock-chart'].includes(moduleType)) {
      width = 64;   // 64 columns = ~67% width
      height = 25;  // 25 units = 500px
    }
    
    // Financial reports - medium width, tall
    else if (['financial-report', 'financial-report-pro'].includes(moduleType)) {
      width = 48;   // 48 columns = 50% width
      height = 30;  // 30 units = 600px (tall for tables)
    }
    
    // News module - medium width, tall for scrolling
    else if (moduleType === 'news') {
      width = 40;   // 40 columns = ~42% width
      height = 30;  // 30 units = 600px
    }
    
    // Session Info & TA Advisor - compact square modules
    else if (['session-info', 'ta-advisor', 'fa-advisor'].includes(moduleType)) {
      width = 24;   // 24 columns = 25% width
      height = 20;  // 20 units = 400px (square-ish)
    }
    
    // Order Matching - compact, medium height
    else if (moduleType === 'order-matching') {
      width = 28;   // 28 columns = ~29% width
      height = 22;  // 22 units = 440px
    }
    
    // Canslim - compact square
    else if (moduleType === 'canslim') {
      width = 24;   // 24 columns = 25% width
      height = 18;  // 18 units = 360px
    }
    
    // Stock Screener - wide, tall for tables
    else if (moduleType === 'stock-screener') {
      width = 72;   // 72 columns = 75% width
      height = 30;  // 30 units = 600px
    }
    
    // Trading Map - large square
    else if (moduleType === 'trading-map') {
      width = 48;   // 48 columns = 50% width
      height = 24;  // 24 units = 480px (square)
    }
    
    // Analysis Report - medium width, tall
    else if (moduleType === 'analysis-report') {
      width = 48;   // 48 columns = 50% width
      height = 28;  // 28 units = 560px
    }
    
    const newLayoutItem: LayoutItem = {
      i: newModule.id,
      x: 0,
      y: yPosition,
      w: width,
      h: height,
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
      <FontSizeProvider>
        <DashboardContext.Provider value={{
          modules: currentPage?.modules || [],
          addModule,
          layout: currentPage?.layout || [],
          updateLayout,
          removeModule,
          currentPageId
        }}>
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
      </FontSizeProvider>
    </ThemeProvider>
  );
}
