-- ============================================================
-- 啟用 RLS 策略
-- ============================================================

BEGIN;

-- ============================================================
-- 1. 完全隔離的表格（各看各的）
-- ============================================================

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select" ON public.orders
FOR SELECT TO authenticated
USING (workspace_id = get_current_user_workspace());

CREATE POLICY "orders_insert" ON public.orders
FOR INSERT TO authenticated
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "orders_update" ON public.orders
FOR UPDATE TO authenticated
USING (workspace_id = get_current_user_workspace())
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "orders_delete" ON public.orders
FOR DELETE TO authenticated
USING (workspace_id = get_current_user_workspace());

-- Itineraries
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "itineraries_select" ON public.itineraries
FOR SELECT TO authenticated
USING (workspace_id = get_current_user_workspace());

CREATE POLICY "itineraries_insert" ON public.itineraries
FOR INSERT TO authenticated
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "itineraries_update" ON public.itineraries
FOR UPDATE TO authenticated
USING (workspace_id = get_current_user_workspace())
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "itineraries_delete" ON public.itineraries
FOR DELETE TO authenticated
USING (workspace_id = get_current_user_workspace());

-- Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select" ON public.customers
FOR SELECT TO authenticated
USING (workspace_id = get_current_user_workspace());

CREATE POLICY "customers_insert" ON public.customers
FOR INSERT TO authenticated
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "customers_update" ON public.customers
FOR UPDATE TO authenticated
USING (workspace_id = get_current_user_workspace())
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "customers_delete" ON public.customers
FOR DELETE TO authenticated
USING (workspace_id = get_current_user_workspace());

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select" ON public.payments
FOR SELECT TO authenticated
USING (workspace_id = get_current_user_workspace());

CREATE POLICY "payments_insert" ON public.payments
FOR INSERT TO authenticated
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "payments_update" ON public.payments
FOR UPDATE TO authenticated
USING (workspace_id = get_current_user_workspace())
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "payments_delete" ON public.payments
FOR DELETE TO authenticated
USING (workspace_id = get_current_user_workspace());

-- Payment Requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_requests_select" ON public.payment_requests
FOR SELECT TO authenticated
USING (workspace_id = get_current_user_workspace());

CREATE POLICY "payment_requests_insert" ON public.payment_requests
FOR INSERT TO authenticated
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "payment_requests_update" ON public.payment_requests
FOR UPDATE TO authenticated
USING (workspace_id = get_current_user_workspace())
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "payment_requests_delete" ON public.payment_requests
FOR DELETE TO authenticated
USING (workspace_id = get_current_user_workspace());

-- Disbursement Orders
ALTER TABLE public.disbursement_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disbursement_orders_select" ON public.disbursement_orders
FOR SELECT TO authenticated
USING (workspace_id = get_current_user_workspace());

CREATE POLICY "disbursement_orders_insert" ON public.disbursement_orders
FOR INSERT TO authenticated
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "disbursement_orders_update" ON public.disbursement_orders
FOR UPDATE TO authenticated
USING (workspace_id = get_current_user_workspace())
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "disbursement_orders_delete" ON public.disbursement_orders
FOR DELETE TO authenticated
USING (workspace_id = get_current_user_workspace());

-- Employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select" ON public.employees
FOR SELECT TO authenticated
USING (workspace_id = get_current_user_workspace() OR is_admin());

CREATE POLICY "employees_insert" ON public.employees
FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "employees_update" ON public.employees
FOR UPDATE TO authenticated
USING (workspace_id = get_current_user_workspace() OR is_admin())
WITH CHECK (workspace_id = get_current_user_workspace() OR is_admin());

CREATE POLICY "employees_delete" ON public.employees
FOR DELETE TO authenticated
USING (is_admin());

-- ============================================================
-- 2. Tours（管理者能看全部）
-- ============================================================

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tours_select" ON public.tours
FOR SELECT TO authenticated
USING (workspace_id = get_current_user_workspace() OR is_admin());

CREATE POLICY "tours_insert" ON public.tours
FOR INSERT TO authenticated
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "tours_update" ON public.tours
FOR UPDATE TO authenticated
USING (workspace_id = get_current_user_workspace() OR is_admin())
WITH CHECK (workspace_id = get_current_user_workspace() OR is_admin());

CREATE POLICY "tours_delete" ON public.tours
FOR DELETE TO authenticated
USING (workspace_id = get_current_user_workspace() OR is_admin());

-- ============================================================
-- 3. Quotes（管理者分享機制）
-- ============================================================

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_select" ON public.quotes
FOR SELECT TO authenticated
USING (
  workspace_id = get_current_user_workspace() 
  OR 
  get_current_user_workspace() = ANY(shared_with_workspaces)
  OR
  is_admin()
);

CREATE POLICY "quotes_insert" ON public.quotes
FOR INSERT TO authenticated
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "quotes_update" ON public.quotes
FOR UPDATE TO authenticated
USING (workspace_id = get_current_user_workspace() OR is_admin())
WITH CHECK (workspace_id = get_current_user_workspace() OR is_admin());

CREATE POLICY "quotes_delete" ON public.quotes
FOR DELETE TO authenticated
USING (workspace_id = get_current_user_workspace() OR is_admin());

-- ============================================================
-- 4. Calendar Events（visibility 控制）
-- ============================================================

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_events_select" ON public.calendar_events
FOR SELECT TO authenticated
USING (
  CASE visibility
    WHEN 'private' THEN owner_id = auth.uid()
    WHEN 'workspace' THEN workspace_id = get_current_user_workspace()
    WHEN 'company_wide' THEN true
    ELSE false
  END
);

CREATE POLICY "calendar_events_insert" ON public.calendar_events
FOR INSERT TO authenticated
WITH CHECK (
  CASE
    WHEN visibility = 'company_wide' THEN is_admin()
    ELSE workspace_id = get_current_user_workspace()
  END
);

CREATE POLICY "calendar_events_update" ON public.calendar_events
FOR UPDATE TO authenticated
USING (
  owner_id = auth.uid()
  OR
  (visibility = 'company_wide' AND is_admin())
)
WITH CHECK (
  CASE
    WHEN visibility = 'company_wide' THEN is_admin()
    ELSE workspace_id = get_current_user_workspace()
  END
);

CREATE POLICY "calendar_events_delete" ON public.calendar_events
FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR is_admin());

-- ============================================================
-- 5. Channels（channel_members 控制）
-- ============================================================

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channels_select" ON public.channels
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channel_members
    WHERE channel_id = channels.id
    AND employee_id = get_current_employee_id()
  )
);

CREATE POLICY "channels_insert" ON public.channels
FOR INSERT TO authenticated
WITH CHECK (workspace_id = get_current_user_workspace() OR is_admin());

CREATE POLICY "channels_update" ON public.channels
FOR UPDATE TO authenticated
USING (
  workspace_id = get_current_user_workspace() 
  OR 
  is_admin()
);

CREATE POLICY "channels_delete" ON public.channels
FOR DELETE TO authenticated
USING (workspace_id = get_current_user_workspace() OR is_admin());

-- ============================================================
-- 6. Messages（跟著 channel 走）
-- ============================================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select" ON public.messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channels c
    INNER JOIN public.channel_members cm ON cm.channel_id = c.id
    WHERE c.id = messages.channel_id
    AND cm.employee_id = get_current_employee_id()
  )
);

CREATE POLICY "messages_insert" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.channels c
    INNER JOIN public.channel_members cm ON cm.channel_id = c.id
    WHERE c.id = messages.channel_id
    AND cm.employee_id = get_current_employee_id()
  )
);

CREATE POLICY "messages_update" ON public.messages
FOR UPDATE TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

CREATE POLICY "messages_delete" ON public.messages
FOR DELETE TO authenticated
USING (author_id = auth.uid() OR is_admin());

-- ============================================================
-- 7. Channel Members（管理者和頻道建立者可管理）
-- ============================================================

ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_members_select" ON public.channel_members
FOR SELECT TO authenticated
USING (
  employee_id = get_current_employee_id()
  OR
  is_admin()
);

CREATE POLICY "channel_members_insert" ON public.channel_members
FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "channel_members_delete" ON public.channel_members
FOR DELETE TO authenticated
USING (is_admin());

-- ============================================================
-- 8. Todos（個人）
-- ============================================================

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos_select" ON public.todos
FOR SELECT TO authenticated
USING (
  creator = auth.uid()
  OR
  assignee = get_current_employee_id()
);

CREATE POLICY "todos_insert" ON public.todos
FOR INSERT TO authenticated
WITH CHECK (creator = auth.uid());

CREATE POLICY "todos_update" ON public.todos
FOR UPDATE TO authenticated
USING (
  creator = auth.uid()
  OR
  assignee = get_current_employee_id()
)
WITH CHECK (
  creator = auth.uid()
  OR
  assignee = get_current_employee_id()
);

CREATE POLICY "todos_delete" ON public.todos
FOR DELETE TO authenticated
USING (creator = auth.uid());

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ RLS 策略啟用完成！';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '已啟用 RLS 的表格：';
  RAISE NOTICE '  完全隔離：';
  RAISE NOTICE '    - orders, itineraries, customers';
  RAISE NOTICE '    - payments, payment_requests, disbursement_orders';
  RAISE NOTICE '    - employees';
  RAISE NOTICE '';
  RAISE NOTICE '  條件共享：';
  RAISE NOTICE '    - tours (管理者能看全部)';
  RAISE NOTICE '    - quotes (管理者分享機制)';
  RAISE NOTICE '    - calendar_events (visibility 控制)';
  RAISE NOTICE '    - channels/messages (channel_members 控制)';
  RAISE NOTICE '    - todos (個人/指派)';
  RAISE NOTICE '';
END $$;
