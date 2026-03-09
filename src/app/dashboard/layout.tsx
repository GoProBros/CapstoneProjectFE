"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import ModuleSelectorModal from "@/components/dashboard/ModuleSelectorModal";
import AddPageModal from "@/components/dashboard/AddPageModal";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { DashboardContext } from "@/contexts/DashboardContext";
import { SignalRProvider } from "@/contexts/SignalRContext";
import { useAuth } from "@/contexts/AuthContext";
import * as workspaceService from "@/services/workspaceService";
import { useSubscriptionStore } from "@/stores/subscriptionStore";

interface Module {
  id: string;
  type: string;
  title: string;
  layoutId?: number; // Optional: Layout ID for modules with configurable layouts (StockScreener, FinancialReportPro, Heatmap)
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
  workspaceId?: number; // API workspace ID
}

/** Max height units allowed per module type to prevent viewport overflow on standard screens */
const MODULE_MAX_HEIGHT: Record<string, number> = {
  heatmap: 22,
};

/**
 * Normalize layout items — caps heights that exceed per-module limits.
 * Applied when loading from localStorage or API to migrate old saved values.
 */
function normalizeLayout(
  modules: Module[],
  layout: LayoutItem[]
): LayoutItem[] {
  return layout.map((item) => {
    const mod = modules.find((m) => m.id === item.i);
    if (!mod) return item;
    const maxH = MODULE_MAX_HEIGHT[mod.type];
    if (maxH !== undefined && item.h > maxH) {
      return { ...item, h: maxH };
    }
    return item;
  });
}

// Default page configuration
const DEFAULT_PAGE: PageData = {
  id: "default",
  name: "Giao diện mặc định",
  initial: "D",
  modules: [
    {
      id: "global-stock-chart-default",
      type: "global-stock-chart",
      title: "Biểu đồ chứng khoán thế giới",
    },
    {
      id: "financial-report-default",
      type: "financial-report",
      title: "Báo cáo tài chính",
    },
    { id: "news-default", type: "news", title: "Tin tức" },
    { id: "canslim-default", type: "canslim", title: "Canslim" },
    { id: "ta-advisor-default", type: "ta-advisor", title: "Tư trụ T A" },
    { id: "fa-advisor-default", type: "fa-advisor", title: "Tư trụ F A" },
    {
      id: "stock-screener-default",
      type: "stock-screener",
      title: "Bộ lọc cổ phiếu",
    },
  ],
  layout: [
    { i: "global-stock-chart-default", x: 0, y: 0, w: 62, h: 25 },
    { i: "financial-report-default", x: 62, y: 0, w: 34, h: 18 },
    { i: "news-default", x: 62, y: 18, w: 34, h: 18 },
    { i: "canslim-default", x: 0, y: 25, w: 21, h: 11 },
    { i: "ta-advisor-default", x: 21, y: 25, w: 21, h: 11 },
    { i: "fa-advisor-default", x: 42, y: 25, w: 20, h: 11 },
    { i: "stock-screener-default", x: 0, y: 36, w: 96, h: 20 },
  ],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const maxWorkspaces = useSubscriptionStore((s) => s.maxWorkspaces);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Guard: redirect to login when auth check completes and user is not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      sessionStorage.setItem('auth_redirect_message', 'Vui lòng đăng nhập / đăng ký để sử dụng');
      router.replace('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);
  const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPageId, setCurrentPageId] = useState("default");
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false); // Prevent sync during initial load

  /**
   * Convert PageData to backend layoutJson format
   * Backend expects: { modules: [{ i, x, y, w, h, type, title, activeLayoutId }] }
   */
  const convertToBackendFormat = (page: PageData): Record<string, any> => {
    const modules = page.modules.map((module) => {
      const layoutItem = page.layout.find((l) => l.i === module.id);
      return {
        i: module.id,
        type: module.type,
        title: module.title,
        x: layoutItem?.x || 0,
        y: layoutItem?.y || 0,
        w: layoutItem?.w || 48,
        h: layoutItem?.h || 20,
        ...(module.layoutId && { activeLayoutId: module.layoutId }),
      };
    });
    
    return { modules };
  };

  /**
   * Sync workspace to API
   * Only syncs if user is authenticated and workspace has an ID
   */
  const syncWorkspaceToAPI = useCallback(async (page: PageData, debounceMs: number = 0) => {
    // Skip sync if currently loading workspaces
    if (isLoadingRef.current) {
      console.log('[Dashboard] Skip sync - currently loading workspaces');
      return;
    }
    
    // Never sync DEFAULT_PAGE
    if (page.id === 'default' && !page.workspaceId) {
      console.log('[Dashboard] Skip sync - DEFAULT_PAGE without workspaceId');
      return;
    }
    
    // Only sync if authenticated and workspace has an ID
    if (!isAuthenticated || !page.workspaceId) {
      console.log('[Dashboard] Skip sync - not authenticated or no workspaceId');
      return;
    }

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce the API call
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const layoutJson = convertToBackendFormat(page);
        
        console.log('[Dashboard] Syncing workspace to API...', {
          workspaceId: page.workspaceId,
          workspaceName: page.name,
          isLoading: isLoadingRef.current
        });
        
        await workspaceService.updateWorkspace(page.workspaceId!, {
          workspaceId: page.workspaceId!.toString(),
          workspaceName: page.name,
          layoutJson,
          isDefault: page.id === 'default',
        });
        
        console.log('[Dashboard] Workspace synced to API successfully:', page.workspaceId);
        
        // Note: localStorage is automatically updated via useEffect on pages change
      } catch (error) {
        console.error('[Dashboard] Error syncing workspace to API:', error);
        setNotification('Lỗi khi lưu workspace lên server');
        setTimeout(() => setNotification(null), 3000);
      }
    }, debounceMs);
  }, [isAuthenticated]);

  // Load workspaces from localStorage first, then sync with API if authenticated
  useEffect(() => {
    const loadWorkspaces = async () => {
      setIsLoadingWorkspaces(true);
      isLoadingRef.current = true; // Prevent sync during load
      
      try {
        // Always load from localStorage first (fast UI)
        const savedPages = localStorage.getItem("dashboard-pages");
        const savedCurrentPageId = localStorage.getItem("dashboard-current-page");
        
        if (savedPages) {
          try {
            const parsedPages: PageData[] = JSON.parse(savedPages);
            // Migrate: cap module heights that exceed defined maximums
            const migratedPages = parsedPages.map((page) => ({
              ...page,
              layout: normalizeLayout(page.modules, page.layout),
            }));
            setPages(migratedPages);
            console.log('[Dashboard] Loaded workspaces from localStorage:', migratedPages.length);
          } catch (error) {
            console.error('[Dashboard] Error parsing localStorage:', error);
            setPages([]);
          }
        } else {
          setPages([]);
        }
        
        if (savedCurrentPageId) {
          setCurrentPageId(savedCurrentPageId);
        }
        
        // If authenticated, sync with API in background
        if (isAuthenticated) {
          console.log('[Dashboard] Syncing workspaces with API...');
          const response = await workspaceService.getMyWorkspaces();
          
          if (response.isSuccess && response.data) {
            const apiWorkspaces: PageData[] = response.data.map((ws) => {
              try {
                const layoutData = ws.layoutJson;
                
                // Backend structure: modules array contains both layout and module info
                const modules: Module[] = [];
                const layout: LayoutItem[] = [];
                
                if (layoutData.modules && Array.isArray(layoutData.modules)) {
                  layoutData.modules.forEach((item: any) => {
                    modules.push({
                      id: item.i,
                      type: item.type,
                      title: item.title,
                      layoutId: item.activeLayoutId,
                    });
                    
                    layout.push({
                      i: item.i,
                      x: item.x,
                      y: item.y,
                      w: item.w,
                      h: item.h,
                    });
                  });
                }
                
                return {
                  id: ws.isDefault ? 'default' : `workspace-${ws.id}`,
                  name: ws.workspaceName,
                  initial: ws.workspaceName.charAt(0).toUpperCase(),
                  modules,
                  layout: normalizeLayout(modules, layout),
                  workspaceId: ws.id,
                };
              } catch (parseError) {
                console.error('[Dashboard] Error parsing workspace layoutJson:', parseError);
                return {
                  id: ws.isDefault ? 'default' : `workspace-${ws.id}`,
                  name: ws.workspaceName,
                  initial: ws.workspaceName.charAt(0).toUpperCase(),
                  modules: [],
                  layout: [],
                  workspaceId: ws.id,
                };
              }
            });
            
            // Use exactly what the server returns — do not inject a local
            // fallback workspace. If the user has 0 workspaces, show empty.
            if (apiWorkspaces.length === 0) {
              setPages([]);
              localStorage.removeItem('dashboard-pages');
              localStorage.removeItem('dashboard-current-page');
              return;
            }
            
            // Merge API workspaces with any locally-created pages that were added
            // while this GET request was in-flight (race condition: user created a
            // workspace before getMyWorkspaces returned).
            const mergedPages = (prev: PageData[]): PageData[] => {
              const apiIds = new Set(apiWorkspaces.map((w) => w.id));
              // Keep locally-added pages that have a real workspaceId (created via API)
              // but aren't in this GET response yet.
              const recentLocal = prev.filter((p) => p.workspaceId && !apiIds.has(p.id));
              const merged = [...apiWorkspaces, ...recentLocal];
              localStorage.setItem('dashboard-pages', JSON.stringify(merged));
              return merged;
            };

            // After API sync, keep currentPageId if it's in the merged list,
            // otherwise switch to first available.
            setCurrentPageId((prev) => {
              const apiIds = new Set(apiWorkspaces.map((w) => w.id));
              // If still in API list, keep it
              if (apiIds.has(prev)) return prev;
              // If it looks like a recently-created workspace (workspace-* prefix),
              // keep it — it will be preserved in the merged pages above.
              if (prev.startsWith('workspace-')) return prev;
              return apiWorkspaces[0]?.id ?? '';
            });

            // Update UI with merged data
            setPages(mergedPages);
            console.log('[Dashboard] Synced workspaces from API:', apiWorkspaces.length);
          }
        }
      } catch (error) {
        console.error('[Dashboard] Error loading workspaces:', error);
      } finally {
        setIsLoadingWorkspaces(false);
        // Delay clearing loading flag to ensure all state updates complete
        // Increased to 500ms to be absolutely safe
        setTimeout(() => {
          isLoadingRef.current = false;
          console.log('[Dashboard] Loading flag cleared');
        }, 500);
      }
    };

    loadWorkspaces();
  }, [isAuthenticated]);

  // Note: localStorage is saved manually only when user makes changes
  // This prevents unnecessary saves during load/switch operations

  // Get current page data (pages may be empty while loading)
  const currentPage = pages.find((p) => p.id === currentPageId) ?? pages[0] ?? null;
  const modules = currentPage?.modules ?? [];
  const layout = currentPage?.layout ?? [];

  const handleOpenModal = () => {
    console.log("Opening modal...");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log("Closing modal...");
    setIsModalOpen(false);
  };

  const handleOpenAddPageModal = () => {
    setIsAddPageModalOpen(true);
  };

  const handleCloseAddPageModal = () => {
    setIsAddPageModalOpen(false);
  };

  const handleAddPage = async (pageName: string) => {
    // Check workspace limit from subscription
    if (pages.length >= maxWorkspaces) {
      setNotification(`Bạn đã đạt giới hạn ${maxWorkspaces} giao diện. Vui lòng xóa giao diện cũ hoặc nâng cấp gói đăng kí để tạo mới.`);
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const timestamp = Date.now();
    const newPage: PageData = {
      id: `page-${timestamp}`,
      name: pageName,
      initial: pageName.charAt(0).toUpperCase(),
      modules: [],
      layout: [],
    };

    try {
      // Save to API if authenticated
      if (isAuthenticated) {
        const layoutJson = convertToBackendFormat(newPage);
        
        const response = await workspaceService.createWorkspace({
          workspaceName: pageName,
          layoutJson,
          isDefault: false,
        });
        
        if (response.isSuccess && response.data) {
          newPage.id = `workspace-${response.data.id}`;
          newPage.workspaceId = response.data.id;
          console.log('[Dashboard] Workspace created in API:', response.data.id);
        }
      }
    } catch (error) {
      console.error('[Dashboard] Error creating workspace in API:', error);
      // Continue with local-only workspace
    }

    setPages(prev => {
      const updatedPages = [...prev, newPage];
      localStorage.setItem('dashboard-pages', JSON.stringify(updatedPages));
      return updatedPages;
    });

    localStorage.setItem('dashboard-current-page', newPage.id);
    
    setCurrentPageId(newPage.id); // Auto switch to new page

    console.log("New page:", newPage);

    setNotification(`Đã tạo page "${pageName}" thành công!`);

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSwitchPage = (pageId: string) => {
    setCurrentPageId(pageId);
    
    // Save current page ID to localStorage
    localStorage.setItem('dashboard-current-page', pageId);
    
    setNotification(
      `Đã chuyển sang "${pages.find((p) => p.id === pageId)?.name}"`
    );

    setTimeout(() => {
      setNotification(null);
    }, 2000);
  };

  const handleDeletePage = async (pageId: string) => {
    // Prevent deleting default page
    if (pageId === "default") {
      setNotification("Không thể xóa trang mặc định!");
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      return;
    }

    const pageToDelete = pages.find((p) => p.id === pageId);
    
    // Delete from API if authenticated and has workspaceId
    try {
      if (isAuthenticated && pageToDelete?.workspaceId) {
        await workspaceService.deleteWorkspace(pageToDelete.workspaceId);
        console.log('[Dashboard] Workspace deleted from API:', pageToDelete.workspaceId);
      }
    } catch (error) {
      console.error('[Dashboard] Error deleting workspace from API:', error);
      // Continue with local deletion
    }
    
    const updatedPages = pages.filter((p) => p.id !== pageId);
    setPages(updatedPages);
    
    // Save to localStorage
    localStorage.setItem('dashboard-pages', JSON.stringify(updatedPages));

    // If current page is deleted, switch to default
    if (currentPageId === pageId) {
      setCurrentPageId("default");
      localStorage.setItem('dashboard-current-page', 'default');
    }

    setNotification(`Đã xóa page "${pageToDelete?.name}" thành công!`);

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const addModule = async (moduleType: string, moduleTitle: string) => {
    const newModule: Module = {
      id: `${moduleType}-${Date.now()}`,
      type: moduleType,
      title: moduleTitle,
    };

    // Calculate position for new module
    const yPosition =
      layout.length > 0
        ? Math.max(...layout.map((item) => item.y + item.h))
        : 0;

    // Default sizes for different module types based on content
    let width = 48; // Default: half width (48 columns = 50%)
    let height = 20; // Default: 20 units (400px with rowHeight=20px)

    // Chart modules - larger, landscape orientation
    if (
      ["overview-chart", "vn-stock-chart", "global-stock-chart"].includes(
        moduleType
      )
    ) {
      width = 72; // 72 columns = 75% width
      height = 18; // 18 units = 360px (full screen height)
    }

    // Financial reports - medium width, tall
    else if (
      ["financial-report"].includes(moduleType)
    ) {
      width = 24; // 24 columns = 25% width
      height = 14; // 14 units = 280px (tall for tables)
    }

    else if (
      ["financial-report-pro"].includes(moduleType)
    ) {
      width = 96; // 96 columns = 100% width
      height = 24; // 24 units = 480px (tall for tables)
    }

    // News module - medium width, tall for scrolling
    else if (moduleType === "news") {
      width = 24; // 24 columns = 25% width
      height = 10; // 10 units = 200px
    }

    // Session Info & TA Advisor - compact square modules
    else if (
      ["session-info", "ta-advisor", "fa-advisor"].includes(moduleType)
    ) {
      width = 24; // 24 columns = 25% width
      height = 12; // 12 units = 240px (square-ish)
    }

    // Order Matching - compact, medium height
    else if (moduleType === "order-matching") {
      width = 24; // 24 columns = 25% width
      height = 22; // 22 units = 440px
    }

    // Canslim - compact square
    else if (moduleType === "canslim") {
      width = 24; // 24 columns = 25% width
      height = 12; // 12 units = 240px
    }

    // Stock Screener - wide, tall for tables
    else if (moduleType === "stock-screener") {
      width = 96; // 96 columns = 100% width
      height = 18; // 18 units = 360px
    }

    // Trading Map - large square
    else if (moduleType === "trading-map") {
      width = 48; // 48 columns = 50% width
      height = 22; // 22 units = 440px (square)
    }

    // Heatmap - full width, large height
    else if (moduleType === "heatmap") {
      width = 96; // 96 columns = 100% width (full width)
      height = 22; // 22 units = 440px (fits comfortably on standard 16:9 screens)
    }

    // Analysis Report - medium width, tall
    else if (moduleType === "analysis-report") {
      width = 26; // 48 columns = 50% width
      height = 12; // 28 units = 560px
    }

    // AI Chat - compact, medium height
    else if (moduleType === "ai-chat") {
      width = 24; // 24 columns = 25% width
      height = 22; // 22 units = 440px
    }

    const newLayoutItem: LayoutItem = {
      i: newModule.id,
      x: 0,
      y: yPosition,
      w: width,
      h: height,
    };

    // Update current page's modules and layout
    const updatedPages = pages.map((page) => {
      if (page.id === currentPageId) {
        return {
          ...page,
          modules: [...page.modules, newModule],
          layout: [...page.layout, newLayoutItem],
        };
      }
      return page;
    });
    
    setPages(updatedPages);
    
    // Save to localStorage
    localStorage.setItem('dashboard-pages', JSON.stringify(updatedPages));

    // Sync to API (only if authenticated)
    if (isAuthenticated) {
      const updatedPage = updatedPages.find(p => p.id === currentPageId);
      if (updatedPage) {
        await syncWorkspaceToAPI(updatedPage);
      }
    }

    setNotification(`Đã thêm ${moduleTitle}`);

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const updateLayout = (newLayout: LayoutItem[]) => {
    // Skip if currently loading workspaces
    if (isLoadingRef.current) {
      console.log('[Dashboard] Skip updateLayout - currently loading workspaces');
      return;
    }
    
    // Find current page's layout
    const currentPageData = pages.find(p => p.id === currentPageId);
    if (!currentPageData) return;
    
    // Never update DEFAULT_PAGE without workspaceId
    if (currentPageData.id === 'default' && !currentPageData.workspaceId) {
      console.log('[Dashboard] Skip updateLayout - DEFAULT_PAGE without workspaceId');
      return;
    }
    
    // Compare layouts to check if there's actual change
    // GridLayout may trigger onLayoutChange even when just switching workspace
    const hasChanged = JSON.stringify(currentPageData.layout) !== JSON.stringify(newLayout);
    
    if (!hasChanged) {
      console.log('[Dashboard] Layout unchanged, skipping save');
      return;
    }
    
    console.log('[Dashboard] Layout changed, saving...');
    
    const updatedPages = pages.map((page) => {
      if (page.id === currentPageId) {
        return {
          ...page,
          layout: newLayout,
        };
      }
      return page;
    });
    
    setPages(updatedPages);
    
    // Save to localStorage
    localStorage.setItem('dashboard-pages', JSON.stringify(updatedPages));

    // Sync to API with debounce (1 second) to avoid too many API calls during drag
    if (isAuthenticated) {
      const updatedPage = updatedPages.find(p => p.id === currentPageId);
      if (updatedPage) {
        syncWorkspaceToAPI(updatedPage, 1000);
      }
    }
  };

  const removeModule = async (moduleId: string) => {
    const updatedPages = pages.map((page) => {
      if (page.id === currentPageId) {
        return {
          ...page,
          modules: page.modules.filter((m) => m.id !== moduleId),
          layout: page.layout.filter((l) => l.i !== moduleId),
        };
      }
      return page;
    });
    
    setPages(updatedPages);
    
    // Save to localStorage
    localStorage.setItem('dashboard-pages', JSON.stringify(updatedPages));

    // Sync to API (only if authenticated)
    if (isAuthenticated) {
      const updatedPage = updatedPages.find(p => p.id === currentPageId);
      if (updatedPage) {
        await syncWorkspaceToAPI(updatedPage);
      }
    }
  };

  /**
   * Update layoutId for a specific module in the current page
   * Used by modules with configurable layouts (StockScreener, FinancialReportPro, Heatmap)
   * to persist their selected layout to workspace
   */
  const updateModuleLayoutId = async (moduleId: string, layoutId: number | null) => {
    const updatedPages = pages.map((page) => {
      if (page.id === currentPageId) {
        return {
          ...page,
          modules: page.modules.map((m) => {
            if (m.id === moduleId) {
              // If layoutId is null, remove the property
              if (layoutId === null) {
                const { layoutId: _, ...moduleWithoutLayoutId } = m;
                return moduleWithoutLayoutId;
              }
              // Otherwise, set/update layoutId
              return { ...m, layoutId };
            }
            return m;
          }),
        };
      }
      return page;
    });
    
    setPages(updatedPages);
    
    // Save to localStorage
    localStorage.setItem('dashboard-pages', JSON.stringify(updatedPages));

    // Sync to API (only if authenticated)
    if (isAuthenticated) {
      const updatedPage = updatedPages.find(p => p.id === currentPageId);
      if (updatedPage) {
        await syncWorkspaceToAPI(updatedPage);
      }
    }
  };

  /**
   * Get module data by ID from current page
   * Used by modules to access their layoutId
   * Memoized for better performance
   */
  const getModuleById = useMemo(() => {
    // Create a Map for O(1) lookup instead of O(n) array.find()
    const moduleMap = new Map<string, Module>();
    currentPage?.modules.forEach((m) => {
      moduleMap.set(m.id, m);
    });
    
    return (moduleId: string): Module | undefined => {
      return moduleMap.get(moduleId);
    };
  }, [currentPage?.modules]);

  // Show full-screen spinner while auth state is being resolved
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-pageBackground">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-accentGreen" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm text-gray-400">Đang kiểm tra phiên đăng nhập...</span>
        </div>
      </div>
    );
  }

  // Block render if not authenticated (redirect effect is already triggered)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <ThemeProvider>
      <SignalRProvider
        apiUrl={process.env.NEXT_PUBLIC_API_URL}
        autoConnect={true}
        autoReconnect={true}
      >
        <FontSizeProvider>
          <DashboardContext.Provider
            value={{
              modules: currentPage?.modules || [],
              addModule,
              layout: currentPage?.layout || [],
              updateLayout,
              removeModule,
              currentPageId,
              updateModuleLayoutId,
              getModuleById,
            }}
          >
            <div className="flex h-screen bg-[#E0E3EB] dark:bg-pageBackground transition-colors duration-300">
              <Sidebar
                onAddModule={handleOpenModal}
                onAddPage={handleOpenAddPageModal}
                pages={pages}
                currentPageId={currentPageId}
                onSwitchPage={handleSwitchPage}
                onDeletePage={handleDeletePage}
                onRenamePage={(pageId, newName) =>
                  setPages((prev) =>
                    prev.map((p) =>
                      p.id === pageId
                        ? { ...p, name: newName, initial: newName.charAt(0).toUpperCase() }
                        : p
                    )
                  )
                }
                workspaceCount={pages.length}
              />
              <main className="flex-1 overflow-y-auto relative">
                {children}

                {/* Success Notification */}
                {notification && (
                  <div className="fixed top-12 right-4 z-[10000] animate-in slide-in-from-top">
                    <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-600 text-gray-100 px-5 py-2.5 rounded-lg shadow-xl flex items-center gap-2.5">
                      <svg
                        className="w-4 h-4 text-green-400 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm font-medium">{notification}</span>
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
                onSwitchPage={handleSwitchPage}
                workspaceCount={pages.length}
              />
            </div>
          </DashboardContext.Provider>
        </FontSizeProvider>
      </SignalRProvider>
    </ThemeProvider>
  );
}
