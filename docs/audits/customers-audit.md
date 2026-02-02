# 顧客管理模組審計報告

> 審計日期：2025-02-03  
> 審計範圍：`src/app/(main)/customers/`

---

## 1. 顧客列表 (`page.tsx`)

### 🔴 嚴重問題

#### 1.1 類型強轉導致類型安全喪失
```typescript
// Line 264-265, 273
updateCustomer as unknown as (id: string, data: Partial<Customer>) => Promise<void>
addCustomer as (data: Partial<Customer>) => Promise<Customer>
```
- **問題**：使用 `as unknown as` 繞過 TypeScript 類型檢查
- **影響**：編譯時無法檢測參數錯誤，可能在執行時出錯
- **建議**：修正 `CustomerAddDialog` 和 `CustomerVerifyDialog` 的 props 類型定義，使其與實際 API 一致

#### 1.2 ResetPasswordDialog 未連接觸發邏輯
```typescript
// Line 290-294
<ResetPasswordDialog
  open={isResetPasswordDialogOpen}
  onOpenChange={setIsResetPasswordDialogOpen}
  customer={selectedCustomer}
/>
```
- **問題**：對話框已渲染，但沒有任何地方可以設置 `isResetPasswordDialogOpen = true`
- **影響**：功能完全無法使用
- **建議**：在 `CustomerDetailDialog` 或表格操作中添加「重置密碼」按鈕

### 🟡 中等問題

#### 1.3 背景任務錯誤被靜默忽略
```typescript
// Line 80-86
void (async () => {
  await supabase.from('customers').update(...)
  await syncPassportImageToMembers(...)
})()
```
- **問題**：背景同步任務失敗時，用戶不會收到通知
- **建議**：添加錯誤追蹤或 toast 通知

#### 1.4 搜尋條件持久化可能造成困惑
```typescript
// useCustomerSearch.ts Line 14-18
const [searchParams, setSearchParams] = useState<CustomerSearchParams>(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  }
})
```
- **問題**：用戶重新開啟頁面時，舊的搜尋條件仍會套用，可能造成「資料消失」的錯覺
- **建議**：加入提示或改為 sessionStorage

### 🟢 建議改進

#### 1.5 缺少批量操作功能
- 無法批量驗證多位顧客
- 無法批量刪除顧客
- 無法批量匯出顧客資料

#### 1.6 缺少顧客統計資訊
- 建議在頁面頂部顯示：總顧客數、待驗證數、VIP 數量等

---

## 2. 顧客詳情 (`CustomerDetailDialog.tsx`)

### 🟡 中等問題

#### 2.1 缺少關聯資訊顯示
- **問題**：顧客詳情頁沒有顯示該顧客的訂單歷史
- **建議**：添加訂單歷史分頁或區塊

#### 2.2 缺少重置密碼入口
- **問題**：沒有「重置密碼」按鈕，但 `ResetPasswordDialog` 已實作
- **建議**：在詳情對話框添加重置密碼按鈕（需判斷是否有 email）

### 🟢 建議改進

#### 2.3 護照照片顯示優化
- 建議添加點擊放大功能
- 建議支援下載護照照片

---

## 3. 顧客驗證 (`CustomerVerifyDialog.tsx`)

### 🟡 中等問題

#### 3.1 OCR 辨識結果未提供比對提示
- **問題**：OCR 辨識後直接覆蓋表單，用戶不知道哪些欄位有變更
- **建議**：高亮顯示與原始資料不同的欄位

#### 3.2 圖片編輯器存檔邏輯不完整
```typescript
// Line 135-137
const handleEditorSave = (settings: ImageEditorSettings) => {
  logger.log('ImageEditor settings saved:', settings)
}
```
- **問題**：`onSave` 只記錄 log，沒有實際保存設定
- **建議**：如不需要此功能，移除 `showAi={false}` 或統一 callback

---

## 4. 護照上傳 (`usePassportUpload.ts`)

### 🟡 中等問題

#### 4.1 批次處理可能導致部分失敗
- **問題**：批次上傳中，若某張護照處理失敗，已上傳的圖片可能殘留在 storage
- **建議**：考慮使用 transaction 或 cleanup 機制

#### 4.2 簡繁轉換表不完整
```typescript
// Line 35-90
const SIMPLIFIED_TO_TRADITIONAL: Record<string, string> = {...}
```
- **問題**：只包含常用姓氏和名字用字，可能遺漏
- **建議**：考慮使用完整的簡繁轉換庫如 `opencc-js`

### 🟢 建議改進

#### 4.3 進度指示器
- 批次上傳時只顯示「辨識中...」，建議顯示進度（1/5, 2/5...）

---

## 5. 公司管理 (`companies/`)

### 🔴 嚴重問題

#### 5.1 缺少刪除功能
- **問題**：企業客戶表格和詳情頁都沒有刪除選項
- **影響**：無法移除錯誤建立的企業客戶
- **建議**：添加刪除功能，並檢查是否有關聯訂單

### 🟡 中等問題

#### 5.2 缺少聯絡人管理
- **問題**：`CompanyDetailDialog` 提到「含聯絡人」但沒有實際實作
- **建議**：實作或移除註解

#### 5.3 缺少分頁
- **問題**：企業客戶列表沒有分頁
- **影響**：當企業客戶數量大時，效能問題
- **建議**：使用 `useCompaniesPaginated`

### 🟢 建議改進

#### 5.4 缺少搜尋功能的高級篩選
- 目前只有簡單文字搜尋，建議加入：
  - VIP 等級篩選
  - 付款方式篩選
  - 信用額度範圍篩選

---

## 6. 資料關聯

### 🟡 中等問題

#### 6.1 顧客與訂單的雙向導航不完整
```typescript
// page.tsx Line 93-116
// 刪除時有檢查訂單關聯，但...
```
- **問題**：無法從顧客詳情頁直接查看該顧客的所有訂單
- **建議**：在 `CustomerDetailDialog` 添加「訂單歷史」區塊

#### 6.2 顧客與報價單關聯未實作
- **問題**：`quote.types.ts` 定義了 `customer_id`，但顧客頁沒有顯示相關報價單
- **建議**：在顧客詳情頁添加「報價單」區塊

#### 6.3 顧客與收款紀錄關聯
- **問題**：`receipt.types.ts` 中有 `customer_id`，但顧客頁沒有顯示收款歷史
- **建議**：在顧客詳情頁添加「收款紀錄」區塊

---

## 7. 新增顧客 (`CustomerAddDialog.tsx`)

### 🟢 建議改進

#### 7.1 缺少載入指示器
- 手動新增顧客時，按鈕沒有 loading 狀態
- 建議添加 `isSubmitting` 狀態

#### 7.2 表單驗證不足
- 只檢查姓名和電話是否為空
- 建議添加：
  - 電話格式驗證
  - Email 格式驗證
  - 護照號碼格式驗證
  - 身分證字號驗證

---

## 8. 架構與程式碼品質

### 🟡 中等問題

#### 8.1 重複的類型定義
- `customer-page.types.ts` 定義的 props 類型與實際組件不一致
- 例如：`CustomerVerifyDialogProps` 定義了 `onClose` 但組件使用 `onOpenChange`

#### 8.2 混合使用 i18n 和硬編碼文字
```typescript
// CustomerVerifyDialog.tsx 使用 useTranslations
// CustomerDetailDialog.tsx 使用硬編碼中文
```
- **建議**：統一使用 i18n

### 🟢 建議改進

#### 8.3 REFACTORING_PLAN.md 存在
- 目錄中有 `REFACTORING_PLAN.md`，建議檢查是否有未完成的重構項目

---

## 優先處理清單

| 優先級 | 問題 | 位置 |
|--------|------|------|
| P0 | ResetPasswordDialog 無法觸發 | `page.tsx` |
| P0 | 企業客戶缺少刪除功能 | `companies/page.tsx` |
| P1 | 類型強轉導致類型安全喪失 | `page.tsx` Line 264-273 |
| P1 | 顧客詳情缺少訂單歷史 | `CustomerDetailDialog.tsx` |
| P2 | 搜尋條件持久化困惑 | `useCustomerSearch.ts` |
| P2 | 企業客戶缺少分頁 | `companies/page.tsx` |
| P3 | 混合 i18n 和硬編碼 | 多處 |
| P3 | 表單驗證不足 | `CustomerAddDialog.tsx` |

---

## 附錄：檔案清單

```
src/app/(main)/customers/
├── page.tsx                          # 顧客列表主頁
├── REFACTORING_PLAN.md               # 重構計畫（待檢查）
├── types/
│   └── customer-page.types.ts        # 頁面類型定義
├── hooks/
│   ├── index.ts
│   ├── useCustomerSearch.ts          # 搜尋邏輯
│   ├── useCustomerVerify.ts          # 驗證邏輯
│   └── usePassportUpload.ts          # 護照上傳
├── components/
│   ├── index.ts
│   ├── CustomerAddDialog.tsx         # 新增顧客
│   ├── CustomerDetailDialog.tsx      # 顧客詳情
│   ├── CustomerVerifyDialog.tsx      # 驗證/編輯
│   └── ResetPasswordDialog.tsx       # 重置密碼
└── companies/
    ├── page.tsx                      # 企業客戶主頁
    └── components/
        ├── CompanyFormDialog.tsx     # 新增/編輯企業
        ├── CompanyDetailDialog.tsx   # 企業詳情
        └── CompanyTableColumns.tsx   # 表格欄位配置
```
