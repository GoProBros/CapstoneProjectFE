/**
 * Shared number/price/volume formatters for Vietnamese stock market data.
 *
 * Usage: import { formatStockPrice, formatVolume, formatCurrency, formatNumber, formatMillion, formatBillion } from '@/lib/formatters';
 */

/**
 * Format a raw SSI stock price (stored as price * 1000) to a display value.
 * e.g. 68200 → "68.20"
 */
export function formatStockPrice(price: number): string {
  return (price / 1000).toFixed(2);
}

/**
 * Format a volume number with Vietnamese short suffixes.
 * e.g. 1_500_000 → "1.5tr" | 50_000 → "50ng" | 500 → "500"
 */
export function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}tr`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(0)}ng`;
  return String(volume);
}

/**
 * Format a price/amount in Vietnamese Dong (VND) currency.
 * e.g. 1200000 → "1.200.000 ₫"
 */
export function formatCurrency(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

/**
 * Format a number with vi-VN locale, configurable decimal places.
 * e.g. formatNumber(1234.567, 2) → "1.234,57"
 */
export function formatNumber(n: number, dp = 2): string {
  return n.toLocaleString('vi-VN', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

/**
 * Format a number divided by 1,000,000 with 3 decimal places (triệu).
 * e.g. formatMillion(2_345_678_000) → "2.345,678"
 */
export function formatMillion(n: number): string {
  return (n / 1_000_000).toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

/**
 * Format a number divided by 1,000,000,000 with 3 decimal places (tỷ).
 * e.g. formatBillion(2_345_678_000_000) → "2.345,678"
 */
export function formatBillion(n: number): string {
  return (n / 1_000_000_000).toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
