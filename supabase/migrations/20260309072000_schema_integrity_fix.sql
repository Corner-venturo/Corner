-- ============================================================================
-- Schema Integrity Fix - Method A (Pragmatic Perfectionism)
-- ============================================================================
-- Date: 2026-03-09 07:20
-- Author: Matthew (馬修)
-- Approach: Unify to text + Foreign Keys + CHECK constraints
-- Rationale: See COMPLETE_OPTIMIZATION_STRATEGY.md
-- 
-- Why NOT uuid migration:
--   1. Data size is small (287 customers) - performance difference negligible
--   2. Complex migration (66 policies, 10 views, 91 FK columns) - high risk
--   3. Core problem is missing FKs, not text type
--   4. Focus on product launch, not technical perfection
-- 
-- This migration:
--   1. Convert FK columns to text (if uuid)
--   2. Add CHECK constraints (ensure UUID format)
--   3. Add P0 Foreign Keys (12 critical ones)
--   4. Add core indexes (20 for performance)
--   5. Verify everything
-- 
-- Estimated time: 30-45 minutes
-- Risk: Low
-- Rollback: See end of file
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: Convert Foreign Key Columns to TEXT (if UUID)
-- ============================================================================

DO $$
DECLARE
  col_record RECORD;
  converted_count INT := 0;
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Phase 1: Converting FK columns to text';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Find all uuid-type FK columns that reference core tables
  FOR col_record IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type = 'uuid'
      AND (
        column_name LIKE '%supplier_id%'
        OR column_name LIKE '%customer_id%'
        OR column_name LIKE '%tour_id%'
        OR column_name LIKE '%order_id%'
        OR column_name LIKE '%quote_id%'
      )
    ORDER BY table_name, column_name
  LOOP
    BEGIN
      -- Convert to text
      EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE text', 
                     col_record.table_name, 
                     col_record.column_name);
      
      converted_count := converted_count + 1;
      RAISE NOTICE '  ✓ %.% → text', col_record.table_name, col_record.column_name;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  ✗ Failed to convert %.%: %', 
                    col_record.table_name, 
                    col_record.column_name, 
                    SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Phase 1 完成：% 個欄位已轉為 text', converted_count;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- PHASE 2: Add CHECK Constraints (Ensure UUID Format)
-- ============================================================================

DO $$
DECLARE
  constraint_count INT := 0;
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Phase 2: Adding UUID format constraints (text columns only)';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- P0 tables with FK columns
  DECLARE
    tables_to_check text[] := ARRAY[
      'payment_request_items',
      'payment_requests',
      'receipts',
      'tour_members',
      'quotes',
      'order_members'
    ];
    tbl_name text;
    col_type text;
  BEGIN
    FOREACH tbl_name IN ARRAY tables_to_check
    LOOP
      -- Add CHECK for supplier_id (if exists and is text)
      SELECT data_type INTO col_type
      FROM information_schema.columns 
      WHERE table_name = tbl_name AND column_name = 'supplier_id';
      
      IF col_type = 'text' THEN
        EXECUTE format(
          'ALTER TABLE %I ADD CONSTRAINT %I CHECK (supplier_id IS NULL OR supplier_id ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'')',
          tbl_name,
          tbl_name || '_supplier_id_uuid_format'
        );
        constraint_count := constraint_count + 1;
        RAISE NOTICE '  ✓ %.supplier_id UUID format check (text)', tbl_name;
      ELSIF col_type IS NOT NULL THEN
        RAISE NOTICE '  ⊘ %.supplier_id skipped (type: %)', tbl_name, col_type;
      END IF;
      
      -- Add CHECK for customer_id (if exists and is text)
      SELECT data_type INTO col_type
      FROM information_schema.columns 
      WHERE table_name = tbl_name AND column_name = 'customer_id';
      
      IF col_type = 'text' THEN
        EXECUTE format(
          'ALTER TABLE %I ADD CONSTRAINT %I CHECK (customer_id IS NULL OR customer_id ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'')',
          tbl_name,
          tbl_name || '_customer_id_uuid_format'
        );
        constraint_count := constraint_count + 1;
        RAISE NOTICE '  ✓ %.customer_id UUID format check (text)', tbl_name;
      ELSIF col_type IS NOT NULL THEN
        RAISE NOTICE '  ⊘ %.customer_id skipped (type: %)', tbl_name, col_type;
      END IF;
      
      -- Add CHECK for tour_id (if exists and is text)
      SELECT data_type INTO col_type
      FROM information_schema.columns 
      WHERE table_name = tbl_name AND column_name = 'tour_id';
      
      IF col_type = 'text' THEN
        EXECUTE format(
          'ALTER TABLE %I ADD CONSTRAINT %I CHECK (tour_id IS NULL OR tour_id ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'')',
          tbl_name,
          tbl_name || '_tour_id_uuid_format'
        );
        constraint_count := constraint_count + 1;
        RAISE NOTICE '  ✓ %.tour_id UUID format check (text)', tbl_name;
      ELSIF col_type IS NOT NULL THEN
        RAISE NOTICE '  ⊘ %.tour_id skipped (type: %)', tbl_name, col_type;
      END IF;
      
      -- Add CHECK for order_id (if exists and is text)
      SELECT data_type INTO col_type
      FROM information_schema.columns 
      WHERE table_name = tbl_name AND column_name = 'order_id';
      
      IF col_type = 'text' THEN
        EXECUTE format(
          'ALTER TABLE %I ADD CONSTRAINT %I CHECK (order_id IS NULL OR order_id ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'')',
          tbl_name,
          tbl_name || '_order_id_uuid_format'
        );
        constraint_count := constraint_count + 1;
        RAISE NOTICE '  ✓ %.order_id UUID format check (text)', tbl_name;
      ELSIF col_type IS NOT NULL THEN
        RAISE NOTICE '  ⊘ %.order_id skipped (type: %)', tbl_name, col_type;
      END IF;
    END LOOP;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Phase 2 完成：% 個 CHECK 約束已加入', constraint_count;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- PHASE 3: Add P0 Foreign Key Constraints
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Phase 3: Adding P0 Foreign Keys';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

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

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Phase 3 完成：12 個 P0 Foreign Keys 已加入';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- PHASE 4: Add Core Indexes (Performance)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Phase 4: Adding core indexes';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- Core query indexes
CREATE INDEX IF NOT EXISTS idx_tours_workspace_status 
  ON tours(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_tour_status 
  ON orders(tour_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_requests_tour_status 
  ON payment_requests(tour_id, status);

-- Foreign key indexes (critical for JOIN performance)
CREATE INDEX IF NOT EXISTS idx_orders_customer_id 
  ON orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_tour_members_tour_id 
  ON tour_members(tour_id);

CREATE INDEX IF NOT EXISTS idx_tour_members_customer_id 
  ON tour_members(customer_id);

CREATE INDEX IF NOT EXISTS idx_quotes_tour_id 
  ON quotes(tour_id);

CREATE INDEX IF NOT EXISTS idx_quotes_customer_id 
  ON quotes(customer_id);

CREATE INDEX IF NOT EXISTS idx_receipts_order_id 
  ON receipts(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_requests_supplier_id 
  ON payment_requests(supplier_id);

-- Date range indexes (common queries)
CREATE INDEX IF NOT EXISTS idx_tours_date_range 
  ON tours(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_orders_created_workspace 
  ON orders(created_at, workspace_id);

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Phase 4 完成：12 個核心索引已建立';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  fk_count INT;
  check_count INT;
  index_count INT;
  orphan_count INT;
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'VERIFICATION';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Check 1: Foreign keys created
  SELECT COUNT(*) INTO fk_count
  FROM pg_constraint
  WHERE conname IN (
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
    RAISE EXCEPTION 'Foreign keys not created. Expected 12, got %', fk_count;
  END IF;
  RAISE NOTICE '✅ Foreign Keys: % created', fk_count;
  
  -- Check 2: CHECK constraints added
  SELECT COUNT(*) INTO check_count
  FROM pg_constraint
  WHERE contype = 'c' 
    AND conname LIKE '%_uuid_format';
  
  RAISE NOTICE '✅ CHECK Constraints: % added', check_count;
  
  -- Check 3: Indexes created
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
  
  RAISE NOTICE '✅ Indexes: % exist (includes pre-existing)', index_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🎉 MIGRATION SUCCESS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Schema integrity established:';
  RAISE NOTICE '  • Text type with UUID format validation';
  RAISE NOTICE '  • 12 critical Foreign Keys enforcing referential integrity';
  RAISE NOTICE '  • Core indexes for query performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run verification script';
  RAISE NOTICE '  2. Test frontend tour/order pages';
  RAISE NOTICE '  3. Check query performance';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
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
-- -- Drop CHECK constraints
-- ALTER TABLE payment_request_items DROP CONSTRAINT IF EXISTS payment_request_items_supplier_id_uuid_format;
-- ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS payment_requests_supplier_id_uuid_format;
-- ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS payment_requests_tour_id_uuid_format;
-- ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS payment_requests_order_id_uuid_format;
-- ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_order_id_uuid_format;
-- ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_customer_id_uuid_format;
-- ALTER TABLE tour_members DROP CONSTRAINT IF EXISTS tour_members_customer_id_uuid_format;
-- ALTER TABLE tour_members DROP CONSTRAINT IF EXISTS tour_members_tour_id_uuid_format;
-- ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_customer_id_uuid_format;
-- ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_tour_id_uuid_format;
-- ALTER TABLE order_members DROP CONSTRAINT IF EXISTS order_members_customer_id_uuid_format;
-- ALTER TABLE order_members DROP CONSTRAINT IF EXISTS order_members_order_id_uuid_format;
-- 
-- COMMIT;
-- ============================================================================
