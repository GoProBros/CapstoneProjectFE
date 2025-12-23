"use client";

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';

export default function FinancialReportModule() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('annual');
  const [reportType, setReportType] = useState<'income' | 'balance' | 'cashflow'>('income');
  const [yearRangeIndex, setYearRangeIndex] = useState(0);
  const [quarterRangeIndex, setQuarterRangeIndex] = useState(0);

  // Define available year ranges (reverse chronological order)
  const yearRanges = [
    [2021, 2022, 2023, 2024],
    [2017, 2018, 2019, 2020],
    [2015, 2016]
  ];

  // Define quarter ranges (newest to oldest)
  const quarterRanges = [
    ['Q4/24', 'Q1/25', 'Q2/25', 'Q3/25'],
    ['Q4/23', 'Q1/24', 'Q2/24', 'Q3/24'],
    ['Q4/22', 'Q1/23', 'Q2/23', 'Q3/23']
  ];

  const years = yearRanges[yearRangeIndex];
  const quarters = quarterRanges[quarterRangeIndex];

  // Data for Income Statement (Kết quả kinh doanh)
  const incomeChartData = [
    { year: '2015', revenue: 25, profit: 2, afterTax: 1 },
    { year: '2016', revenue: 30, profit: 3, afterTax: 2 },
    { year: '2017', revenue: 28, profit: 2, afterTax: 1 },
    { year: '2018', revenue: 21, profit: 3, afterTax: 2 },
    { year: '2019', revenue: 27, profit: 12, afterTax: 8 },
    { year: '2020', revenue: 98, profit: 53, afterTax: 25 },
    { year: '2021', revenue: 91, profit: 44, afterTax: 19 },
    { year: '2022', revenue: 104, profit: 53, afterTax: 29 },
    { year: '2023', revenue: 54, profit: 33, afterTax: 31 },
    { year: '2024', revenue: 25, profit: 21, afterTax: 20 },
  ];

  // Quarterly chart data for income statement
  const incomeQuarterlyChartData = [
    // Q4/2024 - Q3/2025
    { year: 'Q4/24', revenue: 6, profit: 6, afterTax: 6 },
    { year: 'Q1/25', revenue: 6, profit: 6, afterTax: 4 },
    { year: 'Q2/25', revenue: 6, profit: 6, afterTax: 3 },
    { year: 'Q3/25', revenue: 6, profit: 6, afterTax: 2 },
    // Q4/2023 - Q3/2024
    { year: 'Q4/23', revenue: 16, profit: 5, afterTax: 0 },
    { year: 'Q1/24', revenue: 16, profit: 6, afterTax: 5 },
    { year: 'Q2/24', revenue: -4, profit: 4, afterTax: 5 },
    { year: 'Q3/24', revenue: 6, profit: 6, afterTax: 3 },
    // Q4/2022 - Q3/2023
    { year: 'Q4/22', revenue: 29, profit: 16, afterTax: 9 },
    { year: 'Q1/23', revenue: 28, profit: 14, afterTax: 9 },
    { year: 'Q2/23', revenue: 13, profit: 8, afterTax: 15 },
    { year: 'Q3/23', revenue: 6, profit: 6, afterTax: 6 },
  ];

  // Data for Balance Sheet (Bảng cân đối kế toán)
  const balanceChartData = [
    { year: '2021', totalAssets: 313, charterCapital: 200, equity: 256 },
    { year: '2022', totalAssets: 372, charterCapital: 200, equity: 285 },
    { year: '2023', totalAssets: 384, charterCapital: 200, equity: 316 },
    { year: '2024', totalAssets: 355, charterCapital: 200, equity: 296 },
  ];

  // Data for Cash Flow Statement (Bảng dòng tiền)
  const cashflowChartData = [
    { year: '2021', operating: 13, investing: -61, freeCashFlow: 41 },
    { year: '2022', operating: 48, investing: -76, freeCashFlow: 24 },
    { year: '2023', operating: 14, investing: -32, freeCashFlow: 36 },
    { year: '2024', operating: 2, investing: 81, freeCashFlow: 29 },
  ];

  const incomeMetrics = [
    'Doanh thu thuần',
    'TT DT YoY%',
    'TT DT QoQ%',
    'Giá vốn hàng bán',
    'Lợi nhuận gộp',
    'Chi phí hoạt động',
    'Lợi nhuận hoạt động',
    'TT LNHD\tYoY%',
    'TT LNHD QoQ%',
    'Chi phí lãi vay',
    'Lợi nhuận trước thuế',
    'Lợi nhuận sau thuế',
    'Lợi nhuận dành cho cổ đông',
    'TT LNCD YoY%',
    'TT LNCD QoQ%',
    'Lợi nhuận từ đầu tư',
    'Lợi nhuận từ dịch vụ',
    'Lợi nhuận khác',
    'Chi phí dự phòng',
    'Thu nhập từ hoạt động kinh doanh',
    'EBITDA',
  ];

  const balanceMetrics = [
    'Tài sản ngắn hạn',
    'Tiền và các khoản tương đương tiền',
    'Đầu tư ngắn hạn',
    'Phải thu ngắn hạn',
    'Hàng tồn kho',
    'Tài sản dài hạn',
    'Tài sản cố định',
    'Tổng tài sản',
    'Nợ phải trả',
    'Nợ ngắn hạn',
    'Nợ dài hạn',
    'Vốn chủ sở hữu',
    'Vốn điều lệ',
    'Tiền gửi tại Ngân hàng Trung ương',
    'Tiền gửi tại Ngân hàng khác',
    'Vay từ Ngân hàng khác',
    'Đầu tư chứng khoán',
    'Cho vay khách hàng',
    'Nợ xấu',
    'Dự phòng rủi ro tín dụng',
    'Cho vay khách hàng ròng',
    'Tài sản khác',
    'Tín dụng từ Ngân hàng khác',
    'Nợ Ngân hàng khác',
    'Nợ Ngân hàng Trung ương',
    'Giấy tờ có giá',
    'Lãi phải trả',
    'Lãi phải thu',
    'Tiền gửi',
    'Nợ khác',
    'Quỹ',
    'Lợi nhuận chưa phân phối',
    'Lợi nhuận của cổ đông thiểu số',
    'Phải trả',
  ];

  const cashflowMetrics = [
    'Chi phí đầu tư',
    'Dòng tiền từ hoạt động đầu tư',
    'Dòng tiền từ hoạt động tài chính',
    'Dòng tiền từ hoạt động kinh doanh',
    'Dòng tiền tự do',
  ];

  const incomeData: { [key: number]: { [key: string]: number } } = {
    2015: {
      'Doanh thu thuần': 25, 'TT DT YoY%': 0.0, 'TT DT QoQ%': 0.0,
      'Giá vốn hàng bán': -23, 'Lợi nhuận gộp': 2, 'Chi phí hoạt động': 0,
      'Lợi nhuận hoạt động': 1, 'TT LNHD\tYoY%': 0.0, 'TT LNHD QoQ%': 0.0,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 1, 'Lợi nhuận sau thuế': 1,
      'Lợi nhuận dành cho cổ đông': 1, 'TT LNCD YoY%': 0.0, 'TT LNCD QoQ%': 0.0,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 1,
    },
    2016: {
      'Doanh thu thuần': 30, 'TT DT YoY%': 21.7, 'TT DT QoQ%': 0.0,
      'Giá vốn hàng bán': -27, 'Lợi nhuận gộp': 3, 'Chi phí hoạt động': -1,
      'Lợi nhuận hoạt động': 3, 'TT LNHD\tYoY%': 124.1, 'TT LNHD QoQ%': 0.0,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 2, 'Lợi nhuận sau thuế': 2,
      'Lợi nhuận dành cho cổ đông': 2, 'TT LNCD YoY%': 55.7, 'TT LNCD QoQ%': 0.0,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 3,
    },
    2017: {
      'Doanh thu thuần': 28, 'TT DT YoY%': -5.9, 'TT DT QoQ%': 0.0,
      'Giá vốn hàng bán': -27, 'Lợi nhuận gộp': 2, 'Chi phí hoạt động': -1,
      'Lợi nhuận hoạt động': 1, 'TT LNHD\tYoY%': -62.8, 'TT LNHD QoQ%': 0.0,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 1, 'Lợi nhuận sau thuế': 1,
      'Lợi nhuận dành cho cổ đông': 1, 'TT LNCD YoY%': -57.3, 'TT LNCD QoQ%': 0.0,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 1,
    },
    2018: {
      'Doanh thu thuần': 21, 'TT DT YoY%': -25.4, 'TT DT QoQ%': 0.0,
      'Giá vốn hàng bán': -18, 'Lợi nhuận gộp': 3, 'Chi phí hoạt động': -1,
      'Lợi nhuận hoạt động': 2, 'TT LNHD\tYoY%': 126.0, 'TT LNHD QoQ%': 0.0,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 2, 'Lợi nhuận sau thuế': 2,
      'Lợi nhuận dành cho cổ đông': 2, 'TT LNCD YoY%': 128.2, 'TT LNCD QoQ%': 0.0,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 2,
    },
    2019: {
      'Doanh thu thuần': 27, 'TT DT YoY%': 27.3, 'TT DT QoQ%': 0.0,
      'Giá vốn hàng bán': -15, 'Lợi nhuận gộp': 12, 'Chi phí hoạt động': -3,
      'Lợi nhuận hoạt động': 9, 'TT LNHD\tYoY%': 288.6, 'TT LNHD QoQ%': 0.0,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 11, 'Lợi nhuận sau thuế': 8,
      'Lợi nhuận dành cho cổ đông': 8, 'TT LNCD YoY%': 386.4, 'TT LNCD QoQ%': 0.0,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 11,
    },
    2020: {
      'Doanh thu thuần': 98, 'TT DT YoY%': 263.3, 'TT DT QoQ%': 0.0,
      'Giá vốn hàng bán': -46, 'Lợi nhuận gộp': 53, 'Chi phí hoạt động': -30,
      'Lợi nhuận hoạt động': 23, 'TT LNHD\tYoY%': 157.3, 'TT LNHD QoQ%': 0.0,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 30, 'Lợi nhuận sau thuế': 25,
      'Lợi nhuận dành cho cổ đông': 25, 'TT LNCD YoY%': 194.4, 'TT LNCD QoQ%': 0.0,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 31,
    },
    2021: {
      'Doanh thu thuần': 91, 'TT DT YoY%': -7.2, 'TT DT QoQ%': 0.0,
      'Giá vốn hàng bán': -47, 'Lợi nhuận gộp': 44, 'Chi phí hoạt động': -28,
      'Lợi nhuận hoạt động': 17, 'TT LNHD\tYoY%': -25.8, 'TT LNHD QoQ%': 0.0,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 23, 'Lợi nhuận sau thuế': 19,
      'Lợi nhuận dành cho cổ đông': 19, 'TT LNCD YoY%': -21.9, 'TT LNCD QoQ%': 0.0,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 27,
    },
    2022: {
      'Doanh thu thuần': 104, 'TT DT YoY%': 14.3, 'TT DT QoQ%': 0.0,
      'Giá vốn hàng bán': -51, 'Lợi nhuận gộp': 53, 'Chi phí hoạt động': -25,
      'Lợi nhuận hoạt động': 28, 'TT LNHD\tYoY%': 67.8, 'TT LNHD QoQ%': 0.0,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 39, 'Lợi nhuận sau thuế': 29,
      'Lợi nhuận dành cho cổ đông': 29, 'TT LNCD YoY%': 52.1, 'TT LNCD QoQ%': 0.0,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 39,
    },
    2023: {
      'Doanh thu thuần': 54, 'TT DT YoY%': -48.5, 'TT DT QoQ%': 0.0,
      'Giá vốn hàng bán': -20, 'Lợi nhuận gộp': 33, 'Chi phí hoạt động': -25,
      'Lợi nhuận hoạt động': 8, 'TT LNHD\tYoY%': -71.3, 'TT LNHD QoQ%': 0.0,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 41, 'Lợi nhuận sau thuế': 31,
      'Lợi nhuận dành cho cổ đông': 31, 'TT LNCD YoY%': 5.4, 'TT LNCD QoQ%': 0.0,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 16,
    },
    2024: {
      'Doanh thu thuần': 25, 'TT DT YoY%': -53.6, 'TT DT QoQ%': 0.0,
      'Giá vốn hàng bán': -3, 'Lợi nhuận gộp': 21, 'Chi phí hoạt động': -11,
      'Lợi nhuận hoạt động': 11, 'TT LNHD\tYoY%': 33.3, 'TT LNHD QoQ%': 0.0,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 27, 'Lợi nhuận sau thuế': 20,
      'Lợi nhuận dành cho cổ đông': 20, 'TT LNCD YoY%': -36.3, 'TT LNCD QoQ%': 0.0,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 18,
    },
  };

  // Quarterly income data (Q4/2024 - Q3/2025)
  const incomeQuarterlyData: { [key: string]: { [key: string]: number } } = {
    'Q4/24': {
      'Doanh thu thuần': 6, 'TT DT YoY%': -63.0, 'TT DT QoQ%': -3.9,
      'Giá vốn hàng bán': 0, 'Lợi nhuận gộp': 6, 'Chi phí hoạt động': -1,
      'Lợi nhuận hoạt động': 5, 'TT LNHD\tYoY%': 0.0, 'TT LNHD QoQ%': 491.3,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 9, 'Lợi nhuận sau thuế': 6,
      'Lợi nhuận dành cho cổ đông': 6, 'TT LNCD YoY%': 57490.2, 'TT LNCD QoQ%': 107.0,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 10,
    },
    'Q1/25': {
      'Doanh thu thuần': 6, 'TT DT YoY%': -61.4, 'TT DT QoQ%': 4.2,
      'Giá vốn hàng bán': 0, 'Lợi nhuận gộp': 6, 'Chi phí hoạt động': -4,
      'Lợi nhuận hoạt động': 2, 'TT LNHD\tYoY%': 31.2, 'TT LNHD QoQ%': -67.9,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 5, 'Lợi nhuận sau thuế': 4,
      'Lợi nhuận dành cho cổ đông': 4, 'TT LNCD YoY%': -22.9, 'TT LNCD QoQ%': -42.6,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 3,
    },
    'Q2/25': {
      'Doanh thu thuần': 6, 'TT DT YoY%': 0.0, 'TT DT QoQ%': -1.6,
      'Giá vốn hàng bán': 0, 'Lợi nhuận gộp': 6, 'Chi phí hoạt động': -4,
      'Lợi nhuận hoạt động': 2, 'TT LNHD\tYoY%': -54.9, 'TT LNHD QoQ%': -3.6,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 5, 'Lợi nhuận sau thuế': 3,
      'Lợi nhuận dành cho cổ đông': 3, 'TT LNCD YoY%': -39.3, 'TT LNCD QoQ%': -9.7,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 3,
    },
    'Q3/25': {
      'Doanh thu thuần': 6, 'TT DT YoY%': -3.9, 'TT DT QoQ%': -2.4,
      'Giá vốn hàng bán': 0, 'Lợi nhuận gộp': 6, 'Chi phí hoạt động': -4,
      'Lợi nhuận hoạt động': 1, 'TT LNHD\tYoY%': 34.6, 'TT LNHD QoQ%': -26.3,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 4, 'Lợi nhuận sau thuế': 2,
      'Lợi nhuận dành cho cổ đông': 2, 'TT LNCD YoY%': -19.3, 'TT LNCD QoQ%': -24.8,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': -1,
    },
    // Q4/2023 - Q3/2024 data
    'Q4/23': {
      'Doanh thu thuần': 16, 'TT DT YoY%': -42.6, 'TT DT QoQ%': 159.6,
      'Giá vốn hàng bán': -11, 'Lợi nhuận gộp': 5, 'Chi phí hoạt động': -9,
      'Lợi nhuận hoạt động': -4, 'TT LNHD\tYoY%': 0.0, 'TT LNHD QoQ%': 0.0,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 2, 'Lợi nhuận sau thuế': 0,
      'Lợi nhuận dành cho cổ đông': 0, 'TT LNCD YoY%': -99.9, 'TT LNCD QoQ%': -99.8,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': -4,
    },
    'Q1/24': {
      'Doanh thu thuần': 16, 'TT DT YoY%': -41.3, 'TT DT QoQ%': 0.0,
      'Giá vốn hàng bán': -11, 'Lợi nhuận gộp': 6, 'Chi phí hoạt động': -4,
      'Lợi nhuận hoạt động': 1, 'TT LNHD\tYoY%': -83.7, 'TT LNHD QoQ%': 0.0,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 6, 'Lợi nhuận sau thuế': 5,
      'Lợi nhuận dành cho cổ đông': 5, 'TT LNCD YoY%': -47.2, 'TT LNCD QoQ%': 42778.8,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 3,
    },
    'Q2/24': {
      'Doanh thu thuần': -4, 'TT DT YoY%': 0.0, 'TT DT QoQ%': 0.0,
      'Giá vốn hàng bán': 8, 'Lợi nhuận gộp': 4, 'Chi phí hoạt động': -1,
      'Lợi nhuận hoạt động': 4, 'TT LNHD\tYoY%': 40.2, 'TT LNHD QoQ%': 180.2,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 7, 'Lợi nhuận sau thuế': 5,
      'Lợi nhuận dành cho cổ đông': 5, 'TT LNCD YoY%': -64.4, 'TT LNCD QoQ%': 14.7,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 5,
    },
    'Q3/24': {
      'Doanh thu thuần': 6, 'TT DT YoY%': 0.1, 'TT DT QoQ%': 0.0,
      'Giá vốn hàng bán': -1, 'Lợi nhuận gộp': 6, 'Chi phí hoạt động': -5,
      'Lợi nhuận hoạt động': 1, 'TT LNHD\tYoY%': -49.4, 'TT LNHD QoQ%': -75.3,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 4, 'Lợi nhuận sau thuế': 3,
      'Lợi nhuận dành cho cổ đông': 3, 'TT LNCD YoY%': -46.2, 'TT LNCD QoQ%': -43.4,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': -1,
    },
    // Q4/2022 - Q3/2023
    'Q4/22': {
      'Doanh thu thuần': 29, 'TT DT YoY%': 24.1, 'TT DT QoQ%': 3.5,
      'Giá vốn hàng bán': -13, 'Lợi nhuận gộp': 16, 'Chi phí hoạt động': -7,
      'Lợi nhuận hoạt động': 9, 'TT LNHD\tYoY%': 48.7, 'TT LNHD QoQ%': 5.5,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 12, 'Lợi nhuận sau thuế': 9,
      'Lợi nhuận dành cho cổ đông': 9, 'TT LNCD YoY%': 56.8, 'TT LNCD QoQ%': 6.3,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 10,
    },
    'Q1/23': {
      'Doanh thu thuần': 28, 'TT DT YoY%': 19.1, 'TT DT QoQ%': -2.3,
      'Giá vốn hàng bán': -14, 'Lợi nhuận gộp': 14, 'Chi phí hoạt động': -6,
      'Lợi nhuận hoạt động': 8, 'TT LNHD\tYoY%': 42.7, 'TT LNHD QoQ%': -14.7,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 12, 'Lợi nhuận sau thuế': 9,
      'Lợi nhuận dành cho cổ đông': 9, 'TT LNCD YoY%': 56.3, 'TT LNCD QoQ%': -0.9,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 10,
    },
    'Q2/23': {
      'Doanh thu thuần': 13, 'TT DT YoY%': -46.0, 'TT DT QoQ%': -53.5,
      'Giá vốn hàng bán': -5, 'Lợi nhuận gộp': 8, 'Chi phí hoạt động': -6,
      'Lợi nhuận hoạt động': 3, 'TT LNHD\tYoY%': -51.9, 'TT LNHD QoQ%': -67.3,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 20, 'Lợi nhuận sau thuế': 15,
      'Lợi nhuận dành cho cổ đông': 15, 'TT LNCD YoY%': 174.6, 'TT LNCD QoQ%': 69.8,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 4,
    },
    'Q3/23': {
      'Doanh thu thuần': 6, 'TT DT YoY%': -77.1, 'TT DT QoQ%': -51.3,
      'Giá vốn hàng bán': 0, 'Lợi nhuận gộp': 6, 'Chi phí hoạt động': -4,
      'Lợi nhuận hoạt động': 2, 'TT LNHD\tYoY%': -79.9, 'TT LNHD QoQ%': -31.6,
      'Chi phí lãi vay': 0, 'Lợi nhuận trước thuế': 8, 'Lợi nhuận sau thuế': 6,
      'Lợi nhuận dành cho cổ đông': 6, 'TT LNCD YoY%': -33.0, 'TT LNCD QoQ%': -62.5,
      'Lợi nhuận từ đầu tư': 0, 'Lợi nhuận từ dịch vụ': 0, 'Lợi nhuận khác': 0,
      'Chi phí dự phòng': 0, 'Thu nhập từ hoạt động kinh doanh': 0, 'EBITDA': 0,
    },
  };

  const balanceData: { [key: number]: { [key: string]: number } } = {
    2021: {
      'Tài sản ngắn hạn': 237, 'Tiền và các khoản tương đương tiền': 49, 'Đầu tư ngắn hạn': 145,
      'Phải thu ngắn hạn': 42, 'Hàng tồn kho': 0, 'Tài sản dài hạn': 76,
      'Tài sản cố định': 15, 'Tổng tài sản': 313, 'Nợ phải trả': 57,
      'Nợ ngắn hạn': 0, 'Nợ dài hạn': 0, 'Vốn chủ sở hữu': 256,
      'Vốn điều lệ': 200, 'Tiền gửi tại Ngân hàng Trung ương': 0, 'Tiền gửi tại Ngân hàng khác': 0,
      'Vay từ Ngân hàng khác': 0, 'Đầu tư chứng khoán': 0, 'Cho vay khách hàng': 0,
      'Nợ xấu': 0, 'Dự phòng rủi ro tín dụng': 0, 'Cho vay khách hàng ròng': 0,
      'Tài sản khác': 0, 'Tín dụng từ Ngân hàng khác': 0, 'Nợ Ngân hàng khác': 0,
      'Nợ Ngân hàng Trung ương': 0, 'Giấy tờ có giá': 0, 'Lãi phải trả': 0,
      'Lãi phải thu': 0, 'Tiền gửi': 0, 'Nợ khác': 2,
      'Quỹ': 0, 'Lợi nhuận chưa phân phối': 0, 'Lợi nhuận của cổ đông thiểu số': 0,
      'Phải trả': 57,
    },
    2022: {
      'Tài sản ngắn hạn': 196, 'Tiền và các khoản tương đương tiền': 21, 'Đầu tư ngắn hạn': 117,
      'Phải thu ngắn hạn': 56, 'Hàng tồn kho': 0, 'Tài sản dài hạn': 176,
      'Tài sản cố định': 11, 'Tổng tài sản': 372, 'Nợ phải trả': 87,
      'Nợ ngắn hạn': 0, 'Nợ dài hạn': 0, 'Vốn chủ sở hữu': 285,
      'Vốn điều lệ': 200, 'Tiền gửi tại Ngân hàng Trung ương': 0, 'Tiền gửi tại Ngân hàng khác': 0,
      'Vay từ Ngân hàng khác': 0, 'Đầu tư chứng khoán': 0, 'Cho vay khách hàng': 0,
      'Nợ xấu': 0, 'Dự phòng rủi ro tín dụng': 0, 'Cho vay khách hàng ròng': 0,
      'Tài sản khác': 0, 'Tín dụng từ Ngân hàng khác': 0, 'Nợ Ngân hàng khác': 0,
      'Nợ Ngân hàng Trung ương': 0, 'Giấy tờ có giá': 0, 'Lãi phải trả': 0,
      'Lãi phải thu': 0, 'Tiền gửi': 0, 'Nợ khác': 3,
      'Quỹ': 0, 'Lợi nhuận chưa phân phối': 0, 'Lợi nhuận của cổ đông thiểu số': 0,
      'Phải trả': 87,
    },
    2023: {
      'Tài sản ngắn hạn': 174, 'Tiền và các khoản tương đương tiền': 3, 'Đầu tư ngắn hạn': 130,
      'Phải thu ngắn hạn': 40, 'Hàng tồn kho': 0, 'Tài sản dài hạn': 210,
      'Tài sản cố định': 0, 'Tổng tài sản': 384, 'Nợ phải trả': 68,
      'Nợ ngắn hạn': 0, 'Nợ dài hạn': 0, 'Vốn chủ sở hữu': 316,
      'Vốn điều lệ': 200, 'Tiền gửi tại Ngân hàng Trung ương': 0, 'Tiền gửi tại Ngân hàng khác': 0,
      'Vay từ Ngân hàng khác': 0, 'Đầu tư chứng khoán': 0, 'Cho vay khách hàng': 0,
      'Nợ xấu': 0, 'Dự phòng rủi ro tín dụng': 0, 'Cho vay khách hàng ròng': 0,
      'Tài sản khác': 0, 'Tín dụng từ Ngân hàng khác': 0, 'Nợ Ngân hàng khác': 0,
      'Nợ Ngân hàng Trung ương': 0, 'Giấy tờ có giá': 0, 'Lãi phải trả': 0,
      'Lãi phải thu': 0, 'Tiền gửi': 0, 'Nợ khác': 2,
      'Quỹ': 0, 'Lợi nhuận chưa phân phối': 0, 'Lợi nhuận của cổ đông thiểu số': 0,
      'Phải trả': 68,
    },
    2024: {
      'Tài sản ngắn hạn': 197, 'Tiền và các khoản tương đương tiền': 46, 'Đầu tư ngắn hạn': 111,
      'Phải thu ngắn hạn': 39, 'Hàng tồn kho': 0, 'Tài sản dài hạn': 158,
      'Tài sản cố định': 0, 'Tổng tài sản': 355, 'Nợ phải trả': 59,
      'Nợ ngắn hạn': 0, 'Nợ dài hạn': 0, 'Vốn chủ sở hữu': 296,
      'Vốn điều lệ': 200, 'Tiền gửi tại Ngân hàng Trung ương': 0, 'Tiền gửi tại Ngân hàng khác': 0,
      'Vay từ Ngân hàng khác': 0, 'Đầu tư chứng khoán': 0, 'Cho vay khách hàng': 0,
      'Nợ xấu': 0, 'Dự phòng rủi ro tín dụng': 0, 'Cho vay khách hàng ròng': 0,
      'Tài sản khác': 0, 'Tín dụng từ Ngân hàng khác': 0, 'Nợ Ngân hàng khác': 0,
      'Nợ Ngân hàng Trung ương': 0, 'Giấy tờ có giá': 0, 'Lãi phải trả': 0,
      'Lãi phải thu': 0, 'Tiền gửi': 0, 'Nợ khác': 2,
      'Quỹ': 0, 'Lợi nhuận chưa phân phối': 0, 'Lợi nhuận của cổ đông thiểu số': 0,
      'Phải trả': 59,
    },
  };

  const cashflowData: { [key: number]: { [key: string]: number } } = {
    2021: {
      'Chi phí đầu tư': -1,
      'Dòng tiền từ hoạt động đầu tư': -61,
      'Dòng tiền từ hoạt động tài chính': 0,
      'Dòng tiền từ hoạt động kinh doanh': 13,
      'Dòng tiền tự do': 41,
    },
    2022: {
      'Chi phí đầu tư': 0,
      'Dòng tiền từ hoạt động đầu tư': -76,
      'Dòng tiền từ hoạt động tài chính': 0,
      'Dòng tiền từ hoạt động kinh doanh': 48,
      'Dòng tiền tự do': 24,
    },
    2023: {
      'Chi phí đầu tư': 0,
      'Dòng tiền từ hoạt động đầu tư': -32,
      'Dòng tiền từ hoạt động tài chính': 0,
      'Dòng tiền từ hoạt động kinh doanh': 14,
      'Dòng tiền tự do': 36,
    },
    2024: {
      'Chi phí đầu tư': 0,
      'Dòng tiền từ hoạt động đầu tư': 81,
      'Dòng tiền từ hoạt động tài chính': -40,
      'Dòng tiền từ hoạt động kinh doanh': 2,
      'Dòng tiền tự do': 29,
    },
  };

  // Get current metrics based on activeTab and reportType
  const getCurrentMetrics = () => {
    if (activeTab === 'annual') {
      if (reportType === 'income') return incomeMetrics;
      if (reportType === 'balance') return balanceMetrics;
      return cashflowMetrics;
    } else {
      // Quarterly - only income for now
      return incomeMetrics;
    }
  };

  // Get current data based on activeTab and reportType
  const getCurrentData = () => {
    if (activeTab === 'annual') {
      if (reportType === 'income') return incomeData;
      if (reportType === 'balance') return balanceData;
      return cashflowData;
    } else {
      // Quarterly - only income for now
      return incomeQuarterlyData;
    }
  };

  // Get chart data based on activeTab and reportType
  const getCurrentChartData = () => {
    if (activeTab === 'annual') {
      const startYear = years[0];
      const endYear = years[years.length - 1];
      
      if (reportType === 'income') {
        return incomeChartData.filter(item => {
          const year = parseInt(item.year);
          return year >= startYear && year <= endYear;
        });
      } else if (reportType === 'balance') {
        return balanceChartData;
      } else {
        return cashflowChartData;
      }
    } else {
      // Quarterly - filter based on current quarter range
      const currentQuarters = quarters;
      return incomeQuarterlyChartData.filter(item => 
        currentQuarters.includes(item.year)
      );
    }
  };

  const currentMetrics = getCurrentMetrics();
  const currentData = getCurrentData();
  const currentChartData = getCurrentChartData();
  const currentPeriods = activeTab === 'annual' ? years : quarters;

  // Navigation handlers
  const handlePreviousYears = () => {
    if (yearRangeIndex < yearRanges.length - 1) {
      setYearRangeIndex(yearRangeIndex + 1);
    }
  };

  const handleNextYears = () => {
    if (yearRangeIndex > 0) {
      setYearRangeIndex(yearRangeIndex - 1);
    }
  };

  const handlePreviousQuarters = () => {
    if (quarterRangeIndex < quarterRanges.length - 1) {
      setQuarterRangeIndex(quarterRangeIndex + 1);
    }
  };

  const handleNextQuarters = () => {
    if (quarterRangeIndex > 0) {
      setQuarterRangeIndex(quarterRangeIndex - 1);
    }
  };

  return (
    <div className={`dashboard-module w-full h-full rounded-2xl border-2 flex flex-col overflow-hidden text-sm ${
      isDark ? 'bg-moduleBackground border-gray-700/40 text-white' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      {/* Header with BCTC logo and tabs */}
      <div className="flex justify-between flex-none">
        {/* Left: BCTC Logo */}
        <div className="relative flex-none" style={{ width: '124px', minHeight: '100px', borderRadius: '23px 0px 0px' }}>
          <div className="absolute inset-0 origin-top-left" style={{ width: '124px', height: '100px', transform: 'scale(0.5)' }}>
            <svg className="absolute inset-0 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" width="248" height="200" viewBox="0 0 248 200">
              <path d="M0,181.009C0,100.39,106.116,125.641,138.148,93.1624C170.179,60.6838,139.172,0,228.424,0L0.00000470335,0L0,181.009Z" fill="currentColor" />
            </svg>
          </div>
          <div className="relative h-full flex justify-center items-center">
            <div className="mr-10 mb-8 text-2xl rotate-[-32deg] font-semibold text-accentGreen" title="Báo cáo tài chính">
              <div className="animate-bounce">BCTC</div>
            </div>
          </div>
        </div>

        {/* Right: Tab buttons */}
        <div className="text-sm h-full flex items-center pr-6 -ml-6 -mt-3 overflow-hidden">
          <div className="flex items-center max-w-full">
            <div className="flex gap-2 whitespace-nowrap overflow-x-auto scrollbar-hide">
              <button 
                onClick={() => setReportType('income')}
                className={`rounded-md px-3 py-1 border border-transparent ${
                  reportType === 'income' 
                    ? 'bg-accentGreen text-black' 
                    : isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'
                }`}
              >
                Kết quả kinh doanh
              </button>
              <button 
                onClick={() => setReportType('balance')}
                className={`rounded-md px-3 py-1 border border-transparent ${
                  reportType === 'balance' 
                    ? 'bg-accentGreen text-black' 
                    : isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'
                }`}
              >
                Bảng cân đối kế toán
              </button>
              <button 
                onClick={() => setReportType('cashflow')}
                className={`rounded-md px-3 py-1 border border-transparent ${
                  reportType === 'cashflow' 
                    ? 'bg-accentGreen text-black' 
                    : isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'
                }`}
              >
                Bảng dòng tiền
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content - includes Chart, Tabs, and Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {/* Chart Section */}
        <div className="px-6 pb-6 -mx-4 -mt-6">
          <ResponsiveContainer width="100%" height={215}>
            <BarChart data={currentChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis dataKey="year" stroke="#e0e0e0" tick={{ fill: '#ffffff', fontSize: 12 }} />
              <YAxis stroke="#e0e0e0" tick={{ fill: '#ffffff', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#424242', border: 'none', borderRadius: '4px' }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', color: '#ffffff' }} 
                iconType="square"
              />
              {reportType === 'income' ? (
                <>
                  <Bar dataKey="revenue" fill="#84cc16" name="Doanh thu thuần" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#22c55e" name="Lợi nhuận gộp" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="afterTax" fill="#10b981" name="Lợi nhuận sau thuế" radius={[4, 4, 0, 0]} />
                </>
              ) : reportType === 'balance' ? (
                <>
                  <Bar dataKey="totalAssets" fill="#84cc16" name="Tổng tài sản" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="charterCapital" fill="#22c55e" name="Vốn điều lệ" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="equity" fill="#10b981" name="Vốn chủ sở hữu" radius={[4, 4, 0, 0]} />
                </>
              ) : (
                <>
                  <Bar dataKey="operating" fill="#84cc16" name="Dòng tiền từ hoạt động kinh doanh" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="investing" fill="#22c55e" name="Dòng tiền từ hoạt động đầu tư" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="freeCashFlow" fill="#10b981" name="Dòng tiền tự do" radius={[4, 4, 0, 0]} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabs and Year Selector */}
        <div className="px-6">
          <div className="flex justify-between items-center">
            <div className="flex flex-wrap gap-1 min-w-32">
              <button
                onClick={() => setActiveTab('annual')}
                className={`px-3 py-1 rounded-full ${
                  activeTab === 'annual'
                    ? 'bg-accentGreen text-black'
                    : isDark ? 'bg-transparent text-gray-400' : 'bg-transparent text-gray-600'
                }`}
              >
                Hàng Năm
              </button>
              <button
                onClick={() => setActiveTab('quarterly')}
                className={`px-3 py-1 rounded-full ${
                  activeTab === 'quarterly'
                    ? 'bg-accentGreen text-black'
                    : isDark ? 'bg-transparent text-gray-400' : 'bg-transparent text-gray-600'
                }`}
              >
                Hàng Quý
              </button>
            </div>

            {/* Period headers (Years or Quarters) */}
            <div className="relative">
              <div className="absolute inset-y-0 -left-4 flex items-center">
                <button 
                  type="button" 
                  onClick={activeTab === 'annual' ? handlePreviousYears : handlePreviousQuarters}
                  disabled={
                    activeTab === 'annual' 
                      ? yearRangeIndex === yearRanges.length - 1
                      : quarterRangeIndex === quarterRanges.length - 1
                  }
                  className={`rounded-full text-xs p-[0.175rem] shadow-sm ring-1 ring-inset inline-flex items-center ${
                    (activeTab === 'annual' && yearRangeIndex === yearRanges.length - 1) ||
                    (activeTab === 'quarterly' && quarterRangeIndex === quarterRanges.length - 1)
                      ? isDark ? 'text-gray-500 bg-gray-800 ring-gray-700 cursor-not-allowed opacity-50' : 'text-gray-400 bg-gray-100 ring-gray-300 cursor-not-allowed opacity-50'
                      : isDark ? 'text-gray-200 bg-gray-800 ring-gray-700 hover:bg-gray-700 cursor-pointer' : 'text-gray-700 bg-white ring-gray-300 hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2 text-center">
                {currentPeriods.map((period) => (
                  <div key={period} className={`font-semibold w-14 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {period}
                  </div>
                ))}
              </div>
              <div className="absolute inset-y-0 -right-4 flex items-center">
                <button 
                  type="button" 
                  onClick={activeTab === 'annual' ? handleNextYears : handleNextQuarters}
                  disabled={
                    activeTab === 'annual' 
                      ? yearRangeIndex === 0
                      : quarterRangeIndex === 0
                  }
                  className={`rounded-full text-xs p-[0.175rem] shadow-sm ring-1 ring-inset inline-flex items-center ${
                    (activeTab === 'annual' && yearRangeIndex === 0) ||
                    (activeTab === 'quarterly' && quarterRangeIndex === 0)
                      ? isDark ? 'text-gray-500 bg-gray-800 ring-gray-700 cursor-not-allowed opacity-50' : 'text-gray-400 bg-gray-100 ring-gray-300 cursor-not-allowed opacity-50'
                      : isDark ? 'text-gray-200 bg-gray-800 ring-gray-700 hover:bg-gray-700 cursor-pointer' : 'text-gray-700 bg-white ring-gray-300 hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="my-4 font-semibold"></div>
        </div>

        {/* Financial Data Table */}
        <div className="px-6 pb-4">
          {currentMetrics.map((metric) => (
            <div key={metric} className="flex justify-between items-center">
              <div className={`flex flex-wrap gap-1 min-w-32 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {metric}
              </div>
              <div className="relative">
                <div className="flex gap-2 text-center">
                  {currentPeriods.map((period) => {
                    const periodData = currentData[period as keyof typeof currentData];
                    const value = periodData ? periodData[metric as keyof typeof periodData] as number : 0;
                    const isPercentage = metric.includes('%');
                    const isNegative = value < 0;
                    const isPositive = value > 0;

                    return (
                      <div
                        key={`${metric}-${period}`}
                        className={`w-14 my-1 ${
                          isPercentage
                            ? isPositive
                              ? 'text-green-400'
                              : isNegative
                              ? 'text-red-400'
                              : isDark ? 'text-white' : 'text-gray-900'
                            : isNegative
                            ? 'text-red-400'
                            : isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {isPercentage ? `${value.toFixed(1)}%` : value}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
