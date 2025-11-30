-- PNR (Passenger Name Record) 管理系統
-- 支援 Amadeus GDS 電報格式解析

BEGIN;

-- 建立 pnrs 主表
CREATE TABLE IF NOT EXISTS public.pnrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基本資訊
  record_locator text NOT NULL UNIQUE, -- Amadeus 6位訂位代號 (e.g., ABCB23)
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,

  -- 電報原始內容
  raw_pnr text NOT NULL, -- 完整電報內容

  -- 解析後的欄位
  passenger_names text[] NOT NULL DEFAULT '{}', -- 旅客姓名陣列
  ticketing_deadline timestamptz, -- 出票期限 (從 TK TL 解析)
  cancellation_deadline timestamptz, -- 自動取消期限 (從 TK XL 解析)

  -- 航班資訊 (JSON 格式儲存多段)
  segments jsonb DEFAULT '[]'::jsonb, -- [{flight_number, origin, destination, date, time, class, status}]

  -- SSR/OSI 特殊需求
  special_requests text[], -- SSR (Special Service Requests)
  other_info text[], -- OSI (Other Service Information)

  -- 狀態
  status text DEFAULT 'active' CHECK (status IN ('active', 'ticketed', 'cancelled', 'completed')),

  -- 備註
  notes text,

  -- 系統欄位
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.employees(id) ON DELETE SET NULL
);

-- 建立索引
CREATE INDEX idx_pnrs_workspace_id ON public.pnrs(workspace_id);
CREATE INDEX idx_pnrs_employee_id ON public.pnrs(employee_id);
CREATE INDEX idx_pnrs_record_locator ON public.pnrs(record_locator);
CREATE INDEX idx_pnrs_ticketing_deadline ON public.pnrs(ticketing_deadline);
CREATE INDEX idx_pnrs_status ON public.pnrs(status);
CREATE INDEX idx_pnrs_created_at ON public.pnrs(created_at DESC);

-- 建立 updated_at 自動更新 trigger
CREATE TRIGGER update_pnrs_updated_at
  BEFORE UPDATE ON public.pnrs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 註解
COMMENT ON TABLE public.pnrs IS 'PNR (Passenger Name Record) 管理 - 支援 Amadeus GDS 電報格式';
COMMENT ON COLUMN public.pnrs.record_locator IS 'Amadeus 訂位代號 (6位)';
COMMENT ON COLUMN public.pnrs.raw_pnr IS '完整電報原始內容';
COMMENT ON COLUMN public.pnrs.ticketing_deadline IS '出票期限 (從 TK TL 解析)';
COMMENT ON COLUMN public.pnrs.cancellation_deadline IS '自動取消期限 (從 TK XL 解析)';
COMMENT ON COLUMN public.pnrs.segments IS '航班資訊 JSON: [{flight_number, origin, destination, departure_date, departure_time, arrival_date, arrival_time, class, status, aircraft}]';

-- RLS 已禁用（依照專案規範）
ALTER TABLE public.pnrs DISABLE ROW LEVEL SECURITY;

COMMIT;
