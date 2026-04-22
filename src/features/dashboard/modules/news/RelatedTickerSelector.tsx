import React from 'react';
import type { NewsTickerScore } from '@/types/news';

interface RelatedTickerSelectorProps {
  relatedTickers: NewsTickerScore[];
  remainingTickerScores: NewsTickerScore[];
  selectedTickers: string[];
  isDark: boolean;
  onToggleTicker: (ticker: string) => void;
  maxSelectable?: number;
}

export default function RelatedTickerSelector({
  relatedTickers,
  remainingTickerScores,
  selectedTickers,
  isDark,
  onToggleTicker,
  maxSelectable = 2,
}: RelatedTickerSelectorProps) {
  const remainingTickerCount = remainingTickerScores.length;
  const canSelectMore = selectedTickers.length < maxSelectable;

  const renderTickerButton = (tickerScore: NewsTickerScore) => {
    const isSelected = selectedTickers.includes(tickerScore.ticker);
    const isDisabled = !isSelected && !canSelectMore;

    return (
      <button
        key={tickerScore.ticker}
        type="button"
        onClick={() => onToggleTicker(tickerScore.ticker)}
        disabled={isDisabled}
        className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] font-medium transition-colors ${
          isSelected
            ? 'border border-cyan-400/40 bg-cyan-500/30 text-cyan-200'
            : isDark
              ? 'border border-transparent bg-cyan-900/20 text-cyan-300 hover:bg-cyan-900/35'
              : 'border border-transparent bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
        } ${isDisabled ? 'cursor-not-allowed opacity-55' : ''}`}
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
  };

  return (
    <div className="col-span-1 min-w-0">
      <p className="mb-1 font-semibold">Mã liên quan</p>
      <p className="mb-2 text-[11px] text-gray-500 dark:text-gray-400">Có thể chọn {maxSelectable} mã để so sánh</p>

      {relatedTickers.length > 0 ? (
        <div className="space-y-2">
          {relatedTickers.map((tickerScore) => renderTickerButton(tickerScore))}

          {remainingTickerCount > 0 && (
            <div className="group relative inline-block">
              <span
                className={`inline-flex cursor-default rounded px-2 py-1 text-[11px] ${
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
                    <button
                      key={tickerScore.ticker}
                      type="button"
                      onClick={() => onToggleTicker(tickerScore.ticker)}
                      className={`whitespace-nowrap rounded border px-2 py-1 text-[11px] transition-colors ${
                        selectedTickers.includes(tickerScore.ticker)
                          ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                          : isDark
                            ? 'border-cyan-700/40 bg-cyan-900/20 text-cyan-300 hover:bg-cyan-900/35'
                            : 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                      } ${!selectedTickers.includes(tickerScore.ticker) && !canSelectMore ? 'cursor-not-allowed opacity-55' : ''}`}
                      disabled={!selectedTickers.includes(tickerScore.ticker) && !canSelectMore}
                    >
                      {tickerScore.ticker}
                    </button>
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
  );
}
