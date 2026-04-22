"use client";

import React, { useState } from 'react';
import { useColumnStore } from '@/stores/columnStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeContext';

const columnGroups = [
  {
    title: 'THÔNG TIN TỔNG QUAN',
    fields: ['MA', 'NGANH', 'GIA', 'THAYDOI', 'THANHKHOAN', 'volume']
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
  MA: 'Mã',
  NGANH: 'Ngành (ICB lv3)',
  GIA: 'Giá',
  THAYDOI: '+/-',
  THANHKHOAN: 'GTGD (vnđ)',
  volume: 'KLGD (cp)',
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
  TTLN: 'TTLN',
};

interface ColumnGroupProps {
  title: string;
  fields: string[];
  columns: Record<string, any>;
  toggleColumnVisibility: (field: string) => void;
  setGroupVisibility: (fields: string[], visible: boolean) => void;
  isDark: boolean;
}

function ColumnGroupComponent({ title, fields, columns, toggleColumnVisibility, setGroupVisibility, isDark }: ColumnGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const allVisible = fields.every(field => columns[field]?.visible);
  const someVisible = fields.some(field => columns[field]?.visible);

  return (
    <div className="mb-4">
      <div
        className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
          isDark ? 'hover:bg-[#252530]' : 'hover:bg-gray-50'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allVisible}
            onCheckedChange={(checked) => {
              setGroupVisibility(fields, checked as boolean);
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {title}
            <span className="ml-2 text-xs opacity-60">
              ({fields.filter(f => columns[f]?.visible).length}/{fields.length})
            </span>
          </div>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''} ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isExpanded && (
        <div className="mt-1 ml-8">
          {fields.map((field) => (
            <div
              key={field}
              className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                isDark ? 'hover:bg-[#252530]' : 'hover:bg-gray-50'
              }`}
            >
              <Checkbox
                id={`column-${field}`}
                checked={columns[field]?.visible || false}
                onCheckedChange={() => toggleColumnVisibility(field)}
              />
              <Label
                htmlFor={`column-${field}`}
                className={`cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                {columnLabels[field] || field}
              </Label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ColumnManagerDialogProps {
  trigger?: React.ReactNode;
}

export function ColumnManagerDialog({ trigger }: ColumnManagerDialogProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { columns, toggleColumnVisibility, setGroupVisibility, resetColumns } = useColumnStore();

  const visibleCount = Object.values(columns).filter(col => col.visible).length;
  const totalCount = Object.keys(columns).length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <button
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-[#1e1e26] border-gray-700 text-white hover:bg-[#252530]' 
                : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Quản lý cột
            </span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Quản lý cột hiển thị</DialogTitle>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Đang hiển thị {visibleCount}/{totalCount} cột
              </p>
            </div>
            <button
              onClick={resetColumns}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                isDark 
                  ? 'border-gray-600 text-gray-300 hover:bg-[#252530]' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Đặt lại mặc định
            </button>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2 mt-4">
          {columnGroups.map((group) => (
            <ColumnGroupComponent
              key={group.title}
              title={group.title}
              fields={group.fields}
              columns={columns}
              toggleColumnVisibility={toggleColumnVisibility}
              setGroupVisibility={setGroupVisibility}
              isDark={isDark}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
