# LinkPay & 網卡系統：舊版 vs 新版 深度比對報告

> 分析日期：2026-02-18
> 舊版：`~/Desktop/cornerERP-master` (Corner ERP, Next.js + MUI + RTK Query)
> 新版：`~/Projects/venturo-erp` (Venturo ERP, Next.js + shadcn/ui + SWR Entity)

---

## 一、LinkPay 系統

### 舊版功能清單

1. **LinkPay 狀態管理** (`constants/linkPayStatus.ts`)
   - 4 種狀態：待付款(0)、已付款(1)、錯誤(2)、已過期(3)
   - 狀態名稱、顏色（MUI Chip）映射

2. **LinkPay 付款連結生成** (`api/supabase/linkpay/route.ts`)
   - 透過中間 API `api.cornertravel.com.tw/AuthBySupabase` 轉發
   - 傳入：receiptNo, userName, email, gender, createUser, paymentName
   - 回傳：hpp_url（付款連結）、order_number

3. **LinkPay 可展開列表** (`receipts/LinkPayExpandableRow.tsx`)
   - 在收據列表中可展開顯示 LinkPay 歷史記錄
   - 欄位：訂單編號、付款金額、截止日、付款連結（可複製）、付款名稱、狀態、建立時間
   - 業務邏輯：若已有待付款/已付款的 LinkPay，不允許新增
   - 複製連結按鈕 + snackbar 回饋

4. **建立 LinkPay Hook** (`receipts/hooks/useCreateLinkPayHandler.ts`)
   - 共用 hook：handleCreateLinkPay(receiptNumber, receiptAccount, email, onSuccess, paymentName)
   - 整合 RTK Query mutation + snackbar 錯誤處理

5. **Receipt API 整合** (`receipts/ReceiptApi.ts`)
   - LinkPayLog 型別：receiptNumber, linkpayOrderNumber, price, endDate, link, status, paymentName, 時間戳
   - Receipt 型別帶 `linkpay?: LinkPayLog[]` 關聯
   - createLinkPay mutation 自動 invalidate receipt tags

### 新版功能對應

| #   | 功能                | 狀態            | 備註                                                            |
| --- | ------------------- | --------------- | --------------------------------------------------------------- |
| 1   | LinkPay 狀態管理    | ✅ 已有         | `types/receipt.types.ts` - LinkPayStatus enum + labels + colors |
| 2   | 付款連結生成 API    | ✅ 已有且更完整 | `api/linkpay/route.ts` - 直接呼叫台新銀行 API，不再透過中間層   |
| 3   | LinkPay 列表顯示    | 🟡 部分有       | PaymentItemRow 中有 LinkPay 欄位，但沒有獨立的展開式歷史列表    |
| 4   | 建立 LinkPay 功能   | ✅ 已有         | PaymentItemRow 內的「產生連結」按鈕                             |
| 5   | LinkPay 記錄 Entity | ✅ 已有         | `data/entities/linkpay-logs.ts` - 完整 CRUD                     |

### 新版額外功能（舊版沒有的）

1. **Webhook 自動回調** (`api/linkpay/webhook/route.ts`)
   - 台新銀行付款完成後自動通知
   - MAC 簽名驗證（HMAC-SHA256）防止偽造
   - 金額一致性驗證（防竄改，容許 0.5% 誤差）
   - 自動回填實收金額、扣除 2% 手續費
   - 保持「待確認」讓會計手動最終確認

2. **簽名驗證模組** (`lib/linkpay/signature.ts`)
   - calculateMAC: 參數按字母排序 + HMAC-SHA256
   - verifyWebhookSignature: timingSafeEqual 防計時攻擊
   - verifySourceIP: IP 白名單（預留）

3. **直接呼叫台新銀行 API**
   - 舊版透過 `api.cornertravel.com.tw` 中間層轉發
   - 新版直接呼叫 `tspg.taishinbank.com.tw/tspglinkpay/restapi/auth.ashx`
   - 完整的台新 API 請求格式（mid, tid, pay_type, tx_type, params）

4. **Rate Limiting** - 10 requests/min

5. **收款單直接存付款連結** - receipts 表有 `link` 和 `linkpay_order_number` 欄位

6. **LinkPay 自動帶入預設值** - 切換到 LinkPay 時自動填入截止日(+7天)、Email、收款對象、付款名稱

7. **收款方式型別完整** - ReceiptType enum: 匯款/現金/刷卡/支票/LinkPay，payment_method 字串對應

### 差異分析

- **舊版有但新版需確認的**：
  - 獨立的 LinkPay 歷史展開列表（`LinkPayExpandableRow`）- 新版在 PaymentItemRow 中處理，但可能沒有完整的歷史列表視圖
  - 「已有待付款/已付款則不允許新增」的業務規則 - 需確認新版是否實作

- **新版大幅改進的**：
  - ✅ 直接對接台新銀行（去掉中間 API 層）
  - ✅ Webhook 自動回調 + MAC 簽名驗證
  - ✅ 金額防竄改驗證
  - ✅ Rate Limiting
  - ✅ 完整的型別系統（enum + labels + colors）
  - ✅ 自動帶入預設值

- **需要補的**：
  - 🔴 收款單詳情頁面的 LinkPay 歷史記錄展示（類似舊版展開式列表）
  - 🟡 防止重複建立 LinkPay 的業務規則

---

## 二、網卡（eSIM）系統

### 舊版功能清單

1. **eSIM 資料模型** (`esims/EsimApi.ts`, `models/EsimModels.ts`)
   - 欄位：esimNumber, groupCode, orderNumber, supplierOrderNumber, status, productId, quantity, email, note, 時間戳
   - 3 種狀態：待確認(0)、已確認(1)、錯誤(2)

2. **eSIM 列表頁面** (`esims/Esims.tsx`, `EsimsTable.tsx`, `EsimsHeader.tsx`)
   - Material React Table 表格
   - 欄位：網卡單號(可點擊)、團號、團名、訂單編號、供應商訂單編號、商品Id、數量、信箱、狀態
   - 搜尋參數持久化到 localStorage
   - 關聯 Groups 查詢團名

3. **詳細搜尋** (`components/EsimSearchDialog.tsx`)
   - 搜尋欄位：網卡單號、團號、訂單編號、供應商訂單編號、商品Id、信箱、狀態
   - 重設 + 搜尋功能

4. **新增網卡對話框** (`components/EsimDialog.tsx`)
   - Yup 驗證：groupCode 必填、productId 必填、quantity 1-9、email 必填
   - 表單欄位：網卡單號、團號、訂單編號、供應商訂單編號、商品Id、數量、信箱、狀態

5. **網卡詳情頁面** (`[esimNumber]/Esim.tsx`, `EsimHeader.tsx`)
   - 支援新增(`/esims/new`)和編輯模式
   - React Hook Form + Yup 驗證
   - BasicInfoTab 顯示詳細資訊

6. **新增時自動下單 FastMove** (`[esimNumber]/EsimHeader.tsx`)
   - 建立 eSIM 後自動呼叫 FastMove POST API
   - 自動生成編號：`E{groupCode}{2位數序號}` (via maxNumberGetDbNumber)
   - 自動生成請款單號：`I{groupCode}{2位數序號}`
   - 傳入：email, productId, quantity, price, groupCode, orderNumber, createdBy, invoiceNumber, esimNumber

7. **FastMove API 整合** (`api/supabase/fast-move/`)
   - GET: 取得產品列表 (`api.cornertravel.com.tw/FastMove`)
   - POST: 建立訂單（傳 query params）
   - POST order-detail: 查詢訂單詳情 (`FastMove/QueryOrder?orderNumber=xxx`)
   - 完整型別定義：FastMoveProduct, FastMoveOrderRequest/Response, FastMoveOrderDetail, FastMoveOrderUsage

8. **供應商訂單詳情對話框** (`components/OrderDetailDialog.tsx`)
   - 顯示：訂單編號、訂購日期
   - 商品明細表格：產品名稱、兌換碼、起始/截止時間、使用量(MB/GB)、狀態
   - 使用量格式化（bytes → MB/GB）
   - 時間戳格式化

9. **eSIM 字典 Hook** (`hooks/useEsimDictionary.ts`)
   - 建立 esimNumber → `{esimNumber} ({groupCode})` 的映射字典

### 新版功能對應

| #   | 功能              | 狀態          | 備註                                                              |
| --- | ----------------- | ------------- | ----------------------------------------------------------------- |
| 1   | eSIM 資料模型     | ✅ 已有       | `types/esim.types.ts` - 新增 price 欄位、完整型別                 |
| 2   | eSIM 列表頁面     | ✅ 已有       | `app/(main)/esims/page.tsx`                                       |
| 3   | 詳細搜尋          | ✅ 已有       | `features/esims/components/EsimSearchDialog.tsx`                  |
| 4   | 新增網卡對話框    | ✅ 已有且更強 | `features/esims/components/EsimCreateDialog.tsx` - 批次新增       |
| 5   | 網卡詳情頁面      | 🟡 需確認     | 可能用對話框取代獨立頁面                                          |
| 6   | FastMove 自動下單 | ✅ 已有       | EsimCreateDialog 中整合                                           |
| 7   | FastMove API 整合 | 🟡 部分有     | `services/fastmove.service.ts` - 但使用 mock 資料，API 未真正串接 |
| 8   | 供應商訂單詳情    | 🔴 缺少       | 沒有 OrderDetailDialog（查看兌換碼、使用量、到期日等）            |
| 9   | eSIM 字典 Hook    | ✅ 已有       | `data/entities/esims.ts` - useDictionary                          |

### 新版額外功能（舊版沒有的）

1. **批次新增網卡**
   - 可一次新增多筆 eSIM（新增/移除項目）
   - 每筆可選不同地區、產品、數量、Email

2. **自動建立網卡專用團**
   - `tourService.getOrCreateEsimTour()` - 自動建立 `ESIM-{year}` 團
   - 對話框開啟時自動選中

3. **自動建立訂單**
   - 如果沒有選訂單或選「+ 新增訂單」
   - 自動生成訂單編號：`{團號}-O{2位數}`

4. **產品地區篩選**
   - PRODUCT_REGIONS: 日本、韓國、泰國、越南、新加坡、馬來西亞

5. **Entity Hook 架構** - 統一的 CRUD + cache 管理

### 差異分析

- **舊版有但新版沒有的**：
  - 🔴 **供應商訂單詳情對話框** (OrderDetailDialog) - 查看兌換碼、使用量、到期日、eSIM 狀態
  - 🔴 **FastMove 查詢訂單 API** (`FastMove/QueryOrder`) - 新版 fastmove.service 有 getOrderStatus 但用的是 mock URL
  - 🟡 **FastMove API 真實串接** - 新版 fastmove.service 的 base URL 指向 `fastmove.com`，而非舊版的 `api.cornertravel.com.tw/FastMove`
  - 🟡 **獨立的網卡詳情頁面** - 舊版有 `/esims/{esimNumber}` 頁面可編輯，新版可能只有對話框

- **新版改進的**：
  - ✅ 批次新增網卡（一次多筆）
  - ✅ 自動建立網卡專用團 + 訂單
  - ✅ 地區篩選
  - ✅ Entity 架構統一管理
  - ✅ price 欄位（舊版無）

- **需要補的（優先級排序）**：
  1. 🔴 **FastMove API 真實串接** - 目前用 mock 資料，需要：
     - 改 base URL 為 `api.cornertravel.com.tw/FastMove`
     - GET 產品列表
     - POST 建立訂單（query params 格式）
     - POST QueryOrder 查詢訂單詳情
  2. 🔴 **供應商訂單詳情對話框** - 查看兌換碼、使用量、到期日
  3. 🟡 **網卡編輯功能** - 修改已建立的網卡資訊
  4. 🟡 **eSIM 狀態更新** - 根據 FastMove 查詢結果更新狀態

---

## 三、總結

### LinkPay：新版已超越舊版 ✅

新版 LinkPay 系統已大幅超越舊版：直接對接台新銀行、Webhook 自動回調、MAC 簽名驗證、金額防竄改。主要缺的是收款單詳情頁的 LinkPay 歷史展示。

### 網卡系統：新版架構更好，但 API 串接未完成 🟡

新版架構設計更好（批次新增、自動建團/建單），但 FastMove API 還在用 mock 資料，且缺少供應商訂單詳情對話框。**需要優先完成 FastMove 真實 API 串接**才能上線使用。

### 下一步行動

1. FastMove API 串接（改 URL + 測試）
2. 建立 OrderDetailDialog（兌換碼、使用量查看）
3. 收款單 LinkPay 歷史展示
4. 網卡編輯功能
