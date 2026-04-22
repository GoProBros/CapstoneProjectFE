"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

export type ChartType = 'candle_solid' | 'candle_stroke' | 'candle_up_stroke' | 'candle_down_stroke' | 'ohlc' | 'area';
export type TimeInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

interface UseChartPreferencesReturn {
  chartType: ChartType;
  setChartType: Dispatch<SetStateAction<ChartType>>;
  timeInterval: TimeInterval;
  setTimeInterval: Dispatch<SetStateAction<TimeInterval>>;
  symbol: string;
  setSymbol: Dispatch<SetStateAction<string>>;
  showVolume: boolean;
  setShowVolume: Dispatch<SetStateAction<boolean>>;
  showGrid: boolean;
  setShowGrid: Dispatch<SetStateAction<boolean>>;
  activeIndicators: Set<string>;
  setActiveIndicators: Dispatch<SetStateAction<Set<string>>>;
}

export function useChartPreferences(): UseChartPreferencesReturn {
  const [chartType, setChartType] = useState<ChartType>(() =>
    (typeof window !== 'undefined' ? localStorage.getItem('vnschart-chartType') as ChartType : null) ?? 'candle_solid'
  );
  const [timeInterval, setTimeInterval] = useState<TimeInterval>(() =>
    (typeof window !== 'undefined' ? localStorage.getItem('vnschart-timeInterval') as TimeInterval : null) ?? '1d'
  );
  const [symbol, setSymbol] = useState(() =>
    (typeof window !== 'undefined' ? localStorage.getItem('vnschart-symbol') : null) ?? 'FPT'
  );
  const [activeIndicators, setActiveIndicators] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set<string>();
    try {
      const saved = localStorage.getItem('vnschart-indicators');
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [showVolume, setShowVolume] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('vnschart-showVolume') === 'true'
  );
  const [showGrid, setShowGrid] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('vnschart-showGrid') !== 'false' : true
  );

  useEffect(() => { localStorage.setItem('vnschart-symbol', symbol); }, [symbol]);
  useEffect(() => { localStorage.setItem('vnschart-timeInterval', timeInterval); }, [timeInterval]);
  useEffect(() => { localStorage.setItem('vnschart-chartType', chartType); }, [chartType]);
  useEffect(() => { localStorage.setItem('vnschart-indicators', JSON.stringify([...activeIndicators])); }, [activeIndicators]);
  useEffect(() => { localStorage.setItem('vnschart-showVolume', String(showVolume)); }, [showVolume]);
  useEffect(() => { localStorage.setItem('vnschart-showGrid', String(showGrid)); }, [showGrid]);

  return {
    chartType, setChartType,
    timeInterval, setTimeInterval,
    symbol, setSymbol,
    showVolume, setShowVolume,
    showGrid, setShowGrid,
    activeIndicators, setActiveIndicators,
  };
}
