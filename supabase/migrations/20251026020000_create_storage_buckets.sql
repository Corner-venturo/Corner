-- ============================================
-- Migration: 建立 Storage Buckets 並設定權限
-- 日期: 2025-10-26
-- 說明: 建立用戶頭像和聊天檔案的 storage buckets
-- ============================================

BEGIN;

-- 1. 建立 avatars bucket（用戶頭像）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- 公開可讀
  2097152,  -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. 建立 chat-files bucket（聊天檔案）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true,  -- 公開可讀
  10485760,  -- 10MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. 設定 avatars bucket 權限

-- 允許所有已登入用戶上傳自己的頭像
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允許用戶更新自己的頭像
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允許用戶刪除自己的頭像
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允許所有人讀取頭像
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 4. 設定 chat-files bucket 權限

-- 允許已登入用戶上傳檔案到聊天頻道
CREATE POLICY "Users can upload chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-files');

-- 允許所有人讀取聊天檔案
CREATE POLICY "Chat files are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-files');

-- 允許上傳者刪除自己的檔案
CREATE POLICY "Users can delete their own chat files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-files' AND
  owner = auth.uid()
);

-- 5. 新增 employees 表格的 avatar_url 欄位
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_employees_avatar_url
  ON public.employees(avatar_url)
  WHERE avatar_url IS NOT NULL;

COMMENT ON COLUMN public.employees.avatar_url IS '用戶頭像 URL（Supabase Storage）';

-- 驗證
DO $$
BEGIN
  RAISE NOTICE '✅ Storage Buckets 建立完成！';
  RAISE NOTICE '   - avatars: 用戶頭像（2MB, 公開讀取）';
  RAISE NOTICE '   - chat-files: 聊天檔案（10MB, 公開讀取）';
  RAISE NOTICE '   - employees.avatar_url: 頭像 URL 欄位已新增';
END $$;

COMMIT;
