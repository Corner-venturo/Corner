-- 擴充訂單成員表格，新增完整的團員資料欄位
BEGIN;

-- 新增欄位
ALTER TABLE public.order_members
ADD COLUMN IF NOT EXISTS identity VARCHAR(50),           -- 身份（例如：大人、小孩、嬰兒）
ADD COLUMN IF NOT EXISTS chinese_name VARCHAR(100),      -- 中文姓名
ADD COLUMN IF NOT EXISTS passport_name VARCHAR(200),     -- 護照拼音
ADD COLUMN IF NOT EXISTS birth_date DATE,                -- 出生年月日
ADD COLUMN IF NOT EXISTS age INTEGER,                    -- 年齡
ADD COLUMN IF NOT EXISTS id_number VARCHAR(20),          -- 身分證號
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),             -- 性別
ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50),    -- 護照號碼
ADD COLUMN IF NOT EXISTS passport_expiry DATE,           -- 護照效期
ADD COLUMN IF NOT EXISTS special_meal VARCHAR(200),      -- 特殊餐食
ADD COLUMN IF NOT EXISTS pnr VARCHAR(50),                -- PNR
ADD COLUMN IF NOT EXISTS flight_cost DECIMAL(10, 2),     -- 機票費用
ADD COLUMN IF NOT EXISTS hotel_1_name VARCHAR(200),      -- 飯店名稱（1）
ADD COLUMN IF NOT EXISTS hotel_1_checkin DATE,           -- 入住日期（1）
ADD COLUMN IF NOT EXISTS hotel_1_checkout DATE,          -- 退房日期（1）
ADD COLUMN IF NOT EXISTS hotel_2_name VARCHAR(200),      -- 飯店名稱（2）
ADD COLUMN IF NOT EXISTS hotel_2_checkin DATE,           -- 入住日期（2）
ADD COLUMN IF NOT EXISTS hotel_2_checkout DATE,          -- 退房日期（2）
ADD COLUMN IF NOT EXISTS transport_cost DECIMAL(10, 2),  -- 車資費用
ADD COLUMN IF NOT EXISTS misc_cost DECIMAL(10, 2),       -- 雜支
ADD COLUMN IF NOT EXISTS total_payable DECIMAL(10, 2),   -- 應付金額
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2),  -- 訂金金額
ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(10, 2),  -- 尾款金額
ADD COLUMN IF NOT EXISTS deposit_receipt_no VARCHAR(50), -- 訂金收款單號
ADD COLUMN IF NOT EXISTS balance_receipt_no VARCHAR(50), -- 尾款收款單號
ADD COLUMN IF NOT EXISTS remarks TEXT,                   -- 備註
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2),      -- 成本價
ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10, 2),   -- 售價
ADD COLUMN IF NOT EXISTS profit DECIMAL(10, 2),          -- 利潤
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_order_members_order_id ON public.order_members(order_id);
CREATE INDEX IF NOT EXISTS idx_order_members_workspace_id ON public.order_members(workspace_id);

-- 新增註解
COMMENT ON COLUMN public.order_members.identity IS '身份（大人/小孩/嬰兒）';
COMMENT ON COLUMN public.order_members.chinese_name IS '中文姓名';
COMMENT ON COLUMN public.order_members.passport_name IS '護照拼音';
COMMENT ON COLUMN public.order_members.birth_date IS '出生年月日';
COMMENT ON COLUMN public.order_members.age IS '年齡';
COMMENT ON COLUMN public.order_members.id_number IS '身分證號';
COMMENT ON COLUMN public.order_members.gender IS '性別（M/F）';
COMMENT ON COLUMN public.order_members.passport_number IS '護照號碼';
COMMENT ON COLUMN public.order_members.passport_expiry IS '護照效期';
COMMENT ON COLUMN public.order_members.special_meal IS '特殊餐食';
COMMENT ON COLUMN public.order_members.pnr IS 'PNR代碼';
COMMENT ON COLUMN public.order_members.flight_cost IS '機票費用';
COMMENT ON COLUMN public.order_members.hotel_1_name IS '飯店名稱（1）';
COMMENT ON COLUMN public.order_members.hotel_1_checkin IS '入住日期（1）';
COMMENT ON COLUMN public.order_members.hotel_1_checkout IS '退房日期（1）';
COMMENT ON COLUMN public.order_members.hotel_2_name IS '飯店名稱（2）';
COMMENT ON COLUMN public.order_members.hotel_2_checkin IS '入住日期（2）';
COMMENT ON COLUMN public.order_members.hotel_2_checkout IS '退房日期（2）';
COMMENT ON COLUMN public.order_members.transport_cost IS '車資費用（共同分擔）';
COMMENT ON COLUMN public.order_members.misc_cost IS '雜支';
COMMENT ON COLUMN public.order_members.total_payable IS '應付金額';
COMMENT ON COLUMN public.order_members.deposit_amount IS '訂金金額';
COMMENT ON COLUMN public.order_members.balance_amount IS '尾款金額';
COMMENT ON COLUMN public.order_members.deposit_receipt_no IS '訂金收款單號';
COMMENT ON COLUMN public.order_members.balance_receipt_no IS '尾款收款單號';
COMMENT ON COLUMN public.order_members.remarks IS '備註';
COMMENT ON COLUMN public.order_members.cost_price IS '成本價';
COMMENT ON COLUMN public.order_members.selling_price IS '售價';
COMMENT ON COLUMN public.order_members.profit IS '利潤';

COMMIT;
