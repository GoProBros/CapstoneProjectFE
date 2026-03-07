export interface PaymentLinkResponse {
  checkoutUrl: string;
  orderCode: number;
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
