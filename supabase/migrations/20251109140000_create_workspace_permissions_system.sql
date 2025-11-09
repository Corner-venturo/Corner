-- ============================================
-- 建立 Workspace 跨分公司權限系統
-- ============================================
-- 目的：允許特定管理員查看/編輯其他分公司的資料

BEGIN;

-- ============================================
-- Part 1: 建立權限表格
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_workspace_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id text NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- 權限類型
  can_view boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_manage_finance boolean DEFAULT false,

  -- 審計欄位
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,

  -- 備註
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- 唯一約束：同一個 user 對同一個 workspace 只能有一條記錄
  UNIQUE(user_id, workspace_id)
);

COMMENT ON TABLE public.user_workspace_permissions IS '跨 Workspace 權限管理';
COMMENT ON COLUMN public.user_workspace_permissions.can_view IS '可查看資料';
COMMENT ON COLUMN public.user_workspace_permissions.can_edit IS '可編輯資料';
COMMENT ON COLUMN public.user_workspace_permissions.can_delete IS '可刪除資料';
COMMENT ON COLUMN public.user_workspace_permissions.can_manage_finance IS '可管理財務資料';
COMMENT ON COLUMN public.user_workspace_permissions.expires_at IS '權限過期時間（可選）';

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_user_workspace_permissions_user_id
ON public.user_workspace_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_workspace_permissions_workspace_id
ON public.user_workspace_permissions(workspace_id);

CREATE INDEX IF NOT EXISTS idx_user_workspace_permissions_active
ON public.user_workspace_permissions(is_active)
WHERE is_active = true;

-- 禁用 RLS（權限表本身不需要隔離）
ALTER TABLE public.user_workspace_permissions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Part 2: Helper Functions
-- ============================================

-- 2.1 設定當前 workspace
CREATE OR REPLACE FUNCTION public.set_current_workspace(workspace_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_workspace_id', workspace_id, false);
END;
$$;

COMMENT ON FUNCTION public.set_current_workspace IS '設定當前 workspace ID（前端登入後呼叫）';

-- 2.2 檢查用戶是否有特定 workspace 的權限
CREATE OR REPLACE FUNCTION public.user_has_workspace_access(
  p_user_id uuid,
  p_workspace_id text,
  p_permission_type text DEFAULT 'view'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_permission boolean;
BEGIN
  SELECT
    CASE p_permission_type
      WHEN 'view' THEN can_view
      WHEN 'edit' THEN can_edit
      WHEN 'delete' THEN can_delete
      WHEN 'manage_finance' THEN can_manage_finance
      ELSE false
    END INTO has_permission
  FROM public.user_workspace_permissions
  WHERE user_id = p_user_id
    AND workspace_id = p_workspace_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());

  RETURN COALESCE(has_permission, false);
END;
$$;

-- 2.3 授權用戶跨 workspace 權限
CREATE OR REPLACE FUNCTION public.grant_workspace_access(
  p_target_user_id uuid,
  p_workspace_id text,
  p_can_view boolean DEFAULT true,
  p_can_edit boolean DEFAULT false,
  p_can_delete boolean DEFAULT false,
  p_can_manage_finance boolean DEFAULT false,
  p_expires_at timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_permission_id uuid;
  v_current_user_id uuid;
BEGIN
  -- 取得當前用戶 ID
  v_current_user_id := auth.uid();

  -- 插入或更新權限
  INSERT INTO public.user_workspace_permissions (
    user_id,
    workspace_id,
    can_view,
    can_edit,
    can_delete,
    can_manage_finance,
    granted_by,
    expires_at,
    notes,
    is_active
  ) VALUES (
    p_target_user_id,
    p_workspace_id,
    p_can_view,
    p_can_edit,
    p_can_delete,
    p_can_manage_finance,
    v_current_user_id,
    p_expires_at,
    p_notes,
    true
  )
  ON CONFLICT (user_id, workspace_id)
  DO UPDATE SET
    can_view = EXCLUDED.can_view,
    can_edit = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete,
    can_manage_finance = EXCLUDED.can_manage_finance,
    granted_by = EXCLUDED.granted_by,
    granted_at = now(),
    expires_at = EXCLUDED.expires_at,
    notes = EXCLUDED.notes,
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_permission_id;

  RETURN v_permission_id;
END;
$$;

COMMENT ON FUNCTION public.grant_workspace_access IS '授權用戶跨 workspace 存取權限';

-- 2.4 撤銷用戶跨 workspace 權限
CREATE OR REPLACE FUNCTION public.revoke_workspace_access(
  p_target_user_id uuid,
  p_workspace_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_workspace_permissions
  SET
    is_active = false,
    updated_at = now()
  WHERE user_id = p_target_user_id
    AND workspace_id = p_workspace_id;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.revoke_workspace_access IS '撤銷用戶跨 workspace 存取權限';

-- 2.5 取得用戶的所有跨 workspace 權限
CREATE OR REPLACE FUNCTION public.get_user_workspace_permissions(p_user_id uuid)
RETURNS TABLE (
  workspace_id text,
  workspace_name text,
  can_view boolean,
  can_edit boolean,
  can_delete boolean,
  can_manage_finance boolean,
  granted_by_name text,
  granted_at timestamptz,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    uwp.workspace_id,
    w.name as workspace_name,
    uwp.can_view,
    uwp.can_edit,
    uwp.can_delete,
    uwp.can_manage_finance,
    e.name as granted_by_name,
    uwp.granted_at,
    uwp.expires_at
  FROM public.user_workspace_permissions uwp
  LEFT JOIN public.workspaces w ON w.id = uwp.workspace_id
  LEFT JOIN public.employees e ON e.user_id = uwp.granted_by
  WHERE uwp.user_id = p_user_id
    AND uwp.is_active = true
    AND (uwp.expires_at IS NULL OR uwp.expires_at > now())
  ORDER BY uwp.granted_at DESC;
END;
$$;

-- ============================================
-- Part 3: 修改 RLS Policies（支援跨 workspace 權限）
-- ============================================

-- 先刪除所有舊的 workspace_isolation policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE 'workspace_isolation_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 建立新的 RLS Policies（支援跨 workspace 權限）
DO $$
DECLARE
  tables text[] := ARRAY[
    'tours', 'orders', 'itineraries', 'itinerary_items', 'tour_participants',
    'customers', 'contacts',
    'payments', 'refunds', 'receipts', 'finance_requests', 'ledgers', 'linkpay_logs',
    'contracts', 'quotes', 'confirmations',
    'suppliers', 'disbursements',
    'calendar_events', 'tasks', 'todos',
    'channels', 'channel_groups', 'channel_members', 'messages',
    'bulletins', 'esims', 'personal_canvases'
  ];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- SELECT 權限：自己的 workspace + 有 can_view 權限的 workspace
    EXECUTE format(
      'CREATE POLICY "workspace_access_%s_select" ON public.%I FOR SELECT TO authenticated ' ||
      'USING (' ||
      '  workspace_id = current_setting(''app.current_workspace_id'', true)::text ' ||
      '  OR ' ||
      '  EXISTS (' ||
      '    SELECT 1 FROM public.user_workspace_permissions uwp ' ||
      '    WHERE uwp.user_id = auth.uid() ' ||
      '    AND uwp.workspace_id = %I.workspace_id ' ||
      '    AND uwp.can_view = true ' ||
      '    AND uwp.is_active = true ' ||
      '    AND (uwp.expires_at IS NULL OR uwp.expires_at > now())' ||
      '  )' ||
      ')',
      tbl, tbl, tbl
    );

    -- INSERT 權限：只能在自己的 workspace 新增
    EXECUTE format(
      'CREATE POLICY "workspace_access_%s_insert" ON public.%I FOR INSERT TO authenticated ' ||
      'WITH CHECK (workspace_id = current_setting(''app.current_workspace_id'', true)::text)',
      tbl, tbl
    );

    -- UPDATE 權限：自己的 workspace + 有 can_edit 權限的 workspace
    EXECUTE format(
      'CREATE POLICY "workspace_access_%s_update" ON public.%I FOR UPDATE TO authenticated ' ||
      'USING (' ||
      '  workspace_id = current_setting(''app.current_workspace_id'', true)::text ' ||
      '  OR ' ||
      '  EXISTS (' ||
      '    SELECT 1 FROM public.user_workspace_permissions uwp ' ||
      '    WHERE uwp.user_id = auth.uid() ' ||
      '    AND uwp.workspace_id = %I.workspace_id ' ||
      '    AND uwp.can_edit = true ' ||
      '    AND uwp.is_active = true ' ||
      '    AND (uwp.expires_at IS NULL OR uwp.expires_at > now())' ||
      '  )' ||
      ')',
      tbl, tbl, tbl
    );

    -- DELETE 權限：自己的 workspace + 有 can_delete 權限的 workspace
    EXECUTE format(
      'CREATE POLICY "workspace_access_%s_delete" ON public.%I FOR DELETE TO authenticated ' ||
      'USING (' ||
      '  workspace_id = current_setting(''app.current_workspace_id'', true)::text ' ||
      '  OR ' ||
      '  EXISTS (' ||
      '    SELECT 1 FROM public.user_workspace_permissions uwp ' ||
      '    WHERE uwp.user_id = auth.uid() ' ||
      '    AND uwp.workspace_id = %I.workspace_id ' ||
      '    AND uwp.can_delete = true ' ||
      '    AND uwp.is_active = true ' ||
      '    AND (uwp.expires_at IS NULL OR uwp.expires_at > now())' ||
      '  )' ||
      ')',
      tbl, tbl, tbl
    );
  END LOOP;
END $$;

COMMIT;

-- ============================================
-- 驗證結果
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE 'workspace_access_%';

  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE '✅ Workspace 權限系統建立完成！';
  RAISE NOTICE '======================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 統計：';
  RAISE NOTICE '  • RLS Policies 數量：% 個', policy_count;
  RAISE NOTICE '  • 支援的資料表：28 個';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 下一步：';
  RAISE NOTICE '  1. 前往人資管理系統設定跨分公司權限';
  RAISE NOTICE '  2. 使用 grant_workspace_access() 授權管理員';
  RAISE NOTICE '  3. 測試跨 workspace 資料查看功能';
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
END $$;
