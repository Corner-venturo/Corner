-- ============================================
-- 找出所有孤立引用（Orphaned References）
-- ============================================

BEGIN;

DO $$
DECLARE
  orphaned_count INT;
  sample_record RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '檢查孤立的員工引用';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- 1. todos.creator
  SELECT COUNT(*) INTO orphaned_count
  FROM todos t
  WHERE t.creator IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = t.creator);
  
  RAISE NOTICE '📋 todos.creator: % 筆孤立引用', orphaned_count;
  IF orphaned_count > 0 THEN
    FOR sample_record IN (
      SELECT t.id, t.creator, t.title
      FROM todos t
      WHERE t.creator IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = t.creator)
      LIMIT 3
    ) LOOP
      RAISE NOTICE '   範例: ID=%, creator=%, title=%', 
        sample_record.id, sample_record.creator, LEFT(sample_record.title, 30);
    END LOOP;
  END IF;
  RAISE NOTICE '';
  
  -- 2. todos.assignee
  SELECT COUNT(*) INTO orphaned_count
  FROM todos t
  WHERE t.assignee IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = t.assignee);
  
  RAISE NOTICE '📋 todos.assignee: % 筆孤立引用', orphaned_count;
  IF orphaned_count > 0 THEN
    FOR sample_record IN (
      SELECT t.id, t.assignee, t.title
      FROM todos t
      WHERE t.assignee IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = t.assignee)
      LIMIT 3
    ) LOOP
      RAISE NOTICE '   範例: ID=%, assignee=%, title=%', 
        sample_record.id, sample_record.assignee, LEFT(sample_record.title, 30);
    END LOOP;
  END IF;
  RAISE NOTICE '';
  
  -- 3. calendar_events.owner_id
  SELECT COUNT(*) INTO orphaned_count
  FROM calendar_events c
  WHERE c.owner_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = c.owner_id);
  
  RAISE NOTICE '📋 calendar_events.owner_id: % 筆孤立引用', orphaned_count;
  IF orphaned_count > 0 THEN
    FOR sample_record IN (
      SELECT c.id, c.owner_id, c.title
      FROM calendar_events c
      WHERE c.owner_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = c.owner_id)
      LIMIT 3
    ) LOOP
      RAISE NOTICE '   範例: ID=%, owner_id=%, title=%', 
        sample_record.id, sample_record.owner_id, LEFT(sample_record.title, 30);
    END LOOP;
  END IF;
  RAISE NOTICE '';
  
  -- 4. messages.author_id
  SELECT COUNT(*) INTO orphaned_count
  FROM messages m
  WHERE m.author_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = m.author_id);
  
  RAISE NOTICE '📋 messages.author_id: % 筆孤立引用', orphaned_count;
  IF orphaned_count > 0 THEN
    RAISE NOTICE '   (訊息太多，只顯示統計)';
  END IF;
  RAISE NOTICE '';
  
  -- 5. bulletins.author_id
  SELECT COUNT(*) INTO orphaned_count
  FROM bulletins b
  WHERE b.author_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = b.author_id);
  
  RAISE NOTICE '📋 bulletins.author_id: % 筆孤立引用', orphaned_count;
  IF orphaned_count > 0 THEN
    FOR sample_record IN (
      SELECT b.id, b.author_id, b.title
      FROM bulletins b
      WHERE b.author_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = b.author_id)
      LIMIT 3
    ) LOOP
      RAISE NOTICE '   範例: ID=%, author_id=%, title=%', 
        sample_record.id, sample_record.author_id, LEFT(sample_record.title, 30);
    END LOOP;
  END IF;
  RAISE NOTICE '';
  
  -- 6. payment_requests.approved_by
  SELECT COUNT(*) INTO orphaned_count
  FROM payment_requests p
  WHERE p.approved_by IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = p.approved_by);
  
  RAISE NOTICE '📋 payment_requests.approved_by: % 筆孤立引用', orphaned_count;
  RAISE NOTICE '';
  
  -- 7. payment_requests.paid_by
  SELECT COUNT(*) INTO orphaned_count
  FROM payment_requests p
  WHERE p.paid_by IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = p.paid_by);
  
  RAISE NOTICE '📋 payment_requests.paid_by: % 筆孤立引用', orphaned_count;
  RAISE NOTICE '';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '檢查完成';
  RAISE NOTICE '========================================';
END $$;

ROLLBACK;
