'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useIndexSignalR } from '@/hooks/useIndexSignalR';
import IndexMiniChart from './IndexModule/IndexMiniChart';
import { getMarketIndices } from '@/services/market/marketIndexService';
import type { LiveIndexData, IndexHistoryPoint } from '@/types/marketIndex';

const DEFAULT_CHART = ['VNINDEX', 'VN30', 'HNX30', 'HNXINDEX'];
const LS_KEY        = 'index-module-chart-codes';

const f  = (n: number, dp = 2) => n.toLocaleString('vi-VN', { minimumFractionDigits: dp, maximumFractionDigits: dp });
const fM = (n: number)         => (n / 1_000_000).toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const fT = (n: number)         => (n / 1_000_000_000).toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

function loadSavedCodes(): string[] {
  if (typeof window === 'undefined') return DEFAULT_CHART;
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_CHART;
}

interface TableRowProps {
  d: LiveIndexData;
  isCharted: boolean;
  onToggle: (code: string) => void;
}

function TableRow({ d, isCharted, onToggle }: TableRowProps) {
  const up    = d.change >= 0;
  const color = up ? '#22c55e' : '#ef4444';
  const sign  = up ? '+' : '';

  return (
    <tr
      className={`border-b border-gray-700/20 cursor-pointer transition-colors ${
        isCharted ? 'bg-white/[0.06] hover:bg-white/[0.09]' : 'hover:bg-white/[0.04]'
      }`}
      onClick={() => onToggle(d.code)}
      title={isCharted ? 'Bỏ hiển thị biểu đồ' : 'Hiển thị biểu đồ'}
    >
      {/* Chart indicator dot */}
      <td className="py-[5px] pl-2 pr-0 w-4">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full transition-colors ${
            isCharted ? 'bg-blue-400' : 'bg-transparent border border-gray-600'
          }`}
        />
      </td>
      <td className="py-[5px] pl-1 pr-1 text-left font-medium text-gray-200 whitespace-nowrap"
          style={{ fontSize: '11px' }}>
        {d.code}
      </td>
      <td className="py-[5px] px-1 tabular-nums text-right" style={{ color, fontSize: '11px' }}>
        {f(d.indexValue)}
      </td>
      <td className="py-[5px] px-1 tabular-nums text-right whitespace-nowrap" style={{ color, fontSize: '10px' }}>
        {sign}{f(d.change)} ({sign}{f(d.ratioChange)}%)
      </td>
      <td className="py-[5px] px-1 tabular-nums text-right text-gray-300" style={{ fontSize: '10px' }}>
        {fM(d.totalMatchVol)}
      </td>
      <td className="py-[5px] px-1 tabular-nums text-right text-gray-300" style={{ fontSize: '10px' }}>
        {fT(d.totalMatchVal)}
      </td>
      <td className="py-[5px] pl-1 pr-3 text-right" style={{ fontSize: '10px' }}>
        <span className="text-green-400">↑&thinsp;{d.advanceCount}</span>
        {'  '}
        <span className="text-gray-500">—&thinsp;{d.noChangeCount}</span>
        {'  '}
        <span className="text-red-400">↓&thinsp;{d.declineCount}</span>
      </td>
    </tr>
  );
}

export default function IndexModule() {
  const [chartCodes, setChartCodes] = useState<string[]>(loadSavedCodes);
  const [allCodes, setAllCodes] = useState<string[]>([]);

  useEffect(() => {
    getMarketIndices({ status: 1, pageSize: 100 })
      .then((res) => {
        if (res.data?.items && res.data.items.length > 0) {
          setAllCodes(res.data.items.map((i) => i.code));
        }
      })
      .catch((err) => console.error('[IndexModule] Failed to load index codes:', err));
  }, []);

  const { indexData, historyData, isLoading } = useIndexSignalR(allCodes);

  const toggleChart = useCallback((code: string) => {
    setChartCodes(prev => {
      const next = prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code];
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  if (allCodes.length === 0 || (isLoading && indexData.size === 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-xs text-gray-500">Đang tải dữ liệu chỉ số…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Badge title — same style as HeatmapModule / SmartBoardModule */}
      <div className="flex-none flex items-center justify-center pt-1.5 pb-0.5">
        <div className="relative flex items-center justify-center cursor-move drag-handle select-none">
          <svg width="320" height="28" viewBox="0 0 200 22" className="block whitespace-nowrap">
            <path d="M198 0C215 0 -15 0 2 0C19 0 27 22 46 22H156C175 22 181 0 198 0Z" fill="#4ADE80"/>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-black tracking-wide">
            Chỉ số thị trường
          </span>
        </div>
      </div>
      <div className="flex flex-1 min-h-0 overflow-hidden divide-x divide-gray-700/30">
      {/* Dynamic sparkline chart columns (in selection order) */}
      {chartCodes.map(code => {
        const snap = indexData.get(code);
        const hist: IndexHistoryPoint[] = historyData.get(code) ?? [];
        if (!snap) {
          return (
            <div key={code} className="flex-1 flex flex-col items-center justify-center gap-1">
              <span className="text-[10px] text-gray-500 font-medium">{code}</span>
              <span className="text-[9px] text-gray-700">Đang chờ dữ liệu…</span>
            </div>
          );
        }
        return (
          <div key={code} className="flex-1 min-w-0">
            <IndexMiniChart
              data={snap}
              history={hist}
              onRemove={() => toggleChart(code)}
            />
          </div>
        );
      })}

        {/* Summary table — always visible, click row to toggle chart */}
        <div className="flex-[2] min-w-0 overflow-auto">
          <table className="w-full border-collapse">
          <thead>
            <tr className="sticky top-0 z-10 bg-cardBackground border-b border-gray-700/40">
              <th className="py-[5px] pl-2 pr-0 w-4" />{/* dot col */}
              {['Chỉ số', 'Điểm', '‹ +/- ›', 'KLGD (Triệu)', 'GTGD (Tỷ)', 'CK Tăng/Giảm'].map(h => (
                <th
                  key={h}
                  className="py-[5px] px-1 font-semibold text-gray-400 whitespace-nowrap text-right first:text-left last:pr-3"
                  style={{ fontSize: '10px' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allCodes.map(code => {
              const d = indexData.get(code);
              if (d) {
                return <TableRow key={code} d={d} isCharted={chartCodes.includes(code)} onToggle={toggleChart} />;
              }
              // Skeleton row shown while waiting for SSI streaming data
              return (
                <tr key={code} className="border-b border-gray-700/20">
                  <td className="py-[5px] pl-2 pr-0 w-4">
                    <span className="inline-block w-1.5 h-1.5 rounded-full border border-gray-700" />
                  </td>
                  <td className="py-[5px] pl-1 pr-1 text-left text-gray-500" style={{ fontSize: '11px' }}>
                    {code}
                  </td>
                  <td colSpan={5} className="py-[5px] px-1 text-right text-gray-700" style={{ fontSize: '10px' }}>
                    —
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

