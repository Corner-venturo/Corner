-- 建立城市背景圖 Storage Bucket
-- 目的：存放城市背景圖檔案

BEGIN;

-- ============================================
-- 1. 建立 Storage Bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'city-backgrounds',
  'city-backgrounds',
  true,  -- 公開存取
  5242880,  -- 5MB 限制
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. 設定 Storage 政策
-- ============================================

-- 允許所有人讀取（公開）
CREATE POLICY "Allow public read access on city backgrounds"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'city-backgrounds');

-- 允許認證用戶上傳
CREATE POLICY "Allow authenticated users to upload city backgrounds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'city-backgrounds');

-- 允許認證用戶更新自己上傳的檔案
CREATE POLICY "Allow authenticated users to update city backgrounds"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'city-backgrounds');

-- 允許認證用戶刪除
CREATE POLICY "Allow authenticated users to delete city backgrounds"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'city-backgrounds');

COMMIT;
