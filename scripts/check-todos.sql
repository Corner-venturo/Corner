-- 檢查 william 帳號的代辦事項

-- 1. 找到 william 的 user_id
SELECT
  id,
  display_name,
  email,
  employee_number
FROM employees
WHERE
  display_name ILIKE '%william%'
  OR email ILIKE '%william%'
  OR employee_number ILIKE '%william%'
LIMIT 5;

-- 2. 查看所有代辦事項的 creator 和 visibility
SELECT
  id,
  title,
  status,
  creator,
  assignee,
  visibility,
  created_at
FROM todos
ORDER BY created_at DESC
LIMIT 10;

-- 3. 統計代辦事項數量
SELECT
  COUNT(*) as total_todos,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
FROM todos;
