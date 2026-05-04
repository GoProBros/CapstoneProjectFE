import { useCallback, useState } from 'react';
import { useModule } from '@/contexts/ModuleContext';

/**
 * Persists the "link to global symbol" toggle for each module instance.
 * Uses localStorage key `module_linked_<moduleId>` so the state survives F5.
 * Falls back to `false` when no moduleId is available.
 */
export function useLinkedState(): [boolean, (v: boolean | ((prev: boolean) => boolean)) => void] {
  const module = useModule();
  const storageKey = module?.moduleId ? `module_linked_${module.moduleId}` : null;

  const [isLinked, setIsLinkedState] = useState<boolean>(() => {
    if (!storageKey) return false;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const setIsLinked = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setIsLinkedState((prev) => {
        const next = typeof value === 'function' ? value(prev) : value;
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, String(next));
          } catch { /* storage unavailable */ }
        }
        return next;
      });
    },
    [storageKey],
  );

  return [isLinked, setIsLinked];
}
