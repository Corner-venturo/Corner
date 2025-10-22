-- ============================================
-- 修正 Supabase Schema 以符合前端需求
-- ============================================

-- 1. quotes 表：新增 number_of_people 欄位
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS number_of_people INTEGER DEFAULT 0;

-- 更新現有資料：計算總人數
UPDATE quotes
SET number_of_people = COALESCE(adult_count, 0) + COALESCE(child_count, 0) + COALESCE(infant_count, 0)
WHERE number_of_people = 0 OR number_of_people IS NULL;

-- 2. quotes 表：新增其他前端需要的欄位
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS customer_id TEXT;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS group_size INTEGER DEFAULT 0;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS accommodation_days INTEGER;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS created_by TEXT;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS created_by_name TEXT;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS converted_to_tour BOOLEAN DEFAULT FALSE;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS tour_id TEXT;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::JSONB;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS versions JSONB DEFAULT '[]'::JSONB;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. employees 表：新增 email 和其他欄位
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS avatar TEXT;

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 為 email 建立唯一索引（如果不存在）
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email_unique ON employees(email) WHERE email IS NOT NULL;

-- 4. members 表：新增前端需要的欄位
ALTER TABLE members
ADD COLUMN IF NOT EXISTS name_en TEXT;

ALTER TABLE members
ADD COLUMN IF NOT EXISTS id_number TEXT;

ALTER TABLE members
ADD COLUMN IF NOT EXISTS passport_expiry DATE;

ALTER TABLE members
ADD COLUMN IF NOT EXISTS emergency_phone TEXT;

ALTER TABLE members
ADD COLUMN IF NOT EXISTS room_preference TEXT;

ALTER TABLE members
ADD COLUMN IF NOT EXISTS assigned_room TEXT;

ALTER TABLE members
ADD COLUMN IF NOT EXISTS reservation_code TEXT;

ALTER TABLE members
ADD COLUMN IF NOT EXISTS is_child_no_bed BOOLEAN DEFAULT FALSE;

ALTER TABLE members
ADD COLUMN IF NOT EXISTS add_ons TEXT[];

ALTER TABLE members
ADD COLUMN IF NOT EXISTS refunds TEXT[];

ALTER TABLE members
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE members
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 如果 english_name 存在，複製到 name_en
UPDATE members
SET name_en = english_name
WHERE name_en IS NULL AND english_name IS NOT NULL;

-- 5. tours 表：確保有 current_participants 和 is_active
ALTER TABLE tours
ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0;

ALTER TABLE tours
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 6. orders 表：確保有所有前端需要的欄位
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_number TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tour_name TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS sales_person TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS assistant TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(10, 2) DEFAULT 0;

-- 更新 order_number（如果是空的，使用 code）
UPDATE orders
SET order_number = code
WHERE order_number IS NULL OR order_number = '';

-- 更新 member_count（計算實際團員數）
UPDATE orders o
SET member_count = (
  SELECT COUNT(*)
  FROM members m
  WHERE m.order_id = o.id
)
WHERE member_count = 0;

-- 更新 remaining_amount
UPDATE orders
SET remaining_amount = COALESCE(total_amount, 0) - COALESCE(paid_amount, 0)
WHERE remaining_amount = 0;

-- 7. 建立缺失的索引
CREATE INDEX IF NOT EXISTS idx_quotes_number_of_people ON quotes(number_of_people);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tour_id ON quotes(tour_id);
CREATE INDEX IF NOT EXISTS idx_quotes_is_active ON quotes(is_active);

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);

CREATE INDEX IF NOT EXISTS idx_members_name_en ON members(name_en);
CREATE INDEX IF NOT EXISTS idx_members_id_number ON members(id_number);
CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active);

CREATE INDEX IF NOT EXISTS idx_tours_current_participants ON tours(current_participants);
CREATE INDEX IF NOT EXISTS idx_tours_is_active ON tours(is_active);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_member_count ON orders(member_count);

-- 完成
SELECT '✅ Schema 修正完成！' as result;
