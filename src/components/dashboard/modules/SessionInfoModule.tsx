'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSignalR } from '@/contexts/SignalRContext';
import SignalRService from '@/services/signalRService';
import type { PriceDepthDto } from '@/services/signalRService';
import { searchSymbols } from '@/services/symbolService';
import type { SymbolSearchResultDto } from '@/types/symbol';

function getPriceColor(price: number, ref: number, ceiling: number, floor: number): string {
  if (price <= 0) return 'text-gray-400';
  if (ceiling > 0 && price >= ceiling) return 'text-[#d97bff]';
  if (floor > 0 && price <= floor) return 'text-[#00c8f8]';
  if (price > ref) return 'text-[#22c55e]';
  if (price < ref) return 'text-[#ef4444]';
  return 'text-[#f5c518]';
}

function formatVol(v: number): string {
  if (v <= 0) return '';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 100) / 10}K`;
  return String(v);
}

export default function SessionInfoModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isConnected } = useSignalR();

  const [ticker, setTicker] = useState('FPT');
  const [inputValue, setInputValue] = useState('FPT');
  const [searchResults, setSearchResults] = useState<SymbolSearchResultDto[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [depth, setDepth] = useState<PriceDepthDto | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isConnected || !ticker) return;
    const service = SignalRService.getInstance();
    const unsub = service.onPriceDepthReceived((d) => {
      if (d.ticker?.toUpperCase() === ticker.toUpperCase()) setDepth(d);
    });
    service.subscribeToPriceDepth(ticker).catch(() => {});
    return () => {
      unsub();
      service.unsubscribeFromPriceDepth(ticker).catch(() => {});
      setDepth(null);
    };
  }, [isConnected, ticker]);

  const handleSearchChange = useCallback((value: string) => {
    setInputValue(value);
    setShowDropdown(true);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!value.trim()) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      try {
        const result = await searchSymbols({ query: value.trim(), isTickerOnly: false, pageIndex: 1, pageSize: 8 });
        setSearchResults(result.items || []);
      } catch { setSearchResults([]); }
    }, 300);
  }, []);

  const selectSymbol = useCallback((t: string) => {
    setTicker(t.toUpperCase());
    setInputValue(t.toUpperCase());
    setShowDropdown(false);
    setSearchResults([]);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const ref = depth?.referencePrice ?? 0;
  const ceiling = depth?.ceilingPrice ?? 0;
  const floor = depth?.floorPrice ?? 0;

  const priceLevels = depth ? [
    { price: depth.askPrice3 / 1000, vol: depth.askVol3, type: 'sell' as const, change: depth.askChange3 / 1000, changePct: depth.askChangePct3 },
    { price: depth.askPrice2 / 1000, vol: depth.askVol2, type: 'sell' as const, change: depth.askChange2 / 1000, changePct: depth.askChangePct2 },
    { price: depth.askPrice1 / 1000, vol: depth.askVol1, type: 'sell' as const, change: depth.askChange1 / 1000, changePct: depth.askChangePct1 },
    { price: depth.bidPrice1 / 1000, vol: depth.bidVol1, type: 'buy' as const, change: depth.bidChange1 / 1000, changePct: depth.bidChangePct1 },
    { price: depth.bidPrice2 / 1000, vol: depth.bidVol2, type: 'buy' as const, change: depth.bidChange2 / 1000, changePct: depth.bidChangePct2 },
    { price: depth.bidPrice3 / 1000, vol: depth.bidVol3, type: 'buy' as const, change: depth.bidChange3 / 1000, changePct: depth.bidChangePct3 },
  ] : [];

  const maxVol = priceLevels.length > 0 ? Math.max(...priceLevels.map(l => l.vol), 1) : 1;
  const totalBid = (depth?.bidVol1 ?? 0) + (depth?.bidVol2 ?? 0) + (depth?.bidVol3 ?? 0);
  const totalAsk = (depth?.askVol1 ?? 0) + (depth?.askVol2 ?? 0) + (depth?.askVol3 ?? 0);
  const totalDepth = totalBid + totalAsk;
  const bullRatio = totalDepth > 0 ? Math.round((totalBid / totalDepth) * 100) : 50;
  const bearRatio = 100 - bullRatio;

  const totalVol = depth?.totalVol ?? 0;
  const fBuyVolRaw = depth?.fBuyVol ?? 0;
  const fSellVolRaw = depth?.fSellVol ?? 0;
  const fBuyPct = totalVol > 0 ? ((fBuyVolRaw / totalVol) * 100).toFixed(1) : '0.0';
  const fSellPct = totalVol > 0 ? ((fSellVolRaw / totalVol) * 100).toFixed(1) : '0.0';

  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`h-full w-full text-base flex flex-col rounded-lg overflow-hidden ${isDark ? 'bg-[#282832] text-white' : 'bg-white text-gray-900'}`}>

      {/* Header badge */}
      <div className="flex-none h-[32px]">
        <div className="w-full relative flex justify-center">
          <div className="w-[180px] mx-auto relative">
            <svg className="text-gray-700 absolute inset-0 origin-top-left" width="360" height="48" viewBox="0 0 360 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scale(0.5)' }}>
              <path d="M357.237 2.82376e-05C398.658 2.82376e-05 -39.9387 -3.52971e-05 2.95743 2.82376e-05C45.8536 9.17724e-05 66.301 48 115.04 48H251.002C304.338 48 315.815 2.82376e-05 357.237 2.82376e-05Z" fill="currentColor" />
            </svg>
            <div className="text-black rounded-full relative text-sm text-center px-2 w-24 mx-auto font-semibold" style={{ backgroundColor: '#4ADE80' }}>
              3 Bu&#x1EDB;c Gi&#xE1;
            </div>
          </div>
        </div>
      </div>

      {/* Symbol search */}
      <div className="flex-none px-2 pt-1 pb-1" ref={searchRef}>
        <div className="relative">
          <div className={`flex items-center gap-1 rounded border ${borderColor} ${isDark ? 'bg-[#1a1d2e]' : 'bg-gray-100'} px-2 py-1`}>
            <Search size={12} className={textMuted} />
            <input
              value={inputValue}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => inputValue && setShowDropdown(true)}
              onKeyDown={e => { if (e.key === 'Enter') selectSymbol(inputValue); }}
              placeholder="Nhap ma CK..."
              className={`flex-1 bg-transparent text-xs outline-none ${isDark ? 'text-white' : 'text-gray-900'} placeholder:text-gray-500`}
            />
            {inputValue && (
              <button onClick={() => { setInputValue(''); setSearchResults([]); setShowDropdown(false); }}>
                <X size={11} className={textMuted} />
              </button>
            )}
          </div>
          {showDropdown && searchResults.length > 0 && (
            <div className={`absolute z-50 left-0 right-0 top-full mt-1 rounded border ${borderColor} ${isDark ? 'bg-[#252938]' : 'bg-white'} shadow-lg max-h-[200px] overflow-y-auto`}>
              {searchResults.map(s => (
                <button key={s.ticker} onMouseDown={() => selectSymbol(s.ticker)} className="w-full text-left px-3 py-2 text-xs flex gap-2 hover:bg-white/10">
                  <span className="font-bold text-[#22c55e] w-14">{s.ticker}</span>
                  <span className={`${textMuted} truncate`}>{s.viCompanyName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bull/Bear Ratio Bar */}
      <div className="relative px-2 mb-1">
        <div className="relative flex w-full h-7 rounded-full overflow-hidden group cursor-pointer">
          <div className="absolute inset-0 bg-gray-700 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 bg-black/20 rounded-full p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-lg">
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <polyline points="7 23 3 19 7 15"></polyline>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
          </div>
          <div className="relative text-center py-1 z-10 flex items-center justify-center" style={{ width: `${bullRatio}%`, backgroundColor: '#34C85E', minWidth: bullRatio > 0 ? 20 : 0 }}>
            {bullRatio >= 15 && <span className="text-[10px] font-bold text-gray-900">{bullRatio}%</span>}
          </div>
          <div className="relative bg-red-500 text-center py-1 z-10 flex items-center justify-center" style={{ width: `${bearRatio}%`, minWidth: bearRatio > 0 ? 20 : 0 }}>
            {bearRatio >= 15 && <span className="text-[10px] font-bold text-gray-900">{bearRatio}%</span>}
          </div>
        </div>
      </div>

      {/* Reference price row */}
      {ref > 0 && (
        <div className="flex px-2 pb-0.5">
          <div className="w-full flex bg-[#1a1d2e] rounded-md px-2 py-0.5 text-[11px]">
            <span className="flex-none w-12 text-[#f5c518] font-semibold">{(ref / 1000).toFixed(2)}</span>
            <span className="flex-1 text-gray-500 text-center">Tham chieu</span>
            <span className={`flex-none w-20 text-right font-semibold text-[10px] ${(depth?.change ?? 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              {depth ? `${depth.change >= 0 ? '+' : ''}${(depth.change / 1000).toFixed(2)} (${depth.ratioChange >= 0 ? '+' : ''}${depth.ratioChange.toFixed(2)}%)` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Price Levels Table */}
      <div className="overflow-auto custom-scrollbar flex-1 px-2 mt-1">
        {priceLevels.length === 0 ? (
          <div className={`py-6 text-center text-[11px] ${textMuted}`}>
            {isConnected ? `Dang cho du lieu ${ticker}...` : 'Dang ket noi SignalR...'}
          </div>
        ) : (
          <div className="rounded-lg bg-[#282832] overflow-hidden">
            <div className="grid grid-cols-[48px_1fr_52px_56px] text-[10px] text-gray-500 px-2 py-1 border-b border-white/10">
              <span>Gia</span>
              <span className="text-center">KL Cho</span>
              <span className="text-right">+/-</span>
              <span className="text-right">%</span>
            </div>
            {priceLevels.map((level, index) => {
              if (level.vol <= 0 && level.price <= 0) return null;
              const widthPercent = maxVol > 0 ? (level.vol / maxVol) * 100 : 0;
              const isBuy = level.type === 'buy';
              const colorCls = level.price > 0 ? getPriceColor(level.price * 1000, ref, ceiling, floor) : 'text-gray-500';
              return (
                <div key={index} className="relative overflow-hidden px-2" style={{ height: '26px' }}>
                  <div className={`absolute top-0 bottom-0 left-12 h-full ${isBuy ? 'bg-green-600/20' : 'bg-red-600/20'}`} style={{ width: `${widthPercent}%` }} />
                  <div className="relative z-10 h-full grid grid-cols-[48px_1fr_52px_56px] items-center text-[12px]">
                    <span className={`font-semibold ${colorCls}`}>{level.price > 0 ? level.price.toFixed(2) : ''}</span>
                    <span className={`text-center font-medium ${isBuy ? 'text-green-300' : 'text-red-300'}`}>{level.vol > 0 ? level.vol.toLocaleString() : ''}</span>
                    <span className={`text-right text-[11px] font-semibold ${colorCls}`}>
                      {level.change !== 0 ? `${level.change >= 0 ? '+' : ''}${level.change.toFixed(2)}` : ''}
                    </span>
                    <span className={`text-right text-[11px] font-bold ${colorCls}`}>
                      {level.changePct !== 0 ? `${level.changePct >= 0 ? '+' : ''}${level.changePct.toFixed(2)}%` : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Foreign Investor Section */}
      <div className="flex-none px-2 py-2">
        <div className="rounded-full bg-gray-700 flex justify-between items-center px-3 py-1">
          <div className="text-[11px] font-semibold whitespace-nowrap">
            <span className="text-gray-400">NN Mua </span>
            <span className="text-green-400">{fBuyPct}%</span>
          </div>
          <div className="text-[10px] font-bold text-gray-900 px-2 py-0.5 rounded-full bg-[#4ADE80]">
            {formatVol(totalVol)}
          </div>
          <div className="text-[11px] font-semibold whitespace-nowrap">
            <span className="text-red-400">{fSellPct}%</span>
            <span className="text-gray-400"> NN Ban</span>
          </div>
        </div>
        {(depth?.fBuyVol ?? 0) + (depth?.fSellVol ?? 0) > 0 && (
          <div className="flex justify-between px-1 mt-1 text-[10px] text-gray-500">
            <span>Mua: <span className="text-green-400">{formatVol(fBuyVolRaw)}</span></span>
            <span className="text-gray-600">KL cap nhat</span>
            <span>Ban: <span className="text-red-400">{formatVol(fSellVolRaw)}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}