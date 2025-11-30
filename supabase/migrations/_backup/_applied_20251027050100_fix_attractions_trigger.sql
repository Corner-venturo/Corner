-- 修正 attractions 表的觸發器
-- 確保 update_updated_at_column 函數存在

BEGIN;

-- 創建或替換 updated_at 更新函數（如果不存在）
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
