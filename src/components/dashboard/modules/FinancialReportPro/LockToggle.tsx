"use client";

/**
 * LockToggle Component
 * Custom SVG animation for lock/unlock state
 */

import React from 'react';
import { useFinancialReportStore } from '@/stores/financialReportStore';

export default function LockToggle() {
  const { lockState, toggleLock } = useFinancialReportStore();

  return (
    <div className="relative inline-flex">
      <span className="mr-1">
        <input
          id="inpLock"
          type="checkbox"
          className="hidden"
          checked={lockState}
          onChange={toggleLock}
        />
        <label
          htmlFor="inpLock"
          className="btn-lock cursor-pointer inline-block"
        >
          <svg
            width="18"
            height="20"
            viewBox="0 0 36 40"
            className="transition-all duration-300"
          >
            <path
              className={`lockb fill-current transition-all duration-300 ${
                lockState ? 'text-green-500' : 'text-gray-400'
              }`}
              d="M27 27C27 34.1797 21.1797 40 14 40C6.8203 40 1 34.1797 1 27C1 19.8203 6.8203 14 14 14C21.1797 14 27 19.8203 27 27ZM15.6298 26.5191C16.4544 25.9845 17 25.056 17 24C17 22.3431 15.6569 21 14 21C12.3431 21 11 22.3431 11 24C11 25.056 11.5456 25.9845 12.3702 26.5191L11 32H17L15.6298 26.5191Z"
            />
            <path
              className={`lock stroke-current stroke-[2] fill-none transition-all duration-300 ${
                lockState ? 'text-green-500' : 'text-gray-400'
              }`}
              d="M6 21V10C6 5.58172 9.58172 2 14 2V2C18.4183 2 22 5.58172 22 10V21"
              style={{
                transformOrigin: '14px 10px',
                transform: lockState ? 'translateY(0)' : 'translateY(-2px)',
              }}
            />
            {!lockState && (
              <>
                <path
                  className="bling stroke-current stroke-[2] text-yellow-400 animate-pulse"
                  d="M29 20L31 22"
                />
                <path
                  className="bling stroke-current stroke-[2] text-yellow-400 animate-pulse"
                  d="M31.5 15H34.5"
                  style={{ animationDelay: '0.3s' }}
                />
                <path
                  className="bling stroke-current stroke-[2] text-yellow-400 animate-pulse"
                  d="M29 10L31 8"
                  style={{ animationDelay: '0.6s' }}
                />
              </>
            )}
          </svg>
        </label>
      </span>
    </div>
  );
}
