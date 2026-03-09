-- ============================================================================
-- Pre-Migration Cleanup: Fix Orphan Records
-- ============================================================================
-- Date: 2026-03-09 07:30
-- Author: Matthew (馬修)
-- Purpose: Fix data errors before adding Foreign Keys
-- 
-- Issue discovered:
--   payment_request_items.supplier_id = William's user_id (incorrect data)
--   These are not real suppliers, should be NULL
-- 
-- This migration:
--   1. Identify orphan records
--   2. Fix data errors (set invalid supplier_id to NULL)
--   3. Log the changes
-- ============================================================================

BEGIN;

-- Create temp table to log changes
CREATE TEMP TABLE orphan_cleanup_log (
  table_name text,
  record_id uuid,
  column_name text,
  old_value text,
  new_value text,
  reason text
);

-- ============================================================================
-- Fix payment_request_items orphan records
-- ============================================================================

DO $$
DECLARE
  fixed_count INT;
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Fixing payment_request_items orphan records';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Log orphans before fixing
  INSERT INTO orphan_cleanup_log
  SELECT 
    'payment_request_items' as table_name,
    pri.id as record_id,
    'supplier_id' as column_name,
    pri.supplier_id::text as old_value,
    'NULL' as new_value,
    'supplier_id points to non-existent supplier (likely user_id error)' as reason
  FROM payment_request_items pri
  WHERE pri.supplier_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM suppliers s 
      WHERE s.id::uuid = pri.supplier_id
    );
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  -- Fix: Set to NULL
  UPDATE payment_request_items
  SET supplier_id = NULL
  WHERE supplier_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM suppliers s 
      WHERE s.id::uuid = supplier_id
    );
  
  RAISE NOTICE 'Fixed % orphan records in payment_request_items', fixed_count;
END $$;

-- ============================================================================
-- Check other potential orphans
-- ============================================================================

DO $$
DECLARE
  orphan_pr_supplier INT;
  orphan_pr_tour INT;
  orphan_receipts_order INT;
  orphan_receipts_customer INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Checking other potential orphans';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Check payment_requests.supplier_id
  SELECT COUNT(*) INTO orphan_pr_supplier
  FROM payment_requests pr
  WHERE pr.supplier_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM suppliers s WHERE s.id::uuid = pr.supplier_id);
  
  IF orphan_pr_supplier > 0 THEN
    RAISE NOTICE '⚠ payment_requests.supplier_id: % orphans found', orphan_pr_supplier;
  ELSE
    RAISE NOTICE '✓ payment_requests.supplier_id: No orphans';
  END IF;
  
  -- Check payment_requests.tour_id
  SELECT COUNT(*) INTO orphan_pr_tour
  FROM payment_requests pr
  WHERE pr.tour_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.id::text = pr.tour_id::text);
  
  IF orphan_pr_tour > 0 THEN
    RAISE NOTICE '⚠ payment_requests.tour_id: % orphans found', orphan_pr_tour;
  ELSE
    RAISE NOTICE '✓ payment_requests.tour_id: No orphans';
  END IF;
  
  -- Check receipts.order_id
  SELECT COUNT(*) INTO orphan_receipts_order
  FROM receipts r
  WHERE r.order_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.id::text = r.order_id::text);
  
  IF orphan_receipts_order > 0 THEN
    RAISE NOTICE '⚠ receipts.order_id: % orphans found', orphan_receipts_order;
  ELSE
    RAISE NOTICE '✓ receipts.order_id: No orphans';
  END IF;
  
  -- Check receipts.customer_id
  SELECT COUNT(*) INTO orphan_receipts_customer
  FROM receipts r
  WHERE r.customer_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.id::text = r.customer_id::text);
  
  IF orphan_receipts_customer > 0 THEN
    RAISE NOTICE '⚠ receipts.customer_id: % orphans found', orphan_receipts_customer;
  ELSE
    RAISE NOTICE '✓ receipts.customer_id: No orphans';
  END IF;
END $$;

-- ============================================================================
-- Show cleanup log
-- ============================================================================

DO $$
DECLARE
  log_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Cleanup Log';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  FOR log_record IN 
    SELECT * FROM orphan_cleanup_log
  LOOP
    RAISE NOTICE '  %.% (%) : % → %',
      log_record.table_name,
      log_record.record_id,
      log_record.column_name,
      log_record.old_value,
      log_record.new_value;
    RAISE NOTICE '    Reason: %', log_record.reason;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Cleanup完成，可以安全加入 Foreign Keys';
END $$;

COMMIT;
