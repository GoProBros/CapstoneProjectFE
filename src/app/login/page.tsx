'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import LoginForm from '@/components/auth/LoginForm'

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
          backgroundImage: `url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=80')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0e0d15]/95 via-[#282832]/90 to-[#0e0d15]/95"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#4ADE80]/20 via-transparent to-blue-900/20"></div>
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
      className="mb-8"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-[#4ADE80] to-blue-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-[#4ADE80]/25">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" className="drop-shadow-lg">
              <path d="M3 13h2v8H3v-8zm4-6h2v14H7V7zm4 2h2v12h-2V9zm4-4h2v16h-2V5zm4 6h2v10h-2V11z"/>
            </svg>
          </div>
          <div className="absolute -inset-2 bg-gradient-to-r from-[#4ADE80] to-blue-400 rounded-2xl blur opacity-30 animate-pulse-slow"></div>
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#4ADE80] via-blue-400 to-[#4ADE80] bg-clip-text text-transparent">
           Băng Rồng xanh
          </h1>
          <p className="text-slate-300 text-sm font-medium tracking-wide">Nền tảng giao dịch chuyên nghiệp</p>
        </div>
      </div>
    </motion.div>
  )
}

// Chart Visualization Component
const ChartVisualization = () => {
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
        <div className="relative h-full p-6">
          <svg className="w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#4ADE80" stopOpacity="0"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Area under curve */}
            <motion.path
              d="M0,180 L0,140 Q40,120 80,100 T160,80 Q200,70 240,60 T320,40 L320,180 Z"
              fill="url(#areaGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 1.2 }}
            />

            {/* Main trend line */}
            <motion.path
              d="M0,140 Q40,120 80,100 T160,80 Q200,70 240,60 T320,40"
              fill="none"
              stroke="#4ADE80"
              strokeWidth="3"
              filter="url(#glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
            />

            {/* Data points */}
            {[
              { x: 0, y: 140 },
              { x: 80, y: 100 },
              { x: 160, y: 80 },
              { x: 240, y: 60 },
              { x: 320, y: 40 }
            ].map((point, i) => (
              <motion.g key={i}>
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill="#0e0d15"
                  stroke="#4ADE80"
                  strokeWidth="3"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.5 + i * 0.15 }}
                />
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill="#4ADE80"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.5, 0],
                    opacity: [0, 0.6, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    delay: 1.5 + i * 0.15,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />
              </motion.g>
            ))}

            {/* Candlestick indicators */}
            {[
              { x: 40, open: 130, close: 120, high: 135, low: 115, up: false },
              { x: 120, open: 110, close: 95, high: 115, low: 90, up: false },
              { x: 200, open: 85, close: 75, high: 88, low: 70, up: false },
              { x: 280, open: 65, close: 50, high: 68, low: 45, up: false }
            ].map((candle, i) => {
              const isUp = candle.close > candle.open
              const color = isUp ? '#4ADE80' : '#EF4444'
              const bodyHeight = Math.abs(candle.close - candle.open)
              const bodyY = Math.min(candle.open, candle.close)
              
              return (
                <motion.g
                  key={`candle-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.3 + i * 0.1 }}
                >
                  <line
                    x1={candle.x}
                    y1={candle.high}
                    x2={candle.x}
                    y2={candle.low}
                    stroke={color}
                    strokeWidth="1.5"
                    strokeOpacity="0.5"
                  />
                  <rect
                    x={candle.x - 4}
                    y={bodyY}
                    width="8"
                    height={bodyHeight || 1}
                    fill={color}
                    fillOpacity="0.3"
                    rx="1"
                  />
                </motion.g>
              )
            })}
          </svg>
        </div>

        {/* Stats Panel */}
        <motion.div
          className="absolute top-4 left-4 right-4 flex justify-between items-start"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
        >
          <div className="space-y-1">
            <div className="text-white/60 text-xs font-medium">VN-INDEX</div>
            <div className="text-white text-xl font-bold">1,248.52</div>
          </div>
          <div className="bg-[#4ADE80]/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#4ADE80]/40">
            <div className="flex items-center space-x-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#4ADE80">
                <path d="M7 14l5-5 5 5z"/>
              </svg>
              <span className="text-[#4ADE80] text-sm font-bold">+15.8%</span>
            </div>
          </div>
        </motion.div>

        {/* Volume bars at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 flex items-end justify-around px-6 pb-2">
          {[40, 60, 35, 70, 45, 80, 55, 65, 50, 75].map((height, i) => (
            <motion.div
              key={i}
              className="w-4 bg-gradient-to-t from-[#4ADE80]/30 to-[#4ADE80]/60 rounded-t"
              style={{ height: `${height}%` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5, delay: 1.6 + i * 0.05 }}
            />
          ))}
        </div>

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
  return (
    <motion.div
      className="max-w-2xl flex flex-col justify-center items-center relative px-8"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <Logo />
      <ChartVisualization />
    </motion.div>
  )
}

// Main Login Page
export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundEffects />

      {/* Error Popup - Outside all content */}
      {error && (
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
      )}

      <div className="min-h-screen flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-7xl flex items-center justify-center gap-8 lg:gap-16">
          <HeroSection />
          <LoginForm error={error} setError={setError} />
        </div>
      </div>
    </div>
  )
}
