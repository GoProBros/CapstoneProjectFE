import { FinancialPeriodType } from '@/types/financialReport';

export type JsonRecord = Record<string, unknown>;

export interface EditableMetricRow {
  id: string;
  path: string[];
  groupLabel: string;
  subGroupLabel: string;
  metricLabel: string;
  valueInDong: number;
  inputValueInBillion: string;
}

export interface SubGroupNode {
  key: string;
  subGroupLabel: string;
  rows: EditableMetricRow[];
}

export interface GroupNode {
  key: string;
  groupLabel: string;
  subGroups: SubGroupNode[];
}

export interface QuarterOption {
  value: FinancialPeriodType;
  label: string;
}

export interface CreateFinancialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}
