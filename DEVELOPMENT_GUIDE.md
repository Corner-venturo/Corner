# Venturo 開發指南

> 版本：1.0
> 最後更新：2025-10-26
> 狀態：正式規範

---

## 🎯 快速開始

### 環境需求

- **Node.js**: 18.17 或更高版本
- **npm**: 9.0 或更高版本
- **作業系統**: macOS, Linux, Windows

### 專案設定

```bash
# 1. 進入專案目錄
cd /Users/william/Projects/venturo-new

# 2. 安裝依賴
npm install

# 3. 設定環境變數（複製 .env.example）
cp .env.example .env.local

# 4. 啟動開發伺服器
npm run dev

# 5. 開啟瀏覽器
http://localhost:3000
```

### 常用指令

```bash
npm run dev          # 開發伺服器
npm run build        # 建置生產版本
npm run start        # 啟動生產伺服器
npm run lint         # ESLint 檢查
npm run type-check   # TypeScript 類型檢查
```

---

## 📋 命名規範

### 核心原則：統一使用 snake_case

**VENTURO 系統統一使用 snake_case 命名**

#### 為什麼選擇 snake_case？

1. **資料庫一致性** - PostgreSQL/Supabase 使用 snake_case
2. **IndexedDB 一致性** - 本地資料庫使用 snake_case
3. **避免轉換** - 前後端統一，無需欄位名稱轉換
4. **簡化維護** - 一種命名風格，降低認知負擔

### 正確範例

#### TypeScript 型別定義

```typescript
// ✅ 正確：全部 snake_case
export interface Employee extends BaseEntity {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  is_active: boolean
  hire_date?: string
  created_at: string
  updated_at: string
}
```

#### 資料庫 Schema

```typescript
// ✅ 正確：name 和 keyPath 都是 snake_case
{
  name: 'employees',
  keyPath: 'id',
  indexes: [
    { name: 'employee_number', keyPath: 'employee_number', unique: true },
    { name: 'is_active', keyPath: 'is_active', unique: false },
    { name: 'created_at', keyPath: 'created_at', unique: false },
  ]
}
```

#### 程式碼使用

```typescript
// ✅ 正確
const employee = await localDB.read<Employee>('employees', id)
console.log(employee.employee_number)
console.log(employee.is_active)
console.log(employee.created_at)
```

### 常用欄位對照表

| 欄位說明 | ✅ 正確命名       | ❌ 錯誤命名      |
| -------- | ----------------- | ---------------- |
| 員工編號 | `employee_number` | `employeeNumber` |
| 名字     | `first_name`      | `firstName`      |
| 姓氏     | `last_name`       | `lastName`       |
| 是否啟用 | `is_active`       | `isActive`       |
| 建立時間 | `created_at`      | `createdAt`      |
| 更新時間 | `updated_at`      | `updatedAt`      |

### 禁止事項

#### ❌ 不要混用命名風格

```typescript
// ❌ 錯誤：一個物件裡混用
interface BadExample {
  employeeNumber: string // camelCase
  first_name: string // snake_case
  isActive: boolean // camelCase
  created_at: string // snake_case
}
```

#### ❌ 不要建立轉換函數

```typescript
// ❌ 錯誤：不需要這些
function toSnakeCase(obj: any) {}
function toCamelCase(obj: any) {}
function convertKeys(obj: any) {}
```

---

## 🏗️ 專案架構

### 目錄結構

```
venturo-new/
├── src/
│   ├── app/                    # Next.js App Router 頁面
│   │   ├── page.tsx           # 首頁
│   │   ├── tours/             # 旅遊團管理
│   │   ├── orders/            # 訂單管理
│   │   ├── customers/         # 客戶管理
│   │   ├── finance/           # 財務管理
│   │   └── workspace/         # 工作區
│   │
│   ├── components/            # React 組件
│   │   ├── layout/           # 版面組件
│   │   ├── ui/               # UI 組件
│   │   ├── tours/            # 旅遊團組件
│   │   └── workspace/        # 工作區組件
│   │
│   ├── stores/               # Zustand 狀態管理
│   │   ├── core/            # Store 核心架構
│   │   ├── workspace/       # 工作區 stores
│   │   └── types.ts         # 型別定義
│   │
│   ├── features/            # 功能模組
│   │   └── dashboard/       # 儀表板小工具
│   │
│   ├── hooks/               # React Hooks
│   ├── lib/                 # 工具函數
│   ├── services/            # API 服務
│   └── types/               # TypeScript 型別
│
├── public/                  # 靜態資源
├── supabase/               # Supabase 設定
└── docs/                   # 文檔
```

### 架構分層

```
UI Layer (app/, components/)
    ↓
Hook Layer (hooks/)
    ↓
Store Layer (stores/)
    ↓
Service Layer (services/)
    ↓
Database Layer (Supabase/IndexedDB)
```

---

## 💻 程式碼風格

### TypeScript 規範

#### 1. 使用完整型別定義

```typescript
// ✅ 正確
interface TourFormData {
  name: string
  start_date: string
  end_date: string
  max_people: number
}

// ❌ 錯誤：使用 any
function handleSubmit(data: any) {}
```

#### 2. 避免型別斷言

```typescript
// ✅ 正確：使用適當型別
const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

// ❌ 錯誤：使用 unknown 或 any
const [selectedOrder, setSelectedOrder] = useState<unknown>(null)
const data = response as any
```

#### 3. 使用 Logger 而非 console

```typescript
import { logger } from '@/lib/utils/logger'

// ✅ 正確
logger.info('訂單已建立:', order.code)
logger.error('建立失敗:', error)
logger.debug('除錯資訊:', data)

// ❌ 錯誤
console.log('訂單已建立:', order.code)
console.error('建立失敗:', error)
```

### React 組件規範

#### 1. 組件結構

```typescript
// ✅ 推薦的組件結構
export function TourList() {
  // 1. Hooks
  const { items, loading } = useTourStore();
  const [searchTerm, setSearchTerm] = useState('');

  // 2. 計算值
  const filteredTours = useMemo(() => {
    return items.filter(tour =>
      tour.name.includes(searchTerm)
    );
  }, [items, searchTerm]);

  // 3. 事件處理
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // 4. 渲染
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

#### 2. 狀態管理

```typescript
// ✅ 正確：合併相關狀態
interface DialogState {
  memberSidebar: boolean
  shareQuote: boolean
  shareTour: boolean
}
const [dialogState, setDialogState] = useState<DialogState>({
  memberSidebar: false,
  shareQuote: false,
  shareTour: false,
})

// ❌ 錯誤：過多獨立狀態
const [isMemberSidebarOpen, setIsMemberSidebarOpen] = useState(false)
const [isShareQuoteOpen, setIsShareQuoteOpen] = useState(false)
const [isShareTourOpen, setIsShareTourOpen] = useState(false)
// ... 8 more states
```

#### 3. 提取常數

```typescript
// ✅ 正確：提取到組件外
const SIDEBAR_MENU_ITEMS = [
  { label: '首頁', href: '/', icon: Home },
  { label: '旅遊團', href: '/tours', icon: Plane },
  { label: '訂單', href: '/orders', icon: FileText },
];

export function Sidebar() {
  return (
    <nav>
      {SIDEBAR_MENU_ITEMS.map(item => (
        <Link key={item.href} href={item.href}>
          <item.icon />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// ❌ 錯誤：inline 定義
export function Sidebar() {
  return (
    <nav>
      <Link href="/">首頁</Link>
      <Link href="/tours">旅遊團</Link>
      <Link href="/orders">訂單</Link>
      {/* 重複且難以維護 */}
    </nav>
  );
}
```

---

## 🔄 Git 工作流程

### 分支命名

```bash
feature/tour-payment-tracking    # 新功能
fix/order-calculation-bug         # Bug 修復
refactor/channel-state-mgmt       # 重構
docs/update-development-guide     # 文檔更新
```

### Commit Message 規範

```bash
# 格式：<type>: <description>

feat: add payment tracking to tour overview
fix: resolve order total calculation error
refactor: consolidate dialog states in ChannelChat
docs: update naming convention standard
style: apply morandi color system to dashboard
perf: optimize tour list rendering
test: add unit tests for payment service
```

### 提交前檢查清單

```bash
# 1. 型別檢查
npm run type-check

# 2. Lint 檢查
npm run lint

# 3. 建置測試
npm run build

# 4. 如果都通過，才提交
git add .
git commit -m "feat: add new feature"
```

---

## 🧪 開發檢查清單

### 新增功能

- [ ] 型別定義使用 snake_case
- [ ] 避免 `as any` / `as unknown`
- [ ] 使用 logger 而非 console
- [ ] 提取 inline 常數
- [ ] 合併相關狀態
- [ ] 通過型別檢查
- [ ] 通過建置測試

### Code Review

- [ ] 命名規範一致性
- [ ] 型別安全性
- [ ] 狀態管理合理性
- [ ] 組件結構清晰度
- [ ] 無 console.log
- [ ] 常數已提取

### 修改現有程式碼

- [ ] 確認相關型別定義
- [ ] 確認 Schema 定義
- [ ] 一次性修改所有相關檔案
- [ ] 測試修改後的功能
- [ ] 更新相關文檔

---

## 🎨 UI/UX 規範

### 莫蘭迪色系

```css
--morandi-primary: #3a3633 /* 主要文字 */ --morandi-secondary: #8b8680 /* 次要文字 */
  --morandi-gold: #c4a572 /* 強調色（按鈕） */ --morandi-green: #9fa68f /* 成功狀態 */
  --morandi-red: #c08374 /* 警告狀態 */ --morandi-container: #e8e5e0 /* 容器背景 */;
```

### 設計原則

1. **避免「桌面裡的桌面」** - 減少嵌套容器
2. **統一 Header 佈局** - 標題左、操作右
3. **響應式優先** - 適配所有螢幕尺寸
4. **液態玻璃效果** - 半透明背景 + 模糊

---

## 🐛 常見問題

### Q1: 為什麼不用 TypeScript 慣例的 camelCase？

**A**: 因為我們的資料直接來自資料庫（IndexedDB/Supabase），使用 snake_case 可以：

- 避免前後端轉換
- 減少錯誤機會
- 簡化維護
- 統一命名風格

### Q2: 如何處理 console.log？

**A**: 全部替換為 logger：

```typescript
import { logger } from '@/lib/utils/logger'

logger.info() // 一般資訊
logger.error() // 錯誤訊息
logger.warn() // 警告訊息
logger.debug() // 除錯訊息
```

### Q3: 組件狀態太多怎麼辦？

**A**: 合併相關狀態到單一物件，或建立自訂 Hook：

```typescript
// 方案 1：合併狀態
const [dialogState, setDialogState] = useState({
  memberSidebar: false,
  shareQuote: false,
})

// 方案 2：自訂 Hook
const { isOpen, open, close } = useDialogState(['memberSidebar', 'shareQuote'])
```

### Q4: 如何正確使用型別？

**A**:

- 避免 `as any` / `as unknown`
- 使用適當的泛型
- 定義明確的 interface
- 使用聯合型別而非 any

---

## 📚 相關文檔

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 系統架構說明
- [DATABASE.md](./docs/DATABASE.md) - 資料庫文檔
- [OPTIMIZATION.md](./OPTIMIZATION.md) - 優化指南
- [PROJECT_PRINCIPLES.md](./docs/PROJECT_PRINCIPLES.md) - 設計原則

---

**文檔版本**: 1.0
**最後更新**: 2025-10-26
**維護者**: William Chien
**狀態**: ✅ 正式規範
