# Venturo 效能開發規範

> **最後更新**: 2026-01-23
> **適用範圍**: 後端查詢優化、前端效能、快取架構、資料載入策略

---

## 🚨 核心原則

1. **登入速度 = 用戶體驗** - 任何功能都不能讓登入變慢
2. **只載入眼睛現在要看的** - 避免過度讀取
3. **寫入時計算，讀取時直接用** - 快取策略

---

## ❌ 絕對禁止的效能殺手

### 1. API route 內直接 createClient

```typescript
// ❌ 每次請求都建新連線，浪費 200-500ms
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)

// ✅ 使用單例模式
import { getSupabase } from '@/lib/supabase-server'
const supabase = getSupabase()  // 重用連線
```

### 2. N+1 查詢 (map + await)

```typescript
// ❌ 10 筆 = 10 次查詢
const results = await Promise.all(
  items.map(async (item) => {
    return await supabase.from('table').select().eq('id', item.id)
  })
)

// ✅ 批量查詢，1 次取得所有
const itemIds = items.map(i => i.id)
const { data } = await supabase
  .from('table')
  .select()
  .in('id', itemIds)
```

### 3. Waterfall 查詢

```typescript
// ❌ 序列執行，總時間 = 每個查詢時間的總和
const users = await supabase.from('users').select()
const orders = await supabase.from('orders').select()
const items = await supabase.from('items').select()

// ✅ 平行執行，總時間 = 最慢查詢的時間
const [users, orders, items] = await Promise.all([
  supabase.from('users').select(),
  supabase.from('orders').select(),
  supabase.from('items').select(),
])
```

### 4. 每次讀取都 JOIN 多個表

```typescript
// ❌ 登入時即時 JOIN 計算
const tours = await supabase
  .from('tours')
  .select('*, orders(*), order_members(*), itineraries(*)')

// ✅ 使用快取表，直接讀取
const { data } = await supabase
  .from('traveler_tour_cache')
  .select('*')
  .eq('user_id', userId)
```

---

## 📊 效能檢查清單（新增 API 時）

- [ ] 是否重用 Supabase 連線（單例模式）？
- [ ] 是否有 `.map(async)` 內做資料庫查詢？（改用 `.in()` 批量）
- [ ] 多個獨立查詢是否用 `Promise.all` 平行執行？
- [ ] 能否用 join/select 減少查詢次數？
- [ ] JOIN 超過 2 個表？考慮建立快取表

---

## 🗄️ 快取架構規範

### 核心概念：寫入時計算

```
寫入時計算（ERP 端觸發）：
  ERP 建立訂單 → 自動更新快取表 → 會員登入直接讀（快！）

而不是：
  會員登入 → 即時 JOIN 計算 → 慢！
```

### 快取表設計模式

```sql
-- 1. 建立快取表（預先計算好的資料）
CREATE TABLE xxx_cache (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,

  -- 快取的資料（從多個表 JOIN 計算出來的）
  cached_field_1 text,
  cached_field_2 jsonb,

  -- 快取元資料
  cached_at timestamptz DEFAULT now(),
  source_updated_at timestamptz
);

-- 2. 來源資料變更時，自動更新快取
CREATE TRIGGER trigger_refresh_cache
AFTER INSERT OR UPDATE ON source_table
FOR EACH ROW
EXECUTE FUNCTION auto_refresh_cache();

-- 3. 使用者讀取時，直接查快取表（單表查詢）
SELECT * FROM xxx_cache WHERE user_id = auth.uid();
```

### 已實作的快取表

| 快取表 | 來源 | 觸發時機 |
|--------|------|---------|
| `traveler_tour_cache` | tours + orders + order_members + itineraries | order_members 新增/修改、tours 修改 |

### 應該使用快取的功能

| 功能 | 建議快取表 | 觸發時機 |
|------|-----------|---------|
| 未讀訊息數 | `user_unread_counts` | 訊息新增時 |
| 用戶統計 | `user_stats_cache` | 相關資料變更時 |
| 權限快取 | `user_permissions_cache` | 角色變更時 |
| 通知數量 | `notification_counts` | 通知新增時 |

### 快取檢查清單

開發任何需要「跨表查詢」的功能前，問自己：

- [ ] **登入時會觸發嗎？** 如果是，必須用快取表！
- [ ] **頻繁讀取嗎？** 如果 >10次/天/用戶，考慮快取
- [ ] **JOIN 幾個表？** 如果 >2 個表，考慮快取
- [ ] **資料變動頻率？** 如果來源資料很少變，適合快取
- [ ] **觸發時機？** 寫入時更新快取，而不是讀取時計算

---

## 📱 頁面資料載入規範

> **核心原則**：只載入頁面實際需要的資料，避免過度讀取

### ❌ 常見的過度讀取問題

```typescript
// ❌ 1. 載入所有資料但只用一個欄位
const { items: tours } = useTourStore()  // 載入 50 個欄位
const tourNames = tours.map(t => t.name)  // 只用 name

// ❌ 2. 載入關聯資料做轉換（實體已有 denormalized 欄位）
const { countries } = useRegionsStore()
const destination = countries.find(c => c.id === tour.country_id)?.name
// 但 Tour 已經有 tour.location 欄位！

// ❌ 3. 頁面載入時就預載入所有 Store
useEffect(() => {
  fetchTours()
  fetchOrders()
  fetchMembers()      // 這頁面不用！
  fetchCustomers()    // 這頁面也不用！
}, [])

// ❌ 4. 計算可以在資料庫完成的統計
const memberCount = orders
  .filter(o => o.tour_id === tour.id)
  .flatMap(o => members.filter(m => m.order_id === o.id))
  .length
// 但 Tour 已經有 tour.current_participants 欄位！
```

### ✅ 正確做法

```typescript
// ✅ 1. 使用 denormalized 欄位
const destination = tour.location  // 直接用
const memberCount = tour.current_participants  // 直接用

// ✅ 2. 延遲載入：Dialog 開啟時才載入
const handleOpenDialog = () => {
  regionsStore.fetchAll()  // 需要時才載入
  setDialogOpen(true)
}

// ✅ 3. 動態 import
const startCustomerMatch = async () => {
  const { useCustomerStore } = await import('@/stores')
  await useCustomerStore.getState().fetchAll()
}

// ✅ 4. 直接查詢取代遍歷 Store
const { data: member } = await supabase
  .from('order_members')
  .select('id')
  .eq('order_id', orderId)
  .eq('chinese_name', name)
  .single()
```

### 頁面載入檢查清單

- [ ] **是否有未使用的 Store？** 移除不需要的 `useXxxStore()`
- [ ] **是否載入關聯資料做轉換？** 檢查實體是否已有 denormalized 欄位
- [ ] **useEffect 內的 fetchAll 是否都必要？** 只保留必須的
- [ ] **Dialog 需要的資料是否可以延遲載入？** 開啟時才 fetch

### 常見的 Denormalized 欄位

| 實體 | 欄位 | 說明 |
|------|------|------|
| `Tour` | `location` | 目的地名稱（不需查 regions） |
| `Tour` | `current_participants` | 團員人數（不需計算） |
| `Order` | `tour_name` | 團名（不需查 tours） |
| `Proposal` | `destination` | 目的地名稱 |
| `Receipt` | `tour_name`, `order_number` | 不需查關聯表 |

---

## 🖥️ 前端效能優化

### 1. Dynamic Import - 大型組件延遲載入

```typescript
// ❌ 直接 import（增加首次載入時間）
import { AddReceiptDialog } from '@/features/finance/payments'

// ✅ 使用 dynamic import
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const AddReceiptDialog = dynamic(
  () => import('@/features/finance/payments').then(m => m.AddReceiptDialog),
  { loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    )
  }
)
```

**使用時機**：
- Dialog/Modal 組件（用戶不一定會打開）
- 複雜的表單組件
- 圖表/視覺化組件

### 2. Image Blur Placeholder

```typescript
// ❌ 直接使用 Image
<Image src={url} alt="..." width={200} height={150} />

// ✅ 使用 blur placeholder
import { getOptimizedImageProps } from '@/lib/image-utils'

<Image
  src={url}
  alt="..."
  width={200}
  height={150}
  {...getOptimizedImageProps(url)}
/>
```

### 3. VirtualizedTable - 大資料虛擬化

```typescript
// ❌ 大量資料用普通表格（>100筆會卡頓）
<EnhancedTable data={largeData} columns={columns} />

// ✅ 使用虛擬化表格
import { VirtualizedTable } from '@/components/ui/enhanced-table'

<VirtualizedTable
  data={largeData}          // >100 筆資料
  columns={columns}
  height={600}              // 固定高度
  estimateRowHeight={48}    // 預估行高
  onRowClick={handleClick}
/>
```

**使用時機**：
- 資料量 >100 筆
- 需要無分頁顯示全部資料

---

## 📁 效能工具檔案位置

| 工具 | 檔案位置 | 用途 |
|------|---------|------|
| Supabase 單例 | `src/lib/supabase/admin.ts` | API 用 Supabase 連線 |
| 請求去重 | `src/lib/request-dedup.ts` | SWR 快取 |
| API 快取標頭 | `src/lib/api-utils.ts` | 回應快取設定 |
| VirtualizedTable | `src/components/ui/enhanced-table/VirtualizedTable.tsx` | 虛擬化表格 |
| useVirtualList | `src/hooks/useVirtualList.ts` | 虛擬列表 Hook |
| 圖片優化 | `src/lib/image-utils.ts` | blur placeholder |

---

## 相關文件

- `docs/ARCHITECTURE_STANDARDS.md` - 架構規範
- `docs/SUPABASE_GUIDE.md` - Supabase 操作指南
