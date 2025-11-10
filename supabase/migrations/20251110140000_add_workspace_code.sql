-- ============================================================
-- 新增 workspace code 欄位
-- ============================================================

BEGIN;

-- 新增 code 欄位
ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS code text NOT NULL DEFAULT 'TP';

COMMENT ON COLUMN public.workspaces.code IS '辦公室代碼 (TP=台北, TC=台中)';

-- 更新現有資料
UPDATE public.workspaces
SET code = CASE
  WHEN name = '台北辦公室' THEN 'TP'
  WHEN name = '台中辦公室' THEN 'TC'
  ELSE 'TP'
END;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Workspace code 欄位新增完成！';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
END $$;
