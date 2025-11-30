-- ============================================
-- 簡化版 RLS 設定
-- ============================================
-- 執行方式：echo "Y" | SUPABASE_ACCESS_TOKEN=xxx npx supabase db push

BEGIN;

-- ============================================
-- Part 1: 為 Employees 加上 workspace_id
-- ============================================

-- Step 1.1: 新增 workspace_id 欄位
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS workspace_id uuid;

COMMENT ON COLUMN public.employees.workspace_id IS '員工所屬分公司 ID';

-- Step 1.2: 建立外鍵關聯
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employees_workspace_id_fkey'
  ) THEN
    ALTER TABLE public.employees
    ADD CONSTRAINT employees_workspace_id_fkey
    FOREIGN KEY (workspace_id)
    REFERENCES public.workspaces(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Step 1.3: 設定現有員工的預設 workspace
DO $$
DECLARE
  default_workspace_id text;
BEGIN
  SELECT id INTO default_workspace_id
  FROM public.workspaces
  ORDER BY created_at
  LIMIT 1;

  IF default_workspace_id IS NOT NULL THEN
    UPDATE public.employees
    SET workspace_id = default_workspace_id
    WHERE workspace_id IS NULL;

    RAISE NOTICE '✅ 已將所有員工設定為 workspace: %', default_workspace_id;
  END IF;
END $$;

-- Step 1.4: 建立索引
CREATE INDEX IF NOT EXISTS idx_employees_workspace_id
ON public.employees(workspace_id);

COMMIT;

-- ============================================
-- Part 2: Helper Functions
-- ============================================

BEGIN;

-- 設定當前 workspace
CREATE OR REPLACE FUNCTION public.set_current_workspace(workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_workspace_id', workspace_id::text, false);
END;
$$;

-- 取得當前 workspace
CREATE OR REPLACE FUNCTION public.get_current_workspace()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.current_workspace_id', true)::uuid;
$$;

-- 檢查使用者是否有跨公司權限
CREATE OR REPLACE FUNCTION public.has_cross_workspace_permission(
  target_workspace_id uuid,
  permission_type text DEFAULT 'can_view'
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_id_val uuid;
  has_permission boolean;
BEGIN
  -- 取得當前使用者 ID
  user_id_val := auth.uid();

  -- 檢查是否有該權限
  SELECT CASE permission_type
    WHEN 'can_view' THEN uwp.can_view
    WHEN 'can_edit' THEN uwp.can_edit
    WHEN 'can_delete' THEN uwp.can_delete
    WHEN 'can_manage_finance' THEN uwp.can_manage_finance
    ELSE false
  END INTO has_permission
  FROM public.user_workspace_permissions uwp
  WHERE uwp.user_id = user_id_val
    AND uwp.workspace_id = target_workspace_id
    AND uwp.is_active = true
    AND (uwp.expires_at IS NULL OR uwp.expires_at > now());

  RETURN COALESCE(has_permission, false);
END;
$$;

COMMIT;

-- ============================================
-- Part 3: 刪除所有舊的 Policies
-- ============================================

BEGIN;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

COMMIT;

-- ============================================
-- Part 4: 分類 A - 全公司共享（禁用 RLS）
-- ============================================

BEGIN;

-- 系統管理表格
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workspace_permissions DISABLE ROW LEVEL SECURITY;

-- 共享資源表格
ALTER TABLE public.bulletins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.airlines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- Part 5: 分類 B - 分公司隔離（啟用 RLS）
-- ============================================

BEGIN;

-- 旅遊團相關
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- 客戶相關
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

-- 財務相關（請款單、收款、出納都要分開）
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursement_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkpay_logs ENABLE ROW LEVEL SECURITY;

-- 合約與報價
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;

-- 供應商相關（採購、出納）
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

-- 簽證
ALTER TABLE public.visas ENABLE ROW LEVEL SECURITY;

-- eSIM
ALTER TABLE public.esims ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- Part 6: 分類 C - 特殊邏輯表格
-- ============================================

BEGIN;

-- Calendar Events (個人 OR 公司行程)
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Todos (個人 OR 被指派)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Channels (分公司 OR 被邀請)
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Canvas (個人)
ALTER TABLE public.personal_canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rich_documents ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- Part 7: 建立 RLS Policies - 標準資料隔離
-- ============================================

BEGIN;

-- 標準業務表格的 Policy（自己公司 OR 有跨公司查看權限）
DO $$
DECLARE
  tables text[] := ARRAY[
    'tours', 'orders', 'itineraries', 'itinerary_items', 'tour_participants', 'members',
    'customers', 'contacts', 'companies', 'company_contacts',
    'payments', 'payment_requests', 'payment_request_items', 'disbursement_orders',
    'receipt_orders', 'receipts', 'receipt_items', 'refunds', 'finance_requests', 'ledgers', 'linkpay_logs',
    'contracts', 'quotes', 'quote_items', 'confirmations',
    'disbursements', 'visas', 'esims'
  ];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- SELECT Policy: 自己公司 OR 有跨公司查看權限
    EXECUTE format(
      'CREATE POLICY "%s_select" ON public.%I FOR SELECT TO authenticated ' ||
      'USING (' ||
      '  workspace_id = get_current_workspace() OR ' ||
      '  has_cross_workspace_permission(workspace_id, ''can_view'')' ||
      ')',
      tbl, tbl
    );

    -- INSERT Policy: 只能在自己公司建立
    EXECUTE format(
      'CREATE POLICY "%s_insert" ON public.%I FOR INSERT TO authenticated ' ||
      'WITH CHECK (workspace_id = get_current_workspace())',
      tbl, tbl
    );

    -- UPDATE Policy: 自己公司 OR 有編輯權限
    EXECUTE format(
      'CREATE POLICY "%s_update" ON public.%I FOR UPDATE TO authenticated ' ||
      'USING (' ||
      '  workspace_id = get_current_workspace() OR ' ||
      '  has_cross_workspace_permission(workspace_id, ''can_edit'')' ||
      ')',
      tbl, tbl
    );

    -- DELETE Policy: 自己公司 OR 有刪除權限
    EXECUTE format(
      'CREATE POLICY "%s_delete" ON public.%I FOR DELETE TO authenticated ' ||
      'USING (' ||
      '  workspace_id = get_current_workspace() OR ' ||
      '  has_cross_workspace_permission(workspace_id, ''can_delete'')' ||
      ')',
      tbl, tbl
    );
  END LOOP;
END $$;

COMMIT;

-- ============================================
-- Part 8: 特殊 Policies - Calendar Events
-- ============================================

BEGIN;

-- Calendar Events: 個人行程 OR 公司行程
CREATE POLICY "calendar_events_select" ON public.calendar_events FOR SELECT TO authenticated
USING (
  -- 個人行程（如果有 is_personal 或 user_id 欄位）
  created_by = auth.uid()::text OR
  -- 公司行程（自己公司 OR 有跨公司權限）
  (workspace_id = get_current_workspace() OR has_cross_workspace_permission(workspace_id, 'can_view'))
);

CREATE POLICY "calendar_events_insert" ON public.calendar_events FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()::text OR
  workspace_id = get_current_workspace()
);

CREATE POLICY "calendar_events_update" ON public.calendar_events FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()::text OR
  workspace_id = get_current_workspace() OR
  has_cross_workspace_permission(workspace_id, 'can_edit')
);

CREATE POLICY "calendar_events_delete" ON public.calendar_events FOR DELETE TO authenticated
USING (
  created_by = auth.uid()::text OR
  workspace_id = get_current_workspace() OR
  has_cross_workspace_permission(workspace_id, 'can_delete')
);

COMMIT;

-- ============================================
-- Part 9: 特殊 Policies - Todos
-- ============================================

BEGIN;

-- Todos: 自己建立 OR 被指派 (同公司)
CREATE POLICY "todos_select" ON public.todos FOR SELECT TO authenticated
USING (
  created_by = auth.uid()::text OR
  assigned_to = auth.uid()::text OR
  (workspace_id = get_current_workspace() OR has_cross_workspace_permission(workspace_id, 'can_view'))
);

CREATE POLICY "todos_insert" ON public.todos FOR INSERT TO authenticated
WITH CHECK (workspace_id = get_current_workspace());

CREATE POLICY "todos_update" ON public.todos FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()::text OR
  assigned_to = auth.uid()::text OR
  workspace_id = get_current_workspace()
);

CREATE POLICY "todos_delete" ON public.todos FOR DELETE TO authenticated
USING (
  created_by = auth.uid()::text OR
  workspace_id = get_current_workspace()
);

-- Tasks (同 Todos)
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated
USING (
  created_by = auth.uid()::text OR
  assigned_to = auth.uid()::text OR
  workspace_id = get_current_workspace()
);

CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated
WITH CHECK (workspace_id = get_current_workspace());

CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()::text OR
  assigned_to = auth.uid()::text OR
  workspace_id = get_current_workspace()
);

CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE TO authenticated
USING (
  created_by = auth.uid()::text OR
  workspace_id = get_current_workspace()
);

COMMIT;

-- ============================================
-- Part 10: 特殊 Policies - Channels
-- ============================================

BEGIN;

-- Channels: 自己公司 OR 被邀請加入
CREATE POLICY "channels_select" ON public.channels FOR SELECT TO authenticated
USING (
  workspace_id = get_current_workspace() OR
  EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.channel_id = channels.id
      AND cm.user_id = auth.uid()::text
      AND cm.is_active = true
  )
);

CREATE POLICY "channels_insert" ON public.channels FOR INSERT TO authenticated
WITH CHECK (workspace_id = get_current_workspace());

CREATE POLICY "channels_update" ON public.channels FOR UPDATE TO authenticated
USING (workspace_id = get_current_workspace());

CREATE POLICY "channels_delete" ON public.channels FOR DELETE TO authenticated
USING (workspace_id = get_current_workspace());

-- Channel Groups
CREATE POLICY "channel_groups_select" ON public.channel_groups FOR SELECT TO authenticated
USING (workspace_id = get_current_workspace());

CREATE POLICY "channel_groups_insert" ON public.channel_groups FOR INSERT TO authenticated
WITH CHECK (workspace_id = get_current_workspace());

CREATE POLICY "channel_groups_update" ON public.channel_groups FOR UPDATE TO authenticated
USING (workspace_id = get_current_workspace());

CREATE POLICY "channel_groups_delete" ON public.channel_groups FOR DELETE TO authenticated
USING (workspace_id = get_current_workspace());

-- Channel Members (任何加入頻道的人都能看到成員)
CREATE POLICY "channel_members_select" ON public.channel_members FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_members.channel_id
      AND (
        c.workspace_id = get_current_workspace() OR
        EXISTS (
          SELECT 1 FROM public.channel_members cm2
          WHERE cm2.channel_id = c.id
            AND cm2.user_id = auth.uid()::text
            AND cm2.is_active = true
        )
      )
  )
);

CREATE POLICY "channel_members_insert" ON public.channel_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_members.channel_id
      AND c.workspace_id = get_current_workspace()
  )
);

CREATE POLICY "channel_members_delete" ON public.channel_members FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_members.channel_id
      AND c.workspace_id = get_current_workspace()
  )
);

-- Messages (只有頻道成員能看到)
CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = messages.channel_id
      AND (
        c.workspace_id = get_current_workspace() OR
        EXISTS (
          SELECT 1 FROM public.channel_members cm
          WHERE cm.channel_id = c.id
            AND cm.user_id = auth.uid()::text
            AND cm.is_active = true
        )
      )
  )
);

CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.channels c
    LEFT JOIN public.channel_members cm ON cm.channel_id = c.id AND cm.user_id = auth.uid()::text
    WHERE c.id = messages.channel_id
      AND (c.workspace_id = get_current_workspace() OR cm.is_active = true)
  )
);

CREATE POLICY "messages_update" ON public.messages FOR UPDATE TO authenticated
USING (sender_id = auth.uid()::text);

CREATE POLICY "messages_delete" ON public.messages FOR DELETE TO authenticated
USING (sender_id = auth.uid()::text);

COMMIT;

-- ============================================
-- Part 11: 特殊 Policies - Personal Canvas
-- ============================================

BEGIN;

-- Personal Canvases (個人的)
CREATE POLICY "personal_canvases_select" ON public.personal_canvases FOR SELECT TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "personal_canvases_insert" ON public.personal_canvases FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "personal_canvases_update" ON public.personal_canvases FOR UPDATE TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "personal_canvases_delete" ON public.personal_canvases FOR DELETE TO authenticated
USING (user_id = auth.uid()::text);

-- Rich Documents (個人 OR 公司)
CREATE POLICY "rich_documents_select" ON public.rich_documents FOR SELECT TO authenticated
USING (
  created_by = auth.uid()::text OR
  workspace_id = get_current_workspace()
);

CREATE POLICY "rich_documents_insert" ON public.rich_documents FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()::text OR
  workspace_id = get_current_workspace()
);

CREATE POLICY "rich_documents_update" ON public.rich_documents FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()::text OR
  workspace_id = get_current_workspace()
);

CREATE POLICY "rich_documents_delete" ON public.rich_documents FOR DELETE TO authenticated
USING (
  created_by = auth.uid()::text OR
  workspace_id = get_current_workspace()
);

COMMIT;

-- ============================================
-- Part 12: 驗證結果
-- ============================================

DO $$
DECLARE
  rls_enabled_count INTEGER;
  rls_disabled_count INTEGER;
  total_policies INTEGER;
  total_employees INTEGER;
  employees_with_workspace INTEGER;
BEGIN
  -- 統計 RLS 狀態
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public' AND c.relrowsecurity = true;

  SELECT COUNT(*) INTO rls_disabled_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public' AND c.relrowsecurity = false;

  -- 統計 Policies
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public';

  -- 統計員工資料
  SELECT COUNT(*) INTO total_employees FROM public.employees;
  SELECT COUNT(*) INTO employees_with_workspace
  FROM public.employees
  WHERE workspace_id IS NOT NULL;

  -- 輸出結果
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 簡化版 RLS 設定完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RLS 狀態：';
  RAISE NOTICE '  • RLS 啟用表格數：%', rls_enabled_count;
  RAISE NOTICE '  • RLS 停用表格數：%', rls_disabled_count;
  RAISE NOTICE '  • 總 Policies 數：%', total_policies;
  RAISE NOTICE '';
  RAISE NOTICE '👥 員工資料：';
  RAISE NOTICE '  • 總員工數：%', total_employees;
  RAISE NOTICE '  • 已設定 workspace：%', employees_with_workspace;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 設計特點：';
  RAISE NOTICE '  ✅ 供應商：全公司共享（保留 workspace_id 但不啟用 RLS）';
  RAISE NOTICE '  ✅ 請款單/收款/出納：分公司隔離';
  RAISE NOTICE '  ✅ Calendar：個人 + 公司行程';
  RAISE NOTICE '  ✅ Todos：個人 + 指派（同公司）';
  RAISE NOTICE '  ✅ Channels：分公司 + 邀請機制';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 跨分公司權限：';
  RAISE NOTICE '  • 在 /settings/permissions 勾選「允許查看其他分公司」';
  RAISE NOTICE '  • 支援查看/編輯/刪除/財務四種權限';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
