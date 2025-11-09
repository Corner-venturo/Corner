-- ============================================
-- Enable RLS for Workspace-Isolated Tables
-- ============================================
-- 目的：為所有有 workspace_id 的表格啟用 RLS，實現多公司資料隔離
-- 原則：台北公司只看台北資料，台中分公司只看台中資料

BEGIN;

-- ============================================
-- Step 1: 啟用 RLS
-- ============================================

ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkpay_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 2: 刪除舊的 Policy（如果存在）
-- ============================================

DROP POLICY IF EXISTS "Allow all operations on bulletins" ON public.bulletins;
DROP POLICY IF EXISTS "Allow all operations on channel_groups" ON public.channel_groups;
DROP POLICY IF EXISTS "Allow all operations on channel_members" ON public.channel_members;
DROP POLICY IF EXISTS "Allow all operations on channels" ON public.channels;
DROP POLICY IF EXISTS "Allow all operations on confirmations" ON public.confirmations;
DROP POLICY IF EXISTS "Allow all operations on esims" ON public.esims;
DROP POLICY IF EXISTS "Allow all operations on linkpay_logs" ON public.linkpay_logs;
DROP POLICY IF EXISTS "Allow all operations on personal_canvases" ON public.personal_canvases;
DROP POLICY IF EXISTS "Allow all operations on receipts" ON public.receipts;

-- 刪除可能存在的舊 workspace_isolation policy
DROP POLICY IF EXISTS "workspace_isolation" ON public.bulletins;
DROP POLICY IF EXISTS "workspace_isolation" ON public.channel_groups;
DROP POLICY IF EXISTS "workspace_isolation" ON public.channel_members;
DROP POLICY IF EXISTS "workspace_isolation" ON public.channels;
DROP POLICY IF EXISTS "workspace_isolation" ON public.confirmations;
DROP POLICY IF EXISTS "workspace_isolation" ON public.esims;
DROP POLICY IF EXISTS "workspace_isolation" ON public.linkpay_logs;
DROP POLICY IF EXISTS "workspace_isolation" ON public.personal_canvases;
DROP POLICY IF EXISTS "workspace_isolation" ON public.receipts;

-- ============================================
-- Step 3: 建立新的 Workspace Isolation Policy
-- ============================================

-- Bulletins (公告)
CREATE POLICY "workspace_isolation_bulletins"
ON public.bulletins
FOR ALL
TO authenticated
USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- Channel Groups (頻道群組)
CREATE POLICY "workspace_isolation_channel_groups"
ON public.channel_groups
FOR ALL
TO authenticated
USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- Channel Members (頻道成員)
CREATE POLICY "workspace_isolation_channel_members"
ON public.channel_members
FOR ALL
TO authenticated
USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- Channels (頻道)
CREATE POLICY "workspace_isolation_channels"
ON public.channels
FOR ALL
TO authenticated
USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- Confirmations (確認單)
CREATE POLICY "workspace_isolation_confirmations"
ON public.confirmations
FOR ALL
TO authenticated
USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- eSIMs
CREATE POLICY "workspace_isolation_esims"
ON public.esims
FOR ALL
TO authenticated
USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- LinkPay Logs (收款記錄)
CREATE POLICY "workspace_isolation_linkpay_logs"
ON public.linkpay_logs
FOR ALL
TO authenticated
USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- Personal Canvases (個人畫布)
CREATE POLICY "workspace_isolation_personal_canvases"
ON public.personal_canvases
FOR ALL
TO authenticated
USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- Receipts (收據/收款單)
CREATE POLICY "workspace_isolation_receipts"
ON public.receipts
FOR ALL
TO authenticated
USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- ============================================
-- Step 4: 建立 Helper Function（設定當前 workspace）
-- ============================================

CREATE OR REPLACE FUNCTION public.set_current_workspace(workspace_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_workspace_id', workspace_id, false);
END;
$$;

COMMENT ON FUNCTION public.set_current_workspace IS '設定當前使用者的 workspace_id，用於 RLS 過濾';

COMMIT;
