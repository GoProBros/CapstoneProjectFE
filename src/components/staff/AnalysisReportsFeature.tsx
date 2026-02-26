'use client';

export default function AnalysisReportsFeature() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Quản Lí Báo Cáo Phân Tích
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Quản lý và kiểm duyệt các báo cáo phân tích thị trường
                    </p>
                </div>
                <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm Báo Cáo
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số báo cáo</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">---</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Chờ duyệt</p>
                    <p className="text-2xl font-bold text-orange-500 mt-1">---</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Đã xuất bản</p>
                    <p className="text-2xl font-bold text-green-500 mt-1">---</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lượt xem</p>
                    <p className="text-2xl font-bold text-blue-500 mt-1">---</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm báo cáo..."
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>Loại phân tích</option>
                        <option>Phân tích kỹ thuật</option>
                        <option>Phân tích cơ bản</option>
                        <option>Nhận định thị trường</option>
                    </select>
                    <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>Trạng thái</option>
                        <option>Chờ duyệt</option>
                        <option>Đã duyệt</option>
                        <option>Từ chối</option>
                    </select>
                    <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>Nguồn</option>
                        <option>Nội bộ</option>
                        <option>Bên thứ 3</option>
                    </select>
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
