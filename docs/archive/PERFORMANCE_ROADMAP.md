# Venturo ERP 效能優化路線圖

> **建立日期**：2026-01-12
> **目標**：讓系統快到飛起來

---

## 總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                    效能優化兩階段策略                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Phase 1: Server-side 優化        Phase 2: 離線預先載入          │
│   ┌─────────────────────┐         ┌─────────────────────┐       │
│   │ • Server-side 分頁   │         │ • Service Worker    │       │
│   │ • Server-side 過濾   │   ──►   │ • IndexedDB 快取    │       │
│   │ • Dictionary Pattern │         │ • 背景同步          │       │
│   │ • Skip Pattern       │         │ • 離線可用          │       │
│   └─────────────────────┘         └─────────────────────┘       │
│                                                                 │
│   效果：減少 90% 傳輸量            效果：重新整理秒開              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Server-side 優化（現階段）

### 1.1 目標

| 指標 | 目前 | 目標 | 改善幅度 |
|------|------|------|---------|
| Tours 列表載入 | ~100筆 × 40欄位 | 20筆 × 必要欄位 | -90% |
| Orders 列表載入 | ~500筆全部 | 20筆分頁 | -96% |
| 報表頁面載入 | 全部 + 前端過濾 | Server-side 過濾 | -95% |
| 關聯資料查詢 | O(n) find | O(1) dictionary | 顯著提升 |

### 1.2 實作項目

#### P0 - 立即修復

| # | 任務 | 檔案 | 狀態 |
|---|------|------|------|
| 1 | useToursPaginated hook | `src/features/tours/hooks/useToursPaginated.ts` | ✅ |
| 2 | useOrdersPaginated hook | `src/features/orders/hooks/useOrdersPaginated.ts` | ✅ |
| 3 | 報表頁面改 server-side filter | `unclosed-tours` | ✅ |

#### P1 - 本週修復

| # | 任務 | 檔案 | 狀態 |
|---|------|------|------|
| 4 | 統一資料層 + Dictionary | `src/hooks/useGlobalData.ts` | ✅ |
| 5 | Query builder | `src/lib/supabase/query-builder.ts` | ⬜ |
| 6 | Skip pattern 實作 | 各 detail hooks | ⬜ |

#### P2 - 本月修復

| # | 任務 | 狀態 |
|---|------|------|
| 7 | 統一所有 `.items.filter()` 為 server-side | ⬜ |
| 8 | SWR 快取策略優化 | ⬜ |

### 1.3 程式碼範本

#### Server-side Paginated Hook

```typescript
// src/features/tours/hooks/useToursPaginated.ts
import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import { Tour } from '@/stores/types'

interface UseToursPaginatedParams {
  page: number
  pageSize: number
  status?: string
  search?: string
}

export function useToursPaginated(params: UseToursPaginatedParams) {
  const { page, pageSize, status, search } = params
  const swrKey = `tours-paginated-${JSON.stringify(params)}`

  const { data, error, isLoading, mutate } = useSWR(swrKey, async () => {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('tours')
      .select('*', { count: 'exact' })
      .range(from, to)  // ✅ Server-side 分頁
      .order('departure_date', { ascending: false })

    // ✅ Server-side 狀態過濾
    if (status && status !== 'all') {
      if (status === 'archived') {
        query = query.eq('archived', true)
      } else {
        query = query.eq('status', status).neq('archived', true)
      }
    } else {
      query = query.neq('archived', true)
    }

    // ✅ Server-side 搜尋
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    }

    const { data: tours, count, error } = await query
    if (error) throw error

    return { tours: tours as Tour[], count: count || 0 }
  }, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  return {
    tours: data?.tours || [],
    totalCount: data?.count || 0,
    loading: isLoading,
    error: error?.message || null,
    refetch: () => mutate(),
  }
}
```

#### Dictionary Hook

```typescript
// src/hooks/useDictionary.ts
import useSWR from 'swr'
import { useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useTourDictionary() {
  const { data } = useSWR('tour-dictionary', async () => {
    const { data } = await supabase
      .from('tours')
      .select('id, code, name, departure_date')  // ✅ 只選必要欄位
    return data
  })

  const dictionary = useMemo(() => {
    return (data || []).reduce((acc, tour) => {
      acc[tour.id] = tour
      return acc
    }, {} as Record<string, { id: string; code: string; name: string; departure_date: string }>)
  }, [data])

  return {
    dictionary,
    getTourName: (id: string) => dictionary[id]?.name || '',
    getTourCode: (id: string) => dictionary[id]?.code || '',
  }
}
```

#### Skip Pattern

```typescript
// ✅ 需要時才載入
export function useOrdersByTour(tourId: string | null) {
  return useSWR(
    tourId ? `orders-by-tour-${tourId}` : null,  // null = skip
    async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('tour_id', tourId)
      return data
    }
  )
}
```

---

## Phase 2: 離線預先載入（下一階段）

### 2.1 架構概念

```
┌─────────────────────────────────────────────────────────────────┐
│                      離線預先載入架構                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   首次載入                                                       │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐                    │
│   │ Browser │ ──►│ Server  │ ──►│IndexedDB│                    │
│   └─────────┘    └─────────┘    └─────────┘                    │
│                                      │                          │
│   重新整理（秒開！）                    ▼                          │
│   ┌─────────┐    ┌─────────┐                                    │
│   │ Browser │◄── │IndexedDB│  （同時背景同步新資料）              │
│   └─────────┘    └─────────┘                                    │
│                       │                                         │
│                       ▼                                         │
│               ┌─────────────┐                                   │
│               │Service Worker│ ──► 背景同步更新                   │
│               └─────────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 技術選型

| 技術 | 用途 | 說明 |
|------|------|------|
| **Service Worker** | 攔截請求、背景同步 | PWA 核心技術 |
| **IndexedDB** | 本地資料儲存 | 大容量、結構化儲存 |
| **Dexie.js** | IndexedDB wrapper | 更好的 API |
| **SWR + stale-while-revalidate** | 快取策略 | 先顯示快取，背景更新 |

### 2.3 預計實作項目

| # | 任務 | 說明 |
|---|------|------|
| 1 | Service Worker 設置 | 攔截 API 請求 |
| 2 | IndexedDB 資料層 | 使用 Dexie.js |
| 3 | 預載入策略 | 登入後預載入常用資料 |
| 4 | 快取失效機制 | Supabase Realtime 觸發更新 |
| 5 | 離線 UI 提示 | 顯示離線狀態 |

### 2.4 預載入優先級

```typescript
// 登入後自動預載入
const PRELOAD_PRIORITY = {
  // 高優先級：立即載入
  HIGH: [
    'tours',           // 旅遊團列表
    'orders',          // 訂單列表
    'user-preferences' // 用戶設定
  ],

  // 中優先級：空閒時載入
  MEDIUM: [
    'customers',       // 客戶列表
    'suppliers',       // 供應商列表
    'employees',       // 員工列表
  ],

  // 低優先級：需要時才載入
  LOW: [
    'itineraries',     // 行程表
    'quotes',          // 報價單
    'reports',         // 報表資料
  ]
}
```

### 2.5 快取策略

```typescript
// 快取配置
const CACHE_CONFIG = {
  tours: {
    maxAge: 5 * 60 * 1000,        // 5 分鐘
    staleWhileRevalidate: true,   // 先顯示舊資料
    realtimeSync: true,           // 即時同步
  },
  orders: {
    maxAge: 2 * 60 * 1000,        // 2 分鐘
    staleWhileRevalidate: true,
    realtimeSync: true,
  },
  customers: {
    maxAge: 30 * 60 * 1000,       // 30 分鐘
    staleWhileRevalidate: true,
    realtimeSync: false,          // 不需即時同步
  },
}
```

### 2.6 效果預估

| 場景 | 目前 | Phase 2 後 |
|------|------|-----------|
| 首次載入 | 2-3 秒 | 2-3 秒（無變化）|
| 重新整理 | 2-3 秒 | <100ms（秒開！）|
| 切換頁面 | 0.5-1 秒 | <50ms |
| 離線使用 | 無法使用 | 可讀取（無法寫入）|

---

## 時程規劃

```
2026-01
├── Week 2 (現在)
│   ├── ✅ 效能分析完成
│   ├── ✅ 文檔建立完成
│   └── ⬜ Phase 1 P0 實作
│
├── Week 3
│   ├── ⬜ Phase 1 P1 實作
│   └── ⬜ Phase 1 P2 實作
│
├── Week 4
│   └── ⬜ Phase 1 測試與優化
│
2026-02
├── Week 1-2
│   └── ⬜ Phase 2 架構設計
│
├── Week 3-4
│   └── ⬜ Phase 2 實作
```

---

## 驗證方式

### Phase 1 驗證

```bash
# Chrome DevTools Network Tab
1. 記錄目前請求大小
2. 實作後比較傳輸量
3. 目標：減少 90%+
```

### Phase 2 驗證

```bash
# Lighthouse Performance
1. 記錄目前 TTI (Time to Interactive)
2. 實作後重新測量
3. 目標：重新整理 <100ms
```

---

## 相關文件

| 文件 | 說明 |
|------|------|
| `docs/PERFORMANCE_OPTIMIZATION_PLAN.md` | Phase 1 詳細方案 |
| `docs/LOGIC_DUPLICATION_AND_PERFORMANCE_AUDIT.md` | 問題審計報告 |
| `docs/ARCHITECTURE_STANDARDS.md` | 系統架構規範 |

---

*文件建立日期：2026-01-12*
*目標：讓 Venturo ERP 像 cornerERP 一樣快，然後更快！*
