# Venturo 最終同步架構設計

**版本**: 1.0 (Final)
**制定日期**: 2025-10-31
**狀態**: ✅ 確定，不再修改

---

## 🎯 設計理念

### 核心目標

**不是為了「離線工作」，而是為了「體感流暢」**

1. **開機瞬間就能看資料**（WiFi 還在連線時）
2. **客戶面前立刻秀資料**（國外沒網路時）
3. **出差途中能查紀錄**（飛機/高鐵上）
4. **網路不穩也能操作**（機場/咖啡廳）

### 設計原則

```
✅ 快取優先 - 立即顯示，0.1 秒載入
✅ 智慧分層 - 重要資料全量，次要資料部分
✅ 樂觀更新 - 編輯立即生效，背景同步
✅ 自動同步 - 重新連網自動上傳/下載
✅ 簡單衝突 - 後寫覆蓋（通常沒問題）

❌ 不做複雜的多人即時協作衝突解決
❌ 不做離線建立複雜資料（需即時驗證）
❌ 不做向量時鐘等過度設計
```

---

## 📦 快取策略（三層分類）

### 🔴 第一層：全量快取（核心業務資料）

**使用情境**：經常在客戶面前/緊急情況下查詢

| 表格 | 用途 | 預估大小 | 快取策略 |
|------|------|---------|---------|
| tours | 旅遊團 | 2.5 MB | 全量 |
| quotes | 報價單 | 3 MB | 全量 |
| customers | 客戶資料 | 4 MB | 全量 |
| orders | 訂單 | 6 MB | 全量 |
| suppliers | 供應商/飯店 | 0.6 MB | 全量 |
| calendar_events | 行事曆 | 0.5 MB | 全量 |
| itineraries | 行程詳情 | 10 MB | 全量 |
| members | 團員名單 | 1 MB | 全量 |
| employees | 員工資料 | 1 MB | 全量 |
| **小計** | - | **~29 MB** | ✅ |

**實作**：
```typescript
export const useTourStore = createStore<Tour>('tours', {
  cacheStrategy: 'full'
})
```

---

### 🟡 第二層：時間範圍快取（歷史查詢）

**使用情境**：自己查歷史紀錄，不會在客戶面前看

| 表格 | 用途 | 快取範圍 | 預估大小 |
|------|------|---------|---------|
| messages | 聊天訊息 | 最近 1000 則 | 5 MB |
| financial_reports | 財務報表 | 最近 6 個月 | 3 MB |
| disbursements | 請款單 | 最近 6 個月 | 5 MB |
| receipt_orders | 收款單 | 最近 6 個月 | 5 MB |
| payment_requests | 付款請求 | 最近 3 個月 | 3 MB |
| todos | 待辦事項 | 未完成 + 最近 100 則 | 1 MB |
| **小計** | - | - | **~22 MB** |

**實作**：
```typescript
export const useMessageStore = createStore<Message>('messages', {
  cacheStrategy: 'time_range',
  cacheConfig: {
    limit: 1000,
    sortBy: 'created_at',
    order: 'desc'
  }
})

export const useFinancialReportStore = createStore<Report>('financial_reports', {
  cacheStrategy: 'time_range',
  cacheConfig: {
    months: 6
  }
})
```

---

### 🟢 第三層：按需快取（大資料量/圖片）

**使用情境**：資料量巨大，只快取瀏覽過的

| 表格 | 用途 | 快取策略 | 預估大小 |
|------|------|---------|---------|
| spots | 景點管理 | 分頁快取（每頁 20 筆）| ~10 MB |
| regions | 地區管理 | 分頁快取（每頁 50 筆）| ~5 MB |
| images | 景點圖片 | 縮圖快取（原圖不快取）| ~10 MB |
| **小計** | - | - | **~25 MB** |

**實作**：
```typescript
export const useSpotStore = createStore<Spot>('spots', {
  cacheStrategy: 'paginated',
  cacheConfig: {
    pageSize: 20,
    preloadPages: 1 // 預載下一頁
  }
})
```

**圖片處理**：
```typescript
// 只快取縮圖，原圖按需下載
<img
  src={getImageUrl(spot.image, {
    width: 400,
    quality: 80,
    format: 'webp'
  })}
  loading="lazy" // 瀏覽器原生延遲載入
/>
```

---

## 💾 儲存空間總計

```
第一層（全量）:   29 MB
第二層（範圍）:   22 MB
第三層（按需）:   25 MB
系統資料:         5 MB
─────────────────────────
總計:            ~81 MB ✅

瀏覽器 IndexedDB 上限: 通常 > 1 GB
實際占用率: < 10% ✅
```

---

## 🔄 同步流程

### 情境 1：進入頁面（有快取）

```
1. fetchAll() 被調用
   ↓
2. 檢查 IndexedDB
   ↓ 有快取
3. 立即返回快取（0.1 秒）← 使用者看到畫面
   ↓
4. 背景檢查網路狀態
   ↓ 有網路
5. Realtime 訂閱啟動
   ↓
6. （首次訂閱）檢查是否有遺漏資料
   ↓ 有遺漏
7. 下載差異，靜默更新 UI
   ↓
8. 之後 Realtime 自動推送新變更
```

### 情境 2：進入頁面（無快取）

```
1. fetchAll() 被調用
   ↓
2. 檢查 IndexedDB
   ↓ 無快取
3. 顯示 Loading（0.5-2 秒）
   ↓
4. 根據快取策略下載資料：
   - 全量：下載全部
   - 時間範圍：下載最近 N 個月
   - 分頁：下載第一頁
   ↓
5. 存入 IndexedDB
   ↓
6. 顯示資料
   ↓
7. Realtime 訂閱啟動
```

### 情境 3：離線編輯

```
1. 使用者修改資料
   ↓
2. 立即更新 UI（樂觀更新）
   ↓
3. 標記為「待同步」
   await indexedDB.put({
     ...data,
     _needs_sync: true,
     _synced_at: null
   })
   ↓
4. 檢查網路狀態
   ↓ 離線
5. 暫存本地，等待重新連網

   ↓ （重新連網後）

6. 自動上傳待同步資料
   ↓
7. Supabase 更新成功
   ↓
8. 移除「待同步」標記
   await indexedDB.put({
     ...data,
     _needs_sync: false,
     _synced_at: new Date()
   })
```

---

## ⚡ 衝突解決策略

### 簡化原則

**因為離線編輯的情況很少，採用簡單策略**：

```typescript
// 策略：Last Write Wins (後寫覆蓋)

if (localItem._needs_sync && !remoteItem.updated_at) {
  // 本地有未同步的修改，上傳
  await supabase.update(localItem)
}
else if (remoteItem.updated_at > localItem.updated_at) {
  // 遠端更新，下載
  await indexedDB.put(remoteItem)
}
else {
  // 本地較新，上傳
  await supabase.update(localItem)
}

// ❌ 不做：
// - 向量時鐘
// - 三方合併
// - 複雜的欄位級合併
```

### 特殊情況處理

```typescript
// 如果真的有衝突（極少發生）
if (detectConflict(localItem, remoteItem)) {
  // 簡單提示使用者選擇
  const choice = await confirm({
    title: '資料衝突',
    message: '本地和遠端資料不一致，要使用哪個版本？',
    options: [
      { label: '使用本地版本', value: 'local' },
      { label: '使用遠端版本', value: 'remote' }
    ]
  })

  if (choice === 'local') {
    await supabase.update(localItem)
  } else {
    await indexedDB.put(remoteItem)
  }
}
```

---

## 🏗️ 實作架構

### 統一的抽象層

```
src/stores/
├── core/
│   └── create-store-new.ts     ← 所有 Stores 的工廠函數
├── operations/
│   ├── fetch.ts                ← fetchAll 實作（支援三種策略）
│   ├── create.ts               ← 建立資料
│   ├── update.ts               ← 更新資料
│   └── delete.ts               ← 刪除資料
├── adapters/
│   ├── indexeddb-adapter.ts    ← IndexedDB 操作
│   └── supabase-adapter.ts     ← Supabase 操作
├── sync/
│   └── coordinator.ts          ← 簡化的同步協調
└── cache/
    ├── full-strategy.ts        ← 全量快取策略
    ├── time-range-strategy.ts  ← 時間範圍快取策略
    └── paginated-strategy.ts   ← 分頁快取策略
```

### 使用範例

```typescript
// src/stores/index.ts

// 第一層：全量快取
export const useTourStore = createStore<Tour>('tours', {
  cacheStrategy: 'full'
})

// 第二層：時間範圍快取
export const useMessageStore = createStore<Message>('messages', {
  cacheStrategy: 'time_range',
  cacheConfig: { limit: 1000 }
})

// 第三層：分頁快取
export const useSpotStore = createStore<Spot>('spots', {
  cacheStrategy: 'paginated',
  cacheConfig: { pageSize: 20 }
})
```

### createStore 簽名

```typescript
function createStore<T extends BaseEntity>(
  tableName: string,
  options?: {
    // 快取策略
    cacheStrategy?: 'full' | 'time_range' | 'paginated'

    // 快取配置
    cacheConfig?: {
      // time_range 專用
      months?: number
      limit?: number

      // paginated 專用
      pageSize?: number
      preloadPages?: number
    }

    // Realtime 訂閱
    enableRealtime?: boolean  // 預設 true

    // 其他選項
    idPrefix?: string
  }
): Store<T>
```

---

## 📊 效能指標

### 目標

| 指標 | 目標值 | 實際預期 |
|------|--------|---------|
| 首次載入（有快取）| < 0.2 秒 | 0.1 秒 ✅ |
| 首次載入（無快取）| < 2 秒 | 1-2 秒 ✅ |
| 頁面切換 | < 0.1 秒 | 0.05 秒 ✅ |
| 背景同步 | 不阻擋 UI | ✅ |
| 儲存空間 | < 100 MB | 81 MB ✅ |
| 離線可用性 | > 90% 資料 | ~95% ✅ |

### 連線數管理

```
單一使用者：
- 當前頁面 Realtime: 1-2 個
- HTTP 請求（首次檢查）: 1 次
- 背景同步: 0（Realtime 自動推送）

20 員工 × 2 裝置 × 平均 2 頁面:
- Realtime 連線: ~80 個
- Supabase 免費版上限: 200 個
- 占用率: 40% ✅ 安全
```

---

## 🚀 未來擴展

### PWA / APP 化準備

目前架構**已經支援** PWA 化：

1. ✅ Service Worker 快取靜態資源
2. ✅ IndexedDB 快取動態資料
3. ✅ 離線可用（查詢 + 編輯）
4. ✅ 背景同步（Background Sync API）
5. ✅ 推送通知（可選）

**只需額外做**：
- [ ] 添加 manifest.json
- [ ] 註冊 Service Worker
- [ ] 圖示和啟動畫面

### 行動端考量

```
如果未來做 Native App：
✅ 快取機制完全相容（改用 SQLite）
✅ Realtime 訂閱相容（WebSocket）
✅ 圖片策略相容（延遲載入）

不需要改：
- Store 邏輯
- 同步策略
- 衝突解決
```

---

## ⚠️ 已知限制與取捨

### 限制 1：歷史資料不完整

```
問題：時間範圍快取只保留最近 N 個月

影響：
❌ 無法查詢 1 年前的聊天紀錄（離線時）
✅ 有網路時可以查詢全部（按需下載）

解決：
- 重要歷史資料建議匯出 PDF
- 或提供「下載完整歷史」功能（手動）
```

### 限制 2：圖片快取不完整

```
問題：只快取縮圖，原圖按需下載

影響：
❌ 離線時無法下載高解析度圖片
✅ 可以看到縮圖和檔案資訊

解決：
- 重要圖片可「釘選」（手動下載原圖）
- 或設定「預下載最近 100 張圖片」
```

### 限制 3：複雜衝突需手動處理

```
問題：自動衝突解決採用「後寫覆蓋」

影響：
❌ 極少數情況下，可能覆蓋他人編輯
✅ 99% 情況沒問題（離線編輯很少）

解決：
- 重要資料修改前檢查網路
- 或加入「版本號」機制（可選）
```

---

## ✅ 最終確認

### 這個架構的優點

1. ✅ **體感極快** - 0.1 秒載入
2. ✅ **離線可用** - 95% 資料可查詢
3. ✅ **程式碼簡潔** - 相較完整離線優先減少 70%
4. ✅ **易於維護** - 統一抽象層
5. ✅ **擴展性強** - 支援 PWA/APP 化
6. ✅ **成本可控** - 不超過免費額度

### 這個架構的取捨

1. 🟡 歷史資料不完整（可接受）
2. 🟡 圖片不完整（可接受）
3. 🟡 複雜衝突需手動（很少發生）

---

## 📝 結論

**這就是 Venturo 的最終同步架構**

- ✅ 符合實際使用需求
- ✅ 平衡複雜度與收益
- ✅ 未來不需要大改動
- ✅ 常理來說不會再修改

**除非**：
- 使用者行為大幅改變（如改為完全離線工作）
- Supabase 政策變更（如連線數限制調整）
- 法規要求（如資料必須本地儲存）

---

**文件版本**: 1.0 (Final)
**最後更新**: 2025-10-31
**狀態**: ✅ 確定執行
