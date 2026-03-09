import { post, get } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type { PaymentLinkResponse, PaymentProviderValue } from '@/types/payment';

/**
 * Create a payment link for a subscription
 * @param subscriptionId - The subscription package ID
 * @param paymentProvider - 1 = PayOS, 2 = Momo
 * @returns CheckoutUrl and OrderCode
 */
export async function createPaymentLink(
  subscriptionId: number,
  paymentProvider: PaymentProviderValue,
): Promise<PaymentLinkResponse> {
  const result = await post<PaymentLinkResponse>(API_ENDPOINTS.PAYMENTS.CREATE_LINK, {
    subscriptionId,
    paymentProvider,
  });
  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không thể tạo liên kết thanh toán');
  }
  return result.data;
}

/**
 * Manually sync a Momo payment (useful in sandbox where IPN may not fire).
 * On success, the backend activates the subscription.
 */
export async function syncMomoPayment(orderCode: number): Promise<void> {
  await post(API_ENDPOINTS.PAYMENTS.MOMO_SYNC(orderCode), {});
}

/**
 * Check PayOS payment status.
 * @returns true if the payment was completed successfully
 */
export async function getPaymentStatus(orderCode: number): Promise<boolean> {
  const result = await get<{ isSuccess: boolean }>(API_ENDPOINTS.PAYMENTS.STATUS(orderCode));
  return result.isSuccess;
}
