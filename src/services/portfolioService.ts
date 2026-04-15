import { API_ENDPOINTS } from '@/constants';
import { del, get, post, put } from '@/services/api';
import type {
  CreatePortfolioRequest,
  CreateTradingTransactionRequest,
  PortfolioDto,
  TradingTransactionDto,
  UpdatePortfolioRequest,
} from '@/types/portfolio';

export async function getPortfolios(): Promise<PortfolioDto[]> {
  const result = await get<PortfolioDto[]>(API_ENDPOINTS.PORTFOLIOS.BASE);

  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không lấy được danh sách portfolio');
  }

  return result.data;
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
  const result = await post<TradingTransactionDto>(API_ENDPOINTS.PORTFOLIOS.TRANSACTIONS(portfolioId), payload);

  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Không thể tạo giao dịch');
  }

  return result.data;
}