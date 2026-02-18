# ADR-003: createEntityHook 統一資料存取 Factory

## 狀態：Accepted

## 背景

ERP 系統有 30+ 個實體（tours、orders、customers、receipts、quotes 等），
每個實體都需要：
- CRUD 操作（Supabase query）
- SWR 快取管理
- 樂觀更新（Optimistic Update）
- Loading / Error 狀態
- Workspace 資料隔離
- IndexedDB 離線快取 fallback
- 分頁查詢
- TypeScript 型別安全

如果每個實體都手寫這些邏輯，會有大量重複程式碼，且行為不一致。

## 決策

建立 `createEntityHook<T>(tableName, config)` factory 函數，
所有實體都透過這個 factory 產生統一的 hooks 和操作函數。

產出的 API：
- `useList()` — 列表 Hook（含 SWR + IndexedDB fallback）
- `useListSlim()` — 精簡列表（只 fetch 指定欄位）
- `useDetail(id)` — 單筆 Hook（Skip Pattern：id 為 null 時不發請求）
- `usePaginated(params)` — 分頁 Hook
- `useDictionary()` — O(1) 查詢的字典 Hook
- `create(data)` — 建立（含自動 code 生成 + 樂觀更新 + 重試）
- `update(id, data)` — 更新（樂觀更新）
- `delete(id)` — 刪除（樂觀更新）
- `invalidate()` — 手動使快取失效

Config 可配置：
- `list.select` — 列表查詢的欄位
- `list.orderBy` — 預設排序
- `list.defaultFilter` — 預設過濾條件
- `slim.select` — 精簡查詢的欄位
- `detail.select` — 詳情查詢的欄位
- `cache` — 快取策略（staleTime、dedupe、revalidateOnFocus 等）
- `workspaceScoped` — 是否需要 workspace 隔離

## 理由

1. **DRY 原則**：30+ 實體共用一套 CRUD 邏輯，新增實體只需一行程式碼
2. **一致性**：所有實體的快取、樂觀更新、錯誤處理行為一致
3. **可維護性**：修改 factory 一次，所有實體都受益
4. **Workspace 隔離內建**：不需要每個 query 都手動加 workspace_id filter
5. **Code 自動生成**：統一處理編號生成和 unique constraint 重試

## 後果

### 正面
- 新增實體只需 `export const { useList, create, ... } = createEntityHook('table', config)`
- 修 bug（如快取不更新）只需改 factory，所有實體都修好
- 樂觀更新和 IndexedDB fallback 是免費的
- TypeScript 泛型確保型別安全

### 負面
- Factory 本身邏輯較複雜（~500 行），需要深入理解才能修改
- 特殊需求可能需要繞過 factory（如複雜 join query）
- 所有實體的行為被綁定，很難對單一實體做例外處理

### 與 BaseService 的關係
- `createEntityHook` 是新架構（直接操作 Supabase + SWR）
- `BaseService` 是舊架構（透過 Zustand Store 間接操作）
- 兩者並存，新實體優先使用 `createEntityHook`
