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

export function formatCurrencyVnd(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString('vi-VN');
}

export function getStatusLabel(status: number): string {
    return status === 1 ? 'Hoạt động' : 'Ngưng hoạt động';
}

export function getTransactionSideLabel(side: number): string {
    return side === 1 ? 'Mua' : 'Bán';
}

export function getPaymentProviderLabel(provider: number): string {
    return provider === 2 ? 'MoMo' : 'PayOS';
}

export function getPaymentStatusLabel(status: number): string {
    const labels: Record<number, string> = {
        0: 'Chờ xử lý',
        1: 'Hoàn thành',
        2: 'Đã hủy',
        3: 'Hết hạn',
    };

    return labels[status] ?? `Trạng thái ${status}`;
}

export function getAlertTypeLabel(type: number): string {
    return type === 2 ? 'Khối lượng' : 'Giá';
}

export function getAlertConditionLabel(condition: number): string {
    const labels: Record<number, string> = {
        1: 'Trên ngưỡng',
        2: 'Dưới ngưỡng',
        3: 'Tăng %',
        4: 'Giảm %',
    };

    return labels[condition] ?? `Điều kiện ${condition}`;
}

export function getAlertStatusLabel(isActive: boolean): string {
    return isActive ? 'Đang kích hoạt' : 'Đã tắt';
}

export function normalizeProfileRole(role: string | null | undefined): string {
    return role?.trim().toLowerCase() ?? '';
}

export function canViewProfileTransactions(role: string | null | undefined): boolean {
    const normalizedRole = normalizeProfileRole(role);

    return normalizedRole !== 'admin' &&
        normalizedRole !== 'staff' &&
        normalizedRole !== 'quản trị viên' &&
        normalizedRole !== 'nhân viên';
}

export function sortActiveFirst<T extends { status: number; createdAt?: string }>(items: T[]): T[] {
    return [...items].sort((left, right) => {
        if (right.status !== left.status) {
            return right.status - left.status;
        }

        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
    });
}

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
