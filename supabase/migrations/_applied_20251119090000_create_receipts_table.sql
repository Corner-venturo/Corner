-- 創建 receipts 和 linkpay_logs 表格
BEGIN;

-- 收款單表格
CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  receipt_number text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_name text,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL,
  payment_date timestamptz,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  sync_status text DEFAULT 'synced'
);

COMMENT ON TABLE public.receipts IS '收款單';
COMMENT ON COLUMN public.receipts.workspace_id IS '工作空間 ID';
COMMENT ON COLUMN public.receipts.receipt_number IS '收款單號';
COMMENT ON COLUMN public.receipts.order_id IS '關聯訂單';
COMMENT ON COLUMN public.receipts.customer_name IS '客戶名稱';
COMMENT ON COLUMN public.receipts.amount IS '金額';
COMMENT ON COLUMN public.receipts.payment_method IS '付款方式';
COMMENT ON COLUMN public.receipts.payment_date IS '付款日期';
COMMENT ON COLUMN public.receipts.status IS '狀態';
COMMENT ON COLUMN public.receipts.notes IS '備註';
COMMENT ON COLUMN public.receipts.created_by IS '建立者';
COMMENT ON COLUMN public.receipts.updated_by IS '最後更新者';
COMMENT ON COLUMN public.receipts.sync_status IS '同步狀態';

-- 索引
CREATE INDEX IF NOT EXISTS idx_receipts_workspace_id ON public.receipts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON public.receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON public.receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_method ON public.receipts(payment_method);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON public.receipts(created_at);
CREATE INDEX IF NOT EXISTS idx_receipts_updated_at ON public.receipts(updated_at);
CREATE INDEX IF NOT EXISTS idx_receipts_sync_status ON public.receipts(sync_status);

-- LinkPay 日誌表格
CREATE TABLE IF NOT EXISTS public.linkpay_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  receipt_id uuid REFERENCES public.receipts(id) ON DELETE CASCADE,
  link_id text,
  action text NOT NULL,
  status text NOT NULL,
  request_data jsonb,
  response_data jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  sync_status text DEFAULT 'synced'
);

COMMENT ON TABLE public.linkpay_logs IS 'LinkPay 金流日誌';
COMMENT ON COLUMN public.linkpay_logs.workspace_id IS '工作空間 ID';
COMMENT ON COLUMN public.linkpay_logs.receipt_id IS '關聯收款單';
COMMENT ON COLUMN public.linkpay_logs.link_id IS 'LinkPay 連結 ID';
COMMENT ON COLUMN public.linkpay_logs.action IS '操作類型';
COMMENT ON COLUMN public.linkpay_logs.status IS '狀態';
COMMENT ON COLUMN public.linkpay_logs.request_data IS '請求資料';
COMMENT ON COLUMN public.linkpay_logs.response_data IS '回應資料';
COMMENT ON COLUMN public.linkpay_logs.error_message IS '錯誤訊息';
COMMENT ON COLUMN public.linkpay_logs.sync_status IS '同步狀態';

-- 索引
CREATE INDEX IF NOT EXISTS idx_linkpay_logs_workspace_id ON public.linkpay_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_linkpay_logs_receipt_id ON public.linkpay_logs(receipt_id);
CREATE INDEX IF NOT EXISTS idx_linkpay_logs_link_id ON public.linkpay_logs(link_id);
CREATE INDEX IF NOT EXISTS idx_linkpay_logs_status ON public.linkpay_logs(status);
CREATE INDEX IF NOT EXISTS idx_linkpay_logs_created_at ON public.linkpay_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_linkpay_logs_sync_status ON public.linkpay_logs(sync_status);

-- 禁用 RLS（符合 Venturo 規範）
ALTER TABLE public.receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkpay_logs DISABLE ROW LEVEL SECURITY;

COMMIT;
