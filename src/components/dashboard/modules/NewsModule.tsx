"use client";

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface NewsItem {
  id: string;
  time: string;
  title: string;
  imageUrl?: string;
}

interface EventItem {
  id: string;
  code: string;
  date: string;
  content: string;
  type: 'dividend' | 'stock-dividend' | 'rights' | 'bonus';
}

export default function NewsModule() {
  const [activeTab, setActiveTab] = useState<'market' | 'stock' | 'event'>('market');

  // Market news with images
  const marketNews: NewsItem[] = [
    {
      id: '1',
      time: '2025-11-29 00:07',
      title: 'Một cổ phiếu tăng dựng đứng 350% trong 1 tháng sau khi thoái vốn giá cao, chuẩn bị họp ĐHĐCĐ bất thường',
      imageUrl: 'https://cafefcdn.com/zoom/250_157/203337114487263232/2025/11/28/avatar1764344159160-17643441595491150467118.jpg'
    },
    {
      id: '2',
      time: '2025-11-28 21:56',
      title: 'Thị trường tiền số hôm nay, 28-11: Một quyết định khó khăn đang chờ Bitcoin',
      imageUrl: 'https://cafefcdn.com/zoom/250_157/203337114487263232/2025/11/28/avatar1764341754175-1764341754718950929757.jpg'
    },
    {
      id: '3',
      time: '2025-11-28 19:30',
      title: 'Kinh doanh bứt phá ngoạn mục, OCBS tăng vốn liên tiếp lên 3.200 tỷ cùng hàng loạt chuyển động lớn',
      imageUrl: 'https://cafefcdn.com/zoom/250_157/203337114487263232/2025/11/28/photo1764315530461-17643155306381843522902-1764332894253406228614.jpg'
    },
    {
      id: '4',
      time: '2025-11-28 18:40',
      title: 'Tập đoàn của tỷ phú Nguyễn Thị Phương Thảo giảm sở hữu tại HDBank',
      imageUrl: 'https://cafefcdn.com/zoom/250_157/203337114487263232/2025/11/28/avatar1764329858045-17643298584991641091202.jpg'
    },
    {
      id: '5',
      time: '2025-11-28 18:37',
      title: 'Hai cổ phiếu nhà tỷ phú đồng loạt bị tự doanh CTCK "xả" mạnh trong phiên cuối tuần',
      imageUrl: 'https://cafefcdn.com/zoom/250_157/203337114487263232/2025/11/28/avatar1764329830859-1764329831522965003953.png'
    }
  ];

  // Stock events (no images)
  const stockNews: NewsItem[] = [
    {
      id: '1',
      time: '2025-10-06 00:00',
      title: 'ABR: Thông báo chi trả cổ tức từ nguồn lợi nhuận sau thuế chưa phân phối lúy kế đến 31/12/2024'
    },
    {
      id: '2',
      time: '2025-09-24 00:00',
      title: 'ABR: Giấy chứng nhận đăng ký doanh nghiệp thay đổi lần thứ 17'
    },
    {
      id: '3',
      time: '2025-09-19 00:00',
      title: 'ABR: 26.9.2025, ngày GDKHQ trả cổ tức bằng tiền (2.000 đ/cp)'
    },
    {
      id: '4',
      time: '2025-09-15 00:00',
      title: 'ABR: Nghị quyết HĐQT về ngày đăng ký cuối cùng để nhận tiền cổ tức'
    },
    {
      id: '5',
      time: '2025-09-11 00:00',
      title: 'ABR: Biên bản kiểm phiếu và Nghị quyết ĐHĐCĐ về việc lấy ý kiến cổ đông bằng văn bản thông qua chi trả cổ tức bằng tiền'
    },
    {
      id: '6',
      time: '2025-08-14 00:00',
      title: 'ABR: 21.8.2025, ngày GDKHQ lấy ý kiến cổ đông bằng văn bản'
    },
    {
      id: '7',
      time: '2025-08-08 00:00',
      title: 'ABR: Nghị quyết HĐQT về việc giải thể công ty con - Công ty TNHH Phát triển và Đầu tư Phú Lệ'
    },
    {
      id: '8',
      time: '2025-08-08 00:00',
      title: 'ABR: Thông báo về ngày đăng ký cuối cùng lấy ý kiến cổ đông bằng văn bản'
    },
    {
      id: '9',
      time: '2025-08-08 00:00',
      title: 'ABR: Thông báo tài liệu lấy ý kiến cổ đông bằng văn bản'
    },
    {
      id: '10',
      time: '2025-07-31 00:00',
      title: 'ABR: Thông báo ký hợp đồng kiểm toán BCTC 2025'
    },
    {
      id: '11',
      time: '2025-07-30 00:00',
      title: 'ABR: Báo cáo tình hình quản trị 6 tháng đầu năm 2025'
    },
    {
      id: '12',
      time: '2025-07-30 00:00',
      title: 'ABR: Báo cáo tình hình quản trị công ty 06 tháng đầu năm 2025'
    },
    {
      id: '13',
      time: '2025-07-16 00:00',
      title: 'ABR: Thông báo thay đổi địa chỉ do thay đổi địa giới hành chính'
    },
    {
      id: '14',
      time: '2025-05-16 00:00',
      title: 'ABR: Thông báo chi trả cổ tức năm 2024'
    },
    {
      id: '15',
      time: '2025-05-13 00:00',
      title: 'ABR: Giấy chứng nhận đăng ký doanh nghiệp thay đổi lần thứ 16'
    },
    {
      id: '16',
      time: '2025-04-18 00:00',
      title: 'ABR: 28.4.2025, ngày GDKHQ trả cổ tức năm 2024 bằng tiền (2.000 đ/cp)'
    },
    {
      id: '17',
      time: '2025-04-15 00:00',
      title: 'ABR: CBTT ngày ĐKCC nhận cổ tức bằng tiền năm 2024'
    },
    {
      id: '18',
      time: '2025-04-14 00:00',
      title: 'ABR: Điều lệ sửa đổi và thay đổi địa chỉ trụ sở chính đã được ĐHĐCĐ thường niên năm 2025 thông qua'
    },
    {
      id: '19',
      time: '2025-04-11 00:00',
      title: 'ABR: Biên bản họp và Nghị quyết ĐHĐCĐ thường niên năm 2025'
    }
  ];

  // Event data (stock corporate actions)
  const eventData: EventItem[] = [
    { id: '1', code: 'VTB', date: '23-10-2025', content: 'VTB: chia cổ tức bằng tiền, tỉ lệ 0.04 (400 đồng/CP)', type: 'dividend' },
    { id: '2', code: 'VTB', date: '23-10-2025', content: 'VTB: chia cổ tức bằng tiền, tỉ lệ 0.05 (500 đồng/CP)', type: 'dividend' },
    { id: '3', code: 'VEF', date: '22-10-2025', content: 'VEF: chia cổ tức bằng tiền, tỉ lệ 3.3 (33,000 đồng/CP)', type: 'dividend' },
    { id: '4', code: 'PBP', date: '24-10-2025', content: 'PBP: chia cổ tức bằng tiền, tỉ lệ 0.085 (850 đồng/CP)', type: 'dividend' },
    { id: '5', code: 'IN4', date: '22-10-2025', content: 'IN4: chia cổ tức bằng tiền, tỉ lệ 0.18 (1,800 đồng/CP)', type: 'dividend' },
    { id: '6', code: 'VFR', date: '21-10-2025', content: 'VFR: chia cổ tức bằng tiền, tỉ lệ 0.0397 (397 đồng/CP)', type: 'dividend' },
    { id: '7', code: 'DHT', date: '24-10-2025', content: 'DHT: phát hành cổ phiếu thưởng, tỉ lệ 0.1 (phát hành thêm: 8,234,026)', type: 'bonus' },
    { id: '8', code: 'GHC', date: '21-10-2025', content: 'GHC: chia cổ tức bằng tiền, tỉ lệ 0.2 (2,000 đồng/CP)', type: 'dividend' },
    { id: '9', code: 'TPP', date: '16-10-2025', content: 'TPP: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 0.44 (phát hành thêm: 20,000,000)', type: 'rights' },
    { id: '10', code: 'HMS', date: '23-10-2025', content: 'HMS: chia cổ tức bằng tiền, tỉ lệ 0.1 (1,000 đồng/CP)', type: 'dividend' },
    { id: '11', code: 'CTF', date: '23-10-2025', content: 'CTF: chia cổ tức bằng tiền, tỉ lệ 0.05 (500 đồng/CP)', type: 'dividend' },
    { id: '12', code: 'NLG', date: '17-10-2025', content: 'NLG: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 0.26 (phát hành thêm: 100,119,579)', type: 'rights' },
    { id: '13', code: 'NT2', date: '21-10-2025', content: 'NT2: chia cổ tức bằng tiền, tỉ lệ 0.07 (700 đồng/CP)', type: 'dividend' },
    { id: '14', code: 'ELC', date: '17-10-2025', content: 'ELC: trả cổ tức bằng cổ phiếu, tỉ lệ 0.05 (phát hành thêm: 5,242,371)', type: 'stock-dividend' },
    { id: '15', code: 'LGC', date: '20-10-2025', content: 'LGC: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 0.1 (phát hành thêm: 19,285,476)', type: 'rights' },
    { id: '16', code: 'TT6', date: '22-10-2025', content: 'TT6: trả cổ tức bằng cổ phiếu, tỉ lệ 0.11 (phát hành thêm: 2,260,038)', type: 'stock-dividend' },
    { id: '17', code: 'SDV', date: '16-10-2025', content: 'SDV: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 1.0 (phát hành thêm: 5,000,000)', type: 'rights' },
    { id: '18', code: 'AST', date: '16-10-2025', content: 'AST: chia cổ tức bằng tiền, tỉ lệ 0.25 (2,500 đồng/CP)', type: 'dividend' },
    { id: '19', code: 'PGB', date: '17-10-2025', content: 'PGB: trả cổ tức bằng cổ phiếu, tỉ lệ 0.1 (phát hành thêm: 50,000,000)', type: 'stock-dividend' },
    { id: '20', code: 'TCT', date: '20-10-2025', content: 'TCT: chia cổ tức bằng tiền, tỉ lệ 0.05 (500 đồng/CP)', type: 'dividend' },
    { id: '21', code: 'PGB', date: '17-10-2025', content: 'PGB: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 0.9 (phát hành thêm: 450,000,000)', type: 'rights' },
    { id: '22', code: 'ANV', date: '23-10-2025', content: 'ANV: chia cổ tức bằng tiền, tỉ lệ 0.05 (500 đồng/CP)', type: 'dividend' },
    { id: '23', code: 'SAS', date: '23-10-2025', content: 'SAS: chia cổ tức bằng tiền, tỉ lệ 0.06 (600 đồng/CP)', type: 'dividend' },
    { id: '24', code: 'SJG', date: '17-10-2025', content: 'SJG: chia cổ tức bằng tiền, tỉ lệ 0.1 (1,000 đồng/CP)', type: 'dividend' },
    { id: '25', code: 'DSH', date: '16-10-2025', content: 'DSH: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 2.5 (phát hành thêm: 25,000,000)', type: 'rights' },
    { id: '26', code: 'SCL', date: '17-10-2025', content: 'SCL: phát hành quyền mua CP cho Cổ đông hiện hữu, tỉ lệ 0.36 (phát hành thêm: 8,000,000)', type: 'rights' },
    { id: '27', code: 'BID', date: '14-10-2025', content: 'BID: chia cổ tức bằng tiền, tỉ lệ 0.045 (450 đồng/CP)', type: 'dividend' },
    { id: '28', code: 'CKD', date: '14-10-2025', content: 'CKD: chia cổ tức bằng tiền, tỉ lệ 0.21 (2,100 đồng/CP)', type: 'dividend' },
    { id: '29', code: 'BHA', date: '13-10-2025', content: 'BHA: chia cổ tức bằng tiền, tỉ lệ 0.05 (500 đồng/CP)', type: 'dividend' },
    { id: '30', code: 'CDC', date: '16-10-2025', content: 'CDC: phát hành cổ phiếu thưởng, tỉ lệ 0.2 (phát hành thêm: 8,795,486)', type: 'bonus' },
    { id: '31', code: 'VNM', date: '16-10-2025', content: 'VNM: chia cổ tức bằng tiền, tỉ lệ 0.25 (2,500 đồng/CP)', type: 'dividend' },
    { id: '32', code: 'VHF', date: '15-10-2025', content: 'VHF: chia cổ tức bằng tiền, tỉ lệ 0.0207 (207 đồng/CP)', type: 'dividend' },
    { id: '33', code: 'CTG', date: '14-10-2025', content: 'CTG: chia cổ tức bằng tiền, tỉ lệ 0.045 (450 đồng/CP)', type: 'dividend' },
    { id: '34', code: 'VCB', date: '03-10-2025', content: 'VCB: chia cổ tức bằng tiền, tỉ lệ 0.045 (450 đồng/CP)', type: 'dividend' },
    { id: '35', code: 'ABR', date: '26-09-2025', content: 'ABR: chia cổ tức bằng tiền, tỉ lệ 0.2 (2,000 đồng/CP)', type: 'dividend' }
  ];

  const newsItems = activeTab === 'stock' ? stockNews : marketNews;

  const getEventIcon = (type: EventItem['type']) => {
    switch (type) {
      case 'dividend':
        return 'i-solar:hand-money-broken';
      case 'stock-dividend':
        return 'i-grommet-icons:money';
      case 'rights':
      case 'bonus':
        return 'i-game-icons:pay-money';
      default:
        return 'i-solar:hand-money-broken';
    }
  };

  const tabs = [
    { id: 'market', label: 'Thị trường' },
    { id: 'stock', label: 'Cổ phiếu' },
    { id: 'event', label: 'Sự kiện' },
  ] as const;

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`dashboard-module w-full h-full rounded-lg flex flex-col overflow-hidden text-sm ${
      isDark ? 'bg-[#282832] text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Badge title */}
      <div className="flex-none flex items-center justify-center pt-1.5 pb-1">
        <div className="relative flex items-center justify-center">
          <svg width="150" height="25" viewBox="0 0 136 22" className="block">
            <path d="M134 0C151 0 -15 0 2 0C19 0 27 22 46 22H92C113 22 119 0 134 0Z" fill="#4ADE80"/>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-black tracking-wide">
            Tin Tức
          </span>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="w-full flex gap-2 justify-center overflow-hidden pt-2 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-3 py-1 border transition-colors ${
              activeTab === tab.id
                ? 'border-transparent'
                : 'border-transparent border-gray-700'
            }`}
            style={{
              backgroundColor: activeTab === tab.id ? '#34C85E' : 'transparent'
            }}
          >
            <span className={activeTab === tab.id ? 'text-[#282832] font-medium' : 'text-gray-400'}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* News list */}
      <div className="m-3 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-3">
        {activeTab === 'event' ? (
          /* Event Table */
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="text-xs">
                <th colSpan={4}>
                  <div className="flex items-center w-full rounded-full px-3 py-1 -mt-[1px]" style={{ backgroundColor: '#34C85E' }}>
                    <div className="flex-none w-[70px] text-[#282832] font-medium">
                      <div className="relative inline-flex">
                        <div className="flex items-center">
                          <button className="relative rounded-full flex items-center p-1 mr-1" style={{ backgroundColor: '#34C85E' }}>
                            <span className="animate-ping absolute inset-0 rounded-full opacity-75" style={{ backgroundColor: '#34C85E' }}></span>
                            <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <circle cx="11" cy="11" r="8" />
                              <path d="M21 21l-4.35-4.35" />
                            </svg>
                          </button>
                          Mã
                        </div>
                      </div>
                    </div>
                    <div className="flex-none w-20 text-[#282832] font-medium">Ngày GDKHQ</div>
                    <div className="flex-1 text-[#282832] font-medium">Nội dung</div>
                    <div className="flex-none w-7 text-[#282832] font-medium">Loại</div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {eventData.map((event) => (
                <tr key={event.id}>
                  <td colSpan={4}>
                    <div 
                      className={`flex items-center w-full mt-2 rounded-lg px-3 py-1.5 overflow-hidden ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-50'}`}
                    >
                      <div className="flex-none w-[70px] text-xs text-gray-300">{event.code}</div>
                      <div className="flex-none w-20 text-xs text-gray-300">{event.date}</div>
                      <div className="flex-1 min-w-0 text-justify px-1 text-xs text-gray-300 truncate">{event.content}</div>
                      <div className="flex-none w-7" style={{ color: '#34C85E' }}>
                        <span className={`iconify ${getEventIcon(event.type)}`} aria-hidden="true" style={{ fontSize: '24px' }}></span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* News Grid */
          <div className="grid gap-4">
          {newsItems.map((item) => (
            <div key={item.id} className={`text-sm px-3 py-1.5 rounded-lg ${
              isDark ? 'bg-cyan-900/30' : 'bg-cyan-50'
            }`}>
              {/* Time and AI button */}
              <div className="flex items-center justify-between mb-1.5" style={{ color: '#34C85E' }}>
                <div className="text-xs">{item.time}</div>
                <div>
                  <button
                    type="button"
                    className="rounded-full text-xs p-1.5 text-white hover:bg-gray-800 transition-colors"
                    aria-label="AI"
                  >
                    <svg
                      className="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 8V4H8" />
                      <rect width="16" height="12" x="4" y="8" rx="2" />
                      <path d="M2 14h2" />
                      <path d="M20 14h2" />
                      <path d="M15 13v2" />
                      <path d="M9 13v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* News content */}
              <div className="flex cursor-pointer hover:opacity-80 transition-opacity">
                {item.imageUrl && (
                  <span className="inline-flex justify-center items-center overflow-hidden mr-2 aspect-video rounded-lg min-w-24 max-w-24 flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      className="inline-block object-cover w-full h-full"
                      alt="News thumbnail"
                    />
                  </span>
                )}
                <span className="text-gray-300 text-xs leading-relaxed line-clamp-3">{item.title}</span>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
