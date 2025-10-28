# Venturo 專案架構健檢報告 🏥

**檢查日期**: 2025-10-26
**整體健康評分**: 6.75/10 (基礎穩固，需要優化)

---

## 📊 專案規模統計

```
總代碼量:     86,068 行
檔案總數:     489 個 TypeScript/React 檔案
專案大小:     2.8 MB
技術棧:       Next.js 15.5.4 + React 19 + TypeScript 5 + Zustand 5 + Supabase
開發端口:     3000
```

### 代碼分布
```
components/    1.6M  (185 files)  57% - UI 組件
app/          768K  ( 51 pages)  27% - 頁面路由
features/     560K  ( 88 files)  20% - 功能模組
lib/          404K  ( 29 files)  14% - 工具函式
stores/       312K  ( 36 files)  11% - 狀態管理
hooks/        104K  ( 18 files)   4% - 自定義 Hooks
types/        108K  ( 20 files)   4% - 型別定義
services/      40K  (  5 files)   1% - 業務服務 ⚠️ 太少
constants/     48K  (  8 files)   2% - 配置常量
```

---

## 🚨 緊急問題 (本週必須處理)

### 1. 超大檔案問題 (23 個檔案 > 500 行)
```
🔴 高優先級拆分目標:
  897 行: src/components/tours/TourPage.tsx           ← 需拆成 3-4 個組件
  833 行: src/components/workspace/ChannelSidebar.tsx ← 需拆成 2-3 個組件
  777 行: src/components/todos/todo-expanded-view.tsx ← 需拆成 2-3 個組件
  697 行: src/stores/create-store.ts                  ← 舊版，應刪除！
  605 行: src/app/finance/treasury/disbursement/page.tsx
  593 行: src/app/tours/page.tsx

🟡 中優先級:
  556 行: src/components/ui/enhanced-table.tsx
  484 行: src/app/settings/page.tsx
  469 行: src/app/visas/page.tsx
  469 行: src/app/todos/page.tsx

📊 統計: 23 個檔案超過 500 行
⏱️ 預估工時: 5-7 小時
```

**建議行動**:
- 立即拆分前 3 個最大的檔案
- 目標：每個檔案不超過 300-400 行

### 2. 重複的 Store Factory ⚠️
```
❌ 舊版 (應刪除): src/stores/create-store.ts (697 lines)
✅ 新版 (保留):   src/stores/create-store-new.ts

動作:
1. 確認所有 stores 都已使用 create-store-new.ts
2. 刪除 create-store.ts
3. 更新所有 export

⏱️ 預估工時: 1 小時
```

### 3. Workspace Store Facade 反模式
```
檔案: src/stores/workspace/index.ts

問題: useWorkspaceStore 組合了 5 個 stores
  - channelsStore
  - messagesStore
  - membersStore
  - channelMembersStore
  - workspaceStore

影響: 造成不必要的耦合，任一 store 更新會觸發所有訂閱者重新渲染

建議: 改用個別 store 直接 import
  import { useChannelsStore } from '@/stores/workspace/channels-store'

⏱️ 預估工時: 2-3 小時
```

### 4. 型別安全問題 (188 個繞過)
```
發現:
  - 188 個 "as any" 或 "as unknown" 實例
  - 主要分布在 stores/, components/, app/

目標: 減少到 50 個以下

⏱️ 預估工時: 3-4 小時
```

---

## 🟡 高優先級問題 (未來 2-4 週)

### 5. Service Layer 太薄弱
```
現況: 只有 5 個 services
  src/services/
    ├── payment-requests.ts
    ├── storage/index.ts
    ├── supabase.ts
    ├── workspace-channels.ts
    └── workspace-members.ts

問題:
  - 業務邏輯散落在 hooks 和 stores 中
  - 缺少統一的資料存取層
  - 難以測試

建議創建:
  ✅ TourService          ← 從 useTours.ts 提取
  ✅ OrderService         ← 從 useOrders.ts 提取
  ✅ PaymentService       ← 從 usePayments.ts 提取
  ✅ QuoteService
  ✅ CustomerService
  ✅ VisaService
  ✅ ContractService
  ✅ ItineraryService
  ✅ EmployeeService
  ✅ TodoService

目標: 12-15 個專用 services

⏱️ 預估工時: 12-15 小時
```

### 6. API Layer 不完整
```
現況: 只有 4 個 API routes
  src/app/api/
    ├── health/
    ├── health/detailed/
    ├── log-error/
    └── workspaces/[workspaceId]/channels/[channelId]/members/

問題: 大部分資料操作直接在 client 端呼叫 Supabase

建議創建:
  ✅ /api/tours
  ✅ /api/orders
  ✅ /api/payments
  ✅ /api/quotes
  ✅ /api/customers
  ✅ /api/visas
  ✅ /api/contracts
  ✅ /api/employees
  ✅ /api/todos
  ✅ /api/workspace/*

目標: 15-20 個 API routes (含驗證、錯誤處理)

⏱️ 預估工時: 8-10 小時
```

### 7. 超大 Hooks
```
🔴 useTours.ts: 395 行
   建議拆分成:
   - useTourData.ts
   - useTourActions.ts
   - useTourFilters.ts
   - useTourValidation.ts
   - useTourSync.ts

🟢 useListPageState.ts: 275 行 (保留，功能完整)
🟢 useDataFiltering.ts: 259 行 (保留，功能完整)

⏱️ 預估工時: 5-7 小時
```

---

## 🟢 中優先級問題 (Phase 2)

### 8. 測試覆蓋率
```
現況: ~0% 測試覆蓋率
目標: 60-80%

建議優先測試:
  1. Stores (state management logic)
  2. Services (business logic)
  3. API routes (validation & error handling)
  4. Critical hooks (useTours, useOrders, etc.)

⏱️ 預估工時: 20-25 小時
```

### 9. 效能優化
```
需要優化的地方:
  1. Component Memoization
     - 30-50 個組件需要 React.memo
     - 主要是列表項、卡片組件

  2. Store Selectors
     - 實作 Zustand selectors 避免不必要的重新渲染

  3. List Virtualization
     - tours 列表
     - orders 列表
     - workspace 訊息列表

⏱️ 預估工時: 10-15 小時
```

### 10. 文檔缺失
```
缺少:
  - 架構決策記錄 (ADR)
  - Hook 使用模式指南
  - Component 開發規範
  - Store 最佳實踐
  - API 設計規範

⏱️ 預估工時: 8-10 小時
```

---

## ✅ 做得好的地方

### 架構優勢
```
✅ Hybrid Feature-Based + Layer-Based 架構
   - 清晰的功能模組分離 (features/)
   - 共享的基礎層 (components/, hooks/, stores/)

✅ TypeScript 全面採用
   - 100% TypeScript 檔案
   - 型別定義集中管理 (types/)

✅ 狀態管理良好
   - Zustand stores 結構清晰
   - 36 個 store 檔案組織良好

✅ UI 組件系統完善
   - 34 個基礎 UI 組件 (Radix UI)
   - 組件分類清楚 (ui/, layout/, domain-specific/)

✅ 最近完成的優化
   - Phase 1: 創建可重用組件 (ListPageLayout, Table Cells, etc.)
   - Phase 2: 應用到 3 個頁面，減少 215 行代碼
```

### 最佳實踐採用
```
✅ Next.js App Router
✅ Server Components 支援
✅ Supabase 整合
✅ 統一的狀態配置 (status-config.ts)
✅ 可重用的 Hook 模式 (useDataFiltering, useListPageState)
✅ 標準化的表格單元格組件
```

---

## 📋 主要頁面路由總覽

### 業務功能 (26 個頁面)
```
Tours         /tours/                  (2 pages)  ← 旅遊團管理
Orders        /orders/                 (6 pages)  ← 訂單管理
Quotes        /quotes/                 (2 pages)  ← 報價單管理
Finance       /finance/                (7 pages)  ← 財務管理
  ├─ Payments
  ├─ Treasury
  ├─ Travel Invoice
  ├─ Requests
  └─ Reports
Contracts     /contracts/              (2 pages)  ← 合約管理
Customers     /customers/              (1 page)   ← 客戶管理
Visas         /visas/                  (1 page)   ← 簽證管理
Accounting    /accounting/             (1 page)   ← 會計
```

### 資料庫 & 管理 (8 個頁面)
```
Database      /database/               (6 pages)
  ├─ Regions
  ├─ Transport
  ├─ Suppliers
  ├─ Activities
  └─ Pricing
HR            /hr/                     (1 page)
Settings      /settings/               (1 page)
```

### 個人工作區 (11 個頁面)
```
Workspace     /workspace/              (1 page)   ← 團隊協作
Calendar      /calendar/               (1 page)   ← 行事曆
Todos         /todos/                  (1 page)   ← 待辦事項
Timebox       /timebox/                (1 page)   ← 時間管理
Templates     /templates/              (2 pages)  ← 範本管理
Itinerary     /itinerary/              (3 pages)  ← 行程規劃
Editor        /editor/                 (1 page)   ← 文件編輯器
Manifestation /manifestation/          (1 page)   ← 目標追蹤
```

### 系統頁面 (6 個頁面)
```
Home          /                        (1 page)   ← 首頁儀表板
Login         /login/                  (1 page)   ← 登入
Unauthorized  /unauthorized/           (1 page)   ← 權限錯誤
View          /view/[id]/              (1 page)   ← 通用檢視
Fix Database  /fix-database/           (1 page)   ← 資料庫修復
API Routes    /api/*                   (4 routes) ← API 端點
```

**總計: 51 個頁面路由**

---

## 🎯 重構優先級路線圖

### Phase 1: 緊急修復 (第 1 週)
```
優先級 1: 拆分超大檔案
  - TourPage.tsx (897 → 3 files)
  - ChannelSidebar.tsx (833 → 2 files)
  - todo-expanded-view.tsx (777 → 2 files)

優先級 2: 移除重複 Store Factory
  - 刪除 create-store.ts

優先級 3: 簡化 Workspace Store Facade
  - 改用個別 store import

總工時: 8-11 小時
風險: 低
影響: 大幅提升可維護性
```

### Phase 2: 架構強化 (第 2-4 週)
```
優先級 1: 建立 Service Layer
  - 創建 12-15 個專用 services
  - 從 hooks/stores 提取業務邏輯

優先級 2: 擴展 API Layer
  - 新增 10-15 個 API routes
  - 加入驗證和錯誤處理

優先級 3: 重構超大 Hooks
  - 拆分 useTours.ts

總工時: 25-32 小時
風險: 中
影響: 顯著提升架構品質
```

### Phase 3: 品質提升 (第 5-7 週)
```
優先級 1: 測試覆蓋率
  - Stores 單元測試
  - Services 單元測試
  - API 整合測試

優先級 2: 型別安全
  - 消除 "as any" 使用
  - 加強型別定義

優先級 3: 效能優化
  - Component memoization
  - Store selectors
  - List virtualization

總工時: 30-40 小時
風險: 低
影響: 提升程式碼品質和效能
```

### Phase 4: 文檔與規範 (第 8-10 週)
```
優先級 1: 架構文檔
  - ADR (Architecture Decision Records)
  - 開發指南

優先級 2: 組件文檔
  - Storybook 設置
  - 組件使用範例

優先級 3: API 文檔
  - OpenAPI/Swagger 規範
  - API 使用指南

總工時: 15-20 小時
風險: 低
影響: 降低新人上手難度
```

---

## 🔍 依賴關係分析

### Store 依賴圖
```
核心 Stores (無依賴):
  - tourStore
  - orderStore
  - customerStore
  - employeeStore

依賴型 Stores:
  - paymentStore → orderStore, tourStore
  - memberStore → orderStore
  - quoteStore → tourStore
  - contractStore → tourStore

Workspace Stores (高耦合):
  - useWorkspaceStore → 5 stores ⚠️ 需解耦
```

### Component 依賴深度
```
深度 1 (基礎組件):
  - UI Components (34 個)
  - Table Cells (8 個)

深度 2 (複合組件):
  - EnhancedTable
  - ResponsiveHeader
  - ListPageLayout

深度 3 (頁面組件):
  - Page components (51 個)
```

---

## 📈 代碼品質指標

### 檔案大小分布
```
< 100 lines:   247 files (50.5%)  ✅ 良好
100-200 lines: 134 files (27.4%)  ✅ 良好
200-300 lines:  56 files (11.5%)  🟡 可接受
300-400 lines:  25 files (5.1%)   🟡 可接受
400-500 lines:  12 files (2.5%)   🟠 需關注
> 500 lines:    23 files (4.7%)   🔴 需拆分
```

### TypeScript 使用情況
```
✅ 100% TypeScript 檔案
⚠️ 188 個型別繞過 (as any/unknown)
✅ 20 個專用型別定義檔案
✅ 良好的介面定義
```

### 命名一致性
```
✅ Stores: use[Name]Store pattern
✅ Hooks: use[Name] pattern
✅ Components: PascalCase
✅ Files: kebab-case (大部分)
⚠️ 部分不一致 (需標準化)
```

---

## 🚀 立即行動建議

### 本週必做 (8-11 小時)
1. ✅ 拆分 TourPage.tsx (897 lines)
2. ✅ 拆分 ChannelSidebar.tsx (833 lines)
3. ✅ 刪除 create-store.ts (697 lines)
4. ✅ 簡化 useWorkspaceStore facade

### 下週規劃 (12-15 小時)
1. ✅ 創建 TourService
2. ✅ 創建 OrderService
3. ✅ 創建 PaymentService
4. ✅ 拆分 useTours.ts hook

### 本月目標 (25-32 小時)
1. ✅ 完成 Service Layer (12-15 services)
2. ✅ 擴展 API Layer (15-20 routes)
3. ✅ 拆分所有超大檔案 (< 400 lines)

---

## 📊 健康評分詳細分解

| 指標 | 分數 | 權重 | 說明 |
|------|------|------|------|
| 架構設計 | 8/10 | 20% | Hybrid Feature-Based 架構優秀 |
| 代碼組織 | 7/10 | 15% | 大部分組織良好，但有些檔案過大 |
| 型別安全 | 6/10 | 15% | TypeScript 使用良好，但有 188 個繞過 |
| 狀態管理 | 8/10 | 15% | Zustand 使用得當，但有耦合問題 |
| 可重用性 | 7/10 | 10% | Phase 1/2 改善顯著，但仍有空間 |
| 測試覆蓋 | 2/10 | 10% | 幾乎沒有測試 |
| 文檔完整 | 3/10 | 5% | 缺少架構和 API 文檔 |
| 效能優化 | 5/10 | 5% | 基本功能可用，但缺少優化 |
| Service Layer | 3/10 | 5% | 太薄弱，需要擴展 |
| **總分** | **6.75/10** | **100%** | **基礎穩固，需要優化** |

---

## 📝 總結

### 優勢 💪
- 架構設計良好，Feature-based 分離清晰
- TypeScript 全面採用
- Zustand 狀態管理結構清晰
- UI 組件系統完善
- 最近的 Phase 1/2 重構成效顯著

### 挑戰 ⚠️
- 23 個超大檔案需要拆分
- Service Layer 太薄弱 (只有 5 個)
- API Layer 不完整 (只有 4 個)
- 缺少測試覆蓋
- 188 個型別繞過需要處理

### 機會 🎯
- 擴展 Service Layer 提升可測試性
- 建立完整的 API Layer 增強安全性
- 拆分大檔案提升可維護性
- 加入測試提升信心
- 完善文檔降低上手門檻

### 威脅 🔴
- 技術債累積可能影響開發速度
- 缺少測試可能導致 regression bugs
- Service Layer 薄弱難以應對複雜業務邏輯
- 大檔案維護成本高

---

**下一步行動**: 從 Phase 1 (本週) 的緊急修復開始，優先拆分最大的 3 個檔案並移除重複的 Store Factory。

**長期目標**: 在 6-10 週內完成 Phase 1-4 的所有改善，將整體健康評分提升到 8.5/10。

**團隊需求**: 建議 2-3 位開發人員參與重構工作，預計總工時 78-103 小時。
