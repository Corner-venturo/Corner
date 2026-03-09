# 孤兒記錄檢查報告

執行時間: 2026-03-09 06:42:17
目的: 檢查 P0 優先級的欄位是否有指向不存在的記錄

---

## 檢查清單（P0 優先級）

檢查 12 個欄位的資料完整性...

### payment_request_items.supplier_id → suppliers.id

jq: error (at <stdin>:1): Cannot index object with number
