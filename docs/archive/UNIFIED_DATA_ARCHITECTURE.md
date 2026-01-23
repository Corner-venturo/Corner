# Venturo ERP 統一資料架構

> **建立日期**：2026-01-12
> **目標**：一個媽媽生的 - 所有資料存取都用同一套模式

---

## 一、架構總覽

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Venturo ERP 統一架構                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     UI Layer (Components)                    │   │
│  │  Pages, Dialogs, Forms...                                    │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│                             │ useEntity() hooks                     │
│                             ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Data Access Layer                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │   │
│  │  │ useTours()  │  │ useOrders() │  │ useMembers()│  ...    │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │   │
│  │         └────────────────┼────────────────┘                 │   │
│  │                          ▼                                   │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │              createEntityHook() Factory              │   │   │
│  │  │  - 統一 CRUD                                         │   │   │
│  │  │  - 統一快取策略                                       │   │   │
│  │  │  - 統一錯誤處理                                       │   │   │
│  │  │  - 統一 loading 狀態                                  │   │   │
│  │  └──────────────────────┬──────────────────────────────┘   │   │
│  └─────────────────────────┼───────────────────────────────────┘   │
│                            │                                        │
│                            │ SWR + Supabase                         │
│                            ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Global Cache (SWR)                        │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │   │
│  │  │ tours  │ │ orders │ │members │ │ quotes │  ...          │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘              │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Supabase                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、核心概念

### 2.1 單一模式：createEntityHook

所有資料存取都透過同一個 factory function 建立，確保一致性：

```typescript
// 定義一次，到處使用
export const useTours = createEntityHook<Tour>('tours', {
  // 列表配置
  list: {
    select: '*',
    orderBy: { column: 'departure_date', ascending: false },
  },
  // 精簡版配置（列表顯示用）
  slim: {
    select: 'id,code,name,departure_date,status',
  },
  // 單筆配置
  detail: {
    select: '*',
  },
  // 快取配置
  cache: {
    ttl: 60000,           // 60 秒快取
    staleTime: 30000,     // 30 秒內視為新鮮
    dedupe: true,         // 去重複請求
  },
})
```

### 2.2 統一介面

所有 entity hook 都有相同的介面：

```typescript
interface EntityHook<T> {
  // 資料
  items: T[]
  item: T | null
  loading: boolean
  error: string | null

  // 列表操作
  list: () => { items: T[], loading: boolean, error: string | null }
  listSlim: () => { items: Partial<T>[], loading: boolean }
  listPaginated: (params: PaginationParams) => PaginatedResult<T>
  listByFilter: (filter: FilterParams) => { items: T[], loading: boolean }

  // 單筆操作
  get: (id: string) => { item: T | null, loading: boolean }

  // CRUD
  create: (data: CreateData<T>) => Promise<T>
  update: (id: string, data: Partial<T>) => Promise<T>
  delete: (id: string) => Promise<boolean>

  // 快取
  refresh: () => Promise<void>
  invalidate: () => void

  // Dictionary（快速查詢）
  dictionary: Record<string, T>
  getById: (id: string) => T | undefined
  getNameById: (id: string) => string
}
```

### 2.3 快取策略

```typescript
// 全域快取配置
const CACHE_CONFIG = {
  // 高頻資料（tours, orders）
  high: {
    ttl: 60000,           // 1 分鐘
    staleTime: 30000,     // 30 秒
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  },
  // 中頻資料（quotes, itineraries）
  medium: {
    ttl: 300000,          // 5 分鐘
    staleTime: 60000,     // 1 分鐘
    revalidateOnFocus: false,
  },
  // 低頻資料（regions, settings）
  low: {
    ttl: 3600000,         // 1 小時
    staleTime: 300000,    // 5 分鐘
    revalidateOnFocus: false,
  },
}
```

---

## 三、檔案結構

```
src/
├── data/                          # 📁 新的統一資料層
│   ├── core/
│   │   ├── createEntityHook.ts    # Factory function
│   │   ├── types.ts               # 統一型別定義
│   │   ├── cache.ts               # 快取策略
│   │   └── fetcher.ts             # Supabase fetcher
│   │
│   ├── entities/                  # 各 entity 定義
│   │   ├── tours.ts               # useTours
│   │   ├── orders.ts              # useOrders
│   │   ├── members.ts             # useMembers
│   │   ├── quotes.ts              # useQuotes
│   │   ├── itineraries.ts         # useItineraries
│   │   ├── customers.ts           # useCustomers
│   │   └── index.ts               # 統一 export
│   │
│   ├── composites/                # 組合 hooks
│   │   ├── useTourWithOrders.ts   # Tour + 關聯 Orders
│   │   ├── useOrderWithMembers.ts # Order + 關聯 Members
│   │   └── index.ts
│   │
│   └── index.ts                   # 主要 export
│
├── stores/                        # 📁 保留但精簡化
│   └── auth-store.ts              # 只保留認證相關
│
└── hooks/                         # 📁 UI 相關 hooks
    ├── useDialog.ts
    ├── useForm.ts
    └── ...
```

---

## 四、實作細節

### 4.1 createEntityHook Factory

```typescript
// src/data/core/createEntityHook.ts

import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

interface EntityConfig<T> {
  list?: {
    select: string
    orderBy?: { column: keyof T; ascending: boolean }
    filter?: Record<string, unknown>
  }
  slim?: {
    select: string
  }
  detail?: {
    select: string
  }
  cache?: {
    ttl?: number
    staleTime?: number
    dedupe?: boolean
  }
}

export function createEntityHook<T extends { id: string }>(
  tableName: string,
  config: EntityConfig<T>
) {
  const cacheKey = `entity-${tableName}`
  const cacheKeySlim = `entity-${tableName}-slim`

  // 預設快取配置
  const cacheConfig = {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: config.cache?.staleTime || 30000,
  }

  // ============================================
  // List Hook
  // ============================================
  function useList() {
    const { user, isAuthenticated, _hasHydrated } = useAuthStore()
    const swrKey = _hasHydrated && isAuthenticated && user?.id ? cacheKey : null

    const { data, error, isLoading, mutate: mutateSelf } = useSWR<T[]>(
      swrKey,
      async () => {
        let query = supabase
          .from(tableName as 'tours')
          .select(config.list?.select || '*')

        if (config.list?.orderBy) {
          query = query.order(
            config.list.orderBy.column as string,
            { ascending: config.list.orderBy.ascending }
          )
        }

        const { data, error } = await query
        if (error) throw error
        return data as unknown as T[]
      },
      cacheConfig
    )

    return {
      items: data || [],
      loading: !_hasHydrated || isLoading,
      error: error?.message || null,
      refresh: () => mutateSelf(),
    }
  }

  // ============================================
  // List Slim Hook（精簡版）
  // ============================================
  function useListSlim() {
    const { user, isAuthenticated, _hasHydrated } = useAuthStore()
    const swrKey = _hasHydrated && isAuthenticated && user?.id ? cacheKeySlim : null

    const { data, error, isLoading } = useSWR<Partial<T>[]>(
      swrKey,
      async () => {
        const { data, error } = await supabase
          .from(tableName as 'tours')
          .select(config.slim?.select || 'id')

        if (error) throw error
        return data as unknown as Partial<T>[]
      },
      cacheConfig
    )

    return {
      items: data || [],
      loading: !_hasHydrated || isLoading,
      error: error?.message || null,
    }
  }

  // ============================================
  // Detail Hook（單筆 + Skip Pattern）
  // ============================================
  function useDetail(id: string | null) {
    const { user, isAuthenticated, _hasHydrated } = useAuthStore()
    const swrKey = _hasHydrated && isAuthenticated && user?.id && id
      ? `${cacheKey}-${id}`
      : null

    const { data, error, isLoading, mutate: mutateSelf } = useSWR<T | null>(
      swrKey,
      async () => {
        if (!id) return null

        const { data, error } = await supabase
          .from(tableName as 'tours')
          .select(config.detail?.select || '*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data as unknown as T
      },
      cacheConfig
    )

    return {
      item: data || null,
      loading: !_hasHydrated || isLoading,
      error: error?.message || null,
      refresh: () => mutateSelf(),
    }
  }

  // ============================================
  // Paginated Hook
  // ============================================
  function usePaginated(params: {
    page: number
    pageSize: number
    filter?: Record<string, unknown>
    search?: string
    searchFields?: string[]
  }) {
    const { user, isAuthenticated, _hasHydrated } = useAuthStore()
    const swrKey = _hasHydrated && isAuthenticated && user?.id
      ? `${cacheKey}-paginated-${JSON.stringify(params)}`
      : null

    const { data, error, isLoading, mutate: mutateSelf } = useSWR(
      swrKey,
      async () => {
        const from = (params.page - 1) * params.pageSize
        const to = from + params.pageSize - 1

        let query = supabase
          .from(tableName as 'tours')
          .select(config.list?.select || '*', { count: 'exact' })
          .range(from, to)

        // Apply filters
        if (params.filter) {
          Object.entries(params.filter).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== 'all') {
              query = query.eq(key, value)
            }
          })
        }

        // Apply search
        if (params.search && params.searchFields?.length) {
          const searchConditions = params.searchFields
            .map(field => `${field}.ilike.%${params.search}%`)
            .join(',')
          query = query.or(searchConditions)
        }

        // Apply order
        if (config.list?.orderBy) {
          query = query.order(
            config.list.orderBy.column as string,
            { ascending: config.list.orderBy.ascending }
          )
        }

        const { data, count, error } = await query
        if (error) throw error

        return {
          items: data as unknown as T[],
          totalCount: count || 0,
        }
      },
      cacheConfig
    )

    return {
      items: data?.items || [],
      totalCount: data?.totalCount || 0,
      loading: !_hasHydrated || isLoading,
      error: error?.message || null,
      refresh: () => mutateSelf(),
    }
  }

  // ============================================
  // Dictionary Hook（O(1) 查詢）
  // ============================================
  function useDictionary() {
    const { items, loading } = useListSlim()

    const dictionary = (items || []).reduce((acc, item) => {
      if (item.id) {
        acc[item.id] = item
      }
      return acc
    }, {} as Record<string, Partial<T>>)

    return {
      dictionary,
      loading,
      get: (id: string) => dictionary[id],
    }
  }

  // ============================================
  // CRUD Operations
  // ============================================
  async function create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const now = new Date().toISOString()
    const newItem = {
      ...data,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    }

    const { data: created, error } = await supabase
      .from(tableName as 'tours')
      .insert(newItem as Record<string, unknown>)
      .select()
      .single()

    if (error) throw error

    // Invalidate cache
    await mutate((key: string) => key?.startsWith(cacheKey), undefined, { revalidate: true })

    return created as unknown as T
  }

  async function update(id: string, data: Partial<T>): Promise<T> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    }

    const { data: updated, error } = await supabase
      .from(tableName as 'tours')
      .update(updateData as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Invalidate cache
    await mutate((key: string) => key?.startsWith(cacheKey), undefined, { revalidate: true })

    return updated as unknown as T
  }

  async function remove(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(tableName as 'tours')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Invalidate cache
    await mutate((key: string) => key?.startsWith(cacheKey), undefined, { revalidate: true })

    return true
  }

  // ============================================
  // Return All Hooks
  // ============================================
  return {
    useList,
    useListSlim,
    useDetail,
    usePaginated,
    useDictionary,
    create,
    update,
    delete: remove,
    // 快取控制
    invalidate: () => mutate((key: string) => key?.startsWith(cacheKey)),
  }
}
```

### 4.2 Entity 定義範例

```typescript
// src/data/entities/tours.ts

import { createEntityHook } from '../core/createEntityHook'
import { Tour } from '@/stores/types'

export const tourEntity = createEntityHook<Tour>('tours', {
  list: {
    select: '*',
    orderBy: { column: 'departure_date', ascending: false },
  },
  slim: {
    select: 'id,code,name,departure_date,status,location,current_participants',
  },
  detail: {
    select: '*',
  },
  cache: {
    ttl: 60000,
    staleTime: 30000,
  },
})

// 導出便捷 hooks
export const useTours = tourEntity.useList
export const useToursSlim = tourEntity.useListSlim
export const useTour = tourEntity.useDetail
export const useToursPaginated = tourEntity.usePaginated
export const useTourDictionary = tourEntity.useDictionary

// 導出 CRUD
export const createTour = tourEntity.create
export const updateTour = tourEntity.update
export const deleteTour = tourEntity.delete
```

```typescript
// src/data/entities/orders.ts

import { createEntityHook } from '../core/createEntityHook'
import { Order } from '@/stores/types'

export const orderEntity = createEntityHook<Order>('orders', {
  list: {
    select: '*',
    orderBy: { column: 'created_at', ascending: false },
  },
  slim: {
    select: 'id,order_number,tour_id,tour_name,contact_person,payment_status,member_count',
  },
  detail: {
    select: '*',
  },
  cache: {
    ttl: 60000,
    staleTime: 30000,
  },
})

export const useOrders = orderEntity.useList
export const useOrdersSlim = orderEntity.useListSlim
export const useOrder = orderEntity.useDetail
export const useOrdersPaginated = orderEntity.usePaginated
export const useOrderDictionary = orderEntity.useDictionary

export const createOrder = orderEntity.create
export const updateOrder = orderEntity.update
export const deleteOrder = orderEntity.delete
```

### 4.3 統一 Export

```typescript
// src/data/index.ts

// Entities
export * from './entities/tours'
export * from './entities/orders'
export * from './entities/members'
export * from './entities/quotes'
export * from './entities/itineraries'
export * from './entities/customers'

// Core（如果需要自訂）
export { createEntityHook } from './core/createEntityHook'
```

---

## 五、使用方式

### 5.1 列表頁面

```typescript
// Before ❌
import { useTourStore } from '@/stores'

function ToursPage() {
  const tourStore = useTourStore()

  useEffect(() => {
    tourStore.fetchAll()
  }, [])

  const tours = tourStore.items.filter(...)

  return <Table data={tours} />
}

// After ✅
import { useToursPaginated } from '@/data'

function ToursPage() {
  const { items: tours, totalCount, loading } = useToursPaginated({
    page: currentPage,
    pageSize: 20,
    filter: { status: activeTab },
    search: searchQuery,
    searchFields: ['name', 'code'],
  })

  return <Table data={tours} totalCount={totalCount} loading={loading} />
}
```

### 5.2 詳細頁面 / Dialog

```typescript
// Before ❌
function TourDetailDialog({ tourId }) {
  const tourStore = useTourStore()

  useEffect(() => {
    tourStore.fetchAll()  // 載入全部只為了找一筆
  }, [])

  const tour = tourStore.items.find(t => t.id === tourId)

  return <div>{tour?.name}</div>
}

// After ✅
import { useTour } from '@/data'

function TourDetailDialog({ tourId }) {
  const { item: tour, loading } = useTour(tourId)  // Skip pattern: tourId 為 null 不請求

  if (loading) return <Loading />
  return <div>{tour?.name}</div>
}
```

### 5.3 ID → Name 轉換

```typescript
// Before ❌
const tourStore = useTourStore()
const tour = tourStore.items.find(t => t.id === order.tour_id)  // O(n)
const tourName = tour?.name || ''

// After ✅
import { useTourDictionary } from '@/data'

const { get } = useTourDictionary()
const tourName = get(order.tour_id)?.name || ''  // O(1)
```

### 5.4 CRUD 操作

```typescript
// Before ❌
const tourStore = useTourStore()
await tourStore.create(data)
await tourStore.update(id, data)
await tourStore.delete(id)

// After ✅
import { createTour, updateTour, deleteTour } from '@/data'

await createTour(data)
await updateTour(id, data)
await deleteTour(id)
// 快取自動失效，相關 hooks 自動更新
```

---

## 六、遷移計畫

### Phase 1: 建立核心（1-2 天）
- [ ] 建立 `src/data/core/createEntityHook.ts`
- [ ] 建立型別定義
- [ ] 建立 tours entity 作為範本

### Phase 2: 遷移主要 entities（2-3 天）
- [ ] tours
- [ ] orders
- [ ] members
- [ ] quotes
- [ ] itineraries

### Phase 3: 遷移頁面（漸進式）
- [ ] 從最常用的頁面開始
- [ ] 保持舊 store 可用，逐步替換
- [ ] 每個頁面獨立測試

### Phase 4: 清理（1 天）
- [ ] 移除未使用的 store 方法
- [ ] 移除舊的 fetchAll 呼叫
- [ ] 更新文檔

---

## 七、效益

| 指標 | Before | After |
|------|--------|-------|
| 程式碼一致性 | 各頁面各自實作 | 統一 factory |
| 快取命中率 | ~0%（每次都 fetch）| ~80%+ |
| 首次載入請求數 | 5-10 個（瀑布式）| 1-2 個（平行）|
| 重複程式碼 | 大量 fetchAll | 0 |
| ID→Name 查詢 | O(n) find | O(1) dictionary |
| 維護難度 | 高（分散各處）| 低（集中管理）|

---

*文件建立日期：2026-01-12*
*目標：一個媽媽生的統一架構*
