-- ============================================
-- Migration: 建立公司資源儲存桶 (Company Assets Storage)
-- 日期: 2025-11-01
-- 說明: 建立用於存放公司 Logo、大小章、插圖的 Storage Bucket
-- ============================================

BEGIN;

-- ============================================
-- 1. 建立 Storage Bucket
-- ============================================

-- 建立 company-assets bucket（公開讀取，只有管理員可寫入）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,  -- 公開讀取
  5242880,  -- 5MB 檔案大小限制
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. 建立資料表：company_assets
-- ============================================

CREATE TABLE IF NOT EXISTS public.company_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('logos', 'seals', 'illustrations', 'documents')),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 禁用 RLS（內部系統）
ALTER TABLE public.company_assets DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. 建立索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_company_assets_category ON public.company_assets(category);
CREATE INDEX IF NOT EXISTS idx_company_assets_created_at ON public.company_assets(created_at DESC);

-- ============================================
-- 4. 建立觸發器：自動更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_company_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_company_assets_updated_at ON public.company_assets;

CREATE TRIGGER trg_update_company_assets_updated_at
  BEFORE UPDATE ON public.company_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_company_assets_updated_at();

-- ============================================
-- 5. Storage Policies（存取權限）
-- ============================================

-- 所有人都可以讀取（公開）
CREATE POLICY "Public read access for company assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- 只有已認證用戶可以上傳
CREATE POLICY "Authenticated users can upload company assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets' AND
  auth.role() = 'authenticated'
);

-- 只有已認證用戶可以更新自己上傳的檔案
CREATE POLICY "Authenticated users can update own company assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-assets' AND
  auth.role() = 'authenticated'
);

-- 只有已認證用戶可以刪除
CREATE POLICY "Authenticated users can delete company assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-assets' AND
  auth.role() = 'authenticated'
);

-- ============================================
-- 6. 欄位說明
-- ============================================

COMMENT ON TABLE public.company_assets IS '公司資源檔案清單';
COMMENT ON COLUMN public.company_assets.name IS '檔案名稱';
COMMENT ON COLUMN public.company_assets.category IS '分類：logos=Logo, seals=大小章, illustrations=插圖, documents=文件';
COMMENT ON COLUMN public.company_assets.file_path IS 'Storage 檔案路徑';
COMMENT ON COLUMN public.company_assets.file_size IS '檔案大小（bytes）';
COMMENT ON COLUMN public.company_assets.mime_type IS 'MIME 類型';
COMMENT ON COLUMN public.company_assets.description IS '檔案描述';
COMMENT ON COLUMN public.company_assets.uploaded_by IS '上傳者 ID';
COMMENT ON COLUMN public.company_assets.uploaded_by_name IS '上傳者名稱';

-- ============================================
-- 7. 驗證
-- ============================================

DO $$
BEGIN
  -- 檢查 bucket 是否建立
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'company-assets') THEN
    RAISE EXCEPTION 'Migration 失敗：未建立 company-assets bucket';
  END IF;

  -- 檢查表格是否建立
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_assets') THEN
    RAISE EXCEPTION 'Migration 失敗：未建立 company_assets 表格';
  END IF;

  RAISE NOTICE '✅ Migration 完成！';
  RAISE NOTICE '   - 建立 company-assets Storage Bucket';
  RAISE NOTICE '   - 建立 company_assets 資料表';
  RAISE NOTICE '   - 設定存取權限（公開讀取，認證用戶可上傳）';
END $$;

COMMIT;
