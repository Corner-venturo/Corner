-- ============================================================
-- 修正團號格式並加上前綴
-- 團號格式：OKA25122301 (11碼，無連字號)
-- 新格式：TP-OKA25122301
-- ============================================================

BEGIN;

-- 更新 Tours 的團號（正確的格式：11 碼無連字號）
UPDATE public.tours
SET code = 'TP-' || code
WHERE code IS NOT NULL
  AND code NOT LIKE 'TP-%'
  AND code NOT LIKE 'TC-%'
  AND code ~ '^[A-Z]{3}\d{8}$'  -- 格式：3個大寫字母 + 8個數字
  AND code != 'VISA2025001'     -- 排除特殊項目
  AND code != 'ESIM2025001';

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ 團號格式已修正並加上前綴！';
END $$;
