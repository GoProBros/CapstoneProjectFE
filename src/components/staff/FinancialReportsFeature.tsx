'use client';

export default function FinancialReportsFeature() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-headline mb-2">
                        Quản lý Báo Cáo Tài Chính
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                        Quản lý và kiểm duyệt các báo cáo tài chính doanh nghiệp
                    </p>
                </div>
                <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm Báo Cáo
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số báo cáo</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">---</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Đang chờ duyệt</p>
                    <p className="text-2xl font-bold text-orange-500 mt-1">---</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Đã xuất bản</p>
                    <p className="text-2xl font-bold text-green-500 mt-1">---</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm mã cổ phiếu..."
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>Loại báo cáo</option>
                        <option>BCTC Quý</option>
                        <option>BCTC Năm</option>
                    </select>
                    <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>Trạng thái</option>
                        <option>Chờ duyệt</option>
                        <option>Đã duyệt</option>
                        <option>Từ chối</option>
                    </select>
                    <input
                        type="date"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Reports List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    Đang chờ phát triển API
                </div>
            </div>
        </div>
    );
}
