'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const FundamentalAnalysisModule = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={`dashboard-module rounded-lg overflow-hidden h-full w-full flex flex-col text-sm ${
      isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header Section */}
      <div className="flex justify-between">
        <div className="p-4 text-sm -mr-6">
          <div className="relative">
            <div className="text-2xl text-lime-500">Fundamental</div>
            <div className={`absolute -bottom-2 -right-6 text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>Analysis</div>
          </div>
          <div>Tứ trụ FA</div>
        </div>

        {/* SVG Background with Chart Icon */}
        <div className="relative flex-none" style={{ width: '99.2px', minHeight: '80px', borderRadius: '0px 0px 23px' }}>
          <div className="absolute inset-0 origin-top-left" style={{ width: '99.2px', height: '80px', transform: 'scale(0.4)' }}>
            <svg 
              className={`absolute inset-0 ${
                isDark ? 'text-gray-700' : 'text-gray-200'
              }`}
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
              className={`ani-pop font-medium rounded-full text-sm gap-x-2 p-2 shadow-sm ring-1 ring-inset inline-flex items-center ml-6 focus-visible:ring-2 focus-visible:ring-lime-500 ${
                isDark 
                  ? 'ring-gray-700 text-white bg-gray-900 hover:bg-gray-800/50' 
                  : 'ring-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <svg 
                className="flex-shrink-0 h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Four Pillars Grid */}
      <div className="px-4 pb-8 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-4 text-center w-full">
          {/* Định Giá (Valuation) */}
          <div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Định Giá</p>
            <p className="text-xl font-bold">16.1</p>
          </div>

          {/* Tài chính (Financial) */}
          <div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Tài chính</p>
            <p className="text-xl font-bold text-lime-500">84</p>
          </div>

          {/* Divider with Stock Symbol */}
          <div className={`border-t col-span-2 relative ${
            isDark ? 'border-gray-600' : 'border-gray-300'
          }`}>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-lime-500 px-2 py-0.5 rounded-full text-gray-900 font-semibold">
              ABR
            </div>
          </div>

          {/* Kinh doanh (Business) */}
          <div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Kinh doanh</p>
            <p className="text-xl font-bold text-yellow-600">70</p>
          </div>

          {/* Hiệu quả (Efficiency) */}
          <div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Hiệu quả</p>
            <p className="text-xl font-bold text-yellow-600">78</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundamentalAnalysisModule;
