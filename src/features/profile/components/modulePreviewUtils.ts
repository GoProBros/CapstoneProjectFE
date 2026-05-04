export interface ModulePreviewItem {
  key: string;
  label: string;
  preview: string | null;
}

const MODULE_UI_TITLES: Record<string, string> = {
  'smart-board': 'Bảng Điện Thông Minh',
  index: 'Chỉ số thị trường',
  'vn-stock-chart': 'Biểu đồ chứng khoán việt nam',
  'global-stock-chart': 'Biểu đồ chứng khoán thế giới',
  'financial-report': 'Báo cáo tài chính',
  'financial-report-pro': 'Báo cáo tài chính - Pro',
  news: 'Tin tức',
  'session-info': '3 Bước Giá',
  'order-matching': 'Khớp lệnh',
  canslim: 'Canslim',
  'stock-screener': 'Bảng điện chứng khoán',
  heatmap: 'Heatmap - Bản đồ nhiệt',
  'analysis-report': 'Báo cáo phân tích',
  'ai-chat': 'Trò chuyện',

  // Aliases from subscription payload variants
  financialReport: 'Báo cáo tài chính',
  orderBook: 'Khớp lệnh',
  screener: 'Bảng điện chứng khoán',
  analysisReport: 'Báo cáo phân tích',
  chart: 'Biểu đồ chứng khoán việt nam',
  watchList: 'Bảng Điện Thông Minh',
};

export const MODULE_PREVIEW_MAP: Record<string, string> = {
  'smart-board': '/assets/Dashboard/ModulePreviews/smart-stock-screener.png',
  index: '/assets/Dashboard/ModulePreviews/market-index.png',
  'vn-stock-chart': '/assets/Dashboard/ModulePreviews/vn-stock-chart.png',
  'global-stock-chart': '/assets/Dashboard/ModulePreviews/global-stock-chart.png',
  'financial-report': '/assets/Dashboard/ModulePreviews/financial-report.png',
  financialReport: '/assets/Dashboard/ModulePreviews/financial-report.png',
  'financial-report-pro': '/assets/Dashboard/ModulePreviews/financial-report-pro.png',
  news: '/assets/Dashboard/ModulePreviews/news.png',
  'session-info': '/assets/Dashboard/ModulePreviews/session-info.png',
  'order-matching': '/assets/Dashboard/ModulePreviews/order-matching.png',
  orderBook: '/assets/Dashboard/ModulePreviews/order-matching.png',
  canslim: '/assets/Dashboard/ModulePreviews/canslim.png',
  'stock-screener': '/assets/Dashboard/ModulePreviews/stock-screener.png',
  screener: '/assets/Dashboard/ModulePreviews/stock-screener.png',
  heatmap: '/assets/Dashboard/ModulePreviews/heatmap.png',
  'analysis-report': '/assets/Dashboard/ModulePreviews/analysis-report.png',
  analysisReport: '/assets/Dashboard/ModulePreviews/analysis-report.png',
  'ai-chat': '/assets/Dashboard/ModulePreviews/AIAssistantModule.jpg',
  chart: '/assets/Dashboard/ModulePreviews/vn-stock-chart.png',
  watchList: '/assets/Dashboard/ModulePreviews/smart-stock-screener.png',
};

export function normalizeAllowedModulesWithPreview(raw: unknown): ModulePreviewItem[] {
  if (!raw) return [];

  const arr = Array.isArray(raw)
    ? raw
    : typeof raw === 'object' &&
        raw !== null &&
        Array.isArray((raw as Record<string, unknown>).modules)
      ? ((raw as Record<string, unknown>).modules as unknown[])
      : null;

  if (!arr) return [];

  const items = arr.map((item) => {
    if (typeof item === 'string') {
      return {
        key: item,
        label: MODULE_UI_TITLES[item] ?? item,
        preview: MODULE_PREVIEW_MAP[item] ?? null,
      };
    }

    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      const key = String(obj.id ?? obj.moduleId ?? obj.name ?? '').trim();
      const label = (MODULE_UI_TITLES[key] ?? key) || 'Không xác định';

      return {
        key,
        label,
        preview: MODULE_PREVIEW_MAP[key] ?? null,
      };
    }

    const fallback = String(item);
    return {
      key: fallback,
      label: MODULE_UI_TITLES[fallback] ?? fallback,
      preview: MODULE_PREVIEW_MAP[fallback] ?? null,
    };
  });

  const deduped = new Map<string, ModulePreviewItem>();
  items.forEach((moduleItem) => {
    const dedupeKey = `${moduleItem.key}::${moduleItem.label}`;
    if (!deduped.has(dedupeKey)) {
      deduped.set(dedupeKey, moduleItem);
    }
  });

  return Array.from(deduped.values());
}
