-- ============================================================
-- RLS 欄位新增：quotes, calendar_events, employees, workspaces
-- ============================================================

BEGIN;

-- 1. Quotes: 加入分享欄位
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS shared_with_workspaces uuid[] DEFAULT '{}';

COMMENT ON COLUMN public.quotes.shared_with_workspaces IS '分享給哪些辦公室（只有管理者能設定）';

-- 2. Calendar Events: 加入可見度欄位
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'workspace' CHECK (visibility IN ('private', 'workspace', 'company_wide'));

COMMENT ON COLUMN public.calendar_events.visibility IS '
  private: 只有自己看得到
  workspace: 整個辦公室看得到
  company_wide: 全公司看得到（只有管理者能建立）
';

-- 3. Employees: 加入隱藏選單欄位
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS hidden_menu_items text[] DEFAULT '{}';

COMMENT ON COLUMN public.employees.hidden_menu_items IS '隱藏的選單項目 (例如: ["suppliers", "destinations"])';

-- 4. Workspaces: 加入付款設定欄位
ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS payment_config jsonb DEFAULT '{}';

COMMENT ON COLUMN public.workspaces.payment_config IS '
  付款設定，例如：
  {
    "linkpay": {
      "api_key": "xxx",
      "merchant_id": "yyy",
      "environment": "production"
    }
  }
';

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ RLS 欄位新增完成！';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '已新增的欄位：';
  RAISE NOTICE '  - quotes.shared_with_workspaces';
  RAISE NOTICE '  - calendar_events.visibility';
  RAISE NOTICE '  - employees.hidden_menu_items';
  RAISE NOTICE '  - workspaces.payment_config';
  RAISE NOTICE '';
END $$;
