/**
 * News Service
 * Handles API calls for news list and details
 */

import { get, post } from './api';
import { API_ENDPOINTS } from '@/constants';
import type { PaginatedData } from '@/types';
import type { NewsArticle, NewsQueryParams } from '@/types/news';

export interface ImportNewsFromRssResult {
  fetchedCount: number;
  insertedCount: number;
  duplicatedCount: number;
  message: string;
}

const normalizeTickerScores = (scores: NewsArticle['tickerScores'] | null | undefined): NewsArticle['tickerScores'] => {
  if (!Array.isArray(scores)) return [];

  return scores
    .filter((score) => typeof score?.ticker === 'string' && score.ticker.trim().length > 0)
    .map((score) => ({
      ticker: score.ticker.trim().toUpperCase(),
      relevanceScore: typeof score.relevanceScore === 'number' ? score.relevanceScore : null,
      sentimentScore: typeof score.sentimentScore === 'number' ? score.sentimentScore : null,
    }));
};

const normalizeNewsArticle = (article: NewsArticle): NewsArticle => {
  const tickerScores = normalizeTickerScores(article.tickerScores);
  const tickersFromScores = tickerScores.map((score) => score.ticker);

  return {
    id: article.id,
    title: article.title ?? '',
    summary: article.summary ?? null,
    link: article.link ?? null,
    source: article.source ?? null,
    thumbnailUrl: article.thumbnailUrl ?? null,
    publishedAt: article.publishedAt,
    tickers: Array.isArray(article.tickers) && article.tickers.length > 0
      ? article.tickers.map((ticker) => ticker.toUpperCase())
      : tickersFromScores,
    tickerScores,
  };
};

const ensureNonNegativeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value);
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return 0;
};

const normalizeImportNewsData = (data: unknown): Omit<ImportNewsFromRssResult, 'message'> => {
  if (!data || typeof data !== 'object') {
    return {
      fetchedCount: 0,
      insertedCount: 0,
      duplicatedCount: 0,
    };
  }

  const record = data as Record<string, unknown>;

  return {
    fetchedCount: ensureNonNegativeNumber(record.fetchedCount ?? record.FetchedCount),
    insertedCount: ensureNonNegativeNumber(record.insertedCount ?? record.InsertedCount),
    duplicatedCount: ensureNonNegativeNumber(record.duplicatedCount ?? record.DuplicatedCount),
  };
};

export const newsService = {
  async getNews(params: NewsQueryParams): Promise<PaginatedData<NewsArticle>> {
    try {
      const queryParams = new URLSearchParams({
        PageIndex: String(params.pageIndex),
        PageSize: String(params.pageSize),
      });

      if (params.search) queryParams.append('Search', params.search);
      if (params.ticker) queryParams.append('Ticker', params.ticker);

      const endpoint = `${API_ENDPOINTS.NEWS.BASE}?${queryParams.toString()}`;
      const response = await get<PaginatedData<NewsArticle>>(endpoint);

      if (response.isSuccess && response.data) {
        const payload = response.data;
        return {
          items: Array.isArray(payload.items)
            ? payload.items.map((article) => normalizeNewsArticle(article))
            : [],
          pageIndex: payload.pageIndex,
          totalPages: payload.totalPages,
          totalCount: payload.totalCount,
          hasPreviousPage: payload.hasPreviousPage,
          hasNextPage: payload.hasNextPage,
        };
      }

      throw new Error(response.message || 'Không thể tải danh sách tin tức');
    } catch (error) {
      console.error('[NewsService] Error fetching news list:', error);
      throw error;
    }
  },

  async getNewsById(id: number): Promise<NewsArticle> {
    try {
      const response = await get<NewsArticle>(API_ENDPOINTS.NEWS.BY_ID(id));

      if (response.isSuccess && response.data) {
        return normalizeNewsArticle(response.data);
      }

      throw new Error(response.message || `Không thể tải chi tiết tin tức ${id}`);
    } catch (error) {
      console.error(`[NewsService] Error fetching news detail ${id}:`, error);
      throw error;
    }
  },

  async importNewsFromRss(): Promise<ImportNewsFromRssResult> {
    try {
      const response = await post<unknown>(API_ENDPOINTS.DATA_FETCHING.IMPORT_NEWS_FROM_RSS, {});

      if (!response.isSuccess) {
        throw new Error(response.message || 'Không thể thu thập tin tức từ RSS');
      }

      return {
        ...normalizeImportNewsData(response.data),
        message: response.message || 'Thu thập tin tức thành công.',
      };
    } catch (error) {
      console.error('[NewsService] Error importing news from RSS:', error);
      throw error;
    }
  },
};

export default newsService;
