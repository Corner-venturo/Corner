# 會計科目代碼對應表

> 整合日期：2025-01-18

## 背景

系統存在兩套科目表：
- `accounting_subjects` — 舊版，被 `voucher-auto-generator.ts` 使用
- `chart_of_accounts` — ERP 主版，被 `posting-service.ts` 和報表模組使用

## 科目代碼對應表

| 原科目代碼 | 原科目名稱 | 新科目代碼 | 新科目名稱 | 備註 |
|-----------|-----------|-----------|-----------|------|
| **資產類** |
| 1101 | 現金 | 1110 | 現金 | |
| 1102 | 銀行存款 | 1100 | 銀行存款 | |
| 110201 | 中國信託 | 1100 | 銀行存款 | 透過 bank_accounts 關聯 |
| 110202 | 台灣銀行 | 1100 | 銀行存款 | 透過 bank_accounts 關聯 |
| 110203 | 玉山銀行 | 1100 | 銀行存款 | 透過 bank_accounts 關聯 |
| 110204 | 國泰世華 | 1100 | 銀行存款 | 透過 bank_accounts 關聯 |
| 110205 | 第一銀行 | 1100 | 銀行存款 | 透過 bank_accounts 關聯 |
| 110206 | 台新銀行 | 1100 | 銀行存款 | 透過 bank_accounts 關聯 |
| 1104 | 預付團務成本 | 1200 | 預付團務成本 | |
| 110401 | 預付刷卡成本 | 1200 | 預付團務成本 | 合併 |
| **負債類** |
| 2102 | 預收團款 | 2100 | 預收團款 | |
| 2103 | 代收稅金 | 2200 | 代收稅金（應付） | |
| 2104 | 應付獎金 | 2300 | 獎金應付帳款 | |
| **收入類** |
| 4101 | 團費收入 | 4100 | 團費收入 | |
| 4102 | 其他收入 | 4200 | 其他收入－行政費收入 | 合併 |
| 4103 | 刷卡回饋 | 4200 | 其他收入－行政費收入 | 合併 |
| 4104 | 行政費收入 | 4200 | 其他收入－行政費收入 | |
| **成本/費用類** |
| 5101 | 旅遊成本-交通 | 5100 | 團務成本 | 合併至單一成本科目 |
| 5102 | 旅遊成本-住宿 | 5100 | 團務成本 | |
| 5103 | 旅遊成本-餐飲 | 5100 | 團務成本 | |
| 5104 | 旅遊成本-門票 | 5100 | 團務成本 | |
| 5105 | 旅遊成本-保險 | 5100 | 團務成本 | |
| 5106 | 旅遊成本-其他 | 5100 | 團務成本 | |
| 5107 | 刷卡成本 | 6100 | 刷卡手續費費用 | |
| 6105 | 獎金支出 | 5130/5140/5150 | 團務成本-獎金 | 依類型分 |

## 決策

由於 `chart_of_accounts` 是更精簡的科目體系，且已被 ERP 會計模組使用，
決定：
1. **保留 `chart_of_accounts` 為主版**
2. **修改 `voucher-auto-generator.ts` 改用 `chart_of_accounts`**
3. **標記 `accounting_subjects` 為 deprecated**

## 相關檔案

### 需要修改
- `src/services/voucher-auto-generator.ts` — 改用 chart_of_accounts
- `src/data/entities/accounting-subjects.ts` — 標記 deprecated
- `src/lib/db/schemas.ts` — 移除或標記 deprecated

### 已使用 chart_of_accounts（不需修改）
- `src/features/erp-accounting/hooks/index.ts`
- `src/features/erp-accounting/services/posting-service.ts`
- `src/features/erp-accounting/components/VoucherDetailDialog.tsx`
- `src/features/accounting/hooks/useAccountingReports.ts`
- `src/features/accounting/hooks/usePeriodClosing.ts`
- `src/features/accounting/components/reports/GeneralLedgerReport.tsx`
