-- 修正 William 的 supabase_user_id
-- 原因：登入的 auth.uid() 與員工表的 supabase_user_id 不匹配

UPDATE public.employees
SET supabase_user_id = '099a709d-ba03-4bcf-afa9-d6c332d7c052'
WHERE employee_number = 'E001' AND display_name = 'William';
