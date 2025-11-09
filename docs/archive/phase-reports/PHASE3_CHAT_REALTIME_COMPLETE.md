# Phase 3: Chat Realtime 改造完成報告

> **完成日期**: 2025-10-30
> **狀態**: ✅ 完成
> **Build 狀態**: ✅ 成功

---

## 📋 改造總覽

### 改造目標

實作訊息的即時同步功能，讓多個裝置/用戶可以像 Slack/LINE 一樣即時收發訊息。

### 改造範圍

1. **chat-store.ts** - 移除延遲同步，加入 Realtime 訂閱
2. **useChatRealtime.ts** - 新建 React Hook 管理訂閱生命週期
3. **useChannelChat.ts** - 整合 Realtime 到聊天頁面

---

## 🔧 檔案修改詳情

### 1. `src/stores/workspace/chat-store.ts`

#### 修改內容

**✅ 加入 Realtime Manager**

```typescript
import { realtimeManager } from '@/lib/realtime'
```

**✅ 新增 State**

```typescript
interface ChatState {
  // ... 其他 state
  currentChannelId: string | null // ← 新增：追蹤當前訂閱的頻道

  // Realtime subscriptions
  subscribeToMessages: (channelId: string) => void
  unsubscribeFromMessages: () => void
}
```

**❌ 移除 setTimeout 延遲同步（Line 61-91）**

```typescript
// ❌ 舊版：延遲同步
setTimeout(async () => {
  const { data } = await supabase.from('messages').select('*')
  set({ channelMessages: { [channelId]: data } })
}, 0)
```

**✅ 改為即時載入（優先 Supabase）**

```typescript
// ✅ 新版：即時載入
if (isOnline && process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true') {
  const { data, error } = await supabase
    .from('messages')
    .select('*, author:employees!author_id(id, display_name, avatar)')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })

  if (!error && data) {
    const freshMessages = data.map(normalizeMessage)

    // 更新 IndexedDB 快取
    for (const message of freshMessages) {
      await localDB.put('messages', message)
    }

    set({ channelMessages: { [channelId]: freshMessages } })
    return
  }
}

// 離線時從 IndexedDB 載入
const cachedMessages = (await localDB.getAll('messages'))
  .filter(m => m.channel_id === channelId)
  .map(normalizeMessage)
set({ channelMessages: { [channelId]: cachedMessages } })
```

**✅ 新增 Realtime 訂閱函數（Line 330-425）**

```typescript
subscribeToMessages: (channelId) => {
  const subscriptionId = `messages-${channelId}`;

  realtimeManager.subscribe<RawMessage>({
    table: 'messages',
    filter: `channel_id=eq.${channelId}`,
    subscriptionId,
    handlers: {
      // 新訊息插入
      onInsert: async (rawMessage) => {
        const newMessage = normalizeMessage(rawMessage);
        await localDB.put('messages', newMessage);

        set((state) => {
          const existingMessages = state.channelMessages[channelId] || [];

          // 避免重複
          if (existingMessages.some(m => m.id === newMessage.id)) {
            return state;
          }

          return {
            channelMessages: {
              ...state.channelMessages,
              [channelId]: [...existingMessages, newMessage]
            }
          };
        });
      },

      // 訊息更新（編輯/反應/置頂）
      onUpdate: async (rawMessage) => {
        const updatedMessage = normalizeMessage(rawMessage);
        await localDB.put('messages', updatedMessage);

        set((state) => {
          const existingMessages = state.channelMessages[channelId] || [];
          const index = existingMessages.findIndex(m => m.id === updatedMessage.id);

          if (index === -1) return state;

          const newMessages = [...existingMessages];
          newMessages[index] = updatedMessage;

          return {
            channelMessages: {
              ...state.channelMessages,
              [channelId]: newMessages
            }
          };
        });
      },

      // 訊息刪除
      onDelete: async (rawMessage) => {
        const messageId = rawMessage.id;
        await localDB.delete('messages', messageId);

        set((state) => {
          const existingMessages = state.channelMessages[channelId] || [];

          return {
            channelMessages: {
              ...state.channelMessages,
              [channelId]: existingMessages.filter(m => m.id !== messageId)
            }
          };
        });
      }
    }
  });

  set({ currentChannelId: channelId });
},

unsubscribeFromMessages: () => {
  const { currentChannelId } = get();

  if (currentChannelId) {
    const subscriptionId = `messages-${currentChannelId}`;
    realtimeManager.unsubscribe(subscriptionId);
  }

  set({ currentChannelId: null });
}
```

#### 改善效果

| 項目       | Before                      | After                       |
| ---------- | --------------------------- | --------------------------- |
| 載入方式   | setTimeout 延遲             | 即時載入                    |
| 資料來源   | IndexedDB → Supabase (延遲) | Supabase → IndexedDB (優先) |
| 即時同步   | ❌ 無                       | ✅ WebSocket                |
| 多裝置同步 | ❌ 需 F5                    | ✅ 自動更新                 |

---

### 2. `src/hooks/useChatRealtime.ts` (新建)

#### 檔案內容

````typescript
/**
 * Chat Realtime 訂閱 Hook
 * 自動管理 messages 的 Realtime 訂閱生命週期
 */

'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/stores/workspace/chat-store'

/**
 * 使用 Chat Realtime 訂閱
 *
 * 會自動：
 * 1. 在 channelId 變更時訂閱新的 channel 的 messages
 * 2. 在組件卸載時取消訂閱
 * 3. 即時同步所有 message 變更（新增/修改/刪除）
 *
 * @param channelId - 頻道 ID
 *
 * @example
 * ```tsx
 * function ChannelChat({ channelId }) {
 *   useChatRealtime(channelId);
 *
 *   const messages = useChatStore(state => state.channelMessages[channelId]);
 *   // messages 會自動即時更新
 * }
 * ```
 */
export function useChatRealtime(channelId: string | null | undefined) {
  const subscribeToMessages = useChatStore(state => state.subscribeToMessages)
  const unsubscribeFromMessages = useChatStore(state => state.unsubscribeFromMessages)

  useEffect(() => {
    if (!channelId) {
      return
    }

    // 訂閱當前 channel 的 messages
    subscribeToMessages(channelId)

    // 清理函數：取消訂閱
    return () => {
      unsubscribeFromMessages()
    }
  }, [channelId, subscribeToMessages, unsubscribeFromMessages])
}
````

#### 功能

- 自動訂閱當前頻道的訊息
- 切換頻道時自動取消舊訂閱、建立新訂閱
- 組件卸載時自動清理

---

### 3. `src/components/workspace/channel-chat/useChannelChat.ts`

#### 修改內容

**✅ 加入 useChatRealtime**

```typescript
import { useChatRealtime } from '@/hooks/useChatRealtime'

export function useChannelChat() {
  // ... 其他 hooks

  // Realtime subscription for messages
  useChatRealtime(selectedChannel?.id)

  // ... 其他邏輯
}
```

#### 改善效果

- 在聊天頁面自動啟用 Realtime
- 無需手動管理訂閱生命週期
- 切換頻道時自動處理

---

## 🎯 實作成果

### Before (舊版)

```
使用者 A 在公司發送訊息
    ↓
存入 Supabase
    ↓
使用者 B 在家裡看到嗎？ ❌ NO
    ↓
使用者 B 需要按 F5 才能看到
    ↓
延遲: 需手動重新整理 (~數秒到數分鐘)
```

### After (Realtime)

```
使用者 A 在公司發送訊息
    ↓
存入 Supabase
    ↓
PostgreSQL Replication Slot 捕捉
    ↓
Supabase Realtime 廣播 (WebSocket)
    ↓
使用者 B 的瀏覽器收到 onInsert 事件
    ↓
自動更新 Zustand State
    ↓
React 重新渲染
    ↓
使用者 B 看到新訊息 ✅ YES
    ↓
延遲: < 100ms (幾乎即時)
```

---

## 📊 效能數據

### 連線數估算

```
單一使用者:
- 1 個 workspace 頁面 = 1 個 channels 訂閱
- 1 個 chat 頁面 = 1 個 messages 訂閱
- 總計: 2 個連線

20 位員工 × 2 裝置 (公司+家裡):
- 最多 80 個連線 (40 channels + 40 messages)
- 免費上限: 200 個 ✅
- 占用率: 40%
```

### 資料傳輸估算

```
每則訊息平均:
- 訊息 ID: 36 bytes (UUID)
- 內容: ~200 bytes
- 作者資訊: ~100 bytes
- 其他: ~64 bytes
- 總計: ~400 bytes

每月估算:
- 20 員工 × 50 訊息/天 × 30 天 = 30,000 則
- 30,000 × 400 bytes = 12 MB
- 免費上限: 2 GB ✅
- 占用率: 0.6%
```

### 成本結論

**完全免費** ✅

---

## ✅ 測試清單

### 訊息功能

- [ ] 發送訊息 → 其他裝置立即顯示
- [ ] 刪除訊息 → 其他裝置立即消失
- [ ] 編輯訊息 → 其他裝置立即更新
- [ ] 訊息反應 → 其他裝置立即同步
- [ ] 多人同時發送 → 訊息順序正確

### 邊界測試

- [ ] 快速切換頻道 → 不會重複訂閱
- [ ] 關閉分頁 → 自動取消訂閱
- [ ] 離線後上線 → 自動同步最新資料
- [ ] 訊息重複檢查 → 不會顯示重複訊息

---

## 🔄 與 Phase 2 的差異

| 項目     | Phase 2 (Channels)        | Phase 3 (Messages)      |
| -------- | ------------------------- | ----------------------- |
| 資料表   | `channels`                | `messages`              |
| Store    | `channels-store.ts`       | `chat-store.ts`         |
| Hook     | `useChannelsRealtime()`   | `useChatRealtime()`     |
| 訂閱 ID  | `channels-${workspaceId}` | `messages-${channelId}` |
| Filter   | `workspace_id=eq.${id}`   | `channel_id=eq.${id}`   |
| 移除項目 | Zustand persist           | setTimeout 延遲         |

---

## 🚀 下一步

### Phase 4: 其他資料表 (可選)

如果需要更多即時同步功能，可以繼續改造：

- **tours** - 旅遊團即時更新
- **orders** - 訂單即時同步
- **members** - 成員狀態即時更新
- **todos** - 待辦事項即時同步
- **bulletins** - 公告即時推送

### 實作模式

所有改造都遵循相同模式：

```typescript
// 1. 加入 realtimeManager
import { realtimeManager } from '@/lib/realtime'

// 2. 加入 subscribe/unsubscribe 函數
subscribeToXXX: id => {
  realtimeManager.subscribe({
    table: 'xxx',
    filter: `some_id=eq.${id}`,
    handlers: {
      onInsert: record => {
        /* 處理新增 */
      },
      onUpdate: record => {
        /* 處理更新 */
      },
      onDelete: record => {
        /* 處理刪除 */
      },
    },
  })
}

// 3. 建立 useXXXRealtime Hook
export function useXXXRealtime(id) {
  useEffect(() => {
    if (!id) return
    subscribeToXXX(id)
    return () => unsubscribeFromXXX()
  }, [id])
}

// 4. 在頁面中使用
function XXXPage() {
  useXXXRealtime(currentId)
  // ...
}
```

---

## 📝 相關文檔

- **REALTIME_TESTING_GUIDE.md** - 完整測試指南
- **PHASE2_CHANNELS_REALTIME_COMPLETE.md** - Phase 2 報告
- **WHY_REALTIME_VS_RTK_QUERY.md** - 技術選型說明
- **SYNC_COMPARISON_CORNEREP_VS_VENTURO.md** - 與 CornerERP 比較

---

**Phase 3 改造完成！準備測試！** 🎉
