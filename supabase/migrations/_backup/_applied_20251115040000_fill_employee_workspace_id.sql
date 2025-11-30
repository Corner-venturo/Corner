-- 填充所有員工的 workspace_id
-- 將沒有 workspace_id 的員工設定為第一個 workspace（台北辦公室）

BEGIN;

DO $$
DECLARE
  default_workspace_id uuid;
  affected_count integer;
BEGIN
  -- 取得第一個 workspace（應該是台北辦公室）
  SELECT id INTO default_workspace_id
  FROM public.workspaces
  ORDER BY created_at
  LIMIT 1;

  IF default_workspace_id IS NULL THEN
    RAISE EXCEPTION '找不到任何 workspace，請先建立 workspace';
  END IF;

  -- 更新所有沒有 workspace_id 的員工
  UPDATE public.employees
  SET workspace_id = default_workspace_id
  WHERE workspace_id IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;

  RAISE NOTICE '✅ 已將 % 位員工設定為 workspace: %', affected_count, default_workspace_id;
END $$;

COMMIT;
