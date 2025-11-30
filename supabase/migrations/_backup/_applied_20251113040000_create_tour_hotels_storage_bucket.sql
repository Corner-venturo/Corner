-- 創建 tour-hotels storage bucket 用於行程飯店圖片上傳

BEGIN;

-- 創建 bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tour-hotels',
  'tour-hotels',
  true,  -- 公開存取
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 允許所有已認證用戶上傳
CREATE POLICY "Allow authenticated users to upload hotel images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tour-hotels');

-- 允許所有用戶讀取（因為 bucket 是 public）
CREATE POLICY "Allow public to read hotel images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tour-hotels');

-- 允許已認證用戶更新自己上傳的檔案
CREATE POLICY "Allow authenticated users to update their hotel images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tour-hotels');

-- 允許已認證用戶刪除自己上傳的檔案
CREATE POLICY "Allow authenticated users to delete their hotel images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tour-hotels');

COMMIT;
