"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";
import { getSubscriptions } from "@/services/subscriptionService";
import type { SubscriptionDto } from "@/types/subscription";

const MODULE_SHOWCASES = [
  {
    name: "Biểu đồ nhiệt",
    description:
      "Tổng quan thị trường theo sector và vốn hóa bằng biểu đồ nhiệt trực quan.",
    image: "/assets/Dashboard/ModulePreviews/heatmap.png",
    tag: "Phổ biến",
    tagColor: "bg-[#00C805] text-[#0e0d15]",
  },
  {
    name: "Bảng điện tử",
    description:
      "Lọc cổ phiếu theo sàn, ngành, loại và nhiều điều kiện kết hợp cùng lúc.",
    image: "/assets/Dashboard/ModulePreviews/stock-screener.png",
    tag: "Mới",
    tagColor: "bg-blue-500 text-white",
  },
  {
    name: "Biểu đồ chứng khoán Việt Nam",
    description:
      "Biểu đồ nến OHLCV tương tác với đầy đủ công cụ phân tích kỹ thuật.",
    image: "/assets/Dashboard/ModulePreviews/vn-stock-chart.png",
    tag: null,
    tagColor: "",
  },
  {
    name: "Báo cáo tài chính",
    description:
      "Phân tích doanh thu, lợi nhuận và các chỉ số tài chính theo quý/năm.",
    image: "/assets/Dashboard/ModulePreviews/financial-report.png",
    tag: null,
    tagColor: "",
  },
  {
    name: "Tin tức",
    description:
      "Tin tức thị trường và sự kiện doanh nghiệp cập nhật theo thời gian thực.",
    image: "/assets/Dashboard/ModulePreviews/news.png",
    tag: null,
    tagColor: "",
  },
  {
    name: "Bảng điện thông minh",
    description:
      "Theo dõi biến động trọng tâm theo chiến lược với bố cục thông minh và dữ liệu realtime.",
    image: "/assets/Dashboard/ModulePreviews/smart-stock-screener.png",
    tag: "Smart",
    tagColor: "bg-cyan-500 text-white",
  },
  {
    name: "Khớp lệnh realtime",
    description:
      "Quan sát dòng lệnh mua bán theo thời gian thực để nhận diện lực cung cầu tức thời.",
    image: "/assets/Dashboard/ModulePreviews/order-matching.png",
    tag: "Realtime",
    tagColor: "bg-amber-400 text-[#0e0d15]",
  },
  {
    name: "Trợ lý AI",
    description:
      "Nhận gợi ý phân tích nhanh theo ngữ cảnh thị trường và danh mục của bạn.",
    image: "/assets/Dashboard/ModulePreviews/AIAssistantModule.jpg",
    tag: "AI",
    tagColor: "bg-violet-500 text-white",
  },
  {
    name: "Báo cáo phân tích",
    description:
      "Tổng hợp báo cáo từ các công ty chứng khoán và chuyên gia phân tích.",
    image: "/assets/Dashboard/ModulePreviews/analysis-report.png",
    tag: null,
    tagColor: "",
  },
];

const STATS = [
  { value: "10+", label: "Module chuyên biệt", icon: LayoutDashboard },
  { value: "1.700+", label: "Mã chứng khoán", icon: BarChart2 },
  { value: "<1s", label: "Độ trễ dữ liệu", icon: Zap },
  { value: "24/7", label: "Giám sát thị trường", icon: Clock },
];

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Bố cục kéo-thả",
    desc: "Tự do sắp xếp module chuyên biệt. Lưu nhiều workspace và thay đổi theo chiến lược giao dịch.",
    iconColor: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    icon: Zap,
    title: "Dữ liệu thời gian thực",
    desc: "Nhận giá cổ phiếu, khớp lệnh và chỉ số thị trường với độ trễ tối đa.",
    iconColor: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
  },
  {
    icon: BarChart2,
    title: "Phân tích toàn diện",
    desc: "Từ heatmap ngành, bảng điện đến báo cáo tài chính và tư vấn FA/TA — đủ cho mọi phong cách đầu tư.",
    iconColor: "text-[#00C805]",
    bgColor: "bg-[#00C805]/10",
  },
  {
    icon: Shield,
    title: "An tâm sử dụng",
    desc: "Thông tin tài khoản và dữ liệu cá nhân được bảo vệ ổn định để bạn tập trung theo dõi thị trường.",
    iconColor: "text-purple-400",
    bgColor: "bg-purple-400/10",
  },
];

const MODULE_NAME_MAP: Record<string, string> = {
  "stock-screener": "Bảng điện tử",
  "vn-stock-chart": "Biểu đồ Việt Nam",
  heatmap: "Biểu đồ nhiệt",
  news: "Tin tức",
  "analysis-report": "Báo cáo phân tích",
  "financial-report": "Báo cáo tài chính",
  "order-matching": "Khớp lệnh",
  "smart-board": "Bảng điện thông minh",
  "ai-chat": "Trợ lý AI",
  "fa-advisor": "FA Advisor",
  "ta-advisor": "TA Advisor",
};

const WEBSITE_EMAIL = "greendragon.trading.team@gmail.com";

function isSubscriptionActive(flag: SubscriptionDto["isActive"]): boolean {
  if (typeof flag === "boolean") return flag;
  if (typeof flag === "number") return flag === 1;
  return true;
}

function parseAllowedModules(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        );
      }
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function formatPlanPrice(price: number): string {
  if (price <= 0) return "0đ";
  return `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
}

function formatPlanPeriod(days: number): string {
  if (days === 30) return "/tháng";
  if (days === 365) return "/năm";
  return `/${days} ngày`;
}

function humanizeModuleName(moduleName: string): string {
  return MODULE_NAME_MAP[moduleName] ?? moduleName;
}

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(
    null,
  );

  const loopedModules = [...MODULE_SHOWCASES, ...MODULE_SHOWCASES];
  const activePlans = subscriptions
    .filter((plan) => isSubscriptionActive(plan.isActive))
    .sort((left, right) => left.levelOrder - right.levelOrder);
  const pricingColumns = isLoadingSubscriptions
    ? 3
    : Math.max(activePlans.length, 1);
  const pricingGridStyle = {
    ["--plan-cols" as string]: pricingColumns,
  } as React.CSSProperties;

  const copyToClipboard = async (value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const handleCopyWebsiteLink = async (): Promise<void> => {
    const websiteLink = `${window.location.origin}${ROUTES.HOME}`;
    await copyToClipboard(websiteLink);
  };

  const handleCopyWebsiteEmail = async (): Promise<void> => {
    await copyToClipboard(WEBSITE_EMAIL);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchSubscriptions = async () => {
      setIsLoadingSubscriptions(true);
      setSubscriptionError(null);

      try {
        const data = await getSubscriptions();
        if (!mounted) return;
        setSubscriptions(data);
      } catch {
        if (!mounted) return;
        setSubscriptionError(
          "Không thể tải danh sách gói đăng ký lúc này. Vui lòng thử lại sau.",
        );
      } finally {
        if (mounted) {
          setIsLoadingSubscriptions(false);
        }
      }
    };

    fetchSubscriptions();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-[#0e0d15] text-slate-100 selection:bg-[#00C805]/30"
      style={{ fontFamily: "Quicksand, sans-serif" }}
    >
      {/* ── Header ── */}
      <header
        className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
          scrolled
            ? "border-white/10 bg-[#0e0d15]/95 backdrop-blur-xl shadow-2xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={ROUTES.HOME} className="flex items-center gap-2 group">
            <Image
              src="/assets/Logo/KF Stock_Logo_L_T.png"
              alt="KF Stock Logo"
              width={160}
              height={40}
              className="w-40 h-10"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: "#features", label: "Tính năng" },
              { href: "#modules", label: "Module" },
              { href: "#pricing", label: "Bảng giá" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-slate-400 hover:text-[#00C805] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-400">
                  Xin chào,{" "}
                  <span className="text-white font-semibold">
                    {user?.fullName ?? user?.email}
                  </span>
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
                <Link
                  href={ROUTES.LOGIN}
                  className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href={ROUTES.DASHBOARD}
                  className="bg-[#00C805] text-[#0e0d15] font-bold text-sm px-5 py-2 rounded-lg hover:brightness-110 transition-all"
                >
                  Dùng thử miễn phí
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0e0d15] border-t border-white/10 px-4 py-6 flex flex-col gap-5">
            <a
              href="#features"
              className="text-sm font-semibold text-slate-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tính năng
            </a>
            <a
              href="#modules"
              className="text-sm font-semibold text-slate-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              Module
            </a>
            <a
              href="#pricing"
              className="text-sm font-semibold text-slate-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              Bảng giá
            </a>
            <hr className="border-white/10" />
            <Link
              href={ROUTES.LOGIN}
              className="text-sm font-semibold text-slate-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              Đăng nhập
            </Link>
            <Link
              href={ROUTES.DASHBOARD}
              className="bg-[#00C805] text-[#0e0d15] font-bold text-sm px-5 py-3 rounded-lg text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dùng thử miễn phí
            </Link>
          </div>
        )}
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="px-3 pt-3 md:px-4 md:pt-4">
          <div className="relative w-full overflow-hidden rounded-[28px] bg-[#0A192F] pt-24 pb-20 md:pt-36 md:pb-28">
            <div className="pointer-events-none absolute inset-0 -z-20 bg-[#0A192F]" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,rgba(0,200,5,0.22),transparent_42%),radial-gradient(circle_at_88%_15%,rgba(59,130,246,0.18),transparent_38%),linear-gradient(135deg,rgba(10,25,47,1)_0%,rgba(14,34,63,0.96)_45%,rgba(10,25,47,1)_100%)]" />
            <div className="absolute inset-0 -z-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#00C805]/7 blur-[150px] rounded-full" />
              <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full" />
              <div className="absolute top-[20%] left-[-10%] w-[300px] h-[300px] bg-purple-500/4 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto px-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00C805]/10 border border-[#00C805]/25 text-[#00C805] text-xs font-bold mb-8 uppercase tracking-widest">
                <Zap className="w-3.5 h-3.5" /> Dữ liệu thị trường thời gian
                thực
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.05]">
                Không gian làm việc{" "}
                <span className="text-[#00C805]">thông minh</span>
                <br />
                cho nhà đầu tư chứng khoán
              </h1>

              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Kéo - thả 10+ module phân tích chuyên biệt vào bảng điều khiển
                của bạn. Dữ liệu thời gian thực, heatmap ngành, screener và hơn
                thế nữa — trong một không gian duy nhất.
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
                  <div
                    key={stat.label}
                    className="glass-panel rounded-xl p-4 flex flex-col items-center gap-1 border border-white/5 hover:border-[#00C805]/20 transition-colors"
                  >
                    <stat.icon className="w-5 h-5 text-[#00C805] mb-1" />
                    <p className="text-2xl font-black text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-500 text-center leading-tight">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Dashboard Preview ── */}
        {/* <section className="py-8 md:py-12">
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
        </section> */}

        {/* ── Features ── */}
        <section className="px-3 py-3 md:px-4" id="features">
          <div className="w-full rounded-[28px] border border-white/5 bg-[#0e0d15] py-24">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Mọi công cụ bạn cần{" "}
                  <span className="text-[#00C805]">trong một nơi</span>
                </h2>
                <p className="text-slate-400 max-w-xl mx-auto">
                  Không cần mở nhiều tab hay chuyển đổi ứng dụng. Toàn bộ dữ
                  liệu và phân tích trong một bảng điều khiển.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="group mx-auto w-full max-w-[250px] min-h-[300px] aspect-[5/7] [perspective:1200px]"
                  >
                    <div className="relative h-full w-full rounded-2xl transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                      <div className="absolute inset-0 rounded-2xl glass-panel border border-white/8 p-7 [backface-visibility:hidden]">
                        <div
                          className={`w-12 h-12 rounded-xl ${f.bgColor} flex items-center justify-center mb-5`}
                        >
                          <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">
                          {f.title}
                        </h3>
                      </div>
                      <div className="absolute inset-0 rounded-2xl border border-[#00C805]/35 bg-gradient-to-br from-[#00C805]/20 via-[#00C805]/10 to-[#0e0d15] p-7 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                          <f.icon className="h-5 w-5 text-[#9BFFA3]" />
                        </div>
                        <h3 className="text-lg font-extrabold mb-3 text-white">
                          {f.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-100/90">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Module Showcase ── */}
        <section className="px-3 py-3 md:px-4" id="modules">
          <div className="w-full rounded-[28px] border border-white/5 bg-[#0A192F] py-24">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Đa dạng module{" "}
                  <span className="text-[#00C805]">chuyên biệt</span>
                </h2>
                <p className="text-slate-400 max-w-xl mx-auto">
                  Mỗi module được thiết kế tối ưu cho một nhiệm vụ. Chọn những
                  gì bạn cần, bỏ những gì không dùng.
                </p>
              </div>

              <div className="relative overflow-hidden">
                <div className="module-marquee-track flex w-max gap-6 pr-6 hover:[animation-play-state:paused]">
                  {loopedModules.map((mod, index) => (
                    <div
                      key={`${mod.name}-${index}`}
                      className="group relative w-[300px] sm:w-[340px] shrink-0 rounded-2xl overflow-hidden border border-white/8 hover:border-[#00C805]/30 transition-all duration-300 bg-[#1a1a1a] cursor-pointer"
                    >
                      {mod.tag && (
                        <div
                          className={`absolute top-3 right-3 z-10 px-2.5 py-0.5 rounded-full text-xs font-bold ${mod.tagColor}`}
                        >
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
                        <h3 className="font-bold text-base mb-1.5">
                          {mod.name}
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-[#282832] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#282832] to-transparent" />
              </div>

              <div className="text-center mt-10">
                <Link
                  href={ROUTES.LOGIN}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#00C805] text-[#0e0d15] font-extrabold rounded-xl hover:brightness-110 transition-all"
                >
                  Khám phá thêm module khác <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="px-3 py-3 md:px-4">
          <div className="w-full rounded-[28px] border border-white/5 bg-[#0e0d15] py-24">
            <div className="max-w-5xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Bắt đầu <span className="text-[#00C805]">trong 3 bước</span>
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-10">
                {[
                  {
                    step: 1,
                    icon: Users,
                    title: "Tạo tài khoản",
                    desc: "Đăng ký miễn phí trong 30 giây. Không cần thẻ tín dụng.",
                  },
                  {
                    step: 2,
                    icon: LayoutDashboard,
                    title: "Thiết kế workspace",
                    desc: "Kéo thả module vào bảng điều khiển theo cách bạn giao dịch.",
                  },
                  {
                    step: 3,
                    icon: Activity,
                    title: "Phân tích thị trường",
                    desc: "Theo dõi danh mục, phân tích kỹ thuật và đưa ra quyết định nhanh hơn.",
                  },
                ].map((s) => (
                  <div
                    key={s.step}
                    className="flex flex-col items-center text-center gap-4"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-[#282832] border border-white/10 flex items-center justify-center">
                        <s.icon className="w-8 h-8 text-[#00C805]" />
                      </div>
                      <div className="absolute -top-2 -left-2 w-7 h-7 bg-[#00C805] rounded-full flex items-center justify-center text-[#0e0d15] text-xs font-black">
                        {s.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold">{s.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="px-3 py-3 md:px-4" id="pricing">
          <div className="w-full rounded-[28px] border border-white/5 bg-[#0A192F] py-24">
            <div className="max-w-5xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Giá dịch vụ hợp lý
                </h2>
                <p className="text-slate-400">
                  Chọn gói phù hợp với nhu cầu đầu tư của bạn. Linh hoạt với
                  từng nhu cầu.
                </p>
              </div>

              {isLoadingSubscriptions && (
                <div
                  className="pricing-dynamic-grid gap-6 items-start"
                  style={pricingGridStyle}
                >
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 p-8 glass-panel animate-pulse"
                    >
                      <div className="h-6 w-32 rounded bg-white/10 mb-4" />
                      <div className="h-10 w-40 rounded bg-white/10 mb-8" />
                      <div className="space-y-3">
                        <div className="h-4 rounded bg-white/10" />
                        <div className="h-4 rounded bg-white/10" />
                        <div className="h-4 rounded bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoadingSubscriptions && subscriptionError && (
                <div className="mx-auto max-w-2xl rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-center text-sm text-red-200">
                  {subscriptionError}
                </div>
              )}

              {!isLoadingSubscriptions &&
                !subscriptionError &&
                activePlans.length === 0 && (
                  <div className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm text-slate-300">
                    Hiện chưa có gói đăng ký khả dụng.
                  </div>
                )}

              {!isLoadingSubscriptions &&
                !subscriptionError &&
                activePlans.length > 0 && (
                  <div
                    className="pricing-dynamic-grid gap-6 items-start"
                    style={pricingGridStyle}
                  >
                    {activePlans.map((plan) => {
                      const allowedModules = parseAllowedModules(
                        plan.allowedModules,
                      )
                        .map(humanizeModuleName)
                        .slice(0, 4);
                      const planFeatures = [
                        `${plan.maxWorkspaces} workspace`,
                        ...allowedModules.map(
                          (moduleName) => `Truy cập ${moduleName}`,
                        ),
                      ];

                      if (allowedModules.length === 0) {
                        planFeatures.push(
                          "Truy cập module theo cấu hình hệ thống",
                        );
                      }

                      const visiblePlanFeatures = planFeatures.slice(0, 3);

                      return (
                        <div
                          key={plan.id}
                          className="relative flex h-[430px] flex-col overflow-hidden rounded-2xl border border-white/10 p-8 glass-panel transition-all duration-300 hover:border-[#00C805]/30"
                        >
                          <h3 className="mb-2 text-xl font-bold text-white">
                            {plan.name}
                          </h3>
                          <div className="mb-6">
                            <span className="text-3xl font-black text-white">
                              {formatPlanPrice(plan.price)}
                            </span>
                            <span className="ml-1 text-sm text-slate-500">
                              {formatPlanPeriod(plan.durationInDays)}
                            </span>
                          </div>

                          <ul className="mb-8 flex-grow space-y-3 overflow-hidden">
                            {visiblePlanFeatures.map((feature) => (
                              <li
                                key={feature}
                                className="flex items-center gap-2.5 text-sm"
                              >
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00C805]" />
                                <span className="text-slate-300">
                                  {feature}
                                </span>
                              </li>
                            ))}
                          </ul>

                          <Link
                            href={
                              isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN
                            }
                            className="rounded-xl border border-[#00C805] py-3.5 text-center text-sm font-bold text-[#00C805] transition-all hover:bg-[#00C805]/10"
                          >
                            {plan.price > 0
                              ? "Đăng ký ngay"
                              : "Bắt đầu miễn phí"}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#282832]/40 border-t border-white/5 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-3">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-[#00C805] w-7 h-7" />
                <span className="text-xl font-black tracking-tight">
                  KF Stock
                </span>
              </div>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                Nền tảng phân tích chứng khoán thời gian thực. Được xây dựng bởi
                các nhà đầu tư, cho các nhà đầu tư Việt Nam.
              </p>
              <div className="flex gap-3 mt-6">
                <Link
                  href={ROUTES.HOME}
                  aria-label="Về trang chủ"
                  className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-[#00C805] hover:bg-[#00C805]/10 transition-all"
                >
                  <Globe className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  aria-label="Sao chép liên kết website"
                  onClick={handleCopyWebsiteLink}
                  className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-[#00C805] hover:bg-[#00C805]/10 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Sao chép email liên hệ"
                  onClick={handleCopyWebsiteEmail}
                  className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-[#00C805] hover:bg-[#00C805]/10 transition-all"
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-5 text-white">Nền tảng</h4>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li>
                  <a
                    href="#features"
                    className="hover:text-[#00C805] transition-colors"
                  >
                    Tính năng
                  </a>
                </li>
                <li>
                  <a
                    href="#modules"
                    className="hover:text-[#00C805] transition-colors"
                  >
                    Module
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-[#00C805] transition-colors"
                  >
                    Bảng giá
                  </a>
                </li>
                <li>
                  <Link
                    href={ROUTES.DASHBOARD}
                    className="hover:text-[#00C805] transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            {/* <div>
              <h4 className="font-bold text-sm mb-5 text-white">Công ty</h4>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-[#00C805] transition-colors">Giới thiệu</a></li>
                <li><a href="#" className="hover:text-[#00C805] transition-colors">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-[#00C805] transition-colors">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-[#00C805] transition-colors">Liên hệ</a></li>
              </ul>
            </div> */}
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-xs">
              © 2026 KF Stock. Đầu tư chứng khoán tiềm ẩn rủi ro đáng kể.
            </p>
            <p className="text-slate-600 text-xs">
              Dữ liệu mang tính tham khảo — không phải tư vấn đầu tư.
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes moduleMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .module-marquee-track {
          animation: moduleMarquee 42s linear infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .module-marquee-track {
            animation: none;
          }
        }

        .pricing-dynamic-grid {
          display: grid;
          grid-template-columns: 1fr;
        }

        @media (min-width: 768px) {
          .pricing-dynamic-grid {
            grid-template-columns: repeat(var(--plan-cols, 3), minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
