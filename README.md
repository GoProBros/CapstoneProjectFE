# Capstone Project

Dự án Next.js chuyên nghiệp với TypeScript và Tailwind CSS.

## 🚀 Công nghệ sử dụng

- **Next.js 15** - React framework với App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting

## 📁 Cấu trúc thư mục

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── globals.css      # Global styles
│   ├── components/          # React components
│   │   └── ui/              # UI components (Button, Card, etc.)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── services/            # API services
│   ├── types/               # TypeScript types & interfaces
│   └── constants/           # Application constants
├── public/                  # Static assets
├── .github/                 # GitHub configuration
└── config files             # TypeScript, Tailwind, ESLint configs
```

## 🛠️ Cài đặt

```bash
# Clone repository
git clone <repository-url>

# Di chuyển vào thư mục dự án
cd CapstoneProject

# Cài đặt dependencies
npm install

# Copy file môi trường
cp .env.example .env.local
```

## 🔧 Sử dụng

### Development

Chạy server development:

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000)

### Build

Build dự án cho production:

```bash
npm run build
```

### Production

Chạy server production:

```bash
npm start
```

### Linting

Kiểm tra code quality:

```bash
npm run lint
```

## 📦 Components có sẵn

### UI Components
- `Button` - Component button với nhiều variants
- `Card` - Component card để hiển thị nội dung

### Custom Hooks
- `useWindowSize` - Hook để theo dõi kích thước window

### Services
- `api.ts` - Service để gọi API với các method: get, post, put, delete

### Utilities
- `formatDate` - Format ngày tháng
- `truncateText` - Cắt ngắn text
- `generateId` - Tạo ID ngẫu nhiên
- `debounce` - Debounce function

## 🌐 Environment Variables

Tạo file `.env.local` và cấu hình các biến môi trường:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=Capstone Project
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📖 Hướng dẫn phát triển

### Tạo component mới

```typescript
// src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
}

export default function MyComponent({ title }: MyComponentProps) {
  return (
    <div className="p-4">
      <h2>{title}</h2>
    </div>
  );
}
```

### Tạo page mới

```typescript
// src/app/about/page.tsx
export default function AboutPage() {
  return (
    <div>
      <h1>About Page</h1>
    </div>
  );
}
```

### Sử dụng API Service

```typescript
import { get, post } from '@/services/api';

// GET request
const data = await get('/users');

// POST request
const newUser = await post('/users', { name: 'John' });
```

## 🎨 Tailwind CSS

Dự án đã cấu hình sẵn Tailwind CSS với:
- Dark mode support
- Custom colors
- Responsive design
- Typography

## 📝 TypeScript

Tất cả code được viết bằng TypeScript với strict mode. Các types và interfaces được định nghĩa trong `src/types/`.

## 🔗 Links hữu ích

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

MIT

## 👥 Contributors

Capstone Project Team
