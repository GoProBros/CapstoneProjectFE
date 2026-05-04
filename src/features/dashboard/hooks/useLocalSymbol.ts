import { useState, useCallback } from 'react';
import { useModule } from '@/contexts/ModuleContext';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

/**
 * Persists the local (unlinked) symbol for each module instance.
 * Storage key: `module_ticker_<moduleId>`.
 *
 * - When isLinked=true at mount: initialises from the global store symbol.
 * - When isLinked=false at mount: reads from localStorage first, falls back
 *   to the global store symbol so the first render is never blank.
 * - The setter ALWAYS writes to localStorage so the value is ready for the
 *   next page load regardless of link state.
 */
export function useLocalSymbol(
  isLinked: boolean,
  fallback = 'FPT',
): [string, (ticker: string) => void] {
  const mod = useModule();
  const storageKey = mod?.moduleId ? `module_ticker_${mod.moduleId}` : null;

  const [localSymbol, setLocalSymbolState] = useState<string>(() => {
    const global = useSelectedSymbolStore.getState().selectedSymbol || fallback;
    if (isLinked || !storageKey) return global;
    try {
      return localStorage.getItem(storageKey) || global;
    } catch {
      return global;
    }
  });

  const setLocalSymbol = useCallback(
    (ticker: string) => {
      setLocalSymbolState(ticker);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, ticker);
        } catch { /* storage unavailable */ }
      }
    },
    [storageKey],
  );

  return [localSymbol, setLocalSymbol];
}
