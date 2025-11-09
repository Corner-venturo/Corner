# 同步調度器設計文件

## 問題陳述

目前 Venturo 的同步架構存在以下問題：

### 1. 快取資料不會更新

- **現象**：有 IndexedDB 快取時，直接返回舊資料，不檢查 Supabase
- **影響**：多裝置/多人協作時，看不到其他人新增的資料
- **受影響表格**：所有 17 個使用 `createStore` 的表格

### 2. 重複同步與連線浪費

- **現象**：每個頁面獨立調度同步，無法控制總連線數
- **影響**：可能超過 Supabase 免費版 200 連線上限
- **風險**：高流量時觸發限流

### 3. Realtime 訂閱時機問題

- **現象**：Realtime 只監聽未來變更，訂閱前的資料不會推送
- **影響**：首次進入頁面時，舊資料＋新資料會不一致

---

## 解決方案：中央同步調度器

### 架構圖

```
┌─────────────────────────────────────────────────────────┐
│                   SyncScheduler                          │
│  (全域單例，應用啟動時初始化)                              │
├─────────────────────────────────────────────────────────┤
│  - 連線池管理 (Connection Pool)                          │
│  - 同步隊列 (Sync Queue with Priority)                   │
│  - 批次請求 (Batch Requests)                             │
│  - 智慧快取 (Smart Cache with TTL)                       │
└─────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ Todos   │          │ Tours   │          │ Orders  │
   │ Page    │          │ Page    │          │ Page    │
   └─────────┘          └─────────┘          └─────────┘
```

### 核心功能

#### 1. 智慧同步策略

```typescript
interface SyncStrategy {
  // 快取優先 + 背景驗證
  cacheFirst: {
    maxAge: number // 快取有效期限 (ms)
    backgroundRefresh: boolean // 背景更新
  }

  // 網路優先 + 快取備援
  networkFirst: {
    timeout: number // 網路超時時間 (ms)
    fallbackToCache: boolean
  }

  // 僅快取（離線模式）
  cacheOnly: boolean
}
```

**範例使用**：

```typescript
// 待辦事項：快取優先，5 分鐘有效
const todos = await syncScheduler.fetch('todos', {
  strategy: 'cacheFirst',
  maxAge: 5 * 60 * 1000,
  backgroundRefresh: true,
})

// 訂單：網路優先（即時性要求高）
const orders = await syncScheduler.fetch('orders', {
  strategy: 'networkFirst',
  timeout: 3000,
})
```

#### 2. 連線池管理

```typescript
class ConnectionPool {
  private maxConnections = 50 // 全域最大連線數
  private activeConnections = 0
  private waitingQueue: Request[] = []

  async request<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeConnections >= this.maxConnections) {
      // 等待有空位
      await this.waitForSlot()
    }

    this.activeConnections++
    try {
      return await fn()
    } finally {
      this.activeConnections--
      this.processQueue()
    }
  }
}
```

**優點**：

- ✅ 確保不超過 Supabase 連線上限
- ✅ 低優先級請求自動排隊
- ✅ 高優先級請求可插隊

#### 3. 批次請求優化

```typescript
class BatchRequestOptimizer {
  private pendingRequests = new Map<string, Request[]>()
  private batchDelay = 50 // ms

  // 收集 50ms 內的請求，一次送出
  async batchFetch(tables: string[]): Promise<Map<string, any[]>> {
    // 使用 Supabase RPC 一次查詢多個表格
    const { data } = await supabase.rpc('batch_fetch', {
      tables: tables.join(','),
    })

    return new Map(data)
  }
}
```

**範例**：

```typescript
// 同時請求 3 個表格
const [todos, tours, quotes] = await Promise.all([
  syncScheduler.fetch('todos'),
  syncScheduler.fetch('tours'),
  syncScheduler.fetch('quotes'),
])

// 實際只發送 1 次 HTTP 請求！
```

#### 4. 智慧快取（TTL + LRU）

```typescript
interface CacheEntry<T> {
  data: T[]
  timestamp: number
  hits: number // 存取次數（用於 LRU）
  ttl: number // 有效期限
}

class SmartCache {
  private cache = new Map<string, CacheEntry<any>>()
  private maxSize = 100 // 最多快取 100 個表格

  get<T>(table: string): T[] | null {
    const entry = this.cache.get(table)

    if (!entry) return null

    // 檢查是否過期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(table)
      return null
    }

    entry.hits++
    return entry.data
  }

  set<T>(table: string, data: T[], ttl: number) {
    // LRU 淘汰策略
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }

    this.cache.set(table, {
      data,
      timestamp: Date.now(),
      hits: 0,
      ttl,
    })
  }
}
```

---

## 實作步驟

### Phase 1: 基礎架構（1 天）

- [ ] 創建 `SyncScheduler` 類別
- [ ] 實作連線池管理
- [ ] 實作智慧快取（TTL）
- [ ] 單元測試

### Phase 2: 整合現有 Stores（1 天）

- [ ] 修改 `fetchAll` 使用 SyncScheduler
- [ ] 遷移 17 個 stores
- [ ] 向下相容測試

### Phase 3: 批次優化（0.5 天）

- [ ] 實作批次請求
- [ ] 創建 Supabase RPC 函數
- [ ] 效能測試

### Phase 4: Realtime 整合（0.5 天）

- [ ] SyncScheduler 統一管理 Realtime 訂閱
- [ ] 自動取消未使用的訂閱
- [ ] 連線數監控

---

## 效能預估

### 目前架構

- 17 個表格 × 2 裝置 × 2.5 頁面 = **85 個連線**（接近上限）
- 每次進入頁面：1-3 秒載入時間
- 快取命中率：~30%（有快取但不檢查新資料）

### 新架構

- 智慧調度後：**20-30 個連線**（大幅降低）
- 首次載入：0.5-1 秒（快取優先）
- 快取命中率：~80%（TTL 機制）
- 批次請求：節省 50% HTTP 往返

---

## 風險評估

| 風險                   | 影響 | 緩解措施                     |
| ---------------------- | ---- | ---------------------------- |
| 重構導致現有功能損壞   | 高   | 分階段遷移，保留舊代碼       |
| 快取過期導致資料不一致 | 中   | 設定合理 TTL + Realtime 補充 |
| 連線池阻塞高優先級請求 | 中   | 優先級隊列 + 可中斷低優先級  |
| Supabase RPC 效能問題  | 低   | 先測試，不行退回單獨請求     |

---

## 下一步

1. **立即行動**：修復所有 stores 的 fetchAll（套用 todos 的修復）
2. **討論設計**：確認 SyncScheduler 需求與優先級
3. **建立 POC**：先用 3 個表格測試新架構
4. **全面遷移**：確認無問題後推廣到所有表格

---

**建立時間**: 2025-10-31
**版本**: 1.0
**狀態**: 設計中
