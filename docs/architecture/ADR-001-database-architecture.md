# ADR-001: 單一 Supabase 資料庫架構（ERP + Online 共用）

## 狀態：Accepted

## 背景

Venturo 有兩個產品面向：
1. **ERP 系統**（內部管理）— 團管理、訂單、收款、請款、報價等
2. **Online 系統**（客戶面向）— 行程瀏覽、線上報名、訂單查詢等

初期需要快速迭代，團隊規模小（1-2 人開發），需要決定資料庫架構策略。

## 決策

使用 **單一 Supabase 專案**，ERP 和 Online 共用同一個 PostgreSQL 資料庫。

- 專案 ID: `pfqvdacxowpgfamuvnsn`
- 所有表格都在同一個 schema 中
- 透過 RLS（Row Level Security）和 workspace_id 做資料隔離
- ERP 使用 service_role 或 authenticated + RLS
- Online 使用 anon key + 嚴格 RLS

## 理由

1. **開發效率**：不需要維護資料同步機制，ERP 寫入後 Online 立即可見
2. **資料一致性**：單一真相源，不存在 ERP 和 Online 資料不一致的問題
3. **成本考量**：Supabase 免費/Pro 方案足以支撐初期流量
4. **團隊規模**：1-2 人團隊維護兩套 DB 的 overhead 太大
5. **Supabase 生態**：內建 Auth、RLS、Realtime、Storage，減少基礎設施管理

## 後果

### 正面
- 開發速度快，新功能可以同時影響 ERP 和 Online
- 不需要寫 sync service 或 event-driven 同步
- 單一帳單，成本透明

### 負面
- ERP 和 Online 的負載互相影響（未來可能需要 read replica）
- Schema 變更需要同時考慮兩個系統的影響
- RLS 策略複雜度較高（需要區分 ERP 和 Online 的存取權限）
- 如果未來需要拆分，migration 成本較高

### 風險緩解
- 透過 RLS 嚴格隔離不同角色的存取範圍
- 監控 DB 效能，當 QPS 超過閾值時考慮 read replica
- 保持 schema 設計的模組化，方便未來拆分
