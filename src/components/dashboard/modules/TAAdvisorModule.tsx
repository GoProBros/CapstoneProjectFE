"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function TAAdvisorModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={`dashboard-module rounded-lg overflow-hidden h-full w-full flex flex-col text-sm ${
      isDark ? 'bg-[#282832] text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header Section */}
      <div className="flex justify-between">
        <div className="p-4">
          <div className="relative">
            <div className="text-2xl" style={{ color: '#34C85E' }}>Technical</div>
            <div className={`absolute -bottom-2 -right-6 text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>Analysis</div>
          </div>
          <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>Tứ trụ TA</div>
        </div>

        {/* SVG Background with Chart Icon */}
        <div className="relative flex-none" style={{ width: '99.2px', minHeight: '80px', borderRadius: '0px 0px 23px' }}>
          <div className="absolute inset-0 origin-top-left" style={{ width: '99.2px', height: '80px', transform: 'scale(0.4)' }}>
            <svg 
              className="absolute inset-0 text-gray-700" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              width="248" 
              height="200" 
              viewBox="0 0 248 200" 
              style={{ transform: 'scale(-1, 1)' }}
            >
              <g>
                <path 
                  d="M0,181.009C0,100.39,106.116,125.641,138.148,93.1624C170.179,60.6838,139.172,0,228.424,0L0.00000470335,0L0,181.009Z" 
                  fill="currentColor" 
                  fillOpacity="1"
                />
              </g>
            </svg>
          </div>
          <div className="relative h-full flex justify-center items-center">
            <button 
              type="button" 
              className="font-medium rounded-full text-sm gap-x-2 p-2 shadow-sm ring-1 ring-inset ring-gray-700 text-white bg-gray-900 hover:bg-gray-800/50 focus-visible:ring-2 inline-flex items-center ml-6 transition-all"
              style={{ '--tw-ring-color': '#34C85E' } as React.CSSProperties}
            >
              <svg 
                className="flex-shrink-0 h-5 w-5" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M3 13h2v8H3v-8zm4-6h2v14H7V7zm4-4h2v18h-2V3zm4 9h2v9h-2v-9zm4-3h2v12h-2V9z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Four Pillars Grid */}
      <div className="px-4 pb-4 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-4 text-center w-full">
          {/* RS (Relative Strength) */}
          <div>
            <p className="text-gray-400 text-sm">RS</p>
            <p className="text-xl font-bold" style={{ color: '#34C85E' }}>73</p>
          </div>

          {/* Xu hướng (Trend) */}
          <div>
            <p className="text-gray-400 text-sm">Xu hướng</p>
            <p className="text-xl font-bold" style={{ color: '#34C85E' }}>Giảm yếu</p>
          </div>

          {/* Divider with Stock Symbol */}
          <div className="border-t border-gray-600 col-span-2 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-gray-900 font-semibold text-xs" style={{ backgroundColor: '#34C85E' }}>
              ABR
            </div>
          </div>

          {/* Dòng tiền (Money Flow) */}
          <div>
            <p className="text-gray-400 text-sm">Dòng tiền</p>
            <div className="text-sm">
              <div className="flex items-center justify-center gap-1" style={{ color: '#34C85E' }}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14l5-5 5 5z"/>
                </svg>
                1,400
              </div>
              <div className="text-red-500 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
                1,900
              </div>
            </div>
          </div>

          {/* Mẫu hình (Pattern) */}
          <div className="flex items-center justify-center">
            <button className="px-3 py-1 text-sm border rounded-md transition-colors" style={{ borderColor: '#34C85E', color: '#34C85E' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#34C85E1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              Mẫu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
