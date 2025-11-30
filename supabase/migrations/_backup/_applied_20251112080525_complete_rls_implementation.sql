-- 完整的 RLS 策略實作
-- 基於 Workspace 的多租戶系統

BEGIN;

-- ============================================
-- 1. 建立輔助函數
-- ============================================

-- 取得當前用戶的 workspace_id
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT workspace_id 
    FROM employees 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查是否為超級管理員
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT 'super_admin' = ANY(permissions)
    FROM employees
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. 清除所有舊 policies
-- ============================================

DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.tablename || '_select', r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.tablename || '_insert', r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.tablename || '_update', r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.tablename || '_delete', r.tablename);
  END LOOP;
END $$;

-- ============================================
-- 3. Channels
-- ============================================

CREATE POLICY "channels_select" ON public.channels
  FOR SELECT USING (
    is_super_admin() OR 
    workspace_id = get_user_workspace_id()
  );

CREATE POLICY "channels_insert" ON public.channels
  FOR INSERT WITH CHECK (
    is_super_admin() OR 
    workspace_id = get_user_workspace_id()
  );

CREATE POLICY "channels_update" ON public.channels
  FOR UPDATE USING (
    is_super_admin() OR 
    workspace_id = get_user_workspace_id()
  );

CREATE POLICY "channels_delete" ON public.channels
  FOR DELETE USING (
    is_super_admin() OR 
    workspace_id = get_user_workspace_id()
  );

-- ============================================
-- 4. Channel Members
-- ============================================

CREATE POLICY "channel_members_select" ON public.channel_members
  FOR SELECT USING (
    is_super_admin() OR 
    workspace_id = get_user_workspace_id()
  );

CREATE POLICY "channel_members_insert" ON public.channel_members
  FOR INSERT WITH CHECK (
    is_super_admin() OR 
    workspace_id = get_user_workspace_id()
  );

CREATE POLICY "channel_members_update" ON public.channel_members
  FOR UPDATE USING (
    is_super_admin() OR 
    workspace_id = get_user_workspace_id()
  );

CREATE POLICY "channel_members_delete" ON public.channel_members
  FOR DELETE USING (
    is_super_admin() OR 
    workspace_id = get_user_workspace_id()
  );

-- ============================================
-- 5. Messages
-- ============================================

CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    is_super_admin() OR 
    channel_id IN (
      SELECT id FROM channels 
      WHERE workspace_id = get_user_workspace_id()
    )
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    is_super_admin() OR 
    channel_id IN (
      SELECT id FROM channels 
      WHERE workspace_id = get_user_workspace_id()
    )
  );

CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE USING (
    is_super_admin() OR 
    author_id = auth.uid()
  );

CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE USING (
    is_super_admin() OR 
    author_id = auth.uid()
  );

-- ============================================
-- 6. Todos - visibility based
-- ============================================

CREATE POLICY "todos_select" ON public.todos
  FOR SELECT USING (
    is_super_admin() OR
    creator = auth.uid() OR
    assignee = auth.uid() OR
    auth.uid()::text = ANY(visibility)
  );

CREATE POLICY "todos_insert" ON public.todos
  FOR INSERT WITH CHECK (
    is_super_admin() OR 
    creator = auth.uid()
  );

CREATE POLICY "todos_update" ON public.todos
  FOR UPDATE USING (
    is_super_admin() OR 
    creator = auth.uid() OR
    assignee = auth.uid()
  );

CREATE POLICY "todos_delete" ON public.todos
  FOR DELETE USING (
    is_super_admin() OR 
    creator = auth.uid()
  );

-- ============================================
-- 7-13. 其他 workspace 相關表格
-- ============================================

-- Tours
CREATE POLICY "tours_select" ON public.tours FOR SELECT USING (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "tours_insert" ON public.tours FOR INSERT WITH CHECK (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "tours_update" ON public.tours FOR UPDATE USING (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "tours_delete" ON public.tours FOR DELETE USING (is_super_admin() OR workspace_id = get_user_workspace_id());

-- Orders
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "orders_delete" ON public.orders FOR DELETE USING (is_super_admin() OR workspace_id = get_user_workspace_id());

-- Quotes
CREATE POLICY "quotes_select" ON public.quotes FOR SELECT USING (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "quotes_insert" ON public.quotes FOR INSERT WITH CHECK (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "quotes_update" ON public.quotes FOR UPDATE USING (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "quotes_delete" ON public.quotes FOR DELETE USING (is_super_admin() OR workspace_id = get_user_workspace_id());

-- Itineraries
CREATE POLICY "itineraries_select" ON public.itineraries FOR SELECT USING (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "itineraries_insert" ON public.itineraries FOR INSERT WITH CHECK (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "itineraries_update" ON public.itineraries FOR UPDATE USING (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "itineraries_delete" ON public.itineraries FOR DELETE USING (is_super_admin() OR workspace_id = get_user_workspace_id());

-- Calendar Events
CREATE POLICY "calendar_events_select" ON public.calendar_events FOR SELECT USING (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "calendar_events_insert" ON public.calendar_events FOR INSERT WITH CHECK (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "calendar_events_update" ON public.calendar_events FOR UPDATE USING (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "calendar_events_delete" ON public.calendar_events FOR DELETE USING (is_super_admin() OR workspace_id = get_user_workspace_id());

-- Customers
CREATE POLICY "customers_select" ON public.customers FOR SELECT USING (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "customers_insert" ON public.customers FOR INSERT WITH CHECK (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "customers_update" ON public.customers FOR UPDATE USING (is_super_admin() OR workspace_id = get_user_workspace_id());
CREATE POLICY "customers_delete" ON public.customers FOR DELETE USING (is_super_admin() OR workspace_id = get_user_workspace_id());

-- ============================================
-- 14-15. 共享資源（所有人可讀）
-- ============================================

-- Employees - 所有人可讀取，只能更新自己
CREATE POLICY "employees_select" ON public.employees FOR SELECT USING (true);
CREATE POLICY "employees_update" ON public.employees FOR UPDATE USING (is_super_admin() OR id = auth.uid());

-- Workspaces - 所有人可讀取，只有超管可更新
CREATE POLICY "workspaces_select" ON public.workspaces FOR SELECT USING (true);
CREATE POLICY "workspaces_update" ON public.workspaces FOR UPDATE USING (is_super_admin());

COMMIT;
