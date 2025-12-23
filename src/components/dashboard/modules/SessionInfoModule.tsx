'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface PriceLevel {
  price: number;
  volume: number;
  change: number;
  changePercent: number;
  type: 'buy' | 'sell' | 'reference';
}

export default function SessionInfoModule() {
  const [showTotal, setShowTotal] = useState(true); // Toggle between Total/Balance
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Sample data for price levels
  const priceLevels: PriceLevel[] = [
    { price: 13.30, volume: 400, change: 0.20, changePercent: 1.53, type: 'buy' },
    { price: 13.25, volume: 300, change: 0.15, changePercent: 1.15, type: 'buy' },
    { price: 13.20, volume: 100, change: 0.10, changePercent: 0.76, type: 'buy' },
    { price: 12.65, volume: 100, change: -0.45, changePercent: -3.44, type: 'reference' },
    { price: 12.65, volume: 600, change: -0.45, changePercent: -3.44, type: 'sell' },
    { price: 12.60, volume: 300, change: -0.50, changePercent: -3.82, type: 'sell' },
    { price: 12.55, volume: 100, change: -0.55, changePercent: -4.20, type: 'sell' },
  ];

  // Calculate max volume for percentage bars
  const maxVolume = Math.max(...priceLevels.map(level => level.volume));

  // Bull/Bear ratio (20% bull, 80% bear in this example)
  const bullRatio = 20;
  const bearRatio = 80;

  const toggleMode = () => {
    setShowTotal(!showTotal);
  };

  return (
    <div className={`h-full w-full text-base flex flex-col justify-between rounded-lg overflow-hidden ${
      isDark ? 'bg-[#282832] text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header with "3 Bước Giá" badge */}
      <div className="flex-none h-[32px]">
        <div className="w-full relative flex justify-center">
          <div className="w-[180px] mx-auto relative">
            <svg 
              className="text-gray-700 absolute inset-0 origin-top-left" 
              width="360" 
              height="48" 
              viewBox="0 0 360 48" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              style={{ transform: 'scale(0.5)' }}
            >
              <path 
                d="M357.237 2.82376e-05C398.658 2.82376e-05 -39.9387 -3.52971e-05 2.95743 2.82376e-05C45.8536 9.17724e-05 66.301 48 115.04 48H251.002C304.338 48 315.815 2.82376e-05 357.237 2.82376e-05Z" 
                fill="currentColor"
              />
            </svg>
            <div className="text-gray-900 rounded-full relative text-sm text-center px-2 w-24 mx-auto font-semibold" style={{ backgroundColor: '#34C85E' }}>
              3 Bước Giá
            </div>
          </div>
        </div>
      </div>

      {/* Bull/Bear Ratio Bar */}
      <div className="relative">
        <div className="relative flex justify-between w-full h-7 mx-2 rounded-full overflow-hidden group cursor-pointer" onClick={toggleMode}>
          <div className="absolute top-0 left-0 w-full h-7 bg-gray-700"></div>
          
          {/* Toggle icon */}
          <div 
            title="Click để chuyển đổi: Tổng mua/bán ↔ Dư mua/bán" 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 cursor-pointer hover:scale-110 bg-black/20 rounded-full p-1"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-white drop-shadow-lg"
            >
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <polyline points="7 23 3 19 7 15"></polyline>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
          </div>

          {/* Bull section */}
          <div className="relative text-center py-1 z-10" style={{ width: `${bullRatio}%`, backgroundColor: '#34C85E' }}>
            <span className="inline-flex justify-center items-center overflow-hidden w-5 h-5 mx-auto">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-900">
                <path d="M12 2L15 8H9L12 2Z M8 10H16L18 16H6L8 10Z M6 18H18V20H6V18Z"/>
              </svg>
            </span>
          </div>

          {/* Bear section */}
          <div className="relative bg-red-500 text-center py-1 z-10" style={{ width: `${bearRatio}%` }}>
            <span className="inline-flex justify-center items-center overflow-hidden w-5 h-5 mx-auto">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-900">
                <path d="M12 22L9 16H15L12 22Z M16 14H8L6 8H18L16 14Z M18 6H6V4H18V6Z"/>
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Price Levels Table */}
      <div className="overflow-auto custom-scrollbar flex-1 px-2 mt-2">
        <div>
          <div className="overflow-x-auto w-full max-h-screen rounded-lg bg-[#282832]">
            <table className="table text-sm text-center w-full">
              <tbody>
                {priceLevels.map((level, index) => {
                  const widthPercent = (level.volume / maxVolume) * 100;
                  const isGreen = level.type === 'buy';
                  const isRed = level.type === 'sell';
                  const isReference = level.type === 'reference';
                  
                  return (
                    <tr key={index}>
                      <td colSpan={4} className="p-0.5">
                        <div 
                          className={`flex bg-gray-700 relative rounded-md overflow-hidden ${
                            isGreen ? 'text-green-600' : isRed ? 'text-red-600' : 'text-red-600'
                          } ${isReference ? 'bg-[#282832]' : ''}`}
                        >
                          {/* Background bar */}
                          <div 
                            className={`absolute bottom-0 left-14 h-full rounded ${
                              isGreen ? 'bg-green-600/30' : 'bg-red-600/30'
                            }`}
                            style={{ maxWidth: `${widthPercent}%`, width: '100%' }}
                          ></div>

                          {/* Price */}
                          <div 
                            className={`flex-none w-12 transition-colors duration-300 ease-in-out ${
                              isReference ? 'bg-[#282832]' : ''
                            }`}
                          >
                            {level.price.toFixed(2)}
                          </div>

                          {/* Volume */}
                          <div className="flex-1 ml-1 text-left px-2 transition-colors duration-300 ease-in-out">
                            {level.volume}
                          </div>

                          {/* Change */}
                          <div className="flex-none w-12">
                            <div className="flex">
                              <span className="w-2">{level.change > 0 ? '+' : '-'}</span>
                              {Math.abs(level.change).toFixed(2)}
                            </div>
                          </div>

                          {/* Change Percent */}
                          <div className="flex-none w-12 font-semibold flex items-center justify-start">
                            <span>
                              <span className="w-2">{level.changePercent > 0 ? '+' : '-'}</span>
                              {Math.abs(level.changePercent).toFixed(2)}
                            </span>
                            <span className="ml-0.5">%</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Foreign Investor Section */}
      <div className="relative">
        <div className="w-full py-2 px-2 bg-[#282832]">
          <div className="rounded-full bg-gray-700 whitespace-nowrap flex justify-between px-2 py-1 font-semibold">
            <div>
              NN Mua <span className="text-green-600">0.0%</span>
            </div>
            <div className="font-normal text-sm text-gray-900 px-2 py-0.5 rounded-full" style={{ backgroundColor: '#34C85E' }}>
              300
            </div>
            <div>
              <span className="text-red-600">0.0%</span> NN Bán
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
