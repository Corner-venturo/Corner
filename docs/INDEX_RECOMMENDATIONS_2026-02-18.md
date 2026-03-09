# Index 審查建議 — 2026-02-18

## 審查範圍

12 張核心表：tours, orders, order_members, receipts, payment_requests, itineraries, itinerary_days, itinerary_items, customers, messages, driver_tasks, quotes

## 發現的問題

### 🔴 嚴重：driver_tasks 幾乎沒有 index

`driver_tasks` 只有 pkey，完全缺少多租戶、查詢、排序 index。

### 🟡 中等：部分表缺少 created_at / tour_id index

### 🟢 重複 index（可考慮清理）

| 表              | 重複 index                                                         | 說明     |
| --------------- | ------------------------------------------------------------------ | -------- |
| itineraries     | `idx_itineraries_tour_id` + `itineraries_tour_id_idx`              | 完全重複 |
| itineraries     | `idx_itineraries_created_by` + `itineraries_created_by_idx`        | 完全重複 |
| itinerary_days  | `idx_itinerary_days_itinerary` + `idx_itinerary_days_itinerary_id` | 完全重複 |
| itinerary_items | `idx_itinerary_items_day` + `idx_itinerary_items_day_id`           | 完全重複 |
| order_members   | `idx_order_members_order` + `idx_order_members_order_id`           | 完全重複 |

---

## 建議新增的 Index

### 1. driver_tasks — 全面補齊

```sql
-- 多租戶必備
CREATE INDEX CONCURRENTLY idx_driver_tasks_workspace_id
  ON public.driver_tasks USING btree (workspace_id);

-- 查詢司機的任務
CREATE INDEX CONCURRENTLY idx_driver_tasks_driver_id
  ON public.driver_tasks USING btree (driver_id);

-- 依團查詢
CREATE INDEX CONCURRENTLY idx_driver_tasks_tour_id
  ON public.driver_tasks USING btree (tour_id);

-- 狀態篩選
CREATE INDEX CONCURRENTLY idx_driver_tasks_status
  ON public.driver_tasks USING btree (status);

-- 服務日期排序（司機派工列表常用）
CREATE INDEX CONCURRENTLY idx_driver_tasks_service_date
  ON public.driver_tasks USING btree (service_date);

-- 建立時間排序
CREATE INDEX CONCURRENTLY idx_driver_tasks_created_at
  ON public.driver_tasks USING btree (created_at DESC);

-- 供應商查詢
CREATE INDEX CONCURRENTLY idx_driver_tasks_supplier_id
  ON public.driver_tasks USING btree (supplier_id);
```

### 2. orders — 缺 created_at

```sql
CREATE INDEX CONCURRENTLY idx_orders_created_at
  ON public.orders USING btree (created_at DESC);
```

### 3. quotes — 缺 workspace_id、created_at

```sql
CREATE INDEX CONCURRENTLY idx_quotes_workspace_id
  ON public.quotes USING btree (workspace_id);

CREATE INDEX CONCURRENTLY idx_quotes_created_at
  ON public.quotes USING btree (created_at DESC);
```

### 4. customers — 缺 created_at

```sql
CREATE INDEX CONCURRENTLY idx_customers_created_at
  ON public.customers USING btree (created_at DESC);
```

### 5. receipts — 缺 created_at

```sql
CREATE INDEX CONCURRENTLY idx_receipts_created_at
  ON public.receipts USING btree (created_at DESC);
```

### 6. payment_requests — 缺 created_at

```sql
CREATE INDEX CONCURRENTLY idx_payment_requests_created_at
  ON public.payment_requests USING btree (created_at DESC);
```

### 7. order_members — 缺 tour_id（如果有此欄位）

```sql
-- 先確認 order_members 有 tour_id 欄位再執行
-- 若無 tour_id，則透過 orders.tour_id JOIN 即可，不需要此 index
```

---

## 可清理的重複 Index

建議刪除以下重複 index（保留命名較清楚的那個）：

```sql
-- itineraries: 保留 idx_itineraries_tour_id，刪除 itineraries_tour_id_idx
DROP INDEX CONCURRENTLY itineraries_tour_id_idx;

-- itineraries: 保留 idx_itineraries_created_by，刪除 itineraries_created_by_idx
DROP INDEX CONCURRENTLY itineraries_created_by_idx;

-- itinerary_days: 保留 idx_itinerary_days_itinerary_id，刪除 idx_itinerary_days_itinerary
DROP INDEX CONCURRENTLY idx_itinerary_days_itinerary;

-- itinerary_items: 保留 idx_itinerary_items_day_id，刪除 idx_itinerary_items_day
DROP INDEX CONCURRENTLY idx_itinerary_items_day;

-- order_members: 保留 idx_order_members_order_id，刪除 idx_order_members_order
DROP INDEX CONCURRENTLY idx_order_members_order;
```

---

## 注意事項

- 所有 `CREATE INDEX CONCURRENTLY` 不會鎖表，可在線上執行
- `DROP INDEX CONCURRENTLY` 同樣不鎖表
- 建議先在 staging 測試，確認無誤後再上 production
- driver_tasks 是最緊急的，其他 created_at index 是改善排序效能

---

_審查人：Claude (AI) | 待 William 審核後執行_
