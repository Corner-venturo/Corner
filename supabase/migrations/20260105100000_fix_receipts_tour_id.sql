-- 修復缺少 tour_id 的收款紀錄
-- 從 tour_name 反查 tour_id，或從 order_id 反查 tour_id

BEGIN;

-- 方案 1: 從 order_id 反查 tour_id (receipts.order_id 是 uuid，orders.id 也是 uuid)
UPDATE receipts r
SET tour_id = o.tour_id
FROM orders o
WHERE r.order_id IS NOT NULL
  AND r.order_id = o.id
  AND r.tour_id IS NULL
  AND o.tour_id IS NOT NULL;

-- 方案 2: 從 tour_name 反查 tour_id (如果 order_id 為空)
UPDATE receipts r
SET tour_id = t.id
FROM tours t
WHERE r.tour_name = t.name
  AND r.tour_id IS NULL
  AND (r.order_id IS NULL OR r.order_id::text = '');

COMMIT;
