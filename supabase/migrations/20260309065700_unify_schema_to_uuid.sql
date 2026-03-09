-- Migration: Unify Schema to UUID (Method B - Complete Solution)
-- Date: 2026-03-09 06:57
-- Priority: P0 - Critical for data integrity
-- Risk: Medium (schema change, verified safe)
-- 
-- Pre-checks:
--   ✅ All existing IDs are valid UUID format
--   ✅ No orphan records found
--   ✅ Non-business hours (06:57)
-- 
-- This migration:
--   1. Convert core tables' id from text to uuid
--   2. Convert foreign key columns to uuid
--   3. Add Foreign Key constraints
--
-- Estimated time: 1-2 minutes
-- Rollback: See end of file

-- ============================================================================
-- PHASE 1: Convert Core Tables (id: text → uuid)
-- ============================================================================

BEGIN;

-- 1.1 Suppliers
ALTER TABLE suppliers 
ALTER COLUMN id TYPE uuid USING id::uuid;

-- 1.2 Customers  
ALTER TABLE customers 
ALTER COLUMN id TYPE uuid USING id::uuid;

-- 1.3 Tours
ALTER TABLE tours 
ALTER COLUMN id TYPE uuid USING id::uuid;

-- 1.4 Orders
ALTER TABLE orders 
ALTER COLUMN id TYPE uuid USING id::uuid;

-- 1.5 Quotes
ALTER TABLE quotes 
ALTER COLUMN id TYPE uuid USING id::uuid;

-- ============================================================================
-- PHASE 2: Convert Foreign Key Columns (if text)
-- ============================================================================

-- 2.1 Check and convert payment_requests foreign keys
DO $$
BEGIN
  -- tour_id
  IF (SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'payment_requests' AND column_name = 'tour_id') = 'text' 
  THEN
    ALTER TABLE payment_requests 
    ALTER COLUMN tour_id TYPE uuid USING tour_id::uuid;
    RAISE NOTICE 'Converted payment_requests.tour_id to uuid';
  END IF;
  
  -- order_id
  IF (SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'payment_requests' AND column_name = 'order_id') = 'text' 
  THEN
    ALTER TABLE payment_requests 
    ALTER COLUMN order_id TYPE uuid USING order_id::uuid;
    RAISE NOTICE 'Converted payment_requests.order_id to uuid';
  END IF;
END $$;

-- 2.2 Check and convert quotes foreign keys
DO $$
BEGIN
  -- customer_id
  IF (SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'quotes' AND column_name = 'customer_id') = 'text' 
  THEN
    ALTER TABLE quotes 
    ALTER COLUMN customer_id TYPE uuid USING customer_id::uuid;
    RAISE NOTICE 'Converted quotes.customer_id to uuid';
  END IF;
  
  -- tour_id
  IF (SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'quotes' AND column_name = 'tour_id') = 'text' 
  THEN
    ALTER TABLE quotes 
    ALTER COLUMN tour_id TYPE uuid USING tour_id::uuid;
    RAISE NOTICE 'Converted quotes.tour_id to uuid';
  END IF;
END $$;

-- ============================================================================
-- PHASE 3: Add Foreign Key Constraints (P0 Priority)
-- ============================================================================

-- 3.1 Payment Request Items → Supplier
ALTER TABLE payment_request_items
ADD CONSTRAINT payment_request_items_supplier_id_fkey
FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
ON DELETE RESTRICT;

-- 3.2 Payment Requests → Supplier
ALTER TABLE payment_requests
ADD CONSTRAINT payment_requests_supplier_id_fkey
FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
ON DELETE RESTRICT;

-- 3.3 Payment Requests → Tour
ALTER TABLE payment_requests
ADD CONSTRAINT payment_requests_tour_id_fkey
FOREIGN KEY (tour_id) REFERENCES tours(id)
ON DELETE CASCADE;

-- 3.4 Payment Requests → Order
ALTER TABLE payment_requests
ADD CONSTRAINT payment_requests_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id)
ON DELETE CASCADE;

-- 3.5 Receipts → Order
ALTER TABLE receipts
ADD CONSTRAINT receipts_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id)
ON DELETE CASCADE;

-- 3.6 Receipts → Customer
ALTER TABLE receipts
ADD CONSTRAINT receipts_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id)
ON DELETE RESTRICT;

-- 3.7 Tour Members → Customer
ALTER TABLE tour_members
ADD CONSTRAINT tour_members_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id)
ON DELETE RESTRICT;

-- 3.8 Tour Members → Tour
ALTER TABLE tour_members
ADD CONSTRAINT tour_members_tour_id_fkey
FOREIGN KEY (tour_id) REFERENCES tours(id)
ON DELETE CASCADE;

-- 3.9 Quotes → Customer
ALTER TABLE quotes
ADD CONSTRAINT quotes_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id)
ON DELETE RESTRICT;

-- 3.10 Quotes → Tour
ALTER TABLE quotes
ADD CONSTRAINT quotes_tour_id_fkey
FOREIGN KEY (tour_id) REFERENCES tours(id)
ON DELETE CASCADE;

-- 3.11 Order Members → Customer
ALTER TABLE order_members
ADD CONSTRAINT order_members_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id)
ON DELETE RESTRICT;

-- 3.12 Order Members → Order
ALTER TABLE order_members
ADD CONSTRAINT order_members_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id)
ON DELETE CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  core_uuid_count INT;
  fk_count INT;
BEGIN
  -- Check core tables are uuid
  SELECT COUNT(*) INTO core_uuid_count
  FROM information_schema.columns
  WHERE table_name IN ('suppliers', 'customers', 'tours', 'orders', 'quotes')
    AND column_name = 'id'
    AND data_type = 'uuid';
  
  IF core_uuid_count < 5 THEN
    RAISE EXCEPTION 'Core tables not all uuid. Expected 5, got %', core_uuid_count;
  END IF;
  
  -- Check foreign keys created
  SELECT COUNT(*) INTO fk_count
  FROM pg_constraint
  WHERE conname LIKE '%_fkey'
    AND conname IN (
      'payment_request_items_supplier_id_fkey',
      'payment_requests_supplier_id_fkey',
      'payment_requests_tour_id_fkey',
      'payment_requests_order_id_fkey',
      'receipts_order_id_fkey',
      'receipts_customer_id_fkey',
      'tour_members_customer_id_fkey',
      'tour_members_tour_id_fkey',
      'quotes_customer_id_fkey',
      'quotes_tour_id_fkey',
      'order_members_customer_id_fkey',
      'order_members_order_id_fkey'
    );
  
  IF fk_count < 12 THEN
    RAISE EXCEPTION 'Not all FKs created. Expected 12, got %', fk_count;
  END IF;
  
  RAISE NOTICE '✅ Migration 成功！';
  RAISE NOTICE '  - 5 張核心表已轉為 uuid';
  RAISE NOTICE '  - 12 個 Foreign Keys 已建立';
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- 
-- 如果需要回退，執行以下 SQL：
--
-- BEGIN;
-- 
-- -- Drop foreign keys
-- ALTER TABLE payment_request_items DROP CONSTRAINT IF EXISTS payment_request_items_supplier_id_fkey;
-- ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS payment_requests_supplier_id_fkey;
-- ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS payment_requests_tour_id_fkey;
-- ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS payment_requests_order_id_fkey;
-- ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_order_id_fkey;
-- ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_customer_id_fkey;
-- ALTER TABLE tour_members DROP CONSTRAINT IF EXISTS tour_members_customer_id_fkey;
-- ALTER TABLE tour_members DROP CONSTRAINT IF EXISTS tour_members_tour_id_fkey;
-- ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_customer_id_fkey;
-- ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_tour_id_fkey;
-- ALTER TABLE order_members DROP CONSTRAINT IF EXISTS order_members_customer_id_fkey;
-- ALTER TABLE order_members DROP CONSTRAINT IF EXISTS order_members_order_id_fkey;
-- 
-- -- Revert to text (if really needed - data will remain as valid uuid strings)
-- -- ALTER TABLE suppliers ALTER COLUMN id TYPE text;
-- -- ALTER TABLE customers ALTER COLUMN id TYPE text;
-- -- ALTER TABLE tours ALTER COLUMN id TYPE text;
-- -- ALTER TABLE orders ALTER COLUMN id TYPE text;
-- -- ALTER TABLE quotes ALTER COLUMN id TYPE text;
-- 
-- COMMIT;
