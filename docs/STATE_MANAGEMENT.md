# 狀態管理架構

> 最後更新：2026-02-14

## 概覽

Venturo ERP 有兩套狀態管理系統並存：

| 系統       | 技術                   | 狀態                 | 適用場景           |
| ---------- | ---------------------- | -------------------- | ------------------ |
| `@/data`   | SWR + createEntityHook | **新架構（推薦）**   | CRUD 實體資料      |
| `@/stores` | Zustand + createStore  | **舊架構（維護中）** | 即時狀態、全局狀態 |

---

## `@/data`（新架構）— createEntityHook / createCloudHook

### 用在哪裡

所有 CRUD 實體資料的讀寫，例如：

- `useTours()` / `useTour(id)` — 旅遊團
- `useOrders()` — 訂單
- `useCustomers()` — 客戶
- `useCountries()` / `useCities()` — 地區
- `useTourLeaders()` — 領隊
- `useConfirmations()` — 確認單

### 適合什麼場景

- 需要 **伺服器資料快取** 的場景（SWR 自動 revalidate）
- 標準 CRUD 操作（list / get / create / update / delete）
- 分頁、搜尋、篩選
- Dictionary 模式（O(1) 查詢）
- 任何新的實體資料需求

### 優勢

- 自動快取 + 重新驗證
- 宣告式資料取得（不需手動 fetch）
- 內建 loading / error 狀態
- 減少不必要的 API 呼叫

---

## `@/stores`（舊架構）— Zustand

### 目前保留的原因

部分 store 仍有引用且遷移成本較高，因此暫時保留：

#### ✅ 正確使用 Zustand 的場景

| Store                                    | 原因                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| `useAuthStore` / `useUserStore`          | **全局 auth 狀態** — 登入狀態需要在整個 app 同步，Zustand 是正確選擇             |
| `useWorkspaceStore` + workspace 聊天系統 | **即時狀態管理** — 聊天訊息、頻道切換等需要即時同步的狀態，Zustand 比 SWR 更適合 |
| `useThemeStore` / `useHomeSettingsStore` | **UI 偏好設定** — 純客戶端狀態，不需要伺服器快取                                 |
| `useCalendarStore`                       | **複雜 UI 狀態** — 行事曆的篩選、設定等互動狀態                                  |

#### 🔄 待遷移的 Store

| Store                | 說明                        |
| -------------------- | --------------------------- |
| `useTourStore`       | 仍被 `tour.service.ts` 引用 |
| `useOrderStore`      | 被部分頁面引用              |
| `useQuoteStore`      | 被報價功能引用              |
| `useEmployeeStore`   | 被部分頁面引用              |
| `useAccountingStore` | 複雜業務邏輯，待拆分        |

### 2026-02-14 清理記錄

移除了 19 個零引用的 createStore export（含 Fleet、Supplier、Todo、Visa 等），大幅精簡 `stores/index.ts`。

---

## 新開發應該用哪套？

### 🟢 用 `@/data`（createEntityHook）

- 任何新的實體資料 CRUD
- 列表頁面、詳情頁面
- 搜尋、篩選、分頁功能

```typescript
// 在 src/data/entities/ 下新增
import { createEntityHook } from '../core'

export const { useMyEntities, useMyEntity, createMyEntity, updateMyEntity, deleteMyEntity } =
  createEntityHook('my_entities')
```

### 🟡 用 Zustand（只有這些情況）

- **即時通訊 / WebSocket 狀態**（如聊天系統）
- **全局 auth / session 狀態**
- **純客戶端 UI 偏好**（主題、佈局設定）
- **跨組件共享的臨時狀態**（不需要持久化到伺服器）

### 🔴 不要

- 不要新增 createStore（舊 Zustand 泛用 store）
- 不要在 `stores/index.ts` 加新的 export
- 不要用 Zustand 管理可以用 SWR 快取的伺服器資料
