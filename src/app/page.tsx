'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  TrendingUp,
  Zap,
  LayoutDashboard,
  Activity,
  CheckCircle2,
  Globe,
  Share2,
  Mail,
  LogOut,
  ChevronRight,
  ArrowUpRight,
  Shield,
  Search,
  BarChart2,
  Users,
  Clock,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';

const MODULE_SHOWCASES = [
  {
    name: 'Heatmap',
    description: 'Tổng quan thị trường theo sector và vốn hóa bằng biểu đồ nhiệt trực quan.',
    image: '/assets/Dashboard/ModulePreviews/heatmap.png',
    tag: 'Phổ biến',
    tagColor: 'bg-[#00C805] text-[#0e0d15]',
  },
  {
    name: 'Stock Screener',
    description: 'Lọc cổ phiếu theo sàn, ngành, loại và nhiều điều kiện kết hợp cùng lúc.',
    image: '/assets/Dashboard/ModulePreviews/stock-screener.png',
    tag: 'Mới',
    tagColor: 'bg-blue-500 text-white',
  },
  {
    name: 'Biểu đồ VN',
    description: 'Biểu đồ nến OHLCV tương tác với đầy đủ công cụ phân tích kỹ thuật.',
    image: '/assets/Dashboard/ModulePreviews/vn-stock-chart.png',
    tag: null,
    tagColor: '',
  },
  {
    name: 'Báo cáo tài chính',
    description: 'Phân tích doanh thu, lợi nhuận và các chỉ số tài chính theo quý/năm.',
    image: '/assets/Dashboard/ModulePreviews/financial-report.png',
    tag: null,
    tagColor: '',
  },
  {
    name: 'Tin tức',
    description: 'Tin tức thị trường và sự kiện doanh nghiệp cập nhật theo thời gian thực.',
    image: '/assets/Dashboard/ModulePreviews/news.png',
    tag: null,
    tagColor: '',
  },
  {
    name: 'Báo cáo phân tích',
    description: 'Tổng hợp báo cáo từ các công ty chứng khoán và chuyên gia phân tích.',
    image: '/assets/Dashboard/ModulePreviews/analysis-report.png',
    tag: null,
    tagColor: '',
  },
];

const STATS = [
  { value: '10+', label: 'Module chuyên biệt', icon: LayoutDashboard },
  { value: '1.700+', label: 'Mã chứng khoán', icon: BarChart2 },
  { value: '<1s', label: 'Độ trễ dữ liệu', icon: Zap },
  { value: '24/7', label: 'Giám sát thị trường', icon: Clock },
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Dữ liệu thời gian thực',
    desc: 'Nhận giá cổ phiếu, khớp lệnh và chỉ số thị trường với độ trễ dưới 1 giây qua SignalR streaming.',
    iconColor: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
  {
    icon: LayoutDashboard,
    title: 'Bố cục kéo-thả',
    desc: 'Tự do sắp xếp 10+ module chuyên biệt. Lưu nhiều workspace và chuyển đổi theo chiến lược giao dịch.',
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  {
    icon: BarChart2,
    title: 'Phân tích toàn diện',
    desc: 'Từ heatmap ngành, screener đến báo cáo tài chính và tư vấn FA/TA — đủ cho mọi phong cách đầu tư.',
    iconColor: 'text-[#00C805]',
    bgColor: 'bg-[#00C805]/10',
  },
  {
    icon: Shield,
    title: 'Bảo mật cao',
    desc: 'JWT authentication, refresh token tự động và kiến trúc Clean Architecture đảm bảo dữ liệu an toàn.',
    iconColor: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
  {
    icon: Globe,
    title: 'Dữ liệu toàn cầu',
    desc: 'Theo dõi thị trường quốc tế, cổ phiếu Mỹ và châu Á qua TradingView integration.',
    iconColor: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
  },
  {
    icon: Search,
    title: 'Stock Screener nâng cao',
    desc: 'Lọc 1.700+ mã theo sàn, ngành, loại cổ phiếu và kết hợp nhiều điều kiện cùng lúc.',
    iconColor: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
  },
];

const PLANS = [
  {
    name: 'Miễn phí',
    price: '0đ',
    period: '/tháng',
    highlight: false,
    features: ['5 module cơ bản', '1 workspace', 'Dữ liệu delay 15 phút', 'Heatmap cơ bản'],
    cta: 'Bắt đầu miễn phí',
    href: ROUTES.DASHBOARD,
  },
  {
    name: 'Pro',
    price: 'Sắp ra mắt',
    period: '',
    highlight: true,
    features: [
      'Tất cả 10+ module',
      'Workspace không giới hạn',
      'Dữ liệu thời gian thực',
      'FA/TA Advisor AI',
      'Báo cáo phân tích',
      'Hỗ trợ ưu tiên',
    ],
    cta: 'Đăng ký nhận thông báo',
    href: '#',
  },
  {
    name: 'Doanh nghiệp',
    price: 'Liên hệ',
    period: '',
    highlight: false,
    features: [
      'Tất cả tính năng Pro',
      'API access trực tiếp',
      'Triển khai riêng (On-premise)',
      'SLA cam kết',
      'Hỗ trợ 24/7',
    ],
    cta: 'Liên hệ ngay',
    href: '#',
  },
];

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0d15] text-slate-100 selection:bg-[#00C805]/30" style={{ fontFamily: 'Quicksand, sans-serif' }}>

      {/* ── Header ── */}
      <header className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled ? 'border-white/10 bg-[#0e0d15]/95 backdrop-blur-xl shadow-2xl' : 'border-transparent bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={ROUTES.HOME} className="flex items-center gap-2 group">
            <TrendingUp className="text-[#00C805] w-7 h-7 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-black tracking-tight">KF Stock</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: '#features', label: 'Tính năng' },
              { href: '#modules', label: 'Module' },
              // { href: '#pricing', label: 'Bảng giá' },
            ].map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-semibold text-slate-400 hover:text-[#00C805] transition-colors">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-400">
                  Xin chào, <span className="text-white font-semibold">{user?.fullName ?? user?.email}</span>
                </span>
                <button
                  onClick={() => logout()}
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
                <Link
                  href={ROUTES.DASHBOARD}
                  className="bg-[#00C805] text-[#0e0d15] font-bold text-sm px-5 py-2 rounded-lg hover:brightness-110 transition-all flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href={ROUTES.LOGIN} className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 transition-colors">
                  Đăng nhập
                </Link>
                <Link href={ROUTES.DASHBOARD} className="bg-[#00C805] text-[#0e0d15] font-bold text-sm px-5 py-2 rounded-lg hover:brightness-110 transition-all">
                  Dùng thử miễn phí
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0e0d15] border-t border-white/10 px-4 py-6 flex flex-col gap-5">
            <a href="#features" className="text-sm font-semibold text-slate-300" onClick={() => setMobileMenuOpen(false)}>Tính năng</a>
            <a href="#modules" className="text-sm font-semibold text-slate-300" onClick={() => setMobileMenuOpen(false)}>Module</a>
            {/* <a href="#pricing" className="text-sm font-semibold text-slate-300" onClick={() => setMobileMenuOpen(false)}>Bảng giá</a> */}
            <hr className="border-white/10" />
            <Link href={ROUTES.LOGIN} className="text-sm font-semibold text-slate-300" onClick={() => setMobileMenuOpen(false)}>Đăng nhập</Link>
            <Link href={ROUTES.DASHBOARD} className="bg-[#00C805] text-[#0e0d15] font-bold text-sm px-5 py-3 rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>
              Dùng thử miễn phí
            </Link>
          </div>
        )}
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative pt-24 pb-20 md:pt-36 md:pb-28 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#00C805]/7 blur-[150px] rounded-full" />
            <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full" />
            <div className="absolute top-[20%] left-[-10%] w-[300px] h-[300px] bg-purple-500/4 blur-[100px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00C805]/10 border border-[#00C805]/25 text-[#00C805] text-xs font-bold mb-8 uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" /> Dữ liệu thị trường thời gian thực
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.05]">
              Không gian làm việc{' '}
              <span className="text-[#00C805]">thông minh</span>
              <br />
              cho nhà đầu tư chứng khoán
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Kéo - thả 10+ module phân tích chuyên biệt vào bảng điều khiển của bạn. Dữ liệu thời gian thực, heatmap ngành, screener và hơn thế nữa — trong một không gian duy nhất.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href={ROUTES.DASHBOARD}
                className="w-full sm:w-auto px-8 py-4 bg-[#00C805] text-[#0e0d15] font-extrabold text-base rounded-xl hover:brightness-110 hover:scale-105 transition-all text-center flex items-center justify-center gap-2"
              >
                Bắt đầu miễn phí <ChevronRight className="w-5 h-5" />
              </Link>
              <a
                href="#modules"
                className="w-full sm:w-auto px-8 py-4 text-base font-bold rounded-xl border border-white/15 text-slate-300 hover:border-[#00C805]/40 hover:text-white transition-all text-center"
              >
                Xem tính năng
              </a>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {STATS.map((stat) => (
                <div key={stat.label} className="glass-panel rounded-xl p-4 flex flex-col items-center gap-1 border border-white/5 hover:border-[#00C805]/20 transition-colors">
                  <stat.icon className="w-5 h-5 text-[#00C805] mb-1" />
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-xs text-slate-500 text-center leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Dashboard Preview ── */}
        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,200,5,0.07)]">
              <Image
                src="/assets/Dashboard/SidebarComponent/BlackHomePage.webp"
                alt="KF Stock Dashboard"
                width={1920}
                height={1080}
                className="w-full object-cover"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d15] via-[#0e0d15]/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col md:flex-row items-end justify-between gap-4">
                <div className="glass-panel rounded-xl p-5 max-w-md border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-[#00C805]" />
                    <span className="text-xs font-bold text-[#00C805] uppercase tracking-wider">Live Dashboard</span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">Tùy chỉnh hoàn toàn</h3>
                  <p className="text-slate-400 text-sm">Kéo, thả, resize tự do — không gian làm việc theo đúng cách bạn giao dịch.</p>
                </div>
                <div className="flex gap-3">
                  <div className="glass-panel rounded-xl px-4 py-3 text-center border border-white/10">
                    <p className="text-[#00C805] font-black text-base">VN-Index</p>
                    <p className="text-slate-200 text-sm font-bold">1,245.67</p>
                    <p className="text-green-400 text-xs">+0.83%</p>
                  </div>
                  <div className="glass-panel rounded-xl px-4 py-3 text-center border border-white/10">
                    <p className="text-[#00C805] font-black text-base">HNX30</p>
                    <p className="text-slate-200 text-sm font-bold">218.45</p>
                    <p className="text-red-400 text-xs">-0.21%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-24" id="features">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Mọi công cụ bạn cần <span className="text-[#00C805]">trong một nơi</span>
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Không cần mở nhiều tab hay chuyển đổi ứng dụng. Toàn bộ dữ liệu và phân tích trong một bảng điều khiển.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="group p-7 rounded-2xl glass-panel border border-white/5 hover:border-[#00C805]/25 transition-all duration-300">
                  <div className={`w-11 h-11 rounded-xl ${f.bgColor} flex items-center justify-center mb-5`}>
                    <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Module Showcase ── */}
        <section className="py-24 bg-[#282832]/20" id="modules">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                10+ module <span className="text-[#00C805]">chuyên biệt</span>
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Mỗi module được thiết kế tối ưu cho một nhiệm vụ. Chọn những gì bạn cần, bỏ những gì không dùng.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MODULE_SHOWCASES.map((mod) => (
                <div key={mod.name} className="group relative rounded-2xl overflow-hidden border border-white/8 hover:border-[#00C805]/30 transition-all duration-300 bg-[#1a1a1a] cursor-pointer">
                  {mod.tag && (
                    <div className={`absolute top-3 right-3 z-10 px-2.5 py-0.5 rounded-full text-xs font-bold ${mod.tagColor}`}>
                      {mod.tag}
                    </div>
                  )}
                  <div className="relative h-44 overflow-hidden bg-[#0f0f0f]">
                    <Image
                      src={mod.image}
                      alt={mod.name}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1a1a]" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-base mb-1.5">{mod.name}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{mod.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href={ROUTES.LOGIN}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#00C805] text-[#0e0d15] font-extrabold rounded-xl hover:brightness-110 transition-all"
              >
                Khám phá tất cả module <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-24">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Bắt đầu <span className="text-[#00C805]">trong 3 bước</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {[
                { step: 1, icon: Users, title: 'Tạo tài khoản', desc: 'Đăng ký miễn phí trong 30 giây. Không cần thẻ tín dụng.' },
                { step: 2, icon: LayoutDashboard, title: 'Thiết kế workspace', desc: 'Kéo thả module vào bảng điều khiển theo cách bạn giao dịch.' },
                { step: 3, icon: Activity, title: 'Phân tích thị trường', desc: 'Theo dõi danh mục, phân tích kỹ thuật và đưa ra quyết định nhanh hơn.' },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center text-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-[#282832] border border-white/10 flex items-center justify-center">
                      <s.icon className="w-8 h-8 text-[#00C805]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#00C805] rounded-full flex items-center justify-center text-[#0e0d15] text-xs font-black">
                      {s.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        {/* <section className="py-24 bg-[#282832]/20" id="pricing">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Bảng giá <span className="text-[#00C805]">đơn giản</span>
              </h2>
              <p className="text-slate-400">Chọn gói phù hợp với nhu cầu đầu tư của bạn.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl p-8 border transition-all duration-300 ${
                    plan.highlight
                      ? 'bg-[#00C805] text-[#0e0d15] border-transparent shadow-[0_0_60px_rgba(0,200,5,0.2)] md:scale-105'
                      : 'glass-panel border-white/10 hover:border-[#00C805]/30'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0e0d15] text-[#00C805] text-xs font-black px-3 py-1 rounded-full border border-[#00C805]/40 whitespace-nowrap">
                      PHỔ BIẾN NHẤT
                    </div>
                  )}
                  <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-[#0e0d15]' : ''}`}>{plan.name}</h3>
                  <div className="mb-6">
                    <span className={`text-3xl font-black ${plan.highlight ? 'text-[#0e0d15]' : 'text-white'}`}>{plan.price}</span>
                    {plan.period && (
                      <span className={`text-sm ml-1 ${plan.highlight ? 'text-[#0e0d15]/70' : 'text-slate-500'}`}>{plan.period}</span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-[#0e0d15]' : 'text-[#00C805]'}`} />
                        <span className={plan.highlight ? 'text-[#0e0d15]' : 'text-slate-300'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`text-center py-3.5 rounded-xl font-bold text-sm transition-all ${
                      plan.highlight
                        ? 'bg-[#0e0d15] text-[#00C805] hover:bg-[#0e0d15]/90'
                        : 'border border-[#00C805] text-[#00C805] hover:bg-[#00C805]/10'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        {/* ── CTA Banner ── */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="relative rounded-3xl overflow-hidden glass-panel border border-[#00C805]/20 p-12 md:p-16">
              <div className="absolute inset-0 -z-10 bg-[#00C805]/4" />
              <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00C805]/10 blur-[100px] rounded-full -z-10 pointer-events-none" />
              <TrendingUp className="w-12 h-12 text-[#00C805] mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">
                Sẵn sàng làm chủ{' '}
                <span className="text-[#00C805]">thị trường?</span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto">
                Hàng nghìn nhà đầu tư đã tin dùng KF Stock để theo dõi danh mục và phân tích cổ phiếu mỗi ngày.
              </p>
              <Link
                href={ROUTES.LOGIN}
                className="inline-flex items-center gap-2 px-10 py-5 bg-[#00C805] text-[#0e0d15] font-extrabold text-lg rounded-xl hover:brightness-110 hover:scale-105 transition-all"
              >
                Bắt đầu ngay — Miễn phí <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#282832]/40 border-t border-white/5 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-[#00C805] w-7 h-7" />
                <span className="text-xl font-black tracking-tight">KF Stock</span>
              </div>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                Nền tảng phân tích chứng khoán thời gian thực. Được xây dựng bởi các nhà đầu tư, cho các nhà đầu tư Việt Nam.
              </p>
              <div className="flex gap-3 mt-6">
                {[Globe, Share2, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-[#00C805] hover:bg-[#00C805]/10 transition-all">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-5 text-white">Nền tảng</h4>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#features" className="hover:text-[#00C805] transition-colors">Tính năng</a></li>
                <li><a href="#modules" className="hover:text-[#00C805] transition-colors">Module</a></li>
                <li><a href="#pricing" className="hover:text-[#00C805] transition-colors">Bảng giá</a></li>
                <li><Link href={ROUTES.DASHBOARD} className="hover:text-[#00C805] transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-5 text-white">Công ty</h4>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-[#00C805] transition-colors">Giới thiệu</a></li>
                <li><a href="#" className="hover:text-[#00C805] transition-colors">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-[#00C805] transition-colors">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-[#00C805] transition-colors">Liên hệ</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-xs">© 2026 KF Stock. Đầu tư chứng khoán tiềm ẩn rủi ro đáng kể.</p>
            <p className="text-slate-600 text-xs">Dữ liệu mang tính tham khảo — không phải tư vấn đầu tư.</p>
          </div>
        </div>
      </footer>


    </div>
  );
}

