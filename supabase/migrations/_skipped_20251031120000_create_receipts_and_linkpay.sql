-- =============================================
-- 收款系統 & LinkPay 功能
-- =============================================
-- 建立日期: 2025-10-31
-- 功能: 收款單管理 + LinkPay 線上付款連結
-- =============================================

BEGIN;

-- =============================================
-- 1. receipts 表（收款單主表）
-- =============================================
CREATE TABLE IF NOT EXISTS public.receipts (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(20) UNIQUE NOT NULL,  -- 收款單號：R2501280001

  -- 關聯
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number VARCHAR(50),  -- 冗餘欄位，方便查詢和顯示
  tour_name VARCHAR(255),     -- 冗餘欄位

  -- 收款資訊
  receipt_date DATE NOT NULL,                      -- 收款日期
  receipt_type INTEGER NOT NULL,                   -- 收款方式：0:匯款 1:現金 2:刷卡 3:支票 4:LinkPay
  receipt_amount DECIMAL(10,2) NOT NULL,           -- 應收金額（預期收的）
  actual_amount DECIMAL(10,2) DEFAULT 0,           -- 實收金額（實際收到的）

  -- 收款方式相關欄位
  receipt_account VARCHAR(255),                    -- 付款人姓名/收款帳號
  email VARCHAR(255),                              -- Email（LinkPay 用）
  payment_name VARCHAR(255),                       -- 付款名稱（LinkPay 客戶看到的標題）
  pay_dateline DATE,                               -- 付款截止日（LinkPay 用）

  -- 現金/匯款/刷卡/支票 相關欄位
  handler_name VARCHAR(100),                       -- 經手人（現金用）
  account_info VARCHAR(255),                       -- 匯入帳戶（匯款用）
  fees DECIMAL(10,2),                              -- 手續費（匯款用）
  card_last_four VARCHAR(4),                       -- 卡號後四碼（刷卡用）
  auth_code VARCHAR(50),                           -- 授權碼（刷卡用）
  check_number VARCHAR(50),                        -- 支票號碼
  check_bank VARCHAR(100),                         -- 開票銀行

  -- 狀態
  status INTEGER DEFAULT 0,                        -- 0:待確認 1:已確認 2:異常
  note TEXT,                                       -- 備註

  -- 系統欄位
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 2. linkpay_logs 表（LinkPay 連結記錄）
-- =============================================
CREATE TABLE IF NOT EXISTS public.linkpay_logs (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 關聯
  receipt_number VARCHAR(20) NOT NULL REFERENCES public.receipts(receipt_number) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- LinkPay 資訊
  linkpay_order_number VARCHAR(50) UNIQUE,         -- LinkPay 訂單號（API 返回）
  price DECIMAL(10,2) NOT NULL,                    -- 金額
  end_date DATE,                                   -- 付款截止日
  link TEXT,                                       -- 付款連結
  status INTEGER DEFAULT 0,                        -- 0:待付款 1:已付款 2:失敗 3:過期
  payment_name VARCHAR(255),                       -- 付款名稱（客戶看到的）

  -- 系統欄位
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- 3. 索引
-- =============================================

-- receipts 索引
CREATE INDEX IF NOT EXISTS idx_receipts_workspace ON public.receipts(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_order ON public.receipts(order_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_date ON public.receipts(receipt_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_type ON public.receipts(receipt_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_number ON public.receipts(receipt_number);

-- linkpay_logs 索引
CREATE INDEX IF NOT EXISTS idx_linkpay_workspace ON public.linkpay_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_linkpay_receipt ON public.linkpay_logs(receipt_number);
CREATE INDEX IF NOT EXISTS idx_linkpay_status ON public.linkpay_logs(status);
CREATE INDEX IF NOT EXISTS idx_linkpay_order_number ON public.linkpay_logs(linkpay_order_number);

-- =============================================
-- 4. 註釋
-- =============================================

-- receipts 表註釋
COMMENT ON TABLE public.receipts IS '收款單主表';
COMMENT ON COLUMN public.receipts.receipt_number IS '收款單號，格式：R{年2碼}{月2碼}{日2碼}{流水號4位}，例如：R2501280001';
COMMENT ON COLUMN public.receipts.receipt_type IS '收款方式：0=匯款, 1=現金, 2=刷卡, 3=支票, 4=LinkPay';
COMMENT ON COLUMN public.receipts.receipt_amount IS '應收金額（預期收的）';
COMMENT ON COLUMN public.receipts.actual_amount IS '實收金額（會計確認實際收到的）';
COMMENT ON COLUMN public.receipts.status IS '狀態：0=待確認, 1=已確認, 2=異常';
COMMENT ON COLUMN public.receipts.payment_name IS 'LinkPay 付款名稱（客戶在付款頁面看到的標題）';
COMMENT ON COLUMN public.receipts.receipt_account IS '付款人姓名（內部備註）或收款帳號';

-- linkpay_logs 表註釋
COMMENT ON TABLE public.linkpay_logs IS 'LinkPay 付款連結記錄';
COMMENT ON COLUMN public.linkpay_logs.linkpay_order_number IS 'LinkPay 訂單號（外部 API 返回）';
COMMENT ON COLUMN public.linkpay_logs.status IS '付款狀態：0=待付款, 1=已付款, 2=失敗, 3=過期';
COMMENT ON COLUMN public.linkpay_logs.link IS '付款連結（供客戶點擊）';

-- =============================================
-- 5. 禁用 RLS（內部系統）
-- =============================================
ALTER TABLE public.receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkpay_logs DISABLE ROW LEVEL SECURITY;

COMMIT;
