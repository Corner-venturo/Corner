# VENTURO 系統架構總覽 (SYSTEM INDEX)
> 最後更新：2025-01-03
> 版本：2.0
> 用途：快速了解整個系統架構，避免重複詢問

---

## 🏢 公司資訊
- **公司名稱**：Venturo 旅行社
- **系統用途**：旅行社 ERP 管理系統
- **使用人數**：< 15人
- **部署方式**：PWA (Progressive Web App) + Supabase 後端

---

## 👥 組織架構與使用者

### 人員配置
1. **超級管理員** (3人)
   - 老闆（董事長）
   - 特助
   - IT

2. **一般使用者** (約10人)
   - 業務：3-4位（常在外）
   - 會計：1位
   - 助理：特助兼任

### 權限策略
- **目前做法**：關閉 RLS，用程式端控制
- **權限控制**：基於 employees.permissions 欄位
- **特殊限制**：
  - HR薪資：只有老闆、特助能看
  - 財務報表/出納單：只有會計、管理層能看
  - 其他功能：基本上全開放（小公司互相支援）

---

## 📊 資料庫架構

### 核心表格列表
```sql
-- 1. 人員管理
employees            -- 員工資料表
profiles             -- 使用者設定檔（關聯 Supabase Auth，但目前未使用）

-- 2. 旅遊業務
tours                -- 旅遊團（欄位：code 而非 tourCode）
orders               -- 訂單（欄位：code 而非 tourCode）
members              -- 團員資料
tour_addons          -- 加購項目
tour_refunds         -- 退費記錄

-- 3. 報價管理
quotes               -- 報價單
quote_versions       -- 報價版本
quote_categories     -- 報價分類
quote_items          -- 報價項目

-- 4. 客戶管理
customers            -- 客戶資料

-- 5. 簽證管理
visas                -- 簽證申請記錄（欄位：code 而非 tourCode）

-- 6. 財務管理
payments             -- 付款記錄
payment_requests     -- 請款單（欄位：code 而非 tourCode）
payment_request_items -- 請款項目
disbursement_orders  -- 出納單
receipt_orders       -- 收款單（欄位：code 而非 tourCode）
receipt_payment_items -- 收款項目

-- 7. 供應商管理
suppliers            -- 供應商資料
price_list_items     -- 價格表項目

-- 8. 其他
todos                -- 待辦事項（creator 和 assignee 為 TEXT 型別）
```

### 重要欄位統一說明
- **團號欄位統一為 `code`**：所有資料表都使用 `code` 而非 `tourCode`
- **ID格式**：UUID（使用 gen_random_uuid()）
- **員工編號**：格式為 `{英文名小寫}{流水號}` (如：william01)
- **權限欄位**：`employees.permissions` TEXT[] 陣列
- **狀態追蹤**：所有表都有 `created_at`, `updated_at`
- **Snake Case 轉換**：API 層自動處理 camelCase ↔ snake_case

---

## 🗂️ 檔案結構

### 主要目錄
```
/venturo-new/
├── src/
│   ├── app/                 # Next.js 頁面
│   │   ├── accounting/      # 會計模組
│   │   ├── calendar/        # 行事曆
│   │   ├── customers/       # 客戶管理
│   │   ├── database/        # 基礎資料
│   │   │   ├── suppliers/   # 供應商
│   │   │   ├── pricing/     # 價格表
│   │   │   └── regions/     # 地區
│   │   ├── finance/         # 財務管理
│   │   │   ├── payments/    # 收付款
│   │   │   ├── requests/    # 請款單
│   │   │   └── treasury/    # 出納
│   │   │       └── disbursement/ # 出納單
│   │   ├── hr/              # 人事管理
│   │   ├── orders/          # 訂單管理
│   │   ├── quotes/          # 報價單
│   │   ├── tours/           # 旅遊團
│   │   ├── todos/           # 待辦事項
│   │   └── visas/           # 簽證管理
│   ├── components/          # React 元件
│   │   ├── layout/          # 佈局元件（ResponsiveHeader, Sidebar）
│   │   ├── ui/              # UI 元件（Button, Input, Table 等）
│   │   └── [功能]/          # 各功能專屬元件
│   ├── stores/              # Zustand 狀態管理
│   │   ├── types.ts         # 統一型別定義
│   │   └── [功能]-store.ts  # 各功能的 store
│   ├── lib/                 # 工具函式
│   │   ├── supabase/        # Supabase 設定
│   │   │   ├── client.ts    # Supabase 客戶端
│   │   │   └── api.ts       # API 統一封裝（含 snake_case 轉換）
│   │   ├── offline/         # 離線同步
│   │   │   └── sync-manager.ts # 同步管理器
│   │   └── persistent-store.ts # 持久化儲存工具
│   └── types/               # TypeScript 型別定義
├── supabase/
│   └── migrations/          # 資料庫遷移檔案
└── public/                  # 靜態資源
```

---

## 🔧 技術架構

### 前端技術
- **框架**：Next.js 14 (App Router)
- **UI庫**：shadcn/ui + Tailwind CSS
- **狀態管理**：Zustand + persist
- **表單**：React Hook Form + Zod
- **圖標**：Lucide React

### 後端技術
- **資料庫**：Supabase (PostgreSQL)
- **認證**：Supabase Auth（已配置但未啟用，使用自建認證）
- **即時通訊**：Supabase Realtime（未啟用）
- **檔案存儲**：Supabase Storage（未啟用）

### PWA 架構
- **離線支援**：Service Worker + IndexedDB
- **同步機制**：Background Sync API
- **衝突處理**：Last Write Wins
- **樂觀更新**：立即更新本地，背景同步雲端

### 離線同步機制
```javascript
// 同步管理器負責的表格
const syncTables = [
  'tours', 'orders', 'customers', 
  'payments', 'todos' // todos 已加入同步
];

// 同步策略
- 線上時：即時同步到 Supabase
- 離線時：儲存到 IndexedDB，待連線後自動同步
- 衝突處理：最後寫入優先（Last Write Wins）
```

### 🎨 UI/UX 設計規範

#### 頁面佈局結構
系統採用**左右分割佈局**：
- **左側**：側邊欄 (Sidebar)
- **右側**：主要內容區
  - **上方**：ResponsiveHeader 標題列
  - **下方**：內容區 (Content Area)

#### ResponsiveHeader 組件規範
> 位置：所有功能頁面的頂部標題列

**結構劃分**：
```
┌─────────────────────────────────────────────────────────┐
│ ResponsiveHeader                                        │
├──────────────────────┬──────────────────────────────────┤
│ 左側區域             │ 右側功能區                        │
│ • 主標題             │ • 同步狀態指示器                   │
│ • 麵包屑導航（可選） │ • 搜尋框（放大鏡圖標）             │
│ • 功能圖標（可選）   │ • 篩選按鈕/分頁切換               │
│                      │ • 新增按鈕                        │
│                      │ • 其他功能按鈕                    │
└──────────────────────┴──────────────────────────────────┘
```

**同步狀態指示器**：
- 🟢 **已同步**：資料已上傳到雲端
- 🟡 **同步中**：有待處理的變更（顯示數量）
- ⚫ **離線模式**：無網路連線

---

## 🔑 認證系統

### 登入方式
- **員工編號登入**：格式為 `{英文名小寫}{流水號}` (如：william01)
- **預設測試帳號**：william01（寫在 migration 中）
- **密碼驗證**：使用 bcrypt 比對（未實作）
- **Session 管理**：使用 localStorage 儲存登入狀態

### 重要提醒
- 目前系統**沒有實作密碼驗證**
- 登入後直接進入系統
- 生產環境必須實作密碼驗證

---

## 🔐 權限系統

### 權限列表
```javascript
// 系統權限
'super_admin'          // 超級管理員
'admin'                // 一般管理員

// 功能模組權限
'quotes'               // 報價單
'tours'                // 旅遊團
'orders'               // 訂單
'payments'             // 收款
'disbursement'         // 出納
'todos'                // 待辦事項
'hr'                   // 人資管理
'reports'              // 報表
'settings'             // 設定
```

### 預設角色權限
- **william01**：所有權限（寫在 migration 中）
- **其他使用者**：需透過 HR 系統設定權限

---

## 🚀 功能模組說明

### 1. 待辦事項 (/todos) 
- **資料表**：todos
- **特殊設計**：
  - creator/assignee 使用 TEXT 型別（非 UUID）
  - 支援離線同步
  - 包含子任務和備註
- **同步狀態**：頁面顯示同步指示器

### 2. 簽證管理 (/visas)
- **資料表**：visas
- **團號欄位**：`code`（已從 tourCode 改名）
- **年度團**：自動建立 VISA-2024 團

### 3. 旅遊團管理 (/tours)
- **資料表**：tours
- **團號欄位**：`code`（已從 tourCode 改名）
- **關聯**：訂單、團員、收付款

### 4. 訂單管理 (/orders)
- **資料表**：orders, members
- **團號欄位**：`code`（已從 tourCode 改名）
- **特色**：支援團員管理、加購、退費

### 5. 財務系統 (/finance)
- **請款單**：payment_requests（團號欄位：`code`）
- **出納單**：disbursement_orders
- **收款單**：receipt_orders（團號欄位：`code`）
- **權限控制**：會計和管理層可用

### 6. 人事管理 (/hr)
- **資料表**：employees
- **權限**：只有超級管理員能使用
- **功能**：管理員工資料、薪資、權限設定

### 7. 基礎資料 (/database)
- **供應商**：suppliers
- **價格表**：price_list_items
- **權限**：開放查看，特定人維護

---

## ⚙️ 重要設定與初始化

### 資料庫 Migrations
```bash
# 位於 /supabase/migrations/
20250929023918_create_basic_tables.sql  # 基礎表格建立
20250103_fix_todos_table.sql            # 修正 todos 表結構
```

### 執行 Migration
```bash
# 使用 Supabase CLI
npx supabase migration up

# 或直接在 Supabase Dashboard 執行 SQL
```

### 環境變數設定
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=你的_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=你的_SERVICE_KEY
DATABASE_URL=你的_直連_DATABASE_URL
AUTH_MODE=supabase
JWT_SECRET=你的_JWT_SECRET
```

### 重要提醒
1. **關閉 RLS**：所有表格都需要關閉 RLS
2. **授予權限**：給 anon 和 authenticated 角色
```sql
-- 對所有表格執行
ALTER TABLE 表名 DISABLE ROW LEVEL SECURITY;
GRANT ALL ON 表名 TO anon, authenticated;
```

---

## 📝 常見問題與解決方案

### Q1: 待辦事項沒有同步到雲端
**原因**：
1. sync-manager.ts 沒有包含 todos 表
2. 頁面沒有呼叫 loadTodos()
3. todos 表的欄位型別不匹配

**解決**：
1. 確認 sync-manager.ts 的 `pullRemoteChanges` 包含 todos
2. 頁面載入時呼叫 `loadTodos()`
3. 執行 migration 修正欄位型別

### Q2: 團號欄位名稱不一致
**問題**：有些地方用 tourCode，有些用 code
**解決**：已統一改為 `code`，相關表格：
- tours, orders, visas
- payment_requests, receipt_orders

### Q3: 離線同步不工作
**檢查項目**：
1. IndexedDB 是否正常初始化
2. Service Worker 是否註冊
3. sync-manager 是否正確配置
4. 網路狀態偵測是否正常

### Q4: 權限功能無法顯示
**問題**：登入後側邊欄沒有功能
**原因**：權限名稱不匹配或沒有 `super_admin`
**解決**：確保 employees.permissions 包含正確的權限名稱

### Q5: API 欄位名稱不匹配
**問題**：前端用 camelCase，資料庫用 snake_case
**解決**：API 層（lib/supabase/api.ts）自動處理轉換

---

## 🔄 最近更新記錄

### 2025-01-03 更新內容
1. **統一團號欄位名稱**：所有 `tourCode` 改為 `code`
2. **修正 todos 表結構**：
   - creator/assignee 改為 TEXT 型別
   - 加入 completed 欄位
   - 移除不必要的外鍵約束
3. **完善離線同步**：
   - todos 加入同步列表
   - 頁面顯示同步狀態
   - 修正同步邏輯
4. **更新文檔**：整理系統架構，反映最新狀態

### 需要注意的地方
1. **資料表命名**：使用 employees 而非 users
2. **團號欄位**：統一使用 `code`
3. **同步表格**：確保所有需要同步的表都在 sync-manager 中
4. **權限檢查**：側邊欄檢查 `super_admin`

---

## 💡 給 Claude 的提醒

1. **這是小公司系統**（<15人），不需要過度複雜的設計
2. **RLS 已關閉**，使用程式端權限控制
3. **團號欄位統一為 `code`**，不要用 tourCode
4. **員工表是 `employees`**，不是 users
5. **todos 的 creator/assignee 是 TEXT**，不是 UUID
6. **密碼驗證尚未實作**，登入直接進入
7. **同步功能**需要包含所有業務表格
8. **API 自動處理** camelCase ↔ snake_case 轉換
9. **離線優先**，所有操作都要考慮離線場景
10. **狀態管理用 Zustand**，不要建議 Redux

---

## 🎯 待處理事項

### 緊急
- [ ] 實作密碼驗證功能
- [ ] 完善權限控制機制
- [ ] 修復所有欄位命名不一致問題

### 重要
- [ ] 優化離線同步效能
- [ ] 加入衝突解決機制
- [ ] 完善錯誤處理

### 一般
- [ ] 加入更多自動化功能
- [ ] 優化使用者體驗
- [ ] 增加資料匯出功能

---

**版本記錄**
| 日期 | 版本 | 說明 |
|------|------|------|
| 2024-12-19 | 1.0 | 初版建立 |
| 2024-12-31 | 1.1 | 新增認證系統說明 |
| 2025-01-03 | 2.0 | 大幅更新：統一欄位名稱、修正資料結構、完善同步機制 |

---

**使用方式**：
未來對話開始時，請 Claude 先讀取此檔案：
「請先看 VENTURO_SYSTEM_INDEX.md，了解系統架構」
