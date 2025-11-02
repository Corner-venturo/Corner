-- =============================================
-- 擴充收款單系統：合併單表 + 多項目設計
-- =============================================
-- 建立日期: 2025-11-02
-- 功能:
--   1. 保留 GitHub 版本的 receipts 表（LinkPay、會計確認流程）
--   2. 新增 receipt_items 表（支援一張收款單多種收款方式）
--   3. 支援批量分配（一筆款分多訂單）
-- =============================================

BEGIN;

-- =============================================
-- 1. 新增 receipt_items 表（收款項目明細）
-- =============================================

CREATE TABLE IF NOT EXISTS public.receipt_items (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 關聯收款單
  receipt_number VARCHAR(20) NOT NULL,

  -- 收款資訊
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'card', 'check', 'linkpay')),
  amount DECIMAL(12, 2) NOT NULL,
  transaction_date DATE NOT NULL,

  -- 現金專用
  handler_name VARCHAR(100),

  -- 匯款專用
  account_info VARCHAR(255),
  fees DECIMAL(12, 2) DEFAULT 0,

  -- 刷卡專用
  card_last_four VARCHAR(4),
  auth_code VARCHAR(50),

  -- 支票專用
  check_number VARCHAR(50),
  check_bank VARCHAR(100),
  check_due_date DATE,

  -- 備註
  note TEXT,

  -- 系統欄位
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 離線同步欄位
  _needs_sync BOOLEAN NOT NULL DEFAULT false,
  _synced_at TIMESTAMPTZ,
  _deleted BOOLEAN DEFAULT false
);

-- 外鍵關聯
ALTER TABLE public.receipt_items
  ADD CONSTRAINT receipt_items_receipt_number_fkey
  FOREIGN KEY (receipt_number) REFERENCES public.receipts(receipt_number) ON DELETE CASCADE;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_number ON public.receipt_items(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipt_items_payment_method ON public.receipt_items(payment_method);
CREATE INDEX IF NOT EXISTS idx_receipt_items_transaction_date ON public.receipt_items(transaction_date);
CREATE INDEX IF NOT EXISTS idx_receipt_items_deleted ON public.receipt_items(_deleted) WHERE _deleted = false;

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_receipt_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_receipt_items_updated_at
  BEFORE UPDATE ON public.receipt_items
  FOR EACH ROW
  EXECUTE FUNCTION update_receipt_items_updated_at();

-- 註釋
COMMENT ON TABLE public.receipt_items IS '收款項目明細表（一張收款單可包含多個收款項目）';
COMMENT ON COLUMN public.receipt_items.payment_method IS '收款方式：cash=現金, transfer=匯款, card=刷卡, check=支票, linkpay=LinkPay';
COMMENT ON COLUMN public.receipt_items.handler_name IS '經手人（現金收款時使用）';
COMMENT ON COLUMN public.receipt_items.account_info IS '匯入帳戶（匯款時使用）';
COMMENT ON COLUMN public.receipt_items.fees IS '手續費（匯款時使用）';
COMMENT ON COLUMN public.receipt_items.card_last_four IS '卡號後四碼（刷卡時使用）';
COMMENT ON COLUMN public.receipt_items.auth_code IS '授權碼（刷卡時使用）';
COMMENT ON COLUMN public.receipt_items.check_number IS '支票號碼（支票時使用）';
COMMENT ON COLUMN public.receipt_items.check_bank IS '開票銀行（支票時使用）';
COMMENT ON COLUMN public.receipt_items.check_due_date IS '支票到期日（支票時使用）';

-- =============================================
-- 2. 新增批量分配欄位到 receipts 表
-- =============================================

-- allocation_mode: 分配模式（single=單一訂單, multiple=批量分配）
ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS allocation_mode VARCHAR(20) DEFAULT 'single'
  CHECK (allocation_mode IN ('single', 'multiple'));

-- order_allocations: 批量分配的訂單列表（JSONB）
-- 格式範例: [{"order_id": "uuid", "order_number": "O240001", "allocated_amount": 10000}, ...]
ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS order_allocations JSONB DEFAULT '[]'::jsonb;

-- 註釋
COMMENT ON COLUMN public.receipts.allocation_mode IS '分配模式：single=單一訂單, multiple=批量分配';
COMMENT ON COLUMN public.receipts.order_allocations IS '批量分配時的訂單列表（JSONB格式）';

-- =============================================
-- 3. 新增離線同步欄位到 receipts 表
-- =============================================

ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS _needs_sync BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS _synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT false;

-- 索引
CREATE INDEX IF NOT EXISTS idx_receipts_needs_sync ON public.receipts(_needs_sync) WHERE _needs_sync = true;
CREATE INDEX IF NOT EXISTS idx_receipts_deleted ON public.receipts(_deleted) WHERE _deleted = false;

-- =============================================
-- 4. 新增項目數量統計欄位（冗餘，但方便查詢）
-- =============================================

ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS items_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.receipts.items_count IS '收款項目數量（冗餘欄位，自動計算）';

-- 自動更新項目數量的函數
CREATE OR REPLACE FUNCTION update_receipt_items_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新對應收款單的項目數量
  UPDATE public.receipts
  SET items_count = (
    SELECT COUNT(*)
    FROM public.receipt_items
    WHERE receipt_number = COALESCE(NEW.receipt_number, OLD.receipt_number)
      AND (_deleted IS NULL OR _deleted = false)
  )
  WHERE receipt_number = COALESCE(NEW.receipt_number, OLD.receipt_number);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 觸發器：新增/更新/刪除項目時自動更新數量
DROP TRIGGER IF EXISTS trigger_update_receipt_items_count ON public.receipt_items;
CREATE TRIGGER trigger_update_receipt_items_count
  AFTER INSERT OR UPDATE OR DELETE ON public.receipt_items
  FOR EACH ROW
  EXECUTE FUNCTION update_receipt_items_count();

-- =============================================
-- 5. 禁用 RLS + 啟用 Realtime
-- =============================================

ALTER TABLE public.receipt_items DISABLE ROW LEVEL SECURITY;

-- 啟用 Realtime
DO $$
BEGIN
  -- 檢查 publication 是否存在
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- 嘗試加入表格（如果已存在會被忽略）
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.receipt_items;
    EXCEPTION WHEN duplicate_object THEN
      -- 表格已經在 publication 中，忽略錯誤
      NULL;
    END;
  END IF;
END $$;

-- =============================================
-- 6. 遷移現有資料（如果 receipts 表中有舊資料）
-- =============================================

-- 如果 receipt_type 有值，自動建立對應的 receipt_item
DO $$
DECLARE
  rec RECORD;
  payment_method_str TEXT;
BEGIN
  FOR rec IN
    SELECT
      receipt_number,
      receipt_type,
      receipt_amount,
      receipt_date,
      handler_name,
      account_info,
      fees,
      card_last_four,
      auth_code,
      check_number,
      check_bank
    FROM public.receipts
    WHERE receipt_type IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.receipt_items
        WHERE receipt_items.receipt_number = receipts.receipt_number
      )
  LOOP
    -- 轉換 receipt_type 到 payment_method
    payment_method_str := CASE rec.receipt_type
      WHEN 0 THEN 'transfer'
      WHEN 1 THEN 'cash'
      WHEN 2 THEN 'card'
      WHEN 3 THEN 'check'
      WHEN 4 THEN 'linkpay'
      ELSE 'cash'
    END;

    -- 建立對應的 receipt_item
    INSERT INTO public.receipt_items (
      receipt_number,
      payment_method,
      amount,
      transaction_date,
      handler_name,
      account_info,
      fees,
      card_last_four,
      auth_code,
      check_number,
      check_bank
    ) VALUES (
      rec.receipt_number,
      payment_method_str,
      rec.receipt_amount,
      rec.receipt_date,
      rec.handler_name,
      rec.account_info,
      rec.fees,
      rec.card_last_four,
      rec.auth_code,
      rec.check_number,
      rec.check_bank
    );
  END LOOP;
END $$;

-- =============================================
-- 7. 建立 View：簡化查詢
-- =============================================

-- 收款單完整視圖（包含項目明細）
CREATE OR REPLACE VIEW public.receipts_with_items AS
SELECT
  r.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', ri.id,
        'payment_method', ri.payment_method,
        'amount', ri.amount,
        'transaction_date', ri.transaction_date,
        'handler_name', ri.handler_name,
        'account_info', ri.account_info,
        'fees', ri.fees,
        'card_last_four', ri.card_last_four,
        'auth_code', ri.auth_code,
        'check_number', ri.check_number,
        'check_bank', ri.check_bank,
        'note', ri.note
      ) ORDER BY ri.created_at
    ) FILTER (WHERE ri.id IS NOT NULL),
    '[]'::json
  ) as items
FROM public.receipts r
LEFT JOIN public.receipt_items ri ON r.receipt_number = ri.receipt_number
  AND (ri._deleted IS NULL OR ri._deleted = false)
WHERE (r._deleted IS NULL OR r._deleted = false)
GROUP BY r.id, r.receipt_number;

COMMENT ON VIEW public.receipts_with_items IS '收款單完整視圖（包含所有收款項目）';

COMMIT;
