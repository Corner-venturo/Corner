-- 新增會員類型欄位到 customers 表
-- member_type: 'potential' (潛在客戶) | 'member' (普通會員) | 'vip' (VIP會員)

-- 1. 新增 member_type 欄位，預設為 'member'
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS member_type TEXT DEFAULT 'member';

-- 2. 建立 check constraint 確保只能是三種類型之一
ALTER TABLE customers
ADD CONSTRAINT customers_member_type_check
CHECK (member_type IN ('potential', 'member', 'vip'));

-- 3. 將所有現有客戶設為 'member' (普通會員)
UPDATE customers
SET member_type = 'member'
WHERE member_type IS NULL;

-- 4. 設定欄位為 NOT NULL（在所有資料都有值之後）
ALTER TABLE customers
ALTER COLUMN member_type SET NOT NULL;

-- 5. 新增索引以便快速篩選
CREATE INDEX IF NOT EXISTS idx_customers_member_type ON customers(member_type);

-- 說明：
-- potential: 潛在客戶（僅 Email 註冊，未綁定身分證）
-- member: 普通會員（已綁定身分證）
-- vip: VIP 會員（依消費金額/次數計算）
