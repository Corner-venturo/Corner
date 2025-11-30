-- 清理 channels 表格的重複 RLS 策略
-- 只保留 RLS 禁用狀態

BEGIN;

-- 1. 刪除所有現有的 RLS 策略
DROP POLICY IF EXISTS "Allow all operations on channels" ON public.channels;
DROP POLICY IF EXISTS "channels_delete" ON public.channels;
DROP POLICY IF EXISTS "channels_insert" ON public.channels;
DROP POLICY IF EXISTS "channels_select" ON public.channels;
DROP POLICY IF EXISTS "channels_update" ON public.channels;
DROP POLICY IF EXISTS "所有用戶可刪除頻道" ON public.channels;
DROP POLICY IF EXISTS "所有用戶可建立頻道" ON public.channels;
DROP POLICY IF EXISTS "所有用戶可更新頻道" ON public.channels;
DROP POLICY IF EXISTS "所有用戶可讀取頻道" ON public.channels;

-- 2. 確保 RLS 已禁用
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;

-- 3. 註解說明
COMMENT ON TABLE public.channels IS 'Channels table - RLS disabled for internal system';

COMMIT;
