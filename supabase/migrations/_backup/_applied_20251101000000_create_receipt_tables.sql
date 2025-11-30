-- Migration: 建立收款單管理系統表格
-- Date: 2025-11-01
-- 說明: 建立收款單主表 (receipt_orders) 和收款項目表 (receipt_payment_items)

BEGIN;

-- ==========================================
-- 1. 建立收款單主表 (receipt_orders)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.receipt_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text NOT NULL UNIQUE,

  -- 分配模式
  allocation_mode text NOT NULL DEFAULT 'single' CHECK (allocation_mode IN ('single', 'multiple')),

  -- 單一訂單模式（向下相容）
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number text,
  tour_id uuid REFERENCES public.tours(id) ON DELETE SET NULL,
  code text,
  tour_name text,
  contact_person text,

  -- 批量分配模式（一筆款分多訂單）- 使用 JSONB 儲存
  order_allocations jsonb DEFAULT '[]'::jsonb,

  -- 共用欄位
  receipt_date date NOT NULL,
  total_amount numeric(12, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'confirmed', 'rejected')),
  note text,

  -- 審核資訊
  created_by uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  confirmed_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  confirmed_at timestamptz,

  -- 系統欄位
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- 同步欄位（離線優先架構）
  _needs_sync boolean NOT NULL DEFAULT false,
  _synced_at timestamptz,
  _deleted boolean DEFAULT false
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_receipt_orders_receipt_number ON public.receipt_orders(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipt_orders_order_id ON public.receipt_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_receipt_orders_tour_id ON public.receipt_orders(tour_id);
CREATE INDEX IF NOT EXISTS idx_receipt_orders_receipt_date ON public.receipt_orders(receipt_date);
CREATE INDEX IF NOT EXISTS idx_receipt_orders_status ON public.receipt_orders(status);
CREATE INDEX IF NOT EXISTS idx_receipt_orders_created_by ON public.receipt_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_receipt_orders_created_at ON public.receipt_orders(created_at);

-- 建立 updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION update_receipt_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_receipt_orders_updated_at
  BEFORE UPDATE ON public.receipt_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_receipt_orders_updated_at();

-- 添加註釋
COMMENT ON TABLE public.receipt_orders IS '收款單主表';
COMMENT ON COLUMN public.receipt_orders.receipt_number IS '收款單號（例：REC-2024001）';
COMMENT ON COLUMN public.receipt_orders.allocation_mode IS '分配模式：single=單一訂單, multiple=批量分配';
COMMENT ON COLUMN public.receipt_orders.order_allocations IS '批量分配時的訂單列表（JSONB）';
COMMENT ON COLUMN public.receipt_orders.total_amount IS '總收款金額';
COMMENT ON COLUMN public.receipt_orders.status IS '收款狀態：received=已收款, confirmed=已確認, rejected=已拒絕';

-- ==========================================
-- 2. 建立收款項目表 (receipt_payment_items)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.receipt_payment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL REFERENCES public.receipt_orders(id) ON DELETE CASCADE,

  -- 收款資訊
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'card', 'check')),
  amount numeric(12, 2) NOT NULL,
  transaction_date date NOT NULL,

  -- 現金專用
  handler_name text,

  -- 匯款專用
  account_info text,
  fees numeric(12, 2) DEFAULT 0,

  -- 刷卡專用
  card_last_four text,
  auth_code text,

  -- 支票專用
  check_number text,
  check_bank text,
  check_due_date date,

  -- 備註
  note text,

  -- 系統欄位
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- 同步欄位（離線優先架構）
  _needs_sync boolean NOT NULL DEFAULT false,
  _synced_at timestamptz,
  _deleted boolean DEFAULT false
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_receipt_payment_items_receipt_id ON public.receipt_payment_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_payment_items_payment_method ON public.receipt_payment_items(payment_method);
CREATE INDEX IF NOT EXISTS idx_receipt_payment_items_transaction_date ON public.receipt_payment_items(transaction_date);

-- 建立 updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION update_receipt_payment_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_receipt_payment_items_updated_at
  BEFORE UPDATE ON public.receipt_payment_items
  FOR EACH ROW
  EXECUTE FUNCTION update_receipt_payment_items_updated_at();

-- 添加註釋
COMMENT ON TABLE public.receipt_payment_items IS '收款項目表（一張收款單可包含多個收款項目）';
COMMENT ON COLUMN public.receipt_payment_items.payment_method IS '收款方式：cash=現金, transfer=匯款, card=刷卡, check=支票';
COMMENT ON COLUMN public.receipt_payment_items.handler_name IS '經手人（現金收款時使用）';
COMMENT ON COLUMN public.receipt_payment_items.account_info IS '匯入帳戶（匯款時使用）';
COMMENT ON COLUMN public.receipt_payment_items.fees IS '手續費（匯款時使用）';
COMMENT ON COLUMN public.receipt_payment_items.card_last_four IS '卡號後四碼（刷卡時使用）';
COMMENT ON COLUMN public.receipt_payment_items.auth_code IS '授權碼（刷卡時使用）';
COMMENT ON COLUMN public.receipt_payment_items.check_number IS '支票號碼（支票時使用）';
COMMENT ON COLUMN public.receipt_payment_items.check_bank IS '開票銀行（支票時使用）';
COMMENT ON COLUMN public.receipt_payment_items.check_due_date IS '支票到期日（支票時使用）';

-- ==========================================
-- 3. 禁用 RLS（內部管理系統）
-- ==========================================

ALTER TABLE public.receipt_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_payment_items DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. 啟用 Realtime（即時同步）
-- ==========================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.receipt_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.receipt_payment_items;

COMMIT;
