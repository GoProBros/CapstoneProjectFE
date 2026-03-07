import { post } from '@/services/api';
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
