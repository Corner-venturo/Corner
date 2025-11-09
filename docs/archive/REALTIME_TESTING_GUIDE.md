# Realtime 同步測試指南

> **完成日期**: 2025-10-30
> **狀態**: ✅ Phase 1, 2 & 3 完成 - Channels & Messages Realtime 已實作

---

## 🎉 已完成的改造

### ✅ Phase 1: Realtime 基礎設施

- `src/lib/realtime/realtime-manager.ts` - 統一管理所有 Realtime 訂閱
- `src/lib/realtime/hooks/useRealtimeSubscription.ts` - React Hook
- `src/lib/realtime/types.ts` - 型別定義
- `src/lib/realtime/index.ts` - 統一出口

### ✅ Phase 2: Channels Store 改造

- **移除 Zustand persist** - 不再持久化 channels 資料
- **移除 setTimeout 延遲同步** - 改為即時同步
- **加入 Realtime 訂閱** - 自動監聽資料庫變更
- **簡化快取邏輯** - 優先使用 Supabase

### ✅ Phase 2: Workspace 頁面整合

- 加入 `useChannelsRealtime()` Hook
- 自動訂閱當前 workspace 的 channels

### ✅ Phase 3: Chat Store 改造

- **移除 setTimeout 延遲同步** - 改為即時載入
- **優先從 Supabase 載入** - 確保資料即時性
- **加入 Realtime 訂閱** - 監聽 messages 變更
- **支援即時收發訊息** - 像 Slack/LINE 一樣即時

### ✅ Phase 3: Chat 頁面整合

- 加入 `useChatRealtime()` Hook
- 自動訂閱當前頻道的訊息
- 在 `useChannelChat` 中自動啟用

---

## 🧪 測試步驟

### 測試環境準備

```bash
cd /Users/william/Projects/venturo-new
npm run dev
```

---

## 📋 測試組 1: 頻道即時同步

### 測試 1-1: 刪除頻道即時同步

#### 設備 A (公司電腦)

1. 開啟瀏覽器訪問 `http://localhost:3000/workspace`
2. 選擇一個頻道（例如：「日本團」）
3. 點擊刪除

#### 設備 B (家裡電腦) - 同時觀察

1. 同時開啟另一個瀏覽器分頁（或無痕模式）
2. 訪問 `http://localhost:3000/workspace`
3. **預期結果**: 設備 A 刪除後，設備 B 的頻道列表**立即消失**（不需 F5）

---

### 測試 1-2: 新增頻道即時同步

#### 設備 A

1. 點擊「新增頻道」
2. 輸入名稱：「測試頻道」
3. 按下確認

#### 設備 B - 同時觀察

**預期結果**: 設備 B 的頻道列表**立即出現**新頻道（不需 F5）

---

### 測試 1-3: 修改頻道即時同步

#### 設備 A

1. 右鍵點擊頻道 → 「設定」
2. 修改頻道名稱：「日本團」→「日本大阪團」
3. 按下儲存

#### 設備 B - 同時觀察

**預期結果**: 設備 B 的頻道名稱**立即更新**（不需 F5）

---

### 測試 1-4: 星號標記即時同步

#### 設備 A

1. 右鍵點擊頻道 → 「加入星號」

#### 設備 B - 同時觀察

**預期結果**: 設備 B 的頻道**立即顯示星號**（不需 F5）

---

## 💬 測試組 2: 訊息即時同步

### 測試 2-1: 發送訊息即時同步

#### 設備 A

1. 進入任意頻道（例如：「日本團」）
2. 輸入訊息：「測試即時訊息」
3. 按下送出

#### 設備 B - 同時觀察

1. 同時開啟相同頻道
2. **預期結果**: 設備 A 發送後，設備 B **立即顯示**新訊息（不需 F5）
3. **延遲**: < 100ms（幾乎即時）

---

### 測試 2-2: 刪除訊息即時同步

#### 設備 A

1. 在頻道中右鍵點擊某則訊息
2. 選擇「刪除訊息」
3. 確認刪除

#### 設備 B - 同時觀察

**預期結果**: 設備 B 的訊息**立即消失**（不需 F5）

---

### 測試 2-3: 編輯訊息即時同步

#### 設備 A

1. 右鍵點擊訊息 → 「編輯」
2. 修改內容：「測試」→「測試已修改」
3. 按下儲存

#### 設備 B - 同時觀察

**預期結果**: 設備 B 的訊息內容**立即更新**（不需 F5）

---

### 測試 2-4: 訊息反應即時同步

#### 設備 A

1. 點擊訊息下方的反應按鈕
2. 選擇 emoji（例如：👍）

#### 設備 B - 同時觀察

**預期結果**: 設備 B 的訊息**立即顯示反應**（不需 F5）

---

### 測試 2-5: 多人同時發送訊息

#### 設備 A & B

1. 兩個裝置同時進入相同頻道
2. 設備 A 發送：「A 的訊息 1」
3. 設備 B 發送：「B 的訊息 1」
4. 設備 A 發送：「A 的訊息 2」
5. 設備 B 發送：「B 的訊息 2」

#### 預期結果

- 兩個裝置都能看到**完整且正確順序**的訊息
- 無訊息遺失
- 無訊息重複
- 即時顯示對方的訊息

---

## 🔍 除錯工具

### 1. 開啟 Realtime 除錯日誌

在瀏覽器 Console 中：

```javascript
// 查看所有訂閱狀態
import { realtimeManager } from '@/lib/realtime'
console.log(realtimeManager.getAllSubscriptions())
```

### 2. 監控連線狀態

打開 `src/lib/realtime/realtime-manager.ts`，確認 `debug: true`：

```typescript
export const realtimeManager = new RealtimeManager({
  debug: true, // ← 開啟除錯
})
```

### 3. 檢查 Supabase Dashboard

1. 登入 https://supabase.com/dashboard
2. 進入 Venturo 專案
3. 查看 **Realtime** 分頁
4. 確認有看到 WebSocket 連線

---

## ⚠️ 常見問題排除

### 問題 1: 沒有即時更新

**可能原因**:

- WebSocket 連線失敗
- Realtime 未啟用

**解決方法**:

```bash
# 檢查環境變數
echo $NEXT_PUBLIC_ENABLE_SUPABASE  # 應該是 'true'

# 檢查網路狀態
navigator.onLine  # 應該是 true
```

### 問題 2: 連線後馬上斷開

**可能原因**:

- Supabase 專案暫停（免費版 1 週不用會暫停）

**解決方法**:

1. 登入 Supabase Dashboard
2. 確認專案狀態
3. 如果暫停，點擊 "Resume"

### 問題 3: 重複訂閱

**可能原因**:

- React 嚴格模式導致 useEffect 執行兩次

**解決方法**:

- 這是正常的，RealtimeManager 會自動防止重複訂閱

---

## 📊 效能監控

### 連線數檢查

```typescript
// 在瀏覽器 Console
import { useRealtimeStatus } from '@/lib/realtime'

// 查看連線統計
const { totalCount, connectedCount } = useRealtimeStatus()
console.log(`總訂閱數: ${totalCount}, 已連線: ${connectedCount}`)
```

### 預期數字

```
單一使用者:
- 1 個 workspace 頁面 = 1 個 channels 訂閱
- 1 個 chat = 1 個 messages 訂閱 (稍後實作)
- 總計: 2 個連線

20 位員工 × 2 裝置:
- 最多 40 個連線
- 免費上限: 200 個 ✅
- 占用率: 20%
```

---

## 🎯 預期效果 vs 實際效果

| 操作     | Before (舊版) | After (Realtime)  |
| -------- | ------------- | ----------------- |
| 刪除頻道 | 需手動 F5     | 0.1 秒自動消失 ✅ |
| 新增頻道 | 需手動 F5     | 0.1 秒自動出現 ✅ |
| 修改名稱 | 需手動 F5     | 0.1 秒自動更新 ✅ |
| 發送訊息 | 需手動 F5     | 即時出現 ✅       |
| 刪除訊息 | 需手動 F5     | 即時消失 ✅       |
| 訊息反應 | 需手動 F5     | 即時更新 ✅       |
| 多人協作 | 容易衝突      | 即時同步 ✅       |

---

## 🚀 下一步

### Phase 4: 其他資料表 (可選)

如果需要，可以繼續改造：

- **tours** - 旅遊團即時更新
- **orders** - 訂單即時同步
- **members** - 成員狀態即時更新
- **todos** - 待辦事項即時同步
- **bulletins** - 公告即時推送

### 實作方法

```typescript
// 範例：改造 tours-store
import { realtimeManager } from '@/lib/realtime'

subscribeToTours: workspaceId => {
  realtimeManager.subscribe({
    table: 'tours',
    filter: `workspace_id=eq.${workspaceId}`,
    handlers: {
      onInsert: tour => {
        /* 處理新增 */
      },
      onUpdate: tour => {
        /* 處理更新 */
      },
      onDelete: oldTour => {
        /* 處理刪除 */
      },
    },
  })
}
```

---

## 💡 技術細節

### Realtime 事件流程

```
1. 公司電腦執行 DELETE
   ↓
2. Supabase PostgreSQL 刪除資料
   ↓
3. PostgreSQL Replication Slot 捕捉變更
   ↓
4. Supabase Realtime Server 收到事件
   ↓
5. 廣播給所有訂閱的 WebSocket 客戶端
   ↓
6. 家裡電腦的 realtimeManager 收到 onDelete 事件
   ↓
7. 呼叫 set(state => ({ channels: ... })) 更新狀態
   ↓
8. React 自動重新渲染畫面
   ↓
9. 使用者看到頻道消失 (全程 < 100ms)
```

### 快取策略變更

```
Before:
L1 (Memory) ← Zustand state
L2 (SessionStorage) ← Zustand persist ❌
L3 (IndexedDB) ← localDB

After:
L1 (Memory) ← Zustand state
L2 (Realtime) ← 即時同步 ✅
L3 (IndexedDB) ← 僅作離線備份
```

---

## ✅ 測試檢查清單

### 頻道功能

- [ ] 刪除頻道 → 其他裝置立即消失
- [ ] 新增頻道 → 其他裝置立即出現
- [ ] 修改頻道 → 其他裝置立即更新
- [ ] 星號標記 → 其他裝置立即同步

### 訊息功能

- [ ] 發送訊息 → 其他裝置立即顯示
- [ ] 刪除訊息 → 其他裝置立即消失
- [ ] 編輯訊息 → 其他裝置立即更新
- [ ] 訊息反應 → 其他裝置立即同步
- [ ] 多人同時發送 → 訊息順序正確

### 邊界情況

- [ ] 離線後上線 → 自動同步最新資料
- [ ] 網路斷線 → 顯示離線狀態
- [ ] 快速切換頻道 → 不會重複訂閱
- [ ] 關閉分頁 → 自動取消訂閱
- [ ] 訊息重複檢查 → 不會顯示重複訊息

### 效能檢查

- [ ] 連線數 < 200 (免費上限)
- [ ] 記憶體無洩漏
- [ ] Console 無錯誤訊息
- [ ] 訊息延遲 < 100ms

---

**準備好測試了嗎？執行 `npm run dev` 開始！** 🚀
