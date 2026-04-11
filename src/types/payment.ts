export interface PaymentLinkResponse {
  checkoutUrl: string;
  orderCode: number;
}

/** 0 = Pending, 1 = Completed, 2 = Cancelled, 3 = Expired */
export const PaymentTransactionStatus = {
  Pending: 0,
  Completed: 1,
  Cancelled: 2,
  Expired: 3,
} as const;

export type PaymentTransactionStatusValue =
  (typeof PaymentTransactionStatus)[keyof typeof PaymentTransactionStatus];

export interface PaymentStatusResponse {
  orderCode: number;
  amount: number;
  status: PaymentTransactionStatusValue;
  statusName: string;
  paymentProvider: PaymentProviderValue;
  paymentProviderName: string;
  subscriptionId: number;
  subscriptionName: string;
  createdAt: string;
}

export interface CreatePaymentLinkRequest {
  subscriptionId: number;
  paymentProvider: number;
}

/** 1 = PayOS, 2 = Momo */
export const PaymentProviderType = {
  PayOS: 1,
  Momo: 2,
} as const;

export type PaymentProviderValue = (typeof PaymentProviderType)[keyof typeof PaymentProviderType];
