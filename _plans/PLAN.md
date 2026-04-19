# Plan: Cấu trúc lại toàn bộ dự án CapstoneProject (KF Stock)

**Created**: 2026-04-19
**Status**: In Progress
**Scope**: Toàn bộ `src/` — App Router, Features, Services, Components, Types, Stores, Lib

---

## Tổng quan vấn đề hiện tại

Sau khi đọc kỹ toàn bộ codebase, các vấn đề cấu trúc được xác định:

| # | Vấn đề | Mức độ |
|---|--------|--------|
| 1 | Route groups `(dashboard)/`, `(admin)/`, `(public)/` được tạo nhưng **trang thật nằm ngoài** (dashboard/, SystemManager/, login/) | 🔴 Critical |
| 2 | `src/features/dashboard/modules/*` gồm 15 folder — **tất cả đều rỗng**. Module thật ở `src/components/dashboard/modules/` | 🔴 Critical |
| 3 | `src/services/` có 30+ file flat cùng 9 subfolder rỗng (`api/`, `account/`, `market/`, `admin/`, `files/`, `reports/`, `realtime/`, `workspace/`, `_internal/`) | 🔴 Critical |
| 4 | `src/stores/market/`, `stores/ui/`, `stores/account/` — **cả ba đều rỗng** | 🟡 Warning |
| 5 | `src/lib/color/`, `lib/storage/` — **rỗng** | 🟡 Warning |
| 6 | `src/providers/` — **rỗng**, tất cả providers đang ở `contexts/` | 🟡 Warning |
| 7 | `src/components/layout/` — **rỗng** | 🟡 Warning |
| 8 | Module components vi phạm quy tắc **200 dòng**: `StockScreenerModule` (~700 dòng), `VNStockChartModule` (~600 dòng), `HeatmapModule` (~500 dòng), `SmartBoardModule` (~400 dòng), `AiChatModule` (~400 dòng) | 🔴 Critical |
| 9 | Logic nghiệp vụ **nhúng thẳng vào component** thay vì custom hooks | 🔴 Critical |
| 10 | `types/index.ts` định nghĩa trùng `User` và `ApiResponse` đã có trong `types/auth.ts` và `types/symbol.ts` | 🟡 Warning |
| 11 | `src/types/style-imports.ts` chứa mỗi `declare module "*.css"` — phải nằm trong `.d.ts` file | 🟢 Minor |
| 12 | Module components dùng `export default` thay vì `export function` (vi phạm coding-style) | 🟡 Warning |
| 13 | `components/dashboard/modules/index.ts` re-export toàn bộ bằng default import — không nhất quán | 🟡 Warning |
| 14 | `src/features/auth/`, `features/profile/`, `features/reports/`, `features/staff/` chỉ có components rỗng | 🟡 Warning |
| 15 | `src/features/dashboard/analysis-report-search/` — folder lạc chỗ | 🟡 Warning |
| 16 | `src/hooks/useStockScreener.ts` đã tồn tại nhưng không được dùng đúng — module vẫn tự quản lý state | 🔴 Critical |

---

## Kiến trúc đích

> Mỗi file được liệt kê tường minh — không còn folder mang ý nghĩa chung chung.

```
src/
│
├── app/                                                         ← Next.js App Router — chỉ chứa pages/layouts
│   ├── layout.tsx                                               ← Root layout: AuthProvider + ThemeProvider + GoogleOAuthProvider + FrontendConsoleCapture
│   ├── page.tsx                                                 ← Landing page: module showcase + subscription plans (~400 dòng)
│   ├── globals.css
│   │
│   ├── (public)/                                                ← Route group: trang không cần đăng nhập
│   │   ├── layout.tsx                                           ← Minimal shell, không có auth/providers
│   │   ├── login/
│   │   │   └── page.tsx                                         ← framer-motion bg + LoginForm + OHLCV animated chart
│   │   ├── verify-email/
│   │   │   └── page.tsx                                         ← Email verification handler
│   │   └── error/
│   │       └── page.tsx                                         ← Generic error page
│   │
│   ├── (protected)/                                             ← Route group: yêu cầu đăng nhập
│   │   ├── layout.tsx                                           ← Auth guard: redirect /login nếu chưa đăng nhập
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                                       ← DashboardContext + SignalRProvider + NotificationProvider + workspace sync
│   │   │   ├── page.tsx                                         ← react-grid-layout grid, đăng ký moduleComponents map
│   │   │   └── dashboard.css                                    ← grid-layout overrides
│   │   └── profile/
│   │       └── page.tsx                                         ← ProfilePage: tabs account/subscription/portfolio/transactions/alerts
│   │
│   ├── (admin)/                                                 ← Route group: Staff | Admin | Quản trị viên
│   │   ├── layout.tsx                                           ← Role guard: kiểm tra role từ AuthContext
│   │   └── system-manager/
│   │       ├── layout.tsx                                       ← StaffSidebar + main content area
│   │       ├── page.tsx                                         ← DashboardFeature (revenue/user stats)
│   │       ├── users/
│   │       │   └── page.tsx                                     ← UsersFeature
│   │       ├── analysis-reports/
│   │       │   └── page.tsx                                     ← AnalysisReportsFeature
│   │       ├── financial-reports/
│   │       │   └── page.tsx                                     ← FinancialReportsFeature
│   │       ├── news/
│   │       │   └── page.tsx                                     ← NewsFeature
│   │       ├── revenue/
│   │       │   └── page.tsx                                     ← RevenueFeature (subscription management)
│   │       ├── data/
│   │       │   └── page.tsx                                     ← DataFeature (SSI import tasks + SignalR debug logs)
│   │       └── macroeconomic-simulation/
│   │           └── page.tsx                                     ← MacroeconomicSimulationFeature
│   │
│   └── api/
│       └── debug/
│           └── route.ts                                         ← Next.js API route: frontend log ingestion endpoint
│
├── features/                                                    ← Feature-sliced: mỗi feature tự quản lý components + hooks
│   │
│   ├── auth/
│   │   ├── components/
│   │   │   └── LoginForm.tsx                                    ← Login + register tabs, framer-motion, GoogleLogin, passRules validation
│   │   ├── hooks/
│   │   │   └── useLoginForm.ts                                  ← [NEW] Form state, validation, submit handlers, error management
│   │   └── index.ts                                             ← export { LoginForm }
│   │
│   ├── dashboard/
│   │   ├── components/                                          ← Dashboard shell UI (sidebar, modals, toolbar)
│   │   │   ├── Sidebar.tsx                                      ← ~400 dòng: workspace links, notification panel, theme toggle, user info
│   │   │   ├── ModuleSelectorModal.tsx                          ← Modal pick module (danh sách ModuleType)
│   │   │   ├── AddPageModal.tsx                                 ← Modal thêm dashboard page mới
│   │   │   ├── SymbolSearchBox.tsx                              ← Debounced symbol search input (dùng symbolService)
│   │   │   ├── ColumnSidebar.tsx                                ← Column visibility sidebar cho FinancialReportPro
│   │   │   ├── ColumnManagerDialog.tsx                          ← Column group manager dialog
│   │   │   ├── AnalysisReportSearch.tsx                         ← Search box cho AnalysisReport module (flatten từ AnalysisReportSearch/)
│   │   │   ├── layout/
│   │   │   │   ├── LayoutSelector.tsx                           ← Dropdown chọn saved layout
│   │   │   │   ├── SaveLayoutModal.tsx                          ← Modal lưu layout hiện tại
│   │   │   │   └── WatchListSelector.tsx                        ← Dropdown chọn watchlist
│   │   │   └── index.ts                                         ← export { Sidebar, ModuleSelectorModal, ... }
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDashboardPages.ts                             ← [NEW] Page CRUD, currentPageId, localStorage sync (extract từ layout.tsx)
│   │   │   └── useWorkspaceSync.ts                              ← [NEW] Backend workspace sync, maxWorkspaces check (extract từ layout.tsx)
│   │   │
│   │   ├── modules/                                             ← Mỗi module = 1 sub-folder độc lập
│   │   │   │
│   │   │   ├── vn-stock-chart/
│   │   │   │   ├── VNStockChartModule.tsx                       ← Thin presenter: renders KlineCharts canvas, toolbar buttons (<200 dòng)
│   │   │   │   ├── useVNStockChart.ts                           ← [NEW] Chart init/destroy, OHLCV REST fetch, indicator management, SignalR subscription, symbol/timeframe state
│   │   │   │   └── index.ts                                     ← export { VNStockChartModule }
│   │   │   │
│   │   │   ├── global-stock-chart/
│   │   │   │   ├── GlobalStockChartModule.tsx                   ← TradingView advanced chart embed (~70 dòng, keep as-is)
│   │   │   │   └── index.ts                                     ← export { GlobalStockChartModule }
│   │   │   │
│   │   │   ├── heatmap/
│   │   │   │   ├── HeatmapModule.tsx                            ← ECharts treemap presenter (<200 dòng sau hook extract)
│   │   │   │   ├── useHeatmap.ts                                ← [NEW] exchange/sector/watchlist filter state, SignalR subscription, ECharts data transform
│   │   │   │   └── index.ts                                     ← export { HeatmapModule }
│   │   │   │
│   │   │   ├── stock-screener/
│   │   │   │   ├── StockScreenerModule.tsx                      ← AG-Grid presenter, column toolbar, pagination controls
│   │   │   │   ├── useStockScreener.ts                          ← Move từ src/hooks/useStockScreener.ts — all filter, sort, SignalR, column mgmt logic
│   │   │   │   ├── ExchangeFilter.tsx                           ← Checkbox filter: HSX | HNX | UPCOM
│   │   │   │   ├── IndexFilter.tsx                              ← Checkbox filter: VN30 | HNX30 | VNINDEX
│   │   │   │   ├── SectorFilter.tsx                             ← Sector dropdown filter
│   │   │   │   ├── SymbolTypeFilter.tsx                         ← Stock type filter (Co phieu, ETF, CW, ...)
│   │   │   │   └── index.ts                                     ← export { StockScreenerModule }
│   │   │   │
│   │   │   ├── smart-board/
│   │   │   │   ├── SmartBoardModule.tsx                         ← Sector-grouped live board presenter (<200 dòng sau hook extract)
│   │   │   │   ├── useSmartBoard.ts                             ← [NEW] Filter state, sector grouping, volume threshold filter, SignalR
│   │   │   │   ├── SmartBoardFilterBar.tsx                      ← Filter bar: volume period, exchange, sector
│   │   │   │   └── index.ts                                     ← export { SmartBoardModule }
│   │   │   │
│   │   │   ├── financial-report/
│   │   │   │   ├── FinancialReportModule.tsx                    ← Profitability / Growth / Financial Health / Cash Flow tabs
│   │   │   │   ├── FinancialIndicatorChart.tsx                  ← Line/bar chart per indicator
│   │   │   │   ├── FinancialIndicatorGroupTabs.tsx              ← Tab group selector
│   │   │   │   ├── FinancialIndicatorMetricsTable.tsx           ← Metrics grid table
│   │   │   │   ├── FinancialIndicatorPeriodNavigator.tsx        ← Period navigation controls
│   │   │   │   └── index.ts                                     ← export { FinancialReportModule }
│   │   │   │
│   │   │   ├── financial-report-pro/
│   │   │   │   ├── FinancialReportProModule.tsx                 ← AG-Grid full multi-ticker financial table
│   │   │   │   ├── FinancialReportTable.tsx                     ← AG-Grid wrapper with virtualized scroll
│   │   │   │   ├── FinancialReportColumnSidebar.tsx             ← 3-level column visibility tree sidebar
│   │   │   │   ├── FilterLayoutSelector.tsx                     ← Saved filter layout dropdown
│   │   │   │   ├── HeaderSection.tsx                            ← Module header: ticker add, industry filter
│   │   │   │   ├── IndustrySelect.tsx                           ← Industry/sector dropdown
│   │   │   │   ├── LockToggle.tsx                               ← Lock/unlock ticker column button
│   │   │   │   ├── TickerSearchBox.tsx                          ← Add ticker input box
│   │   │   │   ├── columnDefs.ts                                ← AG-Grid ColDef array, header/value formatters
│   │   │   │   ├── ag-grid-custom.css                           ← AG-Grid theme overrides (dark mode)
│   │   │   │   └── index.ts                                     ← export { FinancialReportProModule }
│   │   │   │
│   │   │   ├── ai-chat/
│   │   │   │   ├── AiChatModule.tsx                             ← Chat UI presenter: AI sessions + DM conversations (<200 dòng)
│   │   │   │   ├── useAiChat.ts                                 ← [NEW] Session management, message send/receive, markdown render helpers
│   │   │   │   ├── DirectChatPanel.tsx                          ← Staff DM panel (embedded trong AiChatModule)
│   │   │   │   └── index.ts                                     ← export { AiChatModule }
│   │   │   │
│   │   │   ├── analysis-report/
│   │   │   │   ├── AnalysisReportModule.tsx                     ← Paginated analysis reports + PDF viewer
│   │   │   │   ├── useAnalysisReport.ts                         ← [NEW] Pagination state, filter state, PDF blob loading
│   │   │   │   └── index.ts                                     ← export { AnalysisReportModule }
│   │   │   │
│   │   │   ├── news/
│   │   │   │   ├── NewsModule.tsx                               ← News list + sentiment view
│   │   │   │   ├── NewsFilterBar.tsx                            ← Source/ticker/date filter bar
│   │   │   │   ├── RelatedTickerSelector.tsx                    ← Ticker chip selector cho news filter
│   │   │   │   ├── SentimentCortisolChart.tsx                   ← Sentiment over-time bar chart
│   │   │   │   ├── TickerSentimentCard.tsx                      ← Per-ticker sentiment score card
│   │   │   │   └── index.ts                                     ← export { NewsModule }
│   │   │   │
│   │   │   ├── order-matching/
│   │   │   │   ├── OrderMatchingModule.tsx                      ← Live trade stream, MAX_TRADES=200, getPriceColorClass, formatVol, formatVal
│   │   │   │   └── index.ts                                     ← export { OrderMatchingModule }
│   │   │   │
│   │   │   ├── index-module/
│   │   │   │   ├── IndexModule.tsx                              ← VN30/HNX30/VNINDEX/HNXINDEX table + mini sparkline charts
│   │   │   │   ├── IndexMiniChart.tsx                           ← Intraday sparkline chart per index
│   │   │   │   └── index.ts                                     ← export { IndexModule }
│   │   │   │
│   │   │   ├── session-info/
│   │   │   │   ├── SessionInfoModule.tsx                        ← "3 Buoc Gia" price depth (bid/ask steps)
│   │   │   │   └── index.ts                                     ← export { SessionInfoModule }
│   │   │   │
│   │   │   ├── canslim/
│   │   │   │   ├── CanslimModule.tsx                            ← CANSLIM placeholder, hardcoded ABR data, Action Score 73 (~80 dòng, keep as-is)
│   │   │   │   └── index.ts                                     ← export { CanslimModule }
│   │   │   │
│   │   │   ├── overview-chart/
│   │   │   │   ├── OverviewChartModule.tsx                      ← Placeholder stub ~20 dòng (keep as-is)
│   │   │   │   └── index.ts                                     ← export { OverviewChartModule }
│   │   │   │
│   │   │   └── index.ts                                         ← Named re-export: export { VNStockChartModule, HeatmapModule, StockScreenerModule, ... }
│   │   │
│   │   └── index.ts                                             ← export { Sidebar, ModuleSelectorModal, ... } + { VNStockChartModule, ... }
│   │
│   ├── admin/                                                   ← Staff / Admin panel feature
│   │   ├── components/
│   │   │   ├── StaffSidebar.tsx                                 ← Navigation sidebar với route links cho system manager
│   │   │   ├── DashboardFeature.tsx                             ← Stats overview: revenue chart + user chart + system notifications
│   │   │   ├── UsersFeature.tsx                                 ← User management table + detail modal
│   │   │   ├── AnalysisReportsFeature.tsx                       ← Analysis reports CRUD: sources + categories + reports list
│   │   │   ├── FinancialReportsFeature.tsx                      ← Financial report management + create wizard
│   │   │   ├── NewsFeature.tsx                                  ← News management: import RSS + article table
│   │   │   ├── RevenueFeature.tsx                               ← Subscription package management + revenue stats
│   │   │   ├── DataFeature.tsx                                  ← SSI data fetch tasks + SignalR debug log export
│   │   │   ├── MacroeconomicSimulationFeature.tsx               ← Macroeconomic data upsert form
│   │   │   │
│   │   │   ├── analysis-reports/
│   │   │   │   ├── AnalysisReportCategories.tsx                 ← Category CRUD table
│   │   │   │   ├── AnalysisReportsList.tsx                      ← Paginated reports table + upload modal
│   │   │   │   └── AnalysisReportSources.tsx                    ← Source CRUD table
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardStatsCards.tsx                      ← KPI cards: total users, revenue, subscriptions
│   │   │   │   ├── editorExtensions.ts                          ← Tiptap/editor extension config for system notifications
│   │   │   │   ├── NewUsersChart.tsx                            ← New user registration bar chart
│   │   │   │   ├── RevenueChart.tsx                             ← Revenue line chart
│   │   │   │   ├── RevenueDashboardSection.tsx                  ← Revenue section wrapper
│   │   │   │   ├── SystemDashboardSection.tsx                   ← System stats section wrapper
│   │   │   │   ├── SystemNotificationEditor.tsx                 ← Rich text notification editor
│   │   │   │   ├── SystemNotificationEditorToolbar.tsx          ← Toolbar for notification editor
│   │   │   │   ├── SystemNotificationModal.tsx                  ← Modal to compose + send system notification
│   │   │   │   ├── useDashboardData.ts                          ← Data fetch hook: statistics, charts data
│   │   │   │   └── UserDashboardSection.tsx                     ← User stats section wrapper
│   │   │   │
│   │   │   ├── financial-reports/
│   │   │   │   ├── CreateFinancialReportModal.tsx               ← Multi-step modal wrapper (uses create-modal/ steps)
│   │   │   │   ├── FinancialReportDetailModal.tsx               ← View/edit single report modal
│   │   │   │   ├── FinancialReportsList.tsx                     ← Paginated reports table với filters
│   │   │   │   ├── index.ts                                     ← export { CreateFinancialReportModal, FinancialReportsList, ... }
│   │   │   │   ├── reportPresentation.ts                        ← Report display formatting helpers
│   │   │   │   └── create-modal/
│   │   │   │       ├── constants.ts                             ← Step definitions, default values
│   │   │   │       ├── CreateFinancialReportEditorStep.tsx      ← Step 2: data entry table editor
│   │   │   │       ├── CreateFinancialReportEditorTable.tsx     ← Editable grid table for financial data
│   │   │   │       ├── CreateFinancialReportFiltersPanel.tsx    ← Ticker/period filter panel
│   │   │   │       ├── CreateFinancialReportInitStep.tsx        ← Step 1: select ticker + period + type
│   │   │   │       ├── types.ts                                 ← Wizard step types, form state interface
│   │   │   │       └── utils.ts                                 ← Data transformation helpers
│   │   │   │
│   │   │   ├── news/
│   │   │   │   ├── NewsDetailModal.tsx                          ← Full article detail modal
│   │   │   │   ├── NewsFiltersPanel.tsx                         ← Source/date/ticker filter panel
│   │   │   │   ├── NewsHeader.tsx                               ← Header: title + import RSS button
│   │   │   │   ├── NewsImportStatus.tsx                         ← Import progress/result display
│   │   │   │   ├── NewsPaginationFooter.tsx                     ← Pagination controls
│   │   │   │   └── NewsTable.tsx                                ← Article table với thumbnails
│   │   │   │
│   │   │   ├── data/
│   │   │   │   ├── constants.tsx                                ← Task type labels, status colors
│   │   │   │   ├── DataTaskCard.tsx                             ← Individual data fetch task card (trigger + status)
│   │   │   │   ├── LogsPanel.tsx                                ← System log viewer với date picker
│   │   │   │   ├── SignalRLogExportPanel.tsx                    ← SignalR debug log export/download panel
│   │   │   │   ├── types.ts                                     ← Local types for DataFeature
│   │   │   │   └── utils.ts                                     ← Log parsing helpers
│   │   │   │
│   │   │   ├── revenue/
│   │   │   │   ├── AddModuleModal.tsx                           ← Modal them module vao subscription
│   │   │   │   ├── CreateSubscriptionModal.tsx                  ← Modal tao goi subscription moi
│   │   │   │   ├── Revenue.tsx                                  ← Revenue overview tab
│   │   │   │   ├── Subscription.tsx                             ← Subscription tab wrapper
│   │   │   │   ├── SubscriptionCardsGrid.tsx                    ← Grid hien thi cac goi subscription
│   │   │   │   ├── SubscriptionEditorSection.tsx                ← Edit subscription package section
│   │   │   │   ├── SubscriptionManagement.tsx                   ← Subscription management main component
│   │   │   │   └── subscriptionManagementModels.ts              ← Local interfaces/types for subscription management
│   │   │   │
│   │   │   └── users/
│   │   │       ├── CreateStaffUserForm.tsx                      ← Form tao tai khoan staff moi
│   │   │       ├── UserAvatar.tsx                               ← Avatar display voi fallback initials
│   │   │       ├── UserDetailModal.tsx                          ← User detail + transaction history modal
│   │   │       └── UsersTable.tsx                               ← Paginated user management table
│   │   │
│   │   └── index.ts                                             ← export { StaffSidebar, DashboardFeature, UsersFeature, ... }
│   │
│   └── profile/                                                 ← User profile feature
│       ├── components/
│       │   ├── AvatarDisplay.tsx                                ← Avatar image + upload overlay
│       │   ├── helpers.ts                                       ← canViewProfileTransactions(), permission helpers
│       │   ├── ModulePreviewPanel.tsx                           ← Preview panel for subscription module access
│       │   ├── modulePreviewUtils.ts                            ← Module preview data helpers
│       │   ├── ProfileAlertTab.tsx                              ← Price alert management tab
│       │   ├── ProfileInfoTab.tsx                               ← Account info + avatar upload + password reset
│       │   ├── ProfilePortfolioTab.tsx                          ← Portfolio management tab
│       │   ├── ProfileSubscriptionTab.tsx                       ← Current subscription + upgrade options
│       │   ├── ProfileTransactionTab.tsx                        ← Payment transaction history tab
│       │   ├── ResetPasswordSection.tsx                         ← Change password form section
│       │   ├── Spinner.tsx                                      ← Loading spinner component
│       │   ├── SubscriptionDetailModal.tsx                      ← Subscription package detail modal
│       │   ├── SubscriptionPaymentModal.tsx                     ← Payment method selection + checkout modal
│       │   ├── useProfileTheme.ts                               ← Theme-aware CSS class helpers (isDark, bgPage, bgCard, borderCls)
│       │   ├── alert/
│       │   │   ├── AlertCreateModal.tsx                         ← Create price alert modal (ticker + condition + value)
│       │   │   ├── AlertDetailModal.tsx                         ← Alert detail view modal
│       │   │   ├── AlertFilters.tsx                             ← Filter bar: type + condition
│       │   │   ├── AlertTable.tsx                               ← Paginated alert table
│       │   │   ├── AlertTickerSelector.tsx                      ← Ticker search input for alert creation
│       │   │   └── index.ts                                     ← export { AlertCreateModal, AlertTable, ... }
│       │   └── portfolio/
│       │       ├── AddTransactionModal.tsx                      ← Add buy/sell transaction modal
│       │       ├── PortfolioActionMenu.tsx                      ← Dropdown: edit, delete, add transaction
│       │       ├── PortfolioCreateModal.tsx                     ← Create portfolio modal (name)
│       │       ├── PortfolioDetail.tsx                          ← Portfolio detail: holdings + P&L breakdown
│       │       ├── PortfolioEditModal.tsx                       ← Edit portfolio name modal
│       │       ├── PortfolioList.tsx                            ← Portfolio list voi summary cards
│       │       └── index.ts                                     ← export { PortfolioList, PortfolioDetail, ... }
│       ├── hooks/
│       │   └── useProfile.ts                                    ← [NEW] Profile data fetch, avatar blob, tab state management
│       └── index.ts                                             ← export { ProfileInfoTab, ProfileAlertTab, ... }
│
├── components/                                                  ← Shared UI — khong thuoc feature nao
│   ├── debug/
│   │   └── FrontendConsoleCapture.tsx                           ← Intercept console.error/warn, batch to frontendSystemLogService
│   └── ui/
│       ├── Button.tsx                                           ← Styled button variants (primary, secondary, ghost, danger)
│       ├── Card.tsx                                             ← Card container voi optional header/footer
│       ├── checkbox.tsx                                         ← Checkbox input component
│       ├── ConfirmDialog.tsx                                    ← Delete confirmation dialog
│       ├── dialog.tsx                                           ← Modal dialog primitive (portal-based)
│       ├── label.tsx                                            ← Form label component
│       ├── ReportViewer.tsx                                     ← PDF/report iframe viewer
│       ├── Toast.tsx                                            ← Toast notification (success/error/info)
│       ├── UploadFileModal.tsx                                  ← File upload modal voi drag-drop
│       └── index.ts                                             ← export { Button, Card, Toast, ... }
│
├── contexts/                                                    ← React Context providers
│   ├── AuthContext.tsx                                          ← JWT auth, Google OAuth, token auto-refresh timer, subscription sync
│   ├── DashboardContext.tsx                                     ← Module[], LayoutItem[], CRUD: add/remove/update/reorder
│   ├── SignalRContext.tsx                                       ← /hubs/marketdata connection, marketData Map<string, MarketSymbolDto>
│   ├── NotificationContext.tsx                                  ← /hubs/notifications, SystemNotification[], DirectMessagePayload
│   ├── ThemeContext.tsx                                         ← dark/light theme toggle, persisted to localStorage
│   ├── FontSizeContext.tsx                                      ← fontSize 0-10 → CSS var --font-scale (0.75rem-1.25rem)
│   ├── ModuleContext.tsx                                        ← Per-module context: moduleId + moduleType, useModule() hook
│   └── index.ts                                                 ← export { AuthContext, useAuth, DashboardContext, useDashboard, ... }
│
├── stores/                                                      ← Zustand stores (flat, khong co subdirs)
│   ├── columnStore.ts                                           ← AG-Grid default column config (defaultColumnsMap), persist middleware
│   ├── financialReportColumnStore.ts                            ← FinancialReportPro column visibility: FINANCIAL_COLUMN_STRUCTURE, TopGroupDef, SubGroupDef, FieldDef
│   ├── financialReportStore.ts                                  ← tickerList, tickerDataCache, filters, expandedGroups, lockState, persist
│   ├── sectorStore.ts                                           ← sectors[], selectedSector, sectorCache Record<id, Sector>, pagination, filters, persist
│   ├── selectedSymbolStore.ts                                   ← selectedSymbol: string, persist
│   ├── subscriptionStore.ts                                     ← mySubscription: UserSubscriptionDto|null, maxWorkspaces, persist
│   └── index.ts                                                 ← export { useColumnStore, useFinancialReportStore, useSectorStore, ... }
│
├── services/                                                    ← API service layer (grouped theo domain)
│   ├── api.ts                                                   ← HTTP client: get/post/put/del/patch/apiRequest/downloadBlob, Bearer token injection, 401 refresh queue
│   │
│   ├── auth/
│   │   └── authService.ts                                       ← login, register, loginWithGoogle, logout, refreshToken, getMe
│   │
│   ├── market/
│   │   ├── symbolService.ts                                     ← searchSymbols(query), getAllTickers(), fetchSymbolsByExchange(code), fetchSymbols(params), fetchSymbolsPaginated(params)
│   │   ├── sectorService.ts                                     ← getSectors(params), getSectorById(id)
│   │   ├── marketIndexService.ts                                ← getMarketIndices(GetMarketIndicesParams), getIndexConstituents(code, GetIndexConstituentsParams)
│   │   ├── indexService.ts                                      ← fetchLiveIndices(codes[]), fetchIndexIntraday(code), DEFAULT_INDEX_CODES constant
│   │   ├── heatmapService.ts                                    ← Class HeatmapService: getHeatmapData(filters?) [BUG: dung raw fetch thay vi api.ts — can fix]
│   │   ├── smartBoardService.ts                                 ← Class SmartBoardService: getMarketData(filters?), getAvgVolume(VolumePeriod) [BUG: getAvgVolume dung raw fetch — fix]
│   │   ├── ohlcvService.ts                                      ← fetchOhlcvData(FetchOhlcvParams): OhlcvDataPoint[], OhlcvResponse, FetchOhlcvParams interface
│   │   ├── signalRService.ts                                    ← Singleton SignalRService: onMarketDataReceived(MarketDataCallback), onTradeDataReceived, onPriceDepthReceived, onIndexDataReceived
│   │   ├── heatmapSignalRService.ts                             ← getHeatmapSignalRService() singleton factory, HeatmapSignalRService class
│   │   └── ohlcvSignalRService.ts                               ← OhlcvSignalRService class, OhlcvCandle interface, subscribe/unsubscribe
│   │
│   ├── financial/
│   │   ├── financialReportService.ts                            ← fetchFinancialReportsByTicker, fetchFinancialReportIndicatorsByTicker, fetchRecentFinancialReports, convertToTableRow(FinancialReport): FinancialReportTableRow
│   │   └── macroeconomicDataService.ts                          ← getMacroeconomicData(), upsertMacroeconomicData(UpsertMacroeconomicDataRequest)
│   │
│   ├── chat/
│   │   └── chatService.ts                                       ← getChatSessions(), getChatMessages(sessionId), sendChatMessage(sessionId, content), createChatSession(title?)
│   │
│   ├── workspace/
│   │   ├── workspaceService.ts                                  ← normalizeWorkspaceList(raw), getMyWorkspaces(), createWorkspace(req), updateWorkspace(id, req), deleteWorkspace(id)
│   │   └── layoutService.ts                                     ← getLayouts(moduleType?), getLayoutById(id), createLayout(req), updateLayout(id, req), deleteLayout(id)
│   │
│   ├── notifications/
│   │   ├── alertService.ts                                      ← getMyAlerts(AlertQueryParams), getAlertById(id), createAlert(CreateAlertRequest), updateAlert(id, req), deleteAlert(id), toggleAlert(id)
│   │   └── telegramService.ts                                   ← getTelegramStartLink(): TelegramStartLinkDto
│   │
│   ├── reports/
│   │   ├── analysisReportService.ts                             ← getReports(params), getSources(params), getCategories(params), createReport/Source/Category, updateReport/Source/Category, deleteReport/Source/Category
│   │   └── newsService.ts                                       ← normalizeNewsArticle, normalizeTickerScores, getNewsList(params), importNewsFromRss(), getNewsById(id)
│   │
│   ├── files/
│   │   └── fileService.ts                                       ← uploadFile(FileUploadRequest): FormData multipart, downloadFile(FileDownloadParams), deleteFile(FileDeleteParams)
│   │
│   ├── admin/
│   │   ├── userManagementService.ts                             ← getUserList(params), getUserDetail(id), createStaffUser(req), updateUserStatus(id, req)
│   │   ├── subscriptionService.ts                               ← getSubscriptions(), getMySubscription(), toggleSubscriptionStatus(id), updateSubscriptionById(id, data), createSubscription(data), deleteSubscription(id)
│   │   ├── systemDataService.ts                                 ← triggerDataFetch(DataFetchTaskType), getSystemLogs(params), getLogDates()
│   │   ├── statisticService.ts                                  ← getSubscriptionStatistics(), getCustomerRetentionStatistics(), getWatchListTopInterestedSymbols()
│   │   ├── paymentService.ts                                    ← createPaymentLink(subscriptionId, provider), checkPaymentStatus(orderCode), getMyTransactions(params)
│   │   └── portfolioService.ts                                  ← getPortfolios(query), createPortfolio, updatePortfolio, deletePortfolio, getPortfolioById, getTransactions, addTransaction, updateInvestmentCapital
│   │
│   ├── watchListService.ts                                      ← getWatchLists(), createWatchList(name, tickers[]), updateWatchList(id, req), deleteWatchList(id), getWatchListById(id)
│   ├── frontendSystemLogService.ts                              ← Class FrontendSystemLogService: queue batching, flush timer, log(entry), queryLogs(args), POST to /api/debug/signalr-hub-log
│   └── signalRDebugLogService.ts                                ← Class SignalRDebugLogService: localStorage logs, MAX_LOG_ENTRIES=20000, export payload, sessionId
│
├── hooks/                                                       ← Shared hooks (cross-feature, khong specific cho 1 module)
│   ├── useAvatarBlob.ts                                         ← Fetch avatar URL → Blob URL, revoke on unmount
│   ├── useWindowSize.ts                                         ← { width, height } state, resize listener
│   ├── useHeatmapSignalR.ts                                     ← { data, isConnected, isLoading, error, refresh, connect, disconnect }, supports REST fallback
│   ├── useIndexSignalR.ts                                       ← { indexData: Map<code, LiveIndexData>, historyData: Map<code, IndexHistoryPoint[]>, isLoading, isConnected, error }, MAX_HISTORY=4000
│   ├── useOhlcvSignalR.ts                                       ← { candle, connectionState, isConnected, isSubscribed, subscribe, unsubscribe, error }
│   ├── useSectors.ts                                            ← { sectors, selectedSector, fetchSectors, isLoading, error, pagination } — integrates sectorStore
│   ├── useFinancialReportQuery.ts                               ← useQueries per ticker (react-query), staleTime=60min, integrates financialReportStore cache
│   └── index.ts                                                 ← export { useAvatarBlob, useWindowSize, useHeatmapSignalR, ... }
│
├── types/                                                       ← TypeScript types (khong dinh nghia trung)
│   ├── api.ts                                                   ← [NEW] ApiResponse<T>, PaginatedData<T> (extracted tu index.ts + symbol.ts)
│   ├── auth.ts                                                  ← User, LoginRequest, RegisterRequest, AuthResponse, GoogleLoginRequest
│   ├── market.ts                                                ← MarketSymbolDto (tat ca SSI streaming fields), ConnectionState enum
│   ├── symbol.ts                                                ← SymbolType enum, SymbolStatus enum, ExchangeCode enum, SymbolData (remove duplicate ApiResponse)
│   ├── sector.ts                                                ← Sector interface, GetSectorsParams, SectorsPaginatedData
│   ├── marketIndex.ts                                           ← MarketIndex, MarketIndexSymbol, LiveIndexData, IndexHistoryPoint
│   ├── heatmap.ts                                               ← HeatmapItem, HeatmapColorType enum, HeatmapData, HeatmapFilters
│   ├── smartBoard.ts                                            ← VolumePeriod type, SmartBoardFilters, TickerAvgVolumeDto
│   ├── financialReport.ts                                       ← FinancialPeriodType enum, ShortTermAssets, LongTermAssets, BankAssets, IncomeStatement, CashFlowStatement, FinancialReportTableRow
│   ├── analysisReport.ts                                        ← AnalysisReportSource, AnalysisReportCategory, AnalysisReport, CommonStatus enum, all Create/Update/Get params
│   ├── news.ts                                                  ← NewsArticle (voi tickerScores[]), NewsQueryParams, ImportNewsFromRssResult
│   ├── layout.ts                                                ← ModuleType enum (15 values), ModuleLayoutSummary, ModuleLayoutDetail, CreateLayoutRequest
│   ├── workspace.ts                                             ← WorkspaceType enum (Web=1, Mobile=2), Workspace, CreateWorkspaceRequest, UpdateWorkspaceRequest
│   ├── watchList.ts                                             ← WatchListSummary, WatchListDetail, CreateWatchListRequest, UpdateWatchListRequest
│   ├── portfolio.ts                                             ← PortfolioDto, TradingTransactionDto, CreatePortfolioRequest, UpdatePortfolioRequest, GetPortfoliosQuery
│   ├── alert.ts                                                 ← AlertDto, AlertQueryParams, CreateAlertRequest, AlertType enum, AlertCondition enum
│   ├── subscription.ts                                          ← SubscriptionDto, UserSubscriptionDto, SubscriptionStatisticsDto, CustomerRetentionStatisticsDto
│   ├── userManagement.ts                                        ← UserManagementListItem, UserManagementDetail, CurrentVipPackage, UserTransactionDetail
│   ├── systemData.ts                                            ← DataFetchTaskType union, SystemLogItem, GetSystemLogsParams
│   ├── macroeconomicData.ts                                     ← MacroeconomicData, UpsertMacroeconomicDataRequest
│   ├── payment.ts                                               ← PaymentTransactionStatus enum, PaymentLinkResponse, PaymentProviderValue, PaymentStatusResponse, PaymentTransactionDto
│   ├── file.ts                                                  ← CommonStatus enum, FileCategory enum, FileUploadRequest, FileResponse, FileDownloadParams, FileDeleteParams
│   ├── telegram.ts                                              ← TelegramStartLinkDto
│   ├── signalRDebugLog.ts                                       ← SignalRDebugLogEntry, SignalRLogDirection type, SignalRLogExportPayload
│   ├── frontendSystemLog.ts                                     ← FrontendSystemLogEntry, FrontendSystemLogQueryResult
│   └── index.ts                                                 ← Re-export tat ca (khong dinh nghia them)
│
├── constants/
│   ├── colors.ts                                                ← pageBackground, foreground, sidebar, accentGreen, headerGreen
│   ├── endpoints.ts                                             ← API_ENDPOINTS: AUTH, MODULE_LAYOUTS, SYMBOL, SECTORS, MARKET_INDICES, FINANCIAL_REPORTS, ANALYSIS_REPORTS, WATCH_LIST, NEWS, ALERTS, SUBSCRIPTIONS, PAYMENTS, TELEGRAM, DATA_FETCHING, MARKET, PORTFOLIOS, MACROECONOMIC_DATA, FILES
│   ├── routes.ts                                                ← ROUTES.HOME, LOGIN, DASHBOARD, PROFILE, ERROR, SYSTEM_MANAGER
│   ├── smartBoard.ts                                            ← SMART_BOARD_VOLUME_THRESHOLD, SMART_BOARD_LS_FILTERS, PRICE_COLORS, VOLUME_PERIOD_OPTIONS
│   └── index.ts                                                 ← Re-export tat ca + APP_NAME + PAGINATION constants
│
└── lib/
    ├── utils.ts                                                 ← cn(), formatDate(), truncateText(), generateId(), debounce()
    ├── formatters.ts                                            ← [NEW] formatPrice(val), formatVolume(val), formatBillion(val), formatMillion(val)
    ├── authStorage.ts                                           ← AUTH_KEYS set, getAuthStorageItem(key), setAuthStorageItem(key, val), clearAuthStorageItems(), quota management
    └── dashboardStorage.ts                                      ← getDashboardPagesStorage(), setDashboardPagesStorage(pages), getDashboardCurrentPageStorage(), setDashboardCurrentPageStorage(id), removeDashboardPagesStorage(), removeDashboardCurrentPageStorage(), quota fallback to sessionStorage
```

---

## Các Phase thực hiện

### Phase 1: Dọn dẹp cấu trúc App Router

**Mục tiêu**: Di chuyển các pages vào đúng route groups.

- [x] 1.1 Di chuyển `src/app/login/` → `src/app/(public)/login/`
- [x] 1.2 Di chuyển `src/app/verify-email/` → `src/app/(public)/verify-email/`
- [x] 1.3 Di chuyển `src/app/error/` → `src/app/(public)/error/`
- [x] 1.4 Tạo `src/app/(public)/layout.tsx` (minimal, chỉ wrap children)
- [x] 1.5 Di chuyển `src/app/dashboard/` → `src/app/(protected)/dashboard/`
- [x] 1.6 Di chuyển `src/app/profile/` → `src/app/(protected)/profile/`
- [x] 1.7 Tạo `src/app/(protected)/layout.tsx` (auth guard)
- [x] 1.8 Di chuyển `src/app/SystemManager/` → `src/app/(admin)/system-manager/`
- [x] 1.9 Tạo `src/app/(admin)/layout.tsx` (role guard)
- [x] 1.10 Xóa các route group rỗng cũ: `(dashboard)/`, `(admin)/`, `(public)/`
- [x] 1.11 Cập nhật tất cả link/redirect dùng ROUTES constants

**Files bị ảnh hưởng**: `AuthContext.tsx`, `ROUTES`, tất cả `router.push/replace`

---

### Phase 2: Tái tổ chức Services

**Mục tiêu**: Nhóm 30 flat service files vào domain-based subfolders.

- [x] 2.1 Tạo `src/services/auth/authService.ts` (move từ flat)
- [x] 2.2 Tạo `src/services/market/` và move: `symbolService`, `sectorService`, `marketIndexService`, `indexService`, `heatmapService`, `smartBoardService`, `ohlcvService`, `signalRService`, `heatmapSignalRService`, `ohlcvSignalRService`
- [x] 2.3 Tạo `src/services/financial/` và move: `financialReportService`, `macroeconomicDataService`
- [x] 2.4 Tạo `src/services/chat/chatService.ts`
- [x] 2.5 Tạo `src/services/workspace/` và move: `workspaceService`, `layoutService`
- [x] 2.6 Tạo `src/services/notifications/` và move: `alertService`, `telegramService`
- [x] 2.7 Tạo `src/services/reports/` và move: `analysisReportService`, `newsService`
- [x] 2.8 Tạo `src/services/files/fileService.ts`
- [x] 2.9 Tạo `src/services/admin/` và move: `userManagementService`, `subscriptionService`, `systemDataService`, `statisticService`, `paymentService`, `portfolioService`
- [x] 2.10 Giữ `api.ts`, `watchListService.ts`, `frontendSystemLogService.ts`, `signalRDebugLogService.ts` ở root `services/`
- [x] 2.11 Cập nhật tất cả import paths trong toàn bộ `src/` (44 files, 61 replacements)
- [x] 2.12 Xóa các subfolder rỗng cũ: `api/`, `account/`, `realtime/`, `_internal/`

---

### Phase 3: Tái tổ chức Dashboard Modules — Di chuyển vào Features

**Mục tiêu**: Chuyển toàn bộ module implementations từ `src/components/dashboard/modules/` vào `src/features/dashboard/modules/`.

- [ ] 3.1 Tạo cấu trúc `src/features/dashboard/modules/[module-name]/index.ts` cho mỗi module
- [ ] 3.2 Move `VNStockChartModule.tsx` → `features/dashboard/modules/vn-stock-chart/`
- [ ] 3.3 Move `GlobalStockChartModule.tsx` → `features/dashboard/modules/global-stock-chart/`
- [ ] 3.4 Move `HeatmapModule.tsx` → `features/dashboard/modules/heatmap/`
- [ ] 3.5 Move `StockScreenerModule.tsx` + `StockScreener/*.tsx` → `features/dashboard/modules/stock-screener/`
- [ ] 3.6 Move `SmartBoardModule.tsx` + `SmartBoard/SmartBoardFilterBar.tsx` → `features/dashboard/modules/smart-board/`
- [ ] 3.7 Move `FinancialReportModule.tsx` + `FinancialReport/*.tsx` → `features/dashboard/modules/financial-report/`
- [ ] 3.8 Move `FinancialReportProModule.tsx` + `FinancialReportPro/*` → `features/dashboard/modules/financial-report-pro/`
- [ ] 3.9 Move `AiChatModule.tsx` + `DirectChatPanel.tsx` → `features/dashboard/modules/ai-chat/`
- [ ] 3.10 Move `AnalysisReportModule.tsx` → `features/dashboard/modules/analysis-report/`
- [ ] 3.11 Move `NewsModule.tsx` + `News/*.tsx` → `features/dashboard/modules/news/`
- [ ] 3.12 Move `OrderMatchingModule.tsx` → `features/dashboard/modules/order-matching/`
- [ ] 3.13 Move `IndexModule.tsx` + `IndexModule/IndexMiniChart.tsx` → `features/dashboard/modules/index-module/`
- [ ] 3.14 Move `SessionInfoModule.tsx` → `features/dashboard/modules/session-info/`
- [ ] 3.15 Move `CanslimModule.tsx` → `features/dashboard/modules/canslim/`
- [ ] 3.16 Move `OverviewChartModule.tsx` → `features/dashboard/modules/overview-chart/`
- [ ] 3.17 Tạo `features/dashboard/modules/index.ts` re-export tất cả modules
- [ ] 3.18 Move `Sidebar.tsx`, `ModuleSelectorModal.tsx`, `AddPageModal.tsx`, `SymbolSearchBox.tsx`, `ColumnSidebar.tsx`, `ColumnManagerDialog.tsx` → `features/dashboard/components/`
- [ ] 3.19 Move `layout/` sub-folder → `features/dashboard/components/layout/`
- [ ] 3.20 Cập nhật `src/app/(protected)/dashboard/page.tsx` dùng import từ `@/features/dashboard/modules`
- [ ] 3.21 Xóa `src/components/dashboard/` sau khi hoàn tất

---

### Phase 4: Tái tổ chức Admin Feature

**Mục tiêu**: Chuyển `src/components/staff/` vào `src/features/admin/`.

- [ ] 4.1 Move `src/components/staff/StaffSidebar.tsx` → `src/features/admin/components/`
- [ ] 4.2 Move tất cả `src/components/staff/*.tsx` và subdirs → `src/features/admin/components/`
- [ ] 4.3 Xóa `src/components/staff/` sau khi hoàn tất
- [ ] 4.4 Xóa các feature folder stub rỗng: `src/features/reports/`, `src/features/files/`, `src/features/staff/` (cũ)
- [ ] 4.5 Cập nhật import trong các page `src/app/(admin)/system-manager/*`

---

### Phase 5: Tách logic ra khỏi Components — Custom Hooks

**Mục tiêu**: Đảm bảo mỗi module component < 200 dòng, logic ở hook riêng.

- [ ] 5.1 **VNStockChartModule** (~600 dòng): Tạo `useVNStockChart.ts` — chart init, OHLCV fetch, indicator management, symbol state
- [ ] 5.2 **HeatmapModule** (~500 dòng): Tạo `useHeatmap.ts` — exchange/sector/watchlist state, SignalR subscription, ECharts data transform
- [ ] 5.3 **SmartBoardModule** (~400 dòng): Tạo `useSmartBoard.ts` — filter state, sector grouping, volume threshold, SignalR
- [ ] 5.4 **AiChatModule** (~400 dòng): Tạo `useAiChat.ts` — session management, message sending, markdown rendering helpers
- [ ] 5.5 **AnalysisReportModule** (~350 dòng): Tạo `useAnalysisReport.ts` — pagination, filter state, PDF loading
- [ ] 5.6 **StockScreenerModule** (~700 dòng): Hook `useStockScreener` đã có ở `src/hooks/` — di chuyển vào `features/dashboard/modules/stock-screener/` và kết nối đúng
- [ ] 5.7 **DashboardLayout** (`layout.tsx` ~600 dòng): Tạo `useDashboardPages.ts` và `useWorkspaceSync.ts` trong `features/dashboard/hooks/`

---

### Phase 6: Tái tổ chức Types

**Mục tiêu**: Loại bỏ định nghĩa trùng, cấu trúc sạch hơn.

- [x] 6.1 Tạo `src/types/api.ts` — chứa `ApiResponse<T>`, `PaginatedData<T>`, `PaginatedResponse<T>`
- [x] 6.2 Xóa định nghĩa `ApiResponse` trùng trong `src/types/symbol.ts`
- [x] 6.3 Xóa định nghĩa `User` trùng trong `src/types/index.ts` (giữ trong `types/auth.ts`)
- [x] 6.4 Cập nhật `src/types/index.ts` — chỉ re-export, không định nghĩa gì
- [x] 6.5 Xóa `src/types/style-imports.ts` — thêm `declare module "*.css"` vào `declarations.d.ts`

---

### Phase 7: Dọn dẹp Stores

**Mục tiêu**: Xóa empty subdirs, thêm barrel index.

- [x] 7.1 Xóa `src/stores/market/`, `stores/ui/`, `stores/account/` (tất cả rỗng)
- [x] 7.2 Tạo `src/stores/index.ts` — re-export tất cả stores

---

### Phase 8: Dọn dẹp Lib

**Mục tiêu**: Xóa empty subdirs, tách formatters.

- [x] 8.1 Xóa `src/lib/color/`, `src/lib/storage/` (rỗng) + Xóa `src/providers/` (rỗng)
- [x] 8.2 Tạo `src/lib/formatters.ts` — `formatStockPrice`, `formatVolume`, `formatCurrency`, `formatNumber`, `formatMillion`, `formatBillion`
- [x] 8.3 Xóa `src/providers/` (rỗng)

---

### Phase 9: Chuẩn hóa Exports và Constants

**Mục tiêu**: Nhất quán named exports, constants đầy đủ.

- [ ] 9.1 Thêm `src/hooks/index.ts` — re-export tất cả shared hooks
- [ ] 9.2 Thêm `src/contexts/index.ts` — re-export tất cả contexts
- [ ] 9.3 Cập nhật `src/constants/index.ts` — export đầy đủ (bổ sung colors, smartBoard)
- [ ] 9.4 Chuyển tất cả module components từ `export default function` → `export function` (named export)
- [ ] 9.5 Kiểm tra `src/components/ui/index.ts` — đảm bảo re-export đủ
- [ ] 9.6 Thêm `src/features/dashboard/modules/index.ts` — re-export tất cả modules

---

### Phase 10: Kiểm tra lỗi và hoàn thiện

- [ ] 10.1 Chạy `npx tsc --noEmit` — sửa tất cả TypeScript errors
- [ ] 10.2 Chạy `npm run build` — đảm bảo Next.js build thành công
- [ ] 10.3 Chạy `npm run lint` — sửa ESLint warnings
- [ ] 10.4 Kiểm tra routing trên trình duyệt: `/`, `/login`, `/dashboard`, `/profile`, `/system-manager`
- [ ] 10.5 Kiểm tra SignalR reconnect sau khi refactor
- [ ] 10.6 Xóa tất cả empty folders còn lại

---

## Thứ tự thực hiện và phụ thuộc

```
Phase 1 (Routes)   [song song với Phase 7, 8]
Phase 2 (Services) → Phase 3, 4 (Features) [Phase 2 trước]
Phase 3 (Modules)  → Phase 5 (Hooks) [Phase 3 trước]
Phase 6 (Types)    [bất kỳ lúc nào]
Phase 9 (Exports)  → Phase 10 (Verify) [cuối cùng]
```

**Thứ tự được đề xuất:**
1. Phase 6 (Types) — ít risk nhất, không break runtime
2. Phase 7 + Phase 8 (Stores + Lib cleanup) — chỉ xóa empty dirs
3. Phase 2 (Services) — cẩn thận update imports
4. Phase 1 (Routes) — test routing sau mỗi bước
5. Phase 3 (Modules) — lớn nhất, làm từng module một
6. Phase 4 (Admin) — follow Phase 3
7. Phase 5 (Hooks extraction) — sau khi cấu trúc ổn định
8. Phase 9 (Exports chuẩn hóa)
9. Phase 10 (Verify)

---

## Rủi ro và lưu ý

| Rủi ro | Giải pháp |
|--------|-----------|
| Import paths bị break sau khi move files | Dùng VS Code "Move file" để auto-update imports |
| Next.js route không nhận route groups mới | Test ngay sau Phase 1 bằng `npm run dev` |
| SignalRService singleton bị reset | Kiểm tra singleton pattern sau Phase 2 |
| `export default` → `export function` làm break `next/dynamic` | Kiểm tra `next/dynamic` usage trong page.tsx |
| localStorage keys cũ không còn match | Không thay đổi LS key names — chỉ move code |

---

## Decisions

- **Giữ `contexts/` tên gốc** thay vì đổi sang `providers/` — tránh nhầm lẫn với `src/providers/` rỗng
- **`src/services/api.ts` giữ ở root** thay vì `api/client.ts` — file này được import ở mọi nơi, đổi path gây risk cao
- **`useStockScreener` move vào module folder** — hook này là module-specific, không phải shared hook
- **Không dùng barrel `index.ts` cho services** — tránh circular imports, import trực tiếp từ file
- **`src/components/ui/` giữ nguyên** — đây là genuinely shared UI, không thuộc feature nào

---

## Open Questions

- [?] `TradingViewWidget.tsx` và `TradingMapModule.tsx` — không được mount trong `dashboard/page.tsx`. Xóa hay giữ?
- [?] `FAAdvisorModule.tsx` và `TAAdvisorModule.tsx` — bị comment out trong page.tsx. Xóa hay giữ dưới `modules/legacy/`?
- [?] `OverviewChartModule.tsx` — không thấy trong module list của `dashboard/page.tsx`. Tương tự?
- [?] `src/features/dashboard/analysis-report-search/` — folder lạc trong features/dashboard/. Cần xác định rồi merge vào đúng chỗ.
