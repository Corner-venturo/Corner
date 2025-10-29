-- Migration: 最终修复 - 添加缺失字段并修正 RLS 策略
-- Date: 2025-10-29

BEGIN;

-- ==========================================
-- 1. 修复 suppliers 表 - 添加 note 字段
-- ==========================================

ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS note text DEFAULT '';

COMMENT ON COLUMN public.suppliers.note IS 'Additional notes for supplier';

-- ==========================================
-- 2. 修复 itineraries 表的 RLS 策略
-- ==========================================

-- 删除现有的限制性 RLS 策略（如果存在）
DROP POLICY IF EXISTS "Users can only insert their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can only view their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can only update their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can only delete their own itineraries" ON public.itineraries;

-- 创建宽松的 RLS 策略（允许所有已认证用户操作）
-- 注意：这适合内部系统，如需更严格的权限控制请调整

-- 允许所有已认证用户插入
CREATE POLICY "Authenticated users can insert itineraries"
ON public.itineraries
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 允许所有已认证用户查看
CREATE POLICY "Authenticated users can view itineraries"
ON public.itineraries
FOR SELECT
TO authenticated
USING (true);

-- 允许所有已认证用户更新
CREATE POLICY "Authenticated users can update itineraries"
ON public.itineraries
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 允许所有已认证用户删除
CREATE POLICY "Authenticated users can delete itineraries"
ON public.itineraries
FOR DELETE
TO authenticated
USING (true);

-- ==========================================
-- 3. 同样修复 suppliers 表的 RLS 策略（预防性）
-- ==========================================

-- 删除现有的限制性 RLS 策略
DROP POLICY IF EXISTS "Users can only insert their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can only view their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can only update their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can only delete their own suppliers" ON public.suppliers;

-- 创建宽松的 RLS 策略
CREATE POLICY "Authenticated users can insert suppliers"
ON public.suppliers
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can view suppliers"
ON public.suppliers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update suppliers"
ON public.suppliers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete suppliers"
ON public.suppliers
FOR DELETE
TO authenticated
USING (true);

COMMIT;
