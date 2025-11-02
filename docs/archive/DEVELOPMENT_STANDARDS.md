# Venturo 開發規範 (Development Standards)

> **版本**: 2.0 - 極致優化版
> **更新日期**: 2025-10-26
> **狀態**: ✅ Production Ready

---

## 📋 目錄

1. [核心原則](#核心原則)
2. [專案架構](#專案架構)
3. [TypeScript 規範](#typescript-規範)
4. [React 組件規範](#react-組件規範)
5. [State 管理規範](#state-管理規範)
6. [API 與資料同步](#api-與資料同步)
7. [效能優化規範](#效能優化規範)
8. [測試規範](#測試規範)
9. [Git 工作流程](#git-工作流程)
10. [檔案命名規範](#檔案命名規範)

---

## 🎯 核心原則

### 1. 離線優先 (Offline-First)

```tsx
// ✅ 正確：先從 IndexedDB 載入，背景同步
const { cached, fresh } = await loadWithSync({
  tableName: 'tours',
  filter: { field: 'status', value: 'active' },
})

set({ items: cached, loading: false })
if (fresh) set({ items: fresh })

// ❌ 錯誤：直接從 Supabase 載入
const { data } = await supabase.from('tours').select()
set({ items: data })
```

### 2. 型別安全 (Type Safety)

```tsx
// ✅ 正確：明確型別定義
interface Tour {
  id: string
  name: string
  start_date: string | null
}

// ❌ 錯誤：使用 any
const tour: any = getTour()
```

### 3. 效能優先 (Performance First)

```tsx
// ✅ 正確：使用 memoized selector
const stats = useAccountingStats();
const balance = useAccountBalance(accountId);

// ❌ 錯誤：每次渲染都計算
const stats = calculateStats(transactions);
const balance = transactions.filter(t => t.id === id).reduce(...);
```

---

## 🏗️ 專案架構

### 目錄結構

```
src/
├── app/                    # Next.js App Router 頁面
│   ├── (auth)/            # 認證相關頁面群組
│   ├── api/               # API Routes
│   └── [feature]/         # 功能頁面
│
├── components/            # 共用組件
│   ├── ui/               # 基礎 UI 組件
│   ├── layout/           # 版面組件
│   └── [feature]/        # 功能組件
│
├── features/             # Feature-based 模組
│   └── [feature]/
│       ├── components/   # 功能專屬組件
│       ├── hooks/        # 功能專屬 hooks
│       └── types/        # 功能專屬型別
│
├── stores/               # Zustand 狀態管理
│   ├── selectors/        # Memoized selectors
│   ├── utils/            # Store 工具
│   └── [store]-store.ts  # Store 定義
│
├── lib/                  # 工具函數庫
│   ├── constants/        # 常數定義
│   ├── utils/            # 通用工具
│   ├── performance/      # 效能監控
│   └── supabase/         # Supabase 客戶端
│
├── services/             # 服務層
│   └── storage/          # IndexedDB 封裝
│
└── types/                # 全域型別定義
```

### 檔案組織原則

1. **Feature-First**: 優先按功能分組
2. **Colocation**: 相關檔案放在一起
3. **Flat is Better**: 避免過深的巢狀

---

## 📘 TypeScript 規範

### tsconfig.json 配置

已啟用**極致嚴格模式**：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 型別定義規範

```tsx
// ✅ 正確：明確的介面定義
interface User {
  id: string
  name: string
  email: string | null
  role: 'admin' | 'user'
  createdAt: Date
}

// ✅ 正確：使用 Utility Types
type PartialUser = Partial<User>
type UserWithoutId = Omit<User, 'id'>
type UserRole = User['role']

// ❌ 錯誤：使用 any
const user: any = getUser()

// ❌ 錯誤：隱式 any
function process(data) {
  // missing type
  return data
}
```

### 型別匯出

```tsx
// ✅ 正確：使用 type 關鍵字匯出
export type { User, UserRole }
export type { Tour } from './tour.types'

// ❌ 錯誤：混用 export 和型別
export { User } // runtime export
```

---

## ⚛️ React 組件規範

### 組件結構

```tsx
// ✅ 標準組件結構
'use client' // 如果需要

// 1. React & Next.js imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { Calendar, User } from 'lucide-react'

// 3. Types
import type { Tour } from '@/types/tour.types'

// 4. Stores & Selectors
import { useTourStore } from '@/stores'
import { useAccountingStats } from '@/stores/selectors'

// 5. Components
import { Button } from '@/components/ui/button'
import { TourCard } from '@/components/tours/tour-card'

// 6. Utilities & Constants
import { cn } from '@/lib/utils'
import { HEADER_HEIGHT_PX } from '@/lib/constants'

// 7. Interface definition
interface TourListProps {
  initialTours?: Tour[]
  filter?: 'active' | 'completed'
}

// 8. Component implementation
export function TourList({ initialTours, filter = 'active' }: TourListProps) {
  // Hooks (按順序)
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const tours = useTourStore(state => state.items)

  // Effects
  useEffect(() => {
    // load data
  }, [])

  // Handlers
  const handleSelect = (id: string) => {
    setSelected(id)
  }

  // Render
  return (
    <div className={cn('container', filter === 'active' && 'active')}>
      {tours.map(tour => (
        <TourCard
          key={tour.id}
          tour={tour}
          selected={selected === tour.id}
          onClick={handleSelect}
        />
      ))}
    </div>
  )
}
```

### 組件大小限制

- **最大行數**: 200 行
- **最大複雜度**: 15
- **最大深度**: 4 層
- **超過限制時**: 拆分為子組件或 hooks

### Props 規範

```tsx
// ✅ 正確：明確的 Props 介面
interface CardProps {
  title: string
  description?: string
  onClick?: () => void
  children?: React.ReactNode
  className?: string
}

// ✅ 正確：使用 default parameters
function Card({ title, description = '', className = '' }: CardProps) {
  // ...
}

// ❌ 錯誤：Props 沒有型別
function Card(props) {
  return <div>{props.title}</div>
}
```

---

## 🗄️ State 管理規範

### Store 結構

```tsx
// ✅ 正確：清晰的 Store 定義
interface TourStore {
  // State
  items: Tour[]
  loading: boolean
  error: string | null

  // Actions
  load: () => Promise<void>
  create: (tour: Omit<Tour, 'id'>) => Promise<Tour>
  update: (id: string, data: Partial<Tour>) => Promise<void>
  delete: (id: string) => Promise<void>
}

export const useTourStore = create<TourStore>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,

      load: async () => {
        const { cached, fresh } = await loadWithSync({
          tableName: 'tours',
        })
        set({ items: cached, loading: false })
        if (fresh) set({ items: fresh })
      },

      // ... other actions
    }),
    { name: 'tour-store' }
  )
)
```

### Selector 使用

```tsx
// ✅ 正確：使用 memoized selector
const stats = useAccountingStats()
const balance = useAccountBalance(accountId)
const tours = useTourStore(state => state.items)

// ✅ 正確：自訂 selector with equality
const activeTours = useTourStore(
  state => state.items.filter(t => t.status === 'active'),
  shallow // from 'zustand/shallow'
)

// ❌ 錯誤：直接計算
const stats = calculateStats(useAccountingStore.getState().transactions)

// ❌ 錯誤：訂閱整個 store
const store = useTourStore()
```

---

## 🔌 API 與資料同步

### 使用 Sync Helper

```tsx
// ✅ 正確：使用統一的 sync helper
import { loadWithSync, createWithSync, updateWithSync } from '@/stores/utils/sync-helper'

// Load
const { cached, fresh, error } = await loadWithSync({
  tableName: 'tours',
  filter: { field: 'status', value: 'active' },
  orderBy: { field: 'created_at', ascending: false },
})

// Create
const { data, error } = await createWithSync('tours', newTour)

// Update
const { data, error } = await updateWithSync('tours', tourId, updates)

// ❌ 錯誤：直接使用 Supabase
const { data } = await supabase.from('tours').select()
```

### 錯誤處理

```tsx
// ✅ 正確：使用 error handler
import { handleError, createAppError, ErrorType } from '@/lib/error-handler'

try {
  await saveTour(tour)
} catch (error) {
  const appError = handleError(error)
  showErrorToUser(appError)
}

// ✅ 正確：使用 tryCatch wrapper
const [result, error] = await tryCatch(() => loadTours(), ErrorType.DATABASE, '載入旅遊資料失敗')

if (error) {
  showErrorToUser(error)
  return
}
```

---

## ⚡ 效能優化規範

### 1. 使用 Memoization

```tsx
// ✅ 正確：useMemo for expensive calculations
const sortedTours = useMemo(() => {
  return tours.sort((a, b) => a.date.localeCompare(b.date))
}, [tours])

// ✅ 正確：useCallback for event handlers
const handleClick = useCallback((id: string) => {
  setSelected(id)
}, [])

// ❌ 錯誤：每次 render 都重新排序
const sortedTours = tours.sort((a, b) => a.date.localeCompare(b.date))
```

### 2. 避免不必要的 Re-render

```tsx
// ✅ 正確：使用 React.memo
export const TourCard = React.memo(function TourCard({ tour }: Props) {
  return <div>{tour.name}</div>
})

// ✅ 正確：拆分組件
function ParentComponent() {
  const [count, setCount] = useState(0)

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ExpensiveComponent /> {/* 不會因為 count 改變而重新渲染 */}
    </>
  )
}
```

### 3. 效能監控

```tsx
// ✅ 使用 Performance Monitor
import { perfMonitor } from '@/lib/performance/monitor'

// 測量函數執行時間
await perfMonitor.measure('loadTours', async () => {
  return await loadTours()
})

// 查看統計
console.log(perfMonitor.getStats('loadTours'))
console.log(perfMonitor.getSlowest(10))
```

### 4. 圖片優化

```tsx
// ✅ 正確：使用 Next.js Image
import Image from 'next/image';

<Image
  src="/tour-image.jpg"
  alt="Tour"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
/>

// ❌ 錯誤：使用原生 img
<img src="/tour-image.jpg" alt="Tour" />
```

---

## 🧪 測試規範

### 單元測試

```tsx
// tour.test.ts
import { describe, it, expect } from 'vitest'
import { calculateTourCost } from './tour-utils'

describe('calculateTourCost', () => {
  it('should calculate total cost correctly', () => {
    const result = calculateTourCost({
      baseCost: 1000,
      participants: 10,
      discount: 0.1,
    })

    expect(result).toBe(9000)
  })

  it('should handle zero participants', () => {
    const result = calculateTourCost({
      baseCost: 1000,
      participants: 0,
      discount: 0,
    })

    expect(result).toBe(0)
  })
})
```

### 組件測試

```tsx
// TourCard.test.tsx
import { render, screen } from '@testing-library/react'
import { TourCard } from './TourCard'

describe('TourCard', () => {
  it('renders tour information', () => {
    render(<TourCard tour={mockTour} />)

    expect(screen.getByText('Tokyo Tour')).toBeInTheDocument()
    expect(screen.getByText('2024-03-15')).toBeInTheDocument()
  })
})
```

---

## 🔧 Git 工作流程

### Commit 訊息格式

```bash
# 格式：<type>(<scope>): <subject>

feat(tours): add tour filtering by region
fix(auth): resolve login redirect issue
refactor(stores): optimize selector performance
docs(readme): update installation instructions
style(ui): improve button hover states
perf(dashboard): reduce initial load time
test(tours): add tour creation tests
chore(deps): upgrade Next.js to 15.5.4
```

### Commit Types

- `feat`: 新功能
- `fix`: Bug 修復
- `refactor`: 重構
- `perf`: 效能優化
- `docs`: 文件更新
- `style`: 樣式調整
- `test`: 測試相關
- `chore`: 維護工作

### Branch 命名

```bash
feature/tour-filtering
fix/login-redirect
refactor/store-optimization
docs/api-documentation
```

---

## 📂 檔案命名規範

### 通用規則

- **React 組件**: PascalCase - `TourCard.tsx`
- **Hooks**: camelCase with `use` prefix - `useTours.ts`
- **工具函數**: kebab-case - `format-date.ts`
- **Store**: kebab-case with `-store` suffix - `tour-store.ts`
- **Types**: kebab-case with `.types` - `tour.types.ts`
- **常數**: kebab-case - `api-routes.ts`

### 範例

```
src/
├── components/
│   ├── TourCard.tsx          # React 組件
│   └── tour-list/
│       ├── TourList.tsx
│       ├── TourListItem.tsx
│       └── index.ts          # Barrel export
│
├── hooks/
│   ├── useTours.ts           # Custom hook
│   └── usePermissions.ts
│
├── lib/
│   ├── utils/
│   │   ├── format-date.ts    # 工具函數
│   │   └── calculate-cost.ts
│   └── constants/
│       ├── routes.ts         # 常數
│       └── timebox.ts
│
├── stores/
│   ├── tour-store.ts         # Zustand store
│   └── selectors/
│       └── tour-selectors.ts
│
└── types/
    ├── tour.types.ts         # 型別定義
    └── order.types.ts
```

---

## 🔍 程式碼審查 Checklist

提交 PR 前檢查：

- [ ] TypeScript 無錯誤 (`npm run type-check`)
- [ ] ESLint 無錯誤 (`npm run lint`)
- [ ] Build 成功 (`npm run build`)
- [ ] 所有測試通過 (`npm test`)
- [ ] 效能檢查無警告
- [ ] 程式碼遵循命名規範
- [ ] 已新增必要的註解
- [ ] 已更新相關文件
- [ ] Commit 訊息符合規範

---

## 📊 效能基準

### 目標指標

| 指標                     | 目標值  | 測量方式   |
| ------------------------ | ------- | ---------- |
| First Contentful Paint   | < 1.5s  | Lighthouse |
| Largest Contentful Paint | < 2.5s  | Lighthouse |
| Time to Interactive      | < 3s    | Lighthouse |
| Total Blocking Time      | < 300ms | Lighthouse |
| Cumulative Layout Shift  | < 0.1   | Lighthouse |

### Store 操作基準

| 操作               | 目標時間 |
| ------------------ | -------- |
| Dashboard 統計計算 | < 10ms   |
| 列表頁面渲染       | < 50ms   |
| Store 資料載入     | < 100ms  |
| API 同步           | < 500ms  |

---

## 🎓 學習資源

### 官方文件

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)

### 內部文件

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 系統架構
- [DATABASE.md](./docs/DATABASE.md) - 資料庫設計
- [PERFORMANCE_IMPACT.md](./PERFORMANCE_IMPACT.md) - 效能優化影響
- [VENTURO_SYSTEM_INDEX.md](./VENTURO_SYSTEM_INDEX.md) - 系統總索引

---

## 🚀 快速參考

### 建立新功能

1. 在 `src/features/[feature-name]/` 建立目錄
2. 建立組件、hooks、types
3. 建立 store (如需要)
4. 建立 selectors (如需要)
5. 撰寫測試
6. 更新文件

### 建立新 Store

```tsx
// src/stores/my-feature-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loadWithSync } from './utils/sync-helper'

interface MyFeatureStore {
  items: Item[]
  load: () => Promise<void>
}

export const useMyFeatureStore = create<MyFeatureStore>()(
  persist(
    set => ({
      items: [],
      load: async () => {
        const { cached, fresh } = await loadWithSync({
          tableName: 'my_table',
        })
        set({ items: cached })
        if (fresh) set({ items: fresh })
      },
    }),
    { name: 'my-feature-store' }
  )
)
```

### 建立 Selector

```tsx
// src/stores/selectors/my-feature-selectors.ts
import { useMyFeatureStore } from '../my-feature-store'
import { useMemo } from 'react'

export function useActiveItems() {
  return useMyFeatureStore(state => state.items.filter(item => item.status === 'active'))
}

export function useItemStats() {
  const items = useMyFeatureStore(state => state.items)

  return useMemo(
    () => ({
      total: items.length,
      active: items.filter(i => i.status === 'active').length,
      completed: items.filter(i => i.status === 'completed').length,
    }),
    [items]
  )
}
```

---

**最後更新**: 2025-10-26
**維護者**: Venturo Development Team
**版本**: 2.0 - Extreme Optimization Edition
