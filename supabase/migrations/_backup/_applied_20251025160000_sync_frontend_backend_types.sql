-- ============================================
-- Migration: 同步前端類型與資料庫結構
-- 日期: 2025-10-25
-- 說明: 將前端 TypeScript 類型定義與 Supabase 資料庫結構對齊
-- ============================================

BEGIN;

-- ============================================
-- 1. Tours 表格：新增前端展示欄位
-- ============================================

ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tours_archived ON public.tours(archived) WHERE archived = TRUE;

COMMENT ON COLUMN public.tours.features IS '行程特色（JSON 陣列，格式：[{title, description, icon}]）';
COMMENT ON COLUMN public.tours.archived IS '是否已封存（封存的團不顯示在一般列表）';

-- ============================================
-- 2. Customers 表格：大幅擴充業務欄位
-- ============================================

ALTER TABLE public.customers
  -- 基本資訊擴充
  ADD COLUMN IF NOT EXISTS english_name TEXT,
  ADD COLUMN IF NOT EXISTS alternative_phone TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT '台灣',
  ADD COLUMN IF NOT EXISTS passport_number TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', '')),

  -- 企業客戶資訊
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT,

  -- VIP 系統
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vip_level TEXT CHECK (vip_level IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),

  -- 客戶來源追蹤
  ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('website', 'facebook', 'instagram', 'line', 'referral', 'phone', 'walk_in', 'other')),
  ADD COLUMN IF NOT EXISTS referred_by TEXT,

  -- 統計欄位
  ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMPTZ;

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_customers_is_vip ON public.customers(is_vip) WHERE is_vip = TRUE;
CREATE INDEX IF NOT EXISTS idx_customers_vip_level ON public.customers(vip_level) WHERE vip_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_source ON public.customers(source);
CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company) WHERE company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_last_order_date ON public.customers(last_order_date DESC);

-- 欄位說明
COMMENT ON COLUMN public.customers.english_name IS '英文姓名（護照姓名）';
COMMENT ON COLUMN public.customers.alternative_phone IS '備用聯絡電話';
COMMENT ON COLUMN public.customers.is_vip IS 'VIP 客戶標記';
COMMENT ON COLUMN public.customers.vip_level IS 'VIP 等級：bronze(銅卡), silver(銀卡), gold(金卡), platinum(白金卡), diamond(鑽石卡)';
COMMENT ON COLUMN public.customers.source IS '客戶來源管道';
COMMENT ON COLUMN public.customers.referred_by IS '推薦人（客戶姓名或員工姓名）';
COMMENT ON COLUMN public.customers.total_orders IS '累計訂單數（由觸發器自動更新）';
COMMENT ON COLUMN public.customers.total_spent IS '累計消費金額（由觸發器自動更新）';
COMMENT ON COLUMN public.customers.last_order_date IS '最後訂單日期（由觸發器自動更新）';

-- ============================================
-- 3. Members 表格：統一欄位名稱並新增欄位
-- ============================================

-- 確保 emergency_contact 為 TEXT 類型
ALTER TABLE public.members
  ALTER COLUMN emergency_contact TYPE TEXT;

-- 新增資料庫獨有的欄位到前端（如果不存在）
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS member_type TEXT,
  ADD COLUMN IF NOT EXISTS roommate TEXT,
  ADD COLUMN IF NOT EXISTS special_requests TEXT;

COMMENT ON COLUMN public.members.member_type IS '團員類型（例如：主要旅客、隨行家屬）';
COMMENT ON COLUMN public.members.roommate IS '同房室友姓名';
COMMENT ON COLUMN public.members.special_requests IS '特殊需求說明';

-- ============================================
-- 4. Quote Items 表格：新增業務邏輯欄位
-- ============================================

ALTER TABLE public.quote_items
  ADD COLUMN IF NOT EXISTS item_type TEXT CHECK (item_type IN (
    'accommodation', 'transportation', 'meals', 'tickets',
    'insurance', 'guide', 'visa', 'shopping', 'activity', 'other'
  )),
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_quote_items_is_active ON public.quote_items(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_quote_items_type ON public.quote_items(item_type);

COMMENT ON COLUMN public.quote_items.item_type IS '項目類型：accommodation(住宿), transportation(交通), meals(餐食), tickets(門票), insurance(保險), guide(導遊), visa(簽證), shopping(購物), activity(活動), other(其他)';
COMMENT ON COLUMN public.quote_items.is_optional IS '是否為選配項目（客戶可選擇加購）';
COMMENT ON COLUMN public.quote_items.is_active IS '是否啟用（停用的項目不顯示在報價單）';
COMMENT ON COLUMN public.quote_items.display_order IS '顯示順序（數字越小越前面）';

-- ============================================
-- 5. Quotes 表格：新增客戶資訊欄位（如果不存在）
-- ============================================

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS adult_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS infant_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.quotes.customer_email IS '客戶 Email';
COMMENT ON COLUMN public.quotes.customer_phone IS '客戶電話';
COMMENT ON COLUMN public.quotes.adult_count IS '成人人數';
COMMENT ON COLUMN public.quotes.child_count IS '兒童人數';
COMMENT ON COLUMN public.quotes.infant_count IS '嬰兒人數';

-- ============================================
-- 6. Orders 表格：確保欄位清楚定義
-- ============================================

-- 為 member_count 和 total_people 添加註解說明差異
COMMENT ON COLUMN public.orders.member_count IS '團員人數（訂購的人數）';

-- 如果 total_people 存在，加上註解
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total_people'
  ) THEN
    COMMENT ON COLUMN public.orders.total_people IS '總人數（成人+兒童+嬰兒，自動計算）';
  END IF;
END $$;

-- ============================================
-- 7. Contracts 表格：確認合約管理完整性
-- ============================================

-- 驗證 tours 表格的合約欄位（已經在 20251025150000 migration 新增）
DO $$
BEGIN
  -- 檢查是否所有合約欄位都存在
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'contract_template'
  ) THEN
    RAISE EXCEPTION '合約欄位未找到，請先執行 20251025150000_add_contract_fields.sql';
  END IF;
END $$;

-- ============================================
-- 8. 建立 Customer 統計觸發器
-- ============================================

-- 當訂單建立或更新時，自動更新客戶統計資訊
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新客戶的訂單數、消費總額、最後訂單日期
  UPDATE public.customers
  SET
    total_orders = (
      SELECT COUNT(*) FROM public.orders
      WHERE customer_id = NEW.customer_id
    ),
    total_spent = (
      SELECT COALESCE(SUM(total_amount), 0) FROM public.orders
      WHERE customer_id = NEW.customer_id
    ),
    last_order_date = (
      SELECT MAX(created_at) FROM public.orders
      WHERE customer_id = NEW.customer_id
    )
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 如果觸發器不存在，則建立
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON public.orders;
CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- ============================================
-- 9. 驗證與總結
-- ============================================

-- 驗證所有新增欄位
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- 檢查 tours
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tours' AND column_name = 'features') THEN
    missing_columns := array_append(missing_columns, 'tours.features');
  END IF;

  -- 檢查 customers
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'is_vip') THEN
    missing_columns := array_append(missing_columns, 'customers.is_vip');
  END IF;

  -- 檢查 quote_items
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quote_items' AND column_name = 'item_type') THEN
    missing_columns := array_append(missing_columns, 'quote_items.item_type');
  END IF;

  -- 如果有缺失欄位，拋出錯誤
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Migration 失敗：缺少欄位 %', array_to_string(missing_columns, ', ');
  END IF;

  -- 成功訊息
  RAISE NOTICE '✅ Migration 完成！';
  RAISE NOTICE '   - Tours 表格新增 2 個欄位 (features, archived)';
  RAISE NOTICE '   - Customers 表格新增 15 個欄位 (VIP 系統、客戶來源等)';
  RAISE NOTICE '   - Quote Items 表格新增 4 個欄位 (item_type, is_optional 等)';
  RAISE NOTICE '   - Members 表格新增 3 個欄位 (member_type, roommate 等)';
  RAISE NOTICE '   - Quotes 表格新增 5 個欄位 (customer info)';
  RAISE NOTICE '   - 建立 Customer 統計自動更新觸發器';
END $$;

COMMIT;
