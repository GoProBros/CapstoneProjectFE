"use client";

import React, { useState } from 'react';
import { ReportViewer } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

export default function AnalysisReportModule() {
  const { theme } = useTheme();
  const [selectedReport, setSelectedReport] = useState<{
    code: string;
    date: string;
    content: string;
  } | null>(null);

  // Sample data for demonstration
  const reports = [
    { code: 'VNM', date: '29/11/2025', content: 'Báo cáo phân tích kết quả kinh doanh Q3/2025 cho thấy tăng trưởng ổn định' },
    { code: 'VIC', date: '28/11/2025', content: 'Phân tích xu hướng thị trường bất động sản và định hướng chiến lược' },
    { code: 'HPG', date: '27/11/2025', content: 'Đánh giá tác động của giá nguyên liệu đến biên lợi nhuận' },
    { code: 'VHM', date: '26/11/2025', content: 'Cập nhật tiến độ các dự án và kế hoạch bàn giao trong quý 4' },
    { code: 'FPT', date: '25/11/2025', content: 'Phân tích mảng công nghệ và triển vọng AI trong năm 2026' },
    { code: 'MSN', date: '24/11/2025', content: 'Báo cáo tổng quan về hoạt động kinh doanh đa ngành' },
    { code: 'TCB', date: '23/11/2025', content: 'Phân tích chất lượng tài sản và khả năng sinh lời' },
    { code: 'VPB', date: '22/11/2025', content: 'Đánh giá kết quả tăng trưởng tín dụng và huy động vốn' },
    { code: 'GAS', date: '21/11/2025', content: 'Báo cáo phân tích tác động của giá dầu thế giới đến hoạt động kinh doanh' },
    { code: 'MWG', date: '20/11/2025', content: 'Đánh giá chiến lược mở rộng chuỗi bán lẻ và kế hoạch chuyển đổi số' },
    { code: 'BID', date: '19/11/2025', content: 'Phân tích hiệu quả hoạt động và chất lượng danh mục cho vay' },
    { code: 'CTG', date: '18/11/2025', content: 'Báo cáo tổng quan về tăng trưởng tín dụng và an toàn vốn' },
    { code: 'PLX', date: '17/11/2025', content: 'Phân tích biến động giá xăng dầu và chiến lược kinh doanh quý 4' },
    { code: 'VRE', date: '16/11/2025', content: 'Đánh giá danh mục BĐS cho thuê và kế hoạch phát triển mới' },
    { code: 'SAB', date: '15/11/2025', content: 'Báo cáo phân tích thị phần và xu hướng tiêu dùng bia' },
    { code: 'POW', date: '14/11/2025', content: 'Cập nhật tiến độ các dự án điện và kế hoạch đầu tư năng lượng tái tạo' },
    { code: 'GMD', date: '13/11/2025', content: 'Phân tích kết quả kinh doanh may mặc và đơn hàng xuất khẩu' },
    { code: 'HDB', date: '12/11/2025', content: 'Đánh giá chất lượng tài sản và hiệu quả hoạt động ngân hàng số' },
    { code: 'MBB', date: '11/11/2025', content: 'Báo cáo tổng quan về tăng trưởng tín dụng bán lẻ và SME' },
    { code: 'VJC', date: '10/11/2025', content: 'Phân tích hiệu quả khai thác đường bay và kế hoạch mở rộng đội bay' },
    { code: 'SSI', date: '09/11/2025', content: 'Đánh giá hoạt động môi giới và tự doanh trên thị trường chứng khoán' },
    { code: 'VND', date: '08/11/2025', content: 'Báo cáo phân tích kết quả kinh doanh khu công nghiệp và BĐS' },
    { code: 'DGC', date: '07/11/2025', content: 'Cập nhật tiến độ các dự án khí và dầu khí' },
    { code: 'PNJ', date: '06/11/2025', content: 'Phân tích thị trường vàng và kế hoạch mở rộng chuỗi bán lẻ' },
    { code: 'STB', date: '05/11/2025', content: 'Đánh giá chất lượng tài sản và chiến lược tăng trưởng bền vững' },
  ];

  const isDark = theme === 'dark';

  return (
    <div className={`w-full h-full rounded-lg p-4 border ${
      isDark ? 'bg-[#282832] border-gray-800' : 'bg-white border-gray-200'
    }`}>
      <div className="h-full overflow-auto">
        <table className="w-full text-sm">
          <thead className={`sticky top-0 ${
            isDark ? 'bg-[#1e1e26] text-gray-300' : 'bg-gray-50 text-gray-700'
          }`}>
            <tr>
              {['Mã CK', 'Ngày', 'Nội dung'].map((header, idx) => (
                <th 
                  key={header}
                  className={`px-4 py-3 text-left font-medium border-b ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}
                  colSpan={idx === 2 ? 2 : undefined}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {reports.map((report, index) => (
              <tr 
                key={index} 
                className={`transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#2a2a35]' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <td className={`px-4 py-3 border-b font-medium ${
                  isDark ? 'border-gray-800 text-cyan-400' : 'border-gray-200 text-cyan-600'
                }`}>{report.code}</td>
                <td className={`px-4 py-3 border-b whitespace-nowrap ${
                  isDark ? 'border-gray-800' : 'border-gray-200'
                }`}>{report.date}</td>
                <td className={`px-4 py-3 border-b ${
                  isDark ? 'border-gray-800' : 'border-gray-200'
                }`} colSpan={2}>{report.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Report Viewer Modal */}
      {selectedReport && (
        <ReportViewer
          reportTitle={selectedReport.content}
          reportUrl={`/reports/${selectedReport.code}_${selectedReport.date.replace(/\//g, '-')}.pdf`}
          stockCode={selectedReport.code}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
