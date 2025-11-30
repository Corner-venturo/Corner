-- =============================================
-- 擴充 receipts 表支援 LinkPay 功能
-- =============================================
-- 建立日期: 2025-10-31
-- 功能: 在現有 receipts 表新增 LinkPay 相關欄位
-- =============================================

BEGIN;

-- =============================================
-- 1. 新增 workspace_id（必要欄位）
-- =============================================
-- 先新增為可 NULL，稍後填入預設值再改為 NOT NULL
ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- 為現有資料填入預設 workspace（假設只有一個 workspace）
DO $$
DECLARE
  default_workspace_id UUID;
BEGIN
  SELECT id INTO default_workspace_id FROM public.workspaces LIMIT 1;
  IF default_workspace_id IS NOT NULL THEN
    UPDATE public.receipts SET workspace_id = default_workspace_id WHERE workspace_id IS NULL;
  END IF;
END $$;

-- 現在設為 NOT NULL 並加上外鍵
ALTER TABLE public.receipts
  ALTER COLUMN workspace_id SET NOT NULL;

-- 只有在外鍵不存在時才建立
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'receipts_workspace_id_fkey'
  ) THEN
    ALTER TABLE public.receipts
      ADD CONSTRAINT receipts_workspace_id_fkey
      FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================
-- 2. 修改/新增現有欄位
-- =============================================

-- 確保 receipt_number 唯一且有索引
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'receipts_receipt_number_key'
  ) THEN
    ALTER TABLE public.receipts
      ADD CONSTRAINT receipts_receipt_number_key UNIQUE (receipt_number);
  END IF;
END $$;

-- 新增 order_number（冗餘欄位，方便查詢）
ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);

-- 新增 tour_name（冗餘欄位）
ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS tour_name VARCHAR(255);

-- =============================================
-- 3. 新增收款類型和金額欄位
-- =============================================

-- receipt_type: 收款方式（0:匯款 1:現金 2:刷卡 3:支票 4:LinkPay）
ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS receipt_type INTEGER;

-- 從 payment_method 轉換到 receipt_type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipts' AND column_name = 'payment_method'
  ) THEN
    UPDATE public.receipts
    SET receipt_type = CASE
      WHEN payment_method = '匯款' OR payment_method = 'bank_transfer' THEN 0
      WHEN payment_method = '現金' OR payment_method = 'cash' THEN 1
      WHEN payment_method = '刷卡' OR payment_method = 'credit_card' THEN 2
      WHEN payment_method = '支票' OR payment_method = 'check' THEN 3
      WHEN payment_method = 'LinkPay' OR payment_method = 'linkpay' THEN 4
      ELSE 1 -- 預設現金
    END
    WHERE receipt_type IS NULL;
  END IF;
END $$;

-- 設為 NOT NULL 且預設為 1（現金）
ALTER TABLE public.receipts
  ALTER COLUMN receipt_type SET DEFAULT 1;

UPDATE public.receipts SET receipt_type = 1 WHERE receipt_type IS NULL;

ALTER TABLE public.receipts
  ALTER COLUMN receipt_type SET NOT NULL;

-- receipt_amount: 應收金額（從 amount 複製）
ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS receipt_amount DECIMAL(10,2);

UPDATE public.receipts SET receipt_amount = amount WHERE receipt_amount IS NULL;

ALTER TABLE public.receipts
  ALTER COLUMN receipt_amount SET NOT NULL;

-- actual_amount: 實收金額（預設為 0）
ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS actual_amount DECIMAL(10,2) DEFAULT 0;

-- receipt_date: 從 payment_date 複製
ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS receipt_date DATE;

UPDATE public.receipts SET receipt_date = payment_date::DATE WHERE receipt_date IS NULL AND payment_date IS NOT NULL;

-- =============================================
-- 4. 新增 LinkPay 專用欄位
-- =============================================

ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS receipt_account VARCHAR(255),  -- 付款人姓名/帳號
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),            -- Email（LinkPay 用）
  ADD COLUMN IF NOT EXISTS payment_name VARCHAR(255),     -- 付款名稱（客戶看到的標題）
  ADD COLUMN IF NOT EXISTS pay_dateline DATE;             -- 付款截止日

-- =============================================
-- 5. 新增各收款方式的詳細欄位
-- =============================================

ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS handler_name VARCHAR(100),     -- 經手人（現金用）
  ADD COLUMN IF NOT EXISTS account_info VARCHAR(255),     -- 匯入帳戶（匯款用）
  ADD COLUMN IF NOT EXISTS fees DECIMAL(10,2),            -- 手續費（匯款用）
  ADD COLUMN IF NOT EXISTS card_last_four VARCHAR(4),     -- 卡號後四碼（刷卡用）
  ADD COLUMN IF NOT EXISTS auth_code VARCHAR(50),         -- 授權碼（刷卡用）
  ADD COLUMN IF NOT EXISTS check_number VARCHAR(50),      -- 支票號碼
  ADD COLUMN IF NOT EXISTS check_bank VARCHAR(100);       -- 開票銀行

-- =============================================
-- 6. 新增/修改系統欄位
-- =============================================

-- status 欄位處理（如果是 string 則轉換，如果不存在則建立）
DO $$
BEGIN
  -- 檢查 status 欄位的資料類型
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipts' AND column_name = 'status' AND data_type = 'character varying'
  ) THEN
    -- 是 string，需要轉換
    ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS status_new INTEGER DEFAULT 0;
    UPDATE public.receipts
    SET status_new = CASE
      WHEN status = 'confirmed' THEN 1
      WHEN status = 'pending' THEN 0
      WHEN status = 'error' THEN 2
      ELSE 0
    END;
    ALTER TABLE public.receipts DROP COLUMN status;
    ALTER TABLE public.receipts RENAME COLUMN status_new TO status;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipts' AND column_name = 'status'
  ) THEN
    -- 不存在，建立新欄位
    ALTER TABLE public.receipts ADD COLUMN status INTEGER DEFAULT 0;
  END IF;
  -- 如果已經是 INTEGER，則不做任何事
END $$;

-- note 欄位（如果還沒有）
ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS note TEXT;

-- created_by, updated_by
ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID;

-- =============================================
-- 7. 建立 linkpay_logs 表
-- =============================================

CREATE TABLE IF NOT EXISTS public.linkpay_logs (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 關聯
  receipt_number VARCHAR(20) NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- LinkPay 資訊
  linkpay_order_number VARCHAR(50) UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  end_date DATE,
  link TEXT,
  status INTEGER DEFAULT 0,  -- 0:待付款 1:已付款 2:失敗 3:過期
  payment_name VARCHAR(255),

  -- 系統欄位
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 外鍵關聯（安全地建立）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'linkpay_logs_receipt_number_fkey'
  ) THEN
    ALTER TABLE public.linkpay_logs
      ADD CONSTRAINT linkpay_logs_receipt_number_fkey
      FOREIGN KEY (receipt_number) REFERENCES public.receipts(receipt_number) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================
-- 8. 建立索引
-- =============================================

CREATE INDEX IF NOT EXISTS idx_receipts_workspace ON public.receipts(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_order ON public.receipts(order_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_date ON public.receipts(receipt_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_type ON public.receipts(receipt_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_number ON public.receipts(receipt_number);

CREATE INDEX IF NOT EXISTS idx_linkpay_workspace ON public.linkpay_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_linkpay_receipt ON public.linkpay_logs(receipt_number);
CREATE INDEX IF NOT EXISTS idx_linkpay_status ON public.linkpay_logs(status);
CREATE INDEX IF NOT EXISTS idx_linkpay_order_number ON public.linkpay_logs(linkpay_order_number);

-- =============================================
-- 9. 註釋
-- =============================================

COMMENT ON COLUMN public.receipts.receipt_number IS '收款單號，格式：R{年2碼}{月2碼}{日2碼}{流水號4位}，例如：R2501280001';
COMMENT ON COLUMN public.receipts.receipt_type IS '收款方式：0=匯款, 1=現金, 2=刷卡, 3=支票, 4=LinkPay';
COMMENT ON COLUMN public.receipts.receipt_amount IS '應收金額（預期收的）';
COMMENT ON COLUMN public.receipts.actual_amount IS '實收金額（會計確認實際收到的）';
COMMENT ON COLUMN public.receipts.status IS '狀態：0=待確認, 1=已確認, 2=異常';
COMMENT ON COLUMN public.receipts.payment_name IS 'LinkPay 付款名稱（客戶在付款頁面看到的標題）';
COMMENT ON COLUMN public.receipts.receipt_account IS '付款人姓名（內部備註）或收款帳號';

COMMENT ON TABLE public.linkpay_logs IS 'LinkPay 付款連結記錄';
COMMENT ON COLUMN public.linkpay_logs.linkpay_order_number IS 'LinkPay 訂單號（外部 API 返回）';
COMMENT ON COLUMN public.linkpay_logs.status IS '付款狀態：0=待付款, 1=已付款, 2=失敗, 3=過期';
COMMENT ON COLUMN public.linkpay_logs.link IS '付款連結（供客戶點擊）';

-- =============================================
-- 10. 禁用 RLS
-- =============================================

ALTER TABLE public.receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkpay_logs DISABLE ROW LEVEL SECURITY;

COMMIT;
