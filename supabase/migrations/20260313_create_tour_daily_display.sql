-- ============================================
-- Migration: 建立 tour_daily_display 表（展示層資料）
-- Date: 2026-03-13
-- Purpose: 取代 itineraries.daily_itinerary JSONB 欄位
-- ============================================

-- 清理舊表和索引（如果存在）
DROP TABLE IF EXISTS tour_daily_display CASCADE;
DROP INDEX IF EXISTS idx_tour_daily_display_tour_id;
DROP INDEX IF EXISTS idx_tour_daily_display_workspace_id;

-- 建立 tour_daily_display 表
CREATE TABLE IF NOT EXISTS public.tour_daily_display (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  day INTEGER NOT NULL, -- 第幾天（1, 2, 3...）
  
  -- 展示層資料（給客戶看的）
  day_label TEXT, -- 例如："Day 1" 或 "第一天"
  title TEXT, -- 當日標題，例如："抵達福岡"
  highlight TEXT, -- 當日亮點，例如："入住天神日航飯店"
  description TEXT, -- 當日詳細說明
  images JSONB DEFAULT '[]', -- 當日圖片 [{url, caption}]
  
  -- 展示設定
  date TEXT, -- 實際日期（如果是開團才有）
  is_hidden BOOLEAN DEFAULT FALSE, -- 是否在手冊中隱藏
  
  -- 系統欄位
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES employees(id),
  
  -- 唯一約束：每個旅遊團的每一天只能有一筆
  CONSTRAINT tour_daily_display_unique UNIQUE (tour_id, day)
);

-- 索引
CREATE INDEX idx_tour_daily_display_tour_id ON tour_daily_display(tour_id);
CREATE INDEX idx_tour_daily_display_workspace_id ON tour_daily_display(workspace_id);

-- RLS
ALTER TABLE tour_daily_display ENABLE ROW LEVEL SECURITY;

-- RLS Policy: 查詢
CREATE POLICY tour_daily_display_select_policy ON tour_daily_display
  FOR SELECT
  USING (
    workspace_id = current_setting('app.current_workspace_id', true)::uuid
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- RLS Policy: 新增
CREATE POLICY tour_daily_display_insert_policy ON tour_daily_display
  FOR INSERT
  WITH CHECK (
    workspace_id = current_setting('app.current_workspace_id', true)::uuid
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- RLS Policy: 更新
CREATE POLICY tour_daily_display_update_policy ON tour_daily_display
  FOR UPDATE
  USING (
    workspace_id = current_setting('app.current_workspace_id', true)::uuid
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- RLS Policy: 刪除
CREATE POLICY tour_daily_display_delete_policy ON tour_daily_display
  FOR DELETE
  USING (
    workspace_id = current_setting('app.current_workspace_id', true)::uuid
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- 註解
COMMENT ON TABLE tour_daily_display IS '旅遊團每日展示資料（取代 itineraries.daily_itinerary）';
COMMENT ON COLUMN tour_daily_display.day_label IS '例如："Day 1" 或 "第一天"';
COMMENT ON COLUMN tour_daily_display.title IS '當日標題，例如："抵達福岡"';
COMMENT ON COLUMN tour_daily_display.highlight IS '當日亮點，例如："入住天神日航飯店"';
COMMENT ON COLUMN tour_daily_display.description IS '當日詳細說明';
COMMENT ON COLUMN tour_daily_display.images IS '當日圖片 JSONB: [{url, caption}]';
