# VENTURO 5.0 優化指南

## 🎯 優化目標

- **載入速度提升 80%+** - 從 3-5 秒降至 0.5-1 秒
- **記憶體使用減少 70%+** - 從 200MB+ 降至 50-60MB
- **頁面切換流暢** - 從卡頓 1-2 秒變為瞬間響應

---

## 📊 核心架構

### 三層快取策略

```
L1 (熱快取) - Memory
  ↓ 當前頁面正在用
  ├─ 不過期
  └─ 頁面關閉即清除

L2 (溫快取) - SessionStorage
  ↓ 跨頁面可能用
  ├─ 瀏覽器關閉才清除
  └─ 約 5-10MB 容量

L3 (冷快取) - IndexedDB
  ↓ 持久化備份
  ├─ 永久保存
  └─ 無容量限制
```

### 載入策略

```
舊版：一次載入全部
  tours: [1000 筆資料]
  ↓
  記憶體: 200MB+
  載入時間: 3-5 秒

新版：按需分頁載入
  tours: [第 1 頁 10 筆]
  ↓
  記憶體: 50MB
  載入時間: 0.5 秒
```

---

## 🚀 快速開始

### 1. 使用新版 Store（按需載入）

**舊版寫法：**

```typescript
// ❌ 一次載入全部資料
const { tours } = useTourStore();

useEffect(() => {
  loadAllTours(); // 載入全部！
}, []);

return tours.map(tour => <TourCard tour={tour} />);
```

**新版寫法：**

```typescript
// ✅ 只載入需要的資料
import { useTourStoreV2 } from '@/stores/tour-store-v2';

const { currentPage, isLoading, fetchPage } = useTourStoreV2();

useEffect(() => {
  fetchPage(1); // 只載入第一頁
}, []);

return (
  <VirtualList
    items={currentPage?.data || []}
    itemHeight={100}
    height={600}
    renderItem={(tour) => <TourCard tour={tour} />}
  />
);
```

### 2. 使用虛擬列表（減少 DOM）

**舊版寫法：**

```typescript
// ❌ 渲染所有 DOM 節點
{tours.map(tour => <TourCard tour={tour} />)}
// 100 筆 = 100 個 DOM 節點
```

**新版寫法：**

```typescript
// ✅ 只渲染可見區域
import { VirtualList } from '@/components/common/virtual-list';

<VirtualList
  items={tours}
  itemHeight={80}
  height={600}
  renderItem={(tour) => <TourCard tour={tour} />}
/>
// 100 筆 = 只渲染 8-10 個 DOM 節點
```

### 3. 啟用效能監控（開發模式）

```typescript
// app/layout.tsx
import { PerformanceMonitor } from '@/lib/performance/performance-monitor';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <PerformanceMonitor />
      </body>
    </html>
  );
}
```

---

## 📦 API 文件

### CacheStrategy（快取策略）

```typescript
import { cacheStrategy } from '@/lib/cache/cache-strategy'

// 設定快取
await cacheStrategy.set('my-key', data, {
  level: 'hot', // 'hot' | 'warm' | 'cold'
  ttl: 60000, // 過期時間（毫秒）
})

// 讀取快取
const data = await cacheStrategy.get('my-key')

// 刪除快取
await cacheStrategy.delete('my-key')

// 清除所有
await cacheStrategy.clear('hot')
```

### LazyStore（按需載入）

```typescript
import { LazyStore } from '@/lib/store/lazy-store'

const store = new LazyStore({
  table: 'tours',
  cachePrefix: 'tour',
  pageSize: 10,
  enableCache: true,
})

// 分頁載入
const page = await store.fetchPage(1, 10)
// {
//   data: [...],
//   total: 100,
//   page: 1,
//   pageSize: 10,
//   hasMore: true
// }

// 載入單筆
const item = await store.fetchById('id')
```

### VirtualList（虛擬列表）

```typescript
import { VirtualList } from '@/components/common/virtual-list';

<VirtualList
  items={data}
  itemHeight={80}
  height={600}
  overscan={3}
  renderItem={(item, index) => <ItemCard item={item} />}
  onLoadMore={() => loadNextPage()}
  isLoading={isLoading}
/>
```

### MemoryManager（記憶體管理）

```typescript
import { memoryManager } from '@/lib/performance/memory-manager'

// 獲取記憶體統計
const stats = memoryManager.getMemoryStats()
// {
//   usedMemory: 50.5,
//   totalMemory: 100,
//   usagePercent: 50.5,
//   isUnderPressure: false
// }

// 清理記憶體
await memoryManager.cleanup({
  clearHot: true,
  clearWarm: false,
  force: false,
})

// 開始監控（開發模式）
memoryManager.startMonitoring(10000) // 每 10 秒
```

---

## 🔄 遷移步驟

### Phase 1: 建立新版 Store

1. 複製現有 Store 為 `xxx-store-v2.ts`
2. 使用 `LazyStore` 重構
3. 保留舊版 Store（暫時並存）

**範例：**

```typescript
// stores/tour-store-v2.ts
import { LazyStore } from '@/lib/store/lazy-store'

const tourLazyStore = new LazyStore({
  table: 'tours',
  cachePrefix: 'tour',
  pageSize: 10,
})

export const useTourStoreV2 = create(set => ({
  currentPage: null,
  fetchPage: async page => {
    const data = await tourLazyStore.fetchPage(page)
    set({ currentPage: data })
  },
}))
```

### Phase 2: 逐頁遷移

1. 選擇一個頁面開始（例如：tours 列表頁）
2. 更換為新版 Store
3. 加入虛擬列表
4. 測試效能

**範例：**

```typescript
// app/tours/page.tsx
// import { useTourStore } from '@/stores/tour-store'; // ❌ 舊版
import { useTourStoreV2 } from '@/stores/tour-store-v2'; // ✅ 新版

function ToursPage() {
  const { currentPage, fetchPage } = useTourStoreV2();

  useEffect(() => {
    fetchPage(1);
  }, []);

  return (
    <VirtualList
      items={currentPage?.data || []}
      itemHeight={100}
      height={600}
      renderItem={(tour) => <TourCard tour={tour} />}
    />
  );
}
```

### Phase 3: 效能驗證

1. 啟用 `<PerformanceMonitor />`
2. 對比遷移前後的效能指標
3. 確認記憶體使用、載入時間改善

### Phase 4: 清理舊版

1. 確認所有頁面已遷移
2. 刪除舊版 Store
3. 移除 localStorage persist（改用新快取）

---

## 🎨 最佳實踐

### 1. 資料載入

```typescript
// ✅ 好的做法
useEffect(() => {
  fetchPage(1, 10) // 只載入第一頁
}, [])

// ❌ 不好的做法
useEffect(() => {
  fetchAll() // 載入全部資料
}, [])
```

### 2. 快取使用

```typescript
// ✅ 好的做法
await cacheStrategy.set('tours-page-1', data, {
  level: 'warm', // 跨頁面快取
  ttl: 5 * 60 * 1000, // 5 分鐘
})

// ❌ 不好的做法
localStorage.setItem('tours', JSON.stringify(allData)) // 太大
```

### 3. 列表渲染

```typescript
// ✅ 好的做法
<VirtualList
  items={items}
  itemHeight={80}
  renderItem={(item) => <Card item={item} />}
/>

// ❌ 不好的做法
{items.map(item => <Card item={item} />)} // 全部渲染
```

### 4. 記憶體管理

```typescript
// ✅ 好的做法
useEffect(() => {
  return () => {
    // 離開頁面時清理
    memoryManager.cleanup({ clearHot: true })
  }
}, [])

// ❌ 不好的做法
// 不清理，讓記憶體持續增長
```

---

## 📈 效能指標

### 目標指標

| 指標       | 舊版   | 新版    | 改善 |
| ---------- | ------ | ------- | ---- |
| 首次載入   | 3-5s   | 0.5-1s  | 80%+ |
| 記憶體使用 | 200MB+ | 50-60MB | 70%+ |
| 頁面切換   | 1-2s   | <0.1s   | 95%+ |
| DOM 節點   | 1000+  | 10-20   | 98%+ |

### 監控方式

1. **記憶體監控**

   ```typescript
   memoryManager.startMonitoring(10000)
   ```

2. **Chrome DevTools**
   - Performance 面板
   - Memory 面板
   - React DevTools Profiler

3. **效能組件**
   ```typescript
   <PerformanceMonitor />
   ```

---

## ❓ 常見問題

### Q: 為什麼不直接刪除舊 Store？

A: 漸進式遷移，確保系統穩定性。新舊並存期間可以快速回滾。

### Q: 快取會不會導致資料不同步？

A: 新架構會背景同步 Supabase，並提供 `refresh()` 方法手動刷新。

### Q: 虛擬列表支援動態高度嗎？

A: 目前支援固定高度。如需動態高度，可以使用 `react-window` 或 `react-virtuoso`。

### Q: 如何清除所有快取？

A:

```typescript
await memoryManager.cleanup({
  clearHot: true,
  clearWarm: true,
  force: true,
})
```

---

## 🔗 相關文件

- [VENTURO_5.0_MANUAL.md](./VENTURO_5.0_MANUAL.md) - 系統設計理念
- [SYSTEM_HEALTH_ANALYSIS.md](../SYSTEM_HEALTH_ANALYSIS.md) - 系統健康分析

---

**最後更新：** 2025-01-06
**版本：** 5.0
**維護者：** William Chien
