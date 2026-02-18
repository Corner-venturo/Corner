# 舊版 Corner ERP vs 新版 Venturo ERP — 全面功能比對

> 產出日期：2026-02-18
> 舊版：`~/Desktop/cornerERP-master`（Next.js + Fuse 模板，~5 萬行）
> 新版：`~/Projects/venturo-erp`（Next.js App Router，~33 萬行）

## 圖示說明

- ✅ 新版已超越舊版
- 🟡 新版有但功能不完整
- 🔴 舊版有但新版完全沒有
- ⚠️ 邏輯差異需要確認

---

## 一、核心模組比對

| 模組 | 舊版 | 新版 | 狀態 | 說明 |
|------|------|------|------|------|
| **旅遊團 (Groups/Tours)** | ✓ 團列表、團詳情（基本資料、旅客、訂單、請款、收款、利潤、獎金設定共 7 個 tab） | ✓ tours 模組 + 完整行程設計 (itinerary)、排程 (scheduling)、團員 (members)、確認 (confirmations)、合約 (contracts)、報價 (quotes) 等獨立模組 | ✅ | 新版將舊版「團」拆成多個專業模組，功能遠超舊版 |
| **訂單 (Orders)** | ✓ 訂單列表、訂單詳情、團內訂單建立 | ✓ orders 模組 + features/orders | ✅ | 新版有獨立訂單頁面及 features 層 |
| **收款單 (Receipts/Payments)** | ✓ 列表、詳情、批次建立、依訂單查收款、LinkPay 線上付款 | ✓ finance/payments + LinkPay API | ✅ | 新版整合在 finance 模組下，LinkPay 仍支援 |
| **請款單 (Invoices)** | ✓ 列表、詳情、狀態管理、明細項目 CRUD | ✓ finance/requests（請款申請）+ finance/travel-invoice（旅遊請款） | ✅ | 新版拆分為一般請款和旅遊專用請款 |
| **出納單 (Bills/Treasury)** | ✓ 列表、詳情（限會計角色） | ✓ finance/treasury | ⚠️ | 名稱不同，需確認功能是否對齊，舊版有角色權限限制 |
| **供應商 (Suppliers)** | ✓ 列表、詳情 | ✓ supplier 模組 + features/suppliers | ✅ | 新版更完善 |
| **顧客 (Customers)** | ✓ 列表、詳情、顧客分群、批次匯入、搜尋 | ✓ customers 模組 + customer-groups + companies 子頁 | ✅ | 新版增加公司客戶管理 |
| **網卡/eSIM** | ✓ 列表、詳情 | ✓ esims 模組 + features/esims | ✅ | 新版有建立對話框 |
| **日曆 (Calendar)** | ✓ 基本日曆 | ✓ calendar 模組 + features/calendar | ✅ | 新版更完善 |
| **員工/使用者 (Users/HR)** | ✓ 員工列表、詳情 | ✓ hr 模組（出勤 attendance、請假 leave、薪資 payroll）+ settings/permissions | ✅ | 新版 HR 功能遠超舊版，舊版只有基本員工資料 |

---

## 二、新版獨有模組（舊版完全沒有）

| 模組 | 新版路徑 | 說明 |
|------|----------|------|
| **行程設計 (Itinerary)** | `itinerary/` + `features/itinerary` (27 files) | 完整行程規劃工具 |
| **報價 (Quotes)** | `quotes/` + `features/quotes` (12 files) | 報價單管理 |
| **設計 (Design)** | `design/` + `features/design` (21 files) | 旅遊產品設計 |
| **合約 (Contracts)** | `contracts/` + `features/contracts` | 合約管理 |
| **確認單 (Confirmations)** | `confirmations/` + `features/confirmations` (15 files) | 供應商確認管理 |
| **簽證 (Visas)** | `visas/` + `features/visas` | 簽證管理 |
| **PNR 管理** | `pnrs/` | 機票 PNR 記錄 |
| **排程 (Scheduling)** | `scheduling/` + `features/scheduling` | 團出發排程 |
| **辦公室 (Office)** | `office/` + `features/office` | 辦公室管理 |
| **待辦事項 (Todos)** | `todos/` + `features/todos` | 任務管理 |
| **時間盒 (Timebox)** | `timebox/` + `features/timebox` | 時間管理 |
| **旅客聊天 (Traveler Chat)** | `traveler-chat/` + `features/traveler-chat` | 與旅客即時通訊 |
| **手冊 (Brochure)** | `brochure/` | 旅遊手冊製作 |
| **表現管理 (Manifestation)** | `manifestation/` + `features/manifestation` | 團員清單 manifest |
| **檔案 (Files)** | `files/` + `features/files` | 檔案管理中心 |
| **工具 (Tools)** | `tools/` (16 files) | 各類輔助工具 |
| **報表 (Reports)** | `reports/tour-closing` + `finance/reports` | 結團報表、財務報表 |
| **資料庫 (Database)** | `database/` (30 files) | 資料庫管理介面 |
| **工作區 (Workspace)** | `workspace/` + `features/workspaces` | 多工作區支援 |
| **設定 (Settings)** | `settings/` (31 files) — 選單、模組、權限、工作區 | 完整系統設定 |
| **住宿 (Accommodation)** | `features/accommodation` | 住宿管理 |
| **景點 (Attractions)** | `features/attractions` | 景點資料庫 |
| **車隊 (Fleet)** | `features/fleet` | 車輛管理 |
| **交通費率** | `features/transportation-rates` | 交通費率管理 |
| **領隊 (Tour Leaders)** | `features/tour-leaders` | 領隊管理 |
| **提案 (Proposals)** | `features/proposals` | 旅遊提案 |
| **付款 (Disbursement)** | `features/disbursement` | 付款管理 |
| **公司資產** | `features/company-assets` | 資產管理 |
| **儀表板 (Dashboard)** | `features/dashboard` | 首頁儀表板 |

---

## 三、舊版有但新版需確認的功能

| 功能 | 舊版實作 | 新版對應 | 狀態 |
|------|----------|----------|------|
| **獎金設定 (Bonus Setting)** | 團詳情內 BonusSettingTab + BonusSettingForm + API `group-bonus-settings` | 未找到獨立模組 | ⚠️ 可能整合在其他模組，需確認 |
| **Fast Move（快速調團）** | API `fast-move` + `fast-move/order-detail` | `services/fastmove.service.ts` 存在 | ⚠️ 有 service 但需確認前端是否完整 |
| **利潤表 (Profit)** | 團詳情 ProfitTab + ProfitTable | 可能在 reports/tour-closing 或 finance | ⚠️ 需確認是否有等價功能 |
| **團內旅客匯入** | ImportTravellersDialog + AddTravellersDialog | features/members | ⚠️ 需確認匯入功能 |
| **團報表 (Group Report)** | GroupReportTab（團內直接看報表） | reports/tour-closing | ⚠️ 拆到獨立報表頁面 |
| **收款單批次建立** | `receipts/batch-create` 專用頁面 | finance/payments | ⚠️ 需確認是否支援批次 |
| **收款單依訂單查詢** | `receipts/by-order/[orderNumber]` | finance/payments | ⚠️ 需確認過濾功能 |
| **Max Numbers（編號管理）** | `@max-numbers` 目錄 + API `max-numbers` | 可能在 settings 或 database | ⚠️ 自動編號邏輯需確認 |

---

## 四、架構差異

| 面向 | 舊版 | 新版 |
|------|------|------|
| **框架** | Next.js + Fuse React 模板 | Next.js App Router（純自建） |
| **狀態管理** | Redux Toolkit (slices) | 無 Redux，用 React hooks + server components |
| **UI 元件** | Material UI (via Fuse) | 自建元件 + Tailwind |
| **路由** | `(control-panel)/` + `(public)/` | `(main)/` |
| **API** | `app/api/supabase/*` (14 個資源) | `app/api/*` + `services/*.service.ts` |
| **認證** | `@auth` 模組 + authRoles | middleware.ts + 自建認證 |
| **國際化** | `@i18n` + navigation-i18n (en/tw) | 需確認 |
| **程式碼量** | ~5 萬行 | ~33 萬行（6.6 倍） |
| **模組數** | 9 個頁面模組 | 30+ 頁面模組 + 35 features |

---

## 五、總結

### 新版優勢
1. **功能量是舊版的 3-4 倍**：30+ 模組 vs 9 個模組
2. **完整旅遊業務鏈**：從產品設計 → 報價 → 合約 → 確認 → 排程 → 行程 → 團操作 → 結團報表
3. **HR 系統**：出勤、請假、薪資（舊版只有員工名單）
4. **財務系統更完善**：拆分 payments/requests/travel-invoice/treasury/reports
5. **多工作區支援**
6. **旅客聊天、檔案管理、工具箱**等全新功能

### 需要注意
1. **獎金設定邏輯**：舊版有明確的 BonusSettingTab，新版需確認對應位置
2. **批次操作**：舊版的批次收款建立、旅客匯入等，新版需確認
3. **Fast Move**：舊版有完整 API，新版有 service 但前端需確認
4. **利潤計算**：舊版在團頁面直接看，新版可能在報表模組

### 結論
新版 Venturo ERP 在功能廣度和深度上已**全面超越**舊版 Corner ERP。舊版的所有核心業務功能（團、訂單、收款、請款、出納、供應商、顧客、eSIM、日曆）在新版都有對應或升級版本。標記 ⚠️ 的項目建議逐一確認細節實作。
