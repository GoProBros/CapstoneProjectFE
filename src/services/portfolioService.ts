import { API_ENDPOINTS } from '@/constants';
import { del, get, patch, post, put } from '@/services/api';
import type { PaginatedData } from '@/types';
import type {
  CreatePortfolioRequest,
  CreateTradingTransactionRequest,
  PortfolioOverallFilterValue,
  PortfolioDto,
  TradingTransactionDto,
  UpdateInvestmentCapitalRequest,
  UpdatePortfolioRequest,
  UserInvestmentCapitalDto,
} from '@/types/portfolio';

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

export interface GetPortfoliosQuery {
  pageIndex?: number;
  pageSize?: number;
  ticker?: string;
  overallFilter?: PortfolioOverallFilterValue;
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

export async function getPortfolios(query: GetPortfoliosQuery = {}): Promise<PaginatedData<PortfolioDto>> {
  const params = new URLSearchParams();
  params.set('pageIndex', String(query.pageIndex ?? 1));
  params.set('pageSize', String(query.pageSize ?? 10));

  if (query.ticker && query.ticker.trim().length > 0) {
    params.set('ticker', query.ticker.trim());
  }

  if (query.overallFilter !== undefined) {
    params.set('overallFilter', String(query.overallFilter));
  }

  const result = await get<BackendPaginatedData<PortfolioDto>>(
    `${API_ENDPOINTS.PORTFOLIOS.BASE}?${params.toString()}`,
  );

  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không lấy được danh sách portfolio');
  }

  return normalizePaginatedData(result.data);
}

export async function getPortfolioById(id: number): Promise<PortfolioDto> {
  const result = await get<PortfolioDto>(API_ENDPOINTS.PORTFOLIOS.BY_ID(id));

  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không lấy được thông tin portfolio');
  }

  return result.data;
}

export async function createPortfolio(payload: CreatePortfolioRequest): Promise<PortfolioDto> {
  const result = await post<PortfolioDto>(API_ENDPOINTS.PORTFOLIOS.BASE, payload);

  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không thể tạo portfolio');
  }

  return result.data;
}

export async function updatePortfolio(payload: UpdatePortfolioRequest): Promise<PortfolioDto> {
  const result = await put<PortfolioDto>(API_ENDPOINTS.PORTFOLIOS.BY_ID(payload.id), {
    id: payload.id,
    ticker: payload.ticker,
    name: payload.name,
    description: payload.description,
    status: payload.status,
  });

  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không thể cập nhật portfolio');
  }

  return result.data;
}

export async function deletePortfolio(id: number): Promise<void> {
  const result = await del<null>(API_ENDPOINTS.PORTFOLIOS.BY_ID(id));

  if (!result.isSuccess) {
    throw new Error(result.message || 'Không thể xóa portfolio');
  }
}

export async function createTradingTransaction(
  portfolioId: number,
  payload: CreateTradingTransactionRequest,
): Promise<TradingTransactionDto> {
  const result = await post<TradingTransactionDto>(API_ENDPOINTS.PORTFOLIOS.TRANSACTIONS(portfolioId), {
    ...payload,
    originalMessage: payload.originalMessage ?? null,
  });

  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không thể tạo giao dịch');
  }

  return result.data;
}

export async function updateMyInvestmentCapital(
  payload: UpdateInvestmentCapitalRequest,
): Promise<UserInvestmentCapitalDto> {
  const result = await patch<UserInvestmentCapitalDto>(API_ENDPOINTS.PORTFOLIOS.INVESTMENT_CAPITAL, payload);

  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không thể cập nhật vốn khả dụng');
  }

  return result.data;
}