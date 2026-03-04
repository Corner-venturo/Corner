-- =========================================
-- Venturo ERP 業務資料清空（保留客戶+員工）
-- =========================================
-- 根據實際資料庫結構產生
-- 執行時間：2026-03-04
-- =========================================

BEGIN;

-- =========================================
-- 1. PNR 相關
-- =========================================
TRUNCATE TABLE pnr_ssr_elements CASCADE;
TRUNCATE TABLE pnr_remarks CASCADE;
TRUNCATE TABLE pnr_passengers CASCADE;
TRUNCATE TABLE pnr_segments CASCADE;
TRUNCATE TABLE pnr_ai_queries CASCADE;
TRUNCATE TABLE pnr_fare_alerts CASCADE;
TRUNCATE TABLE pnr_fare_history CASCADE;
TRUNCATE TABLE pnr_flight_status_history CASCADE;
TRUNCATE TABLE pnr_queue_items CASCADE;
TRUNCATE TABLE pnr_records CASCADE;
TRUNCATE TABLE pnr_schedule_changes CASCADE;
TRUNCATE TABLE pnrs CASCADE;

-- =========================================
-- 2. 訂單相關
-- =========================================
TRUNCATE TABLE order_members CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE shared_order_lists CASCADE;

-- =========================================
-- 3. 團務相關
-- =========================================
TRUNCATE TABLE tour_itinerary_items CASCADE;
TRUNCATE TABLE tour_members CASCADE;
TRUNCATE TABLE tour_room_assignments CASCADE;
TRUNCATE TABLE tour_vehicle_assignments CASCADE;
TRUNCATE TABLE tour_table_assignments CASCADE;
TRUNCATE TABLE tour_leaders CASCADE;
TRUNCATE TABLE tour_expenses CASCADE;
TRUNCATE TABLE tour_refunds CASCADE;
TRUNCATE TABLE tour_request_items CASCADE;
TRUNCATE TABLE tour_request_messages CASCADE;
TRUNCATE TABLE tour_request_member_vouchers CASCADE;
TRUNCATE TABLE tour_requests CASCADE;
TRUNCATE TABLE tour_confirmation_items CASCADE;
TRUNCATE TABLE tour_confirmation_sheets CASCADE;
TRUNCATE TABLE tour_control_forms CASCADE;
TRUNCATE TABLE tour_departure_data CASCADE;
TRUNCATE TABLE tour_custom_cost_values CASCADE;
TRUNCATE TABLE tour_rooms CASCADE;
TRUNCATE TABLE tour_vehicles CASCADE;
TRUNCATE TABLE tour_tables CASCADE;
TRUNCATE TABLE tour_documents CASCADE;
TRUNCATE TABLE tours CASCADE;

-- =========================================
-- 4. 報價與行程
-- =========================================
TRUNCATE TABLE quote_items CASCADE;
TRUNCATE TABLE quote_versions CASCADE;
TRUNCATE TABLE quote_confirmation_logs CASCADE;
TRUNCATE TABLE quotes CASCADE;

TRUNCATE TABLE itinerary_items CASCADE;
TRUNCATE TABLE itinerary_days CASCADE;
TRUNCATE TABLE itinerary_versions CASCADE;
TRUNCATE TABLE itinerary_documents CASCADE;
TRUNCATE TABLE itinerary_permissions CASCADE;
TRUNCATE TABLE assigned_itineraries CASCADE;
TRUNCATE TABLE customer_assigned_itineraries CASCADE;
TRUNCATE TABLE itineraries CASCADE;

-- =========================================
-- 5. 提案
-- =========================================
TRUNCATE TABLE proposal_packages CASCADE;
TRUNCATE TABLE proposals CASCADE;

-- =========================================
-- 6. 財務相關
-- =========================================
TRUNCATE TABLE receipt_items CASCADE;
TRUNCATE TABLE receipt_payment_items CASCADE;
TRUNCATE TABLE receipt_orders CASCADE;
TRUNCATE TABLE receipts CASCADE;

TRUNCATE TABLE invoice_orders CASCADE;
TRUNCATE TABLE travel_invoices CASCADE;

TRUNCATE TABLE payment_request_items CASCADE;
TRUNCATE TABLE payment_requests CASCADE;
TRUNCATE TABLE payments CASCADE;

TRUNCATE TABLE disbursement_orders CASCADE;
TRUNCATE TABLE disbursement_requests CASCADE;

TRUNCATE TABLE advance_items CASCADE;
TRUNCATE TABLE advance_lists CASCADE;

TRUNCATE TABLE refunds CASCADE;

-- =========================================
-- 7. 會計相關
-- =========================================
TRUNCATE TABLE accounting_entries CASCADE;
TRUNCATE TABLE accounting_events CASCADE;
TRUNCATE TABLE accounting_transactions CASCADE;
TRUNCATE TABLE journal_lines CASCADE;
TRUNCATE TABLE journal_vouchers CASCADE;
TRUNCATE TABLE voucher_entries CASCADE;
TRUNCATE TABLE vouchers CASCADE;
TRUNCATE TABLE general_ledger CASCADE;

-- =========================================
-- 8. 其他業務資料
-- =========================================
TRUNCATE TABLE confirmations CASCADE;
TRUNCATE TABLE customization_requests CASCADE;
TRUNCATE TABLE linkpay_logs CASCADE;
TRUNCATE TABLE flight_status_subscriptions CASCADE;

-- =========================================
-- ⚠️ 保留不清空
-- =========================================
-- customers (客戶)
-- customer_groups (客戶群組)
-- customer_group_members (客戶群組成員)
-- employees (員工)
-- workspaces (工作區)
-- suppliers (供應商)
-- attractions (景點)
-- hotels (飯店)
-- restaurants (餐廳)

COMMIT;

-- =========================================
-- 驗證結果
-- =========================================
SELECT '✅ 已清空業務資料' as 類別, '---' as 表名, '---' as 筆數
UNION ALL
SELECT '訂單', 'orders', COUNT(*)::text FROM orders
UNION ALL
SELECT '訂單成員', 'order_members', COUNT(*)::text FROM order_members
UNION ALL
SELECT '團', 'tours', COUNT(*)::text FROM tours
UNION ALL
SELECT '團員', 'tour_members', COUNT(*)::text FROM tour_members
UNION ALL
SELECT 'PNR', 'pnrs', COUNT(*)::text FROM pnrs
UNION ALL
SELECT '報價', 'quotes', COUNT(*)::text FROM quotes
UNION ALL
SELECT '行程', 'itineraries', COUNT(*)::text FROM itineraries
UNION ALL
SELECT '收據', 'receipts', COUNT(*)::text FROM receipts
UNION ALL
SELECT '---', '---', '---'
UNION ALL
SELECT '✅ 保留基礎資料', '---', '---'
UNION ALL
SELECT '客戶', 'customers', COUNT(*)::text FROM customers
UNION ALL
SELECT '客戶群組', 'customer_groups', COUNT(*)::text FROM customer_groups
UNION ALL
SELECT '員工', 'employees', COUNT(*)::text FROM employees
UNION ALL
SELECT '供應商', 'suppliers', COUNT(*)::text FROM suppliers
UNION ALL
SELECT '景點', 'attractions', COUNT(*)::text FROM attractions
UNION ALL
SELECT '飯店', 'hotels', COUNT(*)::text FROM hotels;
