-- =====================================================
-- 補齊缺少的 workspace_id 索引
-- 建立日期：2025-11-17
-- 目的：改善查詢效能
-- =====================================================

BEGIN;

-- 補齊索引（IF NOT EXISTS 避免重複建立）
CREATE INDEX IF NOT EXISTS idx_quotes_workspace_id
ON public.quotes(workspace_id);

CREATE INDEX IF NOT EXISTS idx_employees_workspace_id
ON public.employees(workspace_id);

CREATE INDEX IF NOT EXISTS idx_receipts_workspace_id
ON public.receipts(workspace_id);

-- 檢查是否有 rich_documents 表格
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'rich_documents'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_rich_documents_workspace_id
    ON public.rich_documents(workspace_id);
    RAISE NOTICE 'Created index on rich_documents.workspace_id';
  ELSE
    RAISE NOTICE 'Table rich_documents does not exist, skipping index creation';
  END IF;
END $$;

COMMIT;
