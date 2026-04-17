import React from 'react';
import type { NewsTickerScore } from '@/types/news';
import SentimentCortisolChart from './SentimentCortisolChart';

interface TickerSentimentCardProps {
  selectedTickerScores: NewsTickerScore[];
  isDark: boolean;
}

export default function TickerSentimentCard({
  selectedTickerScores,
  isDark,
}: TickerSentimentCardProps) {
  return (
    <div className={`col-span-2 rounded-lg border p-3 ${isDark ? 'border-cyan-700/30 bg-cyan-900/10' : 'border-cyan-100 bg-cyan-50/70'}`}>
      <p className="mb-2 text-xs font-semibold">Điểm cảm xúc</p>
      {selectedTickerScores.length > 0 ? (
        <div className={`grid gap-3 ${selectedTickerScores.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {selectedTickerScores.map((tickerScore) => (
            <div
              key={tickerScore.ticker}
              className={`rounded-md border p-2 ${isDark ? 'border-cyan-700/30 bg-cyan-900/15' : 'border-cyan-200 bg-white/60'}`}
            >
              <p className="mb-2 text-[11px] text-gray-500 dark:text-gray-400">Mã chứng khoán: {tickerScore.ticker}</p>
              <SentimentCortisolChart
                score={tickerScore.sentimentScore ?? null}
                relevanceScore={tickerScore.relevanceScore ?? null}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Chưa chọn ticker</p>
      )}
    </div>
  );
}
