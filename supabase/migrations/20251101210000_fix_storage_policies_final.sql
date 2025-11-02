-- ============================================
-- Migration: 修正 Storage Policies（最終版）
-- 日期: 2025-11-01
-- 說明: 建立完全開放的 policies
-- ============================================

BEGIN;

-- ============================================
-- 1. 刪除所有相關 policies
-- ============================================

DO $$
BEGIN
  -- 刪除所有可能的 policy 名稱
  DROP POLICY IF EXISTS "Anyone can read company assets" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can insert company assets" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update company assets" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete company assets" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access for company assets" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload company assets" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update own company assets" ON storage.objects;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Some policies do not exist, skipping...';
END $$;

-- ============================================
-- 2. 確保 Bucket 存在
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,
  10485760,  -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif'];

-- ============================================
-- 3. 建立完全開放的 Policies
-- ============================================

-- 公開讀取（任何人）
CREATE POLICY "company_assets_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-assets');

-- 認證用戶可以插入
CREATE POLICY "company_assets_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets');

-- 認證用戶可以更新
CREATE POLICY "company_assets_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-assets')
WITH CHECK (bucket_id = 'company-assets');

-- 認證用戶可以刪除
CREATE POLICY "company_assets_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-assets');

-- ============================================
-- 4. 驗證
-- ============================================

DO $$
DECLARE
  bucket_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- 檢查 bucket
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE id = 'company-assets';

  IF bucket_count = 0 THEN
    RAISE EXCEPTION '❌ Bucket 不存在！';
  END IF;

  -- 檢查 policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname LIKE 'company_assets%';

  RAISE NOTICE '✅ Storage 設定完成！';
  RAISE NOTICE '   - Bucket: company-assets (存在)';
  RAISE NOTICE '   - Policies: % 個', policy_count;
  RAISE NOTICE '   - 公開讀取: 是';
  RAISE NOTICE '   - 認證用戶可操作: 是';
END $$;

COMMIT;
