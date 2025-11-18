-- Migration: 新增 preferred_features 欄位到 employees 表
-- Purpose: 讓員工自選常用功能，用於個人化 Sidebar 顯示
-- Date: 2025-11-18

BEGIN;

-- 新增 preferred_features 欄位（JSONB 陣列，儲存功能 ID）
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS preferred_features jsonb DEFAULT '[]'::jsonb;

-- 新增欄位註解
COMMENT ON COLUMN public.employees.preferred_features IS '員工個人常用功能列表（用於個人化 Sidebar），例如: ["tours", "orders", "calendar"]';

-- 為現有員工設定預設常用功能（根據角色）
-- super_admin 和 admin 預設顯示所有管理功能
UPDATE public.employees
SET preferred_features = '["tours", "orders", "quotes", "customers", "calendar", "hr"]'::jsonb
WHERE (roles @> ARRAY['super_admin']::text[] OR roles @> ARRAY['admin']::text[])
  AND (preferred_features IS NULL OR preferred_features = '[]'::jsonb);

-- tour_leader 預設顯示旅遊團相關功能
UPDATE public.employees
SET preferred_features = '["tours", "orders", "calendar"]'::jsonb
WHERE roles @> ARRAY['tour_leader']::text[]
  AND (preferred_features IS NULL OR preferred_features = '[]'::jsonb);

-- sales 預設顯示業務相關功能
UPDATE public.employees
SET preferred_features = '["quotes", "customers", "orders", "tours", "calendar"]'::jsonb
WHERE roles @> ARRAY['sales']::text[]
  AND (preferred_features IS NULL OR preferred_features = '[]'::jsonb);

-- accountant 預設顯示財務相關功能
UPDATE public.employees
SET preferred_features = '["finance", "payments", "orders", "tours", "calendar"]'::jsonb
WHERE roles @> ARRAY['accountant']::text[]
  AND (preferred_features IS NULL OR preferred_features = '[]'::jsonb);

-- assistant 預設顯示協助功能
UPDATE public.employees
SET preferred_features = '["orders", "customers", "calendar", "todos"]'::jsonb
WHERE roles @> ARRAY['assistant']::text[]
  AND (preferred_features IS NULL OR preferred_features = '[]'::jsonb);

-- staff 預設顯示基本功能
UPDATE public.employees
SET preferred_features = '["calendar", "todos", "workspace"]'::jsonb
WHERE roles @> ARRAY['staff']::text[]
  AND (preferred_features IS NULL OR preferred_features = '[]'::jsonb);

COMMIT;
