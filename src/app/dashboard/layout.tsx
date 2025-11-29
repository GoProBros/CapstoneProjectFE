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
        // Module 1: Global Stock Chart - 65% chiều ngang
        { id: `global-stock-chart-${timestamp}`, type: 'global-stock-chart', title: 'Biểu đồ chứng khoán thế giới' },
        
        // Module 2: Financial Report - 35% chiều ngang, 70% chiều cao của global stock
        { id: `financial-report-${timestamp}`, type: 'financial-report', title: 'Báo cáo tài chính' },
        
        // Module 3: News - nằm dưới Financial Report
        { id: `news-${timestamp}`, type: 'news', title: 'Tin tức' },
        
        // Module 4-6: Canslim, TA Advisor, FA Advisor - nằm dưới Global Stock
        { id: `canslim-${timestamp}`, type: 'canslim', title: 'Canslim' },
        { id: `ta-advisor-${timestamp}`, type: 'ta-advisor', title: 'Tư trụ T A' },
        { id: `fa-advisor-${timestamp}`, type: 'fa-advisor', title: 'Tư trụ F A' },
        
        // Module 7: Stock Screener - nằm dưới cùng, chiếm toàn bộ chiều rộng
        { id: `stock-screener-${timestamp}`, type: 'stock-screener', title: 'Bộ lọc cổ phiếu' },
      ];

      // Tính toán:
      // - Global Stock: 65% của 96 cột = 62 cột, height: 25 hàng (500px)
      // - Financial Report: 35% của 96 cột = 34 cột, height: 70% của 25 = 18 hàng (360px)
      // - News: 35% của 96 cột = 34 cột, height: 18 hàng (360px)
      // - 3 modules dưới: mỗi module 62/3 ≈ 21 cột, height để căn mép dưới với News
      //   News bắt đầu từ y=18, cao 18 → mép dưới ở y=36
      //   Global Stock cao 25 → 3 modules bắt đầu từ y=25, cần cao 36-25=11 hàng
      // - Stock Screener: 96 cột (100% chiều ngang), height: 20 hàng (400px)
      //   Bắt đầu từ y=36 (dưới cùng của các modules trên)
      
      const defaultLayout: LayoutItem[] = [
        // Global Stock Chart: 65% chiều ngang
        { i: defaultModules[0].id, x: 0, y: 0, w: 62, h: 25 },
        
        // Financial Report: 35% chiều ngang, 70% chiều cao
        { i: defaultModules[1].id, x: 62, y: 0, w: 34, h: 18 },
        
        // News: nằm dưới Financial Report
        { i: defaultModules[2].id, x: 62, y: 18, w: 34, h: 18 },
        
        // 3 modules dưới Global Stock, dài đúng bằng mép dưới của News
        { i: defaultModules[3].id, x: 0, y: 25, w: 21, h: 11 },
        { i: defaultModules[4].id, x: 21, y: 25, w: 21, h: 11 },
        { i: defaultModules[5].id, x: 42, y: 25, w: 20, h: 11 },
        
        // Stock Screener: nằm dưới cùng, chiếm toàn bộ chiều rộng
        { i: defaultModules[6].id, x: 0, y: 36, w: 96, h: 20 },
      ];

      newPage.modules = defaultModules;
      newPage.layout = defaultLayout;
      
      console.log('Created page with modules:', defaultModules);
      console.log('Created page with layout:', defaultLayout);
    } else if (layoutType === 'Giao diện nâng cao') {
      console.log('Creating advanced layout modules...');
      
      const advancedModules: Module[] = [
        // 4 modules nhỏ bên trái chiếm 65% chiều ngang
        { id: `session-info-${timestamp}`, type: 'session-info', title: 'Thông tin phiên giao dịch' },
        { id: `order-matching-${timestamp}`, type: 'order-matching', title: 'Khớp lệnh' },
        { id: `canslim-${timestamp}`, type: 'canslim', title: 'Canslim' },
        { id: `fa-advisor-${timestamp}`, type: 'fa-advisor', title: 'Tư trụ F A' },
        
        // Financial Report bên phải chiếm 35%
        { id: `financial-report-${timestamp}`, type: 'financial-report', title: 'Báo cáo tài chính' },
        
        // Global Stock nằm dưới 4 modules nhỏ
        { id: `global-stock-chart-${timestamp}`, type: 'global-stock-chart', title: 'Biểu đồ chứng khoán thế giới' },
        
        // News nằm dưới Financial Report
        { id: `news-${timestamp}`, type: 'news', title: 'Tin tức' },
      ];

      // Tính toán:
      // Hàng 1:
      // - 4 modules nhỏ bên trái: 65% = 62 cột, mỗi module 15-16 cột, cao 8 hàng (160px)
      // - Financial Report bên phải: 35% = 34 cột, cao 19 hàng (380px)
      // Hàng 2:
      // - Global Stock bên trái: 65% = 62 cột, bắt đầu từ y=8
      // - News bên phải: 35% = 34 cột, bắt đầu từ y=19
      // Cả 2 phải có mép dưới bằng nhau:
      //   Global Stock: y=8, cần cao để mép dưới = mép dưới của News
      //   News: y=19, giả sử cao 15 hàng → mép dưới ở y=34
      //   Global Stock cần cao: 34-8=26 hàng (520px)
      
      const advancedLayout: LayoutItem[] = [
        // Hàng 1: 4 modules nhỏ bên trái
        { i: advancedModules[0].id, x: 0, y: 0, w: 16, h: 8 },
        { i: advancedModules[1].id, x: 16, y: 0, w: 15, h: 8 },
        { i: advancedModules[2].id, x: 31, y: 0, w: 16, h: 8 },
        { i: advancedModules[3].id, x: 47, y: 0, w: 15, h: 8 },
        
        // Hàng 1: Financial Report bên phải
        { i: advancedModules[4].id, x: 62, y: 0, w: 34, h: 19 },
        
        // Hàng 2: Global Stock bên trái (dưới 4 modules nhỏ)
        { i: advancedModules[5].id, x: 0, y: 8, w: 62, h: 26 },
        
        // Hàng 2: News bên phải (dưới Financial Report)
        { i: advancedModules[6].id, x: 62, y: 19, w: 34, h: 15 },
      ];

      newPage.modules = advancedModules;
      newPage.layout = advancedLayout;
      
      console.log('Created page with modules:', advancedModules);
      console.log('Created page with layout:', advancedLayout);
    } else if (layoutType === 'Giao diện đơn giản') {
      console.log('Creating simple layout modules...');
      
      const simpleModules: Module[] = [
        // Global Stock chiếm 100% chiều ngang
        { id: `global-stock-chart-${timestamp}`, type: 'global-stock-chart', title: 'Biểu đồ chứng khoán thế giới' },
        
        // 2 modules dưới chiếm 65% chiều ngang
        { id: `financial-report-${timestamp}`, type: 'financial-report', title: 'Báo cáo tài chính' },
        { id: `news-${timestamp}`, type: 'news', title: 'Tin tức' },
        
        // 3 modules bên phải chiếm 35% chiều ngang còn lại
        { id: `canslim-${timestamp}`, type: 'canslim', title: 'Canslim' },
        { id: `ta-advisor-${timestamp}`, type: 'ta-advisor', title: 'Tư trụ T A' },
        { id: `fa-advisor-${timestamp}`, type: 'fa-advisor', title: 'Tư trụ F A' },
      ];

      // Tính toán:
      // - Global Stock: 96 cột (100% chiều ngang), cao 20 hàng (400px)
      // - Financial Report + News: 65% = 62 cột, mỗi module 31 cột, cao 18 hàng (360px)
      // - 3 modules bên phải: 35% = 34 cột
      //   + Canslim: 40% chiều cao của 18 hàng = 7 hàng (140px), chiếm full 34 cột
      //   + TA Advisor + FA Advisor: 60% còn lại = 11 hàng, mỗi module 17 cột (chia đôi 34 cột)
      
      const simpleLayout: LayoutItem[] = [
        // Global Stock: 100% chiều ngang
        { i: simpleModules[0].id, x: 0, y: 0, w: 96, h: 20 },
        
        // Financial Report: 32.5% chiều ngang, nằm dưới Global Stock
        { i: simpleModules[1].id, x: 0, y: 20, w: 31, h: 18 },
        
        // News: 32.5% chiều ngang, nằm dưới Global Stock
        { i: simpleModules[2].id, x: 31, y: 20, w: 31, h: 18 },
        
        // Canslim: 35% chiều ngang, 40% chiều cao (phía trên)
        { i: simpleModules[3].id, x: 62, y: 20, w: 34, h: 7 },
        
        // TA Advisor: 17.5% chiều ngang, 60% chiều cao còn lại (phía dưới trái)
        { i: simpleModules[4].id, x: 62, y: 27, w: 17, h: 11 },
        
        // FA Advisor: 17.5% chiều ngang, 60% chiều cao còn lại (phía dưới phải)
        { i: simpleModules[5].id, x: 79, y: 27, w: 17, h: 11 },
      ];

      newPage.modules = simpleModules;
      newPage.layout = simpleLayout;
      
      console.log('Created page with modules:', simpleModules);
      console.log('Created page with layout:', simpleLayout);
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
