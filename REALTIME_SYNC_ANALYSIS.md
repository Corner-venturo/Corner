# Venturo Realtime 同步改造分析報告

> **日期**: 2025-10-30
> **目標**: 全站實作 Supabase Realtime 即時同步

---

## 📊 系統現況掃描

### 資料庫結構
- **總資料表數**: 36 個 (IndexedDB schemas)
- **Store 檔案數**: 16 個
- **使用 Zustand persist**: 9 個 stores

### 核心資料表分類

#### 🔴 高優先級（需要即時同步）
這些資料表的變更需要立即反映在所有裝置：

1. **Workspace 相關** (即時協作)
   - `channels` - 頻道列表
   - `messages` - 聊天訊息
   - `channel_groups` - 頻道群組
   - `bulletins` - 公告
   - `advance_lists` - 代墊清單
   - `shared_order_lists` - 分享訂單清單

2. **業務核心** (多人協作)
   - `tours` - 旅遊團
   - `orders` - 訂單
   - `members` - 團員
   - `todos` - 待辦事項

3. **人員管理** (即時狀態)
   - `employees` - 員工資料

#### 🟡 中優先級（建議同步）
這些資料變更頻率較低，但仍需同步：

4. **報價與財務**
   - `quotes` - 報價單
   - `quote_items` - 報價項目
   - `payments` - 付款記錄
   - `payment_requests` - 請款單
   - `disbursement_orders` - 出納單
   - `receipt_orders` - 收款單

5. **客戶與供應商**
   - `customers` - 客戶
   - `suppliers` - 供應商

#### 🟢 低優先級（可選同步）
這些資料很少變更，可以延遲同步：

6. **基礎資料** (幾乎不變)
   - `countries` - 國家
   - `regions` - 地區
   - `cities` - 城市
   - `templates` - 模板

7. **個人資料** (不需跨裝置同步)
   - `calendar_events` - 行事曆
   - `timebox_*` - 時間箱
   - `accounts` / `categories` / `transactions` / `budgets` - 記帳

---

## 🚨 現有問題診斷

### 1. 同步機制缺陷

#### channels-store.ts (Line 174-278)
```typescript
// ❌ 問題：使用 setTimeout 延遲同步
setTimeout(async () => {
  const { data } = await supabase.from('channels').select('*');
  // 背景同步，可能被忽略
}, 0);
```

**影響**:
- 快速切換頁面時同步未完成
- 資料可能被 persist 覆蓋

#### chat-store.ts (Line 60-92)
```typescript
// ❌ 同樣問題：setTimeout 延遲同步
setTimeout(async () => {
  const { data } = await supabase.from('messages').select('*');
}, 0);
```

### 2. 快取策略問題

#### 三層快取架構
```
L1 (Memory)       ← Zustand state
L2 (SessionStorage) ← Zustand persist
L3 (IndexedDB)    ← localDB
```

**問題**:
- channels-store 使用 persist → 舊資料殘留
- IndexedDB 快取優先於 Supabase → 資料不同步
- 沒有失效機制 → 刪除的資料仍顯示

### 3. 沒有 Realtime 訂閱
- ❌ 整個專案完全沒有使用 Supabase Realtime
- ❌ 資料變更後其他裝置不會收到通知
- ❌ 需要手動重新整理 (F5) 才能同步

---

## 🎯 改造計劃

### Phase 1: 建立 Realtime 基礎設施 (2-3 小時)

#### 1.1 創建統一的 Realtime Manager
```
src/lib/realtime/
├── realtime-manager.ts    # 統一管理所有 Realtime 連線
├── subscription-manager.ts # 訂閱生命週期管理
├── types.ts               # 型別定義
└── hooks/
    └── useRealtimeSubscription.ts # React Hook
```

**功能**:
- ✅ 統一訂閱管理（防止重複訂閱）
- ✅ 自動重連機制
- ✅ 連線狀態監控
- ✅ 記憶體洩漏防護

#### 1.2 設計 Realtime 事件處理器
```typescript
interface RealtimeHandler<T> {
  onInsert?: (record: T) => void;
  onUpdate?: (record: T) => void;
  onDelete?: (oldRecord: T) => void;
}
```

### Phase 2: 改造核心 Stores (3-4 小時)

#### 2.1 channels-store.ts
- ✅ 移除 `setTimeout` 延遲同步
- ✅ 移除 Zustand `persist` (channels 不應持久化)
- ✅ 加入 Realtime 訂閱
- ✅ 簡化快取邏輯（優先 Supabase）

#### 2.2 chat-store.ts
- ✅ 移除 `setTimeout` 延遲同步
- ✅ 加入 Realtime 訂閱（即時收發訊息）
- ✅ 優化訊息列表更新邏輯

#### 2.3 其他 stores
- `workspace/members-store.ts` - 成員狀態即時同步
- `workspace/widgets-store.ts` - 小工具即時更新

### Phase 3: 業務資料表同步 (2-3 小時)

#### 3.1 建立通用 Store Factory
```typescript
// 自動產生支援 Realtime 的 store
createRealtimeStore<T>({
  tableName: 'tours',
  enableRealtime: true,
  handlers: { ... }
});
```

#### 3.2 改造業務 Stores
- 使用 lazy-store 架構
- 套用 Realtime 支援
- 測試多裝置同步

### Phase 4: 清理與優化 (1-2 小時)

#### 4.1 移除冗餘機制
- ❌ 移除 `setTimeout(..., 0)` 所有延遲同步
- ❌ 檢查並移除不必要的 persist
- ❌ 簡化三層快取邏輯

#### 4.2 連線優化
```typescript
// 智慧訂閱：只在需要時連線
useEffect(() => {
  if (isWorkspacePage) {
    subscription.subscribe();
  }
  return () => subscription.unsubscribe();
}, [isWorkspacePage]);
```

### Phase 5: 測試與驗證 (1-2 小時)

#### 5.1 功能測試
- ✅ 公司電腦刪除 → 家裡立即消失
- ✅ 新增訊息 → 所有裝置即時顯示
- ✅ 多人同時編輯 → 無衝突

#### 5.2 效能測試
- ✅ 連線數監控（< 200 上限）
- ✅ 流量監控（< 5 GB/月）
- ✅ 記憶體洩漏檢查

---

## 📋 實作檢查清單

### 高優先級 (今天完成)
- [ ] 創建 Realtime Manager
- [ ] 改造 channels-store (加入 Realtime)
- [ ] 改造 chat-store (加入 Realtime)
- [ ] 移除 channels 的 persist
- [ ] 移除所有 setTimeout 延遲同步
- [ ] 測試跨裝置同步

### 中優先級 (後續完成)
- [ ] 改造 tours / orders / members stores
- [ ] 改造 todos store
- [ ] 實作通用 Realtime Store Factory
- [ ] 優化連線管理

### 低優先級 (可選)
- [ ] 基礎資料表的 Realtime (countries, regions, cities)
- [ ] 個人資料的 Realtime (calendar, timebox)

---

## 🎯 預期效果

### Before (目前)
```
公司刪除頻道
    ↓
家裡 3 小時後才知道（手動 F5）
```

### After (實作後)
```
公司刪除頻道
    ↓
家裡 0.1 秒後自動消失（不需 F5）
```

### 量化指標
- **同步延遲**: 3 小時 → < 0.1 秒
- **需要操作**: 手動刷新 → 自動同步
- **使用體驗**: 2010 年代 → 2025 年代

---

## 💰 成本評估

### 免費額度
- Realtime 連線: 200 個
- 資料傳輸: 5 GB/月

### 預估使用
- 尖峰連線數: 40 個 (20 人 × 2 裝置)
- 每月流量: ~100 MB

### 結論
✅ **完全在免費額度內，無需付費**

---

## 🚀 開始時間

準備好了嗎？我們從 Phase 1 開始！
