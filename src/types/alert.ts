export interface AlertDto {
  id: number;
  userId: string;
  ticker: string;
  type: number;
  condition: number;
  changePercentage: number | null;
  thresholdValue: number | null;
  name: string | null;
  isActive: boolean;
  isTriggered: boolean;
  lastTriggeredAt: string | null;
  chatSessionId: number | null;
  messageTemplate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertRequest {
  ticker: string;
  type: number;
  condition: number;
  changePercentage?: number | null;
  thresholdValue?: number | null;
  name?: string | null;
  isActive?: boolean;
  chatSessionId?: number | null;
  messageTemplate?: string | null;
}

export interface AlertQueryParams {
  pageIndex?: number;
  pageSize?: number;
  type?: number;
  condition?: number;
}

export const AlertTypeType = {
  Price: 1,
  Volume: 2,
} as const;

export type AlertTypeValue = (typeof AlertTypeType)[keyof typeof AlertTypeType];

export const AlertConditionType = {
  Above: 1,
  Below: 2,
  PercentChangeUp: 3,
  PercentChangeDown: 4,
} as const;

export type AlertConditionValue =
  (typeof AlertConditionType)[keyof typeof AlertConditionType];