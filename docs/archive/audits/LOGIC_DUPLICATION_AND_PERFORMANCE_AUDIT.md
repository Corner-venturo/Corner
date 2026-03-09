# 邏輯重複與效能審計報告

> **審計日期**：2026-01-12
> **目標**：找出邏輯重複、抽象層優化機會、效能瓶頸

---

## 一、邏輯重複問題

### 1.1 🔴 嚴重：getCurrentUserContext 重複實作

**問題**：相同邏輯在 2 個檔案中重複實作

| 檔案                              | 行號  | 說明           |
| --------------------------------- | ----- | -------------- |
| `src/stores/core/create-store.ts` | 54-76 | 完整實作       |
| `src/hooks/createCloudHook.ts`    | 28-47 | 完全相同的實作 |

**程式碼對比**：

```typescript
// 兩處完全相同的程式碼（約 20 行）
function getCurrentUserContext(): { workspaceId: string | null; userRole: UserRole | null } {
  if (typeof window === 'undefined') return { workspaceId: null, userRole: null }
  try {
    const authData = localStorage.getItem('auth-storage')
    // ... 解析 authData
  } catch {
    // ignore
  }
  return { workspaceId: null, userRole: null }
}
```

**影響**：

- 維護負擔：修改時需同步兩處
- 不一致風險：容易漏改一處

**解決方案**：

```typescript
// src/lib/workspace-helpers.ts（已存在但未使用）
export function getCurrentUserContext() { ... }

// 其他檔案改為 import
import { getCurrentUserContext } from '@/lib/workspace-helpers'
```

---

### 1.2 🔴 嚴重：generateUUID 重複實作

**問題**：UUID 生成邏輯在 2 個檔案中重複

| 檔案                              | 行號  |
| --------------------------------- | ----- |
| `src/stores/core/create-store.ts` | 31-48 |
| `src/hooks/useTodos.ts`           | 24-38 |

**解決方案**：

```typescript
// 已有 src/lib/utils/uuid.ts，應統一使用
import { generateUUID } from '@/lib/utils/uuid'
```

---

### 1.3 🟡 中等：API 處理結構重複

**問題**：3 個會計 API 有幾乎相同的處理結構

| 檔案                                             |
| ------------------------------------------------ |
| `/api/accounting/post/customer-receipt/route.ts` |
| `/api/accounting/post/supplier-payment/route.ts` |
| `/api/accounting/post/group-settlement/route.ts` |

**重複的模式**（約 40 行）：

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, user_id, ...requestData } = body

    if (!workspace_id || !user_id) {
      return NextResponse.json({ success: false, error: '缺少...' }, { status: 400 })
    }
    // ... 驗證
    const result = await postXxxFunction(...)
    return NextResponse.json(result)
  } catch (error) {
    logger.error('操作失敗:', error)
    return NextResponse.json({ success: false, error: '伺服器錯誤' }, { status: 500 })
  }
}
```

**解決方案**：建立共用 middleware

```typescript
// src/lib/api/accounting-handler.ts
export function createAccountingHandler<T>(
  postFunction: (workspaceId: string, userId: string, data: T) => Promise<Result>,
  requiredFields: (keyof T)[]
) {
  return async (request: NextRequest) => { ... }
}
```

---

### 1.4 🟡 中等：錯誤訊息提取重複

**問題**：相同的錯誤處理模式出現 20+ 次

**重複的程式碼**：

```typescript
error instanceof Error ? error.message : 'Unknown error'
```

**出現位置**（部分）：

- `src/app/api/cron/ticket-status/route.ts:57`
- `src/app/api/gemini/generate-image/route.ts:105, 173`
- `src/app/api/ocr/passport/route.ts:109, 136`
- `src/app/api/proposals/convert-to-tour/route.ts:273`
- 等 20+ 處

**解決方案**：

```typescript
// src/lib/utils/error.ts
export function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}
```

---

## 二、效能問題（嚴重！）

### 2.1 🔴🔴🔴 極嚴重：全表讀取後前端過濾

**問題**：多個頁面載入整個表格，然後在前端用 JS 過濾

**嚴重案例**：

| 頁面                            | 問題                                            | 影響                                 |
| ------------------------------- | ----------------------------------------------- | ------------------------------------ |
| `unclosed-tours/page.tsx`       | `fetchAll()` 載入所有 tours，前端 `filter()`    | 若有 1000 團，全部下載後只顯示 10 個 |
| `monthly-disbursement/page.tsx` | 載入所有 payment_requests + disbursement_orders | 兩個大表全部下載                     |
| `monthly-income/page.tsx`       | 載入所有 receipt_orders                         | 全表下載                             |

**具體程式碼**：

```typescript
// unclosed-tours/page.tsx:70-72
useEffect(() => {
  tourStore.fetchAll()  // 載入 ALL tours
}, [])

// 然後在 useMemo 中過濾
const unclosedTours = useMemo(() => {
  return tourStore.items.filter(tour => { ... })  // 前端過濾
}, [tourStore.items])
```

**影響**：

- 初次載入慢（需下載整個表）
- 頻寬浪費（傳輸大量不需要的資料）
- 記憶體佔用高（前端存放完整資料）
- 每次 fetchAll 都重新下載

**解決方案**：伺服器端過濾

```typescript
// 方案 1: 在 Store 中加入過濾查詢
// stores/tour-store.ts
fetchUnclosedTours: async () => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 7)

  const { data } = await supabase
    .from('tours')
    .select('*')
    .neq('closing_status', 'closed')
    .neq('status', '結案')
    .neq('status', '取消')
    .lte('return_date', cutoffDate.toISOString().split('T')[0])

  return data
}

// 方案 2: 建立專用 API
// /api/reports/unclosed-tours/route.ts
export async function GET() {
  const supabase = getSupabaseAdminClient()
  const { data } = await supabase
    .from('tours')
    .select('*')
    .neq('closing_status', 'closed')
    .lte('return_date', cutoffDate)
  return successResponse(data)
}
```

---

### 2.2 🔴🔴 嚴重：.items.filter 模式泛濫

**問題**：發現 30+ 處使用 `store.items.filter()` 模式

**高風險案例**：

| 檔案                                 | 程式碼                                                | 問題                     |
| ------------------------------------ | ----------------------------------------------------- | ------------------------ |
| `orders/page.tsx:169`                | `orders.filter(o => o.tour_id === ...)`               | 載入所有訂單找一個團的   |
| `region-store.ts:231`                | `regionStore.items.filter(r => r.country_id === ...)` | 可用 Supabase 查詢       |
| `region-store.ts:245`                | `cityStore.items.filter(c => c.region_id === ...)`    | 可用 Supabase 查詢       |
| `quick-add/hooks/useQuickAdd.ts:133` | `memberStore.items.filter(m => m.order_id === ...)`   | 載入所有成員找一個訂單的 |

**正確做法**：

```typescript
// ❌ 錯誤：前端過濾
const tourOrders = orderStore.items.filter(o => o.tour_id === tourId)

// ✅ 正確：Supabase 查詢
const { data: tourOrders } = await supabase.from('orders').select('*').eq('tour_id', tourId)
```

---

### 2.3 🔴 嚴重：缺乏分頁機制

**問題**：報表頁面沒有分頁，當資料量增加會越來越慢

**受影響頁面**：

- `monthly-disbursement/page.tsx`
- `monthly-income/page.tsx`
- `unclosed-tours/page.tsx`
- `pnrs/page.tsx`

**解決方案**：

```typescript
// 1. Store 支援分頁
fetchPaginated: async (page: number, pageSize: number, filters: Filters) => {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count } = await supabase
    .from('table')
    .select('*', { count: 'exact' })
    .range(from, to)
    .eq('status', filters.status)

  return { data, total: count }
}

// 2. 頁面使用分頁
const [page, setPage] = useState(1)
const { data, total } = usePaginatedData(page, 20, filters)
```

---

### 2.4 🟡 關聯資料載入問題

**問題**：載入父表格來取得子表格資料

**案例**：

```typescript
// 為了取得某個訂單的成員，載入所有成員
const existingMembers = memberStore.items.filter(m => m.order_id === orderId)
```

**正確做法**：使用 Supabase join 或直接查詢

```typescript
// 方案 1: 直接查詢
const { data } = await supabase.from('order_members').select('*').eq('order_id', orderId)

// 方案 2: 使用 join（如果需要關聯資料）
const { data } = await supabase
  .from('orders')
  .select(
    `
    *,
    members:order_members(*)
  `
  )
  .eq('id', orderId)
  .single()
```

---

## 三、抽象層優化建議

### 3.1 建立共用工具函數

| 工具                      | 位置                           | 用途                 |
| ------------------------- | ------------------------------ | -------------------- |
| `getCurrentUserContext()` | `src/lib/workspace-helpers.ts` | 統一取得使用者上下文 |
| `generateUUID()`          | `src/lib/utils/uuid.ts`        | 統一 UUID 生成       |
| `errorToMessage()`        | `src/lib/utils/error.ts`       | 統一錯誤訊息提取     |

### 3.2 建立 API 中間件

```typescript
// src/lib/api/middleware/with-workspace-auth.ts
export function withWorkspaceAuth<T>(
  handler: (req: NextRequest, context: AuthContext) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse('請先登入', 401, ErrorCode.UNAUTHORIZED)
    }
    return handler(req, auth.data)
  }
}
```

### 3.3 建立查詢 Builder

```typescript
// src/lib/supabase/query-builder.ts
export function createFilteredQuery<T>(
  tableName: string,
  options: {
    workspaceScoped?: boolean
    filters?: Record<string, unknown>
    pagination?: { page: number; pageSize: number }
    orderBy?: { column: string; ascending?: boolean }
  }
) {
  // 統一處理 workspace 過濾、分頁、排序
}
```

---

## 四、優先修復建議

### Phase 1：立即修復（效能影響最大）

| #   | 任務                                | 影響               |
| --- | ----------------------------------- | ------------------ |
| 1   | `unclosed-tours` 改用 Supabase 查詢 | 減少 90%+ 資料傳輸 |
| 2   | `monthly-disbursement` 加入日期過濾 | 減少 90%+ 資料傳輸 |
| 3   | `monthly-income` 加入日期過濾       | 減少 90%+ 資料傳輸 |

### Phase 2：統一工具函數

| #   | 任務                                                 |
| --- | ---------------------------------------------------- |
| 1   | 統一 `getCurrentUserContext` 到 workspace-helpers.ts |
| 2   | 統一 `generateUUID` 到 uuid.ts                       |
| 3   | 建立 `errorToMessage` 工具函數                       |

### Phase 3：架構優化

| #   | 任務                            |
| --- | ------------------------------- |
| 1   | 建立 API 中間件系統             |
| 2   | 建立分頁查詢 helper             |
| 3   | 審查所有 `.items.filter()` 使用 |

---

## 五、效能問題統計

| 問題類型               | 數量    | 嚴重程度      |
| ---------------------- | ------- | ------------- |
| 全表讀取後前端過濾     | 3+ 頁面 | 🔴🔴🔴 極嚴重 |
| `.items.filter()` 模式 | 30+ 處  | 🔴🔴 嚴重     |
| 缺乏分頁               | 5+ 頁面 | 🔴 嚴重       |
| 重複載入父表           | 10+ 處  | 🟡 中等       |

---

_報告生成日期：2026-01-12_
_建議：優先處理效能問題，對使用者體驗影響最大_
