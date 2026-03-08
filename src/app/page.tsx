'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  PlayCircle,
  Zap,
  LayoutDashboard,
  Activity,
  Star,
  CheckCircle2,
  XCircle,
  Globe,
  Share2,
  Mail,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 selection:bg-[#00C805]/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-[#00C805] w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">Kafi Stock</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-sm font-medium hover:text-[#00C805] transition-colors" href="#features">Tính năng</a>
            <a className="text-sm font-medium hover:text-[#00C805] transition-colors" href="#pricing">Bảng giá</a>
            <a className="text-sm font-medium hover:text-[#00C805] transition-colors" href="#testimonials">Đánh giá</a>
            <a className="text-sm font-medium hover:text-[#00C805] transition-colors" href="#">Tài nguyên</a>
          </nav>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-300 hidden sm:inline-block">
                  Xin chào, {user?.fullName ?? user?.email}
                </span>
                <button
                  onClick={() => logout()}
                  className="text-sm font-medium px-4 py-2 hover:text-[#00C805] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
                <Link
                  href="/dashboard"
                  className="bg-[#00C805] text-[#0a0a0a] font-bold text-sm px-5 py-2 rounded-lg hover:brightness-110 transition-all"
                >
                  Bảng điều khiển
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium px-4 py-2 hover:text-[#00C805] transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dashboard"
                  className="bg-[#00C805] text-[#0a0a0a] font-bold text-sm px-5 py-2 rounded-lg hover:brightness-110 transition-all"
                >
                  Dùng thử miễn phí
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00C805]/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#00C805]/5 blur-[100px] rounded-full"></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
              Làm chủ thị trường với không gian làm việc <span className="text-[#00C805]">tùy chỉnh</span> của bạn
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              Xây dựng bảng điều khiển giao dịch tối ưu với các module kéo-thả và luồng dữ liệu thời gian thực chuẩn chuyên nghiệp.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 bg-[#00C805] text-[#0a0a0a] font-bold text-lg rounded-xl hover:scale-105 transition-transform text-center"
              >
                Bắt đầu miễn phí
              </Link>
            </div>
          </div>
        </section>

        {/* Main Product Feature */}
        <section className="py-20 bg-slate-900/30" id="features">
          <div className="max-w-7xl mx-auto px-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <Image
                alt="Professional stock trading dashboard with multiple charts and widgets"
                className="w-full object-cover aspect-video"
                src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=2000&auto=format&fit=crop"
                width={2000}
                height={1125}
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/20 to-transparent flex items-end p-4 md:p-8">
                <div className="glass-panel p-6 rounded-xl max-w-lg">
                  <h3 className="text-2xl font-bold mb-2">Module kéo-thả</h3>
                  <p className="text-slate-300">Sắp xếp biểu đồ, sổ lệnh và nguồn tin tức đúng theo cách bạn giao dịch. Không gian của bạn, luật chơi của bạn.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Grid */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl glass-panel border border-slate-200/10 hover:border-[#00C805]/30 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-[#00C805]/20 flex items-center justify-center text-[#00C805] mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-4">Dữ liệu thời gian thực</h3>
                <p className="text-slate-400 leading-relaxed">
                  Độ trễ dưới một giây trên nguồn giá toàn cầu. Trải nghiệm tốc độ của các nhà giao dịch chuyên nghiệp mà không cần chi phí tổ chức.
                </p>
              </div>
              <div className="p-8 rounded-2xl glass-panel border border-slate-200/10 hover:border-[#00C805]/30 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-[#00C805]/20 flex items-center justify-center text-[#00C805] mb-6">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-4">Bố cục tùy chỉnh</h3>
                <p className="text-slate-400 leading-relaxed">
                  Lưu không giới hạn hồ sơ không gian làm việc. Chuyển đổi giữa giao dịch ngắn hạn, phân tích dài hạn và chiến lược quyền chọn chỉ bằng một cú nhấp.
                </p>
              </div>
              <div className="p-8 rounded-2xl glass-panel border border-slate-200/10 hover:border-[#00C805]/30 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-[#00C805]/20 flex items-center justify-center text-[#00C805] mb-6">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-4">Chỉ báo nâng cao</h3>
                <p className="text-slate-400 leading-relaxed">
                  Truy cập 150+ nghiên cứu kỹ thuật, nhận diện mẫu hình bằng AI và công cụ phân tích khối lượng chuẩn chuyên nghiệp.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24" id="pricing">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Bảng giá đơn giản, minh bạch</h2>
              <p className="text-slate-400">Chọn gói phù hợp với phong cách giao dịch của bạn.</p>
            </div>
            {/* chưa điều chỉnh nên ẩn */}
            <div className="grid md:grid-cols-2 gap-8"> 
              {/* Pro Plan */}
              {/* <div className="p-10 rounded-2xl glass-panel flex flex-col">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black">$29</span>
                  <span className="text-slate-500">/tháng</span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-[#00C805] w-5 h-5" />
                    <span>Không gian làm việc không giới hạn</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-[#00C805] w-5 h-5" />
                    <span>Dữ liệu cổ phiếu thời gian thực</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-[#00C805] w-5 h-5" />
                    <span>50+ chỉ báo kỹ thuật</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-500">
                    <XCircle className="w-5 h-5" />
                    <span>Cảnh báo AI nâng cao</span>
                  </li>
                </ul>
                <button className="w-full py-4 rounded-xl border border-[#00C805] text-[#00C805] font-bold hover:bg-[#00C805]/10 transition-colors cursor-pointer">
                  Chọn gói Pro
                </button>
              </div> */}

              {/* Elite Plan */}
              {/* <div className="p-10 rounded-2xl bg-[#00C805] text-[#0a0a0a] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-white/20 px-4 py-1 text-xs font-bold rounded-bl-lg">PHỔ BIẾN NHẤT</div>
                <h3 className="text-xl font-bold mb-2">Elite</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black">$79</span>
                  <span className="text-[#0a0a0a]/70">/tháng</span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-[#0a0a0a] w-5 h-5" />
                    <span className="font-bold">Tất cả tính năng gói Pro</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-[#0a0a0a] w-5 h-5" />
                    <span className="font-bold">Dữ liệu Phái sinh &amp; Crypto</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-[#0a0a0a] w-5 h-5" />
                    <span className="font-bold">Bộ lọc AI chuyên sâu</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="text-[#0a0a0a] w-5 h-5" />
                    <span className="font-bold">Truy cập API trực tiếp</span>
                  </li>
                </ul>
                <button className="w-full py-4 rounded-xl bg-[#0a0a0a] text-white font-bold hover:brightness-125 transition-all cursor-pointer">
                  Nâng cấp lên Elite
                </button>
              </div> */}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="text-[#00C805] w-8 h-8" />
                <span className="text-xl font-bold tracking-tight">Kafi Stock</span>
              </div>
              <p className="text-slate-500 max-w-sm">
                Nền tảng hỗ trợ theo dõi thị trường chứng khoán tối ưu. Được xây dựng bởi các nhà giao dịch, cho các nhà giao dịch.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Nền tảng</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a className="hover:text-[#00C805] transition-colors" href="#">Bảng giao dịch</a></li>
                <li><a className="hover:text-[#00C805] transition-colors" href="#">Ứng dụng di động</a></li>
                <li><a className="hover:text-[#00C805] transition-colors" href="#">Tài liệu Bên thứ 3</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Công ty</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a className="hover:text-[#00C805] transition-colors" href="#">Giới thiệu</a></li>
                <li><a className="hover:text-[#00C805] transition-colors" href="#">Tuyển dụng</a></li>
                <li><a className="hover:text-[#00C805] transition-colors" href="#">Chính sách bảo mật</a></li>
                <li><a className="hover:text-[#00C805] transition-colors" href="#">Điều khoản sử dụng</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-500 text-xs">
              © 2025 Kafi Stock. Đầu tư chứng khoán tiềm ẩn rủi ro đáng kể.
            </p>
            <div className="flex gap-6">
              <a className="text-slate-400 hover:text-[#00C805] transition-colors" href="#"><Globe className="w-5 h-5" /></a>
              <a className="text-slate-400 hover:text-[#00C805] transition-colors" href="#"><Share2 className="w-5 h-5" /></a>
              <a className="text-slate-400 hover:text-[#00C805] transition-colors" href="#"><Mail className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

