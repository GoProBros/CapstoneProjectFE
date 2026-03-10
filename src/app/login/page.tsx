'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import LoginForm from '@/components/auth/LoginForm'
import { fetchOhlcvData, OhlcvDataPoint } from '@/services/ohlcvService'

// Background Effects Component
const BackgroundEffects = () => {
  const particles = Array.from({ length: 15 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-1 h-1 bg-[#4ADE80] rounded-full opacity-60"
      initial={{ 
        x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1200,
        y: -10,
        opacity: 0
      }}
      animate={{
        y: typeof window !== 'undefined' ? window.innerHeight + 10 : 800 + 10,
        opacity: [0, 0.6, 0],
      }}
      transition={{
        duration: Math.random() * 3 + 4,
        repeat: Infinity,
        delay: Math.random() * 5,
        ease: "linear"
      }}
    />
  ))

  return (
    <>
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/assets/LoginBackground.jpg')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0e0d15]/90 via-[#282832]/80 to-[#0e0d15]/90"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#4ADE80]/10 via-transparent to-blue-900/15"></div>
      </div>

      {/* Spotlight Effect */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-[#4ADE80]/20 via-[#4ADE80]/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-20 left-1/3 w-[400px] h-[400px] bg-gradient-radial from-blue-400/10 via-blue-400/5 to-transparent rounded-full blur-2xl"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles}
      </div>
    </>
  )
}

// Logo Component
const Logo = () => {
  return (
    <motion.div 
      className="mb-6"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-[#4ADE80] via-emerald-400 to-blue-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-[#4ADE80]/30">
            {/* Kafi Stock "K" monogram */}
            <span className="text-white font-black text-2xl tracking-tighter drop-shadow-lg select-none">K</span>
          </div>
          <div className="absolute -inset-2 bg-gradient-to-br from-[#4ADE80] to-blue-400 rounded-2xl blur-md opacity-25 animate-pulse"></div>
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight items-center flex">
            <span className="bg-gradient-to-r from-[#4ADE80] via-emerald-300 to-blue-400 bg-clip-text text-transparent">Kafi</span>
            <span className="text-white ml-2">Stock</span>
          </h1>
          <div className="flex items-center gap-2 mt-0.5 justify-center">
            <p className="text-slate-300 text-sm font-medium tracking-wide">Nền tảng hỗ trợ đầu tư</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Chart Visualization Component
const ChartVisualization = () => {
  const [chartData, setChartData] = useState<OhlcvDataPoint[]>([]);
  const [displayPrice, setDisplayPrice] = useState('—');
  const [priceChange, setPriceChange] = useState({ label: '—', up: true });

  useEffect(() => {
    (async () => {
      try {
        const toDate = new Date();
        toDate.setDate(toDate.getDate() + 1);
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 4);
        const res = await fetchOhlcvData({
          ticker: 'VIB',
          timeframe: 'D1',
          fromDate: fromDate.toISOString().split('T')[0],
          toDate: toDate.toISOString().split('T')[0],
        });
        if (res.data?.length) {
          const slice = res.data.slice(-60);
          setChartData(slice);
          const last = slice[slice.length - 1];
          const firstClose = slice[0].close;
          const pct = ((last.close - firstClose) / firstClose * 100).toFixed(1);
          setDisplayPrice(last.close.toLocaleString('vi-VN'));
          setPriceChange({ label: `${Number(pct) >= 0 ? '+' : ''}${pct}%`, up: Number(pct) >= 0 });
        }
      } catch { /* silently fall back to skeleton */ }
    })();
  }, []);

  // Build SVG paths from real data
  const W = 320, H = 200;
  const PAD = { top: 45, bottom: 38, left: 8, right: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  let linePath = '';
  let areaPath = '';
  let points: { x: number; y: number }[] = [];
  let volBars: { x: number; h: number; up: boolean }[] = [];

  if (chartData.length > 1) {
    const closes = chartData.map(d => d.close);
    const minC = Math.min(...closes);
    const maxC = Math.max(...closes);
    const range = maxC - minC || 1;
    const vols = chartData.map(d => d.volume);
    const maxV = Math.max(...vols) || 1;
    const toX = (i: number) => PAD.left + (i / (chartData.length - 1)) * chartW;
    const toY = (c: number) => PAD.top + chartH - ((c - minC) / range) * chartH;

    points = chartData.map((d, i) => ({ x: toX(i), y: toY(d.close) }));

    // Smooth bezier (cardinal spline)
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
    }
    linePath = d;
    const last = points[points.length - 1];
    const first = points[0];
    areaPath = `${linePath} L ${last.x},${PAD.top + chartH} L ${first.x},${PAD.top + chartH} Z`;

    const volAreaH = 24;
    volBars = chartData.map((d, i) => ({
      x: toX(i),
      h: (d.volume / maxV) * volAreaH,
      up: d.close >= d.open,
    }));
  }

  const isUp = priceChange.up;

  return (
    <motion.div
      className="relative mb-8 w-full max-w-md"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.6 }}
    >
      <div className="relative w-full h-64 bg-gradient-to-br from-slate-900/90 to-slate-800/70 rounded-2xl border border-[#4ADE80]/30 shadow-2xl backdrop-blur-sm overflow-hidden">
        {/* Animated Background Grid */}
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`h-${i}`}
              className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
              style={{ top: `${(i + 1) * 20}%` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }}
            />
          ))}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`v-${i}`}
              className="absolute h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"
              style={{ left: `${(i + 1) * 16.66}%` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }}
            />
          ))}
        </div>

        {/* Chart Content */}
        <div className="relative h-full p-0">
          <svg className="w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.35"/>
                <stop offset="100%" stopColor="#4ADE80" stopOpacity="0"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Horizontal grid lines */}
            {[0.25, 0.5, 0.75].map((t, i) => (
              <line key={i} x1="8" y1={45 + t * chartH} x2="312" y2={45 + t * chartH}
                stroke="white" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="4 4" />
            ))}

            {chartData.length > 1 ? (
              <>
                {/* Area fill */}
                <motion.path
                  d={areaPath}
                  fill="url(#areaGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2, delay: 1.2 }}
                />
                {/* Line */}
                <motion.path
                  d={linePath}
                  fill="none"
                  stroke="#4ADE80"
                  strokeWidth="2.5"
                  filter="url(#glow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 1, ease: 'easeInOut' }}
                />
                {/* Last price dot */}
                {points.length > 0 && (
                  <>
                    <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r="4"
                      fill="#0e0d15" stroke="#4ADE80" strokeWidth="2.5" />
                    <motion.circle cx={points[points.length-1].x} cy={points[points.length-1].y} r="4"
                      fill="#4ADE80"
                      animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </>
                )}
                {/* Volume bars */}
                {volBars.map((b, i) => (
                  <motion.rect key={i}
                    x={b.x - 1.5}
                    y={H - PAD.bottom + 4 + (24 - b.h)}
                    width="3"
                    height={b.h}
                    fill={b.up ? '#4ADE80' : '#EF4444'}
                    fillOpacity="0.5"
                    rx="1"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    style={{ transformOrigin: `${b.x}px ${H}px` }}
                    transition={{ duration: 0.4, delay: 1.4 + i * 0.01 }}
                  />
                ))}
              </>
            ) : (
              /* Skeleton shimmer when loading */
              <>
                <motion.path
                  d="M8,140 C60,120 80,100 130,85 C180,70 220,65 312,45"
                  fill="none" stroke="#4ADE80" strokeWidth="2" strokeOpacity="0.2"
                  strokeDasharray="8 4"
                  animate={{ strokeOpacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <text x="160" y="115" textAnchor="middle" fill="#4ADE80" fillOpacity="0.3" fontSize="10" fontFamily="monospace">Đang tải dữ liệu...</text>
              </>
            )}
          </svg>
        </div>

        {/* Stats Panel */}
        <motion.div
          className="absolute top-4 left-5 right-5 flex justify-between items-start"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
        >
          <div className="text-[#4ADE80] text-base font-bold tracking-widest uppercase">VIB</div>
          <div className="text-white text-base font-bold font-mono leading-none">{displayPrice}</div>
        </motion.div>

        {/* Glow effect */}
        <div className="absolute -inset-6 bg-gradient-to-r from-[#4ADE80]/10 via-transparent to-blue-500/10 rounded-2xl blur-2xl"></div>
        
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
      </div>

      {/* Legend */}
      <motion.div
        className="mt-4 flex items-center justify-center space-x-6 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
 
      </motion.div>
    </motion.div>
  )
}

// Hero Section Component
const HeroSection = () => {
  const steps = [
    {
      label: 'Tuỳ biến tự do',
      desc: 'Giao diện theo ý bạn',
      icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
      num: '01',
      barW: 'w-[55%]',
    },
    {
      label: 'Tốc độ tức thì',
      desc: 'Dữ liệu không độ trễ',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      num: '02',
      barW: 'w-[75%]',
    },
    {
      label: 'AI đồng hành',
      desc: 'Phân tích thông minh',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      num: '03',
      barW: 'w-full',
    },
  ]

  return (
    <motion.div
      className="max-w-lg flex flex-col justify-center items-center relative px-6"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <Logo />
      <ChartVisualization />

      {/* Staircase — horizontal progress bar style */}
      <div className="w-full mt-3 space-y-2.5">
        {steps.map((s, i) => (
          <motion.div
            key={s.label}
            className="group cursor-default"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 2.15 + i * 0.14, type: 'spring', stiffness: 200, damping: 24 }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-1 px-0.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#4ADE80]/15 border border-[#4ADE80]/30 flex items-center justify-center group-hover:bg-[#4ADE80]/25 transition-colors duration-300">
                  <svg className="w-3 h-3 text-[#4ADE80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                  </svg>
                </div>
                <div>
                  <span className="text-white/90 text-xs font-semibold leading-none">{s.label}</span>
                  <p className="text-slate-500 text-[10px] leading-none mt-0.5">{s.desc}</p>
                </div>
              </div>
              <span className="text-[#4ADE80]/50 text-[10px] font-bold font-mono tabular-nums">{s.num}</span>
            </div>
            {/* Progress bar track */}
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#4ADE80]/60 to-[#4ADE80] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: s.barW.replace('w-', '').replace('[', '').replace(']', '').replace('full', '100%') }}
                transition={{ duration: 0.7, delay: 2.3 + i * 0.14, ease: 'easeOut' }}
                style={{ width: s.barW === 'w-full' ? '100%' : s.barW === 'w-[75%]' ? '75%' : '55%' }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// Main Login Page
export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const msg = sessionStorage.getItem('auth_redirect_message');
    if (msg) {
      setError(msg);
      sessionStorage.removeItem('auth_redirect_message');
    }
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundEffects />

      {/* Error Popup - Outside all content */}
      {/* {error && (
        <motion.div
          initial={{ opacity: 0, x: 100, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 100, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-8 right-8 z-50 max-w-md w-auto"
        >
          <div className="bg-red-500/95 backdrop-blur-xl border border-red-400/50 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-1">Thông báo lỗi</h3>
                <p className="text-white/90 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )} */}

      <div className="min-h-screen flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-7xl flex items-center justify-center gap-8 lg:gap-16">
          <HeroSection />
          <LoginForm error={error} setError={setError} />
        </div>
      </div>
    </div>
  )
}
