-- ============================================================================
-- Fix Remaining UUID Columns
-- ============================================================================
-- Date: 2026-03-09 07:45
-- Author: Matthew (馬修)
-- Purpose: Convert remaining uuid FK columns that were not converted in Phase 1
-- 
-- Issue: tour_members.tour_id and order_members.order_id are still uuid
-- Target: tours.id and orders.id are text
-- Result: Cannot create FK (type mismatch)
-- 
-- Solution: Manually convert these 2 columns
-- ============================================================================

BEGIN;

-- Convert tour_members.tour_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tour_members' 
      AND column_name = 'tour_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE tour_members ALTER COLUMN tour_id TYPE text;
    RAISE NOTICE '✓ tour_members.tour_id converted to text';
  ELSE
    RAISE NOTICE '⊘ tour_members.tour_id already text';
  END IF;
END $$;

-- Convert order_members.order_id  
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_members' 
      AND column_name = 'order_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE order_members ALTER COLUMN order_id TYPE text;
    RAISE NOTICE '✓ order_members.order_id converted to text';
  ELSE
    RAISE NOTICE '⊘ order_members.order_id already text';
  END IF;
END $$;

-- Add the missing Foreign Keys
DO $$
BEGIN
  -- tour_members → tours
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tour_members_tour_id_fkey'
  ) THEN
    ALTER TABLE tour_members
    ADD CONSTRAINT tour_members_tour_id_fkey
    FOREIGN KEY (tour_id) REFERENCES tours(id)
    ON DELETE CASCADE;
    RAISE NOTICE '✓ tour_members_tour_id_fkey created';
  ELSE
    RAISE NOTICE '⊘ tour_members_tour_id_fkey already exists';
  END IF;
  
  -- order_members → orders
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'order_members_order_id_fkey'
  ) THEN
    ALTER TABLE order_members
    ADD CONSTRAINT order_members_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE;
    RAISE NOTICE '✓ order_members_order_id_fkey created';
  ELSE
    RAISE NOTICE '⊘ order_members_order_id_fkey already exists';
  END IF;
END $$;

-- Add CHECK constraints
DO $$
BEGIN
  -- tour_members.tour_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tour_members_tour_id_uuid_format'
  ) THEN
    ALTER TABLE tour_members
    ADD CONSTRAINT tour_members_tour_id_uuid_format
    CHECK (tour_id IS NULL OR tour_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
    RAISE NOTICE '✓ tour_members.tour_id CHECK constraint added';
  END IF;
  
  -- order_members.order_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'order_members_order_id_uuid_format'
  ) THEN
    ALTER TABLE order_members
    ADD CONSTRAINT order_members_order_id_uuid_format
    CHECK (order_id IS NULL OR order_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
    RAISE NOTICE '✓ order_members.order_id CHECK constraint added';
  END IF;
END $$;

-- Final verification
DO $$
DECLARE
  fk_count INT;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM pg_constraint
  WHERE conname IN (
    'tour_members_tour_id_fkey',
    'order_members_order_id_fkey'
  );
  
  IF fk_count = 2 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 補充 Migration 成功！';
    RAISE NOTICE '   ✅ 2/2 Foreign Keys 已建立';
    RAISE NOTICE '   ✅ 現在應該有完整的 12/12 P0 FKs';
  ELSE
    RAISE WARNING '只有 %/2 FK 成功建立', fk_count;
  END IF;
END $$;

COMMIT;
