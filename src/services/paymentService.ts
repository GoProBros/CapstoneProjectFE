import { post, get } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import {
  PaymentTransactionStatus,
  type PaymentLinkResponse,
  type PaymentProviderValue,
  type PaymentStatusResponse,
  type PaymentTransactionDto,
} from '@/types/payment';
import type { PaginatedData } from '@/types';

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
 * @returns Payment status details from backend
 */
export async function getPaymentStatus(orderCode: number): Promise<PaymentStatusResponse> {
  const result = await get<PaymentStatusResponse>(API_ENDPOINTS.PAYMENTS.STATUS(orderCode));
  if (!result.data) {
    throw new Error(result.message || 'Không lấy được trạng thái thanh toán');
  }
  return result.data;
}

export interface MyTransactionsQuery {
  pageIndex?: number;
  pageSize?: number;
  status?: number;
  paymentProvider?: number;
}

export async function getMyTransactions(
  query: MyTransactionsQuery,
): Promise<PaginatedData<PaymentTransactionDto>> {
  const params = new URLSearchParams();
  params.set('PageIndex', String(query.pageIndex ?? 1));
  params.set('PageSize', String(query.pageSize ?? 10));

  if (query.status !== undefined) {
    params.set('Status', String(query.status));
  }

  if (query.paymentProvider !== undefined) {
    params.set('PaymentProvider', String(query.paymentProvider));
  }

  const result = await get<PaginatedData<PaymentTransactionDto>>(
    `${API_ENDPOINTS.PAYMENTS.MY_TRANSACTIONS}?${params.toString()}`,
  );

  if (!result.data) {
    throw new Error(result.message || 'Không lấy được lịch sử giao dịch');
  }

  return result.data;
}

interface WaitForPaymentCompletionOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
}

/**
 * Poll payment status for a short period because PayOS may return before webhook updates transaction state.
 */
export async function waitForPaymentCompletion(
  orderCode: number,
  options?: WaitForPaymentCompletionOptions,
): Promise<PaymentStatusResponse> {
  const timeoutMs = options?.timeoutMs ?? 15_000;
  const pollIntervalMs = options?.pollIntervalMs ?? 2_000;
  const startTime = Date.now();

  while (true) {
    const status = await getPaymentStatus(orderCode);
    if (status.status !== PaymentTransactionStatus.Pending) {
      return status;
    }

    if (Date.now() - startTime >= timeoutMs) {
      return status;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, pollIntervalMs);
    });
  }
}
