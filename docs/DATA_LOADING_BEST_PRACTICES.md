# Data Loading Best Practices

> 最後更新: 2026-01-13
> 適用於: Venturo ERP

## 架構概述

Venturo ERP 使用 `@/data` 模組作為統一的資料存取層，基於 SWR 實現自動快取、去重和重新驗證。

## 推薦的資料載入方式

### 1. 使用 @/data hooks（推薦）

```typescript
// ✅ 正確：使用 @/data hooks
import { useCountries, useRegions, useCities } from '@/data'

function MyComponent() {
  const { items: countries, loading } = useCountries()
  const { items: regions } = useRegions()
  const { items: cities } = useCities()

  // 使用資料...
}
```

**優點**：
- 自動快取（跨組件共享）
- 自動去重（多個組件同時請求只發一次）
- 自動重試
- 類型安全

### 2. 可用的 Hook 類型

每個 Entity 都提供以下 hooks：

| Hook | 用途 | 回傳類型 |
|------|------|---------|
| `useXxx()` | 完整列表 | `{ items: T[], loading, error, refresh }` |
| `useXxxSlim()` | 精簡列表（用於下拉選單） | `{ items: Partial<T>[], loading, error, refresh }` |
| `useXxxDetail(id)` | 單筆詳細資料 | `{ item: T | null, loading, error, refresh }` |
| `useXxxPaginated(params)` | 分頁查詢 | `{ items: T[], totalCount, loading, error, refresh }` |
| `useXxxDictionary()` | O(1) 查詢字典 | `{ dictionary: Record<string, Partial<T>>, get, loading }` |

### 3. 常見實體

```typescript
// 地區資料（低頻變動，1小時快取）
import { useCountries, useRegions, useCities } from '@/data'

// 業務資料（高頻變動，1分鐘快取）
import { useTours, useOrders, useCustomers } from '@/data'

// 財務資料
import { usePaymentRequests, useReceiptOrders, useDisbursementOrders } from '@/data'
```

## 禁止的做法

### 1. 直接查詢 Supabase

```typescript
// ❌ 錯誤：直接查詢 Supabase
useEffect(() => {
  supabase.from('countries').select('*').then(({ data }) => {
    setCountries(data)
  })
}, [])

// ✅ 正確：使用 @/data hooks
const { items: countries } = useCountries()
```

### 2. 使用舊版 Store

```typescript
// ❌ 錯誤：使用舊版 region-store
import { useRegionStore } from '@/stores/region-store'
const { countries, fetchAll } = useRegionStore()
useEffect(() => { fetchAll() }, [])

// ✅ 正確：使用 @/data hooks
import { useCountries } from '@/data'
const { items: countries } = useCountries()
```

### 3. 重複載入相同資料

```typescript
// ❌ 錯誤：多個組件各自載入
// ComponentA.tsx
const [countries, setCountries] = useState([])
useEffect(() => { loadCountries() }, [])

// ComponentB.tsx
const [countries, setCountries] = useState([])
useEffect(() => { loadCountries() }, [])

// ✅ 正確：使用共享的 SWR 快取
// ComponentA.tsx & ComponentB.tsx
const { items: countries } = useCountries() // 自動共享快取
```

## 進階用法

### 1. 篩選資料

```typescript
import { useMemo } from 'react'
import { useCountries } from '@/data'

function MyComponent({ selectedIds }: { selectedIds: string[] }) {
  const { items: allCountries } = useCountries()

  // 從完整列表篩選
  const filteredCountries = useMemo(() => {
    const idSet = new Set(selectedIds)
    return allCountries.filter(c => idSet.has(c.id))
  }, [allCountries, selectedIds])
}
```

### 2. O(1) 查詢

```typescript
import { useCountryDictionary } from '@/data'

function MyComponent({ countryId }: { countryId: string }) {
  const { get } = useCountryDictionary()

  // O(1) 查詢
  const country = get(countryId)
  return <div>{country?.name}</div>
}
```

### 3. CRUD 操作

```typescript
import { createCountry, updateCountry, deleteCountry, invalidateCountries } from '@/data'

// 建立
await createCountry({ name: '新國家', code: 'NC' })

// 更新
await updateCountry(countryId, { name: '更新的名稱' })

// 刪除
await deleteCountry(countryId)

// 手動使快取失效（通常不需要，CRUD 會自動處理）
await invalidateCountries()
```

## 快取策略

| 資料類型 | TTL | Stale Time | 範例 |
|---------|-----|------------|------|
| 低頻（基礎資料） | 1 小時 | 5 分鐘 | countries, regions, cities |
| 中頻（業務資料） | 5 分鐘 | 1 分鐘 | quotes, itineraries |
| 高頻（即時資料） | 1 分鐘 | 30 秒 | tours, orders |

## 遷移指南

如果你發現程式碼使用以下模式，請遷移到 @/data hooks：

1. `useRegionStore` → `useCountries`, `useRegions`, `useCities`
2. `supabase.from('countries')` → `useCountries`
3. `useState` + `useEffect` + Supabase → `@/data` hooks

## 相關文件

- `src/data/core/createEntityHook.ts` - Hook 工廠實作
- `src/data/core/types.ts` - 類型定義
- `src/data/entities/` - 各 Entity 定義
