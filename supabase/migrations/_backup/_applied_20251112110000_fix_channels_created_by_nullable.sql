-- 修正 channels.created_by 為可選欄位
-- 原因：employees 資料可能還沒同步到 Supabase，導致外鍵檢查失敗

BEGIN;

-- 1. 允許 created_by 為 NULL
ALTER TABLE public.channels
ALTER COLUMN created_by DROP NOT NULL;

-- 2. 移除外鍵約束（或改為 SET NULL）
ALTER TABLE public.channels
DROP CONSTRAINT IF EXISTS channels_created_by_fkey;

-- 3. 重新建立外鍵，但設定為 ON DELETE SET NULL
ALTER TABLE public.channels
ADD CONSTRAINT channels_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.employees(id)
ON DELETE SET NULL;

COMMENT ON COLUMN public.channels.created_by IS 'Channel creator - nullable to avoid sync issues';

COMMIT;
