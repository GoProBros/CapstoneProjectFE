import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSubscriptionDto } from '@/types/subscription';

/**
 * Parse raw allowedModules value from API (JSONB array) into an array of
 * module key strings (e.g. ['heatmap', 'stock-screener', ...]).
 * Returns empty array if the value is absent — empty means "no restrictions".
 */
function parseAllowedModuleKeys(raw: unknown): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        return String(obj.id ?? obj.moduleId ?? obj.name ?? obj.key ?? '');
      }
      return String(item);
    })
    .filter(Boolean);
}

interface SubscriptionState {
  mySubscription: UserSubscriptionDto | null;
  setMySubscription: (sub: UserSubscriptionDto | null) => void;
  clearSubscription: () => void;
  /** Convenience getter: max workspaces the user is allowed */
  maxWorkspaces: number;
  /**
   * Parsed list of module keys the user is allowed to use.
   * Empty array means no restrictions (free tier / admin / loading).
   */
  allowedModuleKeys: string[];
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      mySubscription: null,
      maxWorkspaces: 6, // default fallback
      allowedModuleKeys: [],

      setMySubscription: (sub) =>
        set({
          mySubscription: sub,
          maxWorkspaces: sub?.maxWorkspaces ?? 6,
          allowedModuleKeys: sub ? parseAllowedModuleKeys(sub.allowedModules) : [],
        }),

      clearSubscription: () =>
        set({ mySubscription: null, maxWorkspaces: 6, allowedModuleKeys: [] }),
    }),
    {
      name: 'subscription-store',
    }
  )
);
