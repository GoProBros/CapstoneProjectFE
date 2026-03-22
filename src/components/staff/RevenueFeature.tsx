"use client";

import {
  TrendingUp,
  TrendingDown,
  Plus,
  Info,
  Edit2,
  Star,
  Check,
  X,
} from "lucide-react";

export default function RevenueFeature() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-headline mb-2">
            Quản lý doanh thu
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Phân tích dòng tiền, tăng trưởng lợi nhuận và cấu trúc các gói dịch
            vụ đăng ký dành cho khách hàng.
          </p>
        </div>
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
          <button className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold rounded-lg shadow-sm transition-all">
            Doanh thu
          </button>
          <button className="px-6 py-2.5 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-all">
            Gói đăng ký
          </button>
        </div>
      </div>

      <section className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl flex flex-col justify-between min-h-[160px] shadow-sm border border-slate-100 dark:border-slate-700">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Tổng doanh thu
              </p>
              <h3 className="text-2xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
                $1,284,500.00
              </h3>
            </div>
            <div className="flex items-center text-emerald-600 text-sm font-bold">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12.5%
              <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                so với tháng trước
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl flex flex-col justify-between min-h-[160px] shadow-sm border border-slate-100 dark:border-slate-700">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Doanh thu trung bình / User
              </p>
              <h3 className="text-2xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
                $42.15
              </h3>
            </div>
            <div className="flex items-center text-emerald-600 text-sm font-bold">
              <TrendingUp className="w-4 h-4 mr-1" />
              +4.2%
              <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                tăng trưởng hữu cơ
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl flex flex-col justify-between min-h-[160px] shadow-sm border border-slate-100 dark:border-slate-700">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Thu nhập định kỳ (MRR)
              </p>
              <h3 className="text-2xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
                $105,200.00
              </h3>
            </div>
            <div className="flex items-center text-red-600 text-sm font-bold">
              <TrendingDown className="w-4 h-4 mr-1" />
              -1.8%
              <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                tỷ lệ rời bỏ
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-lg font-bold font-headline text-slate-900 dark:text-slate-100">
                Biểu đồ doanh thu hàng tháng
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Thống kê chi tiết dòng tiền trong năm 2023
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200">
                PDF
              </button>
              <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200">
                CSV
              </button>
            </div>
          </div>
          <div className="h-64 flex items-end gap-3 px-4">
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t-sm h-[40%]"></div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t-sm h-[55%]"></div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t-sm h-[45%]"></div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t-sm h-[70%]"></div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t-sm h-[65%]"></div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t-sm h-[85%]"></div>
            <div className="flex-1 bg-slate-900 dark:bg-slate-100 rounded-t-sm h-[95%]"></div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t-sm h-[80%]"></div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t-sm h-[75%]"></div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t-sm h-[60%]"></div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t-sm h-[82%]"></div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t-sm h-[88%]"></div>
          </div>
          <div className="flex justify-between mt-4 px-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>
        </div>
      </section>

      <section className="mt-16 pt-16 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold font-headline text-slate-900 dark:text-slate-100">
              Gói đăng ký & Cấu hình
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Thiết kế và cập nhật các gói dịch vụ dành cho người dùng chuyên
              nghiệp.
            </p>
          </div>
          <button className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg">
            <Plus className="w-5 h-5" />
            Tạo gói đăng ký mới
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all cursor-pointer shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full uppercase tracking-tighter text-slate-700 dark:text-slate-200">
                Free
              </span>
              <Info className="w-5 h-5 text-slate-400" />
            </div>
            <h4 className="text-3xl font-black font-headline mb-4 text-slate-900 dark:text-slate-100">
              $0 <span className="text-sm font-normal text-slate-500">/mãi mãi</span>
            </h4>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-emerald-600 mr-2" />
                Dashboard cơ bản
              </li>
              <li className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-emerald-600 mr-2" />3 Báo cáo
                phân tích/tháng
              </li>
            </ul>
            <button className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-lg">
              Cấu hình
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border-2 border-slate-900 dark:border-slate-200 relative shadow-xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 text-[10px] px-4 py-1 rounded-full font-black uppercase tracking-widest">
              Phổ biến nhất
            </div>
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full uppercase tracking-tighter">
                Basic
              </span>
              <Edit2 className="w-5 h-5 text-slate-400" />
            </div>
            <h4 className="text-3xl font-black font-headline mb-4 text-slate-900 dark:text-slate-100">
              $29 <span className="text-sm font-normal text-slate-500">/tháng</span>
            </h4>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-sm text-slate-900 dark:text-slate-100">
                <Check className="w-5 h-5 text-emerald-600 mr-2" />Dashboard nâng
                cao
              </li>
              <li className="flex items-center text-sm text-slate-900 dark:text-slate-100">
                <Check className="w-5 h-5 text-emerald-600 mr-2" />Không giới hạn
                báo cáo
              </li>
              <li className="flex items-center text-sm text-slate-900 dark:text-slate-100">
                <Check className="w-5 h-5 text-emerald-600 mr-2" />Quản lý 5 danh
                mục đầu tư
              </li>
            </ul>
            <button className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-lg">
              Đang được chọn
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all cursor-pointer shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs font-bold px-3 py-1 bg-red-100 text-red-800 rounded-full uppercase tracking-tighter">
                Premium
              </span>
              <Star className="w-5 h-5 text-slate-400" />
            </div>
            <h4 className="text-3xl font-black font-headline mb-4 text-slate-900 dark:text-slate-100">
              $99 <span className="text-sm font-normal text-slate-500">/tháng</span>
            </h4>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-emerald-600 mr-2" />Trí tuệ nhân
                tạo (AI) dự báo
              </li>
              <li className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-emerald-600 mr-2" />API truy cập trực
                tiếp
              </li>
              <li className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <Check className="w-5 h-5 text-emerald-600 mr-2" />Hỗ trợ ưu tiên
                24/7
              </li>
            </ul>
            <button className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-lg">
              Cấu hình
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 bg-slate-100 dark:bg-slate-700 p-6 rounded-xl">
            <h5 className="font-bold font-headline mb-4 text-slate-900 dark:text-slate-100">
              Chi tiết gói: <span className="underline">Basic</span>
            </h5>
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Tổng người dùng đăng ký
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                  12,402
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Thời gian trung bình duy trì
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                  8.4 tháng
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Tỷ lệ chuyển đổi (Upsell)
                </p>
                <p className="text-xl font-black text-emerald-600">24.8%</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h5 className="text-xl font-bold font-headline mb-6 text-slate-900 dark:text-slate-100">
              Cập nhật cấu hình gói
            </h5>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Tên gói đăng ký
                  </label>
                  <input
                    type="text"
                    defaultValue="Basic Professional"
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-200 px-4 py-2.5 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Giá niêm yết ($)
                  </label>
                  <input
                    type="number"
                    defaultValue="29.00"
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-200 px-4 py-2.5 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Các phân hệ được phép truy cập (Allowed Modules)
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-md">
                    Dashboard <X className="w-3 h-3 cursor-pointer" />
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-md">
                    Báo cáo tài chính <X className="w-3 h-3 cursor-pointer" />
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-md">
                    Phân tích thị trường <X className="w-3 h-3 cursor-pointer" />
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-200 text-xs font-bold rounded-md border border-dashed border-slate-300 dark:border-slate-500 hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors cursor-pointer">
                    <Plus className="w-3 h-3" /> Thêm module
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-500">
                    <div className="w-4 h-4 rounded border-2 border-slate-900 dark:border-slate-100 flex items-center justify-center bg-slate-900 dark:bg-slate-100">
                      <Check className="w-3 h-3 text-white dark:text-slate-900" />
                    </div>
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      Dữ liệu thô (Real-time)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-500">
                    <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-400"></div>
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      Quản lý rủi ro AI
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-500">
                    <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-400"></div>
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      Tư vấn tự động
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-500">
                    <div className="w-4 h-4 rounded border-2 border-slate-900 dark:border-slate-100 flex items-center justify-center bg-slate-900 dark:bg-slate-100">
                      <Check className="w-3 h-3 text-white dark:text-slate-900" />
                    </div>
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      Báo cáo PDF nâng cao
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Hủy thay đổi
                </button>
                <button
                  type="button"
                  className="px-8 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-lg shadow-md hover:bg-slate-800 dark:hover:bg-slate-200"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
