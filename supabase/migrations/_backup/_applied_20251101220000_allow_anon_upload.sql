-- ============================================
-- Migration: 允許 anon 用戶上傳（完全開放）
-- 日期: 2025-11-01
-- 說明: 內部系統，完全開放所有操作
-- ============================================

BEGIN;

-- ============================================
-- 1. 刪除所有現有 policies
-- ============================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE '%company%'
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
  END LOOP;
END $$;

-- ============================================
-- 2. 建立完全開放的 Policies（包含 anon）
-- ============================================

-- SELECT - 所有人都可以讀取
CREATE POLICY "company_assets_select_all"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- INSERT - 所有人都可以上傳（包含 anon）
CREATE POLICY "company_assets_insert_all"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-assets');

-- UPDATE - 所有人都可以更新
CREATE POLICY "company_assets_update_all"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-assets')
WITH CHECK (bucket_id = 'company-assets');

-- DELETE - 所有人都可以刪除
CREATE POLICY "company_assets_delete_all"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-assets');

-- ============================================
-- 3. 驗證
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname LIKE 'company_assets%';

  IF policy_count != 4 THEN
    RAISE EXCEPTION '❌ Policies 數量不正確！預期 4 個，實際 %', policy_count;
  END IF;

  RAISE NOTICE '✅ 完全開放的 Storage Policies 建立完成！';
  RAISE NOTICE '   - SELECT: 所有人';
  RAISE NOTICE '   - INSERT: 所有人（包含 anon）';
  RAISE NOTICE '   - UPDATE: 所有人';
  RAISE NOTICE '   - DELETE: 所有人';
  RAISE NOTICE '   ⚠️  注意：這是內部系統，完全開放';
END $$;

COMMIT;
