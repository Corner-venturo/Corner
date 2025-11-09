# Venturo Stores 架構審計報告

**審計日期**: 2025-10-31
**審計範圍**: 所有 Zustand Stores
**目的**: 確認是否使用統一抽象層

---

## 📊 總覽

| 類別                      | 數量  | 狀態             |
| ------------------------- | ----- | ---------------- |
| ✅ 使用統一 `createStore` | 16 個 | 自動繼承修復     |
| ❌ 自己實作 (需要同步)    | 7 個  | **需要手動修復** |
| 🟡 自己實作 (可能需要)    | 2 個  | 待確認           |
| 🟢 自己實作 (純前端)      | 4 個  | 不需要修復       |

---

## ✅ 使用統一抽象層 (16 個)

這些 Stores 使用 `src/stores/core/create-store-new.ts` 的 `createStore` 工廠函數。

### 自動繼承的功能

- ✅ 離線優先 fetchAll
- ✅ IndexedDB 快取
- ✅ Supabase 同步
- ✅ 衝突解決
- ✅ 網路監控

### 列表

| Store                     | 表格名稱            | 用途       |
| ------------------------- | ------------------- | ---------- |
| useTourStore              | tours               | 旅遊團     |
| useItineraryStore         | itineraries         | 行程       |
| useOrderStore             | orders              | 訂單       |
| useCustomerStore          | customers           | 客戶       |
| useQuoteStore             | quotes              | 報價單     |
| usePaymentRequestStore    | payment_requests    | 付款請求   |
| useDisbursementOrderStore | disbursement_orders | 請款單     |
| useReceiptOrderStore      | receipt_orders      | 收款單     |
| useMemberStore            | members             | 團員       |
| useQuoteItemStore         | quote_items         | 報價項目   |
| useTourAddOnStore         | tour_addons         | 行程加購   |
| useEmployeeStore          | employees           | 員工       |
| useTodoStore              | todos               | 待辦事項   |
| useVisaStore              | visas               | 簽證       |
| useSupplierStore          | suppliers           | 供應商     |
| useCalendarEventStore     | calendar_events     | 行事曆事件 |

**狀態**: ✅ 這些 Stores 已經自動修復完成，不需要額外處理。

---

## ❌ 自己實作的 Stores (29 個)

這些 Stores 直接使用 `zustand` 的 `create` 函數，**不會自動繼承修復**。

### 🔴 高優先級：需要同步，違反離線優先 (7 個)

#### 1. **workspace/channels-store.ts**

- **問題**: `loadChannels` 每次線上時都查詢 Supabase
- **違反**: 離線優先原則
- **影響**: Workspace 頻道資料
- **需要**: 改用 createStore 或手動修復

```typescript
// 目前的錯誤邏輯
if (isOnline) {
  const { data } = await supabase.from('channels').select('*') // ❌ 每次都查
}
```

#### 2. **workspace/chat-store.ts**

- **問題**: `loadMessages` 類似問題
- **影響**: 聊天訊息
- **需要**: 手動修復

#### 3. **workspace/members-store.ts**

- **問題**: `loadChannelMembers` 類似問題
- **影響**: 頻道成員
- **需要**: 手動修復

#### 4. **workspace/widgets-store.ts**

- **問題**: `loadAdvanceLists`, `loadSharedOrderLists` 類似問題
- **影響**: Workspace 小工具
- **需要**: 手動修復

#### 5. **workspace/canvas-store.ts**

- **問題**: `loadPersonalCanvases`, `loadRichDocuments` 類似問題
- **影響**: 白板畫布
- **需要**: 手動修復

#### 6. **accounting-store.ts**

- **待確認**: 是否有同步需求
- **需要**: 檢查並可能遷移到 createStore

#### 7. **timebox-store.ts**

- **待確認**: 是否有同步需求
- **需要**: 檢查並可能遷移到 createStore

---

### 🟡 中優先級：可能需要同步 (2 個)

#### 8. **calendar-store.ts**

- **問題**: 與 `useCalendarEventStore` 重複？
- **需要**: 確認用途，可能需要合併或刪除

#### 9. **template-store.ts**

- **待確認**: 是否有同步需求

---

### 🟢 低優先級：純前端狀態，不需要同步 (4 個)

這些 Stores 只儲存前端狀態，不涉及資料庫同步：

10. **auth-store.ts** - 認證狀態（登入、Token）
11. **theme-store.ts** - 主題設定（深色/淺色模式）
12. **home-settings-store.ts** - 首頁設定
13. **manifestation-store.ts** - 顯化魔法（前端功能）

**狀態**: ✅ 不需要修復

---

## 🚨 關鍵問題

### 問題 1: Workspace Stores 違反離線優先

**受影響的 Stores**:

- `channels-store`
- `chat-store`
- `members-store`
- `widgets-store`
- `canvas-store`

**當前行為**:

```typescript
// ❌ 每次進入頁面都查詢 Supabase
if (isOnline) {
  const data = await supabase.from('xxx').select('*')
  set({ items: data })
}
```

**應該的行為**:

```typescript
// ✅ 離線優先
const cached = await indexedDB.getAll('xxx')
if (cached.length > 0) {
  return cached // 立即返回
}
// 無快取才查詢
const data = await supabase.from('xxx').select('*')
```

### 問題 2: 無法自動繼承未來的修復

當我們修復了 `createStore` 的 fetchAll 邏輯時：

- ✅ 16 個使用 createStore 的 Stores → 自動修復
- ❌ 7 個自己實作的 Stores → **需要手動修復**

---

## 🎯 建議修復方案

### 方案 A: 遷移到 createStore（推薦）

**優點**:

- ✅ 自動繼承所有修復
- ✅ 統一架構
- ✅ 未來易維護

**缺點**:

- ❌ 需要重構（1-2 天）
- ❌ 可能破壞現有功能

**步驟**:

1. 將 Workspace Stores 改用 createStore
2. 調整 Workspace 特有邏輯（如 selectChannel 協調）
3. 測試所有 Workspace 功能

### 方案 B: 手動修復各個 Store（快速）

**優點**:

- ✅ 快速（2-3 小時）
- ✅ 風險較低

**缺點**:

- ❌ 未來修改需要改多個地方
- ❌ 容易遺漏

**步驟**:

1. 複製 `operations/fetch.ts` 的離線優先邏輯
2. 套用到 7 個 Stores 的 loadXXX 函數
3. 確保 Realtime 訂閱正常

---

## 📋 修復檢查清單

### 立即修復 (高優先級)

- [ ] **channels-store.ts** - loadChannels 改為離線優先
- [ ] **chat-store.ts** - loadMessages 改為離線優先
- [ ] **members-store.ts** - loadChannelMembers 改為離線優先
- [ ] **widgets-store.ts** - loadAdvanceLists/loadSharedOrderLists 改為離線優先
- [ ] **canvas-store.ts** - loadPersonalCanvases/loadRichDocuments 改為離線優先

### 待確認

- [ ] **accounting-store.ts** - 確認是否需要同步
- [ ] **timebox-store.ts** - 確認是否需要同步
- [ ] **calendar-store.ts** - 確認是否與 useCalendarEventStore 重複

### 不需要處理

- [x] **auth-store.ts** - 純前端狀態
- [x] **theme-store.ts** - 純前端狀態
- [x] **home-settings-store.ts** - 純前端狀態
- [x] **manifestation-store.ts** - 純前端狀態

---

## 🔢 影響評估

### 修復前

```
使用統一抽象層: 16 個 (55%)
自己實作（違反規範）: 7 個 (24%)
自己實作（不需要同步）: 4 個 (14%)
待確認: 2 個 (7%)
```

### 修復後目標

```
使用統一抽象層: 23+ 個 (>80%)
自己實作（純前端）: 4 個 (<20%)
```

---

## 🚀 下一步

### 立即行動

1. **確認修復方案**: 方案 A (遷移) vs 方案 B (手動)
2. **優先修復**: channels-store (最常用)
3. **測試驗證**: 確保 Workspace 功能正常

### 長期規劃

1. 逐步遷移所有 Stores 到 createStore
2. 建立 Store 創建規範文件
3. Code Review 確保新 Stores 使用抽象層

---

**審計結論**: 目前有 **7 個 Stores 違反離線優先原則**，需要立即修復。建議採用方案 B 快速修復，再規劃方案 A 長期重構。
