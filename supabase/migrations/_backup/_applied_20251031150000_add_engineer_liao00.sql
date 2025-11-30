-- 新增工程師使用者 LIAO00
-- 員工編號: LIAO00
-- 密碼: 83212711
-- 權限: admin (管理員，擁有所有權限)

BEGIN;

-- 插入使用者（使用預先計算的 bcrypt hash）
INSERT INTO public.employees (
  id,
  employee_number,
  display_name,
  chinese_name,
  email,
  password_hash,
  permissions,
  is_active,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'LIAO00',
  'LIAO00',
  'LIAO 工程師',
  'liao00@venturo.com',
  '$2b$10$w9tWhIfqwDytiNy.EtrOyuqBhubHJ8cFKw5ZHzPRKlUYpKDfgqeLW', -- 密碼: 83212711
  ARRAY['admin']::text[], -- 管理員權限
  true,
  'active',
  now(),
  now()
)
ON CONFLICT (employee_number) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  updated_at = now();

COMMIT;

-- 驗證插入結果
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM public.employees
  WHERE employee_number = 'LIAO00';

  IF user_count > 0 THEN
    RAISE NOTICE '✅ 使用者 LIAO00 建立成功';
  ELSE
    RAISE EXCEPTION '❌ 使用者 LIAO00 建立失敗';
  END IF;
END $$;
