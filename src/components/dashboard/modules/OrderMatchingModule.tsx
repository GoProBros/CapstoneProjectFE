"use client";

import React, { useState, useEffect } from 'react';

interface OrderMatch {
  time: string;
  price: number;
  volume: number;
  type: 'M' | 'B'; // M = Mua (Buy), B = Bán (Sell)
}

export default function OrderMatchingModule() {
  const [orders, setOrders] = useState<OrderMatch[]>([
    { time: '13:52:37', price: 12.65, volume: 100, type: 'B' },
    { time: '13:52:37', price: 12.65, volume: 100, type: 'B' },
    { time: '13:52:37', price: 12.65, volume: 100, type: 'B' },
    { time: '13:52:37', price: 12.65, volume: 100, type: 'B' },
    { time: '13:52:37', price: 12.65, volume: 100, type: 'B' },
    { time: '13:52:37', price: 12.65, volume: 100, type: 'B' },
    { time: '13:52:37', price: 12.65, volume: 100, type: 'B' },
    { time: '13:52:37', price: 12.65, volume: 100, type: 'B' },
    { time: '10:13:30', price: 13.10, volume: 100, type: 'M' },
    { time: '09:18:36', price: 13.30, volume: 100, type: 'M' },
  ]);

  // Tính tổng số cổ và tổng giá trị
  const totalVolume = orders.reduce((sum, order) => sum + order.volume, 0);
  const totalValue = orders.reduce((sum, order) => sum + (order.price * order.volume), 0);

  // Format số tiền
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)} triệu`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} nghìn`;
    }
    return value.toFixed(2);
  };

  return (
    <div className="w-full h-full bg-[#1a1d2e] rounded-lg overflow-hidden flex flex-col text-base">
      {/* Header với thiết kế đặc biệt */}
      <div className="flex-none h-[32px]">
        <div className="w-full relative flex justify-center">
          <div className="w-[180px] mx-auto relative">
      
          </div>
        </div>
      </div>

      {/* Thông tin tổng quan */}
      <div className="flex justify-between text-xs -mt-6 px-4 pb-2">
        <div>
          <div>{totalVolume} cổ</div>
        </div>
        <div>
          <div>{formatValue(totalValue)}</div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="px-2 pb-2 -mt-2 flex-1 overflow-hidden">
        <div className="relative h-full">
          <div className="inline-flex w-full h-full">
            <div className="overflow-x-auto overflow-y-auto custom-scrollbar w-full h-full rounded-lg bg-white/5">
              <table className="w-full text-sm text-center table-auto">
                <thead className="sticky top-0 z-10">
                  <tr className="text-xs bg-[#252938]">
                    <th className="py-2 px-2">Thời gian</th>
                    <th className="py-2 px-2">Giá</th>
                    <th className="py-2 px-2">KL</th>
                    <th className="py-2 px-2">Lệnh</th>
                  </tr>
                </thead>
                <tbody className="bg-[#252938]">
                  {orders.map((order, index) => (
                    <tr key={index}>
                      <td className="py-2 px-2">{order.time}</td>
                      <td colSpan={3} className="p-0">
                        <div className="flex relative py-2">
                          {/* Background gradient */}
                          <div 
                            className={`absolute bottom-0 left-0 h-full w-full rounded ${
                              order.type === 'M' 
                                ? 'bg-gradient-to-r from-green-400/20' 
                                : 'bg-gradient-to-r from-red-400/20'
                            }`}
                          />
                          {/* Giá */}
                          <div 
                            className={`flex-1 px-2 ${
                              order.type === 'M' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {order.price.toFixed(2)}
                          </div>
                          {/* Khối lượng */}
                          <div className="flex-1 px-2">
                            {order.volume}
                          </div>
                          {/* Loại lệnh */}
                          <div 
                            className={`flex-1 px-2 font-semibold ${
                              order.type === 'M' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {order.type}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
