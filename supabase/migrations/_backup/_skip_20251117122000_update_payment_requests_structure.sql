-- ============================================
-- 更新請款單系統結構（保留現有資料）
-- 建立日期：2025-11-17
-- ============================================

BEGIN;

-- ============================================
-- 1. 更新 payment_requests 主表
-- ============================================

-- 新增缺失的欄位
ALTER TABLE public.payment_requests
ADD COLUMN IF NOT EXISTS request_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS tour_code TEXT,
ADD COLUMN IF NOT EXISTS tour_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS budget_warning BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- 添加外鍵
ALTER TABLE public.payment_requests
DROP CONSTRAINT IF EXISTS fk_payment_requests_created_by,
ADD CONSTRAINT fk_payment_requests_created_by
  FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.payment_requests
DROP CONSTRAINT IF EXISTS fk_payment_requests_workspace,
ADD CONSTRAINT fk_payment_requests_workspace
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 添加 check constraint
ALTER TABLE public.payment_requests
DROP CONSTRAINT IF EXISTS check_payment_requests_status;

ALTER TABLE public.payment_requests
ADD CONSTRAINT check_payment_requests_status
  CHECK (status IN ('pending', 'processing', 'confirmed', 'paid'));

-- ============================================
-- 2. 更新 payment_request_items 子表
-- ============================================

-- 檢查舊欄位，重命名或調整
ALTER TABLE public.payment_request_items
RENAME COLUMN IF EXISTS requestid TO request_id;

ALTER TABLE public.payment_request_items
RENAME COLUMN IF EXISTS itemname TO description;

ALTER TABLE public.payment_request_items
RENAME COLUMN IF EXISTS totalprice TO subtotal;

ALTER TABLE public.payment_request_items
RENAME COLUMN IF EXISTS createdat TO created_at;

-- 新增缺失的欄位
ALTER TABLE public.payment_request_items
ADD COLUMN IF NOT EXISTS item_number TEXT DEFAULT '001',
ADD COLUMN IF NOT EXISTS supplier_id UUID,
ADD COLUMN IF NOT EXISTS supplier_name TEXT DEFAULT '未指定',
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'transfer',
ADD COLUMN IF NOT EXISTS custom_request_date DATE,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS workspace_id UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 添加外鍵
ALTER TABLE public.payment_request_items
DROP CONSTRAINT IF EXISTS fk_payment_request_items_request,
ADD CONSTRAINT fk_payment_request_items_request
  FOREIGN KEY (request_id) REFERENCES public.payment_requests(id) ON DELETE CASCADE;

ALTER TABLE public.payment_request_items
DROP CONSTRAINT IF EXISTS fk_payment_request_items_supplier,
ADD CONSTRAINT fk_payment_request_items_supplier
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;

ALTER TABLE public.payment_request_items
DROP CONSTRAINT IF EXISTS fk_payment_request_items_workspace,
ADD CONSTRAINT fk_payment_request_items_workspace
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 添加 check constraint
ALTER TABLE public.payment_request_items
DROP CONSTRAINT IF EXISTS check_payment_request_items_payment_method;

ALTER TABLE public.payment_request_items
ADD CONSTRAINT check_payment_request_items_payment_method
  CHECK (payment_method IN ('transfer', 'deposit', 'cash', 'check'));

-- ============================================
-- 3. 建立索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payment_requests_workspace_id ON public.payment_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_tour_id ON public.payment_requests(tour_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_request_date ON public.payment_requests(request_date);

CREATE INDEX IF NOT EXISTS idx_payment_request_items_request_id ON public.payment_request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_payment_request_items_workspace_id ON public.payment_request_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payment_request_items_supplier_id ON public.payment_request_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_payment_request_items_payment_method ON public.payment_request_items(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_request_items_custom_date ON public.payment_request_items(custom_request_date);

-- 確保同一請款單內項目編號唯一
DROP INDEX IF EXISTS idx_payment_request_items_unique_number;
CREATE UNIQUE INDEX idx_payment_request_items_unique_number ON public.payment_request_items(request_id, item_number);

-- ============================================
-- 4. 自動更新 total_amount 觸發器
-- ============================================

CREATE OR REPLACE FUNCTION update_payment_request_total()
RETURNS TRIGGER AS $$
BEGIN
  -- 重新計算總金額
  UPDATE public.payment_requests
  SET
    total_amount = (
      SELECT COALESCE(SUM(subtotal), 0)
      FROM public.payment_request_items
      WHERE request_id = COALESCE(NEW.request_id, OLD.request_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.request_id, OLD.request_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 刪除舊觸發器（如果存在）
DROP TRIGGER IF EXISTS trigger_update_payment_request_total_on_insert ON public.payment_request_items;
DROP TRIGGER IF EXISTS trigger_update_payment_request_total_on_update ON public.payment_request_items;
DROP TRIGGER IF EXISTS trigger_update_payment_request_total_on_delete ON public.payment_request_items;

-- 重新建立觸發器
CREATE TRIGGER trigger_update_payment_request_total_on_insert
  AFTER INSERT ON public.payment_request_items
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_request_total();

CREATE TRIGGER trigger_update_payment_request_total_on_update
  AFTER UPDATE OF subtotal ON public.payment_request_items
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_request_total();

CREATE TRIGGER trigger_update_payment_request_total_on_delete
  AFTER DELETE ON public.payment_request_items
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_request_total();

-- ============================================
-- 5. 自動更新 updated_at 觸發器
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payment_requests_updated_at ON public.payment_requests;
DROP TRIGGER IF EXISTS trigger_payment_request_items_updated_at ON public.payment_request_items;

CREATE TRIGGER trigger_payment_requests_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payment_request_items_updated_at
  BEFORE UPDATE ON public.payment_request_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. RLS 策略（已禁用）
-- ============================================

ALTER TABLE public.payment_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_request_items DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. 註解
-- ============================================

COMMENT ON TABLE public.payment_requests IS '請款單主表（一張請款單可包含多筆項目）';
COMMENT ON COLUMN public.payment_requests.code IS '請款單編號（例：PR20240001）';
COMMENT ON COLUMN public.payment_requests.request_date IS '主請款日期（預設每週四）';
COMMENT ON COLUMN public.payment_requests.total_amount IS '總金額（自動從子項目加總）';

COMMENT ON TABLE public.payment_request_items IS '請款項目子表（每筆獨立項目）';
COMMENT ON COLUMN public.payment_request_items.item_number IS '項目編號（例：001, 002）';
COMMENT ON COLUMN public.payment_request_items.payment_method IS '付款方式：transfer=轉帳, deposit=甲存, cash=現金, check=支票';
COMMENT ON COLUMN public.payment_request_items.custom_request_date IS '個別請款時間（NULL=使用主請款單時間）';
COMMENT ON COLUMN public.payment_request_items.notes IS '項目備註（精簡版）';

COMMIT;

-- ============================================
-- 完成訊息
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ 請款單系統更新完成！';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ payment_requests 主表已更新';
  RAISE NOTICE '✅ payment_request_items 子表已更新';
  RAISE NOTICE '✅ 自動觸發器已建立';
  RAISE NOTICE '✅ 索引已建立';
  RAISE NOTICE '';
  RAISE NOTICE '新增欄位：';
  RAISE NOTICE '  - payment_method (付款方式)';
  RAISE NOTICE '  - custom_request_date (個別請款時間)';
  RAISE NOTICE '  - supplier_id / supplier_name';
  RAISE NOTICE '  - item_number (項目編號)';
  RAISE NOTICE '';
END $$;
