/**
 * News TypeScript types
 * Mirrors GreenDragonTrading.Application.DTOs.NewsArticleDto
 */

export interface NewsTickerScore {
  ticker: string;
  relevanceScore: number | null;
  sentimentScore: number | null;
}

export interface NewsArticle {
  id: number;
  title: string;
  summary: string | null;
  link: string | null;
  source: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
  tickers: string[];
  tickerScores: NewsTickerScore[];
}

export interface NewsQueryParams {
  pageIndex: number;
  pageSize: number;
  search?: string;
  ticker?: string;
}
