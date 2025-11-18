-- 為 tours 表格新增 created_by 和 updated_by 欄位

BEGIN;

-- 新增 created_by 欄位
ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.employees(id);

-- 新增 updated_by 欄位
ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.employees(id);

-- 加入註解
COMMENT ON COLUMN public.tours.created_by IS '建立者 (員工 ID)';
COMMENT ON COLUMN public.tours.updated_by IS '最後更新者 (員工 ID)';

-- 為現有資料設定預設值（使用第一個 admin）
UPDATE public.tours
SET
  created_by = COALESCE(created_by, (SELECT id FROM public.employees WHERE permissions::jsonb @> '["admin"]'::jsonb LIMIT 1)),
  updated_by = COALESCE(updated_by, (SELECT id FROM public.employees WHERE permissions::jsonb @> '["admin"]'::jsonb LIMIT 1))
WHERE created_by IS NULL OR updated_by IS NULL;

COMMIT;
