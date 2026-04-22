"use client";

import { useState, useEffect, useCallback, useRef, type MutableRefObject } from 'react';
import type { KLineData } from 'klinecharts';
import { useSignalR } from '@/contexts/SignalRContext';
import { fetchSymbols } from '@/services/market/symbolService';
import ohlcvService from '@/services/market/ohlcvService';
import type { SymbolData } from '@/types/symbol';
import { useOhlcvSignalR } from './useOhlcvSignalR';
import type { TimeInterval } from './useChartPreferences';

export const TIMEFRAME_MAP: Record<TimeInterval, string> = {
  '1m': 'M1',
  '5m': 'M5',
  '15m': 'M15',
  '30m': 'M30',
  '1h': 'H1',
  '4h': 'H4',
  '1d': 'D1',
  '1w': 'W1',
  '1M': 'MN1',
};

export const VISIBLE_BARS_MAP: Record<TimeInterval, number> = {
  '1m': 200,
  '5m': 150,
  '15m': 120,
  '30m': 100,
  '1h': 100,
  '4h': 90,
  '1d': 180,
  '1w': 150,
  '1M': 60,
};

interface OhlcvSnapshot {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface UseChartDataReturn {
  isLoading: boolean;
  currentPrice: number | null;
  priceChange: number | null;
  priceChangePercent: number | null;
  ohlcvData: OhlcvSnapshot | null;
  lastUpdateTime: string;
  allSymbols: SymbolData[];
  fetchOHLCVData: (ticker: string, timeframe?: string) => Promise<KLineData[]>;
  realtimeCallbackRef: MutableRefObject<((data: KLineData) => void) | null>;
  pendingUpdatesRef: MutableRefObject<KLineData[]>;
}

export function useChartData({
  symbol,
  timeInterval,
}: {
  symbol: string;
  timeInterval: TimeInterval;
}): UseChartDataReturn {
  const { isConnected: marketDataConnected, subscribeToSymbols, unsubscribeFromSymbols, marketData } = useSignalR();

  const realtimeCallbackRef = useRef<((data: KLineData) => void) | null>(null);
  const pendingUpdatesRef = useRef<KLineData[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null);
  const [ohlcvData, setOhlcvData] = useState<OhlcvSnapshot | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [allSymbols, setAllSymbols] = useState<SymbolData[]>([]);

  const updateTimestamp = useCallback(() => {
    const now = new Date();
    setLastUpdateTime(
      `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    );
  }, []);

  const handleCandleUpdate = useCallback((candle: any) => {
    const klineData: KLineData = {
      timestamp: new Date(candle.startTime).getTime(),
      open: candle.open / 1000,
      high: candle.high / 1000,
      low: candle.low / 1000,
      close: candle.close / 1000,
      volume: candle.volume || 0,
    };

    setCurrentPrice(klineData.close);
    setOhlcvData({
      open: klineData.open,
      high: klineData.high,
      low: klineData.low,
      close: klineData.close,
      volume: klineData.volume ?? 0,
    });

    if (klineData.open > 0) {
      const change = klineData.close - klineData.open;
      const changePercent = (change / klineData.open) * 100;
      setPriceChange(change);
      setPriceChangePercent(changePercent);
    }

    updateTimestamp();

    if (realtimeCallbackRef.current) {
      realtimeCallbackRef.current(klineData);
    } else {
      pendingUpdatesRef.current.push(klineData);
      if (pendingUpdatesRef.current.length > 100) {
        pendingUpdatesRef.current = pendingUpdatesRef.current.slice(-100);
      }
    }
  }, [updateTimestamp]);

  // Real-time OHLCV candle updates via dedicated SignalR hook
  useOhlcvSignalR(symbol, TIMEFRAME_MAP[timeInterval], { onCandleUpdate: handleCandleUpdate });

  // Load all symbols on mount
  useEffect(() => {
    const loadSymbols = async () => {
      try {
        const symbols = await fetchSymbols({ PageSize: 5000, PageIndex: 1 });
        setAllSymbols(symbols);
      } catch (error) {
        console.error('Error fetching symbols:', error);
      }
    };
    loadSymbols();
  }, []);

  // Subscribe symbol for real-time price from Redis via SignalR
  useEffect(() => {
    if (marketDataConnected && symbol) {
      subscribeToSymbols([symbol]);
      return () => { unsubscribeFromSymbols([symbol]); };
    }
  }, [symbol, marketDataConnected, subscribeToSymbols, unsubscribeFromSymbols]);

  // Update price display from marketData map
  useEffect(() => {
    if (marketData.size > 0) {
      const realtimeData = marketData.get(symbol);
      if (realtimeData) {
        const price = realtimeData.lastPrice || realtimeData.referencePrice || 0;
        const refPrice = realtimeData.referencePrice || price;
        const changePercent = refPrice !== 0 ? ((price - refPrice) / refPrice * 100) : 0;
        const change = price - refPrice;

        setCurrentPrice(price / 1000);
        setPriceChange(change / 1000);
        setPriceChangePercent(changePercent);

        const rd = realtimeData as any;
        if (rd.open || rd.high || rd.low) {
          setOhlcvData({
            open: (rd.open || price) / 1000,
            high: (rd.high || price) / 1000,
            low: (rd.low || price) / 1000,
            close: price / 1000,
            volume: realtimeData.totalVol || 0,
          });
        }

        updateTimestamp();
      }
    }
  }, [marketData, symbol, updateTimestamp]);

  const fetchOHLCVData = useCallback(async (ticker: string, timeframe: string = 'D1'): Promise<KLineData[]> => {
    try {
      setIsLoading(true);
      const { fromDate, toDate } = ohlcvService.calculateDateRange(timeframe);
      const result = await ohlcvService.fetchOhlcvData({ ticker, timeframe, fromDate, toDate, useCache: true });

      if (result?.data) {
        const klineData: KLineData[] = result.data.map((item: any) => ({
          timestamp: item.time,
          open: item.open / 1000,
          high: item.high / 1000,
          low: item.low / 1000,
          close: item.close / 1000,
          volume: item.volume || 0,
        }));
        klineData.sort((a, b) => a.timestamp - b.timestamp);
        return klineData;
      }
      return [];
    } catch (error) {
      console.error('Error fetching OHLCV data:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    currentPrice,
    priceChange,
    priceChangePercent,
    ohlcvData,
    lastUpdateTime,
    allSymbols,
    fetchOHLCVData,
    realtimeCallbackRef,
    pendingUpdatesRef,
  };
}
