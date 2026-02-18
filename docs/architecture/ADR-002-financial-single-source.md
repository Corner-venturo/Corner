# ADR-002: 財務統計走 Recalculate 函數（Single Source of Truth）

## 狀態：Accepted

## 背景

ERP 系統有多個財務相關的統計欄位：
- 訂單：`paid_amount`、`remaining_amount`、`payment_status`
- 團：`total_revenue`、`total_cost`、`profit`、`current_participants`

這些統計欄位可能在多個地方被異動：收款建立、收款確認、收款刪除、請款審核等。
如果允許各處自行計算和更新，很容易造成數據不一致（例如收款被刪除但訂單的 paid_amount 沒有更新）。

## 決策

所有財務統計欄位都透過 **專用的 recalculate 函數** 從原始資料重新計算，不允許手動修改。

核心函數：
- `recalculateReceiptStats(orderId, tourId)` — 重算收款相關統計（paid_amount、payment_status、total_revenue、profit）
- `recalculateExpenseStats(tourId)` — 重算請款相關統計（total_cost、profit）
- `recalculateParticipants(tourId)` — 重算團員人數（current_participants）

規則：
1. 任何收款異動後，必須呼叫 `recalculateReceiptStats`
2. 任何請款異動後，必須呼叫 `recalculateExpenseStats`
3. 任何團員異動後，必須呼叫 `recalculateParticipants`
4. **不允許**直接 UPDATE 這些統計欄位

## 理由

1. **資料一致性**：每次重算都從原始資料（receipts、payment_request_items、order_members）出發，確保統計結果正確
2. **除錯容易**：如果統計不對，只要重跑 recalculate 就能修復，不需要追溯哪個地方算錯
3. **容錯性**：即使某次操作中途失敗，下一次 recalculate 會修正數據
4. **簡單性**：開發者不需要在每個異動點自行計算增減量，只要呼叫 recalculate

## 後果

### 正面
- 統計數據永遠正確（只要原始資料正確）
- 新增異動場景時不需要額外計算邏輯，只要呼叫 recalculate
- 可以寫排程 job 定期 recalculate 所有團的統計作為 safety net

### 負面
- 每次異動都要重查原始資料，效能略差（目前規模可接受）
- 如果忘記呼叫 recalculate，統計會暫時不一致（直到下次呼叫）
- 大團（100+ 筆收款）的重算可能較慢

### 未來優化
- 可以加 DB trigger 自動觸發 recalculate（但會增加 DB 複雜度）
- 大規模資料可以改用 DB 的 materialized view
