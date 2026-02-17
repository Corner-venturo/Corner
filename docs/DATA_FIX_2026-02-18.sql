-- ============================================================
-- DATA FIX: Tour total_revenue inconsistency
-- Date: 2026-02-18
-- Author: Automated audit (Round 7)
-- Status: PENDING — William 需確認後手動執行
-- ============================================================

-- Step 1: 檢查不一致資料（唯讀，安全執行）
SELECT
  t.id,
  t.code AS tour_code,
  t.total_revenue AS current_total_revenue,
  COALESCE(SUM(o.paid_amount), 0) AS calculated_revenue,
  t.total_revenue - COALESCE(SUM(o.paid_amount), 0) AS difference
FROM tours t
LEFT JOIN orders o ON o.tour_id = t.id
GROUP BY t.id, t.code, t.total_revenue
HAVING t.total_revenue != COALESCE(SUM(o.paid_amount), 0)
ORDER BY ABS(t.total_revenue - COALESCE(SUM(o.paid_amount), 0)) DESC;

-- Step 2: 檢查 paid_amount vs receipts 不一致
SELECT
  o.id AS order_id,
  o.code AS order_code,
  o.paid_amount,
  COALESCE(SUM(r.actual_amount), 0) AS receipts_total,
  r.status AS receipt_status
FROM orders o
LEFT JOIN receipts r ON r.order_id = o.id
WHERE o.paid_amount > 0
GROUP BY o.id, o.code, o.paid_amount, r.status
HAVING o.paid_amount != COALESCE(SUM(r.actual_amount), 0);

-- ============================================================
-- Step 3: 修復 tour total_revenue（確認後執行）
-- ⚠️ 注意：先執行 Step 1 確認資料正確，再決定是否執行
-- ============================================================

-- UPDATE tours SET total_revenue = (
--   SELECT COALESCE(SUM(o.paid_amount), 0)
--   FROM orders o
--   WHERE o.tour_id = tours.id
-- )
-- WHERE id IN (
--   SELECT t.id
--   FROM tours t
--   LEFT JOIN orders o ON o.tour_id = t.id
--   GROUP BY t.id
--   HAVING t.total_revenue != COALESCE(SUM(o.paid_amount), 0)
-- );
