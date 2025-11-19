-- 查詢 Carson 的 ID
DO $$
DECLARE
  carson_id UUID;
  quote_id UUID;
BEGIN
  -- 找 Carson 的 employee ID
  SELECT id INTO carson_id
  FROM employees
  WHERE chinese_name ILIKE '%Carson%' 
     OR email ILIKE '%carson%'
     OR display_name ILIKE '%Carson%'
  LIMIT 1;
  
  RAISE NOTICE 'Carson ID: %', carson_id;
  
  -- 找「沖繩」報價單的 ID
  SELECT id INTO quote_id
  FROM quotes
  WHERE (name ILIKE '%沖繩%' OR customer_name ILIKE '%沖繩%')
    AND quote_type = 'group'
    AND (name ILIKE '%聖誕%' OR name ILIKE '%日本%')
  ORDER BY created_at DESC
  LIMIT 1;
  
  RAISE NOTICE 'Quote ID: %', quote_id;
  
  -- 更新報價單的作者資訊
  IF carson_id IS NOT NULL AND quote_id IS NOT NULL THEN
    UPDATE quotes
    SET 
      created_by = carson_id,
      created_by_name = (SELECT COALESCE(display_name, chinese_name, email) FROM employees WHERE id = carson_id),
      updated_at = NOW()
    WHERE id = quote_id;
    
    RAISE NOTICE '已更新報價單作者為 Carson';
  ELSE
    RAISE NOTICE '找不到 Carson 或報價單';
  END IF;
END $$;
