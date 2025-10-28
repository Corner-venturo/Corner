# VENTURO 5.0 功能規格表

**版本**: 1.0.0
**日期**: 2025-01-07
**目的**: 統一各功能的欄位、API、串接規範

---

## 📋 功能模組總覽

VENTURO 系統共有 **19 個核心功能模組**：

| # | 功能模組 | 路徑 | 狀態 | 優先級 |
|---|---------|------|------|--------|
| 1 | 🏠 工作區 (Workspace) | `/workspace` | ✅ 已實作 | P0 |
| 2 | ✅ 待辦事項 (Todos) | `/todos` | ✅ 已實作 | P0 |
| 3 | 🗓️ 行事曆 (Calendar) | `/calendar` | ✅ 已實作 | P0 |
| 4 | ⏰ 時間盒 (Timebox) | `/timebox` | ✅ 已實作 | P1 |
| 5 | 🏨 旅遊團 (Tours) | `/tours` | ⚠️ 需修正 | P0 |
| 6 | 📝 行程表 (Itinerary) | `/itinerary` | ✅ 已實作 | P0 |
| 7 | 📋 訂單 (Orders) | `/orders` | ⚠️ 需修正 | P0 |
| 8 | 💰 報價單 (Quotes) | `/quotes` | ⚠️ 需修正 | P0 |
| 9 | 👥 客戶管理 (Customers) | `/customers` | ⚠️ 需修正 | P1 |
| 10 | 💳 財務管理 (Finance) | `/finance` | ⚠️ 需修正 | P0 |
| 11 | 📊 會計系統 (Accounting) | `/accounting` | ⚠️ 需修正 | P0 |
| 12 | 👔 人事管理 (HR) | `/hr` | ⚠️ 需修正 | P1 |
| 13 | 🌍 簽證管理 (Visas) | `/visas` | ⚠️ 需修正 | P2 |
| 14 | 🗂️ 基礎資料 (Database) | `/database` | ⚠️ 需修正 | P1 |
| 15 | 📄 模板系統 (Templates) | `/templates` | ✅ 已實作 | P1 |
| 16 | 👤 檔案管理 (Profile) | `/profile-manager` | ⚠️ 需修正 | P2 |
| 17 | 📚 導覽 (Guide) | `/guide` | ✅ 已實作 | P2 |
| 18 | ⚙️ 系統設定 (Settings) | `/settings` | ✅ 已實作 | P1 |
| 19 | 🔐 登入系統 (Auth) | `/login` | ✅ 已實作 | P0 |

**優先級說明**：
- P0：核心功能，必須優先修復
- P1：重要功能，次要優先
- P2：輔助功能，最後處理

---

## 📖 功能規格表格範本

每個功能的規格表格包含以下章節：

### 1. 基本資訊
- 功能名稱
- 路徑
- 狀態
- 負責人
- 更新日期

### 2. 功能說明
- 用途描述
- 主要使用者
- 業務流程

### 3. 資料模型
- 資料表名稱
- 欄位定義（欄位名、型別、必填、說明）
- 關聯關係

### 4. UI 組件
- 頁面組件清單
- 組件檔案路徑
- 使用的 UI 元件

### 5. 資料層架構
- Hook（業務邏輯層）
- Service（API 層）
- Store（狀態管理層）
- Database（資料持久層）

### 6. API 端點（Phase 3）
- API 路徑
- HTTP 方法
- 請求/回應格式

### 7. 權限控制
- 可操作角色
- 特殊限制

### 8. 已知問題
- 欄位命名不一致
- 資料結構衝突
- 功能缺失

---

## 🏠 範例：工作區 (Workspace) 功能規格

### 1. 基本資訊

| 項目 | 內容 |
|------|------|
| **功能名稱** | 工作區 (Workspace) |
| **路徑** | `/workspace` |
| **狀態** | ✅ 已完成實作 |
| **更新日期** | 2025-01-07 |

### 2. 功能說明

**用途描述**：
- 團隊協作中心
- 頻道式訊息系統
- 個人 Canvas 筆記
- 任務看板整合

**主要使用者**：
- 全體員工

**業務流程**：
1. 使用者進入工作區
2. 查看/切換頻道
3. 發送訊息、附件
4. 使用個人 Canvas 記錄
5. 查看任務列表

### 3. 資料模型

#### 3.1 頻道 (Channel)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 頻道唯一識別碼 |
| `name` | string | ✅ | 頻道名稱 |
| `description` | string | ❌ | 頻道說明 |
| `type` | 'public' \| 'private' | ✅ | 頻道類型 |
| `creatorId` | string (UUID) | ✅ | 建立者 ID（關聯 User） |
| `memberIds` | string[] | ✅ | 成員 ID 列表 |
| `createdAt` | string (ISO 8601) | ✅ | 建立時間 |
| `updatedAt` | string (ISO 8601) | ✅ | 更新時間 |

#### 3.2 訊息 (Message)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 訊息唯一識別碼 |
| `channelId` | string (UUID) | ✅ | 所屬頻道 ID |
| `senderId` | string (UUID) | ✅ | 發送者 ID（關聯 User） |
| `content` | string | ✅ | 訊息內容 |
| `attachments` | Attachment[] | ❌ | 附件列表 |
| `createdAt` | string (ISO 8601) | ✅ | 發送時間 |
| `updatedAt` | string (ISO 8601) | ✅ | 更新時間 |
| `isEdited` | boolean | ✅ | 是否已編輯 |

#### 3.3 Canvas 筆記 (CanvasNote)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 筆記唯一識別碼 |
| `userId` | string (UUID) | ✅ | 擁有者 ID |
| `title` | string | ✅ | 筆記標題 |
| `content` | string | ✅ | 筆記內容（HTML） |
| `position` | { x: number, y: number } | ❌ | Canvas 位置 |
| `createdAt` | string (ISO 8601) | ✅ | 建立時間 |
| `updatedAt` | string (ISO 8601) | ✅ | 更新時間 |

**關聯關係**：
```
User (1) ----< (N) Channel (建立)
User (N) ----< (N) Channel (成員)
Channel (1) ----< (N) Message
User (1) ----< (N) Message
User (1) ----< (N) CanvasNote
```

### 4. UI 組件

| 組件名稱 | 檔案路徑 | 說明 |
|----------|---------|------|
| WorkspacePage | `src/app/workspace/page.tsx` | 工作區主頁 |
| ChannelList | `src/components/workspace/channel-list.tsx` | 頻道列表 |
| ChannelView | `src/components/workspace/channel-view.tsx` | 頻道訊息視圖 |
| CanvasView | `src/components/workspace/canvas-view.tsx` | Canvas 筆記視圖 |
| WorkspaceTaskList | `src/components/workspace/workspace-task-list.tsx` | 任務列表 |
| CreateChannelDialog | `src/components/workspace/create-channel-dialog.tsx` | 建立頻道對話框 |

### 5. 資料層架構

**目前實作**：
```typescript
// Store 層（Zustand）
src/stores/workspace-store.ts

// 功能：
- channels: Channel[]              // 頻道列表
- currentChannelId: string | null  // 當前頻道
- messages: Message[]              // 訊息列表
- canvasNotes: CanvasNote[]        // Canvas 筆記

// Actions:
- createChannel(data)
- switchChannel(id)
- sendMessage(content)
- updateCanvasNote(id, data)
```

**未來 Phase 3 架構**：
```
UI (WorkspacePage)
  ↓
Hook (useWorkspace)
  ↓
Service (WorkspaceService)
  ↓
API (/api/channels, /api/messages)
  ↓
Supabase (channels, messages, canvas_notes)
```

### 6. API 端點（Phase 3）

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/channels` | GET | 取得所有頻道 |
| `/api/channels` | POST | 建立新頻道 |
| `/api/channels/:id` | GET | 取得頻道詳情 |
| `/api/channels/:id` | PATCH | 更新頻道 |
| `/api/channels/:id` | DELETE | 刪除頻道 |
| `/api/channels/:id/messages` | GET | 取得頻道訊息 |
| `/api/messages` | POST | 發送訊息 |
| `/api/canvas-notes` | GET | 取得個人 Canvas |
| `/api/canvas-notes` | POST | 建立筆記 |
| `/api/canvas-notes/:id` | PATCH | 更新筆記 |

### 7. 權限控制

| 操作 | 允許角色 | 說明 |
|------|---------|------|
| 查看公開頻道 | 所有人 | - |
| 查看私人頻道 | 頻道成員 | - |
| 建立頻道 | 所有人 | - |
| 發送訊息 | 頻道成員 | - |
| 編輯頻道 | 頻道建立者、管理員 | - |
| 刪除頻道 | 頻道建立者、管理員 | - |
| Canvas 筆記 | 本人 | 完全私人 |

### 8. 已知問題

- ✅ 無已知問題（新實作，架構完整）

---

---

## ✅ 待辦事項 (Todos) 功能規格

### 1. 基本資訊

| 項目 | 內容 |
|------|------|
| **功能名稱** | 待辦事項 (Todos) |
| **路徑** | `/todos` |
| **狀態** | ✅ 已完成實作 |
| **更新日期** | 2025-01-07 |

### 2. 功能說明

**用途描述**：
- 任務管理中心
- 支援個人待辦與專案待辦
- 子任務分解
- 關聯其他業務（旅遊團、報價單、訂單等）
- 快速操作（建立收款、報價、分組等）
- 協作與通知機制

**主要使用者**：
- 全體員工

**業務流程**：
1. 使用者建立待辦事項
2. 設定優先級（1-5星）、截止日期
3. 可指派給其他人或分享協作
4. 新增子任務、備註
5. 關聯業務項目（旅遊團、報價單等）
6. 使用快速操作建立相關單據
7. 完成後標記完成或取消

### 3. 資料模型

#### 3.1 待辦事項 (Todo)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 待辦唯一識別碼 |
| `title` | string | ✅ | 任務標題 |
| `description` | string | ❌ | 任務描述 |
| `priority` | 1 \| 2 \| 3 \| 4 \| 5 | ✅ | 星級緊急度 |
| `deadline` | string (ISO 8601) | ❌ | 截止日期 |
| `status` | 'pending' \| 'in_progress' \| 'completed' \| 'cancelled' | ✅ | 任務狀態 |
| `completed` | boolean | ❌ | 完成標記（對齊資料庫） |
| `completedAt` | string (ISO 8601) | ❌ | 完成時間（用於離線衝突解決） |
| `type` | 'personal' \| 'project' | ❌ | 待辦類型（預設 personal） |
| `parentId` | string (UUID) | ❌ | 父任務 ID（子任務用） |
| `projectId` | string (UUID) | ❌ | 關聯專案 ID（旅遊團/報價單） |
| `projectType` | 'tour' \| 'quote' | ❌ | 專案類型 |
| `creator` | string (UUID) | ✅ | 建立者 ID（關聯 User） |
| `assignee` | string (UUID) | ❌ | 被指派者 ID（關聯 User） |
| `sharedWith` | string[] | ✅ | 協作者 ID 列表 |
| `visibility` | string[] | ✅ | 可見人員 ID 列表 |
| `lastModifiedBy` | string (UUID) | ❌ | 最後修改者 ID |
| `relatedItems` | RelatedItem[] | ✅ | 關聯業務項目列表 |
| `subTasks` | SubTask[] | ✅ | 子任務列表 |
| `notes` | Note[] | ✅ | 備註列表 |
| `enabledQuickActions` | QuickAction[] | ✅ | 啟用的快速操作 |
| `needsCreatorNotification` | boolean | ❌ | 需通知建立者 |
| `createdAt` | string (ISO 8601) | ✅ | 建立時間 |
| `updatedAt` | string (ISO 8601) | ✅ | 更新時間 |

#### 3.2 關聯項目 (RelatedItem)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `type` | 'group' \| 'quote' \| 'order' \| 'invoice' \| 'receipt' \| 'tour' \| 'payment' \| 'visa' | ✅ | 關聯類型 |
| `id` | string (UUID) | ✅ | 關聯項目 ID |
| `title` | string | ✅ | 關聯項目標題 |

#### 3.3 子任務 (SubTask)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 子任務 ID |
| `title` | string | ✅ | 子任務標題 |
| `done` | boolean | ✅ | 完成狀態 |
| `completedAt` | string (ISO 8601) | ❌ | 完成時間 |

#### 3.4 備註 (Note)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `timestamp` | string (ISO 8601) | ✅ | 時間戳記 |
| `content` | string | ✅ | 備註內容 |
| `userId` | string (UUID) | ✅ | 留言者 ID |

#### 3.5 快速操作類型 (QuickAction)

```typescript
type QuickAction = 'receipt' | 'invoice' | 'group' | 'quote' | 'assign';
```

**關聯關係**：
```
User (1) ----< (N) Todo (建立者)
User (1) ----< (N) Todo (指派者)
User (N) ----< (N) Todo (分享協作)
Tour (1) ----< (N) Todo (專案關聯)
Quote (1) ----< (N) Todo (專案關聯)
Todo (1) ----< (N) Todo (父子任務)
```

### 4. UI 組件

| 組件名稱 | 檔案路徑 | 說明 |
|----------|---------|------|
| TodosPage | `src/app/todos/page.tsx` | 待辦事項主頁 |
| TodoCardGroups | `src/components/todos/todo-card-groups.tsx` | 卡片分組視圖 |
| TodoExpandedView | `src/components/todos/todo-expanded-view.tsx` | 待辦詳細視圖 |
| QuickReceipt | `src/components/todos/quick-actions/quick-receipt.tsx` | 快速建立收款 |
| QuickDisbursement | `src/components/todos/quick-actions/quick-disbursement.tsx` | 快速建立撥款 |
| QuickGroup | `src/components/todos/quick-actions/quick-group.tsx` | 快速建立分組 |
| EnhancedTable | `src/components/ui/enhanced-table.tsx` | 列表視圖表格 |
| StarRating | `src/components/ui/star-rating.tsx` | 優先級星級組件 |

### 5. 資料層架構

**目前實作（Phase 1）**：
```typescript
// Store 層（Zustand）
src/stores/create-store.ts (工廠函數)
export const useTodoStore = createStore<Todo>('todos', 'TD');

// Hook 層（業務邏輯）
src/features/todos/hooks/useTodos.ts
- createTodo(data)
- updateTodo(id, data)
- deleteTodo(id)
- toggleTodo(id)
- loadTodos(userId)
- getTodosByUser(userId)
- getTodosByStatus(completed)
- getTodosByPriority(priority)
- getOverdueTodos()
- getTodayTodos()
- getUpcomingTodos(days)

// Service 層（資料驗證）
src/features/todos/services/todo.service.ts
- validate(data): 標題不能為空、日期格式檢查
- toggleTodo(id)
- getTodosByUser(userId)
- getOverdueTodos()
```

**未來 Phase 3 架構**：
```
UI (TodosPage)
  ↓
Hook (useTodos)
  ↓
Service (TodoService)
  ↓
API (/api/todos)
  ↓
Supabase (todos 表)
```

### 6. API 端點（Phase 3）

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/todos` | GET | 取得待辦列表（可篩選 userId, status） |
| `/api/todos` | POST | 建立新待辦 |
| `/api/todos/:id` | GET | 取得待辦詳情 |
| `/api/todos/:id` | PATCH | 更新待辦 |
| `/api/todos/:id` | DELETE | 刪除待辦 |
| `/api/todos/:id/toggle` | POST | 切換完成狀態 |
| `/api/todos/:id/subtasks` | POST | 新增子任務 |
| `/api/todos/:id/notes` | POST | 新增備註 |

### 7. 權限控制

| 操作 | 允許角色 | 說明 |
|------|---------|------|
| 查看待辦 | 建立者、指派者、分享者 | 根據 visibility 欄位 |
| 建立待辦 | 所有人 | - |
| 編輯待辦 | 建立者、指派者 | - |
| 刪除待辦 | 建立者 | 僅建立者可刪除 |
| 標記完成 | 建立者、指派者 | - |
| 新增備註 | 建立者、指派者、分享者 | 可見即可留言 |
| 新增子任務 | 建立者、指派者 | - |

### 8. 已知問題

#### 8.1 欄位命名問題
- ✅ 已統一使用 camelCase
- ✅ 無 snake_case 混用

#### 8.2 資料結構問題
- ⚠️ `completed` 和 `status` 雙重狀態可能造成不一致
  - 建議：統一用 `status`，移除 `completed`（但需保留以相容資料庫）

#### 8.3 功能缺失
- ⚠️ 快速操作功能尚未完整實作
  - `QuickReceipt` 已實作
  - `QuickDisbursement` 已實作
  - `QuickGroup` 已實作
  - `QuickQuote`、`QuickAssign` 待實作

#### 8.4 離線衝突處理
- ⚠️ `completedAt` 欄位設計用於衝突解決，但尚未實作完整邏輯
- ⚠️ 多人同時編輯同一待辦的衝突處理策略未定義

#### 8.5 通知機制
- ⚠️ `needsCreatorNotification` 欄位已準備，但通知系統尚未實作

### 9. 修復建議

**優先修復（P0）**：
1. 釐清 `completed` vs `status` 的使用邏輯
2. 統一「結案」的英文名稱（目前混用 'completed'）

**次要修復（P1）**：
3. 完成快速操作功能（QuickQuote、QuickAssign）
4. 實作通知機制

**未來優化（P2）**：
5. 實作離線衝突解決策略
6. 支援拖拉排序
7. 支援批次操作

---

---

## 🏨 旅遊團 (Tours) 功能規格

### 1. 基本資訊

| 項目 | 內容 |
|------|------|
| **功能名稱** | 旅遊團管理 (Tours) |
| **路徑** | `/tours` |
| **狀態** | ⚠️ 需修正（欄位不一致、狀態命名問題） |
| **更新日期** | 2025-01-07 |

### 2. 功能說明

**用途描述**：
- 旅行社核心業務管理系統
- 團體資訊建立與管理
- 訂單、團員、收款、成本整合
- 加購、退費處理
- 團務操作與文件管理
- 財務試算與報表

**主要使用者**：
- 業務人員（建立與管理旅遊團）
- 助理（團員名單、文件確認）
- 會計（收款、成本）
- 管理層（財務報表）

**業務流程**：
1. 從報價單轉換或直接建立旅遊團
2. 自動生成團號（地區碼+日期+序號）
3. 建立訂單，分配給業務與助理
4. 團員資料登記（護照、簽證）
5. 房間分配、加購處理
6. 收款記錄、成本支出
7. 文件確認、簽約
8. 團務指派與執行
9. 結案與財務結算

### 3. 資料模型

#### 3.1 旅遊團 (Tour)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 旅遊團唯一識別碼 |
| `code` | string | ✅ | 團號（如 TYO250107001） |
| `name` | string | ✅ | 旅遊團名稱 |
| `departureDate` | string (ISO 8601) | ✅ | 出發日期 |
| `returnDate` | string (ISO 8601) | ✅ | 返回日期 |
| `status` | '提案' \| '進行中' \| '待結案' \| '結案' \| '特殊團' | ✅ | 旅遊團狀態 |
| `location` | string | ✅ | 目的地 |
| `price` | number | ✅ | 每人價格 |
| `maxParticipants` | number | ✅ | 最大參與人數 |
| `currentParticipants` | number | ❌ | 當前參與人數 |
| `contractStatus` | '未簽署' \| '已簽署' | ✅ | 合約狀態 |
| `totalRevenue` | number | ✅ | 總收入 |
| `totalCost` | number | ✅ | 總成本 |
| `profit` | number | ✅ | 利潤 |
| `quoteId` | string (UUID) | ❌ | 關聯的報價單 ID |
| `quoteCostStructure` | QuoteCategory[] | ❌ | 報價成本結構快照 |
| `isSpecial` | boolean | ❌ | 是否為特殊團 |
| `createdAt` | string (ISO 8601) | ✅ | 建立時間 |
| `updatedAt` | string (ISO 8601) | ✅ | 更新時間 |

#### 3.2 加購項目 (TourAddOn)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 加購項目 ID |
| `tourId` | string (UUID) | ✅ | 所屬旅遊團 ID |
| `name` | string | ✅ | 加購項目名稱 |
| `price` | number | ✅ | 價格 |
| `description` | string | ❌ | 說明 |
| `isActive` | boolean | ✅ | 是否啟用 |
| `createdAt` | string (ISO 8601) | ✅ | 建立時間 |
| `updatedAt` | string (ISO 8601) | ✅ | 更新時間 |

#### 3.3 退費項目 (TourRefund)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 退費項目 ID |
| `tourId` | string (UUID) | ✅ | 所屬旅遊團 ID |
| `orderId` | string (UUID) | ✅ | 訂單 ID |
| `orderNumber` | string | ✅ | 訂單號碼 |
| `memberName` | string | ✅ | 團員姓名 |
| `reason` | string | ✅ | 退費原因 |
| `amount` | number | ✅ | 退費金額 |
| `status` | '申請中' \| '已核准' \| '已退款' \| '已拒絕' | ✅ | 退費狀態 |
| `appliedDate` | string (ISO 8601) | ✅ | 申請日期 |
| `processedDate` | string (ISO 8601) | ❌ | 處理日期 |
| `notes` | string | ❌ | 備註 |
| `createdAt` | string (ISO 8601) | ✅ | 建立時間 |
| `updatedAt` | string (ISO 8601) | ✅ | 更新時間 |

#### 3.4 團號生成規則

**格式**：
- 一般團：`{地區碼}{YYMMDD}{序號}`
  - 範例：`TYO250107001`（東京、2025/01/07、第1團）
- 特殊團：`SPC{YYMMDD}{序號}`
  - 範例：`SPC250107001`

**地區碼對照表**：
| 地區 | 代碼 |
|------|------|
| Tokyo 東京 | TYO |
| Osaka 大阪 | OSA |
| Kyoto 京都 | KYO |
| Okinawa 沖繩 | OKA |
| Hokkaido 北海道 | CTS |
| Fukuoka 福岡 | FUK |
| 其他 | UNK |

**關聯關係**：
```
Quote (1) ----< (1) Tour (轉換)
Tour (1) ----< (N) Order (訂單)
Order (1) ----< (N) Member (團員)
Tour (1) ----< (N) TourAddOn (加購)
Tour (1) ----< (N) TourRefund (退費)
Tour (1) ----< (N) Payment (收款)
Tour (1) ----< (N) Cost (成本)
Tour (1) ----< (N) Document (文件)
Tour (1) ----< (N) Task (任務)
```

### 4. UI 組件

| 組件名稱 | 檔案路徑 | 說明 |
|----------|---------|------|
| ToursPage | `src/app/tours/page.tsx` | 旅遊團主頁 |
| TourCard | `src/components/tours/tour-card.tsx` | 旅遊團卡片 |
| TourOverview | `src/components/tours/tour-overview.tsx` | 總覽視圖 |
| TourMembers | `src/components/tours/tour-members.tsx` | 團員名單 |
| TourOperations | `src/components/tours/tour-operations.tsx` | 團務管理 |
| TourAddOns | `src/components/tours/tour-add-ons.tsx` | 加購管理 |
| TourRefunds | `src/components/tours/tour-refunds.tsx` | 退費管理 |
| TourPayments | `src/components/tours/tour-payments.tsx` | 收款記錄 |
| TourCosts | `src/components/tours/tour-costs.tsx` | 成本支出 |
| TourDocuments | `src/components/tours/tour-documents.tsx` | 文件確認 |
| TourTaskAssignment | `src/components/tours/tour-task-assignment.tsx` | 任務指派 |
| RoomAllocation | `src/components/tours/room-allocation.tsx` | 房間分配 |
| ExpandableOrderTable | `src/components/orders/expandable-order-table.tsx` | 訂單可展開表格 |

### 5. 資料層架構

**目前實作（Phase 1）**：
```typescript
// Store 層（Zustand）
src/stores/create-store.ts (工廠函數)
export const useTourStore = createStore<Tour>('tours', 'TR');

// Hook 層（業務邏輯）
src/features/tours/hooks/useTours-advanced.ts
- useTours(params): 列表查詢
  - data, totalCount, loading, error
  - create, update, delete, refresh

- useTourDetails(tourId): 單個詳情
  - tour, financials, loading, error
  - updateStatus, generateCode, refresh

// Service 層（資料驗證）
src/features/tours/services/tour.service.ts
- validate(data):
  - 名稱長度檢查
  - 人數 > 0
  - 價格 >= 0
  - 出發日不能過去
  - 返回日 >= 出發日

- generateTourCode(location, date, isSpecial): 生成團號
- isTourCodeExists(code): 檢查團號重複
- calculateFinancialSummary(tourId): 財務摘要
- canCancelTour(tourId): 檢查可否取消
- updateTourStatus(tourId, status, reason): 更新狀態
```

**未來 Phase 3 架構**：
```
UI (ToursPage)
  ↓
Hook (useTours)
  ↓
Service (TourService)
  ↓
API (/api/tours)
  ↓
Supabase (tours, tour_addons, tour_refunds 表)
```

### 6. API 端點（Phase 3）

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/tours` | GET | 取得旅遊團列表（分頁、篩選） |
| `/api/tours` | POST | 建立新旅遊團 |
| `/api/tours/:id` | GET | 取得旅遊團詳情 |
| `/api/tours/:id` | PATCH | 更新旅遊團 |
| `/api/tours/:id` | DELETE | 刪除旅遊團 |
| `/api/tours/:id/status` | PATCH | 更新旅遊團狀態 |
| `/api/tours/:id/financials` | GET | 取得財務摘要 |
| `/api/tours/:id/addons` | GET/POST | 加購項目 |
| `/api/tours/:id/refunds` | GET/POST | 退費項目 |
| `/api/tours/generate-code` | POST | 生成團號 |

### 7. 權限控制

| 操作 | 允許角色 | 說明 |
|------|---------|------|
| 查看旅遊團 | 所有人 | - |
| 建立旅遊團 | 業務、管理員 | - |
| 編輯旅遊團 | 業務、管理員 | - |
| 刪除旅遊團 | 管理員 | 需檢查無訂單 |
| 查看財務 | 業務（自己的）、管理層、會計 | - |
| 管理加購/退費 | 業務、助理、管理員 | - |
| 結案 | 管理員、會計 | - |

### 8. 已知問題

#### 8.1 欄位命名問題
- ✅ 大部分欄位已統一使用 camelCase
- ⚠️ 無 snake_case 問題

#### 8.2 狀態命名混亂（嚴重）
- ❌ **狀態值使用中文**：`'提案' | '進行中' | '待結案' | '結案' | '特殊團'`
- **問題**：
  1. 中文不利於國際化
  2. 難以在程式碼中使用（需要字串比對）
  3. 與其他模組不一致（Orders 用英文）
  4. '結案' 重複出現在程式碼中（取消和完成都叫結案）

- **建議改為**：
  ```typescript
  status: 'draft' | 'active' | 'pending_close' | 'closed' | 'special'
  ```

#### 8.3 狀態邏輯重複
- ⚠️ `isSpecial` 欄位與 `status === '特殊團'` 重複
- **建議**：移除 `isSpecial`，用 `status === 'special'` 判斷

#### 8.4 資料計算問題
- ⚠️ `currentParticipants` 應該自動計算（從 Orders 和 Members 統計）
- ⚠️ `totalRevenue`, `totalCost`, `profit` 應該動態計算，而非儲存

#### 8.5 合約狀態不足
- ⚠️ `contractStatus` 只有「未簽署/已簽署」，缺少「待簽署」、「部分簽署」狀態

#### 8.6 財務計算邏輯問題
- ⚠️ `calculateFinancialSummary` 使用假資料（成本 = 收入 * 0.7）
- 需整合真實的訂單、收款、成本資料

#### 8.7 團號生成重複檢查
- ✅ 已實作 `isTourCodeExists` 和時間戳備案機制

#### 8.8 缺少必要欄位
- ⚠️ 缺少 `description`（行程描述）
- ⚠️ 缺少 `leadGuide`（領隊）
- ⚠️ 缺少 `notes`（內部備註）
- ⚠️ 缺少 `cancellationReason`（取消原因）
- ⚠️ 缺少 `closedAt`（結案時間）

### 9. 修復建議

**優先修復（P0）**：
1. **統一狀態命名為英文**：
   ```typescript
   status: 'draft' | 'active' | 'pending_close' | 'closed' | 'cancelled' | 'special'
   ```
2. **移除 `isSpecial` 欄位**，改用 `status === 'special'`
3. **財務欄位改為動態計算**，不儲存於 Tour 表

**次要修復（P1）**：
4. 新增必要欄位（description, leadGuide, notes, cancellationReason, closedAt）
5. 擴充 `contractStatus` 狀態
6. 實作真實的財務計算邏輯

**未來優化（P2）**：
7. 支援多幣別
8. 團體複製功能
9. 批次操作（批次結案、批次匯出）
10. 團體範本

### 10. 資料表建議（Phase 3）

```sql
CREATE TABLE tours (
  id UUID PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'draft', 'active', 'pending_close', 'closed', 'cancelled', 'special'
  location VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  max_participants INTEGER NOT NULL,
  contract_status VARCHAR(20) NOT NULL, -- 'pending', 'partial', 'signed'
  lead_guide VARCHAR(100),
  quote_id UUID REFERENCES quotes(id),
  quote_cost_structure JSONB,
  notes TEXT,
  cancellation_reason TEXT,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 自動計算欄位透過 VIEW
CREATE VIEW tours_with_stats AS
SELECT
  t.*,
  COUNT(DISTINCT o.id) as order_count,
  SUM(o.member_count) as current_participants,
  SUM(p.amount) as total_revenue,
  SUM(c.amount) as total_cost,
  SUM(p.amount) - SUM(c.amount) as profit
FROM tours t
LEFT JOIN orders o ON o.tour_id = t.id
LEFT JOIN payments p ON p.tour_id = t.id
LEFT JOIN costs c ON c.tour_id = t.id
GROUP BY t.id;
```

---

## 📝 行程表 (Itinerary) 功能規格

### 1. 基本資訊

| 項目 | 內容 |
|------|------|
| **功能名稱** | 行程表管理 (Itinerary) |
| **路徑** | `/itinerary` |
| **狀態** | ✅ 已完成實作 |
| **更新日期** | 2025-01-07 |

### 2. 功能說明

**用途描述**：
- 旅遊行程的視覺化展示系統
- 支援電腦版和手機版即時預覽
- 可產生外部分享連結
- 與旅遊團、報價單互相關聯
- 自動帶入天數、航班、飯店資訊

**主要使用者**：
- 業務人員（建立與編輯行程）
- 客戶（瀏覽外部分享頁面）
- 管理層（審核行程內容）

**業務流程**：
1. 從報價單轉換或直接建立行程
2. 輸入封面資訊（標題、圖片、地點、日期）
3. 設定航班資訊（去回程）
4. 添加行程特色和精選景點
5. 建立逐日行程（景點、餐食、住宿）
6. 即時預覽電腦版/手機版效果
7. 發佈並產生分享連結
8. 客戶透過外部連結瀏覽

### 3. 資料模型

#### 3.1 行程表 (Itinerary)

**核心說明**：行程表實際上是 **Tour 資料的擴充版本**，在 Tour Store 中储存，但包含了大量展示用欄位。

| 欄位名 | 型別 | 必填 | 說明 | ⚠️ 問題 |
|--------|------|------|------|--------|
| `id` | string (UUID) | ✅ | 行程唯一識別碼 | |
| `tourCode` | string | ✅ | 行程編號（25JFO21CIG） | |
| `title` | string | ✅ | 主標題（漫遊福岡） | |
| `subtitle` | string | ❓ | 副標題（半自由行） | |
| `tagline` | string | ❓ | 標籤文字（Venturo 2025） | |
| `description` | string | ✅ | 行程描述 | |
| `country` | string | ✅ | 國家 | |
| `city` | string | ✅ | 城市 | |
| `departureDate` | string (YYYY/MM/DD) | ✅ | 出發日期 | |
| `coverImage` | string (URL) | ✅ | 封面圖片 | |
| `status` | '草稿' \| '已發佈' | ✅ | 行程狀態 | ⚠️ **中文值** |
| `outboundFlight` | FlightInfo | ✅ | 去程航班 | |
| `returnFlight` | FlightInfo | ✅ | 回程航班 | |
| `features` | Feature[] | ✅ | 行程特色列表 | |
| `focusCards` | FocusCard[] | ✅ | 精選景點卡片 | |
| `leader` | LeaderInfo | ✅ | 領隊資訊 | |
| `meetingInfo` | MeetingInfo | ✅ | 集合資訊 | |
| `itinerarySubtitle` | string | ❓ | 行程副標題 | |
| `dailyItinerary` | DailyItinerary[] | ✅ | 逐日行程列表 | |
| `created_at` | string (ISO 8601) | ✅ | 建立時間 | |
| `updated_at` | string (ISO 8601) | ✅ | 更新時間 | |

#### 3.2 航班資訊 (FlightInfo)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `airline` | string | ✅ | 航空公司（中華航空） |
| `flightNumber` | string | ✅ | 航班號碼（CI110） |
| `departureAirport` | string | ✅ | 出發機場（TPE） |
| `departureTime` | string | ✅ | 出發時間（06:50） |
| `departureDate` | string | ✅ | 出發日期（10/21） |
| `arrivalAirport` | string | ✅ | 抵達機場（FUK） |
| `arrivalTime` | string | ✅ | 抵達時間（09:55） |
| `duration` | string | ✅ | 飛行時間（自動計算） |

#### 3.3 行程特色 (Feature)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `icon` | string | ✅ | 圖示名稱（IconBuilding） |
| `title` | string | ✅ | 特色標題 |
| `description` | string | ✅ | 特色描述 |

**可用圖示**：
- `IconBuilding`: 🏨 建築/飯店
- `IconToolsKitchen2`: 🍽️ 餐食
- `IconSparkles`: ✨ 特色
- `IconCalendar`: 📅 行程
- `IconPlane`: ✈️ 航班
- `IconMapPin`: 📍 景點

#### 3.4 精選景點 (FocusCard)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `title` | string | ✅ | 景點名稱 |
| `src` | string (URL) | ✅ | 景點圖片 |

#### 3.5 領隊資訊 (LeaderInfo)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `name` | string | ✅ | 領隊姓名 |
| `domesticPhone` | string | ✅ | 國內電話 |
| `overseasPhone` | string | ✅ | 國外電話 |

#### 3.6 集合資訊 (MeetingInfo)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `time` | string | ✅ | 集合時間 |
| `location` | string | ✅ | 集合地點 |

#### 3.7 逐日行程 (DailyItinerary)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `dayLabel` | string | ✅ | 日期標籤（Day 1） |
| `date` | string | ✅ | 日期（10/21 (二)） |
| `title` | string | ✅ | 當日主題 |
| `highlight` | string | ❓ | 特別安排 |
| `description` | string | ❓ | 當日描述 |
| `activities` | Activity[] | ❓ | 景點活動列表 |
| `recommendations` | string[] | ❓ | 推薦行程列表 |
| `meals` | Meals | ✅ | 餐食安排 |
| `accommodation` | string | ❓ | 住宿飯店 |

#### 3.8 景點活動 (Activity)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `icon` | string | ✅ | emoji 圖示（🌋） |
| `title` | string | ✅ | 活動名稱 |
| `description` | string | ❓ | 活動說明 |

#### 3.9 餐食 (Meals)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `breakfast` | string | ✅ | 早餐安排 |
| `lunch` | string | ✅ | 午餐安排 |
| `dinner` | string | ✅ | 晚餐安排 |

#### 3.10 與其他模組的關聯

```
Quote (1) ----< (1) Itinerary (從報價單轉換)
Tour (1) ----< (N) Itinerary (同個旅遊團多個版本)
Itinerary (1) ----< (N) FlightInfo
Itinerary (1) ----< (N) Feature
Itinerary (1) ----< (N) FocusCard
Itinerary (1) ----< (N) DailyItinerary
DailyItinerary (1) ----< (N) Activity
```

### 4. UI 組件

| 組件名稱 | 檔案路徑 | 說明 |
|----------|---------|------|
| ItineraryPage | `src/app/itinerary/page.tsx` | 行程表主頁 |
| NewItineraryPage | `src/app/itinerary/new/page.tsx` | 新增行程頁（左右分屏） |
| EditItineraryPage | `src/app/itinerary/[slug]/page.tsx` | 編輯行程頁 |
| TourForm | `src/components/editor/TourForm.tsx` | 行程表單編輯器 |
| TourPreview | `src/components/editor/TourPreview.tsx` | 行程即時預覽 |
| PublishButton | `src/components/editor/PublishButton.tsx` | 發佈按鈕 |

### 5. 資料層架構

**目前實作（Phase 1）**：
```typescript
// Store 層（重用 Tour Store）
src/stores/create-store.ts
export const useTourStore = createStore<Tour>('tours', 'TR');

// 無獨立的 Hook 層，直接使用 useTourStore

// Service 層
src/features/tours/services/tour.service.ts
- validate(data): 驗證行程資料
- generateTourCode(): 生成行程編號
```

**未來 Phase 3 架構**：
```
UI (ItineraryPage)
  ↓
Hook (useItineraries)
  ↓
Service (ItineraryService)
  ↓
API (/api/itineraries)
  ↓
Supabase (tours 表 + itinerary_details 表)
```

### 6. API 端點（Phase 3 規劃）

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/itineraries` | GET | 取得行程表列表 |
| `/api/itineraries` | POST | 建立新行程 |
| `/api/itineraries/:id` | GET | 取得行程詳情 |
| `/api/itineraries/:id` | PATCH | 更新行程 |
| `/api/itineraries/:id` | DELETE | 刪除行程 |
| `/api/itineraries/:id/publish` | POST | 發佈行程 |
| `/api/itineraries/:id/duplicate` | POST | 複製行程 |
| `/api/itineraries/from-quote/:quoteId` | POST | 從報價單建立行程 |

### 7. 權限控制

| 操作 | 允許角色 | 說明 |
|------|---------|------|
| 查看行程 | 所有人 | - |
| 建立行程 | 業務、管理員 | - |
| 編輯行程 | 業務、管理員 | - |
| 刪除行程 | 管理員 | - |
| 發佈行程 | 業務、管理員 | - |
| 查看分享連結 | 所有人（包含外部） | 公開分享 |

### 8. 已知問題

#### 8.1 欄位命名問題

✅ **大部分欄位已使用 camelCase**

⚠️ **status 使用中文**
```typescript
// 現狀
status: '草稿' | '已發佈'

// 建議
status: 'draft' | 'published'
```

#### 8.2 資料重複問題

⚠️ **行程表和 Tour 資料混在一起**
- Tour Store 包含了旅遊團的財務欄位（price, total_revenue）
- 也包含了行程展示用欄位（dailyItinerary, features）
- **建議**：分離為兩個表：
  - `tours`：旅遊團業務資料（人數、價格、財務）
  - `itineraries`：行程展示資料（封面、逐日行程）

#### 8.3 航班時間計算

✅ **duration 已自動計算**
- 根據 departureTime 和 arrivalTime
- 考慮時差（timezoneOffset）

#### 8.4 圖片資源管理

⚠️ **城市圖片硬編碼在程式中**
```typescript
// src/components/editor/TourForm.tsx
const cityImages: Record<string, string> = {
  "東京": "https://images.unsplash.com/...",
  "京都": "https://images.unsplash.com/...",
  // ...
};
```
- **建議**：移到資料庫的 `city_images` 表

#### 8.5 分享連結問題

⚠️ **ngrok 網址硬編碼**
```typescript
// src/app/itinerary/page.tsx
const baseUrl = 'https://frisky-masonic-mellissa.ngrok-free.dev';
const shareUrl = `${baseUrl}/view/${itinerary.id}`;
```
- **建議**：移到環境變數 `NEXT_PUBLIC_BASE_URL`

### 9. 修復建議

**優先修復（P0）**：
1. **統一 status 命名為英文**：
   ```typescript
   status: 'draft' | 'published'
   ```

2. **分離 Tour 和 Itinerary 資料**：
   - Tour: 業務資料（code, name, departure_date, price, max_participants）
   - Itinerary: 展示資料（title, subtitle, coverImage, dailyItinerary）

**次要修復（P1）**：
3. 城市圖片移到資料庫
4. 分享連結使用環境變數
5. 新增 `author` 欄位（目前從 useAuthStore 取得）

**未來優化（P2）**：
6. 支援行程範本
7. 多語言版本
8. PDF 匯出功能
9. 行程比較功能
10. SEO 優化（外部分享頁）

### 10. 資料表建議（Phase 3）

```sql
-- 行程表（與 Tour 分離）
CREATE TABLE itineraries (
  id UUID PRIMARY KEY,
  tour_id UUID REFERENCES tours(id),  -- 關聯旅遊團
  tour_code VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  tagline VARCHAR(255),
  description TEXT,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  departure_date DATE NOT NULL,
  cover_image TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'published')),
  author_id UUID REFERENCES users(id),
  
  -- 航班資訊（JSONB）
  outbound_flight JSONB NOT NULL,
  return_flight JSONB NOT NULL,
  
  -- 特色、景點、領隊、集合（JSONB）
  features JSONB,
  focus_cards JSONB,
  leader_info JSONB,
  meeting_info JSONB,
  
  -- 逐日行程（JSONB）
  itinerary_subtitle VARCHAR(255),
  daily_itinerary JSONB NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 城市圖片對照表
CREATE TABLE city_images (
  id UUID PRIMARY KEY,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(country, city)
);

-- 分享連結記錄
CREATE TABLE itinerary_shares (
  id UUID PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id),
  share_token VARCHAR(50) UNIQUE NOT NULL,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_itineraries_tour_id ON itineraries(tour_id);
CREATE INDEX idx_itineraries_status ON itineraries(status);
CREATE INDEX idx_itineraries_country_city ON itineraries(country, city);
CREATE INDEX idx_itinerary_shares_token ON itinerary_shares(share_token);
```

---

## 📋 訂單 (Orders) 功能規格

### 1. 基本資訊

| 項目 | 內容 |
|------|------|
| **功能名稱** | 訂單管理 (Orders) |
| **路徑** | `/orders` |
| **狀態** | ⚠️ 需修正（狀態混亂、欄位不一致） |
| **更新日期** | 2025-01-07 |

### 2. 功能說明

**用途描述**：
- 旅遊團訂單管理
- 客戶資料登記
- 團員名單管理
- 收款進度追蹤
- 訂單文件管理
- 與旅遊團關聯

**主要使用者**：
- 業務人員（建立訂單、追蹤收款）
- 助理（團員資料、文件處理）
- 會計（收款確認）

**業務流程**：
1. 客戶確認參加旅遊團
2. 業務建立訂單，指派業務與助理
3. 登記訂單人數，生成訂單號碼
4. 收取訂金/尾款，更新付款狀態
5. 團員填寫個人資料（護照、簽證）
6. 確認文件完整性
7. 訂單完成或取消

### 3. 資料模型

#### 3.1 訂單 (Order)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 訂單唯一識別碼 |
| `orderNumber` | string | ✅ | 訂單號碼 |
| `tourId` | string (UUID) | ✅ | 關聯旅遊團 ID |
| `code` | string | ✅ | 團號（冗餘，來自 Tour） |
| `tourName` | string | ✅ | 旅遊團名稱（冗餘） |
| `contactPerson` | string | ✅ | 聯絡人 |
| `salesPerson` | string | ✅ | 業務負責人 |
| `assistant` | string | ✅ | 助理 |
| `memberCount` | number | ✅ | 訂單人數 |
| `status` | '進行中' \| '已完成' \| '已取消' | ❌ | 訂單狀態（可選） |
| `paymentStatus` | PaymentStatus | ✅ | 付款狀態 |
| `totalAmount` | number | ✅ | 訂單總額 |
| `paidAmount` | number | ✅ | 已付金額 |
| `remainingAmount` | number | ✅ | 未付金額 |
| `customerId` | string (UUID) | ❌ | 客戶 ID（目前缺失） |
| `createdAt` | string (ISO 8601) | ✅ | 建立時間 |
| `updatedAt` | string (ISO 8601) | ✅ | 更新時間 |

#### 3.2 付款狀態 (PaymentStatus)

```typescript
type PaymentStatus = '未收款' | '部分收款' | '已收款' | '已收款' | '已完成';
```

**問題**：`'已收款'` 重複定義

#### 3.3 團員 (Member)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 團員唯一識別碼 |
| `orderId` | string (UUID) | ✅ | 所屬訂單 ID |
| `name` | string | ✅ | 中文姓名 |
| `nameEn` | string | ✅ | 英文拼音 |
| `birthday` | string (YYYY-MM-DD) | ✅ | 生日 |
| `passportNumber` | string | ✅ | 護照號碼 |
| `passportExpiry` | string (YYYY-MM-DD) | ✅ | 護照到期日 |
| `idNumber` | string | ✅ | 身分證字號 |
| `gender` | 'M' \| 'F' \| '' | ✅ | 性別（自動判斷） |
| `age` | number | ✅ | 年齡（自動計算） |
| `assignedRoom` | string | ❌ | 分配的房間 |
| `isChildNoBed` | boolean | ❌ | 小孩不佔床 |
| `reservationCode` | string | ❌ | 訂位代號 |
| `addOns` | string[] | ❌ | 加購項目 IDs |
| `refunds` | string[] | ❌ | 退費項目 IDs |
| `customFields` | Record<string, any> | ❌ | 自定義欄位 |
| `isNew` | boolean | ❌ | 新增標記 |
| `createdAt` | string (ISO 8601) | ✅ | 建立時間 |
| `updatedAt` | string (ISO 8601) | ✅ | 更新時間 |

**關聯關係**：
```
Tour (1) ----< (N) Order
Customer (1) ----< (N) Order
Order (1) ----< (N) Member
Order (1) ----< (N) Payment
```

### 4. UI 組件

| 組件名稱 | 檔案路徑 | 說明 |
|----------|---------|------|
| OrdersPage | `src/app/orders/page.tsx` | 訂單主頁 |
| ExpandableOrderTable | `src/components/orders/expandable-order-table.tsx` | 可展開訂單表格 |
| OrderKanban | `src/components/orders/order-kanban.tsx` | 看板視圖 |
| OrderList | `src/components/orders/order-list.tsx` | 列表視圖 |

### 5. 資料層架構

**目前實作（Phase 1）**：
```typescript
// Store 層（Zustand）
src/stores/create-store.ts (工廠函數)
export const useOrderStore = createStore<Order>('orders', 'OR');

// Hook 層（業務邏輯）
src/features/orders/hooks/useOrders.ts
- createOrder(data)
- updateOrder(id, data)
- deleteOrder(id)
- loadOrders()
- getOrdersByTour(tourId)
- getOrdersByStatus(status)
- getOrdersByCustomer(customerId)
- calculateTotalRevenue()
- getPendingOrders()
- getConfirmedOrders()

// Service 層（資料驗證）
src/features/orders/services/order.service.ts
- validate(data): tourId 必填、金額 >= 0
- getOrdersByTour(tourId)
- calculateTotalRevenue()
```

**未來 Phase 3 架構**：
```
UI (OrdersPage)
  ↓
Hook (useOrders)
  ↓
Service (OrderService)
  ↓
API (/api/orders)
  ↓
Supabase (orders, members 表)
```

### 6. API 端點（Phase 3）

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/orders` | GET | 取得訂單列表（可篩選） |
| `/api/orders` | POST | 建立新訂單 |
| `/api/orders/:id` | GET | 取得訂單詳情 |
| `/api/orders/:id` | PATCH | 更新訂單 |
| `/api/orders/:id` | DELETE | 刪除訂單 |
| `/api/orders/:id/members` | GET/POST | 團員管理 |
| `/api/orders/:id/payments` | GET/POST | 收款記錄 |
| `/api/orders/tour/:tourId` | GET | 取得旅遊團的所有訂單 |

### 7. 權限控制

| 操作 | 允許角色 | 說明 |
|------|---------|------|
| 查看訂單 | 所有人 | - |
| 建立訂單 | 業務、管理員 | - |
| 編輯訂單 | 業務（負責人）、助理、管理員 | - |
| 刪除訂單 | 管理員 | 需檢查無團員 |
| 團員資料 | 業務、助理、管理員 | - |
| 收款確認 | 會計、管理員 | - |

### 8. 已知問題

#### 8.1 欄位命名問題
- ✅ 大部分欄位已使用 camelCase
- ⚠️ 無 snake_case 問題

#### 8.2 狀態混亂（嚴重）
- ❌ **Order.status 使用中文**：`'進行中' | '已完成' | '已取消'`
- ❌ **PaymentStatus 使用中文**：`'未收款' | '部分收款' | '已收款' | '已完成'`
- ❌ **PaymentStatus 重複定義**：`'已收款'` 出現兩次
- ❌ **Order.status 與 PaymentStatus 語意重疊**

**建議改為**：
```typescript
// Order 狀態
status: 'pending' | 'confirmed' | 'completed' | 'cancelled'

// Payment 狀態
paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded'
```

#### 8.3 冗餘欄位問題
- ⚠️ `code` 和 `tourName` 是冗餘欄位（來自 Tour）
- **風險**：Tour 更新時，Order 的冗餘資料不會同步
- **建議**：移除冗餘，或改為動態 JOIN

#### 8.4 缺少關鍵欄位
- ❌ 缺少 `customerId`（客戶 ID）
- ❌ 缺少 `notes`（訂單備註）
- ❌ 缺少 `cancelledAt`（取消時間）
- ❌ 缺少 `cancellationReason`（取消原因）
- ❌ 缺少 `depositAmount`（訂金金額）
- ❌ 缺少 `depositPaidAt`（訂金付款時間）

#### 8.5 團員資料問題
- ⚠️ `gender` 和 `age` 應該動態計算，不應儲存
- ⚠️ `isNew` 標記用途不明，應移除

#### 8.6 付款金額計算
- ⚠️ `remainingAmount` 應該動態計算（totalAmount - paidAmount）

#### 8.7 Service 層邏輯問題
- ⚠️ `getOrdersByStatus` 使用硬編碼中文狀態（'已確認'、'已完成'）
- ⚠️ `getPendingOrders` 使用 `status === '未收款'`，但 status 不是付款狀態

### 9. 修復建議

**優先修復（P0）**：
1. **統一狀態命名為英文**：
   ```typescript
   status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
   paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded'
   ```
2. **修正 PaymentStatus 重複定義**
3. **移除或修正 Service 層硬編碼的中文狀態**

**次要修復（P1）**：
4. 新增必要欄位（customerId, notes, depositAmount 等）
5. 移除冗餘欄位（code, tourName）或改為 computed
6. `remainingAmount`, `gender`, `age` 改為動態計算
7. 移除 `isNew` 標記

**未來優化（P2）**：
8. 支援訂單範本
9. 批次匯入團員
10. 訂單複製功能
11. 文件自動提醒

### 10. 資料表建議（Phase 3）

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  tour_id UUID REFERENCES tours(id) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  contact_person VARCHAR(100) NOT NULL,
  sales_person VARCHAR(100) NOT NULL,
  assistant VARCHAR(100) NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL, -- 'pending', 'confirmed', 'completed', 'cancelled'
  payment_status VARCHAR(20) NOT NULL, -- 'unpaid', 'partial', 'paid', 'refunded'
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_amount DECIMAL(10,2),
  deposit_paid_at TIMESTAMP,
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 動態計算欄位透過 VIEW
CREATE VIEW orders_with_stats AS
SELECT
  o.*,
  o.total_amount - o.paid_amount as remaining_amount,
  t.code as tour_code,
  t.name as tour_name,
  COUNT(m.id) as actual_member_count
FROM orders o
LEFT JOIN tours t ON t.id = o.tour_id
LEFT JOIN members m ON m.order_id = o.id
GROUP BY o.id, t.id;

CREATE TABLE members (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  birthday DATE NOT NULL,
  passport_number VARCHAR(50) NOT NULL,
  passport_expiry DATE NOT NULL,
  id_number VARCHAR(20) NOT NULL,
  assigned_room VARCHAR(50),
  is_child_no_bed BOOLEAN DEFAULT FALSE,
  reservation_code VARCHAR(50),
  add_ons JSONB,
  refunds JSONB,
  custom_fields JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 性別和年齡動態計算
CREATE VIEW members_with_computed AS
SELECT
  m.*,
  CASE
    WHEN SUBSTRING(m.id_number, 2, 1) = '1' THEN 'M'
    WHEN SUBSTRING(m.id_number, 2, 1) = '2' THEN 'F'
    ELSE ''
  END as gender,
  EXTRACT(YEAR FROM AGE(t.departure_date, m.birthday)) as age
FROM members m
LEFT JOIN orders o ON o.id = m.order_id
LEFT JOIN tours t ON t.id = o.tour_id;
```

---

## 💰 報價單 (Quotes) 功能規格

### 1. 基本資訊

| 項目 | 內容 |
|------|------|
| **功能名稱** | 報價單管理 (Quotes) |
| **路徑** | `/quotes` |
| **狀態** | ⚠️ 需修正（狀態使用中文、欄位混亂） |
| **更新日期** | 2025-01-07 |

### 2. 功能說明

**用途描述**：
- 旅遊團報價單建立與管理
- 多項費用分類（住宿、交通、餐食、門票等）
- 版本控制（提案 → 最終版本）
- 報價單複製功能
- 轉換為旅遊團

**主要使用者**：
- 業務人員（建立報價單、回覆客戶）
- 會計（成本核算）

**業務流程**：
1. 客戶詢價，業務建立報價單
2. 輸入團體資訊（人數、天數、需求）
3. 逐項填寫費用明細（住宿、交通、餐食等）
4. 系統自動計算總成本
5. 可建立多個版本（修改報價）
6. 客戶確認後，轉換為旅遊團

### 3. 資料模型

#### 3.1 報價單 (Quote)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 報價單唯一識別碼 |
| `quoteNumber` | string | ❌ | 報價單號碼（QUOTE-2025-0001） |
| `name` | string | ✅ | 團體名稱 |
| `status` | '提案' \| '最終版本' | ✅ | 報價單狀態 |
| `tourId` | string (UUID) | ❌ | 關聯的旅遊團 ID（轉換後） |
| `customerName` | string | ❌ | 客戶名稱 |
| `contactPerson` | string | ❌ | 聯絡人 |
| `contactPhone` | string | ❌ | 聯絡電話 |
| `contactEmail` | string | ❌ | Email |
| `groupSize` | number | ✅ | 團體人數 |
| `accommodationDays` | number | ✅ | 住宿天數 |
| `requirements` | string | ❌ | 需求說明 |
| `budgetRange` | string | ❌ | 預算範圍 |
| `validUntil` | string (ISO 8601) | ❌ | 報價有效期 |
| `paymentTerms` | string | ❌ | 付款條件 |
| `categories` | QuoteCategory[] | ✅ | 費用分類 |
| `totalCost` | number | ✅ | 總成本 |
| `version` | number | ❌ | 版本號 |
| `versions` | QuoteVersion[] | ❌ | 版本歷史 |
| `createdAt` | string (ISO 8601) | ✅ | 建立時間 |
| `updatedAt` | string (ISO 8601) | ✅ | 更新時間 |

#### 3.2 費用分類 (QuoteCategory)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 分類唯一識別碼 |
| `name` | string | ✅ | 分類名稱（住宿、交通、餐食等） |
| `items` | QuoteItem[] | ✅ | 費用項目列表 |
| `total` | number | ✅ | 分類小計 |

#### 3.3 費用項目 (QuoteItem)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 項目唯一識別碼 |
| `name` | string | ✅ | 項目名稱 |
| `quantity` | number | ✅ | 數量 |
| `unitPrice` | number | ✅ | 單價 |
| `total` | number | ✅ | 小計（quantity × unitPrice） |
| `note` | string | ❌ | 備註 |
| `day` | number | ❌ | 第幾天（住宿專用） |
| `roomType` | string | ❌ | 房型名稱（住宿專用） |
| `isGroupCost` | boolean | ❌ | 團體分攤（交通、導遊專用） |

#### 3.4 版本歷史 (QuoteVersion)

| 欄位名 | 型別 | 必填 | 說明 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 版本唯一識別碼 |
| `version` | number | ✅ | 版本號 |
| `categories` | QuoteCategory[] | ✅ | 費用分類快照 |
| `totalCost` | number | ✅ | 總成本快照 |
| `note` | string | ❌ | 修改說明 |
| `createdAt` | string (ISO 8601) | ✅ | 建立時間 |

**關聯關係**：
```
Quote (1) ----< (1) Tour (轉換)
Quote (1) ----< (N) QuoteCategory
QuoteCategory (1) ----< (N) QuoteItem
Quote (1) ----< (N) QuoteVersion
```

### 4. UI 組件

| 組件名稱 | 檔案路徑 | 說明 |
|----------|---------|------|
| QuotesPage | `src/app/quotes/page.tsx` | 報價單主頁 |
| QuoteDetailPage | `src/app/quotes/[id]/page.tsx` | 報價單詳情頁 |
| EnhancedTable | `src/components/ui/enhanced-table.tsx` | 報價單列表 |

### 5. 資料層架構

**目前實作（Phase 1）**：
```typescript
// Store 層（Zustand）
src/stores/create-store.ts (工廠函數)
export const useQuoteStore = createStore<Quote>('quotes', 'QT');

// Hook 層（業務邏輯）
src/features/quotes/hooks/useQuotes.ts
- createQuote(data)
- updateQuote(id, data)
- deleteQuote(id)
- loadQuotes()
- duplicateQuote(id): 複製報價單
- createNewVersion(id, updates): 建立新版本
- getQuotesByTour(tourId)
- getQuotesByStatus(status)
- calculateTotalCost(quote)

// Service 層（資料驗證）
src/features/quotes/services/quote.service.ts
- validate(data): 標題長度、總金額 >= 0
- duplicateQuote(id): 複製邏輯
- createNewVersion(id, updates): 版本控制邏輯
- calculateTotalCost(quote): 成本計算
```

**未來 Phase 3 架構**：
```
UI (QuotesPage)
  ↓
Hook (useQuotes)
  ↓
Service (QuoteService)
  ↓
API (/api/quotes)
  ↓
Supabase (quotes, quote_versions 表)
```

### 6. API 端點（Phase 3）

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/quotes` | GET | 取得報價單列表 |
| `/api/quotes` | POST | 建立新報價單 |
| `/api/quotes/:id` | GET | 取得報價單詳情 |
| `/api/quotes/:id` | PATCH | 更新報價單 |
| `/api/quotes/:id` | DELETE | 刪除報價單 |
| `/api/quotes/:id/duplicate` | POST | 複製報價單 |
| `/api/quotes/:id/version` | POST | 建立新版本 |
| `/api/quotes/:id/convert-tour` | POST | 轉換為旅遊團 |

### 7. 權限控制

| 操作 | 允許角色 | 說明 |
|------|---------|------|
| 查看報價單 | 所有人 | - |
| 建立報價單 | 業務、管理員 | - |
| 編輯報價單 | 業務、管理員 | - |
| 刪除報價單 | 管理員 | 需檢查未轉換為旅遊團 |
| 複製報價單 | 業務、管理員 | - |
| 轉換為旅遊團 | 業務、管理員 | - |

### 8. 已知問題

#### 8.1 欄位命名問題
- ✅ 大部分欄位已使用 camelCase
- ⚠️ 無 snake_case 問題

#### 8.2 狀態命名問題（嚴重）
- ❌ **狀態使用中文**：`'提案' | '最終版本'`
- **問題**：
  1. 不利於國際化
  2. 語意不清（缺少「已確認」、「已取消」等狀態）

**建議改為**：
```typescript
status: 'draft' | 'proposed' | 'revised' | 'approved' | 'converted' | 'rejected'
// draft: 草稿
// proposed: 已提案
// revised: 已修改
// approved: 已核准（最終版本）
// converted: 已轉換為旅遊團
// rejected: 已拒絕
```

#### 8.3 totalCost 計算問題
- ⚠️ `totalCost` 應該動態計算，不應儲存
- **風險**：categories 更新時，totalCost 可能不同步

#### 8.4 版本控制邏輯不完整
- ⚠️ `version` 欄位與 `status` 關係不明確
- ⚠️ `versions` 陣列儲存方式冗餘（完整快照）
- **建議**：版本應獨立表格，使用差異儲存

#### 8.5 QuoteItem 計算問題
- ⚠️ `total` 應該動態計算（quantity × unitPrice）

#### 8.6 缺少關鍵欄位
- ❌ 缺少 `customerId`（客戶 ID）
- ❌ 缺少 `pricePerPerson`（每人價格）
- ❌ 缺少 `profitMargin`（利潤率）
- ❌ 缺少 `convertedAt`（轉換時間）
- ❌ 缺少 `rejectedReason`（拒絕原因）

#### 8.7 Service 層 validate 問題
- ⚠️ validate 檢查 `title` 欄位，但 Quote 沒有 `title` 欄位（應該是 `name`）

### 9. 修復建議

**優先修復（P0）**：
1. **統一狀態命名為英文**：
   ```typescript
   status: 'draft' | 'proposed' | 'revised' | 'approved' | 'converted' | 'rejected'
   ```
2. **修正 Service validate 欄位名稱**（title → name）
3. **totalCost 改為動態計算**

**次要修復（P1）**：
4. 新增必要欄位（customerId, pricePerPerson, profitMargin 等）
5. 優化版本控制邏輯
6. QuoteItem.total 改為動態計算

**未來優化（P2）**：
7. 支援報價單範本
8. PDF 匯出功能
9. Email 寄送功能
10. 報價比較功能

### 10. 資料表建議（Phase 3）

```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY,
  quote_number VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'draft', 'proposed', 'revised', 'approved', 'converted', 'rejected'
  tour_id UUID REFERENCES tours(id),
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(100),
  contact_person VARCHAR(100),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(100),
  group_size INTEGER NOT NULL,
  accommodation_days INTEGER NOT NULL,
  requirements TEXT,
  budget_range VARCHAR(100),
  valid_until DATE,
  payment_terms TEXT,
  categories JSONB NOT NULL,
  profit_margin DECIMAL(5,2),
  converted_at TIMESTAMP,
  rejected_reason TEXT,
  current_version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 動態計算 totalCost
CREATE VIEW quotes_with_cost AS
SELECT
  q.*,
  (SELECT SUM((item->>'total')::numeric)
   FROM jsonb_array_elements(q.categories) cat,
        jsonb_array_elements(cat->'items') item
  ) as total_cost,
  CASE
    WHEN q.group_size > 0 THEN
      (SELECT SUM((item->>'total')::numeric)
       FROM jsonb_array_elements(q.categories) cat,
            jsonb_array_elements(cat->'items') item
      ) / q.group_size
    ELSE 0
  END as price_per_person
FROM quotes q;

-- 版本歷史獨立表格
CREATE TABLE quote_versions (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) NOT NULL,
  version_number INTEGER NOT NULL,
  categories JSONB NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(quote_id, version_number)
);
```

---

## 📋 後續功能規格（待撰寫）

接下來將依照優先級逐一建立以下功能的完整規格：

### P0 核心功能（優先處理）
1. ✅ **工作區 (Workspace)** - 已完成
2. ✅ **待辦事項 (Todos)** - 已完成
3. ✅ **旅遊團 (Tours)** - 已完成
4. ✅ **訂單 (Orders)** - 已完成
5. ✅ **報價單 (Quotes)** - 已完成
6. ⏳ **財務管理 (Finance)** - 核心業務
7. ⏳ **會計系統 (Accounting)** - 核心業務

### P1 重要功能
8. ⏳ **行事曆 (Calendar)**
9. ⏳ **時間盒 (Timebox)**
10. ⏳ **客戶管理 (Customers)**
11. ⏳ **人事管理 (HR)**
12. ⏳ **基礎資料 (Database)**
13. ⏳ **模板系統 (Templates)**

### P2 輔助功能
14. ⏳ **簽證管理 (Visas)**
15. ⏳ **檔案管理 (Profile)**
16. ⏳ **導覽 (Guide)**

---

## 📌 使用指南

### 給 Claude AI 的指示

**開始處理某個功能時**：
1. 讀取該功能的規格表格
2. 檢查「已知問題」章節
3. 依照資料模型統一欄位命名
4. 確保 UI → Hook → Store → DB 架構完整
5. 更新「已知問題」狀態

**建立新功能規格時**：
1. 複製「工作區」範本
2. 填寫 8 個章節內容
3. 確保欄位 100% 使用 camelCase
4. 記錄所有已知問題

### 給開發者的指示

**查詢功能架構**：
```bash
# 1. 讀取功能總覽，找到目標功能
# 2. 查看該功能的完整規格
# 3. 對照程式碼，修正欄位命名
```

**提交新功能**：
```bash
# 1. 先建立功能規格文件
# 2. 經過 Review 後再開始實作
# 3. 實作完成後更新規格文件狀態
```

---

## 5️⃣ P0-5: 財務管理 (Finance)

### 1. 基本資訊

| 項目 | 內容 |
|------|------|
| **路徑** | `/finance/*` (含 5 個子模組) |
| **狀態** | ✅ 已實作 - 完整多子系統 |
| **開發階段** | Phase 1 (IndexedDB) |
| **最後更新** | 2025-01-06 |

### 2. 功能說明

#### 2.1 用途
**旅行社財務核心系統** - 管理收款、請款、出納支出、金流對帳，確保財務資料準確性。

#### 2.2 使用者
- **財務人員** - 日常收款、請款、對帳
- **會計人員** - 月結、報表生成
- **管理層** - 財務概覽、利潤分析

#### 2.3 業務流程

**主要流程：**
```
1. 收款管理 (Payments) ─┐
2. 請款管理 (Requests) ─┼─> 出納管理 (Treasury) ─> 對帳 (Reconciliation)
3. 直接支出 (Direct)   ─┘            │
                                    ↓
                              財務報表 (Reports)
```

**子模組說明：**
- **`/finance/payments`** - 收款單：單訂單多付款/批量分配收款
- **`/finance/requests`** - 請款單：按旅遊團請款，週四固定出帳
- **`/finance/treasury/disbursement`** - 出納支出：週期批次支付
- **`/finance/reports`** - 財務報表：應收/應付/淨利統計
- **`/finance/travel-invoice`** - 旅遊發票管理（未完成）

---

### 3. 資料模型

#### 3.1 Payment (收款記錄)

| 欄位名稱 | 型別 | 必填 | 說明 | ⚠️ 問題 |
|---------|------|------|------|---------|
| `id` | string | ✅ | UUID | |
| `orderId` | string | ✅ | 訂單ID | |
| `amount` | number | ✅ | 金額 | |
| `type` | `'收款' \| '請款' \| '出納'` | ✅ | 支付類型 | ⚠️ **中文值** |
| `status` | `'未收款' \| '已確認' \| '已完成'` | ✅ | 狀態 | ⚠️ **中文值** |
| `description` | string | ❌ | 說明 | |
| `createdAt` | string | ✅ | 建立時間 | |
| `updatedAt` | string | ✅ | 更新時間 | |

#### 3.2 PaymentRequest (請款單)

| 欄位名稱 | 型別 | 必填 | 說明 | ⚠️ 問題 |
|---------|------|------|------|---------|
| `id` | string | ✅ | UUID | |
| `requestNumber` | string | ✅ | 請款單號 (REQ-2025001) | |
| `tourId` | string | ✅ | 旅遊團ID | |
| `tourName` | string | ✅ | 團名 | ⚠️ 冗餘欄位 |
| `code` | string | ✅ | 團號 | ⚠️ 冗餘欄位 |
| `orderId` | string | ❌ | 訂單ID（可選） | |
| `orderNumber` | string | ❌ | 訂單編號 | ⚠️ 冗餘欄位 |
| `requestDate` | string | ❌ | 請款日期（固定週四） | |
| `items` | PaymentRequestItem[] | ✅ | 請款項目 | |
| `totalAmount` | number | ✅ | 總金額 | ⚠️ 應計算而非儲存 |
| `status` | `'pending' \| 'processing' \| 'confirmed' \| 'paid'` | ✅ | 狀態 | ✅ 使用英文 |
| `note` | string | ❌ | 備註 | |
| `isSpecialBilling` | boolean | ✅ | 是否特殊請款 | |
| `disbursementOrderId` | string | ❌ | 出納單ID | |
| `createdBy` | string | ✅ | 建立人 | |
| `confirmedBy` | string | ❌ | 確認人 | |
| `confirmedAt` | string | ❌ | 確認時間 | |
| `createdAt` | string | ✅ | 建立時間 | |
| `updatedAt` | string | ✅ | 更新時間 | |

#### 3.3 PaymentRequestItem (請款項目)

| 欄位名稱 | 型別 | 必填 | 說明 | ⚠️ 問題 |
|---------|------|------|------|---------|
| `id` | string | ✅ | UUID | |
| `requestId` | string | ✅ | 請款單ID | |
| `category` | `'住宿' \| '交通' \| '餐食' \| '門票' \| '導遊' \| '其他'` | ✅ | 費用類別 | ⚠️ **中文值** |
| `supplierId` | string | ✅ | 供應商ID | |
| `supplierName` | string | ✅ | 供應商名稱 | ⚠️ 冗餘欄位 |
| `description` | string | ❌ | 項目描述 | |
| `unitPrice` | number | ✅ | 單價 | |
| `quantity` | number | ✅ | 數量 | |
| `subtotal` | number | ✅ | 小計 | ⚠️ 應計算而非儲存 |
| `note` | string | ❌ | 備註 | |
| `sortOrder` | number | ✅ | 排序 | |

#### 3.4 DisbursementOrder (出納單)

| 欄位名稱 | 型別 | 必填 | 說明 | ⚠️ 問題 |
|---------|------|------|------|---------|
| `id` | string | ✅ | UUID | |
| `weekNumber` | string | ✅ | 週次 (2025-W02) | |
| `weekStartDate` | string | ✅ | 週起始日 | |
| `weekEndDate` | string | ✅ | 週結束日 | |
| `thursdayDate` | string | ✅ | 週四出帳日 | |
| `requestIds` | string[] | ✅ | 包含的請款單ID | |
| `totalAmount` | number | ✅ | 總金額 | ⚠️ 應計算而非儲存 |
| `status` | `'draft' \| 'confirmed' \| 'paid'` | ✅ | 狀態 | ✅ 使用英文 |
| `note` | string | ❌ | 備註 | |
| `createdBy` | string | ✅ | 建立人 | |
| `confirmedBy` | string | ❌ | 確認人 | |
| `confirmedAt` | string | ❌ | 確認時間 | |
| `paidAt` | string | ❌ | 支付時間 | |
| `createdAt` | string | ✅ | 建立時間 | |
| `updatedAt` | string | ✅ | 更新時間 | |

#### 3.5 資料關聯圖

```
┌──────────┐
│  Order   │─┐
└──────────┘ │ 1
             ├──> ┌──────────┐ N
             │    │ Payment  │ (收款記錄)
             │    └──────────┘
             │
┌──────────┐ │ 1
│   Tour   │─┼──> ┌───────────────────┐ 1
└──────────┘ │    │ PaymentRequest    │
             │    └───────────────────┘
             │              │ 1
             │              ├──> ┌──────────────────────┐ N
             │              │    │ PaymentRequestItem   │
             │              │    └──────────────────────┘
             │              │
             │              │ N
             │              └──> ┌────────────────────┐ 1
             │                   │ DisbursementOrder  │ (出納單)
             │                   └────────────────────┘
             │
┌──────────┐ │
│ Supplier │─┘ N (關聯到 PaymentRequestItem)
└──────────┘
```

---

### 4. UI 組件

#### 4.1 主要頁面

| 路徑 | 檔案 | 功能 |
|------|------|------|
| `/finance` | `src/app/finance/page.tsx` | 財務儀表板 |
| `/finance/payments` | `src/app/finance/payments/page.tsx` | 收款管理 |
| `/finance/requests` | `src/app/finance/requests/page.tsx` | 請款管理 |
| `/finance/treasury/disbursement` | `src/app/finance/treasury/disbursement/page.tsx` | 出納支出 |
| `/finance/reports` | `src/app/finance/reports/page.tsx` | 財務報表 |

#### 4.2 關鍵組件邏輯

**收款模式（Payments）：**
```typescript
// 模式 1: 單一訂單多付款
interface PaymentItem {
  paymentMethod: '現金' | '匯款' | '刷卡' | '支票';  // ⚠️ 中文
  amount: number;
  transactionDate: string;
  // 根據付款方式動態欄位
  handlerName?: string;      // 現金
  accountInfo?: string;       // 匯款
  cardLastFour?: string;      // 刷卡
  checkNumber?: string;       // 支票
}

// 模式 2: 批量分配多訂單
interface OrderAllocation {
  orderId: string;
  allocatedAmount: number;
}
```

**請款週四邏輯（Requests）：**
```typescript
// 生成接下來 8 週的週四日期
const upcomingThursdays = useMemo(() => {
  const thursdays = []
  const today = new Date()
  const currentDay = today.getDay()

  let daysUntilThursday = (4 - currentDay + 7) % 7
  if (daysUntilThursday === 0 && today.getHours() >= 12) {
    // 今天週四且已過中午，從下週四開始
    daysUntilThursday = 7
  }

  for (let i = 0; i < 8; i++) {
    const thursdayDate = new Date(today)
    thursdayDate.setDate(today.getDate() + daysUntilThursday + i * 7)
    thursdays.push({
      value: thursdayDate.toISOString().split('T')[0],
      label: `${thursdayDate.toLocaleDateString('zh-TW')} (${thursdayDate.toLocaleDateString('zh-TW', { weekday: 'short' })})`
    })
  }

  return thursdays
}, [])
```

---

### 5. 資料層架構

#### 5.1 Hook Layer

**檔案**: `src/features/payments/hooks/usePayments.ts` (84 lines)

```typescript
export const usePayments = () => {
  // === PaymentRequest 相關 ===
  const createPaymentRequest = async (data: Partial<PaymentRequest>) => {
    const requestNumber = generateRequestNumber();
    // ...
  };

  const updatePaymentRequest = async (id: string, updates: Partial<PaymentRequest>) => {
    // ...
  };

  const deletePaymentRequest = async (id: string) => {
    // ...
  };

  // 從報價單建立請款單
  const createFromQuote = async (tourId: string, quoteId: string, requestDate?: string) => {
    // 讀取 Quote 資料
    // 轉換為 PaymentRequest
  };

  // === PaymentRequestItem 相關 ===
  const addPaymentItem = async (requestId: string, item: Partial<PaymentRequestItem>) => {
    // ...
  };

  const updatePaymentItem = async (requestId: string, itemId: string, updates: Partial<PaymentRequestItem>) => {
    // ...
  };

  const deletePaymentItem = async (requestId: string, itemId: string) => {
    // ...
  };

  // === DisbursementOrder 相關 ===
  const createDisbursementOrder = async (weekNumber: string, requestIds: string[]) => {
    // ...
  };

  const confirmDisbursementOrder = async (id: string, confirmedBy: string) => {
    // ...
  };

  const getCurrentWeekDisbursementOrder = () => {
    // 取得本週出納單
    const weekNumber = format(new Date(), 'yyyy-\'W\'II');
    return disbursementOrders.find(order => order.weekNumber === weekNumber);
  };

  return {
    // PaymentRequest
    paymentRequests,
    createPaymentRequest,
    updatePaymentRequest,
    deletePaymentRequest,
    createFromQuote,

    // PaymentRequestItem
    addPaymentItem,
    updatePaymentItem,
    deletePaymentItem,

    // DisbursementOrder
    disbursementOrders,
    createDisbursementOrder,
    confirmDisbursementOrder,
    getCurrentWeekDisbursementOrder,
  };
};
```

#### 5.2 Service Layer

**檔案**: `src/features/payments/services/payment.service.ts`

```typescript
class PaymentService {
  // 生成請款單號 (REQ-2025001)
  generateRequestNumber(): string {
    const year = new Date().getFullYear();
    const count = this.paymentRequests.length + 1;
    return `REQ-${year}${count.toString().padStart(3, '0')}`;
  }

  // 取得下一個週四
  getNextThursday(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    let daysUntilThursday = (4 - dayOfWeek + 7) % 7;

    if (daysUntilThursday === 0 && today.getHours() >= 12) {
      daysUntilThursday = 7; // 今天週四過中午，取下週四
    }

    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + daysUntilThursday);
    return nextThursday.toISOString().split('T')[0];
  }

  // 從報價單創建請款單
  async createFromQuote(tourId: string, quoteId: string, requestDate?: string) {
    const quote = await quoteService.getById(quoteId);
    if (!quote) throw new Error('報價單不存在');

    // 轉換 Quote 的 categories 為 PaymentRequestItems
    const items: PaymentRequestItem[] = [];
    quote.categories.forEach(category => {
      category.items.forEach(quoteItem => {
        items.push({
          id: generateId(),
          requestId: '', // 稍後填入
          category: this.mapCategoryToChinese(category.name), // ⚠️ 映射到中文
          supplierId: '', // 需要從其他地方獲取
          supplierName: quoteItem.name,
          description: quoteItem.note || '',
          unitPrice: quoteItem.unitPrice,
          quantity: quoteItem.quantity,
          subtotal: quoteItem.total,
          note: '',
          sortOrder: items.length + 1,
        });
      });
    });

    // 創建 PaymentRequest
    const request: PaymentRequest = {
      id: generateId(),
      requestNumber: this.generateRequestNumber(),
      tourId,
      code: quote.code || '',
      tourName: quote.name || '',
      requestDate: requestDate || this.getNextThursday(),
      items,
      totalAmount: quote.totalCost,
      status: 'pending',
      isSpecialBilling: false,
      createdBy: '1', // 模擬
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.paymentRequestStore.add(request);
  }

  // 驗證請款單
  validate(data: Partial<PaymentRequest>): string[] {
    const errors: string[] = [];

    if (!data.tourId) errors.push('必須選擇旅遊團');
    if (!data.items || data.items.length === 0) errors.push('必須至少有一個請款項目');
    if (data.totalAmount && data.totalAmount <= 0) errors.push('總金額必須大於 0');

    return errors;
  }
}
```

#### 5.3 Store Layer

使用 Zustand Store Factory Pattern:

```typescript
// Store 結構（由 createStore 生成）
interface PaymentStore {
  items: Payment[];
  add: (item: Payment) => Promise<Payment>;
  update: (id: string, updates: Partial<Payment>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => Payment | undefined;
}

// 儲存到 IndexedDB
const usePaymentStore = createStore<Payment>('payments', 'payment_');
const usePaymentRequestStore = createStore<PaymentRequest>('paymentRequests', 'req_');
const useDisbursementOrderStore = createStore<DisbursementOrder>('disbursementOrders', 'disb_');
```

---

### 6. API 端點（Phase 3 規劃）

#### 6.1 收款 API

| 方法 | 端點 | 說明 | Request Body | Response |
|------|------|------|-------------|----------|
| `GET` | `/api/payments` | 取得收款列表 | Query: `?orderId=xxx&status=xxx` | `{ data: Payment[] }` |
| `POST` | `/api/payments` | 新增收款記錄 | `Payment` | `{ data: Payment }` |
| `PUT` | `/api/payments/:id` | 更新收款記錄 | `Partial<Payment>` | `{ data: Payment }` |
| `DELETE` | `/api/payments/:id` | 刪除收款記錄 | - | `{ success: true }` |

#### 6.2 請款 API

| 方法 | 端點 | 說明 | Request Body | Response |
|------|------|------|-------------|----------|
| `GET` | `/api/payment-requests` | 取得請款單列表 | Query: `?tourId=xxx&status=xxx` | `{ data: PaymentRequest[] }` |
| `GET` | `/api/payment-requests/:id` | 取得請款單詳情 | - | `{ data: PaymentRequest }` |
| `POST` | `/api/payment-requests` | 新增請款單 | `PaymentRequest` | `{ data: PaymentRequest }` |
| `POST` | `/api/payment-requests/from-quote` | 從報價單建立請款單 | `{ tourId, quoteId, requestDate? }` | `{ data: PaymentRequest }` |
| `PUT` | `/api/payment-requests/:id` | 更新請款單 | `Partial<PaymentRequest>` | `{ data: PaymentRequest }` |
| `DELETE` | `/api/payment-requests/:id` | 刪除請款單 | - | `{ success: true }` |

#### 6.3 出納 API

| 方法 | 端點 | 說明 | Request Body | Response |
|------|------|------|-------------|----------|
| `GET` | `/api/disbursement-orders` | 取得出納單列表 | Query: `?weekNumber=xxx&status=xxx` | `{ data: DisbursementOrder[] }` |
| `GET` | `/api/disbursement-orders/current-week` | 取得本週出納單 | - | `{ data: DisbursementOrder }` |
| `POST` | `/api/disbursement-orders` | 新增出納單 | `{ weekNumber, requestIds[] }` | `{ data: DisbursementOrder }` |
| `POST` | `/api/disbursement-orders/:id/confirm` | 確認出納單 | `{ confirmedBy }` | `{ data: DisbursementOrder }` |

---

### 7. 權限控制

| 角色 | 收款管理 | 請款管理 | 出納管理 | 財務報表 |
|------|---------|---------|---------|---------|
| **管理員** | ✅ 完整權限 | ✅ 完整權限 | ✅ 完整權限 | ✅ 完整權限 |
| **財務人員** | ✅ 新增/查看/修改 | ✅ 新增/查看/修改 | ✅ 新增/查看 | ✅ 查看 |
| **會計人員** | ✅ 查看 | ✅ 查看 | ✅ 確認/支付 | ✅ 完整權限 |
| **業務人員** | ❌ 無 | ✅ 查看自己的 | ❌ 無 | ❌ 無 |

---

### 8. 已知問題

#### 8.1 欄位命名問題

❌ **Payment 使用中文值**
```typescript
// 現狀
type: '收款' | '請款' | '出納'
status: '未收款' | '已確認' | '已完成'

// 建議
type: 'receipt' | 'request' | 'disbursement'
status: 'pending' | 'confirmed' | 'completed'
```

❌ **PaymentRequestItem category 使用中文**
```typescript
// 現狀
category: '住宿' | '交通' | '餐食' | '門票' | '導遊' | '其他'

// 建議
category: 'accommodation' | 'transport' | 'meals' | 'tickets' | 'guide' | 'other'
```

❌ **Payment Method 使用中文**
```typescript
// 現狀 (UI 層面)
paymentMethod: '現金' | '匯款' | '刷卡' | '支票'

// 建議
paymentMethod: 'cash' | 'transfer' | 'card' | 'check'
```

#### 8.2 冗餘欄位問題

⚠️ **PaymentRequest 儲存 Tour 和 Order 的名稱**
```typescript
interface PaymentRequest {
  tourId: string;
  tourName: string;  // ❌ 應從 Tour 查詢
  code: string;      // ❌ 應從 Tour 查詢
  orderId?: string;
  orderNumber?: string;  // ❌ 應從 Order 查詢
}
```

⚠️ **PaymentRequestItem 儲存 supplierName**
```typescript
interface PaymentRequestItem {
  supplierId: string;
  supplierName: string;  // ❌ 應從 Supplier 查詢
}
```

#### 8.3 資料計算問題

⚠️ **儲存計算結果而非動態計算**
```typescript
// 現狀
interface PaymentRequest {
  totalAmount: number;  // ❌ 應由 items.reduce((sum, item) => sum + item.subtotal, 0) 計算
}

interface PaymentRequestItem {
  subtotal: number;  // ❌ 應由 unitPrice * quantity 計算
}

interface DisbursementOrder {
  totalAmount: number;  // ❌ 應由關聯的 PaymentRequest 加總
}
```

#### 8.4 Service 層邏輯問題

❌ **createFromQuote 需要映射中文類別**
```typescript
// src/features/payments/services/payment.service.ts
mapCategoryToChinese(name: string): PaymentRequestItem['category'] {
  // 硬編碼中文映射邏輯，不易維護
  const mapping: Record<string, PaymentRequestItem['category']> = {
    '住宿': '住宿',
    'Accommodation': '住宿',
    '交通': '交通',
    // ...
  };
  return mapping[name] || '其他';
}
```

#### 8.5 缺少關鍵欄位

❌ **Payment 缺少 paymentMethod**
```typescript
// 現狀
interface Payment {
  type: '收款' | '請款' | '出納';
  // ❌ 缺少 paymentMethod: 'cash' | 'transfer' | 'card' | 'check'
}

// UI 層面有使用 PaymentItem interface，但沒有同步到 Store
```

---

### 9. 修復建議

#### 9.1 P0 - 必須修正（影響系統穩定）

1. **統一 Payment status/type 為英文**
   - 修改 `src/stores/types.ts` 的 Payment interface
   - 更新所有 Service 層的狀態判斷邏輯
   - UI 層使用 mapping 顯示中文

2. **統一 PaymentRequestItem category 為英文**
   - 修改 interface 定義
   - 更新 categoryOptions 為 `{ value: 'accommodation', label: '住宿' }` 格式
   - Service 層移除 `mapCategoryToChinese` 邏輯

3. **移除 createFromQuote 的中文映射邏輯**
   - 直接使用英文類別
   - 確保 Quote 和 PaymentRequest 使用相同類別定義

#### 9.2 P1 - 應該修正（影響可維護性）

4. **移除冗餘欄位**
   ```typescript
   // 修改 PaymentRequest interface
   interface PaymentRequest {
     tourId: string;
     // ❌ 移除 tourName, code
     orderId?: string;
     // ❌ 移除 orderNumber
   }

   // 修改 PaymentRequestItem interface
   interface PaymentRequestItem {
     supplierId: string;
     // ❌ 移除 supplierName
   }
   ```

5. **改為動態計算欄位**
   ```typescript
   // 修改 Service 層
   class PaymentService {
     getTotalAmount(request: PaymentRequest): number {
       return request.items.reduce((sum, item) =>
         sum + (item.unitPrice * item.quantity), 0
       );
     }
   }
   ```

6. **Payment interface 補充 paymentMethod**
   ```typescript
   interface Payment {
     id: string;
     orderId: string;
     amount: number;
     type: 'receipt' | 'request' | 'disbursement';
     status: 'pending' | 'confirmed' | 'completed';
     paymentMethod?: 'cash' | 'transfer' | 'card' | 'check';  // ✅ 新增
     description?: string;
     createdAt: string;
     updatedAt: string;
   }
   ```

#### 9.3 P2 - 可以優化（增強功能）

7. **分離 UI 邏輯的 PaymentItem 和 Store 的 Payment**
   - 建立 `PaymentDetail` interface 用於儲存詳細付款資訊
   - `Payment` 保持簡潔，只存核心資料

8. **建立 Enum 統一管理**
   ```typescript
   export enum PaymentType {
     RECEIPT = 'receipt',
     REQUEST = 'request',
     DISBURSEMENT = 'disbursement'
   }

   export enum PaymentCategory {
     ACCOMMODATION = 'accommodation',
     TRANSPORT = 'transport',
     MEALS = 'meals',
     TICKETS = 'tickets',
     GUIDE = 'guide',
     OTHER = 'other'
   }
   ```

---

### 10. 資料表建議（Phase 3）

```sql
-- 收款記錄
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  amount DECIMAL(12, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('receipt', 'request', 'disbursement')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'transfer', 'card', 'check')),
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 請款單
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  tour_id UUID NOT NULL REFERENCES tours(id),
  order_id UUID REFERENCES orders(id),
  request_date DATE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'confirmed', 'paid')),
  note TEXT,
  is_special_billing BOOLEAN DEFAULT FALSE,
  disbursement_order_id UUID REFERENCES disbursement_orders(id),
  created_by UUID REFERENCES users(id),
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 請款項目
CREATE TABLE payment_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL CHECK (category IN ('accommodation', 'transport', 'meals', 'tickets', 'guide', 'other')),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  description TEXT,
  unit_price DECIMAL(12, 2) NOT NULL,
  quantity INT NOT NULL,
  note TEXT,
  sort_order INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 出納單
CREATE TABLE disbursement_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number VARCHAR(10) NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  thursday_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'confirmed', 'paid')),
  note TEXT,
  created_by UUID REFERENCES users(id),
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(week_number)
);

-- 計算欄位使用 VIEW
CREATE VIEW payment_request_summary AS
SELECT
  pr.id,
  pr.request_number,
  pr.tour_id,
  t.code AS tour_code,
  t.name AS tour_name,
  pr.order_id,
  o.order_number,
  pr.request_date,
  SUM(pri.unit_price * pri.quantity) AS total_amount,
  pr.status,
  pr.created_at
FROM payment_requests pr
LEFT JOIN tours t ON pr.tour_id = t.id
LEFT JOIN orders o ON pr.order_id = o.id
LEFT JOIN payment_request_items pri ON pr.id = pri.request_id
GROUP BY pr.id, pr.request_number, pr.tour_id, t.code, t.name,
         pr.order_id, o.order_number, pr.request_date, pr.status, pr.created_at;

-- 索引
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payment_requests_tour_id ON payment_requests(tour_id);
CREATE INDEX idx_payment_requests_request_date ON payment_requests(request_date);
CREATE INDEX idx_payment_request_items_request_id ON payment_request_items(request_id);
CREATE INDEX idx_disbursement_orders_week_number ON disbursement_orders(week_number);
```

---

**建立時間**: 2025-01-06
**負責模組**: Finance (含 Payments, Requests, Treasury, Reports)
**優先級**: P0
**狀態**: ✅ 規格已完成

---

## 6️⃣ P0-6: 會計系統 (Accounting)

### 1. 基本資訊

| 項目 | 內容 |
|------|------|
| **路徑** | `/accounting` |
| **狀態** | ✅ 已實作 - 個人記帳系統 |
| **開發階段** | Phase 1 (IndexedDB) |
| **最後更新** | 2025-01-06 |

### 2. 功能說明

#### 2.1 用途
**個人記帳系統** - 管理個人帳戶、交易記錄、預算設定，提供快速記帳與財務統計功能。

#### 2.2 使用者
- **個人用戶** - 日常記帳、追蹤支出
- **財務人員** - 個人財務管理、預算控制
- **所有員工** - 個人費用追蹤

#### 2.3 業務流程

**核心流程：**
```
帳戶管理 (Accounts) ─┐
                    ├──> 交易記錄 (Transactions) ──> 統計分析 (Stats)
分類管理 (Categories) ─┘                              ↓
                                              預算提醒 (Budgets)
```

**功能模組：**
- **帳戶管理** - 現金、銀行、信用卡帳戶
- **交易記錄** - 收入、支出、轉帳
- **分類管理** - 自訂收支分類
- **預算設定** - 月度預算與提醒
- **統計報表** - 總資產、月收支、分類統計

---

### 3. 資料模型

#### 3.1 Account (帳戶)

| 欄位名稱 | 型別 | 必填 | 說明 | ⚠️ 問題 |
|---------|------|------|------|---------|
| `id` | string | ✅ | UUID | |
| `name` | string | ✅ | 帳戶名稱 | |
| `type` | `'cash' \| 'credit' \| 'bank'` | ✅ | 帳戶類型 | ✅ 使用英文 |
| `balance` | number | ✅ | 餘額 | |
| `currency` | string | ✅ | 幣別 (TWD, USD) | |
| `description` | string | ❌ | 描述 | |
| `creditLimit` | number | ❌ | 信用額度（信用卡用） | |
| `availableCredit` | number | ❌ | 可用額度 | ⚠️ 應計算而非儲存 |
| `createdAt` | string | ✅ | 建立時間 | |
| `updatedAt` | string | ✅ | 更新時間 | |

#### 3.2 Transaction (交易記錄)

| 欄位名稱 | 型別 | 必填 | 說明 | ⚠️ 問題 |
|---------|------|------|------|---------|
| `id` | string | ✅ | UUID | |
| `accountId` | string | ✅ | 來源帳戶ID | |
| `toAccountId` | string | ❌ | 目標帳戶ID（轉帳用） | |
| `type` | `'income' \| 'expense' \| 'transfer'` | ✅ | 交易類型 | ✅ 使用英文 |
| `categoryId` | string | ✅ | 分類ID | |
| `amount` | number | ✅ | 金額 | |
| `description` | string | ✅ | 描述 | |
| `date` | string | ✅ | 交易日期 (YYYY-MM-DD) | |
| `createdAt` | string | ✅ | 建立時間 | |
| `updatedAt` | string | ✅ | 更新時間 | |

**缺少欄位：**
- ❌ 缺少 `currency`: 交易幣別
- ❌ 缺少 `accountName`, `categoryName`: 冗餘欄位（用於顯示）

#### 3.3 Category (分類)

| 欄位名稱 | 型別 | 必填 | 說明 | ⚠️ 問題 |
|---------|------|------|------|---------|
| `id` | string | ✅ | UUID | |
| `name` | string | ✅ | 分類名稱 | |
| `type` | `'income' \| 'expense'` | ✅ | 分類類型 | ✅ 使用英文 |
| `parent` | string | ❌ | 父分類ID | |
| `color` | string | ❌ | 顏色 (#HEX) | |
| `icon` | string | ❌ | 圖示名稱 | |
| `createdAt` | string | ✅ | 建立時間 | |
| `updatedAt` | string | ✅ | 更新時間 | |

#### 3.4 Budget (預算)

| 欄位名稱 | 型別 | 必填 | 說明 | ⚠️ 問題 |
|---------|------|------|------|---------|
| `id` | string | ✅ | UUID | |
| `categoryId` | string | ✅ | 分類ID | |
| `amount` | number | ✅ | 預算金額 | |
| `period` | `'monthly' \| 'yearly'` | ✅ | 週期 | ✅ 使用英文 |
| `startDate` | string | ✅ | 開始日期 | |
| `endDate` | string | ❌ | 結束日期 | |
| `createdAt` | string | ✅ | 建立時間 | |
| `updatedAt` | string | ✅ | 更新時間 | |

#### 3.5 AccountingStats (統計資料)

| 欄位名稱 | 型別 | 說明 |
|---------|------|------|
| `totalAssets` | number | 總資產 |
| `totalIncome` | number | 總收入 |
| `totalExpense` | number | 總支出 |
| `monthlyIncome` | number | 本月收入 |
| `monthlyExpense` | number | 本月支出 |
| `netWorth` | number | 淨值 |
| `categoryBreakdown` | Array | 分類統計 |

**⚠️ 全部為動態計算欄位，不應儲存於資料庫**

#### 3.6 資料關聯圖

```
┌──────────┐ 1
│ Account  │────> ┌──────────────┐ N
└──────────┘      │ Transaction  │
                  └──────────────┘
                        │ N
                        │
                        ↓ 1
                  ┌──────────┐
                  │ Category │<───┐
                  └──────────┘    │ 1
                        │ 1       │
                        ├─────────┘ (parent)
                        │
                        │ N
                        ↓ 1
                  ┌──────────┐
                  │  Budget  │
                  └──────────┘
```

---

### 4. UI 組件

#### 4.1 主要頁面

| 路徑 | 檔案 | 功能 |
|------|------|------|
| `/accounting` | `src/app/accounting/page.tsx` | 記帳主頁（總覽/交易/帳戶/設定） |

#### 4.2 組件清單

| 組件 | 檔案 | 功能 |
|------|------|------|
| AccountsOverview | `src/components/accounting/accounts-overview.tsx` | 帳戶總覽卡片 |
| AccountsManagement | `src/components/accounting/accounts-management.tsx` | 帳戶管理列表 |
| TransactionList | `src/components/accounting/transaction-list.tsx` | 交易記錄列表 |
| AddAccountDialog | `src/components/accounting/add-account-dialog.tsx` | 新增帳戶對話框 |
| AddTransactionDialog | `src/components/accounting/add-transaction-dialog.tsx` | 新增交易對話框 |

#### 4.3 關鍵功能邏輯

**快速記帳：**
```typescript
const handleQuickTransaction = useCallback(async () => {
  if (!quickAmount || !quickCategory || !quickAccount) return;

  const categoryData = categories.find(c => c.id === quickCategory);
  const accountData = accounts.find(a => a.id === quickAccount);

  if (!categoryData || !accountData) return;

  const transactionData = {
    accountId: quickAccount,
    accountName: accountData.name,  // ⚠️ 冗餘欄位
    categoryId: quickCategory,
    categoryName: categoryData.name,  // ⚠️ 冗餘欄位
    type: 'expense' as const,
    amount: parseFloat(quickAmount),
    currency: 'TWD',
    description: '',
    date: today,
  };

  addTransaction(transactionData);
  // 清空表單並顯示成功動畫
}, [quickAmount, quickCategory, quickAccount, categories, accounts, today, addTransaction]);
```

**餘額自動更新：**
```typescript
// src/stores/accounting-store.ts
updateAccountBalances: (transaction: Transaction) => {
  const { accountId, toAccountId, type, amount } = transaction;

  if (type === 'expense') {
    // 支出：扣款
    const account = get().accounts.find(a => a.id === accountId);
    if (account) {
      get().updateAccount(accountId, { balance: account.balance - amount });
    }
  } else if (type === 'income') {
    // 收入：入帳
    const account = get().accounts.find(a => a.id === accountId);
    if (account) {
      get().updateAccount(accountId, { balance: account.balance + amount });
    }
  } else if (type === 'transfer') {
    // 轉帳：from 扣款，to 入帳
    const fromAccount = get().accounts.find(a => a.id === accountId);
    const toAccount = get().accounts.find(a => a.id === toAccountId);
    if (fromAccount) {
      get().updateAccount(accountId, { balance: fromAccount.balance - amount });
    }
    if (toAccount) {
      get().updateAccount(toAccountId, { balance: toAccount.balance + amount });
    }
  }
};
```

---

### 5. 資料層架構

#### 5.1 Store Layer

**檔案**: `src/stores/accounting-store.ts`

使用 **createComplexStore** 工廠模式（增強版）：

```typescript
export const useAccountingStore = createComplexStore<AccountingEntities>({
  name: 'accounting',

  // 四個子實體
  entities: {
    accounts: 'accounts',
    categories: 'categories',
    transactions: 'transactions',
    budgets: 'budgets',
  },

  // 自訂業務方法（保留原有複雜邏輯）
  customMethods: (set, get, helpers) => ({
    // 統計資料
    stats: {
      totalAssets: 0,
      totalIncome: 0,
      totalExpense: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
      netWorth: 0,
      categoryBreakdown: [],
    } as AccountingStats,

    // 新增交易（覆寫預設的 createTransaction）
    createTransaction: async (transactionData) => {
      // 儲存交易
      // 更新帳戶餘額
      get().updateAccountBalances(transaction);
      // 重新計算統計
      get().calculateStats();
      // 清除快取
      helpers.clearCache('transactions');
      helpers.clearCache('accounts');
    },

    // 更新帳戶餘額
    updateAccountBalances: (transaction: Transaction) => {
      // 根據交易類型更新餘額邏輯
    },

    // 計算統計資料
    calculateStats: () => {
      const { accounts, transactions, categories } = get();

      // 總資產
      const totalAssets = accounts.reduce((sum, a) => sum + a.balance, 0);

      // 本月收支
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthTransactions = transactions.filter(t => t.date >= monthStart);

      const monthlyIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // 分類統計
      const categoryBreakdown = categories.map(category => {
        const total = transactions
          .filter(t => t.categoryId === category.id)
          .reduce((sum, t) => sum + t.amount, 0);
        return { categoryId: category.id, categoryName: category.name, total };
      });

      set({
        stats: {
          totalAssets,
          monthlyIncome,
          monthlyExpense,
          netWorth: totalAssets,
          categoryBreakdown,
          // ...
        }
      });
    },

    // 取得帳戶餘額
    getAccountBalance: (accountId: string) => {
      const account = get().accounts.find(a => a.id === accountId);
      return account?.balance || 0;
    },

    // 取得分類總額
    getCategoryTotal: (categoryId: string, startDate?: string, endDate?: string) => {
      const transactions = get().transactions.filter(t => {
        const matchCategory = t.categoryId === categoryId;
        const matchDate = (!startDate || t.date >= startDate) &&
                         (!endDate || t.date <= endDate);
        return matchCategory && matchDate;
      });
      return transactions.reduce((sum, t) => sum + t.amount, 0);
    },
  }),
});
```

#### 5.2 Hook Layer

**檔案**: `src/features/accounting/hooks/useAccounting.ts` (110 lines)

```typescript
export const useAccounting = () => {
  const store = useAccountingStore();

  return {
    // 資料
    accounts: store.accounts,
    categories: store.categories,
    transactions: store.transactions,
    budgets: store.budgets,
    stats: store.stats,

    // Account 操作
    createAccount: async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await store.addAccount(data);
    },
    updateAccount: async (id: string, data: Partial<Account>) => {
      return await store.updateAccount(id, data);
    },
    deleteAccount: async (id: string) => {
      return await store.deleteAccount(id);
    },
    getAccountsByType: (type: Account['type']) => {
      return accountingService.getAccountsByType(type);
    },
    getAccountBalance: (accountId: string) => {
      return accountingService.getAccountBalance(accountId);
    },

    // Category 操作
    createCategory: async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await store.addCategory(data);
    },
    getCategoriesByType: (type: Category['type']) => {
      return categoryService.getCategoriesByType(type);
    },
    getCategoryTotal: (categoryId: string, startDate?: string, endDate?: string) => {
      return accountingService.getCategoryTotal(categoryId, startDate, endDate);
    },

    // Transaction 操作
    createTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      return accountingService.addTransaction(data);
    },
    getTransactionsByAccount: (accountId: string) => {
      return accountingService.getTransactionsByAccount(accountId);
    },
    getTransactionsByDateRange: (startDate: string, endDate: string) => {
      return accountingService.getTransactionsByDateRange(startDate, endDate);
    },

    // 統計方法
    calculateStats: () => {
      accountingService.calculateStats();
    },
    getTotalAssets: () => {
      return accountingService.getTotalAssets();
    },
    getMonthlyIncome: () => {
      return accountingService.getMonthlyIncome();
    },
    getMonthlyExpense: () => {
      return accountingService.getMonthlyExpense();
    },
  };
};
```

#### 5.3 Service Layer

**檔案**: `src/features/accounting/services/accounting.service.ts` (145 lines)

```typescript
class AccountingService extends BaseService<Account> {
  protected resourceName = 'accounts';

  protected validate(data: Partial<Account>): void {
    if (data.name && data.name.trim().length === 0) {
      throw new ValidationError('name', '帳戶名稱不能為空');
    }
    if (data.balance !== undefined && isNaN(data.balance)) {
      throw new ValidationError('balance', '餘額格式錯誤');
    }
  }

  // 業務邏輯方法
  getAccountBalance(accountId: string): number {
    const store = useAccountingStore.getState();
    return store.getAccountBalance(accountId);
  }

  getCategoryTotal(categoryId: string, startDate?: string, endDate?: string): number {
    const store = useAccountingStore.getState();
    return store.getCategoryTotal(categoryId, startDate, endDate);
  }

  calculateStats(): void {
    const store = useAccountingStore.getState();
    store.calculateStats();
  }

  getAccountsByType(type: Account['type']): Account[] {
    const store = useAccountingStore.getState();
    return store.accounts.filter(a => a.type === type);
  }

  // Transaction 相關
  addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): string {
    const store = useAccountingStore.getState();
    return store.addTransaction(transaction);
  }

  getTransactionsByAccount(accountId: string): Transaction[] {
    const store = useAccountingStore.getState();
    return store.transactions.filter(t =>
      t.accountId === accountId || t.toAccountId === accountId
    );
  }

  getTransactionsByDateRange(startDate: string, endDate: string): Transaction[] {
    const store = useAccountingStore.getState();
    return store.transactions.filter(t =>
      t.date >= startDate && t.date <= endDate
    );
  }
}

class CategoryService extends BaseService<Category> {
  protected resourceName = 'categories';

  protected validate(data: Partial<Category>): void {
    if (data.name && data.name.trim().length === 0) {
      throw new ValidationError('name', '分類名稱不能為空');
    }
  }

  getCategoriesByType(type: Category['type']): Category[] {
    const store = useAccountingStore.getState();
    return store.categories.filter(c => c.type === type);
  }
}

export const accountingService = new AccountingService();
export const categoryService = new CategoryService();
```

---

### 6. API 端點（Phase 3 規劃）

#### 6.1 帳戶 API

| 方法 | 端點 | 說明 | Request Body | Response |
|------|------|------|-------------|----------|
| `GET` | `/api/accounts` | 取得帳戶列表 | Query: `?type=xxx` | `{ data: Account[] }` |
| `GET` | `/api/accounts/:id` | 取得帳戶詳情 | - | `{ data: Account }` |
| `POST` | `/api/accounts` | 新增帳戶 | `Account` | `{ data: Account }` |
| `PUT` | `/api/accounts/:id` | 更新帳戶 | `Partial<Account>` | `{ data: Account }` |
| `DELETE` | `/api/accounts/:id` | 刪除帳戶 | - | `{ success: true }` |
| `GET` | `/api/accounts/:id/balance` | 取得帳戶餘額 | - | `{ balance: number }` |

#### 6.2 交易 API

| 方法 | 端點 | 說明 | Request Body | Response |
|------|------|------|-------------|----------|
| `GET` | `/api/transactions` | 取得交易列表 | Query: `?accountId=xxx&startDate=xxx&endDate=xxx` | `{ data: Transaction[] }` |
| `GET` | `/api/transactions/:id` | 取得交易詳情 | - | `{ data: Transaction }` |
| `POST` | `/api/transactions` | 新增交易 | `Transaction` | `{ data: Transaction }` |
| `PUT` | `/api/transactions/:id` | 更新交易 | `Partial<Transaction>` | `{ data: Transaction }` |
| `DELETE` | `/api/transactions/:id` | 刪除交易 | - | `{ success: true }` |

#### 6.3 分類 API

| 方法 | 端點 | 說明 | Request Body | Response |
|------|------|------|-------------|----------|
| `GET` | `/api/categories` | 取得分類列表 | Query: `?type=income/expense` | `{ data: Category[] }` |
| `POST` | `/api/categories` | 新增分類 | `Category` | `{ data: Category }` |
| `PUT` | `/api/categories/:id` | 更新分類 | `Partial<Category>` | `{ data: Category }` |
| `DELETE` | `/api/categories/:id` | 刪除分類 | - | `{ success: true }` |
| `GET` | `/api/categories/:id/total` | 取得分類總額 | Query: `?startDate=xxx&endDate=xxx` | `{ total: number }` |

#### 6.4 統計 API

| 方法 | 端點 | 說明 | Request Body | Response |
|------|------|------|-------------|----------|
| `GET` | `/api/stats` | 取得統計資料 | - | `{ data: AccountingStats }` |
| `GET` | `/api/stats/monthly` | 取得月度統計 | Query: `?year=2025&month=1` | `{ income: number, expense: number }` |

---

### 7. 權限控制

| 角色 | 帳戶管理 | 交易管理 | 分類管理 | 統計查看 |
|------|---------|---------|---------|---------|
| **個人** | ✅ 完整權限 | ✅ 完整權限 | ✅ 完整權限 | ✅ 完整權限 |
| **管理員** | ✅ 查看所有人 | ✅ 查看所有人 | ✅ 系統預設分類 | ✅ 查看所有人 |

**注意**：Phase 1 為單用戶系統，Phase 3 可擴充多用戶支援。

---

### 8. 已知問題

#### 8.1 欄位命名問題

✅ **整體命名良好** - Account, Transaction, Category 都使用英文

#### 8.2 冗餘欄位問題

❌ **Transaction 儲存 accountName 和 categoryName**
```typescript
// 現狀 (UI 層面)
const transactionData = {
  accountId: quickAccount,
  accountName: accountData.name,    // ❌ 應從 Account 查詢
  categoryId: quickCategory,
  categoryName: categoryData.name,  // ❌ 應從 Category 查詢
  type: 'expense' as const,
  amount: parseFloat(quickAmount),
  currency: 'TWD',
  description: '',
  date: today,
};

// 建議：移除 accountName 和 categoryName
```

#### 8.3 資料計算問題

⚠️ **Account.availableCredit 應為計算欄位**
```typescript
// 現狀
interface Account {
  creditLimit?: number;
  availableCredit?: number;  // ❌ 應由 creditLimit - balance 計算
}

// 建議
interface Account {
  creditLimit?: number;
  // ❌ 移除 availableCredit
}

// Service 層提供計算方法
getAvailableCredit(accountId: string): number {
  const account = this.getById(accountId);
  if (!account || !account.creditLimit) return 0;
  return account.creditLimit - account.balance;
}
```

⚠️ **Stats 全部為動態計算，不應儲存**
```typescript
// 現狀：存在 Store 的 state 中
stats: {
  totalAssets: 0,
  totalIncome: 0,
  totalExpense: 0,
  monthlyIncome: 0,
  monthlyExpense: 0,
  netWorth: 0,
  categoryBreakdown: [],
}

// 建議：改為 computed property 或每次從 transactions 計算
```

#### 8.4 缺少關鍵欄位

❌ **Transaction 缺少 currency**
```typescript
// 現狀
interface Transaction {
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  categoryId: string;
  amount: number;
  // ❌ 缺少 currency: string
}

// 建議：新增 currency 欄位
interface Transaction {
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  categoryId: string;
  amount: number;
  currency: string;  // ✅ 新增
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 8.5 資料類型定義重複

⚠️ **accounting-types 檔案未被使用**
```typescript
// src/stores/types.ts 定義了 Account, Transaction, Category
// src/stores/accounting-types.ts 也定義了相同型別

// 建議：統一使用 accounting-types.ts
```

---

### 9. 修復建議

#### 9.1 P0 - 必須修正（影響系統穩定）

無關鍵問題需立即修正。

#### 9.2 P1 - 應該修正（影響可維護性）

1. **移除冗餘欄位**
   ```typescript
   // 修改 Transaction interface
   interface Transaction {
     accountId: string;
     // ❌ 移除 accountName
     categoryId: string;
     // ❌ 移除 categoryName
     type: 'income' | 'expense' | 'transfer';
     amount: number;
     currency: string;  // ✅ 新增
     description: string;
     date: string;
   }
   ```

2. **改為動態計算 availableCredit**
   ```typescript
   // 修改 Account interface
   interface Account {
     id: string;
     name: string;
     type: 'cash' | 'credit' | 'bank';
     balance: number;
     currency: string;
     creditLimit?: number;
     // ❌ 移除 availableCredit
   }

   // Service 層提供計算方法
   class AccountingService {
     getAvailableCredit(accountId: string): number {
       const account = this.getById(accountId);
       if (!account || account.type !== 'credit' || !account.creditLimit) {
         return 0;
       }
       return account.creditLimit - account.balance;
     }
   }
   ```

3. **統一使用 accounting-types.ts**
   ```typescript
   // 將 src/stores/types.ts 中的 Account, Transaction, Category 移除
   // 統一從 src/stores/accounting-types.ts 匯入
   ```

#### 9.3 P2 - 可以優化（增強功能）

4. **Stats 改為 Computed Property**
   ```typescript
   // 不儲存在 state，改為 getter
   get stats(): AccountingStats {
     return this.calculateStats();
   }
   ```

5. **新增更多統計方法**
   - 年度收支統計
   - 分類排行榜
   - 消費趨勢分析
   - 預算達成率

6. **支援多幣別**
   - Transaction 新增 currency
   - 匯率轉換邏輯
   - 多幣別總資產計算

---

### 10. 資料表建議（Phase 3）

```sql
-- 帳戶
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),  -- Phase 3 多用戶支援
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('cash', 'credit', 'bank')),
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'TWD',
  description TEXT,
  credit_limit DECIMAL(12, 2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 分類
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),  -- NULL 表示系統預設分類
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  parent_id UUID REFERENCES categories(id),
  color VARCHAR(10),
  icon VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 交易記錄
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id),
  to_account_id UUID REFERENCES accounts(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category_id UUID NOT NULL REFERENCES categories(id),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'TWD',
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 預算
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  amount DECIMAL(12, 2) NOT NULL,
  period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 計算欄位使用 VIEW
CREATE VIEW account_balances AS
SELECT
  a.id,
  a.name,
  a.type,
  a.balance,
  a.credit_limit,
  CASE
    WHEN a.type = 'credit' AND a.credit_limit IS NOT NULL
    THEN a.credit_limit - a.balance
    ELSE NULL
  END AS available_credit
FROM accounts a;

-- 統計 VIEW
CREATE VIEW monthly_stats AS
SELECT
  DATE_TRUNC('month', t.date) AS month,
  t.type,
  SUM(t.amount) AS total
FROM transactions t
GROUP BY DATE_TRUNC('month', t.date), t.type;

-- 索引
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
```

---

**建立時間**: 2025-01-06
**負責模組**: Accounting (個人記帳系統)
**優先級**: P0
**狀態**: ✅ 規格已完成

---

---

## 🔗 模組關聯圖

### 1. 核心業務關聯

```
╔═══════════════════════════╗
║     業務流程核心路徑      ║
╚═══════════════════════════╝

   1. 客戶詢價
      ↓
   ┌─────────────┐
   │    Quote    │  報價單
   │   (報價單)  │
   └─────┬───────┘
        │
        ├───────────────┐
        │                │
        ↓                ↓
   ┌─────────────┐  ┌───────────────┐
   │     Tour     │  │   Itinerary  │
   │   (旅遊團)   │  │   (行程表)   │
   └─────┬───────┘  └───────────────┘
        │                 (展示用)
        │
   2. 客戶確認，開始成團
        │
        ↓
   ┌─────────────┐
   │    Order    │  訂單
   │    (訂單)   │
   └─────┬───────┘
        │
        ↓
   ┌─────────────┐
   │   Member   │  團員
   │   (團員)   │
   └─────────────┘
        │
   3. 財務流程
        │
        ├────────────────────────┐
        │                         │
        ↓                         ↓
   ┌────────────────┐    ┌──────────────────┐
   │ ReceiptOrder  │    │ PaymentRequest │
   │  (收款單)    │    │   (請款單)    │
   └────────────────┘    └───────┬─────────┘
                                 │
                                 ↓
                        ┌───────────────────┐
                        │ DisbursementOrder │
                        │   (出納單)      │
                        └───────────────────┘
```

### 2. 模組之間的詳細關聯

#### 2.1 報價 → 開團 關聯

```
Quote (報價單)
 │
 ├──> Tour (旅遊團)          [1:1 轉換]
 │    - 帶入日期、人數、地點
 │    - 帶入成本結構 (quote_cost_structure)
 │
 └──> Itinerary (行程表)   [1:N 多版本]
      - 帶入天數 (accommodation_days)
      - 帶入地點 (country, city)
      - 帶入飯店 (從 categories 的住宿項)
```

#### 2.2 旅遊團 → 訂單 關聯

```
Tour (旅遊團)
 │
 ├──> Order (訂單)           [1:N]
 │    │ - 自動帶入 tour_name, code
 │    │ - 自動帶入 departure_date
 │    │
 │    └──> Member (團員)       [1:N]
 │         - 自動計算 age (根據 birthday 和 tour.departure_date)
 │
 ├──> TourAddOn (加購)       [1:N]
 │    - Member 可選擇 add_ons[]
 │
 ├──> TourRefund (退費)      [1:N]
 │    - 關聯 order_id, member_name
 │
 └──> Payment (收款/請款)   [1:N]
      - 關聯 tour_id, order_id
```

#### 2.3 訂單 → 財務 關聯

```
Order (訂單)
 │
 ├──> ReceiptOrder (收款單)   [1:N]
 │    │ - 單訂單多次收款
 │    │ - 或批量分配（一筆款分多訂單）
 │    │
 │    └──> ReceiptPaymentItem [1:N]
 │         - 現金/匙款/刷卡/支票
 │
 └──> PaymentRequest (請款單) [1:N]
      - 每週四出帳
      - 批次請款（例如保險分多訂單）
```

#### 2.4 請款流程

```
PaymentRequest (請款單)
 │
 ├──> PaymentRequestItem [1:N]
 │    - category: 住宿/交通/餐食/門票/導遊/其他
 │    - supplier_id 關聯供應商
 │
 └──> DisbursementOrder (出納單) [N:1]
      - 每週彙總多筆請款單
      - 週四統一支付
```

#### 2.5 待辦事項關聯

```
Todo (待辦事項)
 │
 ├──> related_items[]        [多種關聯]
 │    ├── type: 'group'  → Tour
 │    ├── type: 'quote'  → Quote
 │    ├── type: 'order'  → Order
 │    ├── type: 'invoice' → PaymentRequest
 │    └── type: 'receipt' → ReceiptOrder
 │
 └──> enabled_quick_actions[]  [快速操作]
      ├── 'receipt'  → 快速收款
      ├── 'invoice'  → 快速請款
      ├── 'group'    → 快速分組
      ├── 'quote'    → 快速報價
      └── 'assign'   → 快速指派
```

#### 2.6 簽證管理關聯

```
Order (訂單)
 │
 └──> Member (團員)
      │
      └──> Visa (簽證)
           - 自動帶入 passport_number
           - 自動帶入 order_id, tour_id
```

### 3. 輔助系統關聯

#### 3.1 工作區系統

```
Workspace (工作區)
 ├──> Channel (頻道)          [1:N]
 │    └──> Message (訊息)       [1:N]
 │
 ├──> CanvasNote (Canvas 筆記) [1:N]
 │
 └──> Todo (任務列表)        [展示]
```

#### 3.2 會計系統

```
Accounting (個人記帳)
 ├──> Account (帳戶)          [1:N]
 │    └──> Transaction (交易)  [1:N]
 │
 ├──> Category (分類)         [1:N]
 │    └──> Budget (預算)       [1:N]
 │
 └──> AccountingStats (統計)  [計算值]
```

#### 3.3 人事系統

```
Employee (員工) = User (使用者)
 ├──> personal_info          [個人資訊]
 ├──> job_info               [工作資訊]
 ├──> salary_info            [薪資資訊]
 ├──> attendance             [出勤記錄]
 └──> contracts              [合約記錄]
```

### 4. 資料流向與同步

```
╔═══════════════════╗
║   Phase 1 (當前)   ║
╚═══════════════════╝

UI Component
     ↓
Zustand Store (IndexedDB)
     ↓
Local Storage (離線優先)

────────────────────

╔═══════════════════╗
║   Phase 3 (規劃)   ║
╚═══════════════════╝

UI Component
     ↓
Hook (useXXX)
     ↓
Service (XXXService)
     ↓
API Route (/api/xxx)
     ↓
Supabase PostgreSQL
     ↓
IndexedDB (離線快取)
```

### 5. 模組依賴關係

```
╔═══════════════════════╗
║  必須優先實作 (P0)  ║
╚═══════════════════════╝

Auth (登入) ← 所有模組依賴
  │
  ├──> User/Employee
  │
  └──> Permissions

Quote → Tour → Order → Member
               │
               ├──> Payment
               │
               └──> Finance

Workspace + Todos (獨立但關聯其他模組)

────────────────────────

╔═══════════════════════╗
║  次要優先 (P1)      ║
╚═══════════════════════╝

Customer ← Order, Quote

Database (供應商/飯店/餐廳) ← PaymentRequest, Quote

HR ← Employee

Calendar + Timebox (獨立)

Accounting (個人記帳，獨立)

────────────────────────

╔═══════════════════════╗
║  輔助功能 (P2)      ║
╚═══════════════════════╝

Visa ← Member

Profile Manager

Guide (幫助文件)

Templates (模板管理)
```

### 6. 重要設計原則

#### 6.1 離線優先 (Offline-First)

- 所有資料優先儲存於 IndexedDB
- Zustand Store 作為中間層管理狀態
- 自動同步機制（Phase 3）

#### 6.2 資料欄位凍存 (Snapshot)

為了離線優先和數據一致性，當前設計采用**欄位凍存**：

```
Order
  - tour_name ← Tour.name 的快照
  - code ← Tour.code 的快照

PaymentRequest
  - tour_name ← Tour.name 的快照
  - supplier_name ← Supplier.name 的快照

Tour
  - quote_cost_structure ← Quote.categories 的快照
```

**Phase 3 建議**：移除凍存，改用 JOIN 查詢或 VIEW

#### 6.3 狀態管理

**目前問題**：中英文狀態混用

```typescript
// ⚠️ 現狀 (不一致)
Tour.status: '提案' | '進行中' | '待結案' | '結案'
Order.status: ''進行中' | '已完成' | '已取消'
Payment.status: '待確認' | '已確認' | '已完成'
Quote.status: '提案' | '最終版本'
Itinerary.status: '草稿' | '已發佈'

// ✅ 建議 (統一英文)
Tour.status: 'draft' | 'active' | 'pending_close' | 'closed'
Order.status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
Payment.status: 'pending' | 'confirmed' | 'completed'
Quote.status: 'draft' | 'proposed' | 'approved' | 'converted'
Itinerary.status: 'draft' | 'published'
```

#### 6.4 關聯資料自動帶入

當建立子資料時，自動帶入父資料：

```typescript
// Quote → Tour
createTourFromQuote(quoteId) {
  const quote = getQuote(quoteId);
  return {
    name: quote.name,
    location: quote.country + ' ' + quote.city,
    max_participants: quote.group_size,
    quote_id: quote.id,
    quote_cost_structure: quote.categories  // 凍存
  };
}

// Quote → Itinerary
createItineraryFromQuote(quoteId) {
  const quote = getQuote(quoteId);
  return {
    country: quote.country,
    city: quote.city,
    dailyItinerary: generateDaysFromAccommodation(quote.accommodation_days),
    accommodation: extractHotelsFromQuote(quote.categories)
  };
}

// Tour → Order
createOrder(tourId) {
  const tour = getTour(tourId);
  return {
    tour_id: tourId,
    code: tour.code,              // 凍存
    tour_name: tour.name,         // 凍存
    total_amount: tour.price * memberCount
  };
}

// Member 自動計算
createMember(data, orderId) {
  const order = getOrder(orderId);
  const tour = getTour(order.tour_id);
  return {
    ...data,
    age: calculateAge(data.birthday, tour.departure_date),
    gender: inferGenderFromId(data.id_number)
  };
}
```

---

**最後更新**：2025-01-07
**維護者**：Claude AI
**文件版本**：1.1.0
