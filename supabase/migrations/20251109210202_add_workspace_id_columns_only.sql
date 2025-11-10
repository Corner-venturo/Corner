-- ============================================================
-- Step 1: 只新增 workspace_id 欄位（不填充資料）
-- ============================================================

BEGIN;

-- 為所有需要的表格新增 workspace_id 欄位
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.disbursement_orders ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.rich_documents ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_tours_workspace_id ON public.tours(workspace_id);
CREATE INDEX IF NOT EXISTS idx_orders_workspace_id ON public.orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_workspace_id ON public.itineraries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_todos_workspace_id ON public.todos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_customers_workspace_id ON public.customers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payments_workspace_id ON public.payments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_workspace_id ON public.payment_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_disbursement_orders_workspace_id ON public.disbursement_orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_workspace_id ON public.messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_workspace_id ON public.calendar_events(workspace_id);

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ 所有 workspace_id 欄位已新增';
  RAISE NOTICE '====================================';
END $$;
