"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function CanslimModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const canslimLetters = ['c', 'a', 'n', 's', 'l', 'i', 'm'];
  const activeIndex = 2; // 'n' is active

  return (
    <div className={`dashboard-module rounded-lg overflow-hidden h-full w-full text-base flex flex-col justify-between ${
      isDark ? 'bg-[#282832] text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header Section */}
      <div className="px-6 pt-6">
        <div className="flex justify-between mb-4">
          {/* Stock Info */}
          <div>
            <p className="text-sm text-gray-400">UPCOM</p>
            <h2 className="text-2xl font-semibold" style={{ color: '#34C85E' }}>ABR</h2>
            <div className="text-xs text-gray-400">CTCP Đầu tư Nhãn hiệu Việt</div>
            <p className="text-xs text-gray-500">Hàng & Dịch vụ công nghiệp</p>
            <p className="font-bold text-yellow-600">Suy yếu</p>
          </div>

          {/* Action Score */}
          <div className="font-semibold text-center text-white">
            Action Score
            <div 
              className="mx-auto flex items-center justify-center text-3xl w-14 h-14 rounded-full bg-green-500/10 mt-2"
              style={{ color: '#34C85E' }}
            >
              73
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex justify-between">
        {/* SVG Background with Target Icon */}
        <div className="relative flex-none" style={{ width: '124px', minHeight: '100px', borderRadius: '0px 0px 0px 23px' }}>
          <div className="absolute inset-0 origin-top-left" style={{ width: '124px', height: '100px', transform: 'scale(0.5)' }}>
            <svg 
              className="absolute inset-0 text-gray-700" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              width="248" 
              height="200" 
              viewBox="0 0 248 200" 
              style={{ transform: 'scale(1, -1)' }}
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
              className="font-medium rounded-full text-sm gap-x-2.5 ring-1 ring-inset ring-current hover:bg-green-50/10 focus-visible:ring-2 inline-flex items-center mr-14 mt-10 p-2 transition-all"
              style={{ color: '#34C85E' }}
            >
              <svg 
                className="text-2xl w-6 h-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* CANSLIM Letters */}
        <div className="flex-1 flex items-end justify-center pb-3">
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1 -ml-8">
            {canslimLetters.map((letter, index) => (
              <span
                key={index}
                className={`flex items-center justify-center h-8 w-8 rounded-full text-lg font-semibold uppercase ${
                  index === activeIndex
                    ? 'text-white'
                    : 'bg-gray-700 text-gray-500'
                }`}
                style={index === activeIndex ? { backgroundColor: '#34C85E' } : {}}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
