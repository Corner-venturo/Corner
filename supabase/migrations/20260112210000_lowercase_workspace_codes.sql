-- 將所有 workspace 代碼轉為小寫
-- 確保登入時的小寫查詢能正確匹配

UPDATE public.workspaces
SET code = LOWER(code)
WHERE code != LOWER(code);

-- 刷新 schema cache
NOTIFY pgrst, 'reload schema';
