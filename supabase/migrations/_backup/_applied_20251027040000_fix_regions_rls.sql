-- 修正地區資料的 RLS 政策
-- 允許所有人讀取地區資料（公開資訊）
-- 只有認證用戶可以修改

BEGIN;

-- ============================================
-- 1. 刪除舊的 RLS 政策
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated users to read countries" ON public.countries;
DROP POLICY IF EXISTS "Allow authenticated users to manage countries" ON public.countries;

DROP POLICY IF EXISTS "Allow authenticated users to read regions" ON public.regions;
DROP POLICY IF EXISTS "Allow authenticated users to manage regions" ON public.regions;

DROP POLICY IF EXISTS "Allow authenticated users to read cities" ON public.cities;
DROP POLICY IF EXISTS "Allow authenticated users to manage cities" ON public.cities;

DROP POLICY IF EXISTS "Allow authenticated users to read region_stats" ON public.region_stats;
DROP POLICY IF EXISTS "Allow authenticated users to manage region_stats" ON public.region_stats;

-- ============================================
-- 2. 建立新的 RLS 政策（公開讀取）
-- ============================================

-- Countries: 所有人可讀，認證用戶可寫
CREATE POLICY "Allow public to read countries"
  ON public.countries FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage countries"
  ON public.countries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Regions: 所有人可讀，認證用戶可寫
CREATE POLICY "Allow public to read regions"
  ON public.regions FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage regions"
  ON public.regions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Cities: 所有人可讀，認證用戶可寫
CREATE POLICY "Allow public to read cities"
  ON public.cities FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage cities"
  ON public.cities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Region Stats: 所有人可讀，認證用戶可寫
CREATE POLICY "Allow public to read region_stats"
  ON public.region_stats FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage region_stats"
  ON public.region_stats FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMIT;
