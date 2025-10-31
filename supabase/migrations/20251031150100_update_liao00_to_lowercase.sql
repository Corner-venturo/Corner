-- 將 LIAO00 改為 liao00（小寫）

BEGIN;

UPDATE public.employees
SET
  employee_number = 'liao00',
  display_name = 'liao00',
  updated_at = now()
WHERE employee_number = 'LIAO00';

COMMIT;

-- 驗證更新結果
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM public.employees
  WHERE employee_number = 'liao00';

  IF user_count > 0 THEN
    RAISE NOTICE '✅ 使用者名稱已更新為 liao00';
  ELSE
    RAISE EXCEPTION '❌ 更新失敗';
  END IF;
END $$;
