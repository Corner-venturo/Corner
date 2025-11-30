-- 創建 auth.users 和 employees 的 ID 對應表
-- 解決舊資料 ID 不一致的問題

BEGIN;

-- Step 1: 創建對應表
CREATE TABLE IF NOT EXISTS user_employee_mapping (
  auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id)
);

-- Step 2: 插入 William 的對應關係
INSERT INTO user_employee_mapping (auth_user_id, employee_id)
VALUES (
  '35880209-77eb-4827-84e3-c4e2bc013825',  -- Auth ID
  '677d2654-a6dc-421c-913e-6228e7cd97cf'   -- Employee ID
)
ON CONFLICT DO NOTHING;

-- Step 3: 創建輔助函數 - 從 auth.uid() 查詢對應的 employee.id
CREATE OR REPLACE FUNCTION get_current_employee_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- 優先查對應表，如果沒有就直接用 auth.uid()（新員工）
  SELECT COALESCE(
    (SELECT employee_id FROM user_employee_mapping WHERE auth_user_id = auth.uid()),
    auth.uid()
  );
$$;

-- Step 4: 重新啟用 todos RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Step 5: 刪除舊 policies
DROP POLICY IF EXISTS todos_select ON todos;
DROP POLICY IF EXISTS todos_insert ON todos;
DROP POLICY IF EXISTS todos_update ON todos;
DROP POLICY IF EXISTS todos_delete ON todos;

-- Step 6: 創建新 policies（使用輔助函數）
CREATE POLICY todos_select ON todos
FOR SELECT
USING (
  creator = get_current_employee_id()
  OR assignee = get_current_employee_id()
);

CREATE POLICY todos_insert ON todos
FOR INSERT
WITH CHECK (
  creator = get_current_employee_id()
);

CREATE POLICY todos_update ON todos
FOR UPDATE
USING (
  creator = get_current_employee_id()
  OR assignee = get_current_employee_id()
);

CREATE POLICY todos_delete ON todos
FOR DELETE
USING (
  creator = get_current_employee_id()
);

-- Step 7: 同樣處理 calendar_events RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_events_select ON calendar_events;

CREATE POLICY calendar_events_select ON calendar_events
FOR SELECT
USING (
  -- personal: 只有自己能看
  (visibility = 'personal' AND created_by = get_current_employee_id())
  OR
  -- company: 全公司都能看
  (visibility = 'company')
  OR
  -- workspace: 同 workspace 的人能看
  (visibility = 'workspace' AND workspace_id = (
    SELECT workspace_id FROM employees WHERE id = get_current_employee_id()
  ))
  OR
  -- company_wide: 全公司都能看
  (visibility = 'company_wide')
);

COMMIT;
