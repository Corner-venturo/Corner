# 會計模組審計報告

**審計日期**: 2025-02-01  
**審計範圍**: `/accounting` 個人記帳模組、`/erp-accounting` 企業會計模組

---

## 📋 模組概覽

系統包含兩個會計相關模組：

| 模組     | 路徑              | 用途               |
| -------- | ----------------- | ------------------ |
| 個人記帳 | `/accounting`     | 員工個人收支管理   |
| ERP 會計 | `/erp-accounting` | 企業級複式簿記系統 |

---

## ✅ 已完成功能

### 1. 個人記帳模組 (`/accounting`)

- ✅ 快速記帳（手機版）
- ✅ 新增收入/支出記錄
- ✅ 帳戶管理（現金、銀行、信用卡等）
- ✅ 分類管理（支援新增自訂分類）
- ✅ 今日交易列表
- ✅ 本月統計（收入/支出/淨值）
- ✅ 帳戶餘額自動計算（使用 RPC atomic transaction）

### 2. ERP 會計模組 (`/erp-accounting`)

#### 傳票功能

- ✅ 傳票列表顯示
- ✅ 傳票狀態管理（草稿/已過帳/已反沖/已鎖定）
- ✅ 傳票明細檢視（含分錄）
- ✅ 傳票反沖功能
- ✅ 借貸平衡檢查

#### 自動過帳

- ✅ 客戶收款過帳（現金/匯款/刷卡含手續費處理）
- ✅ 供應商付款過帳
- ✅ 結團過帳（含行政費、稅金、獎金分錄）
- ✅ 傳票編號自動生成（JV + 年月 + 流水號）

#### 報表功能

- ✅ 總帳報表（General Ledger）
- ✅ 試算表（Trial Balance）
- ✅ 損益表（Income Statement）
- ✅ 資產負債表（Balance Sheet）
- ✅ 現金流量表（Cash Flow Statement）
- ✅ 報表匯出 CSV

#### 期末結算

- ✅ 月/季/年結預覽
- ✅ 損益科目餘額結轉
- ✅ 結轉歷史記錄
- ✅ 重複結轉防護

#### 設定

- ✅ 會計科目管理 (`/erp-accounting/settings/accounts`)
- ✅ 銀行帳戶管理 (`/erp-accounting/settings/banks`)

---

## ⚠️ 發現的問題

### 🔴 高優先級

#### 1. 個人記帳：交易編輯功能不完整

**位置**: `src/app/(main)/accounting/page.tsx`

```tsx
<Button variant="ghost" size="iconSm">
  <Edit3 size={16} /> // 僅有圖標，無實際功能
</Button>
```

**問題**: 編輯按鈕存在但未綁定任何事件處理函數  
**建議**: 實作 `EditTransactionDialog` 並綁定到編輯按鈕

#### 2. 個人記帳：交易刪除功能缺失

**位置**: `src/stores/accounting-store.ts`

```typescript
deleteTransaction: async id => {
  // Note: Deleting a transaction should also be an RPC to revert balance changes.
  const { error } = await supabase
    .from('accounting_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  // 餘額回滾邏輯未實作
}
```

**問題**: 刪除交易時未使用 RPC 來回滾帳戶餘額，可能導致餘額不一致  
**建議**: 建立 `delete_atomic_transaction` RPC 函數

#### 3. 個人記帳：交易更新未原子化

**位置**: `src/stores/accounting-store.ts`  
**問題**: `updateTransaction` 直接更新資料表，未考慮餘額調整  
**建議**: 建立 `update_atomic_transaction` RPC 函數

### 🟡 中優先級

#### 4. 期末結轉：保留盈餘科目未實作

**位置**: `src/features/accounting/hooks/usePeriodClosing.ts`

```typescript
// 本期損益科目（需要有保留盈餘科目）
// 這裡簡化處理，直接用差額表示
// 實際應用中應該轉入「保留盈餘」或「本期損益」科目
```

**問題**: 期末結轉未將淨利/淨損轉入保留盈餘科目  
**建議**: 在結轉分錄中加入保留盈餘（3XXX 科目）的借/貸方

#### 5. 現金流量表：分類過於簡化

**位置**: `src/features/accounting/hooks/useAccountingReports.ts`

```typescript
// 簡化版：將所有現金變動歸類為營業活動
// 完整版應根據對應科目分類
```

**問題**: 所有現金變動都歸類為營業活動，缺少投資/融資分類  
**建議**: 根據對應科目類型自動分類（如固定資產相關 → 投資活動）

#### 6. 帳戶管理：缺少編輯功能

**位置**: `src/components/accounting/accounts-management-dialog.tsx`  
**問題**: 帳戶管理對話框有刪除按鈕但無編輯按鈕  
**建議**: 加入編輯帳戶功能

#### 7. 損益表報表：useEffect 依賴警告

**位置**: `src/features/accounting/components/reports/IncomeStatementReport.tsx`

```typescript
useEffect(() => {
  if (startDate && endDate) {
    handleSearch()
  }
}, []) // 缺少 handleSearch 依賴
```

**建議**: 加入正確的依賴陣列或使用 `useCallback`

### 🟢 低優先級

#### 8. 科目表：缺少權益科目

**位置**: `src/types/accounting.types.ts`

```typescript
export const DEFAULT_ACCOUNTS = [
  // 無權益類科目（3XXX）
]
```

**問題**: 預設科目表缺少股本、保留盈餘等權益科目  
**建議**: 加入 `3100 股本`、`3200 保留盈餘`、`3300 本期損益` 等科目

#### 9. 傳票頁面：缺少新增傳票功能

**位置**: `src/features/erp-accounting/components/VouchersPage.tsx`  
**問題**: 目前只能查看和反沖傳票，無法手動新增傳票  
**建議**: 加入「新增傳票」按鈕及對話框

#### 10. ReverseVoucherDialog：API 路徑不一致

**位置**: `src/features/erp-accounting/components/ReverseVoucherDialog.tsx`

```typescript
const response = await fetch('/api/accounting/reverse', {
  body: JSON.stringify({
    workspace_id: user.workspace_id, // 實際上 API 從 session 取得
    user_id: user.id, // 同上
    voucher_id: voucher.id,
    reason: reason.trim(),
  }),
})
```

**問題**: 前端傳送 `workspace_id` 和 `user_id`，但後端從 session 取得，造成冗餘  
**建議**: 前端只需傳送 `voucher_id` 和 `reason`

---

## 📊 功能完整度評估

| 功能區塊            | 完成度 | 備註                    |
| ------------------- | ------ | ----------------------- |
| 個人記帳 - 新增     | 100%   | ✅ 完整                 |
| 個人記帳 - 編輯     | 20%    | ⚠️ UI 存在，功能未實作  |
| 個人記帳 - 刪除     | 50%    | ⚠️ 功能存在但餘額未回滾 |
| 個人記帳 - 分類管理 | 90%    | 🔧 缺少編輯分類         |
| 傳票管理            | 80%    | 🔧 缺少新增傳票         |
| 自動過帳            | 95%    | ✅ 幾乎完整             |
| 會計報表            | 85%    | 🔧 現金流量分類簡化     |
| 期末結轉            | 75%    | ⚠️ 保留盈餘未實作       |
| 會計科目設定        | 90%    | 🔧 缺少權益科目         |

---

## 🔧 建議優化事項

### 短期（1-2 週）

1. 實作個人記帳的編輯/刪除功能
2. 建立 `delete_atomic_transaction` 和 `update_atomic_transaction` RPC
3. 新增保留盈餘科目並修正期末結轉邏輯

### 中期（1 個月）

4. 實作手動新增傳票功能
5. 優化現金流量表分類邏輯
6. 加入帳戶編輯功能

### 長期

7. 加入傳票審批流程
8. 實作多幣別支援
9. 加入會計期間鎖定功能

---

## 📁 相關檔案清單

```
src/app/(main)/accounting/
├── layout.tsx
└── page.tsx                          # 個人記帳主頁

src/app/(main)/erp-accounting/
├── layout.tsx
├── page.tsx                          # ERP 會計首頁
├── vouchers/page.tsx                 # 傳票列表
├── period-closing/page.tsx           # 期末結轉
├── reports/
│   ├── page.tsx                      # 報表中心
│   ├── general-ledger/page.tsx
│   ├── trial-balance/page.tsx
│   ├── income-statement/page.tsx
│   ├── balance-sheet/page.tsx
│   └── cash-flow/page.tsx
└── settings/
    ├── accounts/page.tsx             # 會計科目設定
    └── banks/page.tsx                # 銀行帳戶設定

src/features/accounting/
├── components/
│   ├── PeriodEndClosing.tsx
│   └── reports/
│       ├── IncomeStatementReport.tsx
│       ├── GeneralLedgerReport.tsx
│       ├── TrialBalanceReport.tsx
│       ├── BalanceSheetReport.tsx
│       └── CashFlowStatementReport.tsx
└── hooks/
    ├── usePeriodClosing.ts
    └── useAccountingReports.ts

src/features/erp-accounting/
├── components/
│   ├── VouchersPage.tsx
│   ├── VoucherDetailDialog.tsx
│   ├── ReverseVoucherDialog.tsx
│   ├── AccountDialog.tsx
│   ├── AccountsPage.tsx
│   ├── BankAccountDialog.tsx
│   └── BankAccountsPage.tsx
├── hooks/index.ts                    # createCloudHook 包裝
└── services/
    └── posting-service.ts            # 過帳服務

src/stores/accounting-store.ts        # 個人記帳 Zustand Store
src/types/accounting.types.ts         # 會計類型定義

src/app/api/accounting/
├── post/
│   ├── customer-receipt/route.ts
│   ├── supplier-payment/route.ts
│   └── group-settlement/route.ts
└── reverse/route.ts
```

---

**審計人**: Claude (AI Assistant)  
**審計工具**: 程式碼靜態分析
