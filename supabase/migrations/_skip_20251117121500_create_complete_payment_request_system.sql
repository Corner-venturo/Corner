-- ============================================
-- 完整請款單系統
-- 建立日期：2025-11-17
-- ============================================

BEGIN;

-- ============================================
-- 1. 重建 payment_requests 主表（一張請款單）
-- ============================================

-- 先刪除舊表（如果資料不重要的話）
DROP TABLE IF EXISTS public.payment_requests CASCADE;

CREATE TABLE public.payment_requests (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 編號（例：PR20240001）
  code TEXT NOT NULL UNIQUE,

  -- 關聯資訊
  tour_id UUID REFERENCES public.tours(id) ON DELETE SET NULL,
  tour_code TEXT, -- 團號快照（例：CNX241225）
  tour_name TEXT, -- 團名快照

  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,

  -- 請款資訊
  request_date DATE NOT NULL, -- 主請款日期（預設每週四）
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0, -- 總金額（自動計算）

  -- 狀態
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'paid')),

  -- 備註
  notes TEXT,

  -- 預算警告
  budget_warning BOOLEAN DEFAULT false,

  -- 建立者
  created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,

  -- 工作空間
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_payment_requests_workspace_id ON public.payment_requests(workspace_id);
CREATE INDEX idx_payment_requests_tour_id ON public.payment_requests(tour_id);
CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX idx_payment_requests_request_date ON public.payment_requests(request_date);

COMMENT ON TABLE public.payment_requests IS '請款單主表（一張請款單可包含多筆項目）';
COMMENT ON COLUMN public.payment_requests.code IS '請款單編號（例：PR20240001）';
COMMENT ON COLUMN public.payment_requests.request_date IS '主請款日期（預設每週四）';
COMMENT ON COLUMN public.payment_requests.total_amount IS '總金額（自動從子項目加總）';

-- ============================================
-- 2. 建立 payment_request_items 子表（每筆請款項目）
-- ============================================

CREATE TABLE public.payment_request_items (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 所屬請款單
  request_id UUID NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,

  -- 項目編號（例：PR20240001-001）
  item_number TEXT NOT NULL,

  -- 分類
  category TEXT NOT NULL DEFAULT '其他' CHECK (category IN ('住宿', '交通', '餐食', '門票', '導遊', '其他')),

  -- 供應商
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL, -- 供應商名稱快照

  -- 金額資訊
  description TEXT NOT NULL, -- 項目說明
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(12, 2) NOT NULL, -- 小計 = unit_price * quantity

  -- 🆕 付款方式（每筆可獨立設定）
  payment_method TEXT DEFAULT 'transfer' CHECK (payment_method IN ('transfer', 'deposit', 'cash', 'check')),

  -- 🆕 個別請款時間（可覆寫主請款單時間）
  custom_request_date DATE, -- NULL = 使用主請款單的 request_date

  -- 備註
  notes TEXT, -- 縮短備註欄

  -- 排序
  sort_order INTEGER DEFAULT 0,

  -- 工作空間（冗餘欄位，方便查詢）
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_payment_request_items_request_id ON public.payment_request_items(request_id);
CREATE INDEX idx_payment_request_items_workspace_id ON public.payment_request_items(workspace_id);
CREATE INDEX idx_payment_request_items_supplier_id ON public.payment_request_items(supplier_id);
CREATE INDEX idx_payment_request_items_payment_method ON public.payment_request_items(payment_method);
CREATE INDEX idx_payment_request_items_custom_date ON public.payment_request_items(custom_request_date);

-- 確保同一請款單內項目編號唯一
CREATE UNIQUE INDEX idx_payment_request_items_unique_number ON public.payment_request_items(request_id, item_number);

COMMENT ON TABLE public.payment_request_items IS '請款項目子表（每筆獨立項目）';
COMMENT ON COLUMN public.payment_request_items.item_number IS '項目編號（例：001, 002）';
COMMENT ON COLUMN public.payment_request_items.payment_method IS '付款方式：transfer=轉帳, deposit=甲存, cash=現金, check=支票';
COMMENT ON COLUMN public.payment_request_items.custom_request_date IS '個別請款時間（NULL=使用主請款單時間）';
COMMENT ON COLUMN public.payment_request_items.notes IS '項目備註（精簡版）';

-- ============================================
-- 3. 自動更新 total_amount 觸發器
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

-- 當項目新增/修改/刪除時，自動更新主表總金額
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
-- 4. 自動更新 updated_at 觸發器
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_requests_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payment_request_items_updated_at
  BEFORE UPDATE ON public.payment_request_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. RLS 策略（已禁用，僅保留註解）
-- ============================================

-- Venturo 不使用 RLS，依賴前端 workspace_id 過濾
ALTER TABLE public.payment_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_request_items DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- 完成訊息
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ 完整請款單系統建立完成！';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '主表：payment_requests（請款單）';
  RAISE NOTICE '  - code: 請款單編號（PR20240001）';
  RAISE NOTICE '  - request_date: 主請款日期';
  RAISE NOTICE '  - total_amount: 自動加總';
  RAISE NOTICE '';
  RAISE NOTICE '子表：payment_request_items（請款項目）';
  RAISE NOTICE '  - item_number: 項目編號（001, 002...）';
  RAISE NOTICE '  - payment_method: 付款方式（轉帳/甲存/現金）';
  RAISE NOTICE '  - custom_request_date: 個別請款時間';
  RAISE NOTICE '';
  RAISE NOTICE '自動觸發器：';
  RAISE NOTICE '  ✅ 項目變更時自動更新總金額';
  RAISE NOTICE '  ✅ 自動更新 updated_at';
  RAISE NOTICE '';
END $$;
