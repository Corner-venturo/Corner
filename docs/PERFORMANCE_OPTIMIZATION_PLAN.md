# 效能優化方案

> **審計日期**：2026-01-12
> **目標**：解決「什麼都慢」的問題
> **參考**：cornerERP-master 舊系統 + 業界最佳實踐

---

## 一、問題根源分析

### 1.1 目前架構 vs cornerERP 架構

| 項目 | Venturo ERP (目前) | cornerERP (舊系統) | 問題 |
|------|-------------------|-------------------|------|
| **資料載入** | `select('*')` 全表 | Server-side filtering | 🔴 傳輸大量不必要資料 |
| **分頁** | 前端 `.slice()` | Server-side pagination | 🔴 先下載全部再切片 |
| **過濾** | 前端 `.filter()` | Query parameters | 🔴 先下載全部再過濾 |
| **關聯資料** | 載入所有 → `find()` | Dictionary pattern | 🔴 N+1 問題 |
| **快取策略** | SWR 簡單快取 | RTK Query + Tag invalidation | 🟡 快取控制較弱 |
| **條件載入** | 無 | `skip` parameter | 🔴 不需要也載入 |

### 1.2 具體問題程式碼

**旅遊團頁面 (`useTours-advanced.ts:22-34`)**：
```typescript
// ❌ 目前：載入所有旅遊團
async function fetchTours(): Promise<Tour[]> {
  const { data } = await supabase
    .from('tours')
    .select('*')  // 🔴 載入所有欄位
    .order('departure_date', { ascending: false })
    // 🔴 沒有 limit、沒有 filter
  return data as Tour[]
}

// 分頁在前端做（line 87-90）
const paginatedTours = processedTours.slice(start, start + pageSize)
```

**訂單頁面 (`orders/page.tsx:50-80`)**：
```typescript
// ❌ 目前：載入所有訂單，前端過濾
const { items: orders } = useOrdersListSlim()  // 載入全部
const { items: tours } = useToursListSlim()     // 又載入全部 tours

const filteredOrders = orders.filter(order => {  // 🔴 前端過濾
  // ...複雜過濾邏輯
})
```

---

## 二、cornerERP 解決方案

### 2.1 Server-side 過濾和分頁

```typescript
// cornerERP: Server-side filtering via API
const { data: suppliers } = useGetSuppliersQuery({
  limit: 200,           // Server-side limit
  query: searchTerm,    // Server-side search
  status: ['active']    // Server-side filter
});
```

### 2.2 條件載入 (Skip Pattern)

```typescript
// cornerERP: 只在需要時載入
const { data: customer } = useGetCustomerQuery(customerId, {
  skip: !customerId || isNewCustomer  // 🟢 不需要就不載入
});

const { data: groupOrders } = useGetInvoicesByGroupCodeQuery(groupCode, {
  skip: !selectedGroupCode  // 🟢 沒選擇就不載入
});
```

### 2.3 Dictionary Pattern (避免 N+1)

```typescript
// cornerERP: 建立查詢字典，避免 N+1
export function useSupplierDictionary() {
  const { data: suppliers = [] } = useGetSuppliersQuery();

  const dictionary = useMemo(() => {
    return suppliers.reduce((acc, supplier) => {
      acc[supplier.supplierCode] = supplier.supplierName;
      return acc;
    }, {});
  }, [suppliers]);

  return { dictionary, getSupplierName: (code) => dictionary[code] };
}

// 使用：O(1) 查詢
const name = getSupplierName(code)  // 🟢 直接查字典
```

### 2.4 Tag-based 快取失效

```typescript
// cornerERP: 精確的快取控制
invalidatesTags: (result, error, { invoiceNumber }) => [
  { type: 'invoice', id: invoiceNumber },  // 只失效這張發票
  'invoices'                                // 和發票列表
]
```

---

## 三、Venturo ERP 優化方案

### 3.1 Phase 1: Server-side Pagination (優先！)

**修改 `fetchTours` 函數：**

```typescript
// ✅ 優化後
async function fetchTours(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}): Promise<{ data: Tour[]; count: number }> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('tours')
    .select('*', { count: 'exact' })  // 取得總數
    .range(from, to)                   // Server-side 分頁
    .order('departure_date', { ascending: false });

  // Server-side 過濾
  if (params.status && params.status !== 'all') {
    if (params.status === 'archived') {
      query = query.eq('archived', true);
    } else {
      query = query.eq('status', params.status).neq('archived', true);
    }
  }

  // Server-side 搜尋
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,code.ilike.%${params.search}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return { data: data as Tour[], count: count || 0 };
}
```

### 3.2 Phase 2: 條件載入 (Skip Pattern)

```typescript
// ✅ 優化：需要時才載入
export function useOrdersByTour(tourId: string | null) {
  return useSWR(
    tourId ? `orders-by-tour-${tourId}` : null,  // null = skip
    async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('tour_id', tourId);
      return data;
    }
  );
}

// 使用
const { data: orders } = useOrdersByTour(
  selectedTourId  // 沒選擇時是 null，不會發請求
);
```

### 3.3 Phase 3: 建立 Dictionary Hooks

```typescript
// src/hooks/useDictionary.ts
export function useTourDictionary() {
  // 只載入 id 和 name，建立字典
  const { data } = useSWR('tour-dictionary', async () => {
    const { data } = await supabase
      .from('tours')
      .select('id, code, name, departure_date');
    return data;
  });

  const dictionary = useMemo(() => {
    return (data || []).reduce((acc, tour) => {
      acc[tour.id] = tour;
      return acc;
    }, {} as Record<string, Pick<Tour, 'id' | 'code' | 'name' | 'departure_date'>>);
  }, [data]);

  return {
    dictionary,
    getTourName: (id: string) => dictionary[id]?.name || '',
    getTourCode: (id: string) => dictionary[id]?.code || '',
  };
}
```

### 3.4 Phase 4: 建立 Query Builder

```typescript
// src/lib/supabase/query-builder.ts
export function createPaginatedQuery<T>(
  tableName: string,
  options: {
    page?: number;
    pageSize?: number;
    filters?: Record<string, unknown>;
    search?: { fields: string[]; query: string };
    orderBy?: { column: string; ascending?: boolean };
    select?: string;
  }
) {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(tableName)
    .select(options.select || '*', { count: 'exact' })
    .range(from, to);

  // Apply filters
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        query = query.eq(key, value);
      }
    });
  }

  // Apply search
  if (options.search?.query) {
    const searchConditions = options.search.fields
      .map(field => `${field}.ilike.%${options.search!.query}%`)
      .join(',');
    query = query.or(searchConditions);
  }

  // Apply order
  if (options.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? false,
    });
  }

  return query;
}
```

---

## 四、優先修復清單

### P0 - 立即修復（效能影響最大）

| # | 任務 | 檔案 | 預期改善 |
|---|------|------|---------|
| 1 | Tours 改 server-side pagination | `useTours-advanced.ts` | -90% 資料傳輸 |
| 2 | Orders 改 server-side pagination | `useListSlim.ts` / 新建 hook | -90% 資料傳輸 |
| 3 | Reports 頁面改 server-side filter | `unclosed-tours`, `monthly-*` | -95% 資料傳輸 |

### P1 - 本週修復

| # | 任務 | 檔案 |
|---|------|------|
| 4 | 建立 Dictionary hooks | 新建 `src/hooks/useDictionary.ts` |
| 5 | 建立 Query builder | 新建 `src/lib/supabase/query-builder.ts` |
| 6 | 實作 Skip pattern | 所有 detail hooks |

### P2 - 本月修復

| # | 任務 |
|---|------|
| 7 | 統一所有 `.items.filter()` 為 server-side |
| 8 | 加入 SWR 快取策略優化 |
| 9 | 考慮 RTK Query 遷移（長期） |

---

## 五、效能指標目標

| 指標 | 目前 | 目標 |
|------|------|------|
| Tours 列表載入 | 載入全部 (~100 筆 × 40 欄位) | 載入 20 筆 × 必要欄位 |
| Orders 列表載入 | 載入全部 (~500 筆) | 載入 20 筆 |
| 報表頁面載入 | 載入全部 + 前端過濾 | Server-side 過濾 |
| 關聯資料查詢 | O(n) find | O(1) dictionary |

---

## 六、程式碼範例：完整的 Server-side Hook

```typescript
// src/features/tours/hooks/useToursPaginated.ts
import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { Tour } from '@/stores/types';

interface UseToursPaginatedParams {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UseToursPaginatedResult {
  tours: Tour[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useToursPaginated(params: UseToursPaginatedParams): UseToursPaginatedResult {
  const { page, pageSize, status, search, sortBy = 'departure_date', sortOrder = 'desc' } = params;

  // 建立穩定的 SWR key
  const swrKey = `tours-paginated-${JSON.stringify(params)}`;

  const { data, error, isLoading, mutate } = useSWR(swrKey, async () => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('tours')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Server-side status filter
    if (status && status !== 'all') {
      if (status === 'archived') {
        query = query.eq('archived', true);
      } else {
        query = query.eq('status', status).neq('archived', true);
      }
    } else {
      query = query.neq('archived', true);
    }

    // Server-side search
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data: tours, count, error } = await query;
    if (error) throw error;

    return { tours: tours as Tour[], count: count || 0 };
  }, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  return {
    tours: data?.tours || [],
    totalCount: data?.count || 0,
    loading: isLoading,
    error: error?.message || null,
    refetch: () => mutate(),
  };
}
```

---

## 七、實施步驟

### Step 1: 建立新的 paginated hook (不破壞現有)

```bash
# 新建檔案
touch src/features/tours/hooks/useToursPaginated.ts
touch src/features/orders/hooks/useOrdersPaginated.ts
```

### Step 2: 逐步替換頁面使用

```typescript
// ToursPage.tsx
// 從
const { data: tours } = useTours(pageRequest);
// 改為
const { tours, totalCount } = useToursPaginated({
  page: currentPage,
  pageSize: 20,
  status: activeStatusTab,
  search: searchQuery,
});
```

### Step 3: 驗證效能改善

使用 Chrome DevTools Network tab 比較：
- 請求數量
- 傳輸資料量
- 載入時間

---

*報告生成日期：2026-01-12*
*目標：讓 Venturo ERP 像 cornerERP 一樣快！*

## Sources
- [ERP Performance Optimization Best Practices](https://www.linkedin.com/pulse/erp-system-performance-optimization-techniques-best-practices-af37c)
- [Database Performance in ERP Applications](https://ciglobaltech.com/blog/optimizing-database-performance-in-erp-applications-everyday-practices-that-make-a-difference/)
- [ERP Integration Guide](https://www.appseconnect.com/erp-integration-guide-best-practices/)
