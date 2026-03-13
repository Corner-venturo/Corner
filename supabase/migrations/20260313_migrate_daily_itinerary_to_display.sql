-- ============================================
-- Migration: 遷移 daily_itinerary 資料到 tour_daily_display 表
-- Date: 2026-03-13
-- ============================================

-- 遷移資料（從 itineraries.daily_itinerary JSONB → tour_daily_display 表）
INSERT INTO tour_daily_display (
  tour_id,
  day,
  day_label,
  title,
  highlight,
  description,
  images,
  date,
  workspace_id,
  created_by
)
SELECT 
  i.tour_id,
  (row_number() OVER (PARTITION BY i.tour_id ORDER BY (day_data->>'dayLabel')))::INTEGER as day,
  day_data->>'dayLabel' as day_label,
  day_data->>'title' as title,
  day_data->>'highlight' as highlight,
  day_data->>'description' as description,
  COALESCE(day_data->'images', '[]'::jsonb) as images,
  day_data->>'date' as date,
  i.workspace_id,
  i.created_by
FROM itineraries i
CROSS JOIN LATERAL jsonb_array_elements(i.daily_itinerary) as day_data
WHERE i.daily_itinerary IS NOT NULL 
  AND jsonb_array_length(i.daily_itinerary) > 0
ON CONFLICT (tour_id, day) DO NOTHING;

-- 檢查遷移結果
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  -- 計算 daily_itinerary 的總天數
  SELECT SUM(jsonb_array_length(daily_itinerary))
  INTO old_count
  FROM itineraries
  WHERE daily_itinerary IS NOT NULL;
  
  -- 計算新表的筆數
  SELECT COUNT(*)
  INTO new_count
  FROM tour_daily_display;
  
  -- 輸出結果
  RAISE NOTICE '遷移完成：itineraries.daily_itinerary 總天數 = %, tour_daily_display 筆數 = %', old_count, new_count;
END $$;
