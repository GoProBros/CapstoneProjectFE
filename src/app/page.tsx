"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  Zap,
  LayoutDashboard,
  Activity,
  Brain,
  Gauge,
  CheckCircle2,
  Globe,
  Share2,
  Mail,
  LogOut,
  ChevronRight,
  ArrowUpRight,
  Shield,
  BarChart2,
  Users,
  Clock,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";
import { getSubscriptions } from "@/services/admin/subscriptionService";
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

const AI_INSIGHTS = [
  {
    icon: Brain,
    title: "Phân tích tâm lý thị trường",
    desc: "Tổng hợp dữ liệu tin tức và biến động dòng tiền để nhận diện nhịp mua bán nổi bật.",
  },
  {
    icon: TrendingUp,
    title: "Dự phóng xu hướng ngắn hạn",
    desc: "Ước lượng xu hướng cho các khung quan trọng, giúp bạn phản ứng nhanh khi thị trường đảo chiều.",
  },
  {
    icon: Activity,
    title: "Cảnh báo bất thường realtime",
    desc: "Phát hiện khối lượng và biên độ tăng đột biến để không bỏ lỡ cơ hội giao dịch.",
  },
];

const HERO_MODULE_COLLAGE = [
  {
    src: "/assets/Dashboard/ModulePreviews/heatmap.png",
    alt: "Module biểu đồ nhiệt",
    className:
      "left-[-10%] top-[2%] z-[20] h-[150px] w-[240px] sm:h-[210px] sm:w-[330px]",
    rotate: "-11deg",
    driftRotate: "3.5deg",
    driftX: "10px",
    driftY: "-12px",
    driftDuration: "19s",
    driftDelay: "-0.8s",
    imageOpacity: 0.83,
    showOnMobile: true,
  },
  {
    src: "/assets/Dashboard/ModulePreviews/order-matching.png",
    alt: "Module khớp lệnh",
    className:
      "left-[20%] top-[7%] z-[35] h-[165px] w-[250px] sm:h-[220px] sm:w-[330px]",
    rotate: "7deg",
    driftRotate: "-2.8deg",
    driftX: "-9px",
    driftY: "-8px",
    driftDuration: "17s",
    driftDelay: "-2.2s",
    imageOpacity: 0.86,
  },
  {
    src: "/assets/Dashboard/ModulePreviews/vn-stock-chart.png",
    alt: "Module biểu đồ chứng khoán Việt Nam",
    className:
      "right-[-8%] top-[5%] z-[25] h-[175px] w-[275px] sm:h-[245px] sm:w-[360px]",
    rotate: "-6deg",
    driftRotate: "2.2deg",
    driftX: "8px",
    driftY: "-10px",
    driftDuration: "20s",
    driftDelay: "-1.3s",
    imageOpacity: 0.81,
    showOnMobile: true,
  },
  {
    src: "/assets/Dashboard/ModulePreviews/smart-stock-screener.png",
    alt: "Module bảng điện thông minh",
    className:
      "left-[-4%] bottom-[7%] z-[45] h-[180px] w-[275px] sm:h-[250px] sm:w-[360px]",
    rotate: "5deg",
    driftRotate: "-2.5deg",
    driftX: "-8px",
    driftY: "-11px",
    driftDuration: "18s",
    driftDelay: "-3.1s",
    imageOpacity: 0.87,
    showOnMobile: true,
  },
  {
    src: "/assets/Dashboard/ModulePreviews/analysis-report.png",
    alt: "Module báo cáo phân tích",
    className:
      "left-[25%] bottom-[4%] z-[30] h-[170px] w-[255px] sm:h-[220px] sm:w-[320px]",
    rotate: "-9deg",
    driftRotate: "2deg",
    driftX: "10px",
    driftY: "-9px",
    driftDuration: "16s",
    driftDelay: "-1.7s",
    imageOpacity: 0.84,
    showOnMobile: true,
  },
  {
    src: "/assets/Dashboard/ModulePreviews/financial-report-pro.png",
    alt: "Module báo cáo tài chính chuyên sâu",
    className:
      "right-[1%] bottom-[9%] z-[40] h-[185px] w-[275px] sm:h-[230px] sm:w-[340px]",
    rotate: "10deg",
    driftRotate: "-3deg",
    driftX: "-9px",
    driftY: "-10px",
    driftDuration: "22s",
    driftDelay: "-2.8s",
    imageOpacity: 0.86,
  },
  {
    src: "/assets/Dashboard/ModulePreviews/news.png",
    alt: "Module tin tức thị trường",
    className:
      "right-[22%] top-[35%] z-[28] h-[150px] w-[230px] sm:h-[190px] sm:w-[290px]",
    rotate: "-4deg",
    driftRotate: "1.9deg",
    driftX: "8px",
    driftY: "-7px",
    driftDuration: "15s",
    driftDelay: "-0.4s",
    imageOpacity: 0.79,
  },
  {
    src: "/assets/Dashboard/ModulePreviews/canslim.png",
    alt: "Module lọc cổ phiếu theo phương pháp CANSLIM",
    className:
      "left-[6%] top-[41%] z-[18] h-[140px] w-[210px] sm:h-[190px] sm:w-[280px]",
    rotate: "9deg",
    driftRotate: "-2.3deg",
    driftX: "-10px",
    driftY: "-8px",
    driftDuration: "21s",
    driftDelay: "-3.4s",
    imageOpacity: 0.78,
  },
  {
    src: "/assets/Dashboard/ModulePreviews/market-index.png",
    alt: "Module chỉ số thị trường",
    className:
      "right-[9%] top-[43%] z-[22] h-[145px] w-[220px] sm:h-[185px] sm:w-[275px]",
    rotate: "-10deg",
    driftRotate: "2.5deg",
    driftX: "9px",
    driftY: "-9px",
    driftDuration: "23s",
    driftDelay: "-1.1s",
    imageOpacity: 0.8,
    showOnMobile: true,
  },
  {
    src: "/assets/Dashboard/ModulePreviews/trading-map.png",
    alt: "Module bản đồ giao dịch",
    className:
      "left-[38%] top-[18%] z-[16] h-[130px] w-[200px] sm:h-[170px] sm:w-[255px]",
    rotate: "-13deg",
    driftRotate: "2.6deg",
    driftX: "-8px",
    driftY: "-12px",
    driftDuration: "24s",
    driftDelay: "-3.9s",
    imageOpacity: 0.74,
    showOnMobile: true,
  },
  {
    src: "/assets/Dashboard/ModulePreviews/fa-advisor.png",
    alt: "Module FA Advisor",
    className:
      "right-[34%] bottom-[2%] z-[17] h-[125px] w-[195px] sm:h-[165px] sm:w-[245px]",
    rotate: "12deg",
    driftRotate: "-2.1deg",
    driftX: "9px",
    driftY: "-11px",
    driftDuration: "20s",
    driftDelay: "-5.1s",
    imageOpacity: 0.73,
  },
  {
    src: "/assets/Dashboard/ModulePreviews/ta-advisor.png",
    alt: "Module TA Advisor",
    className:
      "left-[58%] top-[52%] z-[14] h-[130px] w-[205px] sm:h-[170px] sm:w-[260px]",
    rotate: "-12deg",
    driftRotate: "1.8deg",
    driftX: "-7px",
    driftY: "-10px",
    driftDuration: "26s",
    driftDelay: "-4.3s",
    imageOpacity: 0.7,
  },
  {
    src: "/assets/Dashboard/ModulePreviews/global-stock-chart.png",
    alt: "Module biểu đồ cổ phiếu toàn cầu",
    className:
      "right-[-9%] bottom-[30%] z-[12] h-[130px] w-[210px] sm:h-[170px] sm:w-[260px]",
    rotate: "14deg",
    driftRotate: "-2.2deg",
    driftX: "-10px",
    driftY: "-9px",
    driftDuration: "25s",
    driftDelay: "-5.8s",
    imageOpacity: 0.69,
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
  "ai-chat": "Trò chuyện",
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

function shuffleStringsWithSeed(items: string[], seed: number): string[] {
  const shuffled = [...items];
  let currentSeed = seed > 0 ? seed : 1;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    const randomRatio = currentSeed / 233280;
    const swapIndex = Math.floor(randomRatio * (index + 1));

    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
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
    const revealElements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12,
      },
    );

    revealElements.forEach((element, index) => {
      if (element.classList.contains("is-visible")) {
        return;
      }

      if (!element.style.getPropertyValue("--reveal-delay")) {
        element.style.setProperty("--reveal-delay", `${index * 45}ms`);
      }

      const rect = element.getBoundingClientRect();
      const isInViewport =
        rect.top <= window.innerHeight * 0.95 && rect.bottom >= 0;

      if (isInViewport) {
        element.classList.add("is-visible");
        return;
      }

      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isLoadingSubscriptions, subscriptionError, activePlans.length]);

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
      className="home-page min-h-screen bg-[#020617] text-slate-100 selection:bg-[#00C805]/30"
      style={{ fontFamily: "Quicksand, sans-serif" }}
    >
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_10%_20%,rgba(0,200,5,0.09),transparent_35%),radial-gradient(circle_at_90%_15%,rgba(56,189,248,0.12),transparent_30%),linear-gradient(180deg,#020617_0%,#020f24_45%,#020617_100%)]" />

      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-emerald-300/15 bg-slate-950/90 shadow-2xl shadow-emerald-900/20 backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 w-[90vw] max-w-[1900px] items-center justify-between px-4">
          <Link href={ROUTES.HOME} className="flex items-center gap-2 group">
            <Image
              src="/assets/Logo/KF Stock_Logo_L_T.png"
              alt="KF Stock Logo"
              width={160}
              height={40}
              className="h-10 w-40"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {[
              { href: "#features", label: "Tính năng" },
              { href: "#modules", label: "Module" },
              { href: "#pricing", label: "Bảng giá" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold tracking-wide text-slate-400 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-400">
                  Xin chào,{" "}
                  <span className="font-semibold text-white">
                    {user?.fullName ?? user?.email}
                  </span>
                </span>
                <button
                  onClick={() => logout()}
                  className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
                >
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </button>
                <Link
                  href={ROUTES.DASHBOARD}
                  className="rounded-lg bg-gradient-to-br from-[#00C805] to-emerald-300 px-5 py-2 text-sm font-bold text-[#04130b] transition-all hover:scale-[1.03]"
                >
                  Vào Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={ROUTES.LOGIN}
                  className="px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
                >
                  Đăng nhập
                </Link>
                <Link
                  href={ROUTES.DASHBOARD}
                  className="rounded-lg bg-gradient-to-br from-[#00C805] to-emerald-300 px-5 py-2 text-sm font-bold text-[#04130b] transition-all hover:scale-[1.03]"
                >
                  Dùng thử miễn phí
                </Link>
              </>
            )}
          </div>

          <button
            className="text-slate-300 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-slate-950/95 px-4 py-6 md:hidden">
            <div className="flex flex-col gap-4">
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
                className="rounded-lg bg-[#00C805] px-5 py-3 text-center text-sm font-bold text-[#03150a]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dùng thử miễn phí
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="overflow-hidden pt-20">
        {/* Hero Section */}
        <section className="relative h-[100vh] overflow-hidden px-4 pb-12 pt-12 md:pb-20 md:pt-16">
          <div className="absolute inset-0 -z-10 opacity-30">
            <div className="absolute inset-0 bg-[url('/assets/Dashboard/SidebarComponent/BlackHomePage.webp')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/50 via-[#020617]/80 to-[#020617]" />
          </div>

          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {HERO_MODULE_COLLAGE.map((item) => (
              <div
                key={item.src}
                className={`module-bg-card absolute overflow-hidden rounded-2xl border border-white/20 bg-slate-900/45 p-1 shadow-[0_18px_65px_rgba(2,6,23,0.5)] ${item.showOnMobile ? "block" : "hidden sm:block"} ${item.className}`}
                style={{
                  ["--start-rotate" as string]: item.rotate,
                  ["--drift-rotate" as string]: item.driftRotate,
                  ["--drift-x" as string]: item.driftX,
                  ["--drift-y" as string]: item.driftY,
                  ["--drift-duration" as string]: item.driftDuration,
                  ["--drift-delay" as string]: item.driftDelay,
                }}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={860}
                  height={520}
                  className="h-full w-full rounded-xl object-cover"
                  style={{ opacity: item.imageOpacity }}
                  unoptimized
                />
              </div>
            ))}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(16,185,129,0.2),transparent_34%),radial-gradient(circle_at_80%_72%,rgba(56,189,248,0.22),transparent_40%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/72 via-[#020617]/52 to-[#020617]/64" />
            <div
              className="absolute inset-0 backdrop-blur-[4px]"
              style={{
                background:
                  "radial-gradient(circle at 26% 44%, rgba(2,6,23,0.9) 0%, rgba(2,6,23,0.76) 34%, rgba(2,6,23,0.5) 57%, rgba(2,6,23,0.68) 100%)",
              }}
            />
          </div>

          <div className="relative z-10 mx-auto grid w-[90vw] max-w-[1900px] items-center gap-14 lg:grid-cols-2">
            <div
              data-reveal
              className="rounded-[2rem] border border-white/15 bg-slate-950/62 p-6 shadow-[0_26px_80px_rgba(2,6,23,0.52)] backdrop-blur-xl sm:p-8"
            >
              <div
                data-reveal
                style={{ ["--reveal-delay" as string]: "70ms" }}
                className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </span>
                Trạm theo dõi thời gian thực cho nhà đầu tư Việt Nam
              </div>

              <h1
                data-reveal
                style={{ ["--reveal-delay" as string]: "130ms" }}
                className="mb-6 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-7xl"
              >
                Hợp nhất mọi công cụ
                <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                  {" "}
                  phân tích chứng khoán
                </span>
              </h1>

              <p
                data-reveal
                style={{ ["--reveal-delay" as string]: "190ms" }}
                className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-300"
              >
                Không còn chuyển tab liên tục. Kéo thả module, theo dõi giá,
                khớp lệnh, biểu đồ kỹ thuật và báo cáo tài chính trong một không
                gian duy nhất.
              </p>

              <div
                data-reveal
                style={{ ["--reveal-delay" as string]: "250ms" }}
                className="mb-12 flex flex-wrap gap-4"
              >
                <Link
                  href={ROUTES.DASHBOARD}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#00C805] to-emerald-300 px-8 py-4 text-base font-extrabold text-[#04150b] transition-all hover:scale-[1.02]"
                >
                  Mở không gian giao dịch <ChevronRight className="h-5 w-5" />
                </Link>
                <a
                  href="#modules"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-base font-bold text-white transition-all hover:border-emerald-300/40"
                >
                  Xem module nổi bật <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {STATS.map((stat, index) => (
                  <div
                    key={stat.label}
                    data-reveal
                    style={{
                      ["--reveal-delay" as string]: `${300 + index * 70}ms`,
                    }}
                    className="soft-lift rounded-xl border border-white/15 bg-slate-950/78 p-4 backdrop-blur-md"
                  >
                    <stat.icon className="mb-2 h-5 w-5 text-emerald-300" />
                    <div className="text-2xl font-black text-white">
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block" />
          </div>
        </section>
        {/* Features Section */}
        <section
          className="border-y border-white/5 bg-slate-900/60 px-4 py-14 md:py-20"
          id="features"
        >
          <div className="mx-auto grid w-[90vw] max-w-[1900px] items-center gap-16 lg:grid-cols-2">
            <div data-reveal>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
                Execution Engine
              </h2>
              <h3 className="mb-6 text-3xl font-black leading-tight text-white md:text-5xl">
                Không gian theo dõi độ trễ thấp cho giao dịch Việt Nam
              </h3>
              <p className="mb-8 text-lg leading-relaxed text-slate-300">
                Bảng điều khiển được thiết kế như một trading floor cá nhân.
                Kéo-thả module, theo dõi ticker quan trọng và phản ứng ngay khi
                thị trường thay đổi.
              </p>
              <ul className="space-y-6">
                {FEATURES.map((feature, index) => (
                  <li
                    key={feature.title}
                    data-reveal
                    style={{
                      ["--reveal-delay" as string]: `${120 + index * 80}ms`,
                    }}
                    className="soft-lift flex items-start gap-4 rounded-xl border border-transparent p-2"
                  >
                    <div
                      className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${feature.bgColor}`}
                    >
                      <feature.icon
                        className={`h-5 w-5 ${feature.iconColor}`}
                      />
                    </div>
                    <div>
                      <h4 className="mb-1 text-lg font-bold text-white">
                        {feature.title}
                      </h4>
                      <p className="text-sm leading-relaxed text-slate-400">
                        {feature.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div data-reveal style={{ ["--reveal-delay" as string]: "220ms" }}>
              <div className="soft-lift relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-2 shadow-[0_0_60px_rgba(16,185,129,0.12)]">
                <Image
                  src="/assets/demo_homepage.gif"
                  alt="KF Stock Dashboard"
                  width={1600}
                  height={900}
                  className="h-auto w-full rounded-2xl opacity-90"
                  priority
                  unoptimized
                />
              </div>
            </div>
          </div>
        </section>
        {/* AI Insights Section */}
        <section className="relative bg-slate-950 px-4 py-14 md:py-20">
          <div className="pointer-events-none absolute right-[-8rem] top-[-6rem] h-[420px] w-[420px] rounded-full bg-cyan-300/10 blur-[120px]" />
          <div className="mx-auto w-[90vw] max-w-[1900px]">
            <div data-reveal className="mb-12 text-center">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
                AI Intelligence Lab
              </h2>
              <h3 className="mb-4 text-3xl font-black text-white md:text-5xl">
                Tín hiệu chủ động trước biến động thị trường
              </h3>
              <p className="mx-auto max-w-2xl text-lg text-slate-400">
                AI theo dõi dòng dữ liệu nhiều nguồn để phát hiện nhịp tăng tốc,
                tâm lý đám đông và các vùng rủi ro đáng chú ý.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {AI_INSIGHTS.map((item, index) => (
                <div
                  key={item.title}
                  data-reveal
                  style={{
                    ["--reveal-delay" as string]: `${80 + index * 90}ms`,
                  }}
                  className="soft-lift group rounded-3xl border border-white/10 bg-white/5 p-7 transition-all duration-500 hover:-translate-y-1 hover:border-emerald-300/40"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-300/10 transition-transform duration-500 group-hover:scale-110">
                    <item.icon className="h-6 w-6 text-emerald-300" />
                  </div>
                  <h4 className="mb-3 text-xl font-bold text-white">
                    {item.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Modules Section */}
        <section className="bg-slate-900/55 px-4 py-14 md:py-20" id="modules">
          <div className="mx-auto w-[90vw] max-w-[1900px]">
            <div data-reveal className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-black tracking-tight text-white md:text-5xl">
                Hệ module
                <span className="text-emerald-300"> chuyên sâu</span>
              </h2>
              <p className="mx-auto max-w-2xl text-slate-400">
                Tùy chọn module theo nhu cầu: từ heatmap, bảng điện, biểu đồ kỹ
                thuật đến báo cáo tài chính và trợ lý AI.
              </p>
            </div>

            <div className="relative overflow-hidden">
              <div className="module-marquee-track flex w-max gap-6 pr-6 md:hover:[animation-play-state:paused]">
                {loopedModules.map((mod, index) => (
                  <div
                    key={`${mod.name}-${index}`}
                    data-reveal
                    style={{
                      ["--reveal-delay" as string]: `${Math.min(index, 8) * 60}ms`,
                    }}
                    className="soft-lift group relative w-[300px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#081122] transition-all duration-300 hover:border-emerald-300/40"
                  >
                    {mod.tag && (
                      <div
                        className={`absolute right-3 top-3 z-10 rounded-full px-2.5 py-0.5 text-xs font-bold ${mod.tagColor}`}
                      >
                        {mod.tag}
                      </div>
                    )}
                    <div className="relative h-44 overflow-hidden bg-slate-950">
                      <Image
                        src={mod.image}
                        alt={mod.name}
                        fill
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#081122]" />
                    </div>
                    <div className="p-5">
                      <h3 className="mb-1.5 text-base font-bold text-white">
                        {mod.name}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-400">
                        {mod.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-900 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-900 to-transparent" />
            </div>
          </div>
        </section>
        {/* Pricing Section*/}
        <section
          className="border-y border-white/5 bg-[#030d1e] px-4 py-14 md:py-20"
          id="pricing"
        >
          <div className="mx-auto w-[90vw] max-w-[1800px]">
            <div data-reveal className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-black text-white md:text-5xl">
                Chọn gói phù hợp chiến lược của bạn
              </h2>
              <p className="text-slate-400">
                Tối ưu chi phí theo nhu cầu: từ trải nghiệm miễn phí đến bộ công
                cụ nâng cao cho nhà đầu tư chuyên sâu.
              </p>
            </div>

            {isLoadingSubscriptions && (
              <div
                className="pricing-dynamic-grid items-start gap-6"
                style={pricingGridStyle}
              >
                {[1, 2, 3].map((item, index) => (
                  <div
                    key={item}
                    data-reveal
                    style={{
                      ["--reveal-delay" as string]: `${80 + index * 80}ms`,
                    }}
                    className="soft-lift animate-pulse rounded-2xl border border-white/10 bg-slate-900/70 p-8"
                  >
                    <div className="mb-4 h-6 w-32 rounded bg-white/10" />
                    <div className="mb-8 h-10 w-40 rounded bg-white/10" />
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
                  className="pricing-dynamic-grid items-start gap-6"
                  style={pricingGridStyle}
                >
                  {activePlans.map((plan, index) => {
                    const randomizedAllowedModules = shuffleStringsWithSeed(
                      parseAllowedModules(plan.allowedModules).map(
                        humanizeModuleName,
                      ),
                      plan.id,
                    );

                    const maxFeatureRows = 4;
                    const maxModuleRows = maxFeatureRows - 1;
                    const shouldShowRemainingModules =
                      randomizedAllowedModules.length > maxModuleRows;
                    const visibleModuleCount = shouldShowRemainingModules
                      ? maxModuleRows - 1
                      : maxModuleRows;
                    const allowedModules = randomizedAllowedModules.slice(
                      0,
                      visibleModuleCount,
                    );
                    const hiddenModulesCount = Math.max(
                      randomizedAllowedModules.length - allowedModules.length,
                      0,
                    );

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

                    if (hiddenModulesCount > 0) {
                      planFeatures.push(
                        `cùng với ${hiddenModulesCount} module khác`,
                      );
                    }

                    const visiblePlanFeatures = planFeatures;

                    return (
                      <div
                        key={plan.id}
                        data-reveal
                        style={{
                          ["--reveal-delay" as string]: `${90 + index * 80}ms`,
                        }}
                        className="soft-lift group relative flex h-[430px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/35"
                      >
                        <div className="mb-3 inline-flex w-fit items-center rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                          Subscription
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-white">
                          {plan.name}
                        </h3>
                        <div className="mb-6">
                          <span className="text-3xl font-black text-white">
                            {formatPlanPrice(plan.price)}
                          </span>
                          <span className="ml-1 text-sm text-slate-400">
                            {formatPlanPeriod(plan.durationInDays)}
                          </span>
                        </div>

                        <ul className="mb-8 flex-grow space-y-3">
                          {visiblePlanFeatures.map((feature, featureIndex) => (
                            <li
                              key={`${plan.id}-${featureIndex}-${feature}`}
                              className="flex items-center gap-2.5 text-sm"
                            >
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                              <span className="text-slate-300">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Link
                          href={
                            isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN
                          }
                          className="rounded-xl bg-gradient-to-br from-emerald-300 to-[#00C805] py-3.5 text-center text-sm font-bold text-[#04150b] transition-all hover:brightness-105"
                        >
                          {plan.price > 0 ? "Đăng ký ngay" : "Bắt đầu miễn phí"}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </section>
        {/* How It Works Section */}
        <section className="bg-slate-950 px-4 py-14">
          <div
            data-reveal
            className="mx-auto grid w-[90vw] max-w-[1800px] gap-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:grid-cols-3"
          >
            <div className="md:col-span-2">
              <h3 className="mb-3 text-2xl font-black text-white md:text-3xl">
                Bắt đầu trong 3 bước đơn giản
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    step: 1,
                    icon: Users,
                    title: "Tạo tài khoản",
                    desc: "Đăng ký trong 30 giây.",
                  },
                  {
                    step: 2,
                    icon: LayoutDashboard,
                    title: "Thiết kế workspace",
                    desc: "Kéo thả module theo chiến lược.",
                  },
                  {
                    step: 3,
                    icon: Gauge,
                    title: "Theo dõi & hành động",
                    desc: "Nhận tín hiệu và ra quyết định nhanh.",
                  },
                ].map((item, index) => (
                  <div
                    key={item.step}
                    data-reveal
                    style={{
                      ["--reveal-delay" as string]: `${100 + index * 80}ms`,
                    }}
                    className="soft-lift rounded-xl border border-white/10 bg-slate-900/60 p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-300/15 text-xs font-black text-emerald-300">
                        {item.step}
                      </div>
                      <item.icon className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div className="mb-1 text-sm font-bold text-white">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-400">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              data-reveal
              style={{ ["--reveal-delay" as string]: "260ms" }}
              className="soft-lift rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-6"
            >
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                Sẵn sàng để tham gia phân tích chứng khoán?
              </div>
              <p className="mb-5 text-sm text-slate-200">
                Mở dashboard để trải nghiệm đầy đủ khả năng realtime và bộ công
                cụ phân tích chuyên biệt của KF Stock.
              </p>
              <Link
                href={ROUTES.DASHBOARD}
                className="inline-flex items-center gap-2 rounded-lg bg-[#00C805] px-4 py-2 text-sm font-bold text-[#04150b]"
              >
                Truy cập Dashboard <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto flex w-[90vw] max-w-[1900px] flex-col gap-10 px-4 py-14 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-emerald-300" />
              <span className="text-2xl font-black tracking-tight text-white">
                KF Stock
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              Nền tảng phân tích chứng khoán thời gian thực. Xây dựng cho nhà
              đầu tư Việt Nam cần tốc độ, rõ ràng và khả năng tùy biến cá nhân hóa cao.
            </p>
            <div className="mt-5 flex gap-3">
              <Link
                href={ROUTES.HOME}
                aria-label="Về trang chủ"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-colors hover:text-emerald-300"
              >
                <Globe className="h-4 w-4" />
              </Link>
              <button
                type="button"
                aria-label="Sao chép liên kết website"
                onClick={handleCopyWebsiteLink}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-colors hover:text-emerald-300"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Sao chép email liên hệ"
                onClick={handleCopyWebsiteEmail}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-colors hover:text-emerald-300"
              >
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold text-white">Nền tảng</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <a
                  href="#features"
                  className="transition-colors hover:text-emerald-300"
                >
                  Tinh năng
                </a>
              </li>
              <li>
                <a
                  href="#modules"
                  className="transition-colors hover:text-emerald-300"
                >
                  Module
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="transition-colors hover:text-emerald-300"
                >
                  Bảng giá
                </a>
              </li>
              <li>
                <Link
                  href={ROUTES.DASHBOARD}
                  className="transition-colors hover:text-emerald-300"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-sm text-slate-500 md:text-right">
            <p>© 2026 KF Stock. Đầu tư chứng khoán tiềm ẩn rủi ro đáng kể.</p>
            <p>Dữ liệu mang tính tham khảo, không phải tư vấn đầu tư.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
