-- ============================================
-- Migration: 修正公司資源 Storage 權限
-- 日期: 2025-11-01
-- 說明: 移除 RLS，允許所有認證用戶上傳
-- ============================================

BEGIN;

-- ============================================
-- 1. 刪除舊的 Policies
-- ============================================

DROP POLICY IF EXISTS "Public read access for company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete company assets" ON storage.objects;

-- ============================================
-- 2. 建立新的簡化 Policies
-- ============================================

-- 所有人都可以讀取（公開）
CREATE POLICY "Anyone can read company assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-assets');

-- 認證用戶可以上傳
CREATE POLICY "Authenticated users can insert company assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets');

-- 認證用戶可以更新
CREATE POLICY "Authenticated users can update company assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-assets')
WITH CHECK (bucket_id = 'company-assets');

-- 認證用戶可以刪除
CREATE POLICY "Authenticated users can delete company assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-assets');

-- ============================================
-- 3. 驗證
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Storage Policies 更新完成！';
  RAISE NOTICE '   - 公開讀取';
  RAISE NOTICE '   - 認證用戶可上傳/更新/刪除';
END $$;

COMMIT;
