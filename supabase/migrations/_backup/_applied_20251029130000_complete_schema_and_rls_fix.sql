-- Migration: 彻底修复 suppliers 和 itineraries 表
-- Date: 2025-10-29
-- 目标: 添加所有缺失字段 + 确保 RLS 正确配置

BEGIN;

-- ==========================================
-- 1. 修复 suppliers 表 - 添加 status 字段
-- ==========================================

ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

COMMENT ON COLUMN public.suppliers.status IS 'Supplier status (active, inactive, etc.)';

-- ==========================================
-- 2. 确保 itineraries 表启用 RLS
-- ==========================================

-- 启用 RLS（如果尚未启用）
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- 删除所有现有策略（强制清理）
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'itineraries' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.itineraries';
    END LOOP;
END $$;

-- 创建新的宽松策略（允许所有已认证用户）
CREATE POLICY "allow_authenticated_all"
ON public.itineraries
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ==========================================
-- 3. 同样修复 suppliers 表的 RLS
-- ==========================================

-- 启用 RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 删除所有现有策略
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'suppliers' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.suppliers';
    END LOOP;
END $$;

-- 创建新的宽松策略
CREATE POLICY "allow_authenticated_all"
ON public.suppliers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMIT;
