import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSubscriptionDto } from '@/types/subscription';

interface SubscriptionState {
  mySubscription: UserSubscriptionDto | null;
  setMySubscription: (sub: UserSubscriptionDto | null) => void;
  clearSubscription: () => void;
  /** Convenience getter: max workspaces the user is allowed */
  maxWorkspaces: number;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      mySubscription: null,
      maxWorkspaces: 6, // default fallback

      setMySubscription: (sub) =>
        set({
          mySubscription: sub,
          maxWorkspaces: sub?.maxWorkspaces ?? 6,
        }),

      clearSubscription: () =>
        set({ mySubscription: null, maxWorkspaces: 6 }),
    }),
    {
      name: 'subscription-store',
    }
  )
);
