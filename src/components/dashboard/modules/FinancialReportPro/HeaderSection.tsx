"use client";

/**
 * HeaderSection Component
 * Header với Lock, Filters, và Title với SVG decoration
 */

import React from 'react';
import LockToggle from './LockToggle';
import PeriodTypeSelect from './PeriodTypeSelect';
import TickerSearchBox from './TickerSearchBox';
import IndustrySelect from './IndustrySelect';
import FilterLayoutSelector from './FilterLayoutSelector';

export default function HeaderSection() {
  return (
    <div className="flex flex-col md:flex-row justify-between mb-2 gap-2">
      {/* Left side: Lock + Filters */}
      <div className="flex-1 flex flex-wrap items-center gap-1 py-1 px-2 overflow-x-auto">
        <LockToggle />
        <PeriodTypeSelect />
        <TickerSearchBox />
        <IndustrySelect />
      </div>

      {/* Center: Title với SVG decoration */}
      <div className="flex-none hidden md:block">
        <div className="flex relative origin-top-left text-yellow-400">
          {/* Left SVG */}
          <svg
            className="origin-top-left transform scale-x-[-1]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            width="30"
            height="32"
            viewBox="0 0 30 32"
          >
            <path
              d="M30,32C32.56273,31.7585,37.31779,31.219,40.7812,28C44.2447,24.781,46.875,18.1176,47.9297,15.8824C48.846599999999995,13.939,51.3281,8.47059,53.3163,4.94118C55.3347,1.35811,59.145399999999995,0,59.9781,0L30,0L30,32Z"
              fill="currentColor"
            />
          </svg>

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

          {/* Right SVG */}
          <svg
            className="origin-top-left"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            width="30"
            height="32"
            viewBox="0 0 30 32"
          >
            <path
              d="M0,32C2.56273,31.7585,7.31779,31.219,10.7812,28C14.2447,24.781,16.875,18.1176,17.9297,15.8824C18.8466,13.939,21.3281,8.47059,23.3163,4.94118C25.3347,1.35811,29.1454,0,29.9781,0L0,0L0,32Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* Right side: Layout selectors */}
      <div className="flex-1 flex flex-wrap items-center justify-end gap-2 py-1 px-2 md:px-8 overflow-x-auto">
        <FilterLayoutSelector />
      </div>
    </div>
  );
}
