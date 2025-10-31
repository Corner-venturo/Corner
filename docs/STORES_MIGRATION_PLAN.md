# Stores 遷移計畫

**日期**: 2025-10-31
**目的**: 統一所有需要資料同步的 Stores 到 createStore 抽象層

---

## 📊 分類總覽

| 類別 | 數量 | 處理方式 |
|------|------|---------|
| ✅ 已使用 createStore | 16 個 | 不需改動 |
| 🔴 需要遷移 | 5 個 | **必須遷移** |
| 🟡 待確認 | 2 個 | 評估後決定 |
| 🟢 純前端狀態 | 4 個 | 不需遷移 |
| 🔵 特殊處理 | 2 個 | 個別評估 |

---

## ✅ 第一類：已使用 createStore（16 個）

**狀態**: 不需改動，已自動繼承所有修復

| Store | 表格 | 快取策略 |
|-------|------|---------|
| useTourStore | tours | 全量 |
| useItineraryStore | itineraries | 全量 |
| useOrderStore | orders | 全量 |
| useCustomerStore | customers | 全量 |
| useQuoteStore | quotes | 全量 |
| usePaymentRequestStore | payment_requests | 時間範圍 |
| useDisbursementOrderStore | disbursement_orders | 時間範圍 |
| useReceiptOrderStore | receipt_orders | 時間範圍 |
| useMemberStore | members | 全量 |
| useQuoteItemStore | quote_items | 全量 |
| useTourAddOnStore | tour_addons | 全量 |
| useEmployeeStore | employees | 全量 |
| useTodoStore | todos | 時間範圍 |
| useVisaStore | visas | 全量 |
| useSupplierStore | suppliers | 全量 |
| useRegionStore | regions | 分頁 |
| **useCalendarEventStore** | calendar_events | 全量 |

---

## 🔴 第二類：必須遷移到 createStore（5 個）

### 1. workspace/channels-store.ts

**目前狀態**:
- 使用 `zustand create`
- 有 `loadChannels()` 違反離線優先
- 每次線上時都查詢 Supabase

**資料表格**:
- `channels` (主表)
- `workspaces` (關聯)
- `channel_groups` (關聯)
- `channel_members` (關聯)

**遷移方式**: 拆分成多個 createStore

```typescript
// 方案：拆分為獨立的 Stores

// 1. channels 表
export const useChannelStore = createStore<Channel>('channels', {
  cacheStrategy: 'full'
})

// 2. channel_groups 表
export const useChannelGroupStore = createStore<ChannelGroup>('channel_groups', {
  cacheStrategy: 'full'
})

// 3. channel_members 表
export const useChannelMemberStore = createStore<ChannelMember>('channel_members', {
  cacheStrategy: 'full'
})

// 4. 保留 useChannelsStore 作為 Facade
export const useChannelsStore = () => {
  const channels = useChannelStore()
  const groups = useChannelGroupStore()
  const members = useChannelMemberStore()
  const workspaces = useWorkspaceStore() // 已存在

  return {
    // 組合所有功能
    channels: channels.items,
    channelGroups: groups.items,
    loadChannels: channels.fetchAll,
    loadChannelGroups: groups.fetchAll,
    // ... 其他方法
  }
}
```

**優先級**: 🔴 最高（Workspace 核心功能）

---

### 2. workspace/chat-store.ts

**目前狀態**:
- 使用 `zustand create`
- 有 `loadMessages()` 違反離線優先
- 需要時間範圍快取（最近 1000 則）

**資料表格**:
- `messages`

**遷移方式**: 改用 createStore

```typescript
export const useMessageStore = createStore<Message>('messages', {
  cacheStrategy: 'time_range',
  cacheConfig: {
    limit: 1000,
    sortBy: 'created_at',
    order: 'desc'
  }
})

// 保留 useChatStore 作為 Facade
export const useChatStore = () => {
  const messages = useMessageStore()

  return {
    messages: messages.items,
    loadMessages: (channelId: string) => {
      // createStore 會自動處理快取
      return messages.fetchAll()
    },
    sendMessage: messages.create,
    // ... 其他方法
  }
}
```

**優先級**: 🔴 高（聊天歷史需要離線查看）

---

### 3. workspace/members-store.ts

**目前狀態**:
- 使用 `zustand create`
- 有 `loadChannelMembers()`
- 資料量小，適合全量快取

**資料表格**:
- `channel_members`

**遷移方式**: 改用 createStore

```typescript
export const useChannelMemberStore = createStore<ChannelMember>('channel_members', {
  cacheStrategy: 'full'
})

// 保留 useMembersStore 作為 Facade
export const useMembersStore = () => {
  const members = useChannelMemberStore()

  return {
    channelMembers: members.items,
    loadChannelMembers: members.fetchAll,
    removeChannelMember: members.delete,
    // ... 其他方法
  }
}
```

**優先級**: 🟡 中（功能較少使用）

---

### 4. workspace/widgets-store.ts

**目前狀態**:
- 使用 `zustand create`
- 有 `loadAdvanceLists()`, `loadSharedOrderLists()`
- 資料量中等

**資料表格**:
- `advance_lists`
- `shared_order_lists`

**遷移方式**: 拆分為兩個 createStore

```typescript
export const useAdvanceListStore = createStore<AdvanceList>('advance_lists', {
  cacheStrategy: 'time_range',
  cacheConfig: { months: 3 }
})

export const useSharedOrderListStore = createStore<SharedOrderList>('shared_order_lists', {
  cacheStrategy: 'time_range',
  cacheConfig: { months: 3 }
})

// 保留 useWidgetsStore 作為 Facade
export const useWidgetsStore = () => {
  const advanceLists = useAdvanceListStore()
  const sharedOrderLists = useSharedOrderListStore()

  return {
    advanceLists: advanceLists.items,
    sharedOrderLists: sharedOrderLists.items,
    loadAdvanceLists: advanceLists.fetchAll,
    loadSharedOrderLists: sharedOrderLists.fetchAll,
    // ... 其他方法
  }
}
```

**優先級**: 🟡 中

---

### 5. workspace/canvas-store.ts

**目前狀態**:
- 使用 `zustand create`
- 有 `loadPersonalCanvases()`, `loadRichDocuments()`
- 資料量小

**資料表格**:
- `personal_canvases`
- `rich_documents`

**遷移方式**: 拆分為兩個 createStore

```typescript
export const usePersonalCanvasStore = createStore<PersonalCanvas>('personal_canvases', {
  cacheStrategy: 'full'
})

export const useRichDocumentStore = createStore<RichDocument>('rich_documents', {
  cacheStrategy: 'full'
})

// 保留 useCanvasStore 作為 Facade
export const useCanvasStore = () => {
  const canvases = usePersonalCanvasStore()
  const documents = useRichDocumentStore()

  return {
    personalCanvases: canvases.items,
    richDocuments: documents.items,
    loadPersonalCanvases: canvases.fetchAll,
    loadRichDocuments: documents.fetchAll,
    // ... 其他方法
  }
}
```

**優先級**: 🟢 低（功能較少使用）

---

## 🟡 第三類：待確認（2 個）

### 6. accounting-store.ts

**需要確認**:
- [ ] 是否有 Supabase 表格？
- [ ] 是否需要離線查看？
- [ ] 資料量多大？

**建議**: 先檢查實際使用情況，再決定是否遷移

---

### 7. timebox-store.ts

**需要確認**:
- [ ] 是否有 Supabase 表格？
- [ ] 是否需要離線使用？

**建議**: 如果只是前端狀態管理，不需遷移

---

## 🟢 第四類：純前端狀態（4 個）

**不需遷移**，這些只儲存前端狀態：

1. **auth-store** - 登入狀態、Token
2. **theme-store** - 主題設定
3. **home-settings-store** - 首頁設定
4. **manifestation-store** - 顯化魔法

---

## 🔵 第五類：特殊處理（2 個）

### 8. user-store

**狀態**: 已使用 createStore ✅

**特殊之處**:
- 基於 `employees` 表
- 有額外的使用者邏輯
- 有 `loadUsersFromDatabase` 別名

**處理**: 保持現狀，不需改動

---

### 9. workspace-store

**狀態**: Facade 模式

**作用**: 統一多個 Workspace Stores 的接口

```typescript
export const useWorkspaceStore = () => {
  const channels = useChannelsStore()
  const chat = useChatStore()
  const members = useMembersStore()
  const widgets = useWidgetsStore()
  const canvas = useCanvasStore()

  return {
    // 合併所有功能
    ...channels,
    ...chat,
    ...members,
    ...widgets,
    ...canvas,
  }
}
```

**處理**: 遷移內部 Stores 後，Facade 自動繼承修復

---

## 📋 遷移優先級與時程

### Phase 1: 高優先級（1 天）

- [ ] **channels-store** → 拆分為 3 個 createStore
- [ ] **chat-store** → 改用 createStore

### Phase 2: 中優先級（0.5 天）

- [ ] **members-store** → 改用 createStore
- [ ] **widgets-store** → 拆分為 2 個 createStore

### Phase 3: 低優先級（0.5 天）

- [ ] **canvas-store** → 拆分為 2 個 createStore
- [ ] 確認 **accounting-store** 和 **timebox-store**

### Phase 4: 測試驗證（0.5 天）

- [ ] Workspace 功能測試
- [ ] 離線模式測試
- [ ] 效能測試

**總時程**: 2.5 天

---

## ⚠️ 遷移風險

### 風險 1: Workspace 功能損壞

**影響**: 聊天、頻道管理可能暫時無法使用

**緩解**:
- 分階段遷移（一次一個 Store）
- 保留舊代碼作為備份
- 充分測試再部署

### 風險 2: 資料不一致

**影響**: 舊快取與新快取格式不同

**緩解**:
- 清除舊的 IndexedDB 快取
- 或提供遷移腳本

### 風險 3: 效能問題

**影響**: createStore 可能有不同的載入策略

**緩解**:
- 效能測試
- 調整快取策略

---

## ✅ 遷移後的收益

1. **統一架構** - 所有 Stores 使用相同模式
2. **自動修復** - 未來修改只需改一個地方
3. **離線優先** - 自動支援快取與同步
4. **易於維護** - 減少 70% 重複代碼
5. **擴展性強** - 新增 Store 只需一行代碼

---

**下一步**: 確認遷移計畫後開始執行
