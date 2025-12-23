"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';

export default function TradingMapModule() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      <div 
        className="relative w-full h-full bg-[#282832] rounded-lg flex justify-center items-center overflow-hidden"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Border decoration - absolute positioned to cover entire container */}
        <span className="inline-flex justify-center items-center overflow-hidden absolute inset-0 aspect-[312/112]">
          <img 
            src="/assets/Dashboard/ModulePreviews/vien.svg" 
            alt="Image"
            className="inline-block object-cover w-full h-full"
          />
        </span>

        {/* Main content */}
        <div className="cursor-pointer p-4 relative z-10">
          <div className="text-center text-2xl font-semibold uppercase -mt-4 text-white mb-3">
            Daily Trading
          </div>
          <div className="text-xs text-gray-400 text-justify leading-relaxed max-w-md">
            Báo cáo sử dụng công nghệ AI để dự đoán chuyển động của giá trong 20 phiên tới, 
            kết hợp với thuật toán phân tích mẫu hình tự động
          </div>
        </div>
      </div>

      {/* Modal using Portal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-[#0a0a0a] max-w-7xl w-70% max-h-[90vh] overflow-auto custom-scrollbar rounded-3xl border border-accentGreen shadow-2xl shadow-accentGreen/20"
            onClick={(e) => e.stopPropagation()}
          >
            <TradingMapContent onClose={() => setIsModalOpen(false)} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function TradingMapContent({ onClose }: { onClose: () => void }) {
  const sectorData = [
    { sector: "Toàn thị trường", short: 43, medium: 38, long: 55, leaders: [{ code: "VIC", rs: 99 }, { code: "GEE", rs: 99 }, { code: "VJC", rs: 94 }, { code: "CII", rs: 92 }, { code: "DCL", rs: 90 }, { code: "MCH", rs: 89 }, { code: "ABB", rs: 89 }, { code: "VRE", rs: 89 }, { code: "VHM", rs: 86 }, { code: "MSR", rs: 86 }, { code: "LPB", rs: 85 }, { code: "ANV", rs: 85 }, { code: "HAH", rs: 83 }, { code: "HAG", rs: 81 }, { code: "MWG", rs: 77 }] },
    { sector: "Xây dựng và vật liệu xây dựng", short: 52, medium: 40, long: 60, leaders: [{ code: "L40", rs: 100 }, { code: "HID", rs: 99 }, { code: "C69", rs: 94 }, { code: "CII", rs: 92 }, { code: "CDC", rs: 91 }] },
    { sector: "Đầu tư bất động sản và dịch vụ", short: 42, medium: 20, long: 67, leaders: [{ code: "VIC", rs: 99 }, { code: "LSG", rs: 95 }, { code: "TAL", rs: 92 }, { code: "VRE", rs: 89 }, { code: "VHM", rs: 86 }] },
    { sector: "Vận tải, kho bãi", short: 40, medium: 42, long: 44, leaders: [{ code: "VVS", rs: 98 }, { code: "TOS", rs: 89 }, { code: "HAH", rs: 83 }, { code: "VSC", rs: 55 }, { code: "GMD", rs: 51 }] },
    { sector: "Sản xuất thực phẩm", short: 48, medium: 36, long: 58, leaders: [{ code: "MCH", rs: 89 }, { code: "ANV", rs: 85 }, { code: "SBT", rs: 84 }, { code: "HAG", rs: 81 }, { code: "VNM", rs: 69 }] },
    { sector: "Ga, nước và các tiện ích khác", short: 52, medium: 50, long: 62, leaders: [{ code: "BWE", rs: 57 }, { code: "GAS", rs: 43 }] },
    { sector: "Hóa chất", short: 46, medium: 44, long: 50, leaders: [{ code: "BMP", rs: 81 }, { code: "TRC", rs: 75 }, { code: "DDV", rs: 60 }, { code: "BFC", rs: 60 }, { code: "DRI", rs: 56 }] },
    { sector: "Điện", short: 29, medium: 42, long: 54, leaders: [{ code: "NT2", rs: 76 }, { code: "POW", rs: 61 }, { code: "REE", rs: 55 }, { code: "GEG", rs: 52 }, { code: "BGE", rs: 52 }] },
    { sector: "Dược phẩm và công nghệ sinh học", short: 48, medium: 40, long: 45, leaders: [{ code: "DCL", rs: 90 }] },
    { sector: "Đồ dùng cá nhân", short: 58, medium: 58, long: 64, leaders: [{ code: "MSH", rs: 69 }, { code: "PNJ", rs: 59 }, { code: "VGT", rs: 45 }, { code: "TNG", rs: 35 }, { code: "TCM", rs: 20 }] },
    { sector: "Công ty Chứng khoán", short: 11, medium: 3, long: 67, leaders: [{ code: "VIX", rs: 60 }, { code: "SHS", rs: 59 }, { code: "SSI", rs: 52 }, { code: "CTS", rs: 51 }, { code: "VND", rs: 49 }] },
    { sector: "Ngân hàng", short: 31, medium: 7, long: 97, leaders: [{ code: "KLB", rs: 88 }, { code: "LPB", rs: 85 }, { code: "HDB", rs: 71 }, { code: "SHB", rs: 71 }, { code: "CTG", rs: 65 }] },
    { sector: "Khai khoáng", short: 43, medium: 21, long: 29, leaders: [{ code: "MSR", rs: 86 }, { code: "KSV", rs: 39 }, { code: "KSB", rs: 38 }] },
    { sector: "Kim loại công nghiệp", short: 54, medium: 33, long: 58, leaders: [{ code: "SMC", rs: 82 }, { code: "HPG", rs: 53 }, { code: "NKG", rs: 42 }, { code: "VGS", rs: 36 }, { code: "HSG", rs: 22 }] },
    { sector: "Du lịch và giải trí", short: 54, medium: 38, long: 46, leaders: [{ code: "VJC", rs: 94 }, { code: "HVN", rs: 62 }, { code: "YEG", rs: 29 }] },
    { sector: "Bán lẻ chung", short: 43, medium: 43, long: 62, leaders: [{ code: "MWG", rs: 77 }, { code: "FRT", rs: 67 }, { code: "PET", rs: 67 }, { code: "DGW", rs: 61 }] },
    { sector: "Đồ uống", short: 39, medium: 39, long: 56, leaders: [{ code: "NAF", rs: 87 }, { code: "SAB", rs: 39 }] },
    { sector: "Hàng gia dụng", short: 56, medium: 33, long: 28, leaders: [{ code: "SHI", rs: 62 }, { code: "TLG", rs: 46 }, { code: "PAC", rs: 40 }] },
    { sector: "Cơ khí, chế tạo máy", short: 13, medium: 60, long: 53, leaders: [{ code: "HHS", rs: 61 }, { code: "VEA", rs: 49 }] },
    { sector: "Lâm nghiệp và giấy", short: 54, medium: 38, long: 62, leaders: [{ code: "HHP", rs: 83 }, { code: "DHC", rs: 72 }] },
    { sector: "Thiết bị điện, điện tử", short: 62, medium: 54, long: 85, leaders: [{ code: "GEE", rs: 99 }, { code: "GEX", rs: 67 }] },
    { sector: "Dịch vụ hỗ trợ, tư vấn, thiết kế", short: 38, medium: 38, long: 62, leaders: [{ code: "TV2", rs: 59 }] },
    { sector: "Truyền thông", short: 23, medium: 31, long: 46, leaders: [] },
    { sector: "Bảo hiểm phi nhân thọ", short: 27, medium: 45, long: 55, leaders: [{ code: "MIG", rs: 56 }, { code: "BMI", rs: 52 }] },
    { sector: "Công nghệ phần cứng và thiết bị", short: 22, medium: 67, long: 78, leaders: [] },
    { sector: "Thiết bị, dịch vụ và phân phối dầu khí", short: 38, medium: 50, long: 50, leaders: [{ code: "PVD", rs: 74 }, { code: "PVS", rs: 46 }, { code: "PVC", rs: 32 }] },
    { sector: "Ôtô và linh kiện ôtô", short: 38, medium: 50, long: 38, leaders: [{ code: "CSM", rs: 34 }, { code: "CTF", rs: 31 }, { code: "HAX", rs: 11 }] },
    { sector: "Thiết bị và dịch vụ y tế", short: 50, medium: 25, long: 63, leaders: [] },
    { sector: "Phần mềm và dịch vụ điện toán", short: 38, medium: 38, long: 50, leaders: [{ code: "ELC", rs: 37 }, { code: "FPT", rs: 26 }, { code: "CMG", rs: 24 }] },
    { sector: "Công nghiệp đa dụng", short: 60, medium: 0, long: 60, leaders: [] },
    { sector: "Tài chính tổng hợp", short: 20, medium: 20, long: 80, leaders: [{ code: "PVI", rs: 90 }, { code: "IPA", rs: 53 }, { code: "TVC", rs: 30 }, { code: "BCG", rs: 5 }] },
    { sector: "Sản xuất dầu khí", short: 25, medium: 50, long: 50, leaders: [{ code: "BSR", rs: 57 }, { code: "PLX", rs: 27 }, { code: "OIL", rs: 24 }] },
    { sector: "Năng lượng thay thế", short: 0, medium: 25, long: 50, leaders: [] },
    { sector: "Thuốc lá", short: 67, medium: 100, long: 100, leaders: [] },
    { sector: "Bán lẻ thực phẩm và dược phẩm", short: 67, medium: 0, long: 33, leaders: [] },
    { sector: "Viễn thông cố định", short: 33, medium: 67, long: 33, leaders: [{ code: "VGI", rs: 34 }] },
    { sector: "Hàng tiêu khiển", short: 50, medium: 100, long: 50, leaders: [] },
    { sector: "Bảo hiểm nhân thọ", short: 0, medium: 100, long: 100, leaders: [{ code: "BVH", rs: 45 }] },
  ];

  const stockAnalysis = [
    { code: "VNM", sector: "Sản xuất thực phẩm", uptrendRates: "[48%] - [36%] - [58%]", trend: "[Tăng mạnh] - [Tăng] - [Tăng]", rs: 69, rrg: "Suy yếu", pattern1: "", pattern2: "Tweezer Bottom", candlePattern: "Tweezer Bottom", bullBear: "3.51 lần", valuation: "68 (6.3%)", aiAnalysis: "(Uptrend) Dự báo T+20: 64 => 65 (1.56%)", aiTrend: "green", description: "Cổ phiếu đang trong xu hướng tăng tốt. Về thế nến, cổ phiếu xuất hiện Tweezer Bottom, một thế nến đảo chiều tăng với độ tin cậy trung bình , [QUAN TRỌNG: Xuất hiện mẫu hình Dragon Walk - một thế nến nổi tiếng, hiệu quả cao, thuộc trường phái Ichimoku]" },
    { code: "KDH", sector: "Đầu tư bất động sản và dịch vụ", uptrendRates: "[42%] - [20%] - [67%]", trend: "[Tăng yếu] - [Tăng] - [Tăng]", rs: 61, rrg: "Suy yếu", pattern1: "Expanding Triangle", pattern2: "", candlePattern: "", bullBear: "0.32 lần", valuation: "15.7 (-55.1%)", aiAnalysis: "(Sideway) Dự báo T+20: 35 => 36 (2.86%)", aiTrend: "yellow", description: "Cổ phiếu đang tạo mẫu hình tích lũy trong trend tăng, xuất hiện mẫu hình Expanding Triangle (mẫu hình tam giác mở rộng là một trong những mẫu hình cực kỳ khó đánh, thường có điểm phá vỡ giả. Khối lượng giao dịch có xu hướng gia tăng cùng với biên độ dao động giá. Nó thể hiện tình trạng thị trường mất kiểm soát và nhạy cảm một cách bất thường)" },
    { code: "TPB", sector: "Ngân hàng", uptrendRates: "[31%] - [7%] - [97%]", trend: "[Tăng yếu] - [Giảm] - [Tăng]", rs: 52, rrg: "Suy yếu", pattern1: "Symmetrical Triangle", pattern2: "", candlePattern: "", bullBear: "1.90 lần", valuation: "19 (9.8%)", aiAnalysis: "(Uptrend) Dự báo T+20: 17.3 => 19 (9.83%)", aiTrend: "green", description: "Cổ phiếu đang có sóng hồi trong downtrend, xuất hiện mẫu hình Symmetrical Triangle (mẫu hình giá tam giác cân báo hiệu sự tiếp diễn xu hướng hiện tại với xác xuất cao, được xác nhận khi có sự phá vỡ diễn ra, GIÁ MỤC TIÊU bằng chiều rộng (max) của mẫu hình, tính từ điểm phá vỡ). Về thế nến, cổ phiếu xuất hiện Hammer" },
  ];

  return (
    <div className="relative overflow-hidden flex items-center justify-center text-sm bg-transparent">
      <div className="bg-[#1a1a24] max-w-4xl w-full p-6 flex flex-col gap-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold z-10"
        >
          ×
        </button>

        {/* Header */}
        <div className="bg-[#282832] flex items-center p-6 border-4 border-[#34C85E] rounded-lg">
          <div className="flex-1 flex items-end gap-3">
            <h1 className="text-4xl font-bold text-white">
              TRADING <span className="text-[#34C85E] -ml-2">MAP</span>
            </h1>
            <p className="-mb-1.5 text-black bg-yellow-500 text-xs font-semibold px-1 py-0.5 rounded-md">
              ĐỊNH VỊ THỊ TRƯỜNG
            </p>
          </div>
          <span className="inline-flex justify-center items-center overflow-hidden w-14 h-14">
            <img src="/static/white.webp" className="inline-block object-cover w-full h-full" alt="Image" />
          </span>
        </div>

        {/* VNINDEX Chart */}
        <div className="p-6 bg-[#282832] rounded-lg">
          <span className="inline-flex justify-center items-center overflow-hidden">
            <img 
              src="https://trade.finsc.vn/ch_lib/VNINDEX.png?secrcodx=1764357032361" 
              className="inline-block object-cover w-full h-full cursor-pointer" 
              alt="VNINDEX Chart"
            />
          </span>
          <p className="text-gray-400 text-xs mt-2">Click vào hình để xem chi tiết phân tích kỹ thuật</p>
        </div>

        {/* Sector Table */}
        <table className="table-auto text-sm rounded-lg overflow-hidden bg-white/10 w-full">
          <thead>
            <tr className="text-xs text-left bg-[#34C85E]">
              <th className="px-1.5 py-1 w-60 text-black">Bảng Tỷ lệ cổ ngành uptrend</th>
              <th className="px-1.5 py-1 w-24 text-black">Ngắn hạn (%)</th>
              <th className="px-1.5 py-1 w-24 text-black">Trung hạn (%)</th>
              <th className="px-1.5 py-1 w-24 text-black">Dài hạn (%)</th>
              <th className="px-1.5 py-1 text-black">Top cổ phiếu Leader ngành: Mã (RS)</th>
            </tr>
          </thead>
          <tbody>
            {sectorData.map((row, index) => (
              <tr key={index} className="border-b border-gray-700">
                <td className="text-left px-1.5 py-1 text-gray-300">{row.sector}</td>
                <td className="text-left px-1.5 py-1">
                  <div className="relative w-full bg-gray-700 h-4 rounded-full overflow-hidden">
                    <div 
                      className="text-center h-4 leading-4 bg-[#34C85E] text-xs text-black font-semibold" 
                      style={{ width: `${row.short}%` }}
                    >
                      {row.short}
                    </div>
                  </div>
                </td>
                <td className="text-left px-1.5 py-1">
                  <div className="relative w-full bg-gray-700 h-4 rounded-full overflow-hidden">
                    <div 
                      className="text-center h-4 leading-4 bg-[#34C85E] text-xs text-black font-semibold" 
                      style={{ width: `${row.medium}%` }}
                    >
                      {row.medium}
                    </div>
                  </div>
                </td>
                <td className="text-left px-1.5 py-1">
                  <div className="relative w-full bg-gray-700 h-4 rounded-full overflow-hidden">
                    <div 
                      className="text-center h-4 leading-4 bg-[#34C85E] text-xs text-black font-semibold" 
                      style={{ width: `${row.long}%` }}
                    >
                      {row.long}
                    </div>
                  </div>
                </td>
                <td className="text-left px-1.5 py-1 text-gray-300">
                  <div>
                    {row.leaders.map((leader, i) => (
                      <span key={i}>
                        <b>{leader.code}</b> ({leader.rs}){i < row.leaders.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Stock Analysis Sections */}
        {stockAnalysis.map((stock, index) => (
          <div key={index} className="p-6 bg-[#282832] rounded-lg">
            <div className="mb-6">
              <div className="animate-pulse bg-gray-600/50 rounded-md h-48 w-full mb-2"></div>
              <p className="text-gray-400 text-xs">Click vào hình để xem chi tiết phân tích kỹ thuật</p>
            </div>
            
            <table className="table-auto text-sm rounded-lg overflow-hidden bg-white/10 w-full">
              <thead>
                <tr className="text-xs text-left bg-[#34C85E]">
                  <th className="px-1.5 py-1 w-80 text-black">Bảng tiêu chí đánh giá {stock.code}</th>
                  <th className="px-1.5 py-1 text-black">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="px-1.5 py-1 font-semibold text-gray-300">Nhóm ngành (ICB lv2)</td>
                  <td className="px-1.5 py-1 text-gray-300">{stock.sector}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="px-1.5 py-1 font-semibold text-gray-300">Tỷ lệ cổ ngành uptrend (ngắn, trung, dài hạn)</td>
                  <td className="px-1.5 py-1 text-gray-300">{stock.uptrendRates}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="px-1.5 py-1 font-semibold text-gray-300">Xu hướng (ngắn, trung, dài hạn)</td>
                  <td className="px-1.5 py-1 text-gray-300">{stock.trend}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="px-1.5 py-1 font-semibold text-gray-300">RS</td>
                  <td className="px-1.5 py-1 text-gray-300">{stock.rs}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="px-1.5 py-1 font-semibold text-gray-300">Chu kỳ RRG</td>
                  <td className="px-1.5 py-1 text-gray-300">{stock.rrg}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="px-1.5 py-1 font-semibold text-gray-300">Pattern 1</td>
                  <td className="px-1.5 py-1 text-gray-300">{stock.pattern1}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="px-1.5 py-1 font-semibold text-gray-300">Pattern 2</td>
                  <td className="px-1.5 py-1 text-gray-300">{stock.pattern2}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="px-1.5 py-1 font-semibold text-gray-300">Mẫu hình nến</td>
                  <td className="px-1.5 py-1 text-gray-300">{stock.candlePattern}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="px-1.5 py-1 font-semibold text-gray-300">Cán cân Bò/Gấu</td>
                  <td className="px-1.5 py-1 text-gray-300">{stock.bullBear}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="px-1.5 py-1 font-semibold text-gray-300">Định giá</td>
                  <td className="px-1.5 py-1 text-gray-300">{stock.valuation}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="px-1.5 py-1 font-semibold text-gray-300">AI phân tích</td>
                  <td className="px-1.5 py-1">
                    <span className={`text-${stock.aiTrend}-600`}>{stock.aiAnalysis}</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 text-gray-300">
              <p><b>Diễn giải:</b></p>
              <p className="text-sm mt-2">{stock.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
