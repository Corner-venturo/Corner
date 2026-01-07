-- Phase 0: 清空供應商資料（將重新建立）
-- 注意：luxury_hotels 和 restaurants 是行程表參考資料，不是供應商，保留不動

BEGIN;

-- 清空 suppliers 表資料
DELETE FROM public.suppliers;

COMMIT;
