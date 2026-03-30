'use client';

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { LiveIndexData, IndexHistoryPoint } from '@/types/marketIndex';

interface IndexMiniChartProps {
  data: LiveIndexData;
  history: IndexHistoryPoint[];
  onRemove?: () => void;
}

const fmt = (n: number, dp = 2) =>
  n.toLocaleString('vi-VN', { minimumFractionDigits: dp, maximumFractionDigits: dp });

/**
 * Convert VN local time string "H:mm:ss" or "HH:mm:ss" to milliseconds offset
 * from today's local midnight. Handles both single-digit and double-digit hours.
 */
function toTimestamp(vnTime: string, midnight: number): number {
  const parts = vnTime.split(':');
  const h = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  const s = parseInt(parts[2] ?? '0', 10);
  return midnight + h * 3_600_000 + m * 60_000 + s * 1_000;
}

export default function IndexMiniChart({ data, history, onRemove }: IndexMiniChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const ecRef    = useRef<echarts.ECharts | null>(null);

  const isUp  = data.change >= 0;
  const color = isUp ? '#22c55e' : '#ef4444';
  const sign  = isUp ? '+' : '';

  function buildOption() {
    const ref = data.refIndex;

    // Use today's local midnight as base so hour offsets align correctly
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const midnight = todayMidnight.getTime();

    // Convert each VN "HH:mm:ss" time to a real timestamp for the time axis
    const seriesData: [number, number][] = history.map(p => [
      toTimestamp(p.time, midnight),
      p.value,
    ]);

    return {
      animation: false,
      backgroundColor: 'transparent',
      grid: { top: 6, right: 52, bottom: 22, left: 2, containLabel: false },
      xAxis: {
        type: 'time',
        min: midnight + 9 * 3_600_000,   // 09:00 VN
        max: midnight + 15 * 3_600_000,  // 15:00 VN
        minInterval: 3_600_000,           // ticks every 1 hour
        maxInterval: 3_600_000,
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          show: true,
          fontSize: 9,
          color: '#6b7280',
          // Derive hour purely from offset so timezone doesn't matter
          formatter: (value: number) => {
            const h = Math.round((value - midnight) / 3_600_000);
            return h + 'h';
          },
        },
      },
      yAxis: {
        type: 'value',
        show: false,
        min: (v: { min: number }) => {
          const base = ref > 0 ? Math.min(v.min, ref) : v.min;
          return base * 0.9993;
        },
        max: (v: { max: number }) => {
          const base = ref > 0 ? Math.max(v.max, ref) : v.max;
          return base * 1.0007;
        },
      },
      series: [
        {
          type: 'line',
          data: seriesData,
          symbol: 'none',
          lineStyle: { color, width: 1.5 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + '50' },
              { offset: 1, color: color + '05' },
            ]),
          },
          ...(ref > 0 ? {
            markLine: {
              silent: true,
              symbol: ['none', 'none'],
              lineStyle: { color: '#4b5563', type: 'dashed', width: 1 },
              label: {
                show: true,
                position: 'insideEndTop',
                fontSize: 9,
                color: '#9ca3af',
                backgroundColor: 'transparent',
                padding: [1, 4],
                formatter: () => fmt(ref),
              },
              data: [{ yAxis: ref }],
            },
          } : {}),
        },
      ],
    };
  }

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, null, { renderer: 'canvas' });
    ecRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(chartRef.current);
    return () => { ro.disconnect(); chart.dispose(); ecRef.current = null; };
  }, []);

  useEffect(() => {
    ecRef.current?.setOption(buildOption(), { notMerge: true, silent: true });
  });

  const valT = (data.totalMatchVal / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 px-2 pt-1.5 pb-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-bold tracking-wide text-gray-100">{data.code}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold tabular-nums" style={{ color }}>
              {fmt(data.indexValue)}
            </span>
            {onRemove && (
              <button
                onClick={onRemove}
                className="shrink-0 text-gray-600 hover:text-gray-300 transition-colors leading-none"
                style={{ fontSize: '10px' }}
                title="Bỏ hiển thị biểu đồ"
              >✕</button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[9px] tabular-nums" style={{ color }}>
            {sign}{fmt(data.change)} ({sign}{fmt(data.ratioChange)}%)
          </span>
          <span className="text-[9px] text-gray-500 tabular-nums">
            {(data.advanceCount + data.declineCount + data.noChangeCount) > 0 ? (
              <>
                <span className="text-green-500">{data.advanceCount}▲</span>
                {' '}<span className="text-gray-400">{data.noChangeCount}—</span>
                {' '}<span className="text-red-500">{data.declineCount}▼</span>
                {(data.ceilingCount > 0 || data.floorCount > 0) && (
                  <> {' '}·{' '}
                    {data.ceilingCount > 0 && <span className="text-purple-400">{data.ceilingCount}⌈</span>}
                    {data.floorCount > 0 && <>{' '}<span className="text-cyan-400">{data.floorCount}⌋</span></>}
                  </>
                )}
              </>
            ) : (
              <>
                {data.ceilingCount > 0 && <span className="text-purple-400">{data.ceilingCount}⌈{' '}</span>}
                {data.floorCount > 0 && <span className="text-cyan-400">{data.floorCount}⌋{' '}</span>}
                {(data.ceilingCount + data.floorCount) === 0 && <span className="text-gray-700">—</span>}
              </>
            )}
            {' '}· {valT}tỷ
          </span>
        </div>
      </div>

      {/* ── Chart ── */}
      <div ref={chartRef} className="flex-1 min-h-0" />
    </div>
  );
}
