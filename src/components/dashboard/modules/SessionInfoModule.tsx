'use client';

// ─ REDESIGNED: compact layout, fixed row heights, cleaner footer ─────────────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSignalR } from '@/contexts/SignalRContext';
import SignalRService from '@/services/market/signalRService';
import type { PriceDepthDto } from '@/services/market/signalRService';
import { searchSymbols } from '@/services/market/symbolService';
import type { SymbolSearchResultDto } from '@/types/symbol';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtPrice(raw: number): string {
  if (!raw) return '—';
  return (raw / 1000).toFixed(2);
}

function fmtVol(v: number): string {
  if (v === undefined || v === null) return '—';
  if (v === 0) return '0';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} triệu`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)} nghìn`;
  return v.toLocaleString('vi-VN');
}

function getPriceColor(price: number, ref: number, ceiling: number, floor: number): string {
  if (price <= 0)                      return 'text-gray-500';
  if (ceiling > 0 && price >= ceiling) return 'text-[#d97bff]';
  if (floor   > 0 && price <= floor)   return 'text-[#00c8f8]';
  if (price > ref) return 'text-[#4ADE80]';
  if (price < ref) return 'text-[#ef4444]';
  return 'text-[#f5c518]';
}

// ─── component ───────────────────────────────────────────────────────────────

export default function SessionInfoModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isConnected } = useSignalR();

  const [ticker, setTicker]               = useState('FPT');
  const [inputValue, setInputValue]       = useState('FPT');
  const [searchResults, setSearchResults] = useState<SymbolSearchResultDto[]>([]);
  const [showDropdown, setShowDropdown]   = useState(false);
  const [depth, setDepth]                 = useState<PriceDepthDto | null>(null);

  const searchRef   = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isConnected || !ticker) return;
    const svc = SignalRService.getInstance();
    const unsub = svc.onPriceDepthReceived((d) => {
      if (d.ticker?.toUpperCase() === ticker.toUpperCase()) setDepth(d);
    });
    svc.subscribeToPriceDepth(ticker).catch(() => {});
    return () => { unsub(); svc.unsubscribeFromPriceDepth(ticker).catch(() => {}); setDepth(null); };
  }, [isConnected, ticker]);

  const handleSearchChange = useCallback((value: string) => {
    setInputValue(value);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchSymbols({ query: value.trim(), isTickerOnly: false, pageIndex: 1, pageSize: 7 });
        setSearchResults(res.items || []);
      } catch { setSearchResults([]); }
    }, 300);
  }, []);

  const selectSymbol = useCallback((t: string) => {
    setTicker(t.toUpperCase()); setInputValue(t.toUpperCase());
    setShowDropdown(false); setSearchResults([]);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── derived ──────────────────────────────────────────────────────────────
  const ref     = depth?.referencePrice ?? 0;
  const ceiling = depth?.ceilingPrice   ?? 0;
  const floor   = depth?.floorPrice     ?? 0;

  const levels = depth ? [
    { price: depth.askPrice3, vol: depth.askVol3, pct: depth.askChangePct3, isBid: false },
    { price: depth.askPrice2, vol: depth.askVol2, pct: depth.askChangePct2, isBid: false },
    { price: depth.askPrice1, vol: depth.askVol1, pct: depth.askChangePct1, isBid: false },
    { price: depth.bidPrice1, vol: depth.bidVol1, pct: depth.bidChangePct1, isBid: true  },
    { price: depth.bidPrice2, vol: depth.bidVol2, pct: depth.bidChangePct2, isBid: true  },
    { price: depth.bidPrice3, vol: depth.bidVol3, pct: depth.bidChangePct3, isBid: true  },
  ] : [];

  const totalVol     = depth?.totalVol     ?? 0;
  const fBuyPct      = depth?.fBuyPct.toFixed(1)  ?? '0.0';
  const fSellPct     = depth?.fSellPct.toFixed(1) ?? '0.0';

  // ── theme tokens ─────────────────────────────────────────────────────────
  const bg     = isDark ? 'bg-cardBackground' : 'bg-gray-50';
  const bgCard = isDark ? 'bg-[#1e2130]'  : 'bg-gray-50';
  const border = isDark ? 'border-white/8': 'border-gray-200';
  const muted  = isDark ? 'text-gray-400' : 'text-gray-500';
  const textPri = isDark ? 'text-gray-100': 'text-gray-800';

  return (
    <div className={`h-full w-full flex flex-col ${bg} overflow-hidden`}>

      {/* ── Badge title ────────────────────────────────────────────────── */}
      <div className="flex-none flex items-center justify-center pt-1.5 pb-1">
        <div className="relative flex items-center justify-center">
          <svg width="136" height="22" viewBox="0 0 136 22" className="block">
            <path d="M134 0C151 0 -15 0 2 0C19 0 27 22 46 22H92C113 22 119 0 134 0Z" fill="#4ADE80"/>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-black tracking-wide">
            3 Bước Giá
          </span>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="flex-none px-2 pb-1" ref={searchRef}>
        <div className="relative">
          <div className={`flex items-center gap-1.5 rounded-md border ${border} ${bgCard} px-2 py-[5px]`}>
            <Search size={12} className={muted} />
            <input
              value={inputValue}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => inputValue && setShowDropdown(true)}
              onKeyDown={e => e.key === 'Enter' && selectSymbol(inputValue)}
              placeholder="Nhập mã CK…"
              className={`flex-1 bg-transparent text-[12px] font-semibold outline-none ${textPri} placeholder:font-normal placeholder:text-gray-500`}
            />
            {inputValue && (
              <button onClick={() => { setInputValue(''); setSearchResults([]); setShowDropdown(false); }}>
                <X size={11} className={muted} />
              </button>
            )}
          </div>
          {showDropdown && searchResults.length > 0 && (
            <div className={`absolute z-50 left-0 right-0 top-full mt-0.5 rounded-md border ${border} ${isDark ? 'bg-[#252938]' : 'bg-white'} shadow-xl overflow-hidden`}>
              {searchResults.map(s => (
                <button key={s.ticker} onMouseDown={() => selectSymbol(s.ticker)}
                  className={`w-full text-left px-3 py-1.5 text-[11px] flex gap-2 items-center transition-colors ${isDark ? 'hover:bg-white/8' : 'hover:bg-gray-50'}`}>
                  <span className="font-bold text-[#4ADE80] w-12 shrink-0">{s.ticker}</span>
                  <span className={`${muted} truncate`}>{s.viCompanyName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Column headers ─────────────────────────────────────────────── */}
      <div className={`flex-none grid grid-cols-[52px_1fr_48px_46px] px-2 pb-[3px] text-[10px] font-medium uppercase tracking-wide ${muted}`}>
        <span>Giá</span>
        <span className="text-right pr-1">KL Chờ</span>
        <span className="text-right">+/-</span>
        <span className="text-right">%</span>
      </div>

      {/* ── Price rows ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 px-1.5">
        {levels.length === 0 ? (
          <div className={`flex-1 flex items-center justify-center text-[11px] ${muted}`}>
            {isConnected ? `Chờ dữ liệu ${ticker}…` : 'Đang kết nối…'}
          </div>
        ) : levels.map((lv, idx) => {
          if (!lv.price && !lv.vol) return null;
          const sep = idx === 3;
          const pc  = getPriceColor(lv.price, ref, ceiling, floor);
          const cc  = lv.pct >= 0 ? 'text-[#4ADE80]' : 'text-[#ef4444]';
          return (
            <React.Fragment key={idx}>
              {sep && <div className={`flex-none h-px mx-0.5 mt-px mb-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />}
              <div className="flex-1 grid grid-cols-[52px_1fr_48px_46px] items-center px-0.5"
                style={{ minHeight: 0, maxHeight: 44 }}>
                <span className={`text-[12.5px] font-bold tabular-nums ${pc}`}>
                  {fmtPrice(lv.price)}
                </span>
                <span className={`text-[11px] text-right pr-1 tabular-nums ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {fmtVol(lv.vol)}
                </span>
                <span className={`text-[10.5px] text-right tabular-nums ${cc}`}>
                  {lv.pct ? `${lv.pct > 0 ? '+' : ''}${(lv.pct * ref / 100 / 1000).toFixed(2)}` : ''}
                </span>
                <span className={`text-[10.5px] font-semibold text-right tabular-nums ${cc}`}>
                  {lv.pct ? `${lv.pct.toFixed(2)}%` : ''}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className={`flex-none border-t ${border} px-2 pt-1.5 pb-1.5 space-y-1.5`}>

        {/* Tổng KL */}
        <div className="flex flex-col items-center text-center">
          <span className={`text-[9px] uppercase tracking-wide ${muted}`}>Tổng KL</span>
          <span className={`text-[12px] font-bold tabular-nums ${textPri}`}>{fmtVol(totalVol)}</span>
        </div>

        {/* NN Mua / NN Bán pill */}
        <div className={`flex items-center justify-between ${bgCard} rounded-full px-3 py-[5px] border ${border}`}>
          <span className="text-[11px]">
            <span className={muted}>NN Mua </span>
            <span className="text-[#4ADE80] font-bold">{fBuyPct}%</span>
          </span>
          <span className={`text-[10px] font-medium ${muted}`}>Ngoại</span>
          <span className="text-[11px]">
            <span className="text-[#ef4444] font-bold">{fSellPct}%</span>
            <span className={muted}> NN Bán</span>
          </span>
        </div>
      </div>
    </div>
  );
}
