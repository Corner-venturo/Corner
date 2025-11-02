-- 確認單系統（住宿、機票）
BEGIN;

-- 建立確認單類型 enum
CREATE TYPE confirmation_type AS ENUM ('accommodation', 'flight');

-- 建立確認單表格
CREATE TABLE IF NOT EXISTS public.confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type confirmation_type NOT NULL,

  -- 基本資訊
  booking_number text NOT NULL, -- 訂單編號
  confirmation_number text, -- 確認編號（廠商給的）

  -- 彈性資料欄位（JSON 格式儲存不同類型的資料）
  data jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- 狀態
  status text DEFAULT 'draft', -- draft, confirmed, sent, cancelled

  -- 備註
  notes text,

  -- 時間戳記
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- 建立索引
CREATE INDEX confirmations_workspace_id_idx ON public.confirmations(workspace_id);
CREATE INDEX confirmations_type_idx ON public.confirmations(type);
CREATE INDEX confirmations_status_idx ON public.confirmations(status);
CREATE INDEX confirmations_created_at_idx ON public.confirmations(created_at DESC);

-- 禁用 RLS（內部系統）
ALTER TABLE public.confirmations DISABLE ROW LEVEL SECURITY;

-- 註解
COMMENT ON TABLE public.confirmations IS '確認單系統（住宿、機票）';
COMMENT ON COLUMN public.confirmations.type IS '確認單類型：accommodation（住宿）, flight（機票）';
COMMENT ON COLUMN public.confirmations.booking_number IS '訂單編號';
COMMENT ON COLUMN public.confirmations.confirmation_number IS '確認編號（廠商提供）';
COMMENT ON COLUMN public.confirmations.data IS '確認單詳細資料（JSON 格式）';
COMMENT ON COLUMN public.confirmations.status IS '狀態：draft（草稿）, confirmed（已確認）, sent（已寄送）, cancelled（已取消）';

COMMIT;
