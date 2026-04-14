"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { newsService } from '@/services/newsService';
import type { NewsArticle, NewsTickerScore } from '@/types/news';

const NEWS_PAGE_SIZE = 10;
const DETAIL_POPUP_DEFAULT_WIDTH = 560;
const DETAIL_POPUP_DEFAULT_HEIGHT = 360;
const DETAIL_POPUP_SPACING = 12;
const DETAIL_POPUP_VIEWPORT_MARGIN = 12;

type PopupPlacement = 'right' | 'top';

interface PopupPosition {
  top: number;
  left: number;
  placement: PopupPlacement;
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const clampSentimentScore = (score: number | null): number => {
  if (typeof score !== 'number' || Number.isNaN(score)) return 0;
  return clamp(score, -1, 1);
};

const sortTickerScoresByRelevance = (scores: NewsTickerScore[]): NewsTickerScore[] => {
  return [...scores].sort((a, b) => {
    const relevanceA = a.relevanceScore ?? Number.NEGATIVE_INFINITY;
    const relevanceB = b.relevanceScore ?? Number.NEGATIVE_INFINITY;

    if (relevanceA !== relevanceB) {
      return relevanceB - relevanceA;
    }

    return a.ticker.localeCompare(b.ticker);
  });
};

const getDetailPopupPosition = (
  anchorRect: DOMRect,
  popupWidth: number,
  popupHeight: number,
): PopupPosition => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const rightLeft = anchorRect.right + DETAIL_POPUP_SPACING;
  const canPlaceRight = rightLeft + popupWidth <= viewportWidth - DETAIL_POPUP_VIEWPORT_MARGIN;

  if (canPlaceRight) {
    return {
      left: rightLeft,
      top: clamp(
        anchorRect.top,
        DETAIL_POPUP_VIEWPORT_MARGIN,
        viewportHeight - popupHeight - DETAIL_POPUP_VIEWPORT_MARGIN,
      ),
      placement: 'right',
    };
  }

  return {
    left: clamp(
      anchorRect.left,
      DETAIL_POPUP_VIEWPORT_MARGIN,
      viewportWidth - popupWidth - DETAIL_POPUP_VIEWPORT_MARGIN,
    ),
    top: Math.max(
      DETAIL_POPUP_VIEWPORT_MARGIN,
      anchorRect.top - popupHeight - DETAIL_POPUP_SPACING,
    ),
    placement: 'top',
  };
};

const formatPublishTimeGmt7 = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
};

function SentimentCortisolChart({ score }: { score: number | null }) {
  const normalizedScore = clampSentimentScore(score);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = ((normalizedScore + 1) / 2) * circumference;

  const ringColor =
    normalizedScore > 0.1
      ? '#34C85E'
      : normalizedScore < -0.1
        ? '#EF4444'
        : '#F59E0B';

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="rgba(148,163,184,0.25)"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={ringColor}
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${progress} ${Math.max(0, circumference - progress)}`}
          />
        </svg>
      </div>

      <div className="mt-2 flex w-full items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span>-1.00</span>
        <span>1.00</span>
      </div>

      <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">Sentiment Score</p>
      <p className="text-base font-bold" style={{ color: ringColor }}>
        {normalizedScore.toFixed(2)}
      </p>
    </div>
  );
}

interface EventItem {
  id: string;
  code: string;
  date: string;
  content: string;
  type: 'dividend' | 'stock-dividend' | 'rights' | 'bonus';
}

export default function NewsModule() {
  const [activeTab, setActiveTab] = useState<'news' | 'event'>('news');
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [activeNewsDetail, setActiveNewsDetail] = useState<NewsArticle | null>(null);
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const detailRequestCounterRef = React.useRef(0);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const anchorElementRef = React.useRef<HTMLElement | null>(null);

  const loadNewsPage = useCallback(
    async (targetPageIndex: number, append: boolean) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsInitialLoading(true);
      }

      setNewsError(null);

      try {
        const response = await newsService.getNews({
          pageIndex: targetPageIndex,
          pageSize: NEWS_PAGE_SIZE,
        });

        setNewsItems((prev) => {
          if (!append) return response.items;

          const existingIds = new Set(prev.map((item) => item.id));
          const merged = response.items.filter((item) => !existingIds.has(item.id));
          return [...prev, ...merged];
        });

        setPageIndex(response.pageIndex);
        setHasNextPage(response.hasNextPage);
      } catch (error) {
        console.error('[NewsModule] Error loading news list:', error);
        setNewsError('Không thể tải danh sách tin tức. Vui lòng thử lại.');
      } finally {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (activeTab !== 'news') return;
    if (!isInitialLoading && newsItems.length > 0) return;
    void loadNewsPage(1, false);
  }, [activeTab, isInitialLoading, loadNewsPage, newsItems.length]);

  const handleLoadMore = useCallback(async () => {
    if (!hasNextPage || isLoadingMore) return;
    await loadNewsPage(pageIndex + 1, true);
  }, [hasNextPage, isLoadingMore, loadNewsPage, pageIndex]);

  const updatePopupPosition = useCallback(() => {
    if (!anchorElementRef.current) return;

    const anchorRect = anchorElementRef.current.getBoundingClientRect();
    const popupWidth = popupRef.current?.offsetWidth ?? DETAIL_POPUP_DEFAULT_WIDTH;
    const popupHeight = popupRef.current?.offsetHeight ?? DETAIL_POPUP_DEFAULT_HEIGHT;

    setPopupPosition(getDetailPopupPosition(anchorRect, popupWidth, popupHeight));
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setIsDetailLoading(false);
    setDetailError(null);
    setActiveNewsDetail(null);
    setSelectedTicker(null);
    setPopupPosition(null);
    anchorElementRef.current = null;
  }, []);

  const handleOpenDetail = useCallback(
    async (item: NewsArticle, event: React.MouseEvent<HTMLButtonElement>) => {
      const anchorContainer = event.currentTarget.closest('[data-news-item]');
      anchorElementRef.current = anchorContainer instanceof HTMLElement
        ? anchorContainer
        : event.currentTarget;

      setIsDetailOpen(true);
      setIsDetailLoading(true);
      setDetailError(null);
      setActiveNewsDetail(item);
      const initialTopTicker = sortTickerScoresByRelevance(item.tickerScores)[0]?.ticker ?? null;
      setSelectedTicker(initialTopTicker);
      updatePopupPosition();

      const currentRequestId = ++detailRequestCounterRef.current;

      try {
        const detail = await newsService.getNewsById(item.id);
        if (detailRequestCounterRef.current !== currentRequestId) return;
        setActiveNewsDetail(detail);
        const topTicker = sortTickerScoresByRelevance(detail.tickerScores)[0]?.ticker ?? null;
        setSelectedTicker(topTicker);
      } catch (error) {
        console.error('[NewsModule] Error loading detail:', error);
        if (detailRequestCounterRef.current === currentRequestId) {
          setDetailError('Không thể tải chi tiết tin tức. Vui lòng thử lại.');
        }
      } finally {
        if (detailRequestCounterRef.current === currentRequestId) {
          setIsDetailLoading(false);
        }
      }
    },
    [updatePopupPosition],
  );

  useEffect(() => {
    if (!isDetailOpen) return;
    updatePopupPosition();
  }, [isDetailOpen, isDetailLoading, activeNewsDetail, updatePopupPosition]);

  useEffect(() => {
    if (!isDetailOpen) return;

    const handleResizeOrScroll = () => {
      updatePopupPosition();
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [isDetailOpen, updatePopupPosition]);

  useEffect(() => {
    if (!isDetailOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (popupRef.current?.contains(target)) return;
      if (anchorElementRef.current?.contains(target)) return;

      handleCloseDetail();
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseDetail();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isDetailOpen, handleCloseDetail]);

  useEffect(() => {
    if (activeTab !== 'news') {
      handleCloseDetail();
    }
  }, [activeTab, handleCloseDetail]);

  const sortedTickerScores = activeNewsDetail
    ? sortTickerScoresByRelevance(activeNewsDetail.tickerScores)
    : [];
  const topThreeTickerScores = sortedTickerScores.slice(0, 3);
  const remainingTickerScores = sortedTickerScores.slice(3);
  const selectedTickerScore = selectedTicker
    ? sortedTickerScores.find((score) => score.ticker === selectedTicker) ?? null
    : null;

  // Event data (stock corporate actions)
  const eventData: EventItem[] = [
    { id: '1', code: 'VTB', date: '23-10-2025', content: 'VTB: chia cổ tức bằng tiền, tỉ lệ 0.04 (400 đồng/CP)', type: 'dividend' },
    { id: '2', code: 'VTB', date: '23-10-2025', content: 'VTB: chia cổ tức bằng tiền, tỉ lệ 0.05 (500 đồng/CP)', type: 'dividend' },
    { id: '3', code: 'VEF', date: '22-10-2025', content: 'VEF: chia cổ tức bằng tiền, tỉ lệ 3.3 (33,000 đồng/CP)', type: 'dividend' },
    { id: '4', code: 'PBP', date: '24-10-2025', content: 'PBP: chia cổ tức bằng tiền, tỉ lệ 0.085 (850 đồng/CP)', type: 'dividend' },
    { id: '5', code: 'IN4', date: '22-10-2025', content: 'IN4: chia cổ tức bằng tiền, tỉ lệ 0.18 (1,800 đồng/CP)', type: 'dividend' },
    { id: '6', code: 'VFR', date: '21-10-2025', content: 'VFR: chia cổ tức bằng tiền, tỉ lệ 0.0397 (397 đồng/CP)', type: 'dividend' },
    { id: '7', code: 'DHT', date: '24-10-2025', content: 'DHT: phát hành cổ phiếu thưởng, tỉ lệ 0.1 (phát hành thêm: 8,234,026)', type: 'bonus' },
    { id: '8', code: 'GHC', date: '21-10-2025', content: 'GHC: chia cổ tức bằng tiền, tỉ lệ 0.2 (2,000 đồng/CP)', type: 'dividend' },
    { id: '9', code: 'TPP', date: '16-10-2025', content: 'TPP: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 0.44 (phát hành thêm: 20,000,000)', type: 'rights' },
    { id: '10', code: 'HMS', date: '23-10-2025', content: 'HMS: chia cổ tức bằng tiền, tỉ lệ 0.1 (1,000 đồng/CP)', type: 'dividend' },
    { id: '11', code: 'CTF', date: '23-10-2025', content: 'CTF: chia cổ tức bằng tiền, tỉ lệ 0.05 (500 đồng/CP)', type: 'dividend' },
    { id: '12', code: 'NLG', date: '17-10-2025', content: 'NLG: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 0.26 (phát hành thêm: 100,119,579)', type: 'rights' },
    { id: '13', code: 'NT2', date: '21-10-2025', content: 'NT2: chia cổ tức bằng tiền, tỉ lệ 0.07 (700 đồng/CP)', type: 'dividend' },
    { id: '14', code: 'ELC', date: '17-10-2025', content: 'ELC: trả cổ tức bằng cổ phiếu, tỉ lệ 0.05 (phát hành thêm: 5,242,371)', type: 'stock-dividend' },
    { id: '15', code: 'LGC', date: '20-10-2025', content: 'LGC: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 0.1 (phát hành thêm: 19,285,476)', type: 'rights' },
    { id: '16', code: 'TT6', date: '22-10-2025', content: 'TT6: trả cổ tức bằng cổ phiếu, tỉ lệ 0.11 (phát hành thêm: 2,260,038)', type: 'stock-dividend' },
    { id: '17', code: 'SDV', date: '16-10-2025', content: 'SDV: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 1.0 (phát hành thêm: 5,000,000)', type: 'rights' },
    { id: '18', code: 'AST', date: '16-10-2025', content: 'AST: chia cổ tức bằng tiền, tỉ lệ 0.25 (2,500 đồng/CP)', type: 'dividend' },
    { id: '19', code: 'PGB', date: '17-10-2025', content: 'PGB: trả cổ tức bằng cổ phiếu, tỉ lệ 0.1 (phát hành thêm: 50,000,000)', type: 'stock-dividend' },
    { id: '20', code: 'TCT', date: '20-10-2025', content: 'TCT: chia cổ tức bằng tiền, tỉ lệ 0.05 (500 đồng/CP)', type: 'dividend' },
    { id: '21', code: 'PGB', date: '17-10-2025', content: 'PGB: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 0.9 (phát hành thêm: 450,000,000)', type: 'rights' },
    { id: '22', code: 'ANV', date: '23-10-2025', content: 'ANV: chia cổ tức bằng tiền, tỉ lệ 0.05 (500 đồng/CP)', type: 'dividend' },
    { id: '23', code: 'SAS', date: '23-10-2025', content: 'SAS: chia cổ tức bằng tiền, tỉ lệ 0.06 (600 đồng/CP)', type: 'dividend' },
    { id: '24', code: 'SJG', date: '17-10-2025', content: 'SJG: chia cổ tức bằng tiền, tỉ lệ 0.1 (1,000 đồng/CP)', type: 'dividend' },
    { id: '25', code: 'DSH', date: '16-10-2025', content: 'DSH: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 2.5 (phát hành thêm: 25,000,000)', type: 'rights' },
    { id: '26', code: 'SCL', date: '17-10-2025', content: 'SCL: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 0.36 (phát hành thêm: 8,000,000)', type: 'rights' },
    { id: '27', code: 'BID', date: '14-10-2025', content: 'BID: chia cổ tức bằng tiền, tỉ lệ 0.045 (450 đồng/CP)', type: 'dividend' },
    { id: '28', code: 'CKD', date: '14-10-2025', content: 'CKD: chia cổ tức bằng tiền, tỉ lệ 0.21 (2,100 đồng/CP)', type: 'dividend' },
    { id: '29', code: 'BHA', date: '13-10-2025', content: 'BHA: chia cổ tức bằng tiền, tỉ lệ 0.05 (500 đồng/CP)', type: 'dividend' },
    { id: '30', code: 'CDC', date: '16-10-2025', content: 'CDC: phát hành cổ phiếu thưởng, tỉ lệ 0.2 (phát hành thêm: 8,795,486)', type: 'bonus' },
    { id: '31', code: 'VNM', date: '16-10-2025', content: 'VNM: chia cổ tức bằng tiền, tỉ lệ 0.25 (2,500 đồng/CP)', type: 'dividend' },
    { id: '32', code: 'VHF', date: '15-10-2025', content: 'VHF: chia cổ tức bằng tiền, tỉ lệ 0.0207 (207 đồng/CP)', type: 'dividend' },
    { id: '33', code: 'CTG', date: '14-10-2025', content: 'CTG: chia cổ tức bằng tiền, tỉ lệ 0.045 (450 đồng/CP)', type: 'dividend' },
    { id: '34', code: 'VCB', date: '03-10-2025', content: 'VCB: chia cổ tức bằng tiền, tỉ lệ 0.045 (450 đồng/CP)', type: 'dividend' },
    { id: '35', code: 'ABR', date: '26-09-2025', content: 'ABR: chia cổ tức bằng tiền, tỉ lệ 0.2 (2,000 đồng/CP)', type: 'dividend' }
  ];

  const getEventIcon = (type: EventItem['type']) => {
    switch (type) {
      case 'dividend':
        return 'i-solar:hand-money-broken';
      case 'stock-dividend':
        return 'i-grommet-icons:money';
      case 'rights':
      case 'bonus':
        return 'i-game-icons:pay-money';
      default:
        return 'i-solar:hand-money-broken';
    }
  };

  const tabs = [
    { id: 'news', label: 'Tin tức' },
    { id: 'event', label: 'Sự kiện' },
  ] as const;

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const relatedTickers = topThreeTickerScores;
  const remainingTickerCount = remainingTickerScores.length;

  return (
    <>
      <div className={`dashboard-module w-full h-full rounded-lg flex flex-col overflow-hidden text-sm ${
        isDark ? 'bg-[#282832] text-white' : 'bg-white text-gray-900'
      }`}>
      {/* Badge title */}
      <div className="flex-none flex items-center justify-center pt-1.5 pb-1">
        <div className="relative flex items-center justify-center">
          <svg width="150" height="25" viewBox="0 0 136 22" className="block">
            <path d="M134 0C151 0 -15 0 2 0C19 0 27 22 46 22H92C113 22 119 0 134 0Z" fill="#4ADE80"/>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-black tracking-wide">
            Tin Tức
          </span>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="w-full flex gap-2 justify-center overflow-hidden pt-2 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-3 py-1 border transition-colors ${
              activeTab === tab.id
                ? 'border-transparent'
                : 'border-transparent border-gray-700'
            }`}
            style={{
              backgroundColor: activeTab === tab.id ? '#34C85E' : 'transparent'
            }}
          >
            <span className={activeTab === tab.id ? 'text-[#282832] font-medium' : 'text-gray-400'}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* News list */}
      <div className="m-3 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-3">
        {activeTab === 'event' ? (
          <>
            <div className="rounded-lg border border-yellow-400/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
              Tab Sự kiện đang trong quá trình phát triển, hiện dùng dữ liệu mock để hiển thị.
            </div>

            <table className="w-full text-sm text-center">
              <thead>
                <tr className="text-xs">
                  <th colSpan={4}>
                    <div className="flex items-center w-full rounded-full px-3 py-1 -mt-[1px]" style={{ backgroundColor: '#34C85E' }}>
                      <div className="flex-none w-[70px] text-[#282832] font-medium">
                        <div className="relative inline-flex">
                          <div className="flex items-center">
                            <button className="relative rounded-full flex items-center p-1 mr-1" style={{ backgroundColor: '#34C85E' }}>
                              <span className="animate-ping absolute inset-0 rounded-full opacity-75" style={{ backgroundColor: '#34C85E' }}></span>
                              <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                              </svg>
                            </button>
                            Mã
                          </div>
                        </div>
                      </div>
                      <div className="flex-none w-20 text-[#282832] font-medium">Ngày GDKHQ</div>
                      <div className="flex-1 text-[#282832] font-medium">Nội dung</div>
                      <div className="flex-none w-7 text-[#282832] font-medium">Loại</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {eventData.map((event) => (
                  <tr key={event.id}>
                    <td colSpan={4}>
                      <div
                        className={`flex items-center w-full mt-2 rounded-lg px-3 py-1.5 overflow-hidden ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-50'}`}
                      >
                        <div className="flex-none w-[70px] text-xs text-gray-300">{event.code}</div>
                        <div className="flex-none w-20 text-xs text-gray-300">{event.date}</div>
                        <div className="flex-1 min-w-0 text-justify px-1 text-xs text-gray-300 truncate">{event.content}</div>
                        <div className="flex-none w-7" style={{ color: '#34C85E' }}>
                          <span className={`iconify ${getEventIcon(event.type)}`} aria-hidden="true" style={{ fontSize: '24px' }}></span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div className="grid gap-4">
            {isInitialLoading && (
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300">
                Đang tải dữ liệu tin tức...
              </div>
            )}

            {!isInitialLoading && newsError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {newsError}
              </div>
            )}

            {!isInitialLoading && !newsError && newsItems.length === 0 && (
              <div className={`rounded-lg px-3 py-2 text-xs ${isDark ? 'bg-cyan-900/30 text-gray-300' : 'bg-cyan-50 text-gray-600'}`}>
                Chưa có dữ liệu tin tức.
              </div>
            )}

            {newsItems.map((item) => (
              <div
                key={item.id}
                data-news-item
                className={`text-sm px-3 py-1.5 rounded-lg ${
                  isDark ? 'bg-cyan-900/30' : 'bg-cyan-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5" style={{ color: '#34C85E' }}>
                  <div className="text-xs font-normal text-gray-300">{formatPublishTimeGmt7(item.publishedAt)}</div>
                  <div>
                    <button
                      type="button"
                      className="rounded-full text-xs p-1.5 text-white/80 hover:bg-gray-800 transition-colors"
                      aria-label="Mở chi tiết AI"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void handleOpenDetail(item, event);
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 8V4H8" />
                        <rect width="16" height="12" x="4" y="8" rx="2" />
                        <path d="M2 14h2" />
                        <path d="M20 14h2" />
                        <path d="M15 13v2" />
                        <path d="M9 13v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <a
                  href={item.link || '#'}
                  target={item.link ? '_blank' : undefined}
                  rel={item.link ? 'noopener noreferrer' : undefined}
                  className="flex cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {item.thumbnailUrl && (
                    <span className="inline-flex justify-center items-center overflow-hidden mr-2 aspect-video rounded-lg min-w-24 max-w-24 flex-shrink-0">
                      <Image
                        src={item.thumbnailUrl}
                        className="inline-block object-cover w-full h-full"
                        alt={item.title}
                        width={96}
                        height={54}
                      />
                    </span>
                  )}
                  <span className="text-gray-300 text-xs leading-relaxed line-clamp-3">
                    {item.title}<br/>{item.source ? `Nguồn: ${item.source} ` : ''} 
                  </span>
                </a>
              </div>
            ))}

            {!newsError && hasNextPage && (
              <button
                type="button"
                onClick={() => void handleLoadMore()}
                disabled={isLoadingMore}
                className="w-full rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingMore ? 'Đang tải...' : 'Tải thêm'}
              </button>
            )}
          </div>
        )}
      </div>
      </div>

      {typeof document !== 'undefined' && isDetailOpen && popupPosition && createPortal(
        <div
          ref={popupRef}
          className={`fixed z-[1000] w-[560px] max-w-[calc(100vw-24px)] rounded-lg border shadow-2xl ${
            isDark
              ? 'border-cyan-700/40 bg-[#1f2430] text-gray-100'
              : 'border-gray-200 bg-white text-gray-900'
          }`}
          style={{ top: popupPosition.top, left: popupPosition.left }}
        >
          <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-cyan-700/30' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: '#34C85E' }}>Chi tiết AI</span>
            </div>

            <button
              type="button"
              onClick={handleCloseDetail}
              className={`rounded p-1 text-xs transition-colors ${isDark ? 'hover:bg-cyan-900/40' : 'hover:bg-gray-100'}`}
              aria-label="Đóng popup"
            >
              ✕
            </button>
          </div>

          <div className="px-4 py-3 space-y-3 text-xs leading-relaxed">
            {isDetailLoading && (
              <p className={isDark ? 'text-cyan-300' : 'text-cyan-700'}>
                Đang tải chi tiết...
              </p>
            )}

            {!isDetailLoading && detailError && (
              <p className="text-red-400">{detailError}</p>
            )}

            {!isDetailLoading && !detailError && activeNewsDetail && (
              <div className="space-y-3">
                <div>
                  <p className="font-semibold mb-1">Tiêu đề</p>
                  <p>{activeNewsDetail.title}</p>
                </div>

                <div>
                  <p className="font-semibold mb-1">Tóm tắt</p>
                  <p>{activeNewsDetail.summary || 'Chưa có tóm tắt cho bài viết này.'}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 items-start">
                  <div className="col-span-1 min-w-0">
                    <p className="font-semibold mb-1">Mã liên quan</p>
                    {relatedTickers.length > 0 ? (
                      <div className="space-y-2">
                        {relatedTickers.map((tickerScore) => {
                          const isSelected = selectedTicker === tickerScore.ticker;

                          return (
                            <button
                              key={tickerScore.ticker}
                              type="button"
                              onClick={() => setSelectedTicker(tickerScore.ticker)}
                              className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] font-medium transition-colors ${
                                isSelected
                                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                                  : isDark
                                    ? 'bg-cyan-900/20 text-cyan-300 border border-transparent hover:bg-cyan-900/35'
                                    : 'bg-cyan-100 text-cyan-700 border border-transparent hover:bg-cyan-200'
                              }`}
                            >
                              <span>{tickerScore.ticker}</span>
                              <span
                                className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                                  isSelected
                                    ? 'border-cyan-300 bg-cyan-500/90 text-white'
                                    : isDark
                                      ? 'border-cyan-600/50 bg-transparent text-transparent'
                                      : 'border-cyan-300 bg-transparent text-transparent'
                                }`}
                                aria-hidden="true"
                              >
                                {isSelected && (
                                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <path d="M3.5 8.5l2.5 2.5 6-6" />
                                  </svg>
                                )}
                              </span>
                            </button>
                          );
                        })}

                        {remainingTickerCount > 0 && (
                          <div className="relative inline-block group">
                            <span
                              className={`inline-flex rounded px-2 py-1 text-[11px] cursor-default ${
                                isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              +{remainingTickerCount}
                            </span>

                            <div
                              className={`invisible absolute left-0 top-full z-10 mt-1 w-max rounded border p-2 text-[11px] opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 ${
                                isDark ? 'border-gray-700 bg-[#1f2430] text-gray-200' : 'border-gray-200 bg-white text-gray-700'
                              }`}
                            >
                              <div className="flex flex-nowrap gap-1.5">
                                {remainingTickerScores.map((tickerScore) => (
                                  <span
                                    key={tickerScore.ticker}
                                    className={`whitespace-nowrap rounded border px-2 py-1 text-[11px] ${
                                      isDark ? 'border-cyan-700/40 bg-cyan-900/20 text-cyan-300' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
                                    }`}
                                  >
                                    {tickerScore.ticker}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p>Chưa có mã liên quan.</p>
                    )}
                  </div>

                  <div className={`col-span-2 rounded-lg border p-3 ${isDark ? 'border-cyan-700/30 bg-cyan-900/10' : 'border-cyan-100 bg-cyan-50/70'}`}>
                    <p className="mb-2 text-xs font-semibold">Sentiment Score Card (Demo)</p>
                    <p className="mb-2 text-[11px] text-gray-500 dark:text-gray-400">
                      {selectedTickerScore ? `Ticker: ${selectedTickerScore.ticker}` : 'Chưa chọn ticker'}
                    </p>
                    <SentimentCortisolChart score={selectedTickerScore?.sentimentScore ?? null} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
