# Kafi Stock — Workspace Instructions

**Kafi Stock** là nền tảng giao dịch chứng khoán Việt Nam thời gian thực.
Stack: **Next.js 16** · **React 18** · **TypeScript 5** · **Tailwind CSS 3.4** · **SignalR** · **Zustand**

---

## Mandatory Reading

Đọc các file sau **trước khi** bắt đầu làm việc với codebase:

### Core (luôn phải đọc)
- [core/ai-rules.md](./ai/core/ai-rules.md) — Giao thức bắt buộc khi nhận yêu cầu
- [core/ai-architecture.md](./ai/core/ai-architecture.md) — Kiến trúc hệ thống & patterns
- [core/ai-memory.md](./ai/core/ai-memory.md) — Quyết định & patterns đã xác lập

### Guidelines (đọc khi liên quan)
- [guidelines/frontend-guidelines.md](./ai/guidelines/frontend-guidelines.md) — React/Next.js conventions
- [guidelines/naming-convention.md](./ai/guidelines/naming-convention.md) — Quy tắc đặt tên
- [guidelines/state-management.md](./ai/guidelines/state-management.md) — Chiến lược quản lý state
- [guidelines/api-guidelines.md](./ai/guidelines/api-guidelines.md) — Patterns gọi API
- [guidelines/design-system.md](./ai/guidelines/design-system.md) — Tailwind tokens & dark mode
- [guidelines/folder-structure.md](./ai/guidelines/folder-structure.md) — Cấu trúc thư mục
- [guidelines/code-review-checklist.md](./ai/guidelines/code-review-checklist.md) — Checklist trước khi commit

### Prompts (dùng khi cần)
- [prompts/create-component.md](./ai/prompts/create-component.md) — Tạo component mới
- [prompts/create-screen.md](./ai/prompts/create-screen.md) — Tạo màn hình/page mới
- [prompts/fix-bug.md](./ai/prompts/fix-bug.md) — Debug & sửa lỗi
- [prompts/refactor.md](./ai/prompts/refactor.md) — Refactor code

---

## Quick Reference

| Concern | Answer |
|---------|--------|
| API base URL | `process.env.NEXT_PUBLIC_API_URL` \|\| `http://localhost:7148` |
| SignalR hub | `/hubs/marketdata` |
| Path alias | `@/*` → `./src/*` |
| Dev server | `npm run dev` → `http://localhost:3000` |
| Dark mode | Class on `<html>`: `dark` / `light` |
| Auth storage | `localStorage`: `accessToken`, `refreshToken`, `expiresAt`, `user` |
| Language rule | Code = English · UI strings = Vietnamese |

---

## Non-negotiable Rules

1. **Đọc file hiện tại trước khi sửa** — không giả định cấu trúc
2. **Chạy `get_errors()` sau mỗi lần chỉnh sửa file**
3. **Không dùng `any` type** — dùng `unknown` và narrow
4. **Không hardcode URL API** — dùng `API_ENDPOINTS` từ `@/constants/endpoints`
5. **UI strings bằng tiếng Việt** — tên biến và code bằng tiếng Anh
6. **Hỏi trước khi** xóa file, cài package mới, sửa config files
7. **Báo cáo kết quả bằng tiếng Việt**

