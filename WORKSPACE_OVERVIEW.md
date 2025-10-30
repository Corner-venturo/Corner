# Venturo 工作空間完整概念

> **最後更新**：2025-10-30
> **專案狀態**：✅ 生產環境運行中
> **維護者**：William Chien

---

## 📋 目錄

1. [專案定位](#-專案定位)
2. [工作空間結構](#-工作空間結構)
3. [技術架構](#-技術架構)
4. [業務邏輯](#-業務邏輯)
5. [資料流動](#-資料流動)
6. [開發規範](#-開發規範)
7. [部署流程](#-部署流程)

---

## 🎯 專案定位

### 核心資訊

| 項目         | 說明                                       |
| ------------ | ------------------------------------------ |
| **專案名稱** | Venturo 旅遊團管理系統                     |
| **目標用戶** | 小型旅行社（10-50 人）                     |
| **使用場景** | 辦公室為主，外勤為輔                       |
| **核心價值** | 簡單、實用、穩定、離線可用                 |
| **工作目錄** | `/Users/williamchien/Projects/venturo-new` |
| **開發端口** | `http://localhost:3000`                    |

### 設計理念

#### 1. **簡單優先（Simplicity First）**

- 統一 > 分散：所有功能統一處理方式
- 簡單 > 完美：可用性優先於完美設計
- 實用 > 理論：解決實際問題，不過度設計

#### 2. **離線優先（Offline-First）**

- 所有功能都支援離線操作
- 資料優先存本地，有網路時背景同步
- 不區分功能的離線權限（統一處理，減少複雜度）

#### 3. **FastIn 寫入策略**

```
操作流程：
UI 觸發 → IndexedDB 立即寫入 ⚡ → UI 立即更新 → 背景同步 Supabase ☁️
```

**特點：**

- ⚡ 本地先寫，零等待
- ☁️ 背景同步，不阻塞
- ✅ 最終一致，資料安全

---

## 🗂️ 工作空間結構

### 完整目錄樹

```
/Users/williamchien/Projects/venturo-new/
│
├── 📁 docs/                          # 文件目錄
│   ├── PROJECT_PRINCIPLES.md         # 設計理念與決策 ⭐️
│   ├── VENTURO_5.0_MANUAL.md         # 技術實作細節 ⭐️
│   ├── DATABASE.md                   # 資料庫設計
│   ├── DESIGN_SYSTEM.md              # UI 設計系統
│   └── archive/                      # 歷史文件
│
├── 📁 src/                           # 原始碼主目錄
│   │
│   ├── 📁 app/                       # Next.js App Router 頁面
│   │   ├── page.tsx                  # 🏠 首頁（小工具頁面）
│   │   ├── layout.tsx                # 主佈局（Sidebar + Header）
│   │   ├── globals.css               # 全域樣式
│   │   │
│   │   ├── 📂 tours/                 # ✈️ 旅遊團管理
│   │   │   ├── page.tsx              # 旅遊團列表
│   │   │   └── [id]/                 # 旅遊團詳情（6 個分頁）
│   │   │
│   │   ├── 📂 orders/                # 📝 訂單管理
│   │   ├── 📂 customers/             # 👥 客戶管理
│   │   ├── 📂 quotes/                # 💰 報價單管理
│   │   │
│   │   ├── 📂 finance/               # 💵 財務模組
│   │   │   ├── payments/             # 付款管理
│   │   │   ├── requests/             # 請款單
│   │   │   ├── treasury/             # 出納單
│   │   │   └── travel-invoice/       # 應收應付帳
│   │   │
│   │   ├── 📂 database/              # 🗄️ 基礎資料管理
│   │   │   ├── regions/              # 地區資料
│   │   │   ├── suppliers/            # 供應商資料
│   │   │   ├── attractions/          # 景點資料
│   │   │   └── activities/           # 活動資料
│   │   │
│   │   ├── 📂 hr/                    # 👔 人事管理
│   │   ├── 📂 accounting/            # 📊 會計模組
│   │   ├── 📂 calendar/              # 📅 行事曆
│   │   ├── 📂 contracts/             # 📄 合約管理
│   │   ├── 📂 visas/                 # 🛂 簽證管理
│   │   ├── 📂 settings/              # ⚙️ 系統設定
│   │   │
│   │   └── 📂 api/                   # API 路由
│   │       ├── health/               # 健康檢查
│   │       ├── admin/                # 管理介面
│   │       └── itineraries/          # 行程表 API
│   │
│   ├── 📁 components/                # React 組件
│   │   ├── layout/                   # 佈局組件（Sidebar, Header）
│   │   ├── ui/                       # UI 基礎組件（Button, Input）
│   │   ├── tours/                    # 旅遊團專用組件
│   │   ├── orders/                   # 訂單專用組件
│   │   └── shared/                   # 共用組件
│   │
│   ├── 📁 stores/                    # Zustand 狀態管理
│   │   ├── index.ts                  # Store 統一匯出 ⭐️
│   │   ├── types.ts                  # 資料型別定義
│   │   ├── core/                     # Store 核心邏輯
│   │   │   ├── create-store-new.ts   # 工廠函數（createStore）
│   │   │   └── supabase-sync.ts      # Supabase 同步邏輯
│   │   └── [各功能 store].ts         # 個別功能 Store
│   │
│   ├── 📁 services/                  # 業務邏輯服務
│   │   ├── local-auth-service.ts     # 本地登入驗證
│   │   ├── sync/                     # 同步服務
│   │   │   ├── background-sync.ts    # 背景同步
│   │   │   └── network-monitor.ts    # 網路狀態監控
│   │   └── indexeddb/                # IndexedDB 封裝
│   │       └── local-db.ts           # 本地資料庫
│   │
│   ├── 📁 hooks/                     # React Custom Hooks
│   │   ├── useTours.ts               # 旅遊團操作
│   │   ├── useOrders.ts              # 訂單操作
│   │   ├── useCustomers.ts           # 客戶操作
│   │   └── useAuth.ts                # 登入狀態
│   │
│   ├── 📁 lib/                       # 工具函式庫
│   │   ├── utils.ts                  # 通用工具
│   │   ├── supabase.ts               # Supabase 客戶端
│   │   └── ui/                       # UI 相關工具
│   │
│   ├── 📁 types/                     # TypeScript 型別定義
│   │   ├── tour.types.ts             # 旅遊團型別
│   │   ├── order.types.ts            # 訂單型別
│   │   ├── customer.types.ts         # 客戶型別
│   │   └── index.ts                  # 型別統一匯出
│   │
│   ├── 📁 constants/                 # 常數定義
│   │   ├── routes.ts                 # 路由常數
│   │   └── config.ts                 # 設定常數
│   │
│   └── 📁 core/                      # 核心基礎設施
│       ├── types/                    # 核心型別
│       ├── services/                 # 核心服務
│       └── errors/                   # 錯誤處理
│
├── 📁 public/                        # 靜態資源
│   ├── images/                       # 圖片
│   └── fonts/                        # 字型
│
├── 📁 .github/                       # GitHub 設定
│   └── workflows/                    # CI/CD 流程
│       ├── ci.yml                    # 自動化測試
│       └── bundle-size.yml           # 打包大小檢查
│
├── 📁 .claude/                       # AI 助手規範
│   ├── CLAUDE.md                     # AI 行為控制規範 ⭐️
│   └── SUPABASE_CREDENTIALS.md       # Supabase 憑證
│
├── 📄 package.json                   # 專案依賴
├── 📄 tsconfig.json                  # TypeScript 設定
├── 📄 tailwind.config.ts             # TailwindCSS 設定
├── 📄 next.config.ts                 # Next.js 設定
└── 📄 README.md                      # 專案說明

```

---

## 🏗️ 技術架構

### 技術棧

| 分類         | 技術         | 版本        | 用途                        |
| ------------ | ------------ | ----------- | --------------------------- |
| **前端框架** | Next.js      | 15.5.4      | App Router + Server Actions |
| **UI 框架**  | React        | 19.1.0      | 組件化開發                  |
| **程式語言** | TypeScript   | 5.x         | 型別安全                    |
| **狀態管理** | Zustand      | 5.0.8       | 輕量級狀態管理 + Persist    |
| **樣式系統** | TailwindCSS  | 4.x         | Utility-first CSS           |
| **UI 組件**  | Radix UI     | -           | 無障礙 Headless 組件        |
| **圖示**     | Lucide React | 0.544.0     | 圖示庫                      |
| **資料庫**   | Supabase     | 2.75.0      | PostgreSQL + Realtime       |
| **本地快取** | IndexedDB    | (idb 8.0.3) | 離線資料儲存                |
| **日期處理** | date-fns     | 4.1.0       | 日期格式化                  |
| **表單驗證** | -            | -           | 自訂驗證邏輯                |
| **測試**     | Playwright   | 1.56.0      | E2E 測試                    |
| **部署**     | Vercel       | -           | 自動化部署                  |

### 核心設計模式

#### 1. **Store 工廠模式**

```typescript
// src/stores/index.ts

// ✅ 使用統一工廠函數
export const useTourStore = createStore<Tour>('tours', 'T')
export const useOrderStore = createStore<Order>('orders', 'O')

// createStore 自動提供：
// - Supabase 雲端同步
// - IndexedDB 本地快取
// - 自動編號生成
// - 統一 CRUD API
```

**好處：**

- 品質一致，所有 Store 功能相同
- 自動離線支援
- 減少重複程式碼
- 易於維護

#### 2. **離線優先架構（Offline-First）**

```
寫入資料流程（FastIn）：
┌─────────────┐
│  UI 操作     │
└──────┬──────┘
       ↓
┌─────────────────────────────┐
│ ⚡ Step 1: IndexedDB 立即寫入  │
│ (_needs_sync: true)          │
│ (_synced_at: null)           │
└──────┬──────────────────────┘
       ↓
┌─────────────────────────────┐
│ ✅ UI 立即更新（無等待）       │
└──────┬──────────────────────┘
       ↓
┌─────────────────────────────┐
│ ☁️ 背景同步到 Supabase        │
│ (backgroundSyncService)      │
└──────┬──────────────────────┘
       ↓
┌─────────────────────────────┐
│ ✅ 更新同步狀態                │
│ (_needs_sync: false)         │
│ (_synced_at: timestamp)      │
└─────────────────────────────┘
```

**讀取資料流程：**

```
UI 請求 → Store → IndexedDB（快取優先）⚡
                    ↓
           背景同步 Supabase（更新最新資料）☁️
```

#### 3. **同步狀態欄位**

所有可同步的資料表都包含：

```typescript
{
  _needs_sync: boolean;       // 是否需要同步
  _synced_at: string | null;  // 最後同步時間（ISO 8601）
  _deleted?: boolean;         // 軟刪除標記
}
```

---

## 💼 業務邏輯

### 核心業務實體

#### 1. **旅遊團（Tour）**

```typescript
{
  id: string
  tour_code: string // T20250001 或 TTBC（待確認）
  tour_name: string
  departure_date: string
  return_date: string
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled'
  // ... 其他欄位
}
```

**編號規則：**

- 線上：`T{year}{4位數}` (如：T20250001)
- 離線：`TTBC` (Tour To Be Confirmed)

#### 2. **訂單（Order）**

```typescript
{
  id: string
  order_number: string // O20250001 或 OTBC
  tour_id: string // 關聯旅遊團
  customer_id: string // 關聯客戶
  total_amount: number
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled'
  // ... 其他欄位
}
```

**關聯關係：**

```
Tour (1) ─── (N) Order ─── (N) Member
                      └─── (N) Payment
```

#### 3. **客戶（Customer）**

```typescript
{
  id: string
  customer_code: string // C20250001 或 CTBC
  name: string
  phone: string
  email: string
  // ... 其他欄位
}
```

### 業務模組

| 模組          | 路徑          | 功能                             | 狀態    |
| ------------- | ------------- | -------------------------------- | ------- |
| 🏠 **首頁**   | `/`           | 小工具集中地（計算機、代辦事項） | ✅ 完成 |
| ✈️ **旅遊團** | `/tours`      | 旅遊團 CRUD + 詳情頁（6 個分頁） | ✅ 完成 |
| 📝 **訂單**   | `/orders`     | 訂單管理、付款追蹤               | ✅ 完成 |
| 👥 **客戶**   | `/customers`  | 客戶資料庫                       | ✅ 完成 |
| 💰 **報價**   | `/quotes`     | 報價單建立、發送                 | ✅ 完成 |
| 💵 **財務**   | `/finance`    | 請款單、出納單、應收應付帳       | ✅ 完成 |
| 🗄️ **資料庫** | `/database`   | 地區、供應商、景點、活動         | ✅ 完成 |
| 📅 **行事曆** | `/calendar`   | 行程規劃視覺化                   | ✅ 完成 |
| 👔 **人事**   | `/hr`         | 員工管理、權限設定               | ✅ 完成 |
| 📊 **會計**   | `/accounting` | 會計分錄、報表                   | ✅ 完成 |
| 🛂 **簽證**   | `/visas`      | 簽證管理                         | ✅ 完成 |
| ⚙️ **設定**   | `/settings`   | 系統設定                         | ✅ 完成 |

---

## 🔄 資料流動

### 完整資料流程圖

```
┌─────────────────────────────────────────────────┐
│                  使用者操作                       │
│              (點擊、輸入、提交)                    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│                 UI Components                   │
│         (React 組件：表單、按鈕、列表)              │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│               Custom Hooks                      │
│       (useTours, useOrders, useCustomers...)    │
│         - 狀態管理                               │
│         - 操作封裝                               │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              Zustand Stores                     │
│         (createStore 工廠產生)                   │
│         - 狀態儲存                               │
│         - 資料驗證                               │
└──────────┬──────────────────────────────────────┘
           │
           │ FastIn 寫入流程
           ▼
┌──────────────────────────────────────────────────┐
│  ⚡ IndexedDB（本地快取）                         │
│  - 立即寫入                                       │
│  - 標記 _needs_sync: true                        │
│  - UI 立即更新                                    │
└──────────┬───────────────────────────────────────┘
           │
           │ 背景同步（不阻塞 UI）
           ▼
┌──────────────────────────────────────────────────┐
│  ☁️ Supabase PostgreSQL（雲端資料庫）             │
│  - 背景上傳                                       │
│  - 更新 _synced_at                                │
│  - 自動衝突處理                                   │
└──────────────────────────────────────────────────┘
```

### 同步機制

#### 觸發時機

1. **網路恢復時** - `NetworkMonitor` 自動觸發
2. **進入相關頁面** - `fetchAll()` 拉取最新資料
3. **手動同步** - 使用者點擊同步按鈕

#### 同步優先級

```typescript
// 合併策略（雲端資料 + 本地待同步資料）
const mergedData = [
  ...cloudData, // 雲端已同步資料
  ...localPendingData, // 本地待同步資料（_needs_sync: true）
].filter(item => !item._deleted) // 過濾軟刪除
```

---

## 📐 開發規範

### 命名規範

#### 資料欄位（snake_case）

```typescript
// ✅ 正確：統一使用 snake_case
interface Tour {
  tour_name: string
  start_date: string
  created_at: string
}

// ❌ 錯誤：不要用 camelCase
interface BadTour {
  tourName: string // ❌
  startDate: string // ❌
}
```

**原因：**與 Supabase PostgreSQL 命名慣例一致，避免前後端轉換複雜度。

#### 組件檔案（kebab-case）

```
✅ tour-list.tsx
✅ order-form.tsx
✅ customer-detail.tsx
```

### UI 開發規範

#### 頁面高度結構

```tsx
// ✅ 正確：h-full flex flex-col
<div className="h-full flex flex-col">
  <div className="flex-none">{/* Header 固定高度 */}</div>
  <div className="flex-1 overflow-auto">{/* 內容區自動填滿 */}</div>
</div>
```

**原因：**確保畫面填滿，避免底部空白，內容區可獨立捲動。

#### 莫蘭迪色系

```css
--morandi-primary: #3a3633 /* 主要文字 */ --morandi-secondary: #8b8680 /* 次要文字 */
  --morandi-gold: #c4a572 /* 強調色 */ --morandi-green: #9fa68f /* 成功狀態 */
  --morandi-red: #c08374 /* 警告狀態 */ --morandi-container: #e8e5e0 /* 容器背景 */;
```

### Store 使用規範

```typescript
// ✅ 正確：使用統一工廠
export const useTourStore = createStore<Tour>('tours', 'T')

// ❌ 錯誤：不要自己寫 Zustand create
// 應該使用 createStore 工廠
```

### 錯誤處理規範

```typescript
try {
  // 1. 優先嘗試 Supabase
  const result = await supabase.from('tours').insert(data)
  if (result.error) throw result.error

  // 2. 成功 → 快取到 IndexedDB
  await indexedDB.put(result.data)
} catch (error) {
  // 3. 失敗 → 靜默降級到 IndexedDB
  console.log('⚠️ 切換到離線模式')
  await indexedDB.put({ ...data, _needs_sync: true })
}

// 4. 使用者只看到成功訊息
toast.success('儲存成功')
```

**原則：**

- ❌ 不要顯示「Supabase 連線失敗」（嚇到使用者）
- ✅ 靜默切換到本地模式
- ✅ 只顯示成功訊息
- ❌ 只有當 Supabase 和 IndexedDB 都失敗才顯示錯誤

---

## 🚀 部署流程

### 開發流程

```bash
# 1. 本地開發
npm run dev             # 啟動開發伺服器（port 3000）

# 2. 程式碼檢查
npm run lint            # ESLint 檢查
npm run format:check    # Prettier 格式檢查
npm run type-check      # TypeScript 型別檢查

# 3. 提交程式碼
git add .
git commit -m "feat: 新增功能"
git push origin main
```

### CI/CD 流程

```
GitHub Push
    ↓
┌─────────────────────────────────┐
│   GitHub Actions CI/CD          │
│                                 │
│  1. Code Quality Check          │
│     - ESLint                    │
│     - Prettier                  │
│                                 │
│  2. Run Tests                   │
│     - Unit Tests (TODO)         │
│     - E2E Tests (TODO)          │
│                                 │
│  3. Build Application           │
│     - next build                │
│     - Check bundle size         │
└─────────────┬───────────────────┘
              ↓
         (如果全部通過)
              ↓
┌─────────────────────────────────┐
│   Vercel 自動部署                │
│   - 建置專案                     │
│   - 部署到生產環境                │
│   - 產生預覽 URL                 │
└─────────────────────────────────┘
```

### 環境變數

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_ENABLE_SUPABASE=true  # 啟用 Supabase 同步

# 應用程式
NEXT_PUBLIC_APP_URL=https://venturo.vercel.app
```

---

## 📚 關鍵文件導航

### 必讀文件（按順序）

1. **PROJECT_PRINCIPLES.md** - 設計理念與決策
   - 為什麼這樣設計？
   - 核心決策說明
   - 常見誤解澄清

2. **VENTURO_5.0_MANUAL.md** - 技術實作細節
   - 系統架構規範
   - API 與資料流
   - 開發檢查清單

3. **CLAUDE.md** - AI 助手工作規範
   - 行為控制規範
   - 快速參考資訊

### 開發參考

- **DATABASE.md** - 資料庫結構與 Migration
- **DESIGN_SYSTEM.md** - UI 設計系統規範
- **README.md** - 快速開始指南

---

## 💡 給團隊成員的提示

### 新手上手流程

1. **閱讀文件**
   - 先讀 `PROJECT_PRINCIPLES.md` 理解設計理念
   - 再讀 `VENTURO_5.0_MANUAL.md` 學習技術細節
   - 參考 `README.md` 快速開始

2. **環境設定**

   ```bash
   npm install
   npm run dev
   ```

3. **熟悉架構**
   - 瀏覽 `src/stores/index.ts` 了解資料模型
   - 查看 `src/app/tours/page.tsx` 典型頁面實作
   - 研究 `src/stores/core/create-store-new.ts` Store 工廠

4. **開始開發**
   - 遵循 Store 工廠模式
   - 使用統一的命名規範（snake_case）
   - 遵循 UI 開發規範（h-full flex flex-col）

### 常見任務指引

#### 新增功能模組

```bash
# 1. 定義資料型別
src/types/supplier.types.ts

# 2. 建立 Store（使用工廠）
src/stores/index.ts → useSu supplierStore = createStore<Supplier>('suppliers', 'S');

# 3. 建立頁面
src/app/suppliers/page.tsx

# 4. 更新側邊欄
src/components/layout/sidebar.tsx
```

#### 修改現有功能

```bash
# 1. 找到對應的 Store
src/stores/index.ts

# 2. 找到對應的頁面
src/app/[功能]/page.tsx

# 3. 確認資料型別
src/types/[功能].types.ts

# 4. 修改並測試
npm run dev
```

---

## ⚠️ 重要提醒

### 給開發者

1. **這是小公司系統** - 不需要企業級複雜度
2. **統一處理優於精細區分** - 所有功能離線模式一致
3. **實用性優於理論完美** - 先讓它動，再優化
4. **不要過度設計** - YAGNI 原則（You Aren't Gonna Need It）

### 給 AI 助手

1. 不要建議複雜的權限系統
2. 不要建議區分離線權限
3. 首頁就是小工具頁面，不是儀表板
4. 遵循既有的 Store 工廠模式
5. 保持命名規範一致（snake_case）

---

## 📞 支援與回饋

- **維護者**：William Chien
- **專案位置**：`/Users/williamchien/Projects/venturo-new`
- **線上版本**：https://venturo.vercel.app

---

**記住核心理念：Simple is Better！** 🎯
