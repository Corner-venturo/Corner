-- ============================================
-- Migration: 移除 company_assets 的 Foreign Key 限制
-- 日期: 2025-11-01
-- 說明: 內部系統，不需要嚴格的外鍵限制
-- ============================================

BEGIN;

-- ============================================
-- 1. 移除 Foreign Key 限制
-- ============================================

ALTER TABLE public.company_assets
DROP CONSTRAINT IF EXISTS company_assets_uploaded_by_fkey;

-- ============================================
-- 2. 驗證
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Foreign Key 限制已移除！';
  RAISE NOTICE '   - uploaded_by 欄位現在可以是任何值';
  RAISE NOTICE '   - 適合內部系統使用';
END $$;

COMMIT;
