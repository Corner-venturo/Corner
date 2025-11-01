-- 增強顧客表格：新增護照拼音和護照效期欄位
-- 整合舊專案 cornerERP 的護照資訊功能

BEGIN;

-- 新增護照拼音欄位（格式：姓氏/名字，例如：WANG/XIAOMING）
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS passport_romanization VARCHAR(100);

-- 新增護照效期欄位
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS passport_expiry_date DATE;

-- 新增欄位註釋
COMMENT ON COLUMN public.customers.passport_romanization IS '護照拼音（格式：姓氏/名字，例如：WANG/XIAOMING）';
COMMENT ON COLUMN public.customers.passport_expiry_date IS '護照效期';

-- 更新現有欄位註釋（確保一致性）
COMMENT ON COLUMN public.customers.passport_number IS '護照號碼';
COMMENT ON COLUMN public.customers.national_id IS '身份證字號';
COMMENT ON COLUMN public.customers.date_of_birth IS '出生日期';

COMMIT;

-- 驗證結果
DO $$
DECLARE
  romanization_exists BOOLEAN;
  expiry_exists BOOLEAN;
BEGIN
  -- 檢查欄位是否存在
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'customers'
    AND column_name = 'passport_romanization'
  ) INTO romanization_exists;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'customers'
    AND column_name = 'passport_expiry_date'
  ) INTO expiry_exists;

  IF romanization_exists AND expiry_exists THEN
    RAISE NOTICE '✅ customers 表格已成功擴充護照欄位';
  ELSE
    RAISE EXCEPTION '❌ 欄位新增失敗';
  END IF;
END $$;
