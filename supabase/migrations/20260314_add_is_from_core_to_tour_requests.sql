-- ============================================
-- 新增 is_from_core 欄位到 tour_requests
-- ============================================
-- 日期：2026-03-14
-- 用途：標記需求單資料來源（核心表 vs 手動輸入）

-- 1. 新增欄位
ALTER TABLE public.tour_requests
ADD COLUMN IF NOT EXISTS is_from_core BOOLEAN DEFAULT false;

-- 2. 建立索引（加速查詢）
CREATE INDEX IF NOT EXISTS idx_tour_requests_is_from_core
ON public.tour_requests(is_from_core);

-- 3. 建立複合索引（tour_id + is_from_core）
CREATE INDEX IF NOT EXISTS idx_tour_requests_tour_from_core
ON public.tour_requests(tour_id, is_from_core);

-- 4. 註解
COMMENT ON COLUMN public.tour_requests.is_from_core IS '資料來源標記：false=手動輸入（舊），true=核心表模式（新）';

-- 5. 回填舊資料（所有現有記錄標記為手動輸入）
UPDATE public.tour_requests
SET is_from_core = false
WHERE is_from_core IS NULL;

-- 6. 設定 NOT NULL 約束（回填後）
ALTER TABLE public.tour_requests
ALTER COLUMN is_from_core SET NOT NULL;
