-- ============================================================
-- 更新現有資料的編號，加上辦公室前綴
-- 所有現有資料都屬於台北辦公室（TP）
-- ============================================================

BEGIN;

-- 取得台北辦公室 ID
DO $$
DECLARE
  taipei_id uuid;
BEGIN
  SELECT id INTO taipei_id FROM public.workspaces WHERE code = 'TP' LIMIT 1;
  
  -- 1. 更新 Tours 的團號
  UPDATE public.tours
  SET code = 'TP-' || code
  WHERE workspace_id = taipei_id
    AND code IS NOT NULL
    AND code NOT LIKE 'TP-%'  -- 避免重複更新
    AND code NOT LIKE 'TC-%'
    -- 只更新真正的團號格式（不包含 VISA, ESIM 等特殊項目）
    AND code ~ '^[A-Z]{3}\d{8}-\d{2}$';
  
  -- 2. 更新 Quotes 的報價單號
  UPDATE public.quotes
  SET code = 'TP-' || code
  WHERE workspace_id = taipei_id
    AND code IS NOT NULL
    AND code NOT LIKE 'TP-%'
    AND code NOT LIKE 'TC-%'
    AND code ~ '^[A-Z]\d{3}$';  -- 格式：A001
  
  -- 3. 更新 Employees 的員工編號（如果是標準格式）
  -- 注意：現有員工使用自訂編號（yaping03, carson02...）
  -- 這些保留不動，未來新員工才使用 TP-E001 格式
  UPDATE public.employees
  SET employee_number = 'TP-' || employee_number
  WHERE workspace_id = taipei_id
    AND employee_number IS NOT NULL
    AND employee_number NOT LIKE 'TP-%'
    AND employee_number NOT LIKE 'TC-%'
    AND employee_number ~ '^E\d{3}$';  -- 只更新標準格式 E001
  
  -- 4. 更新 Receipts 的收款單號（如果有的話）
  UPDATE public.receipt_orders
  SET receipt_number = 'TP-' || receipt_number
  WHERE workspace_id = taipei_id
    AND receipt_number IS NOT NULL
    AND receipt_number NOT LIKE 'TP-%'
    AND receipt_number NOT LIKE 'TC-%'
    AND receipt_number ~ '^R\d{10}$';  -- 格式：R2501280001
    
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ 現有資料編號更新完成！';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '已更新的資料：';
  RAISE NOTICE '  - Tours: 加上 TP- 前綴';
  RAISE NOTICE '  - Quotes: 加上 TP- 前綴';
  RAISE NOTICE '  - Employees: 保留自訂編號';
  RAISE NOTICE '  - Receipts: 加上 TP- 前綴（如有）';
  RAISE NOTICE '';
END $$;

COMMIT;
