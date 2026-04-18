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

interface BackendPaginatedData<T> {
  items?: T[];
  pageIndex?: number;
  totalPages?: number;
  totalCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
  Items?: T[];
  PageIndex?: number;
  TotalPages?: number;
  TotalCount?: number;
  HasPreviousPage?: boolean;
  HasNextPage?: boolean;
}

function normalizePaginatedData<T>(payload: BackendPaginatedData<T>): PaginatedData<T> {
  return {
    items: payload.items ?? payload.Items ?? [],
    pageIndex: payload.pageIndex ?? payload.PageIndex ?? 1,
    totalPages: payload.totalPages ?? payload.TotalPages ?? 1,
    totalCount: payload.totalCount ?? payload.TotalCount ?? 0,
    hasPreviousPage: payload.hasPreviousPage ?? payload.HasPreviousPage ?? false,
    hasNextPage: payload.hasNextPage ?? payload.HasNextPage ?? false,
  };
}

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
 * Manually sync payment status by order code.
 */
export async function syncPayment(orderCode: number): Promise<void> {
  await post(API_ENDPOINTS.PAYMENTS.SYNC(orderCode), {});
}

/**
 * Backward-compatible wrapper.
 */
export async function syncMomoPayment(orderCode: number): Promise<void> {
  await syncPayment(orderCode);
}

/**
 * Check PayOS payment status.
 * @returns Payment status details from backend
 */
export async function getPaymentStatus(orderCode: number): Promise<PaymentStatusResponse> {
  const result = await get<PaymentStatusResponse>(API_ENDPOINTS.PAYMENTS.STATUS(orderCode));
  if (!result.isSuccess || !result.data) {
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

  const result = await get<BackendPaginatedData<PaymentTransactionDto>>(
    `${API_ENDPOINTS.PAYMENTS.MY_TRANSACTIONS}?${params.toString()}`,
  );

  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không lấy được lịch sử giao dịch');
  }

  return normalizePaginatedData(result.data);
}

export async function getLatestMyTransaction(): Promise<PaymentTransactionDto | null> {
  const paginated = await getMyTransactions({
    pageIndex: 1,
    pageSize: 1,
  });

  return paginated.items[0] ?? null;
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
