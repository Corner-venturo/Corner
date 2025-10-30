# VENTURO 5.0 系統狀態文檔

最後更新：2025-10-15

## 資料庫架構

- **使用中**：Supabase PostgreSQL + IndexedDB（快取）
- **連線狀態**：✅ 已連接
- **表數量**：46 個
- **同步模式**：雲端優先 + 本地快取（離線優先架構）

## 登入系統

### 預設帳號

- **管理員**：william01 / Venturo2025!

> 💡 其他帳號請從人資管理介面新增

### 初始化方式

- **自動初始化**：首次載入時檢查 localStorage 標記
- **手動初始化**：訪問 `/dev` 頁面，點擊「初始化資料庫」按鈕
- **清空資料**：訪問 `/dev` 頁面，點擊「清空所有資料」按鈕

### 登入驗證流程

1. 從 IndexedDB 讀取 employees 表
2. 根據 employeeNumber 查找使用者
3. 使用 bcrypt 驗證密碼 hash
4. 建立本地 Profile 並儲存到 localStorage

## Store 架構

### 當前架構

- 使用 `createStore` 工廠函數
- 資料流：Supabase（雲端）→ IndexedDB（快取）→ Store → UI
- 寫入策略：即時寫入 Supabase + 更新本地快取

### 使用 create-store 工廠（新架構）

- useTourStore - 旅遊團管理
- useOrderStore - 訂單管理
- useCustomerStore - 客戶管理
- usePaymentStore - 付款管理
- useQuoteStore - 報價管理
- useMemberStore - 成員管理
- useEmployeeStore - 員工管理

### 使用個別檔案（舊架構）

- accounting-store.ts - 會計功能
- calendar-store.ts - 行事曆
- workspace-store.ts - 工作空間
- timebox-store.ts - 時間盒
- todo-store.ts - 待辦事項

### 保留原因

以上舊架構 Store 包含特殊業務邏輯和複雜狀態管理，暫不遷移至新架構。

## 資料結構標準

- **欄位命名**：snake_case（資料庫層）
- **ID 格式**：UUID（範例：`${Date.now()}-${random()}`）
- **編號格式**：字母+年份+流水號（範例：T20250001）
- **時間戳**：ISO 8601 格式（createdAt, updatedAt）

## 資料表結構

主要資料表：

- `employees` - 員工資料
- `tours` - 旅遊團
- `customers` - 客戶
- `orders` - 訂單
- `payments` - 付款記錄
- `todos` - 待辦事項
- `members` - 成員
- `visas` - 簽證資料
- `suppliers` - 供應商
- `quotes` - 報價單
- `quote_items` - 報價項目
- `payment_requests` - 付款申請
- `disbursement_orders` - 支付單
- `receipt_orders` - 收款單

## 開發工具

### /dev 頁面

- **路徑**：http://localhost:3000/dev
- **功能**：
  - 初始化資料庫（建立預設資料）
  - 清空所有資料
  - 顯示預設帳號資訊

## 開發進度（2025-10-15 更新）

### 基礎架構 ✅ 已完成

- ✅ 型別系統
- ✅ IndexedDB 層
- ✅ Store 工廠
- ✅ 認證系統
- ✅ CRUD 功能
- ✅ Supabase 專案建立
- ✅ 46 個資料表建立
- ✅ Schema 欄位對齊
- ✅ 健康檢查 API (2 個端點)
- ✅ 資料讀取功能
- ✅ 資料寫入功能（Tours, Orders, Quotes）
- ✅ Store 整合測試（100% 通過）
- ✅ 離線優先架構

### 待完成功能

- ⏳ IndexedDB 同步驗證（待測試）
- 🔜 多人協作測試
- 🔜 衝突解決機制
- 🔜 RLS 權限政策
- 🔜 效能監控
- 🔜 錯誤追蹤

## 已知問題與修正

### 已解決（2025-01-15）

- ✅ Supabase 連線失敗 → 修正 Connection String
- ✅ quotes 表錯誤 → 新增缺少欄位
- ✅ Schema 不一致 → 自動化對齊腳本
- ✅ TypeScript 編譯錯誤 → 補充類型欄位

### 已解決（2025-10-15）

- ✅ Orders 表 schema 未知 → 逐步測試找出必填欄位
- ✅ 欄位名稱不一致 → 更新測試腳本對齊 TypeScript 定義
- ✅ Quotes customer_name 缺少 → 加入必填欄位

### 待處理

- ⏳ IndexedDB 同步驗證（本週）
- ⏳ 多人協作測試（下週）
- ⏳ Store API 統一化（進行中）
- 🔜 RLS 權限政策（未來規劃）

## 技術棧

- **前端框架**：Next.js 15 (App Router)
- **狀態管理**：Zustand
- **本地快取**：IndexedDB
- **雲端資料庫**：Supabase PostgreSQL
- **密碼加密**：bcryptjs
- **UI 組件**：Tailwind CSS + shadcn/ui
- **開發端口**：3000（Next.js 標準端口）

## 注意事項（2025-10-16 更新）

1. **離線優先架構**：資料主要存於 Supabase，本地 IndexedDB 作為快取
2. **開發端口**：統一使用 3000（Next.js 標準）
3. **連線需求**：需要網路連線到 Supabase（離線模式使用快取）
4. **資料同步**：寫入即時同步到雲端，讀取優先使用快取
