-- 同步顧客護照資料到訂單成員
-- 當 customers 表的護照資料更新時，自動同步到關聯的 order_members

BEGIN;

-- 建立同步函數
CREATE OR REPLACE FUNCTION sync_customer_passport_to_members()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在護照相關欄位變更時才同步
  IF (
    OLD.passport_number IS DISTINCT FROM NEW.passport_number OR
    OLD.passport_name IS DISTINCT FROM NEW.passport_name OR
    OLD.passport_expiry IS DISTINCT FROM NEW.passport_expiry OR
    OLD.passport_image_url IS DISTINCT FROM NEW.passport_image_url OR
    OLD.birth_date IS DISTINCT FROM NEW.birth_date OR
    OLD.gender IS DISTINCT FROM NEW.gender OR
    OLD.national_id IS DISTINCT FROM NEW.national_id
  ) THEN
    UPDATE public.order_members
    SET
      passport_number = COALESCE(NEW.passport_number, passport_number),
      passport_name = COALESCE(NEW.passport_name, passport_name),
      passport_expiry = COALESCE(NEW.passport_expiry, passport_expiry),
      passport_image_url = COALESCE(NEW.passport_image_url, passport_image_url),
      birth_date = COALESCE(NEW.birth_date, birth_date),
      gender = COALESCE(NEW.gender, gender),
      id_number = COALESCE(NEW.national_id, id_number)
    WHERE customer_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 移除舊的 trigger（如果存在）
DROP TRIGGER IF EXISTS trigger_sync_customer_passport ON public.customers;

-- 建立 trigger
CREATE TRIGGER trigger_sync_customer_passport
  AFTER UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION sync_customer_passport_to_members();

-- 加入註解
COMMENT ON FUNCTION sync_customer_passport_to_members() IS
  '當顧客護照資料更新時，自動同步到所有關聯的 order_members';

COMMIT;
