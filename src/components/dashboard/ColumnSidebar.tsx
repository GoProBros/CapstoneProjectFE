"use client";

import React, { useState } from 'react';
import { useColumnStore } from '@/stores/columnStore';
import { useTheme } from '@/contexts/ThemeContext';
import { X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

const columnGroups = [
  {
    title: 'THÔNG TIN GIAO DỊCH',
    fields: [
      'ticker', 'ceilingPrice', 'floorPrice', 'referencePrice',
      'bidPrice3', 'bidVol3', 'bidPrice2', 'bidVol2', 'bidPrice1', 'bidVol1',
      'lastPrice', 'lastVol', 'change', 'ratioChange',
      'askPrice1', 'askVol1', 'askPrice2', 'askVol2', 'askPrice3', 'askVol3',
      'totalVol', 'highest', 'lowest', 'avgPrice',
      'totalVal', 'side', 'tradingSession', 'tradingStatus'
    ]
  },
  {
    title: 'PHÂN TÍCH KỸ THUẬT',
    fields: ['ThanhKhoanTB50', 'volTB50', 'KL1KLTB', 'bulVol', 'bearVol', 'NGANHAN', 'TRUNGHAN', 'DAIHAN', 'SUCMANH', 'RS', 'rrg', 'signalSMC', 'AiTrend', 'pVWMA20']
  },
  {
    title: 'CHỈ SỐ GIÁ',
    fields: ['ptop52W', 'plow52W', 'pMA20', 'pMA50', 'pMA100', 'pMA200']
  },
  {
    title: 'PHÂN TÍCH CƠ BẢN',
    fields: ['PE', 'ROE', 'BLNR', 'diemBinhquan', 'DG_bq', 'skTaichinh', 'mohinhKinhdoanh', 'hieuquaHoatdong', 'diemKythuat', 'BAT', 'AIPredict20d']
  },
  {
    title: 'PHÂN TÍCH KỸ THUẬT NÂNG CAO',
    fields: ['candles', 'pattern', 'vungcau', 'vungcung', 'hotro', 'khangcu', 'kenhduoi', 'kenhtren', 'cmtTA']
  },
  {
    title: 'CHIẾN LƯỢC',
    fields: ['CHIENLUOC', 'GIAMUA', 'GIABAN', 'LAILO', 'NGAYMUA', 'NGAYBAN', 'TTDT', 'TTLN']
  }
];

const columnLabels: Record<string, string> = {
  // SSI Stream columns
  ticker: 'Mã CK',
  ceilingPrice: 'Giá trần',
  floorPrice: 'Giá sàn',
  referencePrice: 'Tham chiếu',
  bidPrice3: 'Giá mua 3',
  bidVol3: 'KL mua 3',
  bidPrice2: 'Giá mua 2',
  bidVol2: 'KL mua 2',
  bidPrice1: 'Giá mua 1',
  bidVol1: 'KL mua 1',
  lastPrice: 'Giá khớp',
  lastVol: 'KL khớp',
  change: '+/-',
  ratioChange: '+/- (%)',
  askPrice1: 'Giá bán 1',
  askVol1: 'KL bán 1',
  askPrice2: 'Giá bán 2',
  askVol2: 'KL bán 2',
  askPrice3: 'Giá bán 3',
  askVol3: 'KL bán 3',
  totalVol: 'Tổng KL',
  highest: 'Cao nhất',
  lowest: 'Thấp nhất',
  avgPrice: 'Giá TB',
  totalVal: 'Tổng GT',
  side: 'Chiều',
  tradingSession: 'Phiên',
  tradingStatus: 'Trạng thái',
  
  // Analysis columns
  ThanhKhoanTB50: 'GTTB (50 phiên)', 
  volTB50: 'KLTB (50 phiên)', 
  KL1KLTB: '%KLTB', 
  bulVol: 'Bull Vol (5p)', 
  bearVol: 'Bear Vol (5p)',
  NGANHAN: 'Ngắn hạn', 
  TRUNGHAN: 'Trung hạn', 
  DAIHAN: 'Dài hạn', 
  SUCMANH: 'Sức mạnh', 
  RS: 'RS', 
  rrg: 'RRG',
  signalSMC: 'Signal SMC', 
  AiTrend: 'AI Trend', 
  pVWMA20: '%VWMA20',
  ptop52W: '%Top 52W', 
  plow52W: '%Low 52W', 
  pMA20: '%MA20', 
  pMA50: '%MA50', 
  pMA100: '%MA100', 
  pMA200: '%MA200',
  PE: 'P/E', 
  ROE: 'ROE', 
  BLNR: 'BLNR', 
  diemBinhquan: 'Action Score', 
  DG_bq: 'Định giá',
  skTaichinh: 'Sức khỏe TC', 
  mohinhKinhdoanh: 'Mô hình KD', 
  hieuquaHoatdong: 'Hiệu quả HĐ', 
  diemKythuat: 'Điểm KT',
  BAT: 'BAT', 
  AIPredict20d: 'AI Predict 20d',
  candles: 'Candles', 
  pattern: 'Pattern', 
  vungcau: 'Vùng cầu', 
  vungcung: 'Vùng cung', 
  hotro: 'Hỗ trợ',
  khangcu: 'Kháng cự', 
  kenhduoi: 'Kênh dưới', 
  kenhtren: 'Kênh trên', 
  cmtTA: 'Comment TA',
  CHIENLUOC: 'Chiến lược', 
  GIAMUA: 'Giá mua', 
  GIABAN: 'Giá bán', 
  LAILO: 'Lãi/Lỗ',
  NGAYMUA: 'Ngày mua', 
  NGAYBAN: 'Ngày bán', 
  TTDT: 'TTDT', 
  TTLN: 'TTLN'
};

export function ColumnSidebar() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { columns, isSidebarOpen, setSidebarOpen, toggleColumnVisibility, setGroupVisibility, resetColumns } = useColumnStore();
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'THÔNG TIN GIAO DỊCH': true,
    'PHÂN TÍCH KỸ THUẬT': false,
    'CHỈ SỐ GIÁ': false,
    'PHÂN TÍCH CƠ BẢN': false,
    'PHÂN TÍCH KỸ THUẬT NÂNG CAO': false,
    'CHIẾN LƯỢC': false,
  });

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-80 z-50 shadow-2xl overflow-hidden flex flex-col ${
        isDark ? 'bg-[#282832] border-l border-gray-800' : 'bg-white border-l border-gray-200'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Quản lý cột
          </h3>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className={`p-4 space-y-2 border-b ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <button
            onClick={resetColumns}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            <RotateCcw size={16} />
            Đặt lại mặc định
          </button>
        </div>

        {/* Column Groups */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {columnGroups.map((group) => {
            const isExpanded = expandedGroups[group.title];
            const visibleCount = group.fields.filter(field => columns[field]?.visible).length;
            const allVisible = visibleCount === group.fields.length;
            const someVisible = visibleCount > 0 && visibleCount < group.fields.length;

            return (
              <div key={group.title} className={`rounded-lg border ${
                isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
              }`}>
                {/* Group Header */}
                <div className={`p-3 flex items-center justify-between cursor-pointer ${
                  isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                }`}
                  onClick={() => toggleGroup(group.title)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={allVisible}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = someVisible;
                        }
                      }}
                      onChange={(e) => {
                        e.stopPropagation();
                        setGroupVisibility(group.fields, !allVisible);
                      }}
                      className="w-4 h-4 rounded cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {group.title}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {visibleCount}/{group.fields.length}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {/* Column List */}
                {isExpanded && (
                  <div className={`p-3 pt-0 space-y-2 border-t ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    {group.fields.map((field) => (
                      <label
                        key={field}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={columns[field]?.visible || false}
                          onChange={() => toggleColumnVisibility(field)}
                          className="w-4 h-4 rounded cursor-pointer"
                        />
                        <span className={`text-sm ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {columnLabels[field] || field}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
