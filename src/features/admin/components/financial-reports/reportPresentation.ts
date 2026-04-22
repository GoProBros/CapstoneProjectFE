import { FinancialPeriodType, FinancialReportStatus } from '@/types/financialReport';

export function getPeriodLabel(year: number, period: FinancialPeriodType): string {
  switch (period) {
    case FinancialPeriodType.FirstQuarter:
      return `Quý 1/${year}`;
    case FinancialPeriodType.SecondQuarter:
      return `Quý 2/${year}`;
    case FinancialPeriodType.ThirdQuarter:
      return `Quý 3/${year}`;
    case FinancialPeriodType.FourthQuarter:
      return `Quý 4/${year}`;
    case FinancialPeriodType.YearToDate:
      return `Năm ${year}`;
    default:
      return `${year}`;
  }
}

export function getStatusLabel(status: FinancialReportStatus): string {
  switch (status) {
    case FinancialReportStatus.Pending:
      return 'Chờ xử lý';
    case FinancialReportStatus.Processing:
      return 'Đang xử lý';
    case FinancialReportStatus.Completed:
      return 'Hoàn thành';
    case FinancialReportStatus.Failed:
      return 'Thất bại';
    case FinancialReportStatus.Archived:
      return 'Lưu trữ';
    default:
      return 'Không xác định';
  }
}

export function getStatusClass(status: FinancialReportStatus): string {
  switch (status) {
    case FinancialReportStatus.Pending:
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    case FinancialReportStatus.Processing:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case FinancialReportStatus.Completed:
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case FinancialReportStatus.Failed:
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    case FinancialReportStatus.Archived:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
}

export function formatDateTime(date?: string): string {
  if (!date) {
    return '--';
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  return parsed.toLocaleString('vi-VN');
}
