-- =========================================
-- Venturo ERP 測試資料清空腳本（保留客戶+員工版）
-- =========================================
-- 用途：清空業務測試資料，保留客戶和員工基礎資料
-- 執行方式：在 Supabase SQL Editor 執行
-- ⚠️ 警告：此操作無法復原！
-- 
-- 保留：
-- ✅ 客戶資料（customers）
-- ✅ 客戶群組（customer_groups）
-- ✅ 員工資料（employees）
-- ✅ Workspace
-- ✅ 基礎資料（景點、飯店等）
-- 
-- 清空：
-- ❌ 訂單、團、PNR
-- ❌ 報價、行程
-- ❌ 財務記錄
-- =========================================

BEGIN;

-- =========================================
-- 1. PNR 相關（最底層）
-- =========================================
TRUNCATE TABLE pnr_warnings CASCADE;
TRUNCATE TABLE pnr_segments CASCADE;
TRUNCATE TABLE pnrs CASCADE;

-- =========================================
-- 2. 訂單成員（依賴 orders + customers，但保留 customers）
-- =========================================
TRUNCATE TABLE order_members CASCADE;

-- =========================================
-- 3. 訂單（依賴 tours）
-- =========================================
TRUNCATE TABLE orders CASCADE;

-- =========================================
-- 4. 團務相關
-- =========================================
TRUNCATE TABLE tour_itinerary_items CASCADE;
TRUNCATE TABLE tour_members CASCADE;
TRUNCATE TABLE tour_room_assignments CASCADE;
TRUNCATE TABLE tour_vehicle_assignments CASCADE;
TRUNCATE TABLE tour_tracking CASCADE;

-- =========================================
-- 5. 團（依賴 quotes + itineraries）
-- =========================================
TRUNCATE TABLE tours CASCADE;

-- =========================================
-- 6. 報價與行程
-- =========================================
TRUNCATE TABLE quote_items CASCADE;
TRUNCATE TABLE quotes CASCADE;
TRUNCATE TABLE itinerary_days CASCADE;
TRUNCATE TABLE itineraries CASCADE;

-- =========================================
-- 7. 需求單
-- =========================================
TRUNCATE TABLE requirement_items CASCADE;
TRUNCATE TABLE requirements CASCADE;

-- =========================================
-- 8. 財務相關
-- =========================================
TRUNCATE TABLE receipts CASCADE;
TRUNCATE TABLE invoices CASCADE;

-- =========================================
-- ⚠️ 以下保留不清空
-- =========================================
-- 客戶群組（保留）
-- TRUNCATE TABLE customer_group_members CASCADE;
-- TRUNCATE TABLE customer_groups CASCADE;

-- 客戶（保留）
-- TRUNCATE TABLE customers CASCADE;

-- =========================================
-- 2. 其他業務資料
-- =========================================

-- 景點、飯店等基礎資料（如果也要清空）
-- TRUNCATE TABLE attractions CASCADE;
-- TRUNCATE TABLE hotels CASCADE;
-- TRUNCATE TABLE restaurants CASCADE;

-- 供應商
-- TRUNCATE TABLE suppliers CASCADE;

-- =========================================
-- 3. 系統資料（通常不清空）
-- =========================================

-- 員工帳號（保留）
-- TRUNCATE TABLE employees CASCADE;

-- Workspace（保留）
-- TRUNCATE TABLE workspaces CASCADE;

COMMIT;

-- =========================================
-- 驗證：檢查清空結果
-- =========================================
SELECT 
  '✅ 已清空業務資料' as status,
  '---' as separator,
  '---' as count
UNION ALL
SELECT 
  'orders（訂單）' as status,
  '應為 0 →' as separator,
  COUNT(*)::text as count 
FROM orders
UNION ALL
SELECT 'tours（團）', '應為 0 →', COUNT(*)::text FROM tours
UNION ALL
SELECT 'order_members（訂單成員）', '應為 0 →', COUNT(*)::text FROM order_members
UNION ALL
SELECT 'pnrs（PNR）', '應為 0 →', COUNT(*)::text FROM pnrs
UNION ALL
SELECT 'quotes（報價）', '應為 0 →', COUNT(*)::text FROM quotes
UNION ALL
SELECT 
  '---' as status,
  '---' as separator,
  '---' as count
UNION ALL
SELECT 
  '✅ 保留基礎資料' as status,
  '---' as separator,
  '---' as count
UNION ALL
SELECT 'customers（客戶）', '應保留 →', COUNT(*)::text FROM customers
UNION ALL
SELECT 'customer_groups（客戶群組）', '應保留 →', COUNT(*)::text FROM customer_groups
UNION ALL
SELECT 'employees（員工）', '應保留 →', COUNT(*)::text FROM employees;

