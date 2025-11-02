-- =====================================================
-- 確認單管理系統 - Confirmations Table
-- =====================================================
-- 功能：儲存航班/住宿確認單資料
-- 日期：2025-11-01
-- =====================================================

BEGIN;

-- 建立確認單表格
CREATE TABLE IF NOT EXISTS public.confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- 基本資訊
  type TEXT NOT NULL CHECK (type IN ('accommodation', 'flight')),
  booking_number TEXT NOT NULL,
  confirmation_number TEXT,

  -- 資料內容 (JSONB 格式，依照 type 不同儲存不同結構)
  data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- 狀態管理
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'sent', 'cancelled')),

  -- 備註
  notes TEXT,

  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 新增索引
CREATE INDEX IF NOT EXISTS idx_confirmations_workspace_id ON public.confirmations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_type ON public.confirmations(type);
CREATE INDEX IF NOT EXISTS idx_confirmations_status ON public.confirmations(status);
CREATE INDEX IF NOT EXISTS idx_confirmations_booking_number ON public.confirmations(booking_number);
CREATE INDEX IF NOT EXISTS idx_confirmations_created_at ON public.confirmations(created_at DESC);

-- 新增更新時間觸發器
CREATE OR REPLACE FUNCTION update_confirmations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER confirmations_updated_at
  BEFORE UPDATE ON public.confirmations
  FOR EACH ROW
  EXECUTE FUNCTION update_confirmations_updated_at();

-- 新增註解
COMMENT ON TABLE public.confirmations IS '確認單管理表格（航班/住宿）';
COMMENT ON COLUMN public.confirmations.id IS '確認單 ID';
COMMENT ON COLUMN public.confirmations.workspace_id IS '所屬工作空間 ID';
COMMENT ON COLUMN public.confirmations.type IS '確認單類型 (accommodation=住宿, flight=航班)';
COMMENT ON COLUMN public.confirmations.booking_number IS '訂單編號';
COMMENT ON COLUMN public.confirmations.confirmation_number IS '確認單號碼';
COMMENT ON COLUMN public.confirmations.data IS '確認單資料 (JSONB 格式)';
COMMENT ON COLUMN public.confirmations.status IS '狀態 (draft=草稿, confirmed=已確認, sent=已寄出, cancelled=已取消)';
COMMENT ON COLUMN public.confirmations.notes IS '備註';
COMMENT ON COLUMN public.confirmations.created_at IS '建立時間';
COMMENT ON COLUMN public.confirmations.updated_at IS '更新時間';
COMMENT ON COLUMN public.confirmations.created_by IS '建立者';
COMMENT ON COLUMN public.confirmations.updated_by IS '更新者';

-- 禁用 RLS (內部系統)
ALTER TABLE public.confirmations DISABLE ROW LEVEL SECURITY;

COMMIT;
