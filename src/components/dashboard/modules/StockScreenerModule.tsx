"use client";

import React, { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ColDef, ColGroupDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { useTheme } from '@/contexts/ThemeContext';
import { sampleStockData } from '@/lib/sampleStockData';

// Đăng ký modules AG-Grid (bắt buộc từ v31+)
ModuleRegistry.registerModules([AllCommunityModule]);

// Component cho nhóm cột có thể mở rộng/thu gọn
interface ColumnGroupProps {
  title: string;
  fields: { field: string; label: string }[];
  columnVisibility: {[key: string]: boolean};
  toggleColumnVisibility: (field: string) => void;
  toggleGroupVisibility: (fields: string[]) => void;
  isDark: boolean;
}

function ColumnGroup({ title, fields, columnVisibility, toggleColumnVisibility, toggleGroupVisibility, isDark }: ColumnGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fieldNames = fields.map(f => f.field);
  const allVisible = fieldNames.every(field => columnVisibility[field]);

  return (
    <div className="mb-4">
      <div
        className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
          isDark ? 'hover:bg-[#252530]' : 'hover:bg-gray-50'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allVisible}
            onChange={(e) => {
              e.stopPropagation();
              toggleGroupVisibility(fieldNames);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-300"
          />
          <div className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {title}
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
        <div className="mt-1">
          {fields.map(({ field, label }) => (
            <label
              key={field}
              className={`flex items-center gap-3 px-3 py-2 pl-10 rounded cursor-pointer transition-colors ${
                isDark ? 'hover:bg-[#252530]' : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={columnVisibility[field]}
                onChange={() => toggleColumnVisibility(field)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StockScreenerModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [gridApi, setGridApi] = useState<any>(null);

  const [rowData] = useState(sampleStockData);

  // Danh sách tất cả các cột với trạng thái visible (mặc định hiện một số cột)
  const [columnVisibility, setColumnVisibility] = useState<{[key: string]: boolean}>({
    // THÔNG TIN TỔNG QUAN - hiện mặc định
    MA: true,
    NGANH: true,
    GIA: true,
    THAYDOI: true,
    THANHKHOAN: false,
    volume: true,
    
    // PHÂN TÍCH KỸ THUẬT - hiện một số
    ThanhKhoanTB50: false,
    volTB50: false,
    KL1KLTB: false,
    bulVol: false,
    bearVol: false,
    NGANHAN: true,
    TRUNGHAN: false,
    DAIHAN: false,
    SUCMANH: true,
    RS: true,
    rrg: false,
    signalSMC: false,
    AiTrend: false,
    pVWMA20: false,
    
    // CHỈ SỐ GIÁ - ẩn mặc định
    ptop52W: false,
    plow52W: false,
    pMA20: false,
    pMA50: false,
    pMA100: false,
    pMA200: false,
    
    // PHÂN TÍCH CƠ BẢN - hiện một số
    PE: false,
    ROE: false,
    BLNR: false,
    diemBinhquan: true,
    DG_bq: false,
    skTaichinh: false,
    mohinhKinhdoanh: false,
    hieuquaHoatdong: false,
    diemKythuat: false,
    BAT: false,
    AIPredict20d: false,
    
    // PHÂN TÍCH KỸ THUẬT NÂNG CAO - ẩn mặc định
    candles: false,
    pattern: false,
    vungcau: false,
    vungcung: false,
    hotro: false,
    khangcu: false,
    kenhduoi: false,
    kenhtren: false,
    cmtTA: false,
    
    // CHIẾN LƯỢC - ẩn mặc định
    CHIENLUOC: false,
    GIAMUA: false,
    GIABAN: false,
    LAILO: false,
    NGAYMUA: false,
    NGAYBAN: false,
    TTDT: false,
    TTLN: false,
  });

  // Toggle visibility của một cột
  const toggleColumnVisibility = (field: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
    
    if (gridApi) {
      gridApi.setColumnsVisible([field], !columnVisibility[field]);
    }
  };

  // Toggle visibility của cả nhóm cột
  const toggleGroupVisibility = (fields: string[]) => {
    const allVisible = fields.every(field => columnVisibility[field]);
    const newVisibility = !allVisible;
    
    const updates = fields.reduce((acc, field) => ({
      ...acc,
      [field]: newVisibility
    }), {});
    
    setColumnVisibility(prev => ({
      ...prev,
      ...updates
    }));
    
    if (gridApi) {
      fields.forEach(field => {
        gridApi.setColumnsVisible([field], newVisibility);
      });
    }
  };

  // Định nghĩa cột và nhóm cột
  const columnDefs: (ColDef | ColGroupDef)[] = useMemo(() => [
    {
      headerName: 'THÔNG TIN TỔNG QUAN',
      children: [
        { 
          field: 'MA',
          headerName: 'Mã',
          width: 100,
          filter: true,
          cellClass: 'font-bold underline text-blue-500 cursor-pointer',
          hide: !columnVisibility.MA
        },
        { 
          field: 'NGANH', 
          headerName: 'Ngành (ICB lv3)', 
          width: 150, 
          filter: true,
          hide: !columnVisibility.NGANH
        },
        { 
          field: 'GIA', 
          headerName: 'Giá', 
          width: 100, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.GIA
        },
        { 
          field: 'THAYDOI',
          headerName: '+/-', 
          width: 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: (params) => params.value > 0 ? 'text-green-500' : params.value < 0 ? 'text-red-500' : 'text-yellow-500',
          hide: !columnVisibility.THAYDOI
        },
        { 
          field: 'THANHKHOAN', 
          headerName: 'GTGD (vnđ)',
          width: 120, 
          filter: 'agNumberColumnFilter', 
          valueFormatter: (params) => params.value?.toLocaleString(),
          hide: !columnVisibility.THANHKHOAN
        },
        { 
          field: 'volume', 
          headerName: 'KLGD (cp)',
          width: 120, 
          filter: 'agNumberColumnFilter', 
          valueFormatter: (params) => params.value?.toLocaleString(),
          hide: !columnVisibility.volume
        },
      ]
    },
    {
      headerName: 'PHÂN TÍCH KỸ THUẬT',
      children: [
        { 
          field: 'ThanhKhoanTB50', 
          headerName: 'GTTB (50 phiên)',
          width: 140, 
          filter: 'agNumberColumnFilter', 
          valueFormatter: (params) => params.value?.toLocaleString(),
          hide: !columnVisibility.ThanhKhoanTB50
        },
        { 
          field: 'volTB50', 
          headerName: 'KLTB (50 phiên)',
          width: 140, 
          filter: 'agNumberColumnFilter', 
          valueFormatter: (params) => params.value?.toLocaleString(),
          hide: !columnVisibility.volTB50
        },
        { 
          field: 'KL1KLTB',
          headerName: '%KLTB', 
          width: 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${params.value}%` : '0%',
          hide: !columnVisibility.KL1KLTB
        },
        { 
          field: 'bulVol',
          headerName: 'Bull Vol (5p)', 
          width: 130, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value?.toLocaleString(),
          hide: !columnVisibility.bulVol
        },
        { 
          field: 'bearVol',
          headerName: 'Bear Vol (5p)', 
          width: 130, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value?.toLocaleString(),
          hide: !columnVisibility.bearVol
        },
        { 
          field: 'NGANHAN',
          headerName: 'Ngắn hạn', 
          width: 110, 
          filter: true,
          hide: !columnVisibility.NGANHAN
        },
        { 
          field: 'TRUNGHAN',
          headerName: 'Trung hạn', 
          width: 110, 
          filter: true,
          hide: !columnVisibility.TRUNGHAN
        },
        { 
          field: 'DAIHAN',
          headerName: 'Dài hạn', 
          width: 110, 
          filter: true,
          hide: !columnVisibility.DAIHAN
        },
        { 
          field: 'SUCMANH',
          headerName: 'Sức mạnh', 
          width: 120, 
          filter: true,
          hide: !columnVisibility.SUCMANH
        },
        { 
          field: 'RS',
          headerName: 'RS', 
          width: 80, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.RS
        },
        { 
          field: 'rrg',
          headerName: 'RRG', 
          width: 100, 
          filter: true,
          hide: !columnVisibility.rrg
        },
        { 
          field: 'signalSMC',
          headerName: 'Signal SMC', 
          width: 120, 
          filter: true,
          hide: !columnVisibility.signalSMC
        },
        { 
          field: 'AiTrend',
          headerName: 'AI Trend', 
          width: 110, 
          filter: true,
          hide: !columnVisibility.AiTrend
        },
        { 
          field: 'pVWMA20',
          headerName: '%VWMA20', 
          width: 110, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          hide: !columnVisibility.pVWMA20
        },
      ]
    },
    {
      headerName: 'CHỈ SỐ GIÁ',
      children: [
        { 
          field: 'ptop52W',
          headerName: '%Top 52W', 
          width: 110, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          cellClass: (params) => params.value > 0 ? 'text-green-500' : 'text-red-500',
          hide: !columnVisibility.ptop52W
        },
        { 
          field: 'plow52W',
          headerName: '%Low 52W', 
          width: 110, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          hide: !columnVisibility.plow52W
        },
        { 
          field: 'pMA20',
          headerName: '%MA20', 
          width: 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          hide: !columnVisibility.pMA20
        },
        { 
          field: 'pMA50',
          headerName: '%MA50', 
          width: 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          hide: !columnVisibility.pMA50
        },
        { 
          field: 'pMA100',
          headerName: '%MA100', 
          width: 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          hide: !columnVisibility.pMA100
        },
        { 
          field: 'pMA200',
          headerName: '%MA200', 
          width: 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${(params.value * 100).toFixed(2)}%` : '0%',
          hide: !columnVisibility.pMA200
        },
      ]
    },
    {
      headerName: 'PHÂN TÍCH CƠ BẢN',
      children: [
        { 
          field: 'PE',
          headerName: 'P/E', 
          width: 80, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.PE
        },
        { 
          field: 'ROE',
          headerName: 'ROE', 
          width: 80, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${params.value}%` : '0%',
          hide: !columnVisibility.ROE
        },
        { 
          field: 'BLNR',
          headerName: 'BLNR', 
          width: 80, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.BLNR
        },
        { 
          field: 'diemBinhquan',
          headerName: 'Action Score', 
          width: 120, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.diemBinhquan
        },
        { 
          field: 'DG_bq',
          headerName: 'Định giá', 
          width: 100, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.DG_bq
        },
        { 
          field: 'skTaichinh',
          headerName: 'Sức khỏe TC', 
          width: 120, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.skTaichinh
        },
        { 
          field: 'mohinhKinhdoanh',
          headerName: 'Mô hình KD', 
          width: 120, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.mohinhKinhdoanh
        },
        { 
          field: 'hieuquaHoatdong',
          headerName: 'Hiệu quả HĐ', 
          width: 120, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.hieuquaHoatdong
        },
        { 
          field: 'diemKythuat',
          headerName: 'Điểm KT', 
          width: 100, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.diemKythuat
        },
        { 
          field: 'BAT',
          headerName: 'BAT', 
          width: 80, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.BAT
        },
        { 
          field: 'AIPredict20d',
          headerName: 'AI Predict 20d', 
          width: 130, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.AIPredict20d
        },
      ]
    },
    {
      headerName: 'PHÂN TÍCH KỸ THUẬT NÂNG CAO',
      children: [
        { 
          field: 'candles',
          headerName: 'Candles', 
          width: 150, 
          filter: true,
          hide: !columnVisibility.candles
        },
        { 
          field: 'pattern',
          headerName: 'Pattern', 
          width: 150, 
          filter: true,
          hide: !columnVisibility.pattern
        },
        { 
          field: 'vungcau',
          headerName: 'Vùng cầu', 
          width: 120, 
          filter: true,
          hide: !columnVisibility.vungcau
        },
        { 
          field: 'vungcung',
          headerName: 'Vùng cung', 
          width: 120, 
          filter: true,
          hide: !columnVisibility.vungcung
        },
        { 
          field: 'hotro',
          headerName: 'Hỗ trợ', 
          width: 100, 
          filter: true,
          hide: !columnVisibility.hotro
        },
        { 
          field: 'khangcu',
          headerName: 'Kháng cự', 
          width: 100, 
          filter: true,
          hide: !columnVisibility.khangcu
        },
        { 
          field: 'kenhduoi',
          headerName: 'Kênh dưới', 
          width: 120, 
          filter: true,
          hide: !columnVisibility.kenhduoi
        },
        { 
          field: 'kenhtren',
          headerName: 'Kênh trên', 
          width: 120, 
          filter: true,
          hide: !columnVisibility.kenhtren
        },
        { 
          field: 'cmtTA',
          headerName: 'Comment TA', 
          width: 250, 
          filter: true,
          wrapText: true,
          autoHeight: true,
          hide: !columnVisibility.cmtTA
        },
      ]
    },
    {
      headerName: 'CHIẾN LƯỢC',
      children: [
        { 
          field: 'CHIENLUOC',
          headerName: 'Chiến lược', 
          width: 150, 
          filter: true,
          hide: !columnVisibility.CHIENLUOC
        },
        { 
          field: 'GIAMUA',
          headerName: 'Giá mua', 
          width: 100, 
          filter: true,
          hide: !columnVisibility.GIAMUA
        },
        { 
          field: 'GIABAN',
          headerName: 'Giá bán', 
          width: 100, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.GIABAN
        },
        { 
          field: 'LAILO',
          headerName: 'Lãi/Lỗ', 
          width: 100, 
          filter: 'agNumberColumnFilter',
          valueFormatter: (params) => params.value ? `${params.value}%` : '0%',
          cellClass: (params) => params.value > 0 ? 'text-green-500' : params.value < 0 ? 'text-red-500' : 'text-gray-500',
          hide: !columnVisibility.LAILO
        },
        { 
          field: 'NGAYMUA',
          headerName: 'Ngày mua', 
          width: 120, 
          filter: true,
          hide: !columnVisibility.NGAYMUA
        },
        { 
          field: 'NGAYBAN',
          headerName: 'Ngày bán', 
          width: 120, 
          filter: true,
          hide: !columnVisibility.NGAYBAN
        },
        { 
          field: 'TTDT',
          headerName: 'TTDT', 
          width: 100, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.TTDT
        },
        { 
          field: 'TTLN',
          headerName: 'TTLN', 
          width: 100, 
          filter: 'agNumberColumnFilter',
          hide: !columnVisibility.TTLN
        },
      ]
    }
  ], [columnVisibility]);

  // Cấu hình mặc định cho tất cả các cột
  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: true,
  }), []);

  return (
    <div className={`dashboard-module w-full h-full rounded-lg p-4 border ${
      isDark ? 'bg-[#282832] border-gray-800' : 'bg-white border-gray-200'
    }`}>
      <div className='flex justify-between items-center mb-4'>
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Stock Screener
        </h2>
        
        {/* Button mở panel quản lý cột */}
        <button
          onClick={() => setIsColumnPanelOpen(!isColumnPanelOpen)}
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
      </div>

      {/* Custom Column Panel - thay thế AG-Grid Enterprise sidebar */}
      {isColumnPanelOpen && (
        <div className={`absolute right-4 top-20 w-80 max-h-[600px] overflow-y-auto rounded-lg shadow-lg border z-50 ${
          isDark ? 'bg-[#1e1e26] border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`sticky top-0 p-4 border-b ${
            isDark ? 'bg-[#282832] border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Quản lý cột hiển thị
              </h3>
              <button
                onClick={() => setIsColumnPanelOpen(false)}
                className={`p-1 rounded hover:bg-gray-700 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-2">
            {/* Nhóm: THÔNG TIN TỔNG QUAN */}
            <ColumnGroup
              title="THÔNG TIN TỔNG QUAN"
              fields={[
                { field: 'MA', label: 'Mã' },
                { field: 'NGANH', label: 'Ngành (ICB lv3)' },
                { field: 'GIA', label: 'Giá' },
                { field: 'THAYDOI', label: '+/-' },
                { field: 'THANHKHOAN', label: 'GTGD (vnđ)' },
                { field: 'volume', label: 'KLGD (cp)' },
              ]}
              columnVisibility={columnVisibility}
              toggleColumnVisibility={toggleColumnVisibility}
              toggleGroupVisibility={toggleGroupVisibility}
              isDark={isDark}
            />

            {/* Nhóm: PHÂN TÍCH KỸ THUẬT */}
            <ColumnGroup
              title="PHÂN TÍCH KỸ THUẬT"
              fields={[
                { field: 'ThanhKhoanTB50', label: 'GTTB (50 phiên)' },
                { field: 'volTB50', label: 'KLTB (50 phiên)' },
                { field: 'KL1KLTB', label: '%KLTB' },
                { field: 'bulVol', label: 'Bull Vol (5p)' },
                { field: 'bearVol', label: 'Bear Vol (5p)' },
                { field: 'NGANHAN', label: 'Ngắn hạn' },
                { field: 'TRUNGHAN', label: 'Trung hạn' },
                { field: 'DAIHAN', label: 'Dài hạn' },
                { field: 'SUCMANH', label: 'Sức mạnh' },
                { field: 'RS', label: 'RS' },
                { field: 'rrg', label: 'RRG' },
                { field: 'signalSMC', label: 'Signal SMC' },
                { field: 'AiTrend', label: 'AI Trend' },
                { field: 'pVWMA20', label: '%VWMA20' },
              ]}
              columnVisibility={columnVisibility}
              toggleColumnVisibility={toggleColumnVisibility}
              toggleGroupVisibility={toggleGroupVisibility}
              isDark={isDark}
            />

            {/* Nhóm: CHỈ SỐ GIÁ */}
            <ColumnGroup
              title="CHỈ SỐ GIÁ"
              fields={[
                { field: 'ptop52W', label: '%Top 52W' },
                { field: 'plow52W', label: '%Low 52W' },
                { field: 'pMA20', label: '%MA20' },
                { field: 'pMA50', label: '%MA50' },
                { field: 'pMA100', label: '%MA100' },
                { field: 'pMA200', label: '%MA200' },
              ]}
              columnVisibility={columnVisibility}
              toggleColumnVisibility={toggleColumnVisibility}
              toggleGroupVisibility={toggleGroupVisibility}
              isDark={isDark}
            />

            {/* Nhóm: PHÂN TÍCH CƠ BẢN */}
            <ColumnGroup
              title="PHÂN TÍCH CƠ BẢN"
              fields={[
                { field: 'PE', label: 'P/E' },
                { field: 'ROE', label: 'ROE' },
                { field: 'BLNR', label: 'BLNR' },
                { field: 'diemBinhquan', label: 'Action Score' },
                { field: 'DG_bq', label: 'Định giá' },
                { field: 'skTaichinh', label: 'Sức khỏe TC' },
                { field: 'mohinhKinhdoanh', label: 'Mô hình KD' },
                { field: 'hieuquaHoatdong', label: 'Hiệu quả HĐ' },
                { field: 'diemKythuat', label: 'Điểm KT' },
                { field: 'BAT', label: 'BAT' },
                { field: 'AIPredict20d', label: 'AI Predict 20d' },
              ]}
              columnVisibility={columnVisibility}
              toggleColumnVisibility={toggleColumnVisibility}
              toggleGroupVisibility={toggleGroupVisibility}
              isDark={isDark}
            />

            {/* Nhóm: PHÂN TÍCH KỸ THUẬT NÂNG CAO */}
            <ColumnGroup
              title="PHÂN TÍCH KỸ THUẬT NÂNG CAO"
              fields={[
                { field: 'candles', label: 'Candles' },
                { field: 'pattern', label: 'Pattern' },
                { field: 'vungcau', label: 'Vùng cầu' },
                { field: 'vungcung', label: 'Vùng cung' },
                { field: 'hotro', label: 'Hỗ trợ' },
                { field: 'khangcu', label: 'Kháng cự' },
                { field: 'kenhduoi', label: 'Kênh dưới' },
                { field: 'kenhtren', label: 'Kênh trên' },
                { field: 'cmtTA', label: 'Comment TA' },
              ]}
              columnVisibility={columnVisibility}
              toggleColumnVisibility={toggleColumnVisibility}
              toggleGroupVisibility={toggleGroupVisibility}
              isDark={isDark}
            />

            {/* Nhóm: CHIẾN LƯỢC */}
            <ColumnGroup
              title="CHIẾN LƯỢC"
              fields={[
                { field: 'CHIENLUOC', label: 'Chiến lược' },
                { field: 'GIAMUA', label: 'Giá mua' },
                { field: 'GIABAN', label: 'Giá bán' },
                { field: 'LAILO', label: 'Lãi/Lỗ' },
                { field: 'NGAYMUA', label: 'Ngày mua' },
                { field: 'NGAYBAN', label: 'Ngày bán' },
                { field: 'TTDT', label: 'TTDT' },
                { field: 'TTLN', label: 'TTLN' },
              ]}
              columnVisibility={columnVisibility}
              toggleColumnVisibility={toggleColumnVisibility}
              toggleGroupVisibility={toggleGroupVisibility}
              isDark={isDark}
            />
          </div>
        </div>
      )}
      
      <div className={`w-full h-[calc(100%-3rem)] ${isDark ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}`}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          animateRows={true}
          theme="legacy"
          onGridReady={(params) => setGridApi(params.api)}
        />
      </div>
    </div>
  );
}
