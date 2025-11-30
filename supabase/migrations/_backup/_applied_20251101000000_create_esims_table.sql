-- 網卡管理 (eSIM) 資料表
BEGIN;

CREATE TABLE IF NOT EXISTS public.esims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- 基本資訊
  iccid text NOT NULL,
  name text NOT NULL,
  operator text,
  destination text,
  data_plan text,

  -- 狀態與日期
  status text NOT NULL DEFAULT 'inactive',
  activation_date timestamptz,
  expiry_date timestamptz,

  -- 使用情況
  data_used numeric(10,2) DEFAULT 0,
  data_limit numeric(10,2),

  -- 費用
  cost numeric(10,2),
  currency text DEFAULT 'TWD',

  -- 備註
  notes text,

  -- 系統欄位
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- 禁用 RLS（內部管理系統）
ALTER TABLE public.esims DISABLE ROW LEVEL SECURITY;

-- 索引
CREATE INDEX IF NOT EXISTS idx_esims_workspace_id ON public.esims(workspace_id);
CREATE INDEX IF NOT EXISTS idx_esims_status ON public.esims(status);
CREATE INDEX IF NOT EXISTS idx_esims_iccid ON public.esims(iccid);

-- 註釋
COMMENT ON TABLE public.esims IS 'eSIM 網卡管理';
COMMENT ON COLUMN public.esims.iccid IS 'SIM 卡識別碼';
COMMENT ON COLUMN public.esims.status IS '狀態: active, inactive, expired';
COMMENT ON COLUMN public.esims.data_used IS '已使用流量 (GB)';
COMMENT ON COLUMN public.esims.data_limit IS '流量上限 (GB)';

COMMIT;
