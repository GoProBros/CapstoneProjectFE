'use client';

/**
 * useIndexSignalR Hook
 * Combines REST initial load + SignalR live updates for market index data.
 *
 * Returns:
 *  - indexData:   Map<code, LiveIndexData>   — latest snapshot per index
 *  - historyData: Map<code, number[]>        — intraday values (oldest→newest), capped at 1500 pts
 *  - isLoading, isConnected, error
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSignalR } from '@/contexts/SignalRContext';
import SignalRService from '@/services/market/signalRService';
import { fetchLiveIndices, fetchIndexIntraday, DEFAULT_INDEX_CODES } from '@/services/market/indexService';
import type { LiveIndexData, IndexHistoryPoint } from '@/types/marketIndex';

// Full trading day at 5s intervals ≈ 3,240 pts; keep 4000 as buffer for live SignalR appends
const MAX_HISTORY = 4000;

export interface UseIndexSignalRReturn {
  indexData: Map<string, LiveIndexData>;
  historyData: Map<string, IndexHistoryPoint[]>;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
}

export function useIndexSignalR(
  codes: string[] = [...DEFAULT_INDEX_CODES]
): UseIndexSignalRReturn {
  const { isConnected } = useSignalR();

  const [indexData, setIndexData] = useState<Map<string, LiveIndexData>>(new Map());
  const [historyData, setHistoryData] = useState<Map<string, IndexHistoryPoint[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const subscribedRef = useRef(false);

  // ── Initial REST load ──────────────────────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch snapshots and intraday history in parallel.
      // fetchLiveIndices has its own .catch so a backend error (e.g. 404 before restart)
      // returns [] without crashing the intraday fetches alongside it.
      const [snapshots, ...histories] = await Promise.all([
        fetchLiveIndices(codes).catch((err: any) => {
          console.warn('[useIndexSignalR] fetchLiveIndices failed:', err?.message);
          return [] as LiveIndexData[];
        }),
        ...codes.map(code => fetchIndexIntraday(code).catch(() => [])),
      ]);

      if (!isMountedRef.current) return;

      const dataMap = new Map<string, LiveIndexData>();
      (snapshots as LiveIndexData[]).forEach(s => dataMap.set(s.code, s));
      setIndexData(dataMap);

      const histMap = new Map<string, IndexHistoryPoint[]>();
      codes.forEach((code, i) => {
        const pts = (histories[i] ?? []) as IndexHistoryPoint[];
        histMap.set(code, pts);
      });
      setHistoryData(histMap);
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.message || 'Không thể tải dữ liệu chỉ số');
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [codes.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    isMountedRef.current = true;
    loadInitialData();
    return () => { isMountedRef.current = false; };
  }, [loadInitialData]);

  // ── Periodic retry when no data ───────────────────────────────────────────
  // If Redis has no MI data yet (SSI streaming just started), retry every 15s.
  useEffect(() => {
    if (indexData.size > 0) return; // Already have data, no need to poll
    const id = setInterval(() => {
      if (isMountedRef.current && indexData.size === 0) {
        loadInitialData();
      }
    }, 15_000);
    return () => clearInterval(id);
  }, [indexData.size, loadInitialData]);

  // ── SignalR subscription ───────────────────────────────────────────────────
  useEffect(() => {
    const service = SignalRService.getInstance();

    // Register callback (safe to add before connected)
    const unregister = service.onIndexDataReceived((data: LiveIndexData) => {
      if (!isMountedRef.current) return;

      setIndexData(prev => {
        const next = new Map(prev);
        next.set(data.code, data);
        return next;
      });

      setHistoryData(prev => {
        const next = new Map(prev);
        const current = next.get(data.code) ?? [];
        // data.timestamp is UTC ISO string — convert to VN local HH:mm:ss
        const rawTs = data.timestamp ?? '';
        let timeStr = '00:00:00';
        if (rawTs.length >= 19) {
          const utcDate = new Date(rawTs.endsWith('Z') ? rawTs : rawTs + 'Z');
          utcDate.setHours(utcDate.getHours() + 7);
          const h = String(utcDate.getUTCHours()).padStart(2, '0');
          const m = String(utcDate.getUTCMinutes()).padStart(2, '0');
          const s = String(utcDate.getUTCSeconds()).padStart(2, '0');
          timeStr = `${h}:${m}:${s}`;
        }
        const point: IndexHistoryPoint = { time: timeStr, value: data.indexValue };
        const updated = [...current, point];
        next.set(data.code, updated.length > MAX_HISTORY ? updated.slice(-MAX_HISTORY) : updated);
        return next;
      });
    });

    // Subscribe to groups once connected
    if (isConnected && !subscribedRef.current) {
      subscribedRef.current = true;
      service.subscribeToIndices(codes).catch(err => {
        console.error('[useIndexSignalR] subscribeToIndices failed:', err);
      });
    }

    return () => {
      unregister();
      // Unsubscribe only if we actually subscribed
      if (subscribedRef.current) {
        subscribedRef.current = false;
        service.unsubscribeFromIndices(codes).catch(() => {});
      }
    };
  }, [isConnected, codes.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { indexData, historyData, isLoading, isConnected, error };
}
