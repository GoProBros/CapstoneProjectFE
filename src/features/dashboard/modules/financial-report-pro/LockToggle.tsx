"use client";

/**
 * LockToggle Component
 * Link2/Link2Off toggle that syncs with the global selectedSymbolStore
 */

import React from 'react';
import { Link2, Link2Off } from 'lucide-react';
import { useFinancialReportStore } from '@/stores/financialReportStore';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

export default function LockToggle() {
  const { lockState, toggleLock, setTickerList } = useFinancialReportStore();

  const handleChange = () => {
    // When transitioning from unlocked → locked, capture the currently selected symbol
    if (!lockState) {
      const selected = useSelectedSymbolStore.getState().selectedSymbol;
      if (selected) {
        setTickerList([selected]);
      }
    }
    toggleLock();
  };

  return (
    <button
      type="button"
      onClick={handleChange}
      title={lockState ? 'Đang đồng bộ mã — nhấn để tách biệt' : 'Đang tách biệt — nhấn để đồng bộ'}
      className={`rounded p-1 transition-colors ${
        lockState
          ? 'text-green-400 hover:bg-green-500/15'
          : 'text-gray-500 hover:bg-white/8'
      }`}
    >
      {lockState ? <Link2 size={15} /> : <Link2Off size={15} />}
    </button>
  );
}
