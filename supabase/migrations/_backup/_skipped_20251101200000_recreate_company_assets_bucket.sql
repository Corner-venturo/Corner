-- ============================================
-- Migration: 重新建立公司資源 Storage Bucket
-- 日期: 2025-11-01
-- 說明: 完全重建 bucket 和 policies
-- ============================================

BEGIN;

-- ============================================
-- 1. 完全移除舊的設定
-- ============================================

-- 刪除所有 policies
DROP POLICY IF EXISTS "Anyone can read company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can insert company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete company assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete company assets" ON storage.objects;

-- 刪除 bucket（如果存在）
DELETE FROM storage.buckets WHERE id = 'company-assets';

-- ============================================
-- 2. 重新建立 Bucket（完全公開，無 RLS）
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,  -- 公開
  10485760,  -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif']
);

-- ============================================
-- 3. 完全禁用 Storage Objects 的 RLS
-- ============================================

-- 注意：這會讓 company-assets bucket 完全公開
-- 任何人都可以讀寫（適合內部系統）

ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. 驗證
-- ============================================

DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'company-assets'
  ) INTO bucket_exists;

  IF NOT bucket_exists THEN
    RAISE EXCEPTION '❌ Bucket 建立失敗！';
  END IF;

  RAISE NOTICE '✅ Company Assets Bucket 重建完成！';
  RAISE NOTICE '   - Bucket: company-assets';
  RAISE NOTICE '   - 公開: true';
  RAISE NOTICE '   - 大小限制: 10MB';
  RAISE NOTICE '   - RLS: 已禁用（完全公開）';
END $$;

COMMIT;
