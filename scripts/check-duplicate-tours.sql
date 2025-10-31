-- 檢查重複的旅遊團資料
-- 依照 code 分組，找出有多筆相同 code 的資料

SELECT
  code,
  COUNT(*) as count,
  array_agg(id ORDER BY created_at) as tour_ids,
  array_agg(created_at ORDER BY created_at) as created_dates
FROM public.tours
GROUP BY code
HAVING COUNT(*) > 1
ORDER BY count DESC, code;
