-- 統一所有員工的 ID（employee.id = auth.users.id）
-- 不再需要對應表

-- 暫時停用外鍵檢查（允許更新主鍵）
SET session_replication_role = replica;

BEGIN;

-- 暫時停用唯一約束（避免重複 employee_number 衝突）
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_employee_number_key;

-- William: 677d2654... → 35880209...
UPDATE messages SET author_id = '35880209-77eb-4827-84e3-c4e2bc013825' WHERE author_id = '677d2654-a6dc-421c-913e-6228e7cd97cf';
UPDATE calendar_events SET owner_id = '35880209-77eb-4827-84e3-c4e2bc013825' WHERE owner_id = '677d2654-a6dc-421c-913e-6228e7cd97cf';
UPDATE calendar_events SET created_by = '35880209-77eb-4827-84e3-c4e2bc013825' WHERE created_by = '677d2654-a6dc-421c-913e-6228e7cd97cf';
UPDATE todos SET creator = '35880209-77eb-4827-84e3-c4e2bc013825' WHERE creator = '677d2654-a6dc-421c-913e-6228e7cd97cf';
UPDATE todos SET assignee = '35880209-77eb-4827-84e3-c4e2bc013825' WHERE assignee = '677d2654-a6dc-421c-913e-6228e7cd97cf';
UPDATE employees SET id = '35880209-77eb-4827-84e3-c4e2bc013825' WHERE id = '677d2654-a6dc-421c-913e-6228e7cd97cf';

-- liao00: 02333843... → 171a640e...
UPDATE messages SET author_id = '171a640e-e4a8-4fae-afe0-ca0ddf033d3d' WHERE author_id = '02333843-047e-42ba-831e-f0239301bbf9';
UPDATE calendar_events SET owner_id = '171a640e-e4a8-4fae-afe0-ca0ddf033d3d' WHERE owner_id = '02333843-047e-42ba-831e-f0239301bbf9';
UPDATE calendar_events SET created_by = '171a640e-e4a8-4fae-afe0-ca0ddf033d3d' WHERE created_by = '02333843-047e-42ba-831e-f0239301bbf9';
UPDATE todos SET creator = '171a640e-e4a8-4fae-afe0-ca0ddf033d3d' WHERE creator = '02333843-047e-42ba-831e-f0239301bbf9';
UPDATE todos SET assignee = '171a640e-e4a8-4fae-afe0-ca0ddf033d3d' WHERE assignee = '02333843-047e-42ba-831e-f0239301bbf9';
UPDATE employees SET id = '171a640e-e4a8-4fae-afe0-ca0ddf033d3d' WHERE id = '02333843-047e-42ba-831e-f0239301bbf9';

-- jess04: 5ac0f7f8... → e3c738be...
UPDATE messages SET author_id = 'e3c738be-ac54-4de0-8d2d-fc27f4283df4' WHERE author_id = '5ac0f7f8-90cd-4a73-b8d9-56f33f58dc00';
UPDATE calendar_events SET owner_id = 'e3c738be-ac54-4de0-8d2d-fc27f4283df4' WHERE owner_id = '5ac0f7f8-90cd-4a73-b8d9-56f33f58dc00';
UPDATE calendar_events SET created_by = 'e3c738be-ac54-4de0-8d2d-fc27f4283df4' WHERE created_by = '5ac0f7f8-90cd-4a73-b8d9-56f33f58dc00';
UPDATE todos SET creator = 'e3c738be-ac54-4de0-8d2d-fc27f4283df4' WHERE creator = '5ac0f7f8-90cd-4a73-b8d9-56f33f58dc00';
UPDATE todos SET assignee = 'e3c738be-ac54-4de0-8d2d-fc27f4283df4' WHERE assignee = '5ac0f7f8-90cd-4a73-b8d9-56f33f58dc00';
UPDATE employees SET id = 'e3c738be-ac54-4de0-8d2d-fc27f4283df4' WHERE id = '5ac0f7f8-90cd-4a73-b8d9-56f33f58dc00';

-- carson02: a7f2bed2... → fe1fff73...
UPDATE messages SET author_id = 'fe1fff73-98ea-4001-b5dc-2f15ec0bd16c' WHERE author_id = 'a7f2bed2-c6c9-4473-84e0-f0986838a247';
UPDATE calendar_events SET owner_id = 'fe1fff73-98ea-4001-b5dc-2f15ec0bd16c' WHERE owner_id = 'a7f2bed2-c6c9-4473-84e0-f0986838a247';
UPDATE calendar_events SET created_by = 'fe1fff73-98ea-4001-b5dc-2f15ec0bd16c' WHERE created_by = 'a7f2bed2-c6c9-4473-84e0-f0986838a247';
UPDATE todos SET creator = 'fe1fff73-98ea-4001-b5dc-2f15ec0bd16c' WHERE creator = 'a7f2bed2-c6c9-4473-84e0-f0986838a247';
UPDATE todos SET assignee = 'fe1fff73-98ea-4001-b5dc-2f15ec0bd16c' WHERE assignee = 'a7f2bed2-c6c9-4473-84e0-f0986838a247';
UPDATE employees SET id = 'fe1fff73-98ea-4001-b5dc-2f15ec0bd16c' WHERE id = 'a7f2bed2-c6c9-4473-84e0-f0986838a247';

-- yaping03: e1347c5f... → 779810fc...
UPDATE messages SET author_id = '779810fc-cf74-4008-b081-be41585c2e6b' WHERE author_id = 'e1347c5f-b868-48d2-bd62-300537c3f1a4';
UPDATE calendar_events SET owner_id = '779810fc-cf74-4008-b081-be41585c2e6b' WHERE owner_id = 'e1347c5f-b868-48d2-bd62-300537c3f1a4';
UPDATE calendar_events SET created_by = '779810fc-cf74-4008-b081-be41585c2e6b' WHERE created_by = 'e1347c5f-b868-48d2-bd62-300537c3f1a4';
UPDATE todos SET creator = '779810fc-cf74-4008-b081-be41585c2e6b' WHERE creator = 'e1347c5f-b868-48d2-bd62-300537c3f1a4';
UPDATE todos SET assignee = '779810fc-cf74-4008-b081-be41585c2e6b' WHERE assignee = 'e1347c5f-b868-48d2-bd62-300537c3f1a4';
UPDATE employees SET id = '779810fc-cf74-4008-b081-be41585c2e6b' WHERE id = 'e1347c5f-b868-48d2-bd62-300537c3f1a4';

-- 恢復唯一約束
ALTER TABLE employees ADD CONSTRAINT employees_employee_number_key UNIQUE (employee_number);

-- 刪除對應表（不再需要）
DROP TABLE IF EXISTS user_employee_mapping CASCADE;
DROP FUNCTION IF EXISTS get_current_employee_id();

-- 更新 RLS policies 使用 auth.uid()
DROP POLICY IF EXISTS todos_select ON todos;
DROP POLICY IF EXISTS todos_insert ON todos;
DROP POLICY IF EXISTS todos_update ON todos;
DROP POLICY IF EXISTS todos_delete ON todos;

CREATE POLICY todos_select ON todos FOR SELECT USING (creator = auth.uid() OR assignee = auth.uid());
CREATE POLICY todos_insert ON todos FOR INSERT WITH CHECK (creator = auth.uid());
CREATE POLICY todos_update ON todos FOR UPDATE USING (creator = auth.uid() OR assignee = auth.uid());
CREATE POLICY todos_delete ON todos FOR DELETE USING (creator = auth.uid());

-- 更新 calendar_events RLS
DROP POLICY IF EXISTS calendar_events_select ON calendar_events;

CREATE POLICY calendar_events_select ON calendar_events FOR SELECT USING (
  (visibility = 'personal' AND created_by = auth.uid())
  OR (visibility = 'company')
  OR (visibility = 'workspace' AND workspace_id = (SELECT workspace_id FROM employees WHERE id = auth.uid()))
  OR (visibility = 'company_wide')
);

COMMIT;

-- 恢復外鍵檢查
SET session_replication_role = DEFAULT;
