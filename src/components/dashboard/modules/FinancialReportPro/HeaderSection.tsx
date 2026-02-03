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

      {/* Center: Title với SVG decoration */}
      <div className="flex-none hidden md:block">
        <div className="flex relative origin-top-left text-yellow-400 rounded-b-lg overflow-hidden">
          {/* Title */}
          <div className="relative overflow-hidden -mx-0.5">
            <svg
              className="absolute inset-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <rect width="100%" height="100%" fill="currentColor" />
            </svg>
            <div className="text-center font-semibold leading-8 text-[1.25rem] relative z-10 text-black px-4">
              Báo cáo tài chính
            </div>
          </div>
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
