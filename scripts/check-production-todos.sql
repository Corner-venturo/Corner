-- 檢查生產環境的代辦事項

-- 1. 找到所有員工（確認 william 的 ID）
SELECT
  id,
  display_name,
  email,
  employee_number,
  workspace_id
FROM employees
WHERE display_name ILIKE '%william%'
   OR email ILIKE '%william%'
ORDER BY created_at DESC;

-- 2. 查看所有代辦事項
SELECT
  id,
  title,
  status,
  creator,
  assignee,
  visibility,
  created_at,
  _deleted
FROM todos
WHERE _deleted IS NOT TRUE
ORDER BY created_at DESC
LIMIT 20;

-- 3. 統計代辦事項
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN _deleted = true THEN 1 END) as deleted
FROM todos;
