import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SelectedSymbolState {
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
}

export const useSelectedSymbolStore = create<SelectedSymbolState>()(
  persist(
    (set) => ({
      selectedSymbol: '',
      setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
    }),
    { name: 'selected-symbol' }
  )
);
