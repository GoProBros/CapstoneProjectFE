export const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export const levelOrderLabel = (level: number) => {
    const map: Record<number, string> = { 0: 'Free', 1: 'Advanced', 2: 'VIP 1', 3: 'VIP 2', 4: 'VIP 3' };
    return map[level] ?? `Level ${level}`;
};

export const MODULE_LABELS: Record<string, string> = {
    watchList: 'Danh sách theo dõi',
    chart: 'Biểu đồ',
    orderBook: 'Sổ lệnh',
    screener: 'Lọc cổ phiếu',
    heatmap: 'Heatmap',
    financialReport: 'Báo cáo tài chính',
    analysisReport: 'Phân tích',
    news: 'Tin tức',
    portfolio: 'Danh mục đầu tư',
};

export function parseAllowedModules(raw: unknown): string[] {
    if (!raw) return [];
    const arr = Array.isArray(raw)
        ? raw
        : typeof raw === 'object' &&
          raw !== null &&
          Array.isArray((raw as Record<string, unknown>).modules)
        ? ((raw as Record<string, unknown>).modules as unknown[])
        : null;
    if (!arr) return [];
    return arr
        .map(m => {
            if (typeof m === 'string') return MODULE_LABELS[m] ?? m;
            if (typeof m === 'object' && m !== null) {
                const obj = m as Record<string, unknown>;
                const key = String(obj.id ?? obj.name ?? obj.moduleId ?? '');
                return MODULE_LABELS[key] ?? key;
            }
            return String(m);
        })
        .filter(Boolean);
}
