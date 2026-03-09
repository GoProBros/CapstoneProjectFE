"use client";

/**
 * HeaderSection Component
 * Memoized header with filters and title decoration
 */

import React, { memo } from 'react';
import LockToggle from './LockToggle';
import TickerSearchBox from './TickerSearchBox';
import IndustrySelect from './IndustrySelect';
import FilterLayoutSelector from './FilterLayoutSelector';

const HeaderSection = memo(function HeaderSection() {
  return (
    <div className="flex flex-col md:flex-row justify-between mb-2 gap-2">
      {/* Left side: Lock + Filters */}
      <div className="flex-1 flex flex-wrap items-center gap-1 py-1 px-2 overflow-x-auto">
        <LockToggle />
        <TickerSearchBox />
        <IndustrySelect />
      </div>

      {/* Center: Badge title */}
      <div className="flex-none hidden md:flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <svg width="220" height="34" viewBox="0 0 136 22" className="block">
            <path d="M134 0C151 0 -15 0 2 0C19 0 27 22 46 22H92C113 22 119 0 134 0Z" fill="#4ADE80"/>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[14px] font-bold text-black tracking-wide">
            Báo cáo tài chính
          </span>
        </div>
      </div>

      {/* Right side: Layout selectors */}
      <div className="flex-1 flex flex-wrap items-center justify-end gap-2 py-1 px-2 md:px-8 overflow-x-auto">
        {/* <FilterLayoutSelector /> */}
      </div>
    </div>
  );
});

export default HeaderSection;
