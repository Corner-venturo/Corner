-- =====================================================
-- 新增 bonus 類型到 payment_requests
-- 建立日期：2025-11-17
-- 說明：支援獎金類型的請款單
-- =====================================================

BEGIN;

-- 修改 supplier_type 的 CHECK 約束，加入 'bonus'
ALTER TABLE public.payment_requests
DROP CONSTRAINT IF EXISTS payment_requests_supplier_type_check;

ALTER TABLE public.payment_requests
ADD CONSTRAINT payment_requests_supplier_type_check
CHECK (supplier_type IN ('transportation', 'accommodation', 'meal', 'ticket', 'insurance', 'other', 'bonus'));

COMMENT ON CONSTRAINT payment_requests_supplier_type_check ON public.payment_requests
IS 'bonus 類型用於業務業績和 OP 獎金，不計入成本計算';

COMMIT;
