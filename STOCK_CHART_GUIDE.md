# Hướng dẫn sử dụng Stock Chart Module

## 📦 Đã cài đặt

- **lightweight-charts**: Thư viện biểu đồ chuyên nghiệp từ TradingView

## 🎯 Cách sử dụng

### 1. Import component

```tsx
import StockChartModule from "@/components/dashboard/StockChartModule";
```

### 2. Sử dụng trong dashboard

```tsx
<StockChartModule 
  symbol="HOSE" 
  title="Công ty cổ phần Đầu tư Nhân hiếu Việt"
/>
```

### 3. Với dữ liệu tùy chỉnh

```tsx
const customData = [
  {
    time: '2024-01-01',
    open: 10.5,
    high: 11.2,
    low: 10.3,
    close: 10.9,
    value: 1500000 // Volume
  },
  // ... more data
];

<StockChartModule 
  symbol="VND" 
  title="Tên công ty"
  data={customData}
/>
```

## 🔧 Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `symbol` | string | 'HOSE' | Mã chứng khoán |
| `title` | string | 'Công ty...' | Tiêu đề biểu đồ |
| `data` | StockData[] | undefined | Dữ liệu tùy chỉnh (nếu không có sẽ dùng data mẫu) |

## 📊 Định dạng dữ liệu

```typescript
interface StockData {
  time: string;      // Format: 'YYYY-MM-DD'
  open: number;      // Giá mở cửa
  high: number;      // Giá cao nhất
  low: number;       // Giá thấp nhất
  close: number;     // Giá đóng cửa
  value?: number;    // Khối lượng giao dịch
}
```

## 🎨 Tùy chỉnh màu sắc

Mở file `StockChartModule.tsx` và sửa trong `createChart()`:

```typescript
layout: {
  background: { type: ColorType.Solid, color: '#0e0d15' }, // Màu nền
  textColor: '#d1d4dc', // Màu chữ
},
```

Hoặc sửa màu nến:

```typescript
upColor: '#26a69a',    // Nến tăng
downColor: '#ef5350',  // Nến giảm
```

## 🌐 Kết nối API thực

### Ví dụ với API Vietnam Stock Market

```tsx
'use client';

import { useEffect, useState } from 'react';
import StockChartModule from "@/components/dashboard/StockChartModule";

export default function DashboardPage() {
  const [stockData, setStockData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Thay URL bằng API thực của bạn
        const response = await fetch('https://api.example.com/stock/HOSE');
        const data = await response.json();
        setStockData(data);
      } catch (error) {
        console.error('Error fetching stock data:', error);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="p-6">
      <StockChartModule 
        symbol="HOSE" 
        title="Công ty cổ phần Đầu tư Nhân hiếu Việt"
        data={stockData}
      />
    </div>
  );
}
```

## 📚 Thư viện khác bạn có thể dùng

1. **Recharts** - Đơn giản, dễ dùng
   ```bash
   npm install recharts
   ```

2. **Chart.js với react-chartjs-2** - Phổ biến
   ```bash
   npm install chart.js react-chartjs-2
   ```

3. **Apache ECharts** - Mạnh mẽ, nhiều tính năng
   ```bash
   npm install echarts echarts-for-react
   ```

4. **Trading-View Widget** (Embed iframe)
   - Miễn phí, không cần code nhiều
   - Tích hợp sẵn nhiều indicator

## 🚀 Chạy thử

```bash
npm run dev
```

Truy cập: `http://localhost:3000/dashboard`

## 📖 Tài liệu tham khảo

- [Lightweight Charts Docs](https://tradingview.github.io/lightweight-charts/)
- [Examples](https://tradingview.github.io/lightweight-charts/tutorials)
