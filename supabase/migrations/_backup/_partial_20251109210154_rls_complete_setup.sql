-- ============================================================
-- 完整 RLS 設置：新增 workspace_id 到所有需要的表格
-- ============================================================

BEGIN;

-- 1. 首先確保 employees 表有 workspace_id
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- 2. 為所有需要的表格新增 workspace_id 欄位（如果不存在）
-- 核心業務表格
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- 財務相關表格
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.disbursement_orders ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- 溝通相關表格
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- 文檔相關表格
ALTER TABLE public.rich_documents ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- 3. 獲取預設 workspace ID（取第一個工作空間）
DO $$
DECLARE
  default_workspace_id uuid;
BEGIN
  -- 獲取第一個 workspace 的 ID
  SELECT id INTO default_workspace_id
  FROM public.workspaces
  ORDER BY created_at
  LIMIT 1;

  -- 如果找不到 workspace，報錯
  IF default_workspace_id IS NULL THEN
    RAISE EXCEPTION 'No workspace found. Please create a workspace first.';
  END IF;

  -- 為所有現有資料填充預設 workspace_id（只更新 NULL 的記錄）
  RAISE NOTICE '使用預設 workspace: %', default_workspace_id;

  -- 核心業務表格
  UPDATE public.tours SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ tours 已更新';

  UPDATE public.orders SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ orders 已更新';

  UPDATE public.itineraries SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ itineraries 已更新';

  UPDATE public.todos SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ todos 已更新';

  UPDATE public.customers SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ customers 已更新';

  -- 財務相關表格
  UPDATE public.payments SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ payments 已更新';

  UPDATE public.payment_requests SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ payment_requests 已更新';

  UPDATE public.disbursement_orders SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ disbursement_orders 已更新';

  UPDATE public.quotes SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ quotes 已更新';

  -- 溝通相關表格
  UPDATE public.channels SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ channels 已更新';

  UPDATE public.messages SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ messages 已更新';

  UPDATE public.calendar_events SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ calendar_events 已更新';

  UPDATE public.channel_members SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ channel_members 已更新';

  -- 文檔相關表格
  UPDATE public.personal_canvases SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ personal_canvases 已更新';

  UPDATE public.rich_documents SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ rich_documents 已更新';

  -- 員工表格
  UPDATE public.employees SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  RAISE NOTICE '✅ employees 已更新';

END $$;

-- 4. 為重要欄位添加索引以提升查詢效能
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

RAISE NOTICE '✅ 所有索引已建立';

COMMIT;

-- 5. 顯示完成訊息
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ RLS 準備工作完成！';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '所有表格已新增 workspace_id 欄位';
  RAISE NOTICE '所有現有資料已填充預設 workspace';
  RAISE NOTICE '所有索引已建立';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  注意：RLS 策略尚未啟用';
  RAISE NOTICE '請先驗證資料正確性後再啟用 RLS';
  RAISE NOTICE '';
END $$;
