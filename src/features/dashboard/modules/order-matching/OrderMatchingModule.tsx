"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Link2, Link2Off } from 'lucide-react';
import { useSignalR } from '@/contexts/SignalRContext';
import { useTheme } from '@/contexts/ThemeContext';
import { searchSymbols } from '@/services/market/symbolService';
import SignalRService from '@/services/market/signalRService';
import type { RecentTradeDto } from '@/services/market/signalRService';
import type { SymbolSearchResultDto } from '@/types/symbol';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

interface Trade {
  id: number;
  time: string;
  price: number;
  volume: number;
  side: 'B' | 'S' | 'N';
}

/** Determine price color class based on price vs reference / ceiling / floor */
function getPriceColorClass(
  price: number,
  ref: number,
  ceiling: number,
  floor: number,
): string {
  if (ceiling > 0 && price >= ceiling) return 'text-[#d97bff]'; // Tím – trần
  if (floor > 0 && price <= floor) return 'text-[#00c8f8]';    // Xanh dương – sàn
  if (price > ref) return 'text-[#22c55e]';   // Xanh – tăng
  if (price < ref) return 'text-[#ef4444]';   // Đỏ – giảm
  return 'text-[#f5c518]';                     // Vàng – tham chiếu
}

function formatVol(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} triệu`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)} nghìn`;
  return String(v);
}

function formatVal(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} tỷ`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} triệu`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)} nghìn`;
  return v.toFixed(0);
}

const MAX_TRADES = 200;
let tradeIdCounter = 0;

export function OrderMatchingModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isConnected, subscribeToSymbols, unsubscribeFromSymbols, marketData } = useSignalR();

  const storeSymbol = useSelectedSymbolStore(s => s.selectedSymbol);
  const setSelectedSymbol = useSelectedSymbolStore(s => s.setSelectedSymbol);

  const [ticker, setTicker] = useState(() => useSelectedSymbolStore.getState().selectedSymbol || 'FPT');
  const [inputValue, setInputValue] = useState(() => useSelectedSymbolStore.getState().selectedSymbol || 'FPT');
  const [searchResults, setSearchResults] = useState<SymbolSearchResultDto[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLinked, setIsLinked] = useState(true);

  const tbodyRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to MarketData group for stats row (TotalVol, TotalVal, RefPrice)
  useEffect(() => {
    if (!isConnected || !ticker) return;
    subscribeToSymbols([ticker]);
    return () => { unsubscribeFromSymbols([ticker]); };
  }, [isConnected, ticker, subscribeToSymbols, unsubscribeFromSymbols]);

  // SSI Side: B*/BU/BD = Mua (buy), S*/M* = Bán (sell)
  const parseSide = (raw: string): Trade['side'] => {
    if (!raw) return 'N';
    const upper = raw.toUpperCase();
    if (upper.startsWith('B')) return 'B';
    if (upper.startsWith('S') || upper.startsWith('M')) return 'S';
    return 'N';
  };

  // Reset trades when ticker changes
  useEffect(() => {
    setTrades([]);
  }, [ticker]);

  // Subscribe to X-TRADE realtime feed via dedicated TRADE:{ticker} group
  useEffect(() => {
    if (!isConnected || !ticker) return;
    const service = SignalRService.getInstance();

    // Receive initial batch of 20 recent trades from Redis
    const unsubRecent = service.onRecentTradesReceived((recent) => {
      const initialTrades: Trade[] = recent.map(t => ({
        id: ++tradeIdCounter,
        time: t.time,
        price: t.price,
        volume: t.volume,
        side: parseSide(t.side),
      }));
      setTrades(initialTrades);
    });

    // Receive each new matched order in real-time
    const unsubTrade = service.onTradeDataReceived((t) => {
      if (t.ticker?.toUpperCase() !== ticker.toUpperCase()) return;
      const newTrade: Trade = {
        id: ++tradeIdCounter,
        time: t.time || new Date().toLocaleTimeString('vi-VN', { hour12: false }),
        price: t.price,
        volume: t.volume,
        side: parseSide(t.side),
      };
      setTrades(prev => {
        const updated = [newTrade, ...prev];
        return updated.length > MAX_TRADES ? updated.slice(0, MAX_TRADES) : updated;
      });
    });

    // Join TRADE:{ticker} group — server sends ReceiveRecentTrades then ReceiveTradeData per order
    service.subscribeToTradeUpdates(ticker).catch(() => {});

    return () => {
      unsubRecent();
      unsubTrade();
      service.unsubscribeFromTradeUpdates(ticker).catch(() => {});
    };
  }, [isConnected, ticker]);

  // Handle symbol search input
  const handleSearchChange = useCallback((value: string) => {
    setInputValue(value);
    setShowDropdown(true);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    searchDebounce.current = setTimeout(async () => {
      try {
        const result = await searchSymbols({
          query: value.trim(),
          isTickerOnly: false,
          pageIndex: 1,
          pageSize: 8,
        });
        setSearchResults(result.items || []);
      } catch {
        setSearchResults([]);
      }
    }, 300);
  }, []);

  const selectSymbol = useCallback((t: string) => {
    const upper = t.toUpperCase();
    setTicker(upper);
    setInputValue(upper);
    setShowDropdown(false);
    setSearchResults([]);
    if (isLinked) setSelectedSymbol(upper);
  }, [isLinked, setSelectedSymbol]);

  // Sync from global store → local ticker when linked
  useEffect(() => {
    if (isLinked && storeSymbol && storeSymbol !== ticker) {
      setTicker(storeSymbol);
      setInputValue(storeSymbol);
    }
  }, [isLinked, storeSymbol]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Stats from snapshot (TotalVol, TotalVal, RefPrice) via ReceiveMarketData
  const snap = marketData.get(ticker.toUpperCase());
  const liveTotalVol = snap?.totalVol ?? 0;
  const liveTotalVal = snap?.totalVal ?? 0;
  const refPrice = snap?.referencePrice ?? 0;
  const ceilingPrice = snap?.ceilingPrice ?? 0;
  const floorPrice = snap?.floorPrice ?? 0;

  const bgCard = isDark ? 'bg-cardBackground' : 'bg-gray-50';
  const bgTable = isDark ? 'bg-[#252938]' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`w-full h-full ${bgCard} rounded-lg overflow-hidden flex flex-col ${textPrimary}`}>

      {/* ── Header badge ── */}
      <div className="flex-none flex justify-center pt-1 pb-2">
        <div className="relative">
          <svg width="180" height="24" viewBox="0 0 180 24">
            <path
              d="M178.5 0C199.3 0 -19.9 0 1.5 0C22.9 0 33.2 24 57.5 24H125.5C152.1 24 157.9 0 178.5 0Z"
              fill="#4ADE80"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-black tracking-wide drop-shadow">
            Khớp Lệnh
          </span>
        </div>
      </div>

      {/* ── Symbol search ── */}
      <div className={`flex-none px-2 pt-1 pb-1`} ref={searchRef}>
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
          <div className={`flex items-center gap-1 rounded border ${borderColor} focus-within:border-green-500 ${isDark ? 'bg-cardBackground' : 'bg-white'} px-2 py-1`}>
            <Search size={12} className={textMuted} />
            <input
              value={inputValue}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => inputValue && setShowDropdown(true)}
              onKeyDown={e => {
                if (e.key === 'Enter') selectSymbol(inputValue);
              }}
              placeholder="Nhập mã CK..."
              className={`flex-1 bg-transparent text-xs outline-none ${textPrimary} placeholder:${textMuted}`}
            />
            {inputValue && (
              <button onClick={() => { setInputValue(''); setSearchResults([]); setShowDropdown(false); }}>
                <X size={11} className={textMuted} />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className={`absolute z-50 left-0 right-0 top-full mt-1 rounded border ${borderColor} ${isDark ? 'bg-[#252938]' : 'bg-white'} shadow-lg max-h-[200px] overflow-y-auto`}>
              {searchResults.map(s => (
                <button
                  key={s.ticker}
                  onMouseDown={() => selectSymbol(s.ticker)}
                  className={`w-full text-left px-3 py-2 text-xs flex gap-2 hover:${isDark ? 'bg-white/10' : 'bg-gray-100'}`}
                >
                  <span className="font-bold text-[#22c55e] w-14">{s.ticker}</span>
                  <span className={`${textMuted} truncate`}>{s.viCompanyName}</span>
                </button>
              ))}
            </div>
          )}
          </div>
          {/* Link toggle */}
          <button
            type="button"
            onClick={() => setIsLinked(v => !v)}
            title={isLinked ? 'Đang đồng bộ mã — nhấn để tách biệt' : 'Đang tách biệt — nhấn để đồng bộ'}
            className={`flex-shrink-0 rounded p-1 transition-colors ${
              isLinked
                ? 'text-green-400 hover:bg-green-500/15'
                : `${textMuted} hover:bg-white/8`
            }`}
          >
            {isLinked ? <Link2 size={13} /> : <Link2Off size={13} />}
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className={`flex-none flex justify-between px-3 py-1.5 text-[11px] ${textMuted} border-b ${borderColor}`}>
        <div className="flex flex-col items-center">
          <span className="text-[11px] uppercase tracking-wide font-semibold">KL Khớp</span>
          <span className={`${textPrimary} font-bold text-[14px]`}>{formatVol(liveTotalVol)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[11px] uppercase tracking-wide font-semibold">Giá Trị</span>
          <span className={`${textPrimary} font-bold text-[14px]`}>{formatVal(liveTotalVal)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[11px] uppercase tracking-wide font-semibold">Tham Chiếu</span>
          <span className="text-[#f5c518] font-bold text-[14px]">{refPrice > 0 ? (refPrice / 1000).toFixed(2) : '—'}</span>
        </div>
      </div>

      {/* ── Trade table ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-none grid grid-cols-[80px_1fr_1fr_40px] text-[12px] font-semibold text-gray-300 px-2 py-2 border-b border-white/10">
          <span>Thời gian</span>
          <span className="text-center">Giá</span>
          <span className="text-center">KL</span>
          <span className="text-right">Lệnh</span>
        </div>

        {/* Body */}
        <div ref={tbodyRef} className="flex-1 overflow-y-auto custom-scrollbar">
          {trades.length === 0 ? (
            <div className={`py-8 ${textMuted} text-center text-[11px]`}>
              {isConnected
                ? `Đang chờ lệnh khớp của ${ticker}...`
                : 'Đang kết nối SignalR...'}
            </div>
          ) : (() => {
              return trades.map((trade) => {
                const colorCls = getPriceColorClass(trade.price, refPrice, ceilingPrice, floorPrice);
                const isBuy = trade.side === 'B';
                const isSell = trade.side === 'S';

                return (
                  <div
                    key={trade.id}
                    className="grid grid-cols-[80px_1fr_1fr_40px] items-center px-2 mb-[2px] rounded-sm"
                    style={{
                      height: '28px',
                      background: isBuy
                        ? 'linear-gradient(to right, rgba(22,101,52,0.55), transparent)'
                        : isSell
                        ? 'linear-gradient(to right, rgba(153,27,27,0.55), transparent)'
                        : 'transparent',
                    }}
                  >
                    {/* Thời gian */}
                    <span className="text-gray-400 text-[11px]">{trade.time}</span>

                    {/* Giá */}
                    <span className={`text-center text-[13px] font-semibold ${colorCls}`}>
                      {(trade.price / 1000).toFixed(2)}
                    </span>

                    {/* KL */}
                    <span className={`text-center text-[12px] font-medium ${
                      isBuy ? 'text-green-300' : isSell ? 'text-red-300' : 'text-gray-300'
                    }`}>
                      {trade.volume.toLocaleString()}
                    </span>

                    {/* Badge */}
                    <span className={`text-right text-[13px] font-bold ${
                      isBuy ? 'text-green-400' : isSell ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {isBuy ? 'M' : isSell ? 'B' : '—'}
                    </span>
                  </div>
                );
              });
            })()
          }
        </div>
      </div>
    </div>
  );
}
